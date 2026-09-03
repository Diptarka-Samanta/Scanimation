import React, { useState } from "react";
import { X, Wand2, Loader2, Sparkles, Check, AlertCircle } from "lucide-react";
import { FrameItem } from "../types";

interface AiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFramesGenerated: (frames: FrameItem[], title: string) => void;
}

const QUICK_PROMPTS = [
  "Galloping Zebra silhouette",
  "Flapping Hummingbird wings",
  "Spinning 3D Diamond gemstone",
  "Dancing Stickman breakdance",
  "Beating Mechanical Clockwork Gear",
  "Waving Astronaut on the Moon",
];

export const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({
  isOpen,
  onClose,
  onFramesGenerated,
}) => {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("silhouette");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please describe the moving object you want to animate.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/generate-sequence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), style }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to generate animation frames");
      }

      const generatedFrames = data.data.frames;
      if (!Array.isArray(generatedFrames) || generatedFrames.length < 5) {
        throw new Error("AI did not return the required 5 frames. Please try again.");
      }

      const formattedFrames: FrameItem[] = generatedFrames.slice(0, 5).map((f: any, idx: number) => {
        const svgCode = f.svg || "";
        const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgCode)}`;
        return {
          id: `ai-frame-${idx}-${Date.now()}`,
          name: f.label || `Frame ${idx + 1}`,
          dataUrl,
          source: "ai",
        };
      });

      onFramesGenerated(formattedFrames, data.data.title || prompt);
      onClose();
    } catch (err: any) {
      console.error("AI Generation failed:", err);
      setError(err.message || "Failed to generate frames. Check connection or try another prompt.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full text-slate-200 shadow-2xl p-6 sm:p-7 relative">
        <button
          id="close-ai-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-inner">
            <Wand2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-['Space_Grotesk'] text-white">
              AI 5-Frame Motion Synthesizer
            </h2>
            <p className="text-xs text-slate-400">
              Powered by Gemini to synthesize 5 continuous keyframe poses optimized for scanimation
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4 text-sm">
          <div>
            <label htmlFor="ai-prompt-input" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Describe Object Motion (Looping Subject)
            </label>
            <textarea
              id="ai-prompt-input"
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Galloping wild stallion silhouette, flapping butterfly wings, dancing robot"
              className="w-full bg-slate-950 border border-slate-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 transition outline-none resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Quick inspiration chips */}
          <div>
            <span className="text-xs text-slate-400 font-medium block mb-2">Popular ideas:</span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp}
                  type="button"
                  onClick={() => setPrompt(qp)}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/60 cursor-pointer"
                  disabled={isLoading}
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 text-xs text-slate-400 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Gemini will generate 5 vector SVG keyframe poses calibrated with high contrast so your optical barrier grid produces maximum illusion clarity.
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            id="submit-ai-gen-btn"
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-violet-600/20 transition cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Synthesizing 5 Keyframes...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 text-amber-300" />
                <span>Generate 5 Frames</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
