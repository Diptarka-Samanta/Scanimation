import React from "react";
import { X, Layers, Sliders, Eye, Printer, Lightbulb } from "lucide-react";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto text-slate-200 shadow-2xl p-6 sm:p-8 relative">
        <button
          id="close-info-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-['Space_Grotesk'] text-white">
              The Science of Scanimation (Barrier-Grid Animation)
            </h2>
            <p className="text-xs text-slate-400">
              Also known as Kinegrams, Picket-Fence Animation, or Moire Optic Motion
            </p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-slate-300">
          {/* Section 1: The Magic Concept */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-amber-400" />
              How Does the Optical Illusion Work?
            </h3>
            <p className="leading-relaxed">
              Scanimation divides 5 sequential motion pictures into tiny interleaved vertical columns.
              When you lay the <strong>black and transparent grating sheet</strong> over the artwork:
            </p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-amber-400 block mb-1">1. The Interlaced Base</span>
                Column 1 belongs to Frame 1, Column 2 to Frame 2, Column 3 to Frame 3, Column 4 to Frame 4, Column 5 to Frame 5, then repeats.
              </div>
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-sky-400 block mb-1">2. The Barrier Sheet</span>
                Has 1 transparent slit followed by 4 solid black bars. The black bars block 4 frames, letting only 1 frame pass through your eyes.
              </div>
            </div>
          </div>

          {/* Section 2: Interactive Motion */}
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2 mb-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              Horizontal Motion = Fluid Animation
            </h3>
            <p className="leading-relaxed">
              As you drag or slide the sheet horizontally by just a few millimeters, the transparent slits shift onto the next interleaved frame.
              Your brain’s visual cortex stitches these frames together, creating fluid, cinema-like motion without any screens or electronics!
            </p>
          </div>

          {/* Section 3: Crafting Tips */}
          <div className="border-t border-slate-800 pt-4">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
              Pro Tips for the Best Results
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span><strong>High-contrast subjects:</strong> Bold dark silhouettes on bright white backgrounds create the most dramatic, sharpest illusions.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span><strong>Centered subjects:</strong> Ensure your object stays in roughly the same position in the frame while performing its action (e.g. running in place, flapping wings, beating heart).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span><strong>Looping motion:</strong> When Frame 5 transitions smoothly back into Frame 1, you achieve an infinite, continuous motion loop.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                <span><strong>Existing scanimated pictures:</strong> Switch to Option 2 to upload any pre-made scanimated image (or scans from books). Our engine lets you calibrate the pitch, test it with the sliding barrier sheet, and even de-interlace and decode the hidden motion frames!</span>
              </li>
            </ul>
          </div>

          {/* Section 4: Real-World Printing */}
          <div className="bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-500/20 rounded-xl p-4">
            <h3 className="font-semibold text-amber-300 flex items-center gap-2 mb-1">
              <Printer className="w-4 h-4" />
              DIY Real-World Acetate Printing
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              You can click <strong>"Print DIY Kit"</strong> in the Scanimation panel to download the printable sheet.
              Print the Base Art on white cardstock, and print the Barrier Grating on transparent overhead projector film (acetate sheets).
              Place the film on top of the paper, slide it with your hand, and witness real physical scanimation!
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            id="understand-info-btn"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition cursor-pointer border border-slate-700"
          >
            Got It, Let&apos;s Create!
          </button>
        </div>
      </div>
    </div>
  );
};
