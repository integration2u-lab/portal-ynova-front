import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  MoreVertical,
  Upload,
  Download,
  Eye,
  Edit,
  Save,
  Phone,
  Mail,
  Building,
  MapPin,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileText,
} from 'lucide-react';
import ModalUploadInvoice from '../components/ModalUploadInvoice';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { mockLeads, mockPropostas } from '../data/mockData';
import { toast } from 'sonner';
import { Lead } from '../types';
import { apiRequestWithAuth } from '../utils/api';

export default function LeadsPage() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState('resumo');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10000,
    total: 0,
    pages: 0,
  });

  // API Functions
  const fetchLeads = async (page = 1, limit = 10) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await apiRequestWithAuth(`/leads?${params}`);

      if (!response.ok) {
        throw new Error('Erro ao carregar leads');
      }

      const result = await response.json();
      if (result.data?.leads) {
        setLeads(result.data.leads);
      }
      if (result.data?.pagination) {
        setPagination(result.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Erro ao carregar leads');
      // Fallback to mock data
      setLeads(mockLeads);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLead = async (leadId: string) => {
    try {
      const response = await apiRequestWithAuth(`/leads/${leadId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir lead');
      }

      toast.success('Lead excluído com sucesso');
      fetchLeads(pagination.page, pagination.limit);
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Erro ao excluir lead');
    }
  };

  const downloadFile = async (leadId: string) => {
    try {
      const response = await apiRequestWithAuth(`/leads/${leadId}/download`);

      if (!response.ok) {
        throw new Error('Erro ao baixar arquivo');
      }

      const result = await response.json();
      if (result.data?.url) {
        window.open(result.data.url, '_blank');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Erro ao baixar arquivo');
    }
  };

  // Effects
  useEffect(() => {
    fetchLeads();
  }, []);

  // Removed search effect - now using client-side filtering only

  const filteredLeads = leads.filter(
    (lead) =>
      lead.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.cnpj.includes(searchTerm) ||
      lead.consumer_unit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = () => {
    if (leadToDelete) {
      deleteLead(leadToDelete.id);
      setLeadToDelete(null);
      setIsDeleteOpen(false);
    }
  };

  const handleUploadSuccess = (newLead: Lead) => {
    fetchLeads(pagination.page, pagination.limit);
  };

  if (!selectedLead) {
    return (
      <>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Leads</h1>
          <header className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3 min-w-0 w-full">
              <div className="relative flex-1 min-w-0">
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
                <input
                  type="text"
                  placeholder="Buscar leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-[#3E3E3E] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300"
                />
              </div>
              <button
                className="p-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1E1E1E] w-full sm:w-auto"
                aria-label="Filtros"
              >
                <Filter size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="bg-[#FE5200] hover:bg-[#FE5200]/90 text-white px-4 py-2 rounded-lg w-full"
              >
                Enviar Fatura
              </button>
            </div>
          </header>

          <div className="bg-white dark:bg-[#3E3E3E] rounded-lg shadow-sm border border-gray-200 dark:border-[#1E1E1E]">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <EmptyState
                message="Você ainda não possui leads. Importe um arquivo ou cadastre manualmente."
                action={
                  <button className="bg-[#FE5200] hover:bg-[#FE5200]/90 text-white px-4 py-2 rounded-lg font-medium">
                    Importar Leads
                  </button>
                }
              />
            ) : (
              <>
                <div className="space-y-3 sm:hidden">
                  {filteredLeads.map((lead) => (
                    <article
                      key={lead.id}
                      className="rounded-lg border p-4 bg-white dark:bg-[#3E3E3E]"
                    >
                      <div className="font-semibold truncate">{lead.client_name}</div>
                      <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <dt className="text-gray-500">CNPJ</dt>
                          <dd className="truncate">{lead.cnpj}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Status</dt>
                          <dd>
                            <StatusBadge 
                              status={lead.status === 'pending' ? 'amarelo' : lead.status === 'approved' ? 'verde' : 'vermelho'} 
                              type="funil" 
                            />
                          </dd>
                        </div>
                      </dl>
                      <div className="mt-3 flex flex-col gap-2">
                        <button
                          className="w-full"
                          onClick={() => setSelectedLead(lead)}
                        >
                          Abrir
                        </button>
                        <button className="w-full">Solicitar fatura</button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="hidden sm:block">
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto min-w-[720px] divide-y divide-gray-200 dark:divide-[#1E1E1E]">
                      <thead className="bg-gray-50 dark:bg-[#3E3E3E]">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cliente</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">CNPJ</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Período</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valor Fatura</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Arquivo</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-[#3E3E3E] divide-y divide-gray-200 dark:divide-[#1E1E1E]">
                        {filteredLeads.map((lead) => (
                          <tr
                            key={lead.id}
                            className="hover:bg-gray-50 dark:hover:bg-[#1E1E1E]"
                          >
                            <td className="px-6 py-4 whitespace-normal break-words truncate">
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-normal break-words truncate">
                                  {lead.client_name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-300 whitespace-normal break-words truncate">
                                  UC: {lead.consumer_unit}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-normal break-words truncate text-sm text-gray-900 dark:text-gray-100">
                              {lead.cnpj}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {lead.month} {lead.year}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              R$ {lead.invoice_amount ? parseFloat(lead.invoice_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge 
                                status={lead.status === 'pending' ? 'amarelo' : lead.status === 'approved' ? 'verde' : 'vermelho'} 
                                type="funil" 
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {lead.file_name ? (
                                <div className="flex items-center space-x-2">
                                  <FileText size={16} className="text-[#FE5200]" />
                                  <span className="text-sm text-gray-600 dark:text-gray-300">
                                    {lead.file_name}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400 dark:text-gray-500">
                                  Sem arquivo
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setSelectedLead(lead)}
                                  className="text-[#FE5200] hover:text-[#FE5200]/80"
                                >
                                  Abrir
                                </button>
                                {lead.file_name && (
                                  <button 
                                    onClick={() => downloadFile(lead.id)}
                                    className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                  >
                                    <Download size={14} />
                                    Baixar
                                  </button>
                                )}
                                {/* <button
                                  className="text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-400"
                                  aria-label="Mais ações"
                                  onClick={() =>
                                    setOpenMenuId(
                                      openMenuId === parseInt(lead.id) ? null : parseInt(lead.id)
                                    )
                                  }
                                >
                                  <MoreVertical size={16} />
                                </button> */}
                              </div>
                              {openMenuId === parseInt(lead.id) && (
                                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-[#3E3E3E] border border-gray-200 dark:border-[#1E1E1E] rounded-md shadow-lg z-10">
                                  <button
                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-[#1E1E1E]"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-gray-100 dark:hover:bg-[#1E1E1E]"
                                    onClick={() => {
                                      setLeadToDelete(lead);
                                      setIsDeleteOpen(true);
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    Excluir
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      <ModalUploadInvoice 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onSuccess={handleUploadSuccess}
      />
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-[#3E3E3E] p-6 rounded-lg w-full max-w-sm">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Deseja realmente excluir?</h2>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 bg-white dark:bg-[#3E3E3E] text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-[#1E1E1E] rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#1E1E1E] rounded-lg" aria-label="Voltar">
          ←
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedLead.client_name}</h1>
      </div>

      <div className="bg-white dark:bg-[#3E3E3E] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-[#1E1E1E]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">CNPJ</label>
            <p className="font-medium text-gray-900 dark:text-gray-100">{selectedLead.cnpj}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">Unidade Consumidora</label>
            <p className="font-medium text-gray-900 dark:text-gray-100">{selectedLead.consumer_unit}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">Período</label>
            <p className="font-medium text-gray-900 dark:text-gray-100">{selectedLead.month} {selectedLead.year}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">Status</label>
            <div className="mt-1">
              <StatusBadge 
                status={selectedLead.status === 'pending' ? 'amarelo' : selectedLead.status === 'approved' ? 'verde' : 'vermelho'} 
                type="funil" 
              />
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-[#1E1E1E] mb-6">
          <nav className="-mb-px flex space-x-8" role="tablist">
            {[
              { id: 'resumo', label: 'Resumo' },
              { id: 'cadastro', label: 'Cadastro' },
              { id: 'faturas', label: 'Faturas & Extração' },
              { id: 'propostas', label: 'Propostas' },
              { id: 'contratos', label: 'Contratos' },
              { id: 'migracao', label: 'Migração' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-[#FE5200] text-[#FE5200] dark:text-[#FE5200]'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-[#1E1E1E]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'resumo' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">Próximas Ações</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Validar fatura de energia</li>
                  <li>• Agendar apresentação</li>
                </ul>
              </div>
              <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 dark:text-green-200 mb-2">Status Atual</h4>
                <p className="text-sm text-green-700 dark:text-green-300">Lead qualificado - documentação em análise</p>
              </div>
              <div className="bg-[#FE5200]/10 dark:bg-[#FE5200]/20 p-4 rounded-lg">
                <h4 className="font-medium text-[#FE5200] dark:text-[#FE5200] mb-2">Última Atualização</h4>
                <p className="text-sm text-[#FE5200] dark:text-[#FE5200]">{selectedLead.updated_at ? new Date(selectedLead.updated_at).toLocaleDateString('pt-BR') : 'N/A'}</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-[#1E1E1E] p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Timeline de Eventos</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Fatura enviada - 15/01/2025</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Primeiro contato - 10/01/2025</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cadastro' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button className="bg-[#FE5200] hover:bg-[#FE5200]/90 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                <Edit size={16} />
                Editar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Razão Social</label>
                <input type="text" value={selectedLead.client_name} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg bg-gray-50 dark:bg-[#3E3E3E] text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CNPJ</label>
                <input type="text" value={selectedLead.cnpj} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg bg-gray-50 dark:bg-[#3E3E3E] text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unidade Consumidora</label>
                <input type="text" value={selectedLead.consumer_unit} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg bg-gray-50 dark:bg-[#3E3E3E] text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Período</label>
                <input type="text" value={`${selectedLead.month} ${selectedLead.year}`} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg bg-gray-50 dark:bg-[#3E3E3E] text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Valor da Energia (kWh)</label>
                <input type="text" value={selectedLead.energy_value} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg bg-gray-50 dark:bg-[#3E3E3E] text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Valor da Fatura</label>
                <input type="text" value={`R$ ${parseFloat(selectedLead.invoice_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg bg-gray-50 dark:bg-[#3E3E3E] text-gray-900 dark:text-gray-100" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Observações</label>
                <textarea value={selectedLead.observations || ''} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg bg-gray-50 dark:bg-[#3E3E3E] text-gray-900 dark:text-gray-100" rows={3} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'faturas' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Faturas Enviadas</h4>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                <button className="bg-[#FE5200] hover:bg-[#FE5200]/90 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 w-full sm:w-auto">
                  <Upload size={16} />
                  Enviar Fatura
                </button>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 w-full sm:w-auto">
                  <Download size={16} />
                  Nova Extração
                </button>
              </div>
            </div>

            <div className="bg-white border rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Arquivo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Upload</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">fatura_jan_2025.pdf</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">15/01/2025</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        Pendente validação
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-4">Revisar dados</button>
                      <button className="text-[#FE5200] hover:text-[#FE5200]/80">Reprocessar</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">Dados Extraídos - Confiança: 95%</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Consumo kWh:</span>
                  <span className="ml-2">12.450</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Valor Total:</span>
                  <span className="ml-2">R$ 8.750,00</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Tarifa Média:</span>
                  <span className="ml-2">R$ 0,702/kWh</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Distribuidora:</span>
                  <span className="ml-2">ENEL SP</span>
                </div>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm w-full sm:w-auto">Aceitar</button>
                <button className="bg-[#FE5200] hover:bg-[#FE5200]/90 text-white px-3 py-1 rounded text-sm w-full sm:w-auto">Editar</button>
                <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm w-full sm:w-auto">Rejeitar</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'propostas' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h4 className="font-medium text-gray-900">Histórico de Propostas</h4>
              <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm w-full sm:w-auto">
                Nova Proposta
              </button>
            </div>

            <div className="bg-white border rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Simulado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mockPropostas.map((proposta) => (
                    <tr key={proposta.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(proposta.data).toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            proposta.status === 'aceita'
                              ? 'bg-green-100 text-green-800'
                              : proposta.status === 'rejeitada'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {proposta.status === 'aceita'
                            ? 'Aceita'
                            : proposta.status === 'rejeitada'
                            ? 'Rejeitada'
                            : 'Em negociação'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R$ {proposta.valorSimulado.toLocaleString('pt-BR')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-4 flex items-center gap-1">
                          <Download size={14} />
                          Baixar PPT
                        </button>
                        <button className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
                          <Eye size={14} />
                          Visualizar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'contratos' && (
          <div className="space-y-6">
            <h4 className="font-medium text-gray-900">Histórico de Contratos</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-medium text-blue-900">Volume Total</h5>
                <p className="text-2xl font-bold text-blue-900">12.000 MWh</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h5 className="font-medium text-green-900">Preço Médio</h5>
                <p className="text-2xl font-bold text-green-900">R$ 285/MWh</p>
              </div>
              <div className="bg-[#FE5200]/10 p-4 rounded-lg">
                <h5 className="font-medium text-[#FE5200]">Contratos Ativos</h5>
                <p className="text-2xl font-bold text-[#FE5200]">3</p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600 text-center">Histórico detalhado de contratos será exibido aqui</p>
            </div>
          </div>
        )}

        {activeTab === 'migracao' && (
          <div className="space-y-6">
            <h4 className="font-medium text-gray-900">Status da Migração</h4>
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm text-gray-600">Progresso</span>
                <span className="text-sm text-gray-600">75%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                <div className="bg-[#FE5200] h-2 rounded-full w-3/4"></div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-700">Documentação enviada</span>
                  <span className="text-xs text-gray-500 ml-auto">10/01/2025</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-700">Validação interna</span>
                  <span className="text-xs text-gray-500 ml-auto">12/01/2025</span>
                </div>
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-[#FE5200]" />
                  <span className="text-sm text-gray-700">Protocolado na CCEE</span>
                  <span className="text-xs text-gray-500 ml-auto">Em andamento</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-5 w-5 border-2 border-gray-300 rounded-full"></div>
                  <span className="text-sm text-gray-400">Aprovação final</span>
                  <span className="text-xs text-gray-400 ml-auto">Aguardando</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
