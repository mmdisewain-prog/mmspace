import React from 'react';
import { X, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface PreviewModalProps {
  title: string;
  imageUrl: string;
  driveUrl?: string;
  onClose: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  title,
  imageUrl,
  driveUrl,
  onClose,
}) => {
  if (!imageUrl && !driveUrl) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-5 space-y-4 border border-gray-200 my-auto">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-center items-center bg-gray-50 p-2 rounded-xl max-h-[65vh] overflow-auto border border-gray-200">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="max-w-full h-auto max-h-[60vh] object-contain rounded-lg shadow-sm"
            />
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p className="text-sm">Dokumen tersimpan di Google Drive</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          {driveUrl && (
            <a
              href={driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition border border-blue-200"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Buka di Google Drive
            </a>
          )}
          <button
            onClick={onClose}
            className="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-2.5 rounded-xl text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
