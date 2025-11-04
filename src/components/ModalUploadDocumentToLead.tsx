import React, { useState } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { uploadLeadDocument } from '../utils/api';

interface ModalUploadDocumentToLeadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  leadId: string;
  leadName: string;
}

const DOCUMENT_TYPES = [
  'Nota Fiscal',
  'Contrato',
  'Apresentação',
  'Documento pessoal',
  'Contrato Social'
] as const;

export default function ModalUploadDocumentToLead({ 
  isOpen, 
  onClose, 
  onSuccess, 
  leadId, 
  leadName 
}: ModalUploadDocumentToLeadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>(DOCUMENT_TYPES[0]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (file: File | null) => {
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de arquivo não suportado. Use PDF, JPG, PNG ou WEBP.');
        return;
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error('Arquivo muito grande. Tamanho máximo: 10MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Por favor, selecione um arquivo');
      return;
    }

    if (!documentType) {
      toast.error('Por favor, selecione o tipo de documento');
      return;
    }

    setIsUploading(true);

    try {
      await uploadLeadDocument(leadId, selectedFile, documentType);
      toast.success('Documento enviado com sucesso!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar documento');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      setDocumentType(DOCUMENT_TYPES[0]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Enviar Documento</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="text-gray-400 transition hover:text-gray-600 disabled:cursor-not-allowed"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Lead: <span className="font-medium text-gray-900">{leadName}</span>
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="document-type" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Documento
            </label>
            <select
              id="document-type"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              disabled={isUploading}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label
              htmlFor="document-file"
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition hover:border-[#ff6b35] hover:bg-gray-100"
            >
              <input
                id="document-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileInput}
                disabled={isUploading}
                className="hidden"
              />
              {selectedFile ? (
                <div className="flex flex-col items-center">
                  <FileText className="h-12 w-12 text-[#ff6b35] mb-2" />
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-900">
                    Clique para selecionar um arquivo
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, JPG, PNG ou WEBP (máx. 10MB)
                  </p>
                </div>
              )}
            </label>
            {selectedFile && (
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                disabled={isUploading}
                className="mt-2 text-xs text-red-600 hover:text-red-800 disabled:cursor-not-allowed"
              >
                Remover arquivo
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="flex-1 rounded-lg bg-[#ff6b35] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#e85f2f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Enviando...
                </div>
              ) : (
                'Enviar Documento'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
