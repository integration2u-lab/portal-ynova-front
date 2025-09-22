import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, User, FileText, AlertCircle } from 'lucide-react';
import { commissionService } from '../services/commissionService';
import { userService } from '../services/userService';
import { User as UserType } from '../types';

interface CommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  consultant_id: string;
  reference_month: string;
  gross_amount: string;
  notes: string;
  status: string;
}

interface FormErrors {
  consultant_id?: string;
  reference_month?: string;
  gross_amount?: string;
  status?: string;
}

export default function CommissionModal({ isOpen, onClose, onSuccess }: CommissionModalProps) {
  const [formData, setFormData] = useState<FormData>({
    consultant_id: '',
    reference_month: '',
    gross_amount: '',
    notes: '',
    status: 'aguardando_nf',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consultants, setConsultants] = useState<UserType[]>([]);
  const [loadingConsultants, setLoadingConsultants] = useState(false);

  // Load consultants when modal opens
  useEffect(() => {
    if (isOpen) {
      loadConsultants();
    }
  }, [isOpen]);

  const loadConsultants = async () => {
    try {
      setLoadingConsultants(true);
      const response = await userService.getUsers({ role: 'consultant', limit: 100 });
      if (response.success) {
        setConsultants(response.data.users);
      }
    } catch (error) {
      console.error('Error loading consultants:', error);
    } finally {
      setLoadingConsultants(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.consultant_id) {
      newErrors.consultant_id = 'Selecione um consultor';
    }

    if (!formData.reference_month) {
      newErrors.reference_month = 'Selecione o mês de referência';
    } else if (!/^\d{4}-\d{2}$/.test(formData.reference_month)) {
      newErrors.reference_month = 'Formato deve ser YYYY-MM';
    }

    if (!formData.gross_amount) {
      newErrors.gross_amount = 'Digite o valor da comissão';
    } else if (isNaN(parseFloat(formData.gross_amount)) || parseFloat(formData.gross_amount) <= 0) {
      newErrors.gross_amount = 'Valor deve ser um número positivo';
    }

    if (!formData.status) {
      newErrors.status = 'Selecione um status';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const commissionData = {
        reference_month: formData.reference_month,
        gross_amount: parseFloat(formData.gross_amount),
        notes: formData.notes || undefined,
        status: formData.status,
        consultant_id: formData.consultant_id,
      };

      const response = await commissionService.createCommission(commissionData);
      
      if (response.success) {
        onSuccess();
        handleClose();
      }
    } catch (error) {
      console.error('Error creating commission:', error);
      // You might want to show a toast error here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      consultant_id: '',
      reference_month: '',
      gross_amount: '',
      notes: '',
      status: 'aguardando_nf',
    });
    setErrors({});
    onClose();
  };

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    // Generate options for the last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const value = `${year}-${month}`;
      const label = date.toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: 'long' 
      });
      options.push({ value, label });
    }
    
    return options;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-[#1a1f24] rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#2b3238]">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Lançar Comissão
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Consultant Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              Consultor *
            </label>
            <select
              value={formData.consultant_id}
              onChange={(e) => setFormData(prev => ({ ...prev, consultant_id: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-[#20262c] text-gray-900 dark:text-gray-100 ${
                errors.consultant_id 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-[#2b3238]'
              }`}
              disabled={loadingConsultants}
            >
              <option value="">
                {loadingConsultants ? 'Carregando consultores...' : 'Selecione um consultor'}
              </option>
              {consultants.map((consultant) => (
                <option key={consultant.id} value={consultant.id}>
                  {consultant.name} {consultant.surname}
                </option>
              ))}
            </select>
            {errors.consultant_id && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.consultant_id}
              </p>
            )}
          </div>

          {/* Reference Month */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Mês de Referência *
            </label>
            <select
              value={formData.reference_month}
              onChange={(e) => setFormData(prev => ({ ...prev, reference_month: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-[#20262c] text-gray-900 dark:text-gray-100 ${
                errors.reference_month 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-[#2b3238]'
              }`}
            >
              <option value="">Selecione o mês</option>
              {generateMonthOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.reference_month && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.reference_month}
              </p>
            )}
          </div>

          {/* Gross Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <DollarSign className="inline h-4 w-4 mr-1" />
              Valor da Comissão (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.gross_amount}
              onChange={(e) => setFormData(prev => ({ ...prev, gross_amount: e.target.value }))}
              placeholder="0,00"
              className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-[#20262c] text-gray-900 dark:text-gray-100 ${
                errors.gross_amount 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-[#2b3238]'
              }`}
            />
            {errors.gross_amount && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.gross_amount}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-[#20262c] text-gray-900 dark:text-gray-100 ${
                errors.status 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-[#2b3238]'
              }`}
            >
              <option value="aguardando_nf">Aguardando NF</option>
              <option value="aprovada">Aprovada</option>
              <option value="paga">Paga</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.status}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="inline h-4 w-4 mr-1" />
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações adicionais (opcional)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#2b3238] rounded-lg text-sm bg-white dark:bg-[#20262c] text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#2b3238] hover:bg-gray-200 dark:hover:bg-[#3a4046] rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Lançando...
                </>
              ) : (
                'Lançar Comissão'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
