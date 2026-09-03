import React, { useState, useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { FrameUploader } from "./components/FrameUploader";
import { DirectScanimationUploader } from "./components/DirectScanimationUploader";
import { ScanimationViewer } from "./components/ScanimationViewer";
import { InfoModal } from "./components/InfoModal";
import { AiGeneratorModal } from "./components/AiGeneratorModal";
import { PrintModal } from "./components/PrintModal";
import { SaveStationModal } from "./components/SaveStationModal";
import { SaveScanimationModal } from "./components/SaveScanimationModal";
import { FrameItem, ProcessingSettings, InputMode, SavedScanimationItem, SavedScanimationType } from "./types";
import { PRESET_ANIMATIONS } from "./utils/presets";
import { getAllSavedItems } from "./utils/saveStationStorage";
import { Film, Image as ImageIcon, Sparkles, FolderArchive } from "lucide-react";
import {
  loadImage,
  processImageFrame,
  createInterlacedComposite,
  createGratingSheet,
  generatePrintableKit,
} from "./utils/scanimationEngine";

const DEFAULT_SETTINGS: ProcessingSettings = {
  filterMode: "silhouette",
  threshold: 128,
  contrast: 50,
  slitWidth: 3, // 3px gives optimal light transmission and crisp optical isolation for 5 frames
  autoCenter: true,
};

export default function App() {
  // Input mode: either upload 5 frames or upload one already-scanimated picture
  const [inputMode, setInputMode] = useState<InputMode>("frames");

  // 5 frames state
  const [frames, setFrames] = useState<(FrameItem | null)[]>([null, null, null, null, null]);
  const [settings, setSettings] = useState<ProcessingSettings>(DEFAULT_SETTINGS);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeProjectTitle, setActiveProjectTitle] = useState<string>("Galloping Stallion");

  // Generated scanimation canvases
  const [compositeCanvas, setCompositeCanvas] = useState<HTMLCanvasElement | null>(null);
  const [gratingCanvas, setGratingCanvas] = useState<HTMLCanvasElement | null>(null);
  const [printKitDataUrl, setPrintKitDataUrl] = useState<string | null>(null);

  // Modal dialog states
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [isAiGenOpen, setIsAiGenOpen] = useState<boolean>(false);
  const [isPrintOpen, setIsPrintOpen] = useState<boolean>(false);
  const [isSaveStationOpen, setIsSaveStationOpen] = useState<boolean>(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState<boolean>(false);
  const [savedCount, setSavedCount] = useState<number>(0);

  // Configuration for the active save dialog
  const [saveDialogState, setSaveDialogState] = useState<{
    title: string;
    type: SavedScanimationType;
    canvas: HTMLCanvasElement | null;
    grating: HTMLCanvasElement | null;
    frames: (FrameItem | null)[];
    settings: ProcessingSettings;
  }>({
    title: "Galloping Stallion",
    type: "generated",
    canvas: null,
    grating: null,
    frames: [],
    settings: DEFAULT_SETTINGS,
  });

  const theaterRef = useRef<HTMLDivElement>(null);

  // Refresh saved items count on mount
  useEffect(() => {
    getAllSavedItems().then((items) => {
      setSavedCount(items.length);
    });
  }, []);

  // Load initial preset (Galloping Horse) on first mount so app opens with interactive art immediately
  useEffect(() => {
    applyPreset("galloping-horse");
  }, []);

  const applyPreset = (presetId: string) => {
    const preset = PRESET_ANIMATIONS.find((p) => p.id === presetId);
    if (!preset) return;

    setActiveProjectTitle(preset.title);
    const urls = preset.generateFrames();
    const newFrames: FrameItem[] = urls.map((url, idx) => ({
      id: `preset-${presetId}-${idx}`,
      name: `${preset.title} Frame ${idx + 1}`,
      dataUrl: url,
      source: "preset",
    }));

    setFrames(newFrames);
    // Auto compile scanimation art for presets
    generateScanimation(newFrames, settings);
  };

  const handleFramesGeneratedByAi = (newFrames: FrameItem[], title: string) => {
    setActiveProjectTitle(title || "AI Generated Animation");
    setFrames(newFrames);
    generateScanimation(newFrames, settings);
    setTimeout(() => {
      theaterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // Generate Scanimation Art Engine
  const generateScanimation = async (
    currentFrames: (FrameItem | null)[],
    currentSettings: ProcessingSettings
  ) => {
    const validFrames = currentFrames.filter((f): f is FrameItem => f !== null);
    if (validFrames.length !== 5) return;

    setIsProcessing(true);

    try {
      // Standard internal rasterization canvas size
      const CANVAS_SIZE = 600;

      // 1. Load all 5 images asynchronously
      const loadedImages = await Promise.all(
        validFrames.map((f) => loadImage(f.dataUrl))
      );

      // 2. Preprocess each frame (threshold, silhouette, centering, contrast)
      const processedCanvases = loadedImages.map((img) =>
        processImageFrame(img, CANVAS_SIZE, CANVAS_SIZE, currentSettings)
      );

      // 3. Interlace columns into the composite art
      const composite = createInterlacedComposite(
        processedCanvases,
        currentSettings.slitWidth
      );
      setCompositeCanvas(composite);

      // 4. Create matching optical grating barrier sheet
      // Width is matched to composite, with translucent tint for realistic acetate look
      const grating = createGratingSheet(
        CANVAS_SIZE,
        CANVAS_SIZE,
        5,
        currentSettings.slitWidth,
        { translucentTint: true }
      );
      setGratingCanvas(grating);

      // 5. Generate high-resolution printable DIY kit
      const printKit = generatePrintableKit(
        composite,
        grating,
        currentSettings.slitWidth,
        5
      );
      setPrintKitDataUrl(printKit.toDataURL("image/png"));
    } catch (error) {
      console.error("Failed to generate scanimation:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateScanimation = () => {
    generateScanimation(frames, settings);
    setTimeout(() => {
      theaterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  const handleDirectCompositeLoaded = (
    canvas: HTMLCanvasElement,
    grating: HTMLCanvasElement,
    extractedFrames: FrameItem[],
    slitWidth: number,
    frameCount: number,
    name: string
  ) => {
    setActiveProjectTitle(name || "Uploaded Scanimation");
    setCompositeCanvas(canvas);
    setGratingCanvas(grating);
    setFrames(extractedFrames);
    const updatedSettings = { ...settings, slitWidth };
    setSettings(updatedSettings);

    const printKit = generatePrintableKit(canvas, grating, slitWidth, frameCount);
    setPrintKitDataUrl(printKit.toDataURL("image/png"));

    setTimeout(() => {
      theaterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  const handleSendToFrameEditor = (extractedFrames: FrameItem[], slitWidth: number) => {
    setFrames(extractedFrames);
    const updatedSettings = { ...settings, slitWidth };
    setSettings(updatedSettings);
    setInputMode("frames");
    generateScanimation(extractedFrames, updatedSettings);
  };

  // Open Save Dialog for currently active scanimation (from Theater or top action)
  const openSaveDialogForCurrent = () => {
    if (!compositeCanvas || !gratingCanvas) {
      alert("Please generate or upload a scanimation before saving.");
      return;
    }

    setSaveDialogState({
      title: activeProjectTitle || "My Scanimation Art",
      type: inputMode === "scanimated_image" ? "uploaded" : "generated",
      canvas: compositeCanvas,
      grating: gratingCanvas,
      frames: frames,
      settings: settings,
    });
    setIsSaveDialogOpen(true);
  };

  // Open Save Dialog explicitly for an uploaded scanimation
  const handleSaveUploadToStation = (
    name: string,
    canvas: HTMLCanvasElement,
    gratingCanvas: HTMLCanvasElement,
    extractedFrames: FrameItem[],
    slitWidth: number,
    _frameCount: number
  ) => {
    setSaveDialogState({
      title: name || "Uploaded Scanimation",
      type: "uploaded",
      canvas: canvas,
      grating: gratingCanvas,
      frames: extractedFrames,
      settings: { ...settings, slitWidth },
    });
    setIsSaveDialogOpen(true);
  };

  // Load a saved scanimation from the Save Station into the live theater
  const handleLoadSavedItemIntoTheater = async (item: SavedScanimationItem) => {
    try {
      const compImg = await loadImage(item.compositeDataUrl);
      const compCanvas = document.createElement("canvas");
      compCanvas.width = item.dimensions.width;
      compCanvas.height = item.dimensions.height;
      compCanvas.getContext("2d")?.drawImage(compImg, 0, 0);

      const gratImg = await loadImage(item.gratingDataUrl);
      const gratCanvas = document.createElement("canvas");
      gratCanvas.width = item.dimensions.width;
      gratCanvas.height = item.dimensions.height;
      gratCanvas.getContext("2d")?.drawImage(gratImg, 0, 0);

      setActiveProjectTitle(item.title);
      setCompositeCanvas(compCanvas);
      setGratingCanvas(gratCanvas);

      if (item.frames && item.frames.length > 0) {
        setFrames(item.frames);
      }

      const updatedSettings: ProcessingSettings = {
        ...settings,
        slitWidth: item.slitWidth,
        ...(item.settings || {}),
      };
      setSettings(updatedSettings);

      const printKit = generatePrintableKit(
        compCanvas,
        gratCanvas,
        item.slitWidth,
        item.frameCount
      );
      setPrintKitDataUrl(printKit.toDataURL("image/png"));

      setTimeout(() => {
        theaterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } catch (err) {
      console.error("Failed to load saved scanimation into theater:", err);
    }
  };

  // Open saved scanimation frames directly in 5-frame editor workspace
  const handleOpenSavedItemInEditor = (item: SavedScanimationItem) => {
    if (!item.frames || item.frames.length === 0) return;
    setActiveProjectTitle(item.title);
    setFrames(item.frames);
    const updatedSettings: ProcessingSettings = {
      ...settings,
      slitWidth: item.slitWidth,
      ...(item.settings || {}),
    };
    setSettings(updatedSettings);
    setInputMode("frames");
    generateScanimation(item.frames, updatedSettings);
  };

  const handleSavedSuccess = () => {
    getAllSavedItems().then((items) => {
      setSavedCount(items.length);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Work_Sans'] selection:bg-amber-400 selection:text-slate-950 flex flex-col">
      {/* Top Navigation Bar */}
      <Header
        onOpenInfo={() => setIsInfoOpen(true)}
        onOpenAiGenerator={() => setIsAiGenOpen(true)}
        onOpenSaveStation={() => setIsSaveStationOpen(true)}
        savedCount={savedCount}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Creation Mode Switcher: Option 1 (5 Sequential Motion Frames) vs Option 2 (Upload Already-Scanimated Picture) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-1.5 sm:p-2 shadow-lg">
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              id="mode-upload-5-frames"
              type="button"
              onClick={() => setInputMode("frames")}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold font-['Space_Grotesk'] text-xs sm:text-sm tracking-wide transition-all cursor-pointer ${
                inputMode === "frames"
                  ? "bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-transparent hover:border-slate-700"
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Option 1: Upload 5 Sequential Motion Frames</span>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md font-semibold ${
                  inputMode === "frames" ? "bg-slate-950/20 text-slate-950" : "bg-slate-800 text-slate-400"
                }`}
              >
                Weave Art
              </span>
            </button>

            <button
              id="mode-upload-scanimated-picture"
              type="button"
              onClick={() => setInputMode("scanimated_image")}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold font-['Space_Grotesk'] text-xs sm:text-sm tracking-wide transition-all cursor-pointer ${
                inputMode === "scanimated_image"
                  ? "bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-950 shadow-md shadow-sky-500/20"
                  : "bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-transparent hover:border-slate-700"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Option 2: Upload Already-Scanimated Picture</span>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md font-semibold ${
                  inputMode === "scanimated_image" ? "bg-slate-950/20 text-slate-950" : "bg-slate-800 text-slate-400"
                }`}
              >
                Direct Playback
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Input Section based on selected mode */}
        {inputMode === "frames" ? (
          <FrameUploader
            frames={frames}
            onFramesChange={(newFrames) => {
              setFrames(newFrames);
            }}
            settings={settings}
            onSettingsChange={(newSettings) => {
              setSettings(newSettings);
              if (frames.filter(Boolean).length === 5) {
                generateScanimation(frames, newSettings);
              }
            }}
            onCreateScanimation={handleCreateScanimation}
            isProcessing={isProcessing}
            onOpenAiGenerator={() => setIsAiGenOpen(true)}
            onApplyPreset={applyPreset}
          />
        ) : (
          <DirectScanimationUploader
            onCompositeLoaded={handleDirectCompositeLoaded}
            onSendToFrameEditor={handleSendToFrameEditor}
            currentCompositeCanvas={compositeCanvas}
            settings={settings}
            onUpdateSlitWidth={(newWidth) => {
              setSettings((prev) => ({ ...prev, slitWidth: newWidth }));
            }}
            onSaveUploadToStation={handleSaveUploadToStation}
          />
        )}

        {/* Step 2: Interactive Scanimation Theater */}
        <div ref={theaterRef}>
          <ScanimationViewer
            compositeCanvas={compositeCanvas}
            gratingCanvas={gratingCanvas}
            frames={frames}
            settings={settings}
            onOpenPrintModal={() => setIsPrintOpen(true)}
            onSaveToStation={openSaveDialogForCurrent}
            onUpdateSlitWidth={(newSlitWidth) => {
              const updated = { ...settings, slitWidth: newSlitWidth };
              setSettings(updated);
              if (frames.filter(Boolean).length === 5) {
                generateScanimation(frames, updated);
              }
            }}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-850 bg-slate-950/80 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-bold text-slate-300 font-['Space_Grotesk']">Scanimation Studio</span>
            {" — "}
            <span>Barrier-grid optical illusion engine</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsSaveStationOpen(true)}
              className="hover:text-amber-300 transition cursor-pointer flex items-center gap-1 font-semibold"
            >
              <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
              <span>Save Station ({savedCount})</span>
            </button>
            <button
              onClick={() => setIsInfoOpen(true)}
              className="hover:text-amber-300 transition cursor-pointer"
            >
              How it works
            </button>
            <button
              onClick={() => setIsPrintOpen(true)}
              className="hover:text-amber-300 transition cursor-pointer"
            >
              Print DIY Kit
            </button>
            <button
              onClick={() => setIsAiGenOpen(true)}
              className="hover:text-amber-300 transition cursor-pointer"
            >
              AI Generator
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
      <AiGeneratorModal
        isOpen={isAiGenOpen}
        onClose={() => setIsAiGenOpen(false)}
        onFramesGenerated={handleFramesGeneratedByAi}
      />
      <PrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        printKitDataUrl={printKitDataUrl}
        compositeDataUrl={compositeCanvas ? compositeCanvas.toDataURL() : null}
        gratingDataUrl={gratingCanvas ? gratingCanvas.toDataURL() : null}
      />

      {/* Save Station Vault Modal */}
      <SaveStationModal
        isOpen={isSaveStationOpen}
        onClose={() => setIsSaveStationOpen(false)}
        onLoadIntoTheater={handleLoadSavedItemIntoTheater}
        onOpenInFrameEditor={handleOpenSavedItemInEditor}
        onTriggerSaveCurrent={openSaveDialogForCurrent}
        hasActiveComposite={!!compositeCanvas}
      />

      {/* Save Scanimation Dialog */}
      <SaveScanimationModal
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        compositeCanvas={saveDialogState.canvas}
        gratingCanvas={saveDialogState.grating}
        frames={saveDialogState.frames}
        settings={saveDialogState.settings}
        defaultTitle={saveDialogState.title}
        defaultType={saveDialogState.type}
        onSavedSuccess={handleSavedSuccess}
      />
    </div>
  );
}
