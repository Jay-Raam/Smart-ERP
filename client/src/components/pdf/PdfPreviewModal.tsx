import React from 'react';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { X, Download, Printer } from 'lucide-react';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fileName: string;
  document: React.ReactElement<any>;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  fileName,
  document,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative flex flex-col w-full max-w-5xl h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500">Vector PDF Document Preview</p>
          </div>

          <div className="flex items-center gap-2">
            <PDFDownloadLink
              document={document}
              fileName={fileName}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-xs"
            >
              {({ loading }) => (
                <>
                  <Download className="h-4 w-4" />
                  <span>{loading ? 'Preparing...' : 'Download PDF'}</span>
                </>
              )}
            </PDFDownloadLink>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Body */}
        <div className="flex-1 w-full h-full bg-slate-100 p-2 overflow-hidden">
          <PDFViewer width="100%" height="100%" showToolbar={true} className="rounded-lg border border-slate-200">
            {document}
          </PDFViewer>
        </div>
      </div>
    </div>
  );
};
