import React, { useState, useEffect, useRef } from "react";
import {
  X,
  FolderArchive,
  Search,
  Sparkles,
  Image as ImageIcon,
  Play,
  Edit3,
  Download,
  Trash2,
  Upload,
  FileJson,
  CheckCircle2,
  Calendar,
  Layers,
  Sliders,
  AlertCircle,
  HardDrive,
  BookmarkPlus,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { SavedScanimationItem, SavedScanimationType } from "../types";
import {
  getAllSavedItems,
  deleteSavedItem,
  clearAllSavedItems,
  exportSaveStationBackup,
  importSaveStationBackup,
} from "../utils/saveStationStorage";
import { loadImage, generatePrintableKit } from "../utils/scanimationEngine";

interface SaveStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadIntoTheater: (item: SavedScanimationItem) => void;
  onOpenInFrameEditor: (item: SavedScanimationItem) => void;
  onTriggerSaveCurrent: () => void;
  hasActiveComposite: boolean;
  activeItemCountChange?: number;
}

export const SaveStationModal: React.FC<SaveStationModalProps> = ({
  isOpen,
  onClose,
  onLoadIntoTheater,
  onOpenInFrameEditor,
  onTriggerSaveCurrent,
  hasActiveComposite,
}) => {
  const [items, setItems] = useState<SavedScanimationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<"all" | SavedScanimationType>("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshItems = async () => {
    setIsLoading(true);
    try {
      const data = await getAllSavedItems();
      setItems(data);
    } catch (e) {
      console.error("Failed to load saved items:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshItems();
      setDeleteConfirmId(null);
    }
  }, [isOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSavedItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setDeleteConfirmId(null);
      showToast("Scanimation removed from station");
    } catch (e) {
      console.error("Failed to delete item:", e);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to clear all saved scanimations from this browser?")) {
      try {
        await clearAllSavedItems();
        setItems([]);
        showToast("Save station cleared");
      } catch (e) {
        console.error("Failed to clear station:", e);
      }
    }
  };

  const handleExportBackup = async () => {
    try {
      const jsonStr = await exportSaveStationBackup();
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scanimation_station_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Station backup exported!");
    } catch (e) {
      console.error("Failed to export backup:", e);
      alert("Export failed");
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const count = await importSaveStationBackup(text);
        await refreshItems();
        showToast(`Successfully imported ${count} scanimation(s)!`);
      } catch (err: any) {
        alert(`Import error: ${err.message || "Invalid JSON backup file"}`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadAsset = (dataUrl: string, filename: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };

  const handleDownloadPrintKit = async (item: SavedScanimationItem) => {
    try {
      const compImg = await loadImage(item.compositeDataUrl);
      const gratImg = await loadImage(item.gratingDataUrl);

      const compCanvas = document.createElement("canvas");
      compCanvas.width = item.dimensions.width;
      compCanvas.height = item.dimensions.height;
      compCanvas.getContext("2d")?.drawImage(compImg, 0, 0);

      const gratCanvas = document.createElement("canvas");
      gratCanvas.width = item.dimensions.width;
      gratCanvas.height = item.dimensions.height;
      gratCanvas.getContext("2d")?.drawImage(gratImg, 0, 0);

      const kitCanvas = generatePrintableKit(
        compCanvas,
        gratCanvas,
        item.slitWidth,
        item.frameCount
      );

      downloadAsset(
        kitCanvas.toDataURL("image/png"),
        `${item.title.replace(/\s+/g, "_")}_print_kit.png`
      );
      showToast("Printable DIY Kit downloaded!");
    } catch (e) {
      console.error("Failed to generate print kit for download:", e);
      // Fallback: download composite
      downloadAsset(
        item.compositeDataUrl,
        `${item.title.replace(/\s+/g, "_")}_composite.png`
      );
    }
  };

  if (!isOpen) return null;

  // Filtering
  const filteredItems = items.filter((item) => {
    const matchesFilter = filterType === "all" || item.type === filterType;
    const matchesSearch =
      searchQuery.trim() === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.tags && item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesFilter && matchesSearch;
  });

  const generatedCount = items.filter((i) => i.type === "generated").length;
  const uploadedCount = items.filter((i) => i.type === "uploaded").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30 shadow-inner">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-['Space_Grotesk'] text-white">
                  Scanimation Save Station
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono font-bold border border-slate-700">
                  {items.length} Saved
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Persistent vault for both custom generated animations and uploaded scanimated artwork
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {hasActiveComposite && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onTriggerSaveCurrent();
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Save Current Work</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportBackup}
              disabled={items.length === 0}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
              title="Export all saved items to a JSON backup file"
            >
              <FileJson className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Export Backup</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Import items from a JSON backup file"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Import</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportFile}
            />

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterType === "all"
                  ? "bg-slate-800 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("generated")}
              className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                filterType === "generated"
                  ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Generated ({generatedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType("uploaded")}
              className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                filterType === "uploaded"
                  ? "bg-sky-400/20 text-sky-300 border border-sky-400/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ImageIcon className="w-3 h-3 text-sky-400" />
              <span>Uploaded ({uploadedCount})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search title, notes, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/60"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Notification Toast */}
        {toastMessage && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2 flex items-center gap-2 text-xs text-emerald-300 animate-in slide-in-from-top">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Gallery Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
              <span>Accessing local save station vault...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-500">
                <HardDrive className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-200">
                  {searchQuery
                    ? "No matching scanimations found"
                    : filterType !== "all"
                    ? `No ${filterType} scanimations in station yet`
                    : "Your Save Station is currently empty"}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {searchQuery
                    ? "Try adjusting your search terms or filter selection."
                    : "Save any generated 5-frame animation or uploaded scanimated image to quickly reload, edit, or download it whenever you return."}
                </p>
              </div>

              {hasActiveComposite && !searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onTriggerSaveCurrent();
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  <span>Save Currently Open Scanimation</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems.map((item) => {
                const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <div
                    key={item.id}
                    className="group bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between shadow-lg transition-all hover:shadow-xl hover:translate-y-[-2px]"
                  >
                    <div>
                      {/* Card Thumbnail Stage */}
                      <div className="relative w-full aspect-square rounded-xl bg-black border border-slate-800 overflow-hidden mb-3 group-hover:border-slate-700 flex items-center justify-center">
                        <img
                          src={item.thumbnailDataUrl || item.compositeDataUrl}
                          alt={item.title}
                          className="w-full h-full object-contain"
                        />

                        {/* Slit pitch tag overlay */}
                        <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono font-bold text-amber-300 border border-slate-800">
                          {item.slitWidth.toFixed(2)}px pitch
                        </div>

                        {/* Type Badge */}
                        <div className="absolute top-2 right-2">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase font-mono tracking-wider border ${
                              item.type === "generated"
                                ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
                                : "bg-sky-400/20 text-sky-300 border-sky-400/40"
                            }`}
                          >
                            {item.type === "generated" ? "Generated" : "Uploaded"}
                          </span>
                        </div>

                        {/* Hover Quick Action Overlay */}
                        <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                          <button
                            type="button"
                            onClick={() => {
                              onLoadIntoTheater(item);
                              onClose();
                            }}
                            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/30 transition cursor-pointer"
                            title="Load into Scanimation Theater for playback"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Play in Theater</span>
                          </button>
                        </div>
                      </div>

                      {/* Title & Metadata */}
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-white font-['Space_Grotesk'] line-clamp-1">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>{dateStr}</span>
                          </span>
                          <span>•</span>
                          <span>{item.frameCount} frames</span>
                          <span>•</span>
                          <span>{item.dimensions.width}×{item.dimensions.height}</span>
                        </div>

                        {item.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 pt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onLoadIntoTheater(item);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="Load into Scanimation Theater"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Load</span>
                        </button>

                        {item.frames && item.frames.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenInFrameEditor(item);
                              onClose();
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            title="Edit frames in 5-frame workspace"
                          >
                            <Edit3 className="w-3 h-3 text-sky-400" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                        )}

                        {/* Download Menu */}
                        <button
                          type="button"
                          onClick={() => handleDownloadPrintKit(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                          title="Download Printable DIY Kit"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                      </div>

                      {/* Delete Action with inline confirm */}
                      <div>
                        {deleteConfirmId === item.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="px-2 py-1 rounded bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold transition cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-1.5 py-1 rounded bg-slate-800 text-slate-400 hover:text-white text-[10px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                            title="Delete scanimation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info & Clear Station */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span>Storage: IndexedDB Persistent Storage (survives tab/browser reloads)</span>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-slate-500 hover:text-rose-400 text-xs transition cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear All Station Data</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
