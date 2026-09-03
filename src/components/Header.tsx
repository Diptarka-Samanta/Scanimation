import React from "react";
import { Sparkles, HelpCircle, Layers, Wand2, FolderArchive } from "lucide-react";

interface HeaderProps {
  onOpenInfo: () => void;
  onOpenAiGenerator: () => void;
  onOpenSaveStation: () => void;
  savedCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenInfo,
  onOpenAiGenerator,
  onOpenSaveStation,
  savedCount = 0,
}) => {
  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight font-['Space_Grotesk'] text-slate-100">
                Scanimation Studio
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-400/10 text-amber-300 border border-amber-400/20">
                5-Frame Barrier Grid
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Turn 5 sequential photos into optical motion art with interactive barrier sheets
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Save Station Vault button */}
          <button
            id="header-save-station-btn"
            onClick={onOpenSaveStation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-400/30 hover:border-amber-400/60 shadow-sm transition-all cursor-pointer"
            title="Open Scanimation Save Station"
          >
            <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
            <span>Save Station</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-400/30">
              {savedCount}
            </span>
          </button>

          <button
            id="header-ai-gen-btn"
            onClick={onOpenAiGenerator}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-sm transition-all cursor-pointer"
            title="Generate 5-frame animation with Gemini AI"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">AI Frame Generator</span>
            <span className="sm:hidden">AI Gen</span>
          </button>

          <button
            id="header-info-btn"
            onClick={onOpenInfo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer border border-slate-700"
            title="How Scanimation Works"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">How It Works</span>
          </button>
        </div>
      </div>
    </header>
  );
};

