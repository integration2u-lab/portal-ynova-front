import React, { useState } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequestWithAuth } from '../utils/api';

interface ModalUploadInvoiceProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (lead: any) => void;
}

interface FormData {
  consumer_unit: string;
  client_name: string;
  cnpj: string;
  month: string;
  year: string;
  energy_value: string;
  invoice_amount: string;
  observations: string;
}

export default function ModalUploadInvoice({ isOpen, onClose, onSuccess }: ModalUploadInvoiceProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    consumer_unit: '',
    client_name: '',
    cnpj: '',
    month: '',
    year: new Date().getFullYear().toString(),
    energy_value: '',
    invoice_amount: '',
    observations: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.consumer_unit.trim()) {
      newErrors.consumer_unit = 'Unidade consumidora é obrigatória';
    }
    if (!formData.client_name.trim()) {
      newErrors.client_name = 'Nome do cliente é obrigatório';
    }
    if (!formData.cnpj.trim()) {
      newErrors.cnpj = 'CNPJ é obrigatório';
    } else if (!/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(formData.cnpj)) {
      newErrors.cnpj = 'CNPJ deve estar no formato 00.000.000/0000-00';
    }
    if (!formData.month.trim()) {
      newErrors.month = 'Mês é obrigatório';
    }
    if (!formData.year.trim()) {
      newErrors.year = 'Ano é obrigatório';
    }
    if (!formData.energy_value.trim()) {
      newErrors.energy_value = 'Valor da energia é obrigatório';
    } else if (isNaN(parseFloat(formData.energy_value)) || parseFloat(formData.energy_value) <= 0) {
      newErrors.energy_value = 'Valor da energia deve ser um número positivo';
    }
    if (!formData.invoice_amount.trim()) {
      newErrors.invoice_amount = 'Valor da fatura é obrigatório';
    } else if (isNaN(parseFloat(formData.invoice_amount)) || parseFloat(formData.invoice_amount) <= 0) {
      newErrors.invoice_amount = 'Valor da fatura deve ser um número positivo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileSelect = (file: File) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use PDF, JPG ou PNG.');
      return;
    }

    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Tamanho máximo: 10MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Por favor, selecione um arquivo');
      return;
    }

    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setIsUploading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', selectedFile);
      formDataToSend.append('consumer_unit', formData.consumer_unit);
      formDataToSend.append('client_name', formData.client_name);
      formDataToSend.append('cnpj', formData.cnpj);
      formDataToSend.append('month', formData.month);
      formDataToSend.append('year', formData.year);
      formDataToSend.append('energy_value', formData.energy_value);
      formDataToSend.append('invoice_amount', formData.invoice_amount);
      formDataToSend.append('observations', formData.observations);

      const response = await apiRequestWithAuth('/leads', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar fatura');
      }

      const result = await response.json();
      toast.success('Fatura enviada com sucesso!');
      onSuccess?.(result.data);
      handleClose();
    } catch (error) {
      console.error('Error uploading invoice:', error);
      toast.error('Erro ao enviar fatura. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setFormData({
      consumer_unit: '',
      client_name: '',
      cnpj: '',
      month: '',
      year: new Date().getFullYear().toString(),
      energy_value: '',
      invoice_amount: '',
      observations: '',
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-[#3E3E3E] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Enviar Fatura</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Arquivo da Fatura *
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragging
                    ? 'border-[#FE5200] bg-[#FE5200]/10 dark:bg-[#FE5200]/20'
                    : 'border-gray-300 dark:border-[#1E1E1E]'
                }`}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center space-x-3">
                    <FileText className="text-[#FE5200]" size={24} />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto text-gray-400 dark:text-gray-300 mb-2" size={32} />
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      Arraste e solte o arquivo PDF/PNG/JPG aqui
                    </p>
                    <input
                      id="invoice-upload"
                      type="file"
                      accept="application/pdf,image/png,image/jpeg,image/jpg"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                    <label
                      htmlFor="invoice-upload"
                      className="inline-block px-4 py-2 bg-[#FE5200] hover:bg-[#FE5200]/90 text-white rounded-lg cursor-pointer text-sm"
                    >
                      Selecionar arquivo
                    </label>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Formatos aceitos: PDF, PNG, JPG. Tamanho máximo: 10MB
              </p>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Unidade Consumidora *
                </label>
                <input
                  type="text"
                  value={formData.consumer_unit}
                  onChange={(e) => handleInputChange('consumer_unit', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-[#3E3E3E] text-gray-900 dark:text-gray-100 ${
                    errors.consumer_unit ? 'border-red-500' : 'border-gray-300 dark:border-[#1E1E1E]'
                  }`}
                  placeholder="Ex: 123456789"
                />
                {errors.consumer_unit && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.consumer_unit}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => handleInputChange('client_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-[#3E3E3E] text-gray-900 dark:text-gray-100 ${
                    errors.client_name ? 'border-red-500' : 'border-gray-300 dark:border-[#1E1E1E]'
                  }`}
                  placeholder="Ex: Empresa ABC Ltda"
                />
                {errors.client_name && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.client_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CNPJ *
                </label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => handleInputChange('cnpj', formatCNPJ(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-[#3E3E3E] text-gray-900 dark:text-gray-100 ${
                    errors.cnpj ? 'border-red-500' : 'border-gray-300 dark:border-[#1E1E1E]'
                  }`}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
                {errors.cnpj && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.cnpj}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mês *
                </label>
                <select
                  value={formData.month}
                  onChange={(e) => handleInputChange('month', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-[#3E3E3E] text-gray-900 dark:text-gray-100 ${
                    errors.month ? 'border-red-500' : 'border-gray-300 dark:border-[#1E1E1E]'
                  }`}
                >
                  <option value="">Selecione o mês</option>
                  <option value="Janeiro">Janeiro</option>
                  <option value="Fevereiro">Fevereiro</option>
                  <option value="Março">Março</option>
                  <option value="Abril">Abril</option>
                  <option value="Maio">Maio</option>
                  <option value="Junho">Junho</option>
                  <option value="Julho">Julho</option>
                  <option value="Agosto">Agosto</option>
                  <option value="Setembro">Setembro</option>
                  <option value="Outubro">Outubro</option>
                  <option value="Novembro">Novembro</option>
                  <option value="Dezembro">Dezembro</option>
                </select>
                {errors.month && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.month}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ano *
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-[#3E3E3E] text-gray-900 dark:text-gray-100 ${
                    errors.year ? 'border-red-500' : 'border-gray-300 dark:border-[#1E1E1E]'
                  }`}
                  placeholder="2025"
                  min="2020"
                  max="2030"
                />
                {errors.year && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.year}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor da Energia (kWh) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.energy_value}
                  onChange={(e) => handleInputChange('energy_value', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-[#3E3E3E] text-gray-900 dark:text-gray-100 ${
                    errors.energy_value ? 'border-red-500' : 'border-gray-300 dark:border-[#1E1E1E]'
                  }`}
                  placeholder="0.00"
                  min="0"
                />
                {errors.energy_value && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.energy_value}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor da Fatura (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.invoice_amount}
                  onChange={(e) => handleInputChange('invoice_amount', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-[#3E3E3E] text-gray-900 dark:text-gray-100 ${
                    errors.invoice_amount ? 'border-red-500' : 'border-gray-300 dark:border-[#1E1E1E]'
                  }`}
                  placeholder="0.00"
                  min="0"
                />
                {errors.invoice_amount && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.invoice_amount}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Observações
              </label>
              <textarea
                value={formData.observations}
                onChange={(e) => handleInputChange('observations', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-[#3E3E3E] text-gray-900 dark:text-gray-100"
                placeholder="Observações adicionais sobre a fatura..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-[#1E1E1E]">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-[#3E3E3E] border border-gray-300 dark:border-[#1E1E1E] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1E1E1E] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isUploading || !selectedFile}
                className="px-4 py-2 bg-[#FE5200] hover:bg-[#FE5200]/90 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>Enviar Fatura</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

