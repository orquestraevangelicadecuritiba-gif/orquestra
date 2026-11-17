import { Download, X } from 'lucide-react';

interface PdfPreviewModalProps {
  url: string | null;
  title: string;
  fileName: string;
  onClose: () => void;
}

export function PdfPreviewModal({ url, title, fileName, onClose }: PdfPreviewModalProps) {
  if (!url) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Visualização de partitura: ${title}`}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-[#FBF9F5] border border-[#DED6C8] rounded-3xl shadow-2xl w-full max-w-4xl h-[86vh] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E7E0D3] flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-[#78716C]">
              Acervo Privado · PDF Autorizado
            </p>
            <h3 className="font-display text-lg sm:text-xl font-semibold text-[#1C1917] truncate">
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href={url}
              download={fileName}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl btn-raised-sm-primary"
            >
              <Download className="w-4 h-4" />
              <span>Baixar PDF</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar visualização"
              className="w-10 h-10 rounded-xl btn-raised-sm-surface inline-flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-[#E7E0D3]/50 p-3 sm:p-4">
          <iframe
            src={url}
            title={title}
            className="w-full h-full rounded-2xl border border-[#DED6C8] bg-white"
          />
        </div>
      </div>
    </div>
  );
}
