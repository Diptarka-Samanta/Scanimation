import React from "react";
import { X, Printer, Download, Eye, Check } from "lucide-react";

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  printKitDataUrl: string | null;
  compositeDataUrl: string | null;
  gratingDataUrl: string | null;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  printKitDataUrl,
  compositeDataUrl,
  gratingDataUrl,
}) => {
  if (!isOpen) return null;

  const downloadFile = (dataUrl: string | null, filename: string) => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    if (!printKitDataUrl) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Scanimation DIY Kit</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body { margin: 0; display: flex; justify-content: center; align-items: center; background: #fff; }
            img { max-width: 100%; height: auto; display: block; }
          </style>
        </head>
        <body>
          <img src="${printKitDataUrl}" onload="window.print();window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col text-slate-200 shadow-2xl p-6 relative">
        <button
          id="close-print-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-['Space_Grotesk'] text-white">
              DIY Physical Scanimation Print Studio
            </h2>
            <p className="text-xs text-slate-400">
              Print on real paper and transparent acetate film to hold the physical illusion in your hands
            </p>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-center min-h-[300px]">
          {printKitDataUrl ? (
            <img
              src={printKitDataUrl}
              alt="Printable Scanimation Kit"
              className="max-h-[500px] w-auto object-contain rounded-lg shadow-lg border border-slate-800 bg-white"
            />
          ) : (
            <div className="text-xs text-slate-500">Generating print layout...</div>
          )}
        </div>

        {/* Download Options & Print Action */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => downloadFile(compositeDataUrl, "scanimation-base-art.png")}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
              title="Download only the interlaced base image (for cardstock)"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Base Art (Cardstock)</span>
            </button>
            <button
              onClick={() => downloadFile(gratingDataUrl, "scanimation-grating-sheet.png")}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
              title="Download only the barrier grating (transparent PNG for acetate)"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Barrier Grating (Acetate)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => downloadFile(printKitDataUrl, "scanimation-diy-kit.png")}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download Full Kit PNG</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-bold font-['Space_Grotesk'] bg-amber-400 hover:bg-amber-300 text-slate-950 transition cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>Print Kit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
