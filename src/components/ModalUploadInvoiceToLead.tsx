import React, { useState } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { uploadLeadInvoice } from '../utils/api';

interface ModalUploadInvoiceToLeadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  leadId: string;
  leadName: string;
}

export default function ModalUploadInvoiceToLead({ 
  isOpen, 
  onClose, 
  onSuccess, 
  leadId, 
  leadName 
}: ModalUploadInvoiceToLeadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

    setIsUploading(true);

    try {
      await uploadLeadInvoice(leadId, selectedFile);
      toast.success('Fatura enviada com sucesso!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error uploading invoice:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar fatura');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Enviar Fatura</h2>
            <p className="text-sm text-gray-600">Adicionar fatura para: {leadName}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arquivo da Fatura
            </label>
            <div className="relative">
              <input
                type="file"
                id="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileInput}
                disabled={isUploading}
                className="sr-only"
              />
              <label
                htmlFor="file"
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                  selectedFile
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 hover:border-[#ff6b35] hover:bg-gray-50'
                } ${isUploading ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                {selectedFile ? (
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-green-600" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-green-700">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-green-600">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">
                        Clique para selecionar um arquivo
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, JPG, PNG ou WEBP (máx. 10MB)
                      </p>
                    </div>
                  </div>
                )}
              </label>
            </div>
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
                'Enviar Fatura'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
