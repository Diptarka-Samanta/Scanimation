import React, { useRef, useState } from "react";
import {
  Upload,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Trash2,
  SlidersHorizontal,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  Wand2,
  Eye,
  Layers,
  HelpCircle,
} from "lucide-react";
import { FrameItem, FilterMode, ProcessingSettings, AIAnalysisResult } from "../types";
import { PRESET_ANIMATIONS } from "../utils/presets";

interface FrameUploaderProps {
  frames: (FrameItem | null)[];
  onFramesChange: (frames: (FrameItem | null)[]) => void;
  settings: ProcessingSettings;
  onSettingsChange: (settings: ProcessingSettings) => void;
  onCreateScanimation: () => void;
  isProcessing: boolean;
  onOpenAiGenerator: () => void;
  onApplyPreset: (presetId: string) => void;
}

export const FrameUploader: React.FC<FrameUploaderProps> = ({
  frames,
  onFramesChange,
  settings,
  onSettingsChange,
  onCreateScanimation,
  isProcessing,
  onOpenAiGenerator,
  onApplyPreset,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const singleSlotInputRef = useRef<HTMLInputElement>(null);
  const [selectedSlotForUpload, setSelectedSlotForUpload] = useState<number | null>(null);
  const [isDraggingOverall, setIsDraggingOverall] = useState(false);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filledCount = frames.filter(Boolean).length;
  const isReady = filledCount === 5;

  // Process file upload
  const handleFiles = (fileList: FileList, targetSlot?: number) => {
    const validFiles = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (validFiles.length === 0) return;

    if (targetSlot !== undefined && validFiles.length === 1) {
      // Single slot replacement
      const file = validFiles[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const newFrames = [...frames];
        newFrames[targetSlot] = {
          id: `frame-${targetSlot}-${Date.now()}`,
          name: file.name,
          dataUrl,
          source: "upload",
        };
        onFramesChange(newFrames);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Multi-file upload: Fill starting from 0 or first empty slot
    const newFrames = [...frames];
    let fileIdx = 0;

    for (let slot = 0; slot < 5 && fileIdx < validFiles.length; slot++) {
      // If targetSlot specified or slot is empty or overriding
      const file = validFiles[fileIdx];
      const reader = new FileReader();
      const currentSlot = slot;
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onFramesChange((prev) => {
          const updated = [...prev];
          updated[currentSlot] = {
            id: `frame-${currentSlot}-${Date.now()}`,
            name: file.name,
            dataUrl,
            source: "upload",
          };
          return updated;
        });
      };
      reader.readAsDataURL(file);
      fileIdx++;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverall(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverall(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverall(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const moveFrame = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= 5) return;
    const newFrames = [...frames];
    const temp = newFrames[fromIndex];
    newFrames[fromIndex] = newFrames[toIndex];
    newFrames[toIndex] = temp;
    onFramesChange(newFrames);
  };

  const removeFrame = (index: number) => {
    const newFrames = [...frames];
    newFrames[index] = null;
    onFramesChange(newFrames);
    setAiResult(null);
  };

  const clearAllFrames = () => {
    onFramesChange([null, null, null, null, null]);
    setAiResult(null);
  };

  // AI Sequence Analysis & Ordering
  const handleAiAnalyze = async () => {
    if (!isReady) return;
    setIsAnalyzingAi(true);
    setAiResult(null);

    try {
      const base64List = frames.map((f) => f!.dataUrl);
      const res = await fetch("/api/ai/analyze-and-align", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: base64List }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setAiResult(json.data);
      }
    } catch (err) {
      console.error("AI analysis error:", err);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const applyRecommendedOrder = () => {
    if (!aiResult || !aiResult.recommendedOrder) return;
    const ordered = aiResult.recommendedOrder.map((idx) => frames[idx] || null);
    onFramesChange(ordered);
    setAiResult(null);
  };

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl text-slate-100">
      {/* Header with Quick Presets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center border border-amber-500/30">
              1
            </span>
            <h2 className="text-lg font-bold font-['Space_Grotesk'] text-white">
              Upload 5 Sequential Motion Frames
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
              {filledCount}/5 slots
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Upload 5 photos of the same moving subject in sequence (e.g. running animal, jumping person, waving hand)
          </p>
        </div>

        {/* Quick Presets Row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 mr-1 font-medium hidden lg:inline">Quick Presets:</span>
          {PRESET_ANIMATIONS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onApplyPreset(preset.id)}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 hover:border-slate-600 transition cursor-pointer flex items-center gap-1.5"
              title={preset.description}
            >
              <span>{preset.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Drag & Drop Multi-Upload Banner (When Empty or Partial) */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mt-4 relative border-2 border-dashed rounded-xl p-4 sm:p-5 text-center transition-all ${
          isDraggingOverall
            ? "border-amber-400 bg-amber-500/10 text-amber-300"
            : "border-slate-700/80 hover:border-slate-600 bg-slate-950/40"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
          }}
        />
        <input
          ref={singleSlotInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && selectedSlotForUpload !== null) {
              handleFiles(e.target.files, selectedSlotForUpload);
              setSelectedSlotForUpload(null);
            }
          }}
        />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-800 text-slate-300">
              <Upload className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-slate-200">
                Drag and drop your 5 photos here
              </div>
              <div className="text-xs text-slate-400">
                Supports PNG, JPG, WebP. Select all 5 together or one by one.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              Browse Photos
            </button>
            <button
              type="button"
              onClick={onOpenAiGenerator}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 border border-violet-500/30 transition cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>AI Gen</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5-Slot Visual Frame Strip */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {frames.map((frame, index) => (
          <div
            key={index}
            className={`group relative rounded-xl border p-2.5 transition-all flex flex-col items-center text-center ${
              frame
                ? "bg-slate-950 border-slate-700/80 shadow-md"
                : "bg-slate-950/40 border-dashed border-slate-800 hover:border-slate-700"
            }`}
          >
            {/* Slot Number Badge */}
            <div className="w-full flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-[11px] font-bold tracking-wider font-['Space_Grotesk'] text-slate-400 uppercase">
                Frame {index + 1}
              </span>
              {frame && (
                <button
                  type="button"
                  onClick={() => removeFrame(index)}
                  className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                  title="Remove Frame"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Thumbnail Canvas Area */}
            <div
              onClick={() => {
                if (!frame) {
                  setSelectedSlotForUpload(index);
                  singleSlotInputRef.current?.click();
                }
              }}
              className={`w-full aspect-square rounded-lg flex items-center justify-center overflow-hidden relative cursor-pointer ${
                frame
                  ? "bg-white border border-slate-200"
                  : "bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800"
              }`}
            >
              {frame ? (
                <img
                  src={frame.dataUrl}
                  alt={frame.name}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <div className="flex flex-col items-center gap-1 text-slate-500 p-2">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-[10px] font-medium">Click to Add</span>
                </div>
              )}

              {/* Hover overlay on populated frame */}
              {frame && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSlotForUpload(index);
                    singleSlotInputRef.current?.click();
                  }}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium cursor-pointer"
                >
                  Replace
                </div>
              )}
            </div>

            {/* Reordering Controls */}
            {frame && (
              <div className="w-full flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/60 text-slate-400">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveFrame(index, index - 1)}
                  className="p-1 rounded hover:bg-slate-800 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                  title="Move left"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-slate-400 font-mono">
                  {frame.source === "preset" ? "Preset" : frame.source === "ai" ? "AI" : "Photo"}
                </span>
                <button
                  type="button"
                  disabled={index === 4}
                  onClick={() => moveFrame(index, index + 1)}
                  className="p-1 rounded hover:bg-slate-800 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                  title="Move right"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* AI Analysis Recommendation Banner (If available) */}
      {aiResult && (
        <div className="mt-4 p-3.5 bg-violet-950/40 border border-violet-800/60 rounded-xl text-xs text-violet-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Analysis: Detected {aiResult.subjectName} ({aiResult.loopQuality})</span>
            </div>
            <p className="text-slate-300">{aiResult.motionDescription}</p>
            <p className="text-violet-300/80">{aiResult.contrastTip}</p>
          </div>
          {aiResult.recommendedOrder && (
            <button
              type="button"
              onClick={applyRecommendedOrder}
              className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs whitespace-nowrap shadow-sm cursor-pointer"
            >
              Apply Recommended Order
            </button>
          )}
        </div>
      )}

      {/* Silhouette & Processing Controls Accordion */}
      <div className="mt-5 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <span>Image Pre-processing & Silhouette Calibration</span>
            <span className="text-[11px] text-slate-500">
              ({settings.filterMode.toUpperCase()}, {settings.slitWidth}px slits)
            </span>
          </button>

          {isReady && (
            <button
              type="button"
              disabled={isAnalyzingAi}
              onClick={handleAiAnalyze}
              className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{isAnalyzingAi ? "Analyzing..." : "AI Auto-Check Order"}</span>
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-3.5 p-4 bg-slate-950/60 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Filter Mode */}
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">
                Visual Style
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: "silhouette", label: "Silhouette (B&W)" },
                    { id: "inverted", label: "Inverted (White)" },
                    { id: "edges", label: "Outlines / Edges" },
                    { id: "color", label: "Boosted Color" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      onSettingsChange({ ...settings, filterMode: opt.id })
                    }
                    className={`px-2.5 py-1.5 rounded-lg text-left transition font-medium cursor-pointer ${
                      settings.filterMode === opt.id
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Threshold Slider (for Silhouette & Edges) */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-slate-400 font-medium">
                  Black/White Threshold
                </label>
                <span className="font-mono text-amber-400">
                  {settings.threshold}
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="240"
                value={settings.threshold}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    threshold: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                Higher = thicker silhouette, Lower = finer lines
              </span>
            </div>

            {/* Slit Width */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-slate-400 font-medium">Slit Width (Pitch)</label>
                <span className="font-mono text-amber-400">
                  {settings.slitWidth} px
                </span>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((width) => (
                  <button
                    key={width}
                    type="button"
                    onClick={() =>
                      onSettingsChange({ ...settings, slitWidth: width })
                    }
                    className={`flex-1 py-1 rounded text-center font-medium cursor-pointer ${
                      settings.slitWidth === width
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {width}px
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                2px is recommended for crisp retina display
              </span>
            </div>

            {/* Auto Center Toggle */}
            <div className="flex flex-col justify-between">
              <label className="text-slate-400 font-medium mb-1.5">
                Alignment
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
                <input
                  type="checkbox"
                  checked={settings.autoCenter}
                  onChange={(e) =>
                    onSettingsChange({
                      ...settings,
                      autoCenter: e.target.checked,
                    })
                  }
                  className="accent-amber-500 rounded"
                />
                <span className="text-xs text-slate-200">
                  Auto-center and maintain aspect ratio
                </span>
              </label>
              {filledCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFrames}
                  className="text-[11px] text-rose-400 hover:underline text-left mt-2 cursor-pointer"
                >
                  Reset all 5 frames
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Call to Action: CREATE SCANIMATION ART */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
        <div className="text-xs text-slate-400 text-center sm:text-left">
          {isReady ? (
            <span className="text-emerald-400 font-medium flex items-center gap-1.5 justify-center sm:justify-start">
              <CheckCircle2 className="w-4 h-4" />
              All 5 frames ready! Click Create to weave the optical interlaced art.
            </span>
          ) : (
            <span>
              Please fill all 5 slots (or choose a preset) to generate the scanimation art.
            </span>
          )}
        </div>

        <button
          id="create-scanimation-btn"
          type="button"
          disabled={!isReady || isProcessing}
          onClick={onCreateScanimation}
          className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold font-['Space_Grotesk'] text-sm tracking-wide text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              <span>Interlacing 5 Frames...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Create Scanimation Art</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
};
