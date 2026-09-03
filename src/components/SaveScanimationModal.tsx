import React, { useState, useEffect } from "react";
import {
  X,
  BookmarkPlus,
  Sliders,
  Film,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  Tag,
} from "lucide-react";
import { FrameItem, ProcessingSettings, SavedScanimationItem, SavedScanimationType } from "../types";
import { createThumbnail, saveScanimationItem } from "../utils/saveStationStorage";

interface SaveScanimationModalProps {
  isOpen: boolean;
  onClose: () => void;
  compositeCanvas: HTMLCanvasElement | null;
  gratingCanvas: HTMLCanvasElement | null;
  frames: (FrameItem | null)[];
  settings: ProcessingSettings;
  defaultTitle?: string;
  defaultType?: SavedScanimationType;
  onSavedSuccess: (item: SavedScanimationItem) => void;
}

export const SaveScanimationModal: React.FC<SaveScanimationModalProps> = ({
  isOpen,
  onClose,
  compositeCanvas,
  gratingCanvas,
  frames,
  settings,
  defaultTitle = "My Scanimation Project",
  defaultType = "generated",
  onSavedSuccess,
}) => {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState("");
  const [type, setType] = useState<SavedScanimationType>(defaultType);
  const [tags, setTags] = useState<string>("optical, barrier-grid");
  const [isSaving, setIsSaving] = useState(false);
  const [successSaved, setSuccessSaved] = useState(false);
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(defaultTitle);
      setType(defaultType);
      setDescription("");
      setSuccessSaved(false);

      if (compositeCanvas) {
        createThumbnail(compositeCanvas, 240).then((thumb) => {
          setPreviewThumbnail(thumb);
        });
      }
    }
  }, [isOpen, defaultTitle, defaultType, compositeCanvas]);

  if (!isOpen) return null;

  const validFrames = frames.filter((f): f is FrameItem => f !== null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compositeCanvas || !gratingCanvas) return;

    setIsSaving(true);
    try {
      const compositeDataUrl = compositeCanvas.toDataURL("image/png");
      const gratingDataUrl = gratingCanvas.toDataURL("image/png");
      const thumbnail = previewThumbnail || (await createThumbnail(compositeCanvas, 200));

      const parsedTags = tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      const savedItem: SavedScanimationItem = {
        id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title: title.trim() || "Untitled Scanimation",
        description: description.trim() || undefined,
        type,
        compositeDataUrl,
        gratingDataUrl,
        thumbnailDataUrl: thumbnail,
        slitWidth: Number(settings.slitWidth.toFixed(2)),
        frameCount: validFrames.length > 0 ? validFrames.length : 5,
        createdAt: Date.now(),
        dimensions: {
          width: compositeCanvas.width,
          height: compositeCanvas.height,
        },
        frames: validFrames,
        settings,
        tags: parsedTags,
      };

      await saveScanimationItem(savedItem);
      setSuccessSaved(true);
      onSavedSuccess(savedItem);

      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      console.error("Failed to save scanimation:", err);
      alert("Failed to save to local station. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
              <BookmarkPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base font-['Space_Grotesk'] text-white">
                Save to Scanimation Station
              </h3>
              <p className="text-[11px] text-slate-400">
                Store in local persistent storage for instant reload anytime
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Preview & Key Metadata Card */}
          <div className="flex gap-4 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 items-center">
            <div className="w-20 h-20 rounded-lg bg-black border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
              {previewThumbnail ? (
                <img
                  src={previewThumbnail}
                  alt="Thumbnail"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-slate-600 text-xs font-mono">No Image</div>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono tracking-wider ${
                    type === "generated"
                      ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                      : "bg-sky-400/20 text-sky-300 border border-sky-400/30"
                  }`}
                >
                  {type === "generated" ? "✨ Generated Art" : "⚡ Uploaded Picture"}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {compositeCanvas ? `${compositeCanvas.width}×${compositeCanvas.height}px` : ""}
                </span>
              </div>
              <div className="text-xs text-slate-300 flex items-center gap-3 pt-0.5 font-mono">
                <span>Slit: <strong className="text-amber-400">{settings.slitWidth.toFixed(2)}px</strong></span>
                <span>Phases: <strong className="text-sky-400">{validFrames.length || 5} frames</strong></span>
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                Includes full composite art, matching optical grating, &amp; frames
              </div>
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200">
              Project Title:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Galloping Horse — High Contrast"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-sm text-white placeholder-slate-500 outline-none transition"
            />
          </div>

          {/* Category Type Switcher */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200">
              Station Category:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("generated")}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                  type === "generated"
                    ? "bg-amber-400/15 border-amber-400 text-amber-300"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generated Scanimation</span>
              </button>
              <button
                type="button"
                onClick={() => setType("uploaded")}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                  type === "uploaded"
                    ? "bg-sky-400/15 border-sky-400 text-sky-300"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Uploaded Picture</span>
              </button>
            </div>
          </div>

          {/* Notes / Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200 flex items-center justify-between">
              <span>Notes &amp; Description (Optional):</span>
              <span className="text-[10px] text-slate-500 font-normal">e.g. optimal print settings</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Printed on glossy acetate with 3.0px slits, smooth galloping loop."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-xs text-white placeholder-slate-500 outline-none transition resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || successSaved}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-lg ${
                successSaved
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/20"
              }`}
            >
              {successSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Saved to Station!</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-4 h-4" />
                  <span>{isSaving ? "Saving..." : "Save into Station"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
