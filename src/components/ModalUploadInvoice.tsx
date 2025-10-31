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
  phone: string;
  email: string;
  month: string;
  year: string;
  energy_value: string;
  invoice_amount: string;
  observations: string;
  // Gerador questions
  hasGenerator: 'S' | 'N' | '';
  generatorMonthlyCost: string;
  generatorMonthlyGeneration: string;
  // Geração Solar questions
  hasSolarGeneration: 'S' | 'N' | '';
  isSolarGenerationSameUnit: 'S' | 'N' | '';
  // B Optante questions
  isBOptante: 'S' | 'N' | '';
  hasGroupAInfrastructure: 'S' | 'N' | '';
  companyActivityArea: string;
  // Mercado Livre questions
  isInFreeMarket: 'S' | 'N' | '';
  contractEndDate: string;
}

export default function ModalUploadInvoice({ isOpen, onClose, onSuccess }: ModalUploadInvoiceProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    consumer_unit: '',
    client_name: '',
    cnpj: '',
    phone: '',
    email: '',
    month: '',
    year: new Date().getFullYear().toString(),
    energy_value: '',
    invoice_amount: '',
    observations: '',
    hasGenerator: '',
    generatorMonthlyCost: '',
    generatorMonthlyGeneration: '',
    hasSolarGeneration: '',
    isSolarGenerationSameUnit: '',
    isBOptante: '',
    hasGroupAInfrastructure: '',
    companyActivityArea: '',
    isInFreeMarket: '',
    contractEndDate: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

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
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail deve ter um formato válido';
    }
    // Validate required Yes/No questions
    if (!formData.hasGenerator) {
      newErrors.hasGenerator = 'Esta pergunta é obrigatória';
    }
    if (!formData.hasSolarGeneration) {
      newErrors.hasSolarGeneration = 'Esta pergunta é obrigatória';
    }
    if (!formData.isBOptante) {
      newErrors.isBOptante = 'Esta pergunta é obrigatória';
    }
    if (!formData.isInFreeMarket) {
      newErrors.isInFreeMarket = 'Esta pergunta é obrigatória';
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

    // Validate conditional fields
    if (formData.hasGenerator === 'S') {
      if (!formData.generatorMonthlyCost.trim()) {
        newErrors.generatorMonthlyCost = 'Gasto por mês é obrigatório quando utiliza gerador';
      } else if (isNaN(parseFloat(formData.generatorMonthlyCost)) || parseFloat(formData.generatorMonthlyCost) <= 0) {
        newErrors.generatorMonthlyCost = 'Gasto por mês deve ser um número positivo';
      }
      if (!formData.generatorMonthlyGeneration.trim()) {
        newErrors.generatorMonthlyGeneration = 'Geração mensal (kWh) é obrigatória quando utiliza gerador';
      } else if (isNaN(parseFloat(formData.generatorMonthlyGeneration)) || parseFloat(formData.generatorMonthlyGeneration) <= 0) {
        newErrors.generatorMonthlyGeneration = 'Geração mensal deve ser um número positivo';
      }
    }

    if (formData.hasSolarGeneration === 'S' && !formData.isSolarGenerationSameUnit) {
      newErrors.isSolarGenerationSameUnit = 'Esta pergunta é obrigatória quando tem geração solar';
    }

    if (formData.isBOptante === 'S') {
      if (formData.hasGroupAInfrastructure === '') {
        newErrors.hasGroupAInfrastructure = 'Esta pergunta é obrigatória quando é B Optante';
      }
      if (!formData.companyActivityArea.trim()) {
        newErrors.companyActivityArea = 'Área de atuação é obrigatória quando é B Optante';
      }
    }

    if (formData.isInFreeMarket === 'S' && !formData.contractEndDate.trim()) {
      newErrors.contractEndDate = 'Data de término do contrato é obrigatória quando já está no Mercado Livre';
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

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `+55 (${numbers.slice(2)})`;
    } else if (numbers.length <= 9) {
      return `+55 (${numbers.slice(2, 4)}) ${numbers.slice(4)}`;
    } else {
      return `+55 (${numbers.slice(2, 4)}) ${numbers.slice(4, 9)}-${numbers.slice(9, 13)}`;
    }
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
      formDataToSend.append('name', formData.client_name); // Map client_name to name
      formDataToSend.append('cnpj', formData.cnpj);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('month', formData.month);
      formDataToSend.append('year', formData.year);
      formDataToSend.append('energy_value', formData.energy_value);
      formDataToSend.append('invoice_amount', formData.invoice_amount);
      
      // Add conditional fields to observations or as separate fields
      let observationsText = formData.observations;
      
      // Build additional info text
      const additionalInfo: string[] = [];
      
      if (formData.hasGenerator) {
        additionalInfo.push(`Utiliza Gerador: ${formData.hasGenerator}`);
        if (formData.hasGenerator === 'S') {
          additionalInfo.push(`Gasto mensal gerador: R$ ${formData.generatorMonthlyCost}`);
          additionalInfo.push(`Geração mensal gerador: ${formData.generatorMonthlyGeneration} kWh`);
        }
      }
      
      if (formData.hasSolarGeneration) {
        additionalInfo.push(`Tem Geração Solar: ${formData.hasSolarGeneration}`);
        if (formData.hasSolarGeneration === 'S' && formData.isSolarGenerationSameUnit) {
          additionalInfo.push(`Geração na mesma unidade: ${formData.isSolarGenerationSameUnit}`);
        }
      }
      
      if (formData.isBOptante) {
        additionalInfo.push(`É B Optante: ${formData.isBOptante}`);
        if (formData.isBOptante === 'S') {
          if (formData.hasGroupAInfrastructure) {
            additionalInfo.push(`Tem infraestrutura Grupo A: ${formData.hasGroupAInfrastructure}`);
          }
          if (formData.companyActivityArea) {
            additionalInfo.push(`Área de atuação: ${formData.companyActivityArea}`);
          }
        }
      }
      
      if (formData.isInFreeMarket) {
        additionalInfo.push(`Já está no Mercado Livre: ${formData.isInFreeMarket}`);
        if (formData.isInFreeMarket === 'S' && formData.contractEndDate) {
          additionalInfo.push(`Término do contrato: ${formData.contractEndDate}`);
        }
      }
      
      if (additionalInfo.length > 0) {
        observationsText = observationsText 
          ? `${observationsText}\n\nInformações Adicionais:\n${additionalInfo.join('\n')}`
          : `Informações Adicionais:\n${additionalInfo.join('\n')}`;
      }
      
      formDataToSend.append('observations', observationsText);
      formDataToSend.append('status', 'appointmentscheduled'); // Set default status

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
      phone: '',
      email: '',
      month: '',
      year: new Date().getFullYear().toString(),
      energy_value: '',
      invoice_amount: '',
      observations: '',
      hasGenerator: '',
      generatorMonthlyCost: '',
      generatorMonthlyGeneration: '',
      hasSolarGeneration: '',
      isSolarGenerationSameUnit: '',
      isBOptante: '',
      hasGroupAInfrastructure: '',
      companyActivityArea: '',
      isInFreeMarket: '',
      contractEndDate: '',
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900 ${
                    errors.consumer_unit ? 'border-red-500' : 'border-gray-300 dark:border-gray-300'
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900 ${
                    errors.client_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-300'
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900 ${
                    errors.cnpj ? 'border-red-500' : 'border-gray-300 dark:border-gray-300'
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
                  Telefone *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-300'
                  }`}
                  placeholder="+55 (11) 99999-9999"
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-mail *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900 ${
                    errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-300'
                  }`}
                  placeholder="cliente@empresa.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.email}
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900 ${
                    errors.month ? 'border-red-500' : 'border-gray-300 dark:border-gray-300'
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900 ${
                    errors.year ? 'border-red-500' : 'border-gray-300 dark:border-gray-300'
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900 ${
                    errors.energy_value ? 'border-red-500' : 'border-gray-300 dark:border-gray-300'
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900 ${
                    errors.invoice_amount ? 'border-red-500' : 'border-gray-300 dark:border-gray-300'
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

            {/* Conditional Questions Section */}
            <div className="space-y-6 pt-4 border-t border-gray-200 dark:border-[#1E1E1E]">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Informações Adicionais</h3>
              
              {/* Gerador Question */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  O cliente utiliza Gerador? *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hasGenerator"
                      value="S"
                      checked={formData.hasGenerator === 'S'}
                      onChange={(e) => handleInputChange('hasGenerator', e.target.value)}
                      className="text-[#FE5200] focus:ring-[#FE5200]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Sim</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hasGenerator"
                      value="N"
                      checked={formData.hasGenerator === 'N'}
                      onChange={(e) => handleInputChange('hasGenerator', e.target.value)}
                      className="text-[#FE5200] focus:ring-[#FE5200]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Não</span>
                  </label>
                </div>
                {errors.hasGenerator && (
                  <p className="text-red-500 text-xs flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.hasGenerator}
                  </p>
                )}
                {formData.hasGenerator === 'S' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Qual o gasto por mês em R$? *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.generatorMonthlyCost}
                        onChange={(e) => handleInputChange('generatorMonthlyCost', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900 ${
                          errors.generatorMonthlyCost ? 'border-red-500' : 'border-gray-300 dark:border-gray-300'
                        }`}
                        placeholder="0.00"
                        min="0"
                      />
                      {errors.generatorMonthlyCost && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle size={12} className="mr-1" />
                          {errors.generatorMonthlyCost}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Quanto gera por mês (kWh)? *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.generatorMonthlyGeneration}
                        onChange={(e) => handleInputChange('generatorMonthlyGeneration', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900 ${
                          errors.generatorMonthlyGeneration ? 'border-red-500' : 'border-gray-300 dark:border-gray-300'
                        }`}
                        placeholder="0.00"
                        min="0"
                      />
                      {errors.generatorMonthlyGeneration && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle size={12} className="mr-1" />
                          {errors.generatorMonthlyGeneration}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Geração Solar Question */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  O cliente tem Geração Solar? *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hasSolarGeneration"
                      value="S"
                      checked={formData.hasSolarGeneration === 'S'}
                      onChange={(e) => handleInputChange('hasSolarGeneration', e.target.value)}
                      className="text-[#FE5200] focus:ring-[#FE5200]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Sim</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hasSolarGeneration"
                      value="N"
                      checked={formData.hasSolarGeneration === 'N'}
                      onChange={(e) => handleInputChange('hasSolarGeneration', e.target.value)}
                      className="text-[#FE5200] focus:ring-[#FE5200]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Não</span>
                  </label>
                </div>
                {errors.hasSolarGeneration && (
                  <p className="text-red-500 text-xs flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.hasSolarGeneration}
                  </p>
                )}
                {formData.hasSolarGeneration === 'S' && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      A geração é nesta mesma unidade? *
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="isSolarGenerationSameUnit"
                          value="S"
                          checked={formData.isSolarGenerationSameUnit === 'S'}
                          onChange={(e) => handleInputChange('isSolarGenerationSameUnit', e.target.value)}
                          className="text-[#FE5200] focus:ring-[#FE5200]"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Sim</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="isSolarGenerationSameUnit"
                          value="N"
                          checked={formData.isSolarGenerationSameUnit === 'N'}
                          onChange={(e) => handleInputChange('isSolarGenerationSameUnit', e.target.value)}
                          className="text-[#FE5200] focus:ring-[#FE5200]"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Não</span>
                      </label>
                    </div>
                    {errors.isSolarGenerationSameUnit && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <AlertCircle size={12} className="mr-1" />
                        {errors.isSolarGenerationSameUnit}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* B Optante Question */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  O cliente é B Optante? *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isBOptante"
                      value="S"
                      checked={formData.isBOptante === 'S'}
                      onChange={(e) => handleInputChange('isBOptante', e.target.value)}
                      className="text-[#FE5200] focus:ring-[#FE5200]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Sim</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isBOptante"
                      value="N"
                      checked={formData.isBOptante === 'N'}
                      onChange={(e) => handleInputChange('isBOptante', e.target.value)}
                      className="text-[#FE5200] focus:ring-[#FE5200]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Não</span>
                  </label>
                </div>
                {errors.isBOptante && (
                  <p className="text-red-500 text-xs flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.isBOptante}
                  </p>
                )}
                {formData.isBOptante === 'S' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tem infraestrutura de grupo A (transformador próprio)? *
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="hasGroupAInfrastructure"
                            value="S"
                            checked={formData.hasGroupAInfrastructure === 'S'}
                            onChange={(e) => handleInputChange('hasGroupAInfrastructure', e.target.value)}
                            className="text-[#FE5200] focus:ring-[#FE5200]"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Sim</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="hasGroupAInfrastructure"
                            value="N"
                            checked={formData.hasGroupAInfrastructure === 'N'}
                            onChange={(e) => handleInputChange('hasGroupAInfrastructure', e.target.value)}
                            className="text-[#FE5200] focus:ring-[#FE5200]"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Não</span>
                        </label>
                      </div>
                      {errors.hasGroupAInfrastructure && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle size={12} className="mr-1" />
                          {errors.hasGroupAInfrastructure}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Qual a área de atuação da empresa? *
                      </label>
                      <input
                        type="text"
                        value={formData.companyActivityArea}
                        onChange={(e) => handleInputChange('companyActivityArea', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900 ${
                          errors.companyActivityArea ? 'border-red-500' : 'border-gray-300 dark:border-gray-300'
                        }`}
                        placeholder="Ex: Indústria, Comércio, Serviços..."
                      />
                      {errors.companyActivityArea && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle size={12} className="mr-1" />
                          {errors.companyActivityArea}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mercado Livre Question */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  O cliente já está no Mercado Livre? *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isInFreeMarket"
                      value="S"
                      checked={formData.isInFreeMarket === 'S'}
                      onChange={(e) => handleInputChange('isInFreeMarket', e.target.value)}
                      className="text-[#FE5200] focus:ring-[#FE5200]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Sim</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isInFreeMarket"
                      value="N"
                      checked={formData.isInFreeMarket === 'N'}
                      onChange={(e) => handleInputChange('isInFreeMarket', e.target.value)}
                      className="text-[#FE5200] focus:ring-[#FE5200]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Não</span>
                  </label>
                </div>
                {errors.isInFreeMarket && (
                  <p className="text-red-500 text-xs flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.isInFreeMarket}
                  </p>
                )}
                {formData.isInFreeMarket === 'S' && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quando acaba o contrato? *
                    </label>
                    <input
                      type="date"
                      value={formData.contractEndDate}
                      onChange={(e) => handleInputChange('contractEndDate', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900 ${
                        errors.contractEndDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-300'
                      }`}
                    />
                    {errors.contractEndDate && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <AlertCircle size={12} className="mr-1" />
                        {errors.contractEndDate}
                      </p>
                    )}
                  </div>
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900"
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

