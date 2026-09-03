import { ProcessingSettings, PitchDetectionResult, PitchDetectionCandidate } from "../types";

/**
 * Loads an image from a data URL or path into an HTMLImageElement.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Pre-processes a single frame (resizes, centers, applies silhouette/contrast/edge filters).
 */
export function processImageFrame(
  img: HTMLImageElement,
  width: number,
  height: number,
  settings: ProcessingSettings
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;

  // Background fill white by default
  ctx.fillStyle = settings.filterMode === "inverted" ? "#000000" : "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Compute scale and centering (contain)
  const imgAspect = img.width / img.height;
  const canvasAspect = width / height;
  let drawW = width;
  let drawH = height;
  let drawX = 0;
  let drawY = 0;

  if (settings.autoCenter) {
    if (imgAspect > canvasAspect) {
      drawW = width;
      drawH = width / imgAspect;
      drawY = (height - drawH) / 2;
    } else {
      drawH = height;
      drawW = height * imgAspect;
      drawX = (width - drawW) / 2;
    }
  }

  // Draw scaled image
  ctx.drawImage(img, drawX, drawY, drawW, drawH);

  if (settings.filterMode === "raw") {
    return canvas;
  }

  // Pixel manipulation for contrast and silhouette
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const threshold = settings.threshold;

  if (settings.filterMode === "silhouette") {
    // Pure black silhouette on white background
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = data[i + 3];

      if (alpha < 50) {
        // Transparent is treated as white background
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
      } else {
        // Luminance
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const val = lum < threshold ? 0 : 255;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } else if (settings.filterMode === "inverted") {
    // Pure white subject on black background
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = data[i + 3];

      if (alpha < 50) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 255;
      } else {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const val = lum < threshold ? 255 : 0;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } else if (settings.filterMode === "edges") {
    // Edge detection outline
    const grayscale = new Float32Array(width * height);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      grayscale[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const p = y * width + x;
        // Simple Sobel approximation
        const gx =
          -grayscale[p - width - 1] +
          grayscale[p - width + 1] -
          2 * grayscale[p - 1] +
          2 * grayscale[p + 1] -
          grayscale[p + width - 1] +
          grayscale[p + width + 1];
        const gy =
          -grayscale[p - width - 1] -
          2 * grayscale[p - width] -
          grayscale[p - width + 1] +
          grayscale[p + width - 1] +
          2 * grayscale[p + width] +
          grayscale[p + width + 1];
        const g = Math.sqrt(gx * gx + gy * gy);
        const idx = p * 4;
        const isEdge = g > (threshold / 255) * 150;
        const col = isEdge ? 0 : 255;
        data[idx] = col;
        data[idx + 1] = col;
        data[idx + 2] = col;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } else if (settings.filterMode === "color") {
    // High-contrast color boost
    const factor = (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast));
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
      data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
      data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
    }
    ctx.putImageData(imgData, 0, 0);
  }

  return canvas;
}

/**
 * Interlaces N frames into a single scanimation composite image.
 */
export function createInterlacedComposite(
  processedCanvases: HTMLCanvasElement[],
  slitWidth: number
): HTMLCanvasElement {
  const frameCount = processedCanvases.length;
  if (frameCount === 0) throw new Error("No frames provided for interlacing");

  const width = processedCanvases[0].width;
  const height = processedCanvases[0].height;

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = width;
  outputCanvas.height = height;
  const outCtx = outputCanvas.getContext("2d");
  if (!outCtx) return outputCanvas;

  // Retrieve raw ImageData for all frames
  const frameDataList: ImageData[] = processedCanvases.map((c) => {
    const ctx = c.getContext("2d", { willReadFrequently: true });
    return ctx!.getImageData(0, 0, width, height);
  });

  const outImageData = outCtx.createImageData(width, height);
  const outData = outImageData.data;

  // For each column x, choose frame = Math.floor(x / slitWidth) % frameCount
  for (let x = 0; x < width; x++) {
    const frameIndex = Math.floor(x / slitWidth) % frameCount;
    const sourceData = frameDataList[frameIndex].data;

    for (let y = 0; y < height; y++) {
      const pixelIndex = (y * width + x) * 4;
      outData[pixelIndex] = sourceData[pixelIndex]; // R
      outData[pixelIndex + 1] = sourceData[pixelIndex + 1]; // G
      outData[pixelIndex + 2] = sourceData[pixelIndex + 2]; // B
      outData[pixelIndex + 3] = sourceData[pixelIndex + 3]; // A
    }
  }

  outCtx.putImageData(outImageData, 0, 0);
  return outputCanvas;
}

/**
 * Fast, pixel-perfect renderer that draws the interlaced base and overlays the optical barrier sheet
 * with 100% mathematical precision on a canvas context. Eliminates CSS Moiré and subpixel scaling errors.
 */
export function renderScanimationToContext(
  ctx: CanvasRenderingContext2D,
  compositeCanvas: HTMLCanvasElement,
  sheetOffset: number,
  slitWidth: number,
  frameCount: number = 5,
  options: {
    isLifted?: boolean;
    barrierOpacity?: number; // 0.0 to 1.0
    sheetColor?: string; // default "#060912"
    drawAcrylicSheen?: boolean;
  } = {}
) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // 1. Draw composite image
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(compositeCanvas, 0, 0, width, height);

  // If sheet is lifted, show raw interlaced lines only
  if (options.isLifted) return;

  const period = frameCount * slitWidth;
  const barrierWidth = (frameCount - 1) * slitWidth;
  const opacity = options.barrierOpacity ?? 1.0;

  // 2. Draw optical black barrier bars
  ctx.fillStyle = options.sheetColor || `rgba(6, 9, 18, ${opacity})`;

  // Calculate starting X such that slits are at: [offset + k*period, offset + k*period + slitWidth)
  // Barriers are at: [offset + k*period + slitWidth, offset + (k+1)*period)
  const normalizedOffset = ((sheetOffset % period) + period) % period;
  const startX = normalizedOffset - period * 2;

  ctx.beginPath();
  for (let x = startX; x < width + period * 2; x += period) {
    const barX = x + slitWidth;
    ctx.rect(barX, 0, barrierWidth, height);
  }
  ctx.fill();

  // 3. Subtle tactile acrylic sheen (clear transparency highlight)
  if (options.drawAcrylicSheen) {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "rgba(255, 255, 255, 0.06)");
    grad.addColorStop(0.3, "rgba(255, 255, 255, 0.0)");
    grad.addColorStop(0.6, "rgba(255, 255, 255, 0.08)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0.02)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }
}

/**
 * Creates the optical barrier grating sheet ("black and transparent white sheet").
 * For N frames and slit width s:
 * Period P = N * s.
 * Slit: width s (transparent alpha = 0 or tinted transparent white)
 * Barrier: width (N - 1) * s (opaque black #000000)
 */
export function createGratingSheet(
  width: number,
  height: number,
  frameCount: number = 5,
  slitWidth: number = 2,
  options: {
    translucentTint?: boolean; // add subtle glassy shimmer to transparent slits
    extraWidth?: number; // allow seamless sliding
  } = {}
): HTMLCanvasElement {
  const extra = options.extraWidth || 0;
  const totalWidth = width + extra;
  const canvas = document.createElement("canvas");
  canvas.width = totalWidth;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const period = frameCount * slitWidth;
  const barrierWidth = (frameCount - 1) * slitWidth;

  const imgData = ctx.createImageData(totalWidth, height);
  const data = imgData.data;

  for (let x = 0; x < totalWidth; x++) {
    const posInPeriod = x % period;
    // Transparent slit: posInPeriod < slitWidth
    const isSlit = posInPeriod < slitWidth;

    for (let y = 0; y < height; y++) {
      const idx = (y * totalWidth + x) * 4;
      if (isSlit) {
        if (options.translucentTint) {
          // Subtle frosty white tint (10% opacity) so user sees the physical clear film
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 255;
          data[idx + 3] = 20; // very subtle
        } else {
          // 100% transparent slit
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = 0;
        }
      } else {
        // Opaque solid black barrier
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 255;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Generates a ready-to-print DIY Scanimation Kit as a single high-resolution sheet.
 * Includes:
 * 1. Base interlaced art with alignment registration marks (+)
 * 2. Grating overlay sheet with matching registration marks (+) and cut guidelines
 * 3. Step-by-step physical crafting instructions.
 */
export function generatePrintableKit(
  compositeCanvas: HTMLCanvasElement,
  gratingCanvas: HTMLCanvasElement,
  slitWidth: number,
  frameCount: number = 5
): HTMLCanvasElement {
  const printCanvas = document.createElement("canvas");
  // A4 ratio @ 300dpi approximation
  const printW = 1600;
  const printH = 2200;
  printCanvas.width = printW;
  printCanvas.height = printH;
  const ctx = printCanvas.getContext("2d");
  if (!ctx) return printCanvas;

  // Clean paper background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, printW, printH);

  // Header
  ctx.fillStyle = "#111827";
  ctx.font = "bold 44px 'Space Grotesk', sans-serif";
  ctx.fillText("SCANIMATION DIY PRINT & CRAFT KIT", 80, 100);

  ctx.font = "500 20px 'Work Sans', sans-serif";
  ctx.fillStyle = "#4b5563";
  ctx.fillText(
    `5-Frame Barrier-Grid Optical Illusion • Slit Width: ${slitWidth}px • Period: ${
      frameCount * slitWidth
    }px`,
    80,
    140
  );

  // Section 1: Base Art
  ctx.font = "bold 24px 'Space Grotesk', sans-serif";
  ctx.fillStyle = "#1f2937";
  ctx.fillText("1. BASE ART (Print on White Cardstock)", 80, 210);

  const artSize = 640;
  const artX = 80;
  const artY = 240;

  // Draw border & registration marks
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 2;
  ctx.strokeRect(artX, artY, artSize, artSize);

  // Draw composite art
  ctx.drawImage(compositeCanvas, artX, artY, artSize, artSize);

  // Registration crosshairs
  drawCrosshair(ctx, artX - 20, artY - 20);
  drawCrosshair(ctx, artX + artSize + 20, artY - 20);
  drawCrosshair(ctx, artX - 20, artY + artSize + 20);
  drawCrosshair(ctx, artX + artSize + 20, artY + artSize + 20);

  // Section 2: Transparent Grating Overlay
  ctx.font = "bold 24px 'Space Grotesk', sans-serif";
  ctx.fillStyle = "#1f2937";
  ctx.fillText("2. BARRIER SHEET (Print on Transparent Overhead Acetate Film)", 840, 210);

  const gratingX = 840;
  const gratingY = 240;

  // Border & background for grating preview on paper
  ctx.fillStyle = "#f3f4f6";
  ctx.fillRect(gratingX, gratingY, artSize, artSize);
  ctx.strokeRect(gratingX, gratingY, artSize, artSize);

  ctx.drawImage(gratingCanvas, 0, 0, compositeCanvas.width, compositeCanvas.height, gratingX, gratingY, artSize, artSize);

  drawCrosshair(ctx, gratingX - 20, gratingY - 20);
  drawCrosshair(ctx, gratingX + artSize + 20, gratingY - 20);
  drawCrosshair(ctx, gratingX - 20, gratingY + artSize + 20);
  drawCrosshair(ctx, gratingX + artSize + 20, gratingY + artSize + 20);

  // Section 3: Instructions Box
  const infoY = 960;
  ctx.fillStyle = "#f9fafb";
  ctx.fillRect(80, infoY, printW - 160, 480);
  ctx.strokeStyle = "#d1d5db";
  ctx.strokeRect(80, infoY, printW - 160, 480);

  ctx.font = "bold 28px 'Space Grotesk', sans-serif";
  ctx.fillStyle = "#111827";
  ctx.fillText("HOW TO ASSEMBLE YOUR OPTICAL SCANIMATION:", 120, infoY + 60);

  ctx.font = "400 20px 'Work Sans', sans-serif";
  ctx.fillStyle = "#374151";

  const instructions = [
    "Step 1: Print Section 1 (Base Art) on standard opaque white paper or heavy cardstock.",
    "Step 2: Print Section 2 (Barrier Sheet) on transparent acetate film (e.g. overhead projector transparency paper).",
    "Step 3: Carefully cut out the transparent barrier sheet along the dotted border lines.",
    "Step 4: Place the transparent barrier sheet directly on top of the base art.",
    "Step 5: Slowly slide the transparent sheet horizontally from left to right — watch the static lines magically burst into fluid life!",
  ];

  instructions.forEach((line, i) => {
    ctx.fillText(line, 120, infoY + 120 + i * 42);
  });

  return printCanvas;
}

function drawCrosshair(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 10, y);
  ctx.lineTo(x + 10, y);
  ctx.moveTo(x, y - 10);
  ctx.lineTo(x, y + 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * Creates a crisp HTMLCanvasElement from an HTMLImageElement without smoothing artifacts,
 * ensuring optical barrier lines are preserved at pixel precision.
 */
export function imageToCanvas(img: HTMLImageElement, maxSize = 800): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  let w = img.naturalWidth || img.width;
  let h = img.naturalHeight || img.height;
  if (w > maxSize || h > maxSize) {
    const scale = Math.min(maxSize / w, maxSize / h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, w, h);
  }
  return canvas;
}

/**
 * De-interlaces an already-scanimated composite image into N sequential motion frames.
 * Reconstructs each frame by reading the column slice belonging to phase k in each period P = frameCount * slitWidth,
 * and horizontally expanding it to fill the period.
 */
export function deinterlaceScanimationComposite(
  compositeCanvas: HTMLCanvasElement,
  slitWidth: number,
  frameCount: number = 5
): HTMLCanvasElement[] {
  const width = compositeCanvas.width;
  const height = compositeCanvas.height;
  const period = frameCount * slitWidth;

  const srcCtx = compositeCanvas.getContext("2d", { willReadFrequently: true });
  if (!srcCtx) return [];
  const srcData = srcCtx.getImageData(0, 0, width, height).data;

  const extractedCanvases: HTMLCanvasElement[] = [];

  for (let k = 0; k < frameCount; k++) {
    const frameCanvas = document.createElement("canvas");
    frameCanvas.width = width;
    frameCanvas.height = height;
    const fCtx = frameCanvas.getContext("2d");
    if (!fCtx) continue;

    const fImgData = fCtx.createImageData(width, height);
    const fData = fImgData.data;

    // Frame k's optical columns in each period are at [p * period + k * slitWidth, p * period + (k+1) * slitWidth)
    for (let x = 0; x < width; x++) {
      const periodIdx = Math.floor(x / period);
      const subPeriodOffset = x % period;
      // Map to frame k's column in this period using normalized sub-period ratio
      const slitOffset = (subPeriodOffset / period) * slitWidth;
      const srcX = Math.min(
        width - 1,
        Math.max(0, Math.round(periodIdx * period + k * slitWidth + slitOffset))
      );

      for (let y = 0; y < height; y++) {
        const srcIdx = (y * width + srcX) * 4;
        const destIdx = (y * width + x) * 4;
        fData[destIdx] = srcData[srcIdx];
        fData[destIdx + 1] = srcData[srcIdx + 1];
        fData[destIdx + 2] = srcData[srcIdx + 2];
        fData[destIdx + 3] = srcData[srcIdx + 3];
      }
    }

    fCtx.putImageData(fImgData, 0, 0);
    extractedCanvases.push(frameCanvas);
  }

  return extractedCanvases;
}

/**
 * Automatically analyzes an interlaced / scanimated picture and determines the optical pitch / slit width.
 * Uses 1D column-wise luminance and edge profile autocorrelation with parabolic sub-pixel peak interpolation.
 */
export function detectScanimationPitch(
  compositeCanvas: HTMLCanvasElement,
  targetFrameCount: number = 5
): PitchDetectionResult {
  const width = compositeCanvas.width;
  const height = compositeCanvas.height;
  const ctx = compositeCanvas.getContext("2d", { willReadFrequently: true });

  const defaultPeriod = targetFrameCount * 3;
  if (!ctx || width < 20 || height < 20) {
    return {
      bestSlitWidth: 3,
      bestPeriod: defaultPeriod,
      confidence: 50,
      candidates: [
        { period: defaultPeriod, slitWidth: 3, frameCount: targetFrameCount, confidence: 50, score: 0.5 },
      ],
    };
  }

  const imgData = ctx.getImageData(0, 0, width, height).data;

  // Sample rows across vertical range 15% to 85% to avoid borders/text/margins
  const yStart = Math.floor(height * 0.15);
  const yEnd = Math.floor(height * 0.85);
  const sampleRows = Math.max(1, yEnd - yStart);

  // 1. Calculate column average luminance & gradient
  const colLuminance = new Float64Array(width);
  const colGradient = new Float64Array(width);

  for (let x = 0; x < width; x++) {
    let sumLum = 0;
    let sumGrad = 0;
    for (let y = yStart; y < yEnd; y++) {
      const idx = (y * width + x) * 4;
      const lum = 0.299 * imgData[idx] + 0.587 * imgData[idx + 1] + 0.114 * imgData[idx + 2];
      sumLum += lum;

      if (x > 0) {
        const prevIdx = (y * width + (x - 1)) * 4;
        const prevLum = 0.299 * imgData[prevIdx] + 0.587 * imgData[prevIdx + 1] + 0.114 * imgData[prevIdx + 2];
        sumGrad += Math.abs(lum - prevLum);
      }
    }
    colLuminance[x] = sumLum / sampleRows;
    colGradient[x] = sumGrad / sampleRows;
  }

  // 2. High-pass filter / detrend signal to remove slow lighting shifts
  const windowHalf = 20;
  const detrended = new Float64Array(width);
  let meanVal = 0;
  for (let x = 0; x < width; x++) {
    let localSum = 0;
    let localCount = 0;
    const x0 = Math.max(0, x - windowHalf);
    const x1 = Math.min(width - 1, x + windowHalf);
    for (let k = x0; k <= x1; k++) {
      localSum += colLuminance[k];
      localCount++;
    }
    const localMean = localSum / localCount;
    detrended[x] = colLuminance[x] - localMean;
    meanVal += detrended[x];
  }
  meanVal /= width;

  // Detrended variance
  let variance = 0;
  for (let x = 0; x < width; x++) {
    detrended[x] -= meanVal;
    variance += detrended[x] * detrended[x];
  }
  variance /= width;

  // If very low variance (e.g. nearly blank image), fallback
  if (variance < 0.5) {
    return {
      bestSlitWidth: 3,
      bestPeriod: targetFrameCount * 3,
      confidence: 30,
      candidates: [
        { period: targetFrameCount * 3, slitWidth: 3, frameCount: targetFrameCount, confidence: 30, score: 0.3 },
      ],
    };
  }

  // Normalize detrended luminance
  const std = Math.sqrt(variance);
  for (let x = 0; x < width; x++) {
    detrended[x] /= std;
  }

  // 3. Autocorrelation: Lag range from 2px up to min(140, width / 2)
  const maxLag = Math.min(140, Math.floor(width / 2));
  const minLag = 2;
  const autocorr = new Float64Array(maxLag + 1);

  for (let tau = 0; tau <= maxLag; tau++) {
    let sum = 0;
    const nSamples = width - tau;
    for (let x = 0; x < nSamples; x++) {
      sum += detrended[x] * detrended[x + tau];
    }
    autocorr[tau] = sum / nSamples;
  }

  // Normalize by autocorr[0]
  const r0 = autocorr[0] || 1;
  for (let tau = 0; tau <= maxLag; tau++) {
    autocorr[tau] /= r0;
  }

  // Also calculate gradient autocorrelation to detect sharp slit transitions
  const gradAutocorr = new Float64Array(maxLag + 1);
  let gradMean = 0;
  for (let x = 0; x < width; x++) gradMean += colGradient[x];
  gradMean /= width;
  const detrendedGrad = new Float64Array(width);
  let gradVar = 0;
  for (let x = 0; x < width; x++) {
    detrendedGrad[x] = colGradient[x] - gradMean;
    gradVar += detrendedGrad[x] * detrendedGrad[x];
  }
  const gradStd = Math.sqrt(gradVar / width) || 1;
  for (let x = 0; x < width; x++) detrendedGrad[x] /= gradStd;

  for (let tau = 0; tau <= maxLag; tau++) {
    let sum = 0;
    const nSamples = width - tau;
    for (let x = 0; x < nSamples; x++) {
      sum += detrendedGrad[x] * detrendedGrad[x + tau];
    }
    gradAutocorr[tau] = sum / nSamples;
  }
  const gradR0 = gradAutocorr[0] || 1;
  for (let tau = 0; tau <= maxLag; tau++) {
    gradAutocorr[tau] /= gradR0;
  }

  // Combined score signal
  const combinedR = new Float64Array(maxLag + 1);
  for (let tau = 0; tau <= maxLag; tau++) {
    combinedR[tau] = 0.65 * autocorr[tau] + 0.35 * gradAutocorr[tau];
  }

  // 4. Find local peaks
  interface RawPeak {
    integerLag: number;
    subpixelLag: number;
    peakVal: number;
    prominence: number;
  }
  const peaks: RawPeak[] = [];

  for (let tau = minLag; tau < maxLag - 1; tau++) {
    if (combinedR[tau] > combinedR[tau - 1] && combinedR[tau] > combinedR[tau + 1]) {
      // Valley depths on left and right
      let leftValley = combinedR[tau];
      for (let k = Math.max(minLag, tau - 6); k < tau; k++) {
        if (combinedR[k] < leftValley) leftValley = combinedR[k];
      }
      let rightValley = combinedR[tau];
      for (let k = tau + 1; k <= Math.min(maxLag, tau + 6); k++) {
        if (combinedR[k] < rightValley) rightValley = combinedR[k];
      }
      const prominence = combinedR[tau] - Math.max(leftValley, rightValley);

      // Sub-pixel parabolic interpolation
      const a = combinedR[tau - 1];
      const b = combinedR[tau];
      const c = combinedR[tau + 1];
      const denom = 2 * (a - 2 * b + c);
      let subpixelLag = tau;
      let peakVal = b;

      if (Math.abs(denom) > 1e-6) {
        const delta = (a - c) / denom;
        if (Math.abs(delta) < 1) {
          subpixelLag = tau + delta;
          peakVal = b - ((a - c) * (a - c)) / (8 * (a - 2 * b + c));
        }
      }

      if (peakVal > 0.04 && prominence > 0.02) {
        peaks.push({ integerLag: tau, subpixelLag, peakVal, prominence });
      }
    }
  }

  // 5. Evaluate candidate periods
  const candidateMap = new Map<number, PitchDetectionCandidate>();

  const addCandidate = (period: number, baseScore: number, frameCount = targetFrameCount) => {
    if (period < 3 || period > maxLag) return;
    const slitWidth = Math.round((period / frameCount) * 100) / 100;
    if (slitWidth < 0.5 || slitWidth > 25) return;

    // Check harmonic support at 2 * period
    const round2P = Math.round(period * 2);
    let harmonicBonus = 0;
    if (round2P <= maxLag && combinedR[round2P] > 0.1) {
      harmonicBonus += 0.25 * combinedR[round2P];
    }

    const totalScore = baseScore + harmonicBonus;
    const key = Math.round(period * 10);

    const existing = candidateMap.get(key);
    if (!existing || totalScore > existing.score) {
      const confidence = Math.min(99, Math.max(25, Math.round(totalScore * 85)));
      candidateMap.set(key, {
        period: Math.round(period * 100) / 100,
        slitWidth,
        frameCount,
        confidence,
        score: totalScore,
      });
    }
  };

  // Evaluate each peak
  for (const peak of peaks) {
    // Peak as the full grating period P
    const baseScore = peak.peakVal * 0.7 + peak.prominence * 0.3;
    addCandidate(peak.subpixelLag, baseScore, targetFrameCount);

    // Also consider peak as single slit width: P = subpixelLag * targetFrameCount
    const potentialPeriod = peak.subpixelLag * targetFrameCount;
    if (potentialPeriod <= maxLag) {
      addCandidate(potentialPeriod, baseScore * 0.65, targetFrameCount);
    }
  }

  // Sort candidates by score descending
  const sortedCandidates = Array.from(candidateMap.values()).sort((a, b) => b.score - a.score);

  // If no good candidate found, fallback to 3px
  if (sortedCandidates.length === 0) {
    return {
      bestSlitWidth: 3,
      bestPeriod: defaultPeriod,
      confidence: 45,
      candidates: [
        { period: defaultPeriod, slitWidth: 3, frameCount: targetFrameCount, confidence: 45, score: 0.45 },
        { period: targetFrameCount * 2, slitWidth: 2, frameCount: targetFrameCount, confidence: 40, score: 0.4 },
        { period: targetFrameCount * 4, slitWidth: 4, frameCount: targetFrameCount, confidence: 35, score: 0.35 },
      ],
    };
  }

  const best = sortedCandidates[0];
  const candidates = sortedCandidates.slice(0, 4);

  // Sample autocorrelation profile points for UI waveform visualizer
  const profileSample: { lag: number; val: number }[] = [];
  const step = Math.max(1, Math.floor(maxLag / 40));
  for (let lag = minLag; lag <= maxLag; lag += step) {
    profileSample.push({ lag, val: Math.max(0, Math.min(1, combinedR[lag])) });
  }

  return {
    bestSlitWidth: best.slitWidth,
    bestPeriod: best.period,
    confidence: best.confidence,
    candidates,
    autocorrelationProfile: profileSample,
  };
}
