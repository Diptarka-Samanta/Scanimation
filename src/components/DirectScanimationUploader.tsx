import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Upload,
  Sparkles,
  Sliders,
  Image as ImageIcon,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  Eye,
  Film,
  ArrowRight,
  Info,
  Maximize2,
  RotateCcw,
  Minus,
  Plus,
  Activity,
  Zap,
  ZoomIn,
  BookmarkPlus,
} from "lucide-react";
import { FrameItem, ProcessingSettings, PitchDetectionResult, PitchDetectionCandidate } from "../types";
import {
  loadImage,
  imageToCanvas,
  deinterlaceScanimationComposite,
  createGratingSheet,
  generatePrintableKit,
  processImageFrame,
  createInterlacedComposite,
  detectScanimationPitch,
} from "../utils/scanimationEngine";
import { PRESET_ANIMATIONS } from "../utils/presets";

interface DirectScanimationUploaderProps {
  onCompositeLoaded: (
    canvas: HTMLCanvasElement,
    gratingCanvas: HTMLCanvasElement,
    extractedFrames: FrameItem[],
    slitWidth: number,
    frameCount: number,
    name: string
  ) => void;
  onSendToFrameEditor: (frames: FrameItem[], slitWidth: number) => void;
  currentCompositeCanvas: HTMLCanvasElement | null;
  settings: ProcessingSettings;
  onUpdateSlitWidth: (newWidth: number) => void;
  onSaveUploadToStation?: (
    name: string,
    canvas: HTMLCanvasElement,
    gratingCanvas: HTMLCanvasElement,
    frames: FrameItem[],
    slitWidth: number,
    frameCount: number
  ) => void;
}

export const DirectScanimationUploader: React.FC<DirectScanimationUploaderProps> = ({
  onCompositeLoaded,
  onSendToFrameEditor,
  currentCompositeCanvas,
  settings,
  onUpdateSlitWidth,
  onSaveUploadToStation,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImageName, setUploadedImageName] = useState<string | null>(null);
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [compositeCanvasState, setCompositeCanvasState] = useState<HTMLCanvasElement | null>(null);

  // Optical pitch calibration settings for this specific image
  const [slitWidth, setSlitWidth] = useState<number>(settings.slitWidth || 3);
  const [frameCount, setFrameCount] = useState<number>(5);
  const [extractedFrames, setExtractedFrames] = useState<FrameItem[]>([]);
  const [activeExtractedIndex, setActiveExtractedIndex] = useState<number>(0);

  // Auto-detection results state
  const [detectionResult, setDetectionResult] = useState<PitchDetectionResult | null>(null);
  const [autoDetectedSlit, setAutoDetectedSlit] = useState<number | null>(null);
  const [loupeOffset, setLoupeOffset] = useState<number>(0);

  // Process a loaded image URL
  const processScanimatedImage = async (
    dataUrl: string,
    name: string,
    targetSlitWidth?: number,
    targetFrameCount = frameCount,
    forceAutoDetect = false
  ) => {
    setIsProcessing(true);
    try {
      const img = await loadImage(dataUrl);
      setImageDimensions({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
      setUploadedDataUrl(dataUrl);
      setUploadedImageName(name);

      // Convert image to a canvas without subpixel blurring
      const compositeCanvas = imageToCanvas(img, 800);
      setCompositeCanvasState(compositeCanvas);

      // Run automatic optical pitch / slit width detection
      let appliedSlitWidth = targetSlitWidth;
      let detection = detectionResult;

      if (forceAutoDetect || appliedSlitWidth === undefined || !detection) {
        detection = detectScanimationPitch(compositeCanvas, targetFrameCount);
        setDetectionResult(detection);
        appliedSlitWidth = detection.bestSlitWidth;
        setAutoDetectedSlit(detection.bestSlitWidth);
      }

      appliedSlitWidth = Math.max(0.5, Math.min(25, Number(appliedSlitWidth.toFixed(2))));
      setSlitWidth(appliedSlitWidth);
      onUpdateSlitWidth(appliedSlitWidth);

      // Extract de-interlaced sequential motion frames with the detected pitch
      const extractedCanvases = deinterlaceScanimationComposite(
        compositeCanvas,
        appliedSlitWidth,
        targetFrameCount
      );

      const frames: FrameItem[] = extractedCanvases.map((c, idx) => ({
        id: `extracted-${Date.now()}-${idx}`,
        name: `${name} — Phase ${idx + 1}`,
        dataUrl: c.toDataURL("image/png"),
        source: "upload",
      }));

      setExtractedFrames(frames);

      // Create matching optical grating sheet
      const grating = createGratingSheet(
        compositeCanvas.width,
        compositeCanvas.height,
        targetFrameCount,
        appliedSlitWidth,
        { translucentTint: true }
      );

      onCompositeLoaded(compositeCanvas, grating, frames, appliedSlitWidth, targetFrameCount, name);
    } catch (err) {
      console.error("Failed to process scanimated picture:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        // On new file, force auto-detection of the optical pitch!
        processScanimatedImage(dataUrl, file.name, undefined, frameCount, true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          // On new dropped file, force auto-detection!
          processScanimatedImage(dataUrl, file.name, undefined, frameCount, true);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // User manually or via candidates alters the slit width
  const handlePitchChange = (newWidth: number, newFrameCount = frameCount) => {
    const clamped = Math.max(0.5, Math.min(25, Number(newWidth.toFixed(2))));
    setSlitWidth(clamped);
    setFrameCount(newFrameCount);
    onUpdateSlitWidth(clamped);

    if (compositeCanvasState && uploadedImageName) {
      // Re-generate grating and extracted frames for this pitch
      const extractedCanvases = deinterlaceScanimationComposite(
        compositeCanvasState,
        clamped,
        newFrameCount
      );
      const frames: FrameItem[] = extractedCanvases.map((c, idx) => ({
        id: `extracted-${Date.now()}-${idx}`,
        name: `${uploadedImageName} — Phase ${idx + 1}`,
        dataUrl: c.toDataURL("image/png"),
        source: "upload",
      }));
      setExtractedFrames(frames);

      const grating = createGratingSheet(
        compositeCanvasState.width,
        compositeCanvasState.height,
        newFrameCount,
        clamped,
        { translucentTint: true }
      );
      onCompositeLoaded(compositeCanvasState, grating, frames, clamped, newFrameCount, uploadedImageName);
    }
  };

  // Re-run the auto-detection algorithm on current canvas
  const handleReRunAutoDetection = () => {
    if (!compositeCanvasState) return;
    setIsProcessing(true);
    setTimeout(() => {
      const detection = detectScanimationPitch(compositeCanvasState, frameCount);
      setDetectionResult(detection);
      setAutoDetectedSlit(detection.bestSlitWidth);
      handlePitchChange(detection.bestSlitWidth, frameCount);
      setIsProcessing(false);
    }, 50);
  };

  // Load a pre-compiled sample scanimated picture
  const loadSamplePreset = async (presetId: string) => {
    const preset = PRESET_ANIMATIONS.find((p) => p.id === presetId);
    if (!preset) return;

    setIsProcessing(true);
    try {
      const urls = preset.generateFrames();
      const loaded = await Promise.all(urls.map((u) => loadImage(u)));
      const processed = loaded.map((img) =>
        processImageFrame(img, 600, 600, {
          filterMode: "silhouette",
          threshold: 128,
          contrast: 50,
          slitWidth: 3,
          autoCenter: true,
        })
      );
      const composite = createInterlacedComposite(processed, 3);
      const dataUrl = composite.toDataURL("image/png");
      await processScanimatedImage(dataUrl, `${preset.title} (Scanimated Composite)`, 3, 5, true);
    } catch (err) {
      console.error("Failed to load sample:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Render the real-time Optical Alignment Loupe
  const drawLoupe = useCallback(() => {
    const canvas = loupeCanvasRef.current;
    if (!canvas || !compositeCanvasState) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Magnified view of middle row
    const srcY = Math.floor(compositeCanvasState.height * 0.5) - 20;
    const srcH = 40;
    const zoomFactor = 2.5;
    const sampleWidth = Math.floor(w / zoomFactor);
    const srcX = Math.floor(compositeCanvasState.width * 0.25);

    // Draw magnified image slice
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      compositeCanvasState,
      srcX,
      srcY,
      sampleWidth,
      srcH,
      0,
      0,
      w,
      h
    );

    // Overlay barrier grid
    const period = frameCount * slitWidth * zoomFactor;
    const barrierWidth = (frameCount - 1) * slitWidth * zoomFactor;
    const slitScreenW = slitWidth * zoomFactor;
    const startX = (loupeOffset % period) - period * 2;

    ctx.fillStyle = "rgba(6, 9, 18, 0.88)";
    for (let x = startX; x < w + period * 2; x += period) {
      ctx.fillRect(x + slitScreenW, 0, barrierWidth, h);
    }

    // Draw alignment guide lines along the top edge
    ctx.fillStyle = "#38bdf8";
    for (let x = startX; x < w + period * 2; x += period) {
      ctx.fillRect(x, 0, slitScreenW, 4);
    }
  }, [compositeCanvasState, frameCount, slitWidth, loupeOffset]);

  useEffect(() => {
    drawLoupe();
  }, [drawLoupe]);

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center justify-center border border-sky-500/30">
              ⚡
            </span>
            <h2 className="text-lg font-bold font-['Space_Grotesk'] text-white">
              Direct Scanimation Picture Importer &amp; Optical Decoder
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono border border-sky-500/30">
              Auto-Pitch Detection
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Upload an existing barrier-grid / scanimated composite image. Our engine automatically analyzes the vertical frequency, picks the exact slit width slider value, and decodes the hidden motion phases.
          </p>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 mr-1 font-medium hidden lg:inline">Test Sample:</span>
          {[
            { id: "galloping-horse", title: "Galloping Stallion" },
            { id: "spinning-star", title: "Hypnotic Star" },
            { id: "flapping-bird", title: "Soaring Eagle" },
          ].map((sample) => (
            <button
              key={sample.id}
              onClick={() => loadSamplePreset(sample.id)}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 hover:border-slate-600 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>{sample.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Drag and Drop Upload Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        className={`mt-4 relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
          isDragging
            ? "border-sky-400 bg-sky-500/10 text-sky-300"
            : "border-slate-700/80 hover:border-slate-600 bg-slate-950/40"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-inner">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-slate-200">
                {uploadedImageName ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Loaded: {uploadedImageName}</span>
                  </span>
                ) : (
                  "Drag & drop any scanimated picture here"
                )}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {imageDimensions
                  ? `Resolution: ${imageDimensions.width} × ${imageDimensions.height} px • Pitch automatically detected`
                  : "Supports PNG, JPG, WebP, SVG. Single interlaced scanimation or barrier-grid art."}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {compositeCanvasState && onSaveUploadToStation && (
              <button
                type="button"
                onClick={() => {
                  const grating = createGratingSheet(
                    compositeCanvasState.width,
                    compositeCanvasState.height,
                    frameCount,
                    slitWidth,
                    { translucentTint: true }
                  );
                  onSaveUploadToStation(
                    uploadedImageName || "Uploaded Scanimation",
                    compositeCanvasState,
                    grating,
                    extractedFrames,
                    slitWidth,
                    frameCount
                  );
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
                title="Save this uploaded scanimation to your Save Station"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save Upload to Station</span>
                <span className="sm:hidden">Save</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Choose Scanimated Image</span>
            </button>
          </div>
        </div>
      </div>

      {/* Auto-Detection Status Banner */}
      {detectionResult && (
        <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-sky-950/70 via-slate-900 to-emerald-950/50 border border-sky-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0">
              <Zap className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-sky-200">
                  Auto-Picked Slit Width:
                </span>
                <span className="text-sm font-extrabold font-mono text-white bg-sky-500/20 px-2 py-0.5 rounded border border-sky-400/40">
                  {detectionResult.bestSlitWidth.toFixed(2)} px
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  (Grating Period: {detectionResult.bestPeriod.toFixed(1)} px)
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono border ${
                    detectionResult.confidence >= 70
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  }`}
                >
                  {detectionResult.confidence}% Optical Confidence
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                The optical barrier frequency was calculated via autocorrelation of the vertical line columns.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleReRunAutoDetection}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer hover:text-white"
              title="Re-analyze the image columns to calculate the slit width"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`} />
              <span>Re-Scan Pitch</span>
            </button>
          </div>
        </div>
      )}

      {/* Optical Pitch Calibration & High-Precision Slider ("Width Slide") */}
      <div className="mt-4 p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-4 text-xs">
        {/* Top: Slit Width Slider + Nudgers + Candidate Picks */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Main Continuous Slider & Micro-Steppers */}
          <div className="lg:col-span-8 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                <span>Accurate Slit Width Slide (Pitch Calibrator):</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Exact Value:</span>
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg overflow-hidden px-1.5 py-0.5">
                  <input
                    type="number"
                    min="0.5"
                    max="25"
                    step="0.05"
                    value={slitWidth}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0) handlePitchChange(val);
                    }}
                    className="w-16 bg-transparent text-right font-mono font-bold text-sky-400 text-xs outline-none"
                  />
                  <span className="text-[10px] text-slate-500 ml-1 font-mono">px</span>
                </div>
              </div>
            </div>

            {/* Continuous High-Precision Slider */}
            <div className="space-y-1">
              <input
                id="slit-width-continuous-slider"
                type="range"
                min="0.5"
                max="15"
                step="0.05"
                value={slitWidth}
                onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400 hover:accent-sky-300"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.5 px (Micro)</span>
                <span>3.0 px (Standard)</span>
                <span>6.0 px (Coarse)</span>
                <span>10.0 px (Wide)</span>
                <span>15.0 px</span>
              </div>
            </div>

            {/* Stepper Buttons for Tactical Micro-Tuning */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-slate-400 mr-1 font-medium">Micro-Nudge:</span>
              <button
                type="button"
                onClick={() => handlePitchChange(slitWidth - 1.0)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-mono transition cursor-pointer"
                title="Subtract 1.0 px"
              >
                -1.0
              </button>
              <button
                type="button"
                onClick={() => handlePitchChange(slitWidth - 0.1)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-mono transition cursor-pointer"
                title="Subtract 0.1 px"
              >
                -0.10
              </button>
              <button
                type="button"
                onClick={() => handlePitchChange(slitWidth - 0.02)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-mono transition cursor-pointer"
                title="Subtract 0.02 px"
              >
                -0.02
              </button>

              <div className="h-4 w-px bg-slate-800 mx-1" />

              <button
                type="button"
                onClick={() => handlePitchChange(slitWidth + 0.02)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-mono transition cursor-pointer"
                title="Add 0.02 px"
              >
                +0.02
              </button>
              <button
                type="button"
                onClick={() => handlePitchChange(slitWidth + 0.1)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-mono transition cursor-pointer"
                title="Add 0.1 px"
              >
                +0.10
              </button>
              <button
                type="button"
                onClick={() => handlePitchChange(slitWidth + 1.0)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-mono transition cursor-pointer"
                title="Add 1.0 px"
              >
                +1.0
              </button>

              {autoDetectedSlit !== null && autoDetectedSlit !== slitWidth && (
                <button
                  type="button"
                  onClick={() => handlePitchChange(autoDetectedSlit)}
                  className="ml-auto px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40 text-[11px] font-mono font-bold flex items-center gap-1 transition cursor-pointer"
                  title="Reset slider to auto-detected pitch"
                >
                  <Zap className="w-3 h-3 text-sky-400" />
                  <span>Reset to Auto ({autoDetectedSlit.toFixed(2)}px)</span>
                </button>
              )}
            </div>

            {/* Candidate Harmonized Slits detected by algorithm */}
            {detectionResult && detectionResult.candidates.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-medium text-slate-400">
                  Detected Candidates:
                </span>
                {detectionResult.candidates.map((cand, i) => {
                  const isSelected = Math.abs(slitWidth - cand.slitWidth) < 0.04;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handlePitchChange(cand.slitWidth)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                        isSelected
                          ? "bg-sky-500 text-slate-950 font-bold border-sky-400 shadow"
                          : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:border-slate-600"
                      }`}
                    >
                      {i === 0 && <Zap className={`w-3 h-3 ${isSelected ? "text-slate-950" : "text-sky-400"}`} />}
                      <span>{cand.slitWidth.toFixed(2)}px</span>
                      <span className={`text-[9px] ${isSelected ? "text-slate-800" : "text-slate-500"}`}>
                        ({cand.confidence}%)
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Optical Period & Phase Count */}
          <div className="lg:col-span-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-sky-400" />
                  <span>Interlaced Phases:</span>
                </label>
                <span className="font-mono text-sky-400 font-bold">{frameCount} frames</span>
              </div>
              <div className="flex gap-1">
                {[3, 4, 5, 6].map((fc) => (
                  <button
                    key={fc}
                    type="button"
                    onClick={() => handlePitchChange(slitWidth, fc)}
                    className={`flex-1 py-1 rounded-lg text-center font-mono text-xs font-semibold transition cursor-pointer ${
                      frameCount === fc
                        ? "bg-sky-500 text-slate-950 font-bold shadow"
                        : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                    }`}
                  >
                    {fc}f
                  </button>
                ))}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-0.5 font-mono">
              <div className="flex justify-between">
                <span>Slit Aperture:</span>
                <span className="text-sky-300 font-bold">{slitWidth.toFixed(2)} px</span>
              </div>
              <div className="flex justify-between">
                <span>Barrier Bar Width:</span>
                <span className="text-slate-300 font-bold">{((frameCount - 1) * slitWidth).toFixed(2)} px</span>
              </div>
              <div className="flex justify-between pt-0.5 border-t border-slate-800/80 text-white font-bold">
                <span>Total Optical Period:</span>
                <span className="text-emerald-400">{(slitWidth * frameCount).toFixed(2)} px</span>
              </div>
            </div>

            <div className="space-y-2">
              {compositeCanvasState && onSaveUploadToStation && (
                <button
                  type="button"
                  onClick={() => {
                    const grating = createGratingSheet(
                      compositeCanvasState.width,
                      compositeCanvasState.height,
                      frameCount,
                      slitWidth,
                      { translucentTint: true }
                    );
                    onSaveUploadToStation(
                      uploadedImageName || "Uploaded Scanimation",
                      compositeCanvasState,
                      grating,
                      extractedFrames,
                      slitWidth,
                      frameCount
                    );
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/15"
                  title="Save this uploaded scanimation to your Save Station"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>Save Uploaded Art to Station</span>
                </button>
              )}

              {extractedFrames.length > 0 && (
                <button
                  type="button"
                  onClick={() => onSendToFrameEditor(extractedFrames, slitWidth)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-sky-300 border border-sky-500/30 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  title="Send decoded frames into the 5-frame editor workspace"
                >
                  <span>Send Decoded Frames to Editor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Optical Alignment Loupe & Cross-Section Moiré Verification */}
        {compositeCanvasState && (
          <div className="pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <ZoomIn className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-xs font-semibold text-slate-200">
                  Magnified Optical Loupe &amp; Moiré Inspection Window (2.5× Zoom)
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>Shift Loupe Phase:</span>
                <input
                  type="range"
                  min="0"
                  max={slitWidth * frameCount * 2}
                  step="0.5"
                  value={loupeOffset}
                  onChange={(e) => setLoupeOffset(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-slate-800 rounded accent-sky-400 cursor-pointer"
                />
              </div>
            </div>

            <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-black">
              <canvas
                ref={loupeCanvasRef}
                width={700}
                height={60}
                className="w-full h-[60px] object-cover block"
              />
              <div className="absolute bottom-1 right-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] text-slate-400 font-mono border border-slate-800/60 pointer-events-none">
                Slit: {slitWidth.toFixed(2)}px • Period: {(slitWidth * frameCount).toFixed(2)}px
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Inspection Rule: When the slit width matches the image perfectly, the blue guide marks align squarely across the entire horizontal aperture without drifting or creating wide moiré interference ripples.
            </p>
          </div>
        )}
      </div>

      {/* De-interlaced Sequential Frames Strip */}
      {extractedFrames.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-slate-200">
                Extracted Motion Phases ({extractedFrames.length} Frames Decoded at {slitWidth.toFixed(2)}px pitch):
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Decoded by de-interlacing the image columns at {slitWidth.toFixed(2)}px pitch
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {extractedFrames.map((frame, index) => (
              <div
                key={frame.id}
                onClick={() => setActiveExtractedIndex(index)}
                className={`group rounded-xl border p-2 text-center transition-all cursor-pointer ${
                  activeExtractedIndex === index
                    ? "bg-slate-950 border-sky-500 ring-2 ring-sky-500/20"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex justify-between items-center mb-1 text-[11px] font-mono px-1">
                  <span className="font-bold text-slate-400">Phase {index + 1}</span>
                  {activeExtractedIndex === index && (
                    <span className="text-sky-400 text-[9px] font-bold uppercase">Active</span>
                  )}
                </div>
                <div className="w-full aspect-square rounded-lg bg-white overflow-hidden p-1 flex items-center justify-center">
                  <img
                    src={frame.dataUrl}
                    alt={frame.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
