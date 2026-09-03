import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Printer,
  Download,
  Eye,
  EyeOff,
  MoveHorizontal,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Sparkles,
  Layers,
  Film,
  Grid,
  Columns2,
  Gauge,
  Zap,
  Minus,
  Plus,
  BookmarkPlus,
} from "lucide-react";
import { FrameItem, ProcessingSettings } from "../types";
import { renderScanimationToContext, detectScanimationPitch } from "../utils/scanimationEngine";

interface ScanimationViewerProps {
  compositeCanvas: HTMLCanvasElement | null;
  gratingCanvas: HTMLCanvasElement | null;
  frames: (FrameItem | null)[];
  settings: ProcessingSettings;
  onOpenPrintModal: () => void;
  onUpdateSlitWidth?: (width: number) => void;
  onSaveToStation?: () => void;
}

export const ScanimationViewer: React.FC<ScanimationViewerProps> = ({
  compositeCanvas,
  gratingCanvas,
  frames,
  settings,
  onOpenPrintModal,
  onUpdateSlitWidth,
  onSaveToStation,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cinemaCanvasRef = useRef<HTMLCanvasElement>(null);

  // Optical Sheet offset in exact canvas pixel units
  const sheetOffsetRef = useRef<number>(0);
  const [displayOffset, setDisplayOffset] = useState<number>(0);
  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(0);

  // Playback & Interaction States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1); // 0.5x, 1x, 1.5x, 2x
  const [isSheetLifted, setIsSheetLifted] = useState<boolean>(false);
  const [barrierOpacity, setBarrierOpacity] = useState<number>(1.0); // 0.85 to 1.0
  const [viewMode, setViewMode] = useState<"optical" | "cinema" | "split">("optical");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Drag tracking
  const pointerStartRef = useRef<{ clientX: number; initialOffset: number } | null>(null);

  const period = 5 * settings.slitWidth;

  // Redraw optical canvas
  const drawOpticalCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !compositeCanvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (canvas.width !== compositeCanvas.width || canvas.height !== compositeCanvas.height) {
      canvas.width = compositeCanvas.width;
      canvas.height = compositeCanvas.height;
    }

    renderScanimationToContext(
      ctx,
      compositeCanvas,
      sheetOffsetRef.current,
      settings.slitWidth,
      5,
      {
        isLifted: isSheetLifted,
        barrierOpacity: barrierOpacity,
        drawAcrylicSheen: !isSheetLifted,
      }
    );
  }, [compositeCanvas, settings.slitWidth, isSheetLifted, barrierOpacity]);

  // Redraw cinema canvas (direct frame animation loop)
  const drawCinemaCanvas = useCallback(
    (frameIdx: number) => {
      const canvas = cinemaCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const currentFrame = frames[frameIdx];
      if (!currentFrame) return;

      const img = new Image();
      img.onload = () => {
        if (canvas.width !== 600 || canvas.height !== 600) {
          canvas.width = 600;
          canvas.height = 600;
        }
        ctx.fillStyle = settings.filterMode === "inverted" ? "#000000" : "#ffffff";
        ctx.fillRect(0, 0, 600, 600);
        ctx.drawImage(img, 0, 0, 600, 600);
      };
      img.src = currentFrame.dataUrl;
    },
    [frames, settings.filterMode]
  );

  // Trigger initial draw whenever composite changes or dependencies change
  useEffect(() => {
    drawOpticalCanvas();
  }, [drawOpticalCanvas]);

  // Synchronize cinema canvas when frame index changes
  useEffect(() => {
    if (viewMode === "cinema" || viewMode === "split") {
      drawCinemaCanvas(activeFrameIndex);
    }
  }, [activeFrameIndex, viewMode, drawCinemaCanvas]);

  // High-performance 60fps auto-glide loop using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;
    let lastTime = performance.now();
    let lastStateUpdateTime = performance.now();

    const loop = (currentTime: number) => {
      const delta = currentTime - lastTime;
      lastTime = currentTime;

      // Smooth horizontal velocity in canvas pixels per second
      // Base speed: 1.5 full cycles per second at 1x
      const speedInPeriodsPerSec = 1.6 * playSpeed;
      const pixelsPerSec = speedInPeriodsPerSec * period;
      const step = (pixelsPerSec * delta) / 1000;

      sheetOffsetRef.current = (sheetOffsetRef.current + step) % (period * 1000);
      drawOpticalCanvas();

      // Throttle React state update to avoid heavy UI re-renders
      if (currentTime - lastStateUpdateTime > 60) {
        const norm = ((sheetOffsetRef.current % period) + period) % period;
        const currentFrame = Math.floor(norm / settings.slitWidth) % 5;
        setDisplayOffset(sheetOffsetRef.current);
        setActiveFrameIndex(currentFrame);
        lastStateUpdateTime = currentTime;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, playSpeed, period, settings.slitWidth, drawOpticalCanvas]);

  // Pointer Drag Handlers (1:1 tactile physical dragging)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isSheetLifted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDragging(true);
    setIsPlaying(false);

    pointerStartRef.current = {
      clientX: e.clientX,
      initialOffset: sheetOffsetRef.current,
    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !pointerStartRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleFactor = canvas.width / rect.width;
    const dx = (e.clientX - pointerStartRef.current.clientX) * scaleFactor;

    sheetOffsetRef.current = pointerStartRef.current.initialOffset + dx;
    drawOpticalCanvas();

    const norm = ((sheetOffsetRef.current % period) + period) % period;
    const currentFrame = Math.floor(norm / settings.slitWidth) % 5;
    setDisplayOffset(sheetOffsetRef.current);
    setActiveFrameIndex(currentFrame);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      pointerStartRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  // Step 1 Frame forward or backward
  const stepFrame = (dir: number) => {
    setIsPlaying(false);
    sheetOffsetRef.current += dir * settings.slitWidth;
    drawOpticalCanvas();

    const norm = ((sheetOffsetRef.current % period) + period) % period;
    const currentFrame = Math.floor(norm / settings.slitWidth) % 5;
    setDisplayOffset(sheetOffsetRef.current);
    setActiveFrameIndex(currentFrame);
  };

  // Jump to specific frame (0 to 4)
  const jumpToFrame = (idx: number) => {
    setIsPlaying(false);
    // Align sheet so slit centers on frame idx
    sheetOffsetRef.current = idx * settings.slitWidth;
    drawOpticalCanvas();
    setDisplayOffset(sheetOffsetRef.current);
    setActiveFrameIndex(idx);
  };

  // Reset sheet position
  const resetSheet = () => {
    setIsPlaying(false);
    sheetOffsetRef.current = 0;
    drawOpticalCanvas();
    setDisplayOffset(0);
    setActiveFrameIndex(0);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Downloads
  const downloadBaseArt = () => {
    if (!compositeCanvas) return;
    const link = document.createElement("a");
    link.download = `scanimation-base-art-${Date.now()}.png`;
    link.href = compositeCanvas.toDataURL("image/png");
    link.click();
  };

  const downloadGratingSheet = () => {
    if (!gratingCanvas) return;
    const link = document.createElement("a");
    link.download = `scanimation-optical-grating-${Date.now()}.png`;
    link.href = gratingCanvas.toDataURL("image/png");
    link.click();
  };

  if (!compositeCanvas) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
        <Sparkles className="w-12 h-12 text-amber-400 mb-3 animate-pulse" />
        <h3 className="text-xl font-bold text-white mb-2">Generating Scanimation Canvas...</h3>
        <p className="text-slate-400 text-sm max-w-md">
          Interlacing 5 frames with optical barrier registration.
        </p>
      </div>
    );
  }

  const normalizedSliderVal = ((displayOffset % period) + period) % period;

  return (
    <div
      ref={containerRef}
      className={`bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-md transition-all ${
        isFullscreen ? "p-8 max-w-none rounded-none fixed inset-0 z-50 overflow-y-auto" : ""
      }`}
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Optical Scanimation Theater
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% Optical Registration
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Drag horizontally across the sheet or press Auto-Glide to experience the illusion
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setViewMode("optical")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "optical"
                ? "bg-amber-400 text-slate-950 shadow-md font-bold"
                : "text-slate-300 hover:text-white hover:bg-slate-700/50"
            }`}
            title="Interactive Optical Grating Sheet Simulation"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Barrier Sheet</span>
          </button>

          <button
            onClick={() => setViewMode("cinema")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "cinema"
                ? "bg-amber-400 text-slate-950 shadow-md font-bold"
                : "text-slate-300 hover:text-white hover:bg-slate-700/50"
            }`}
            title="Smooth 60fps Digital Animation Loop"
          >
            <Film className="w-3.5 h-3.5" />
            <span>Cinema Playback</span>
          </button>

          <button
            onClick={() => setViewMode("split")}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "split"
                ? "bg-amber-400 text-slate-950 shadow-md font-bold"
                : "text-slate-300 hover:text-white hover:bg-slate-700/50"
            }`}
            title="Side-by-Side Comparison"
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>Dual View</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSheetLifted((v) => !v)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isSheetLifted
                ? "bg-amber-400 text-slate-950 border-amber-300 shadow-md"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:border-slate-600"
            }`}
            title="Lift optical sheet to inspect raw interlaced composite"
          >
            {isSheetLifted ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{isSheetLifted ? "Lower Sheet" : "Lift Sheet"}</span>
          </button>

          {onSaveToStation && (
            <button
              onClick={onSaveToStation}
              className="px-3 py-1.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/40 hover:border-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Save current scanimation to your local Save Station vault"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-amber-400" />
              <span>Save to Station</span>
            </button>
          )}

          <button
            onClick={onOpenPrintModal}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Generate ready-to-print DIY Scanimation craft sheet"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print Kit</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all"
            title="Toggle Theater Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="py-6 flex flex-col items-center justify-center">
        <div
          className={`w-full flex flex-col ${
            viewMode === "split" ? "lg:flex-row gap-6 max-w-5xl" : "items-center max-w-[560px]"
          } justify-center`}
        >
          {/* Viewport 1: Optical Barrier Sheet */}
          {(viewMode === "optical" || viewMode === "split") && (
            <div className="flex-1 w-full flex flex-col items-center">
              {viewMode === "split" && (
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Grid className="w-3.5 h-3.5" />
                  <span>Optical Barrier Simulation</span>
                </div>
              )}

              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className={`relative w-full aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 select-none touch-none transition-all ${
                  isDragging
                    ? "border-amber-400 ring-4 ring-amber-400/20 cursor-grabbing"
                    : "border-slate-700 hover:border-slate-500 cursor-grab"
                } bg-white`}
                style={{ touchAction: "none" }}
              >
                {/* HTML5 Pixel-Aligned Canvas */}
                <canvas
                  ref={canvasRef}
                  width={compositeCanvas.width}
                  height={compositeCanvas.height}
                  className="w-full h-full object-contain pointer-events-none select-none"
                />

                {/* Tactile Grating Handle Overlay */}
                {!isSheetLifted && (
                  <div className="absolute inset-x-0 bottom-3 flex justify-between px-3 pointer-events-none">
                    <div className="bg-black/85 backdrop-blur-md text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-md border border-white/20 shadow-lg flex items-center gap-1 tracking-wider uppercase">
                      <MoveHorizontal className="w-3.5 h-3.5" />
                      <span>Drag Sheet ↔</span>
                    </div>
                    <div className="bg-black/85 backdrop-blur-md text-white text-[10px] font-mono px-2.5 py-1 rounded-md border border-white/20 shadow-lg flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Frame {activeFrameIndex + 1} / 5</span>
                    </div>
                  </div>
                )}

                {/* Lifted Sheet Banner */}
                {isSheetLifted && (
                  <div className="absolute inset-x-0 top-3 flex justify-center pointer-events-none">
                    <div className="bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Sheet Lifted: Showing Raw Interlaced Base Lines</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Viewport 2: Cinema Playback (Smooth 60fps Loop) */}
          {(viewMode === "cinema" || viewMode === "split") && (
            <div className="flex-1 w-full flex flex-col items-center">
              {viewMode === "split" && (
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5" />
                  <span>Direct Animation Loop</span>
                </div>
              )}

              <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-700 bg-white">
                <canvas ref={cinemaCanvasRef} className="w-full h-full object-contain select-none" />

                <div className="absolute inset-x-0 bottom-3 flex justify-between px-3 pointer-events-none">
                  <div className="bg-black/85 backdrop-blur-md text-sky-300 text-[10px] font-bold px-2.5 py-1 rounded-md border border-white/20 shadow-lg flex items-center gap-1 tracking-wider uppercase">
                    <Film className="w-3.5 h-3.5" />
                    <span>Cinema View</span>
                  </div>
                  <div className="bg-black/85 backdrop-blur-md text-white text-[10px] font-mono px-2.5 py-1 rounded-md border border-white/20 shadow-lg flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span>Frame {activeFrameIndex + 1} / 5</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tactile Drag Hint */}
        <div className="mt-3 text-center">
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <MoveHorizontal className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Click &amp; drag horizontally across the artwork to slide the barrier sheet</span>
          </p>
        </div>
      </div>

      {/* Control Console */}
      <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 space-y-4">
        {/* Row 1: Primary Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Play/Pause & Step Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
                isPlaying
                  ? "bg-rose-500 hover:bg-rose-600 text-white"
                  : "bg-amber-400 hover:bg-amber-300 text-slate-950"
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? "Pause Glide" : "Auto-Glide"}</span>
            </button>

            <button
              onClick={() => stepFrame(-1)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
              title="Step 1 Frame Back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => stepFrame(1)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
              title="Step 1 Frame Forward"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={resetSheet}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all"
              title="Reset Sheet Position"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Frame Jump Buttons (1 to 5) */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider">
              Snap Frame:
            </span>
            {[0, 1, 2, 3, 4].map((fIndex) => (
              <button
                key={fIndex}
                onClick={() => jumpToFrame(fIndex)}
                className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all ${
                  activeFrameIndex === fIndex
                    ? "bg-amber-400 text-slate-950 shadow-md scale-105"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {fIndex + 1}
              </button>
            ))}
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
            <Gauge className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Speed:</span>
            {[0.5, 1, 1.5, 2].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaySpeed(spd)}
                className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${
                  playSpeed === spd
                    ? "bg-amber-400 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Precision Scrubber */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1 text-slate-300">
              <MoveHorizontal className="w-3 h-3 text-amber-400" />
              <span>Sheet Period Phase</span>
            </span>
            <span className="text-amber-300 font-semibold">
              Frame {activeFrameIndex + 1} of 5 (Slit: {normalizedSliderVal.toFixed(1)}px / {period}px)
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={period}
            step={0.1}
            value={normalizedSliderVal}
            onChange={(e) => {
              setIsPlaying(false);
              const val = parseFloat(e.target.value);
              sheetOffsetRef.current = val;
              drawOpticalCanvas();
              setDisplayOffset(val);
              setActiveFrameIndex(Math.floor(val / settings.slitWidth) % 5);
            }}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:accent-amber-300"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono px-1">
            <span>Frame 1</span>
            <span>Frame 2</span>
            <span>Frame 3</span>
            <span>Frame 4</span>
            <span>Frame 5</span>
            <span>Loop</span>
          </div>
        </div>

        {/* Row 3: Optical Barrier Adjustments (Slit Width & Opacity) */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Slit Width Selector with Decimal Support & Nudge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Slit Width:</span>
            </span>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              {[2, 3, 4, 5].map((w) => (
                <button
                  key={w}
                  onClick={() => onUpdateSlitWidth && onUpdateSlitWidth(w)}
                  className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                    settings.slitWidth === w
                      ? "bg-amber-400 text-slate-950 font-bold shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title={`${w}px wide transparent slits (Period = ${w * 5}px)`}
                >
                  {w}px
                </button>
              ))}

              {/* Show Custom decimal if slitWidth is non-integer */}
              {![2, 3, 4, 5].includes(settings.slitWidth) && (
                <span className="px-2 py-1 rounded text-xs font-mono font-bold bg-amber-400 text-slate-950 shadow">
                  {settings.slitWidth.toFixed(2)}px
                </span>
              )}
            </div>

            {/* Micro Nudgers */}
            <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() =>
                  onUpdateSlitWidth &&
                  onUpdateSlitWidth(Math.max(0.5, Number((settings.slitWidth - 0.1).toFixed(2))))
                }
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Nudge slit width -0.1px"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-[10px] font-mono text-amber-300 font-bold px-1">
                {settings.slitWidth.toFixed(2)}px
              </span>
              <button
                type="button"
                onClick={() =>
                  onUpdateSlitWidth &&
                  onUpdateSlitWidth(Math.min(25, Number((settings.slitWidth + 0.1).toFixed(2))))
                }
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Nudge slit width +0.1px"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Auto-Detect Slit Width Shortcut */}
            {compositeCanvas && (
              <button
                type="button"
                onClick={() => {
                  const result = detectScanimationPitch(compositeCanvas, 5);
                  if (onUpdateSlitWidth) {
                    onUpdateSlitWidth(result.bestSlitWidth);
                  }
                }}
                className="px-2 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[11px] font-mono font-bold flex items-center gap-1 transition"
                title="Auto-detect optical slit width from image columns"
              >
                <Zap className="w-3 h-3 text-sky-400" />
                <span>Auto-Pick</span>
              </button>
            )}
          </div>

          {/* Barrier Sheet Opacity */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Sheet Opacity:</span>
            <input
              type="range"
              min={0.8}
              max={1.0}
              step={0.02}
              value={barrierOpacity}
              onChange={(e) => setBarrierOpacity(parseFloat(e.target.value))}
              className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              title="Adjust black barrier opacity for contrast vs screen brightness"
            />
            <span className="font-mono text-slate-300 w-10 text-right">
              {(barrierOpacity * 100).toFixed(0)}%
            </span>
          </div>

          {/* Download Art Assets */}
          <div className="flex items-center gap-2">
            <button
              onClick={downloadBaseArt}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1 transition-all"
              title="Download full-resolution PNG of base interlaced artwork"
            >
              <Download className="w-3 h-3" />
              <span>Base Art</span>
            </button>

            <button
              onClick={downloadGratingSheet}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1 transition-all"
              title="Download full-resolution PNG of optical grating sheet"
            >
              <Download className="w-3 h-3" />
              <span>Grating Sheet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
