import React, { useState, useEffect, useCallback } from 'react';
import { Upload, X, FileText, Download, AlertCircle, RefreshCcw, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '../contexts/UserContext';
import { userService } from '../services/userService';
import {
  getMyPartnerInvoices,
  getAllPartnerInvoices,
  uploadMyPartnerInvoice,
  uploadPartnerInvoiceForPartner,
  getPartnerInvoiceSignedUrl,
} from '../utils/api';
import type { PartnerInvoice, User } from '../types';

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i < 6; i++) {
    years.push(currentYear - i);
  }
  return years;
};

const formatCurrency = (value: string | number) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function PartnerInvoicesPage() {
  const { user, isAdmin } = useUser();
  const [invoices, setInvoices] = useState<PartnerInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filterMonth, setFilterMonth] = useState<number | ''>('');
  const [filterYear, setFilterYear] = useState<number | ''>('');
  const [filterPartner, setFilterPartner] = useState<string>('');
  const [partners, setPartners] = useState<User[]>([]);

  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMonth, setUploadMonth] = useState<number | ''>('');
  const [uploadYear, setUploadYear] = useState<number | ''>('');
  const [uploadAmount, setUploadAmount] = useState<string>('');
  const [uploadPartnerId, setUploadPartnerId] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // Pagination (for admin)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);

  // Load partners for admin
  useEffect(() => {
    if (isAdmin) {
      userService
        .getUsers({ role: 'consultant', limit: 100 })
        .then((response) => {
          if (response.success) {
            setPartners(response.data.users);
          }
        })
        .catch((error) => {
          console.error('Error loading partners:', error);
          toast.error('Erro ao carregar lista de parceiros');
        });
    }
  }, [isAdmin]);

  // Load invoices
  const loadInvoices = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params: any = {};
      if (filterMonth) params.reference_month = filterMonth;
      if (filterYear) params.reference_year = filterYear;

      let response;
      if (isAdmin) {
        params.page = currentPage;
        params.limit = 20;
        if (filterPartner) params.partner_id = filterPartner;
        response = await getAllPartnerInvoices(params);
        
        // Handle paginated response
        if (response.success && response.data) {
          setInvoices(response.data.invoices || []);
          if (response.data.pagination) {
            setTotalPages(response.data.pagination.pages || 1);
            setTotalInvoices(response.data.pagination.total || 0);
          }
        }
      } else {
        response = await getMyPartnerInvoices(params);
        if (response.success && response.data) {
          setInvoices(response.data);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar notas fiscais');
      toast.error('Erro ao carregar notas fiscais');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin, filterMonth, filterYear, filterPartner, currentPage]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleFileSelect = (file: File) => {
    const allowedTypes = ['application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use apenas PDF.');
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

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Por favor, selecione um arquivo');
      return;
    }

    if (!uploadMonth || !uploadYear) {
      toast.error('Por favor, selecione o mês e ano de referência');
      return;
    }

    if (isAdmin && !uploadPartnerId) {
      toast.error('Por favor, selecione um parceiro');
      return;
    }

    setIsUploading(true);

    try {
      if (isAdmin) {
        await uploadPartnerInvoiceForPartner(
          uploadPartnerId,
          selectedFile,
          uploadMonth as number,
          uploadYear as number,
          uploadAmount || undefined
        );
      } else {
        await uploadMyPartnerInvoice(
          selectedFile,
          uploadMonth as number,
          uploadYear as number,
          uploadAmount || undefined
        );
      }

      toast.success('Nota fiscal enviada com sucesso!');
      setSelectedFile(null);
      setUploadMonth('');
      setUploadYear('');
      setUploadAmount('');
      setUploadPartnerId('');
      loadInvoices(true);
    } catch (error) {
      console.error('Error uploading invoice:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar nota fiscal');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (invoice: PartnerInvoice) => {
    try {
      const response = await getPartnerInvoiceSignedUrl(invoice.id);
      if (response.success && response.data?.signed_url) {
        window.open(response.data.signed_url, '_blank');
      } else {
        toast.error('URL de download não disponível');
      }
    } catch (error) {
      console.error('Error getting signed URL:', error);
      toast.error('Erro ao obter link de download');
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    loadInvoices(true);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
    loadInvoices();
  };

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando notas fiscais...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notas Fiscais</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isAdmin
              ? 'Gerencie as notas fiscais de todos os parceiros'
              : 'Envie e gerencie suas notas fiscais'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-[#ff6b35] px-4 py-2 text-sm font-semibold text-[#ff6b35] transition hover:bg-[#ff6b35] hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {/* Upload Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-[#1a1f24]">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {isAdmin ? 'Enviar Nota Fiscal para Parceiro' : 'Enviar Nova Nota Fiscal'}
        </h2>

        <div className="space-y-4">
          {/* Admin: Partner Selection */}
          {isAdmin && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Parceiro *
              </label>
              <select
                value={uploadPartnerId}
                onChange={(e) => setUploadPartnerId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#ff6b35] focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/20 dark:border-gray-600 dark:bg-[#2b3238] dark:text-gray-100"
              >
                <option value="">Selecione um parceiro</option>
                {partners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name} {partner.surname} ({partner.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Month and Year Selection */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Mês de Referência *
              </label>
              <select
                value={uploadMonth}
                onChange={(e) => setUploadMonth(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#ff6b35] focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/20 dark:border-gray-600 dark:bg-[#2b3238] dark:text-gray-100"
              >
                <option value="">Selecione o mês</option>
                {MONTHS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ano de Referência *
              </label>
              <select
                value={uploadYear}
                onChange={(e) => setUploadYear(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#ff6b35] focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/20 dark:border-gray-600 dark:bg-[#2b3238] dark:text-gray-100"
              >
                <option value="">Selecione o ano</option>
                {getYearOptions().map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Valor (opcional)
              </label>
              <input
                type="text"
                value={uploadAmount}
                onChange={(e) => setUploadAmount(e.target.value)}
                placeholder="R$ 0,00"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#ff6b35] focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/20 dark:border-gray-600 dark:bg-[#2b3238] dark:text-gray-100"
              />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Arquivo da Nota Fiscal *
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                isDragging
                  ? 'border-[#ff6b35] bg-[#ff6b35]/10'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              {selectedFile ? (
                <div className="flex items-center justify-center space-x-3">
                  <FileText className="text-[#ff6b35]" size={24} />
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
                  <Upload className="mx-auto mb-2 text-gray-400 dark:text-gray-300" size={32} />
                  <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
                    Arraste e solte o arquivo PDF aqui
                  </p>
                  <input
                    id="invoice-upload"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                  <label
                    htmlFor="invoice-upload"
                    className="inline-block cursor-pointer rounded-lg bg-[#ff6b35] px-4 py-2 text-sm text-white transition hover:bg-[#e85f2f]"
                  >
                    Selecionar arquivo
                  </label>
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Formato aceito: PDF. Tamanho máximo: 10MB
            </p>
          </div>

          {/* Upload Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || !selectedFile || !uploadMonth || !uploadYear || (isAdmin && !uploadPartnerId)}
              className="flex items-center gap-2 rounded-lg bg-[#ff6b35] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e85f2f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>Enviar Nota Fiscal</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-[#1a1f24]">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Filtros</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Admin: Partner Filter */}
          {isAdmin && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Parceiro
              </label>
              <select
                value={filterPartner}
                onChange={(e) => {
                  setFilterPartner(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#ff6b35] focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/20 dark:border-gray-600 dark:bg-[#2b3238] dark:text-gray-100"
              >
                <option value="">Todos os parceiros</option>
                {partners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name} {partner.surname}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Month Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mês
            </label>
            <select
              value={filterMonth}
              onChange={(e) => {
                setFilterMonth(e.target.value ? parseInt(e.target.value) : '');
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#ff6b35] focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/20 dark:border-gray-600 dark:bg-[#2b3238] dark:text-gray-100"
            >
              <option value="">Todos os meses</option>
              {MONTHS.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ano
            </label>
            <select
              value={filterYear}
              onChange={(e) => {
                setFilterYear(e.target.value ? parseInt(e.target.value) : '');
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#ff6b35] focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/20 dark:border-gray-600 dark:bg-[#2b3238] dark:text-gray-100"
            >
              <option value="">Todos os anos</option>
              {getYearOptions().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleFilterChange}
            className="rounded-lg border border-[#ff6b35] px-4 py-2 text-sm font-semibold text-[#ff6b35] transition hover:bg-[#ff6b35] hover:text-white"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>

      {/* Invoices List */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-[#1a1f24]">
        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Notas Fiscais
            {isAdmin && totalInvoices > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({totalInvoices} {totalInvoices === 1 ? 'nota' : 'notas'})
              </span>
            )}
          </h2>
        </div>

        {error && (
          <div className="m-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {invoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              Nenhuma nota fiscal encontrada
              {(filterMonth || filterYear || filterPartner) && ' com os filtros selecionados'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-[#111418]">
                  <tr>
                    {isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Parceiro
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Arquivo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Referência
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Data de Envio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-[#1f252b]">
                      {isAdmin && (
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {invoice.partner ? (
                            <div>
                              <div className="font-medium">
                                {invoice.partner.name} {invoice.partner.surname}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {invoice.partner.email}
                              </div>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[#ff6b35]" />
                          <div className="max-w-xs truncate font-medium text-gray-900 dark:text-gray-100">
                            {invoice.filename_normalized || invoice.filename_original}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {MONTHS.find((m) => m.value === invoice.reference_month)?.label || invoice.reference_month}/{invoice.reference_year}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(invoice.invoice_amount)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(invoice.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <button
                          type="button"
                          onClick={() => handleDownload(invoice)}
                          className="flex items-center gap-1 text-[#ff6b35] transition hover:text-[#e85f2f]"
                        >
                          <Download size={16} />
                          <span>Baixar</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="divide-y divide-gray-200 md:hidden dark:divide-gray-700">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="p-4">
                  {isAdmin && invoice.partner && (
                    <div className="mb-3 border-b border-gray-100 pb-3 dark:border-gray-700">
                      <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        Parceiro
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {invoice.partner.name} {invoice.partner.surname}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {invoice.partner.email}
                      </p>
                    </div>
                  )}
                  <div className="mb-3 flex items-start gap-3">
                    <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#ff6b35]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {invoice.filename_normalized || invoice.filename_original}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Referência: {MONTHS.find((m) => m.value === invoice.reference_month)?.label || invoice.reference_month}/{invoice.reference_year}
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(invoice.invoice_amount)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Enviado em {formatDate(invoice.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDownload(invoice)}
                      className="flex items-center gap-2 rounded-lg border border-[#ff6b35] px-3 py-1.5 text-sm font-medium text-[#ff6b35] transition hover:bg-[#ff6b35] hover:text-white"
                    >
                      <Download size={14} />
                      <span>Baixar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination (Admin Only) */}
            {isAdmin && totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-[#1f252b]"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-[#1f252b]"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

