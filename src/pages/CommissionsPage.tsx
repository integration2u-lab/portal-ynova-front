import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, Clock, TrendingUp, RefreshCw, Plus } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import CommissionModal from '../components/CommissionModal';
import { useCommissions } from '../hooks/useCommissions';
import { useUser } from '../contexts/UserContext';
import { userService } from '../services/userService';
import { Commission, User } from '../types';

export default function CommissionsPage() {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedConsultant, setSelectedConsultant] = useState('');
  const [consultants, setConsultants] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAdmin, user } = useUser();

  // Debug logging
  console.log('CommissionsPage - user:', user);
  console.log('CommissionsPage - isAdmin:', isAdmin);
  console.log('CommissionsPage - user role:', user?.role);
  const { 
    commissions, 
    loading, 
    error, 
    pagination, 
    updateFilters, 
    refetch 
  } = useCommissions();

  // Calculate KPIs from commissions data
  const kpis = React.useMemo(() => {
    const totalGenerated = commissions.reduce((sum, c) => sum + parseFloat(c.gross_amount), 0);
    const totalPaid = commissions
      .filter(c => c.status === 'paga')
      .reduce((sum, c) => sum + parseFloat(c.gross_amount), 0);
    const totalPending = commissions
      .filter(c => c.status === 'aguardando_nf' || c.status === 'aprovada')
      .reduce((sum, c) => sum + parseFloat(c.gross_amount), 0);
    
    const successRate = totalGenerated > 0 ? Math.round((totalPaid / totalGenerated) * 100) : 0;

    return {
      totalGenerated,
      totalPaid,
      totalPending,
      successRate,
    };
  }, [commissions]);

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    updateFilters({ reference_month: month || undefined });
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    updateFilters({ status: status || undefined });
  };

  const handleConsultantChange = (consultantId: string) => {
    setSelectedConsultant(consultantId);
    updateFilters({ userId: consultantId || undefined });
  };

  const handleExportCSV = () => {
    // TODO: Implement CSV export functionality
    console.log('Export CSV functionality not implemented yet');
  };

  const handleCommissionCreated = () => {
    refetch(); // Refresh the commissions list
  };

  // Load consultants for admin users
  useEffect(() => {
    console.log('CommissionsPage useEffect triggered - isAdmin:', isAdmin);
    if (isAdmin) {
      console.log('Loading consultants for admin user in CommissionsPage...');
      userService.getUsers({ role: 'consultant', limit: 100 })
        .then(response => {
          console.log('CommissionsPage consultants response:', response);
          if (response.success) {
            console.log('Setting consultants in CommissionsPage:', response.data.users);
            setConsultants(response.data.users);
          } else {
            console.error('Failed to load consultants in CommissionsPage - response not successful');
          }
        })
        .catch(error => {
          console.error('Error loading consultants in CommissionsPage:', error);
        });
    } else {
      console.log('User is not admin in CommissionsPage, skipping consultant loading');
    }
  }, [isAdmin]);

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Comissões & Performance</h1>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">Erro ao carregar comissões: {error}</p>
          <button 
            onClick={refetch}
            className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Comissões & Performance</h1>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              <Plus className="h-4 w-4" />
              Lançar
            </button>
          )}
          {/* Debug: Always show a test button to verify rendering */}
          <button
            onClick={() => console.log('Test button clicked - isAdmin:', isAdmin, 'user role:', user?.role)}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            Debug
          </button>
          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      <header className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 min-w-0 w-full">
          <select 
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-[#2b3238] rounded-lg text-sm bg-white dark:bg-[#20262c] text-gray-900 dark:text-gray-100"
          >
            <option value="">Todos os meses</option>
            <option value="2025-01">Janeiro 2025</option>
            <option value="2024-12">Dezembro 2024</option>
            <option value="2024-11">Novembro 2024</option>
          </select>
          
          <select 
            value={selectedStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-[#2b3238] rounded-lg text-sm bg-white dark:bg-[#20262c] text-gray-900 dark:text-gray-100"
          >
            <option value="">Todos os status</option>
            <option value="aguardando_nf">Aguardando NF</option>
            <option value="aprovada">Aprovada</option>
            <option value="paga">Paga</option>
          </select>

          {isAdmin && (
            <select 
              value={selectedConsultant}
              onChange={(e) => handleConsultantChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#2b3238] rounded-lg text-sm bg-white dark:bg-[#20262c] text-gray-900 dark:text-gray-100"
            >
              <option value="">Todos os consultores</option>
              {consultants.map((consultant) => (
                <option key={consultant.id} value={consultant.id}>
                  {consultant.name} {consultant.surname}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full">
          <button 
            onClick={handleExportCSV}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            Exportar CSV
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Comissão Gerada" 
          value={`R$ ${kpis.totalGenerated.toLocaleString('pt-BR')}`} 
          icon={DollarSign} 
          color="green" 
        />
        <KpiCard 
          title="Comissão Paga" 
          value={`R$ ${kpis.totalPaid.toLocaleString('pt-BR')}`} 
          icon={CheckCircle} 
          color="blue" 
        />
        <KpiCard 
          title="Comissão Pendente" 
          value={`R$ ${kpis.totalPending.toLocaleString('pt-BR')}`} 
          icon={Clock} 
          color="orange" 
        />
        <KpiCard 
          title="Taxa de Sucesso" 
          value={`${kpis.successRate}%`} 
          icon={TrendingUp} 
          color="purple" 
        />
      </div>

      <div className="bg-white dark:bg-[#1a1f24] rounded-lg shadow-sm border border-gray-200 dark:border-[#2b3238]">
        <h3 className="p-6 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Histórico de Comissões
          {loading && <span className="ml-2 text-sm text-gray-500">(Carregando...)</span>}
        </h3>
        
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">Carregando comissões...</p>
          </div>
        ) : commissions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Nenhuma comissão encontrada.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 sm:hidden p-4">
              {commissions.map((commission) => (
                <article key={commission.id} className="rounded-lg border p-4 bg-white dark:bg-[#1a1f24]">
                  <div className="font-semibold truncate">
                    {commission.consultant ? 
                      `${commission.consultant.name} ${commission.consultant.surname}` : 
                      'Consultor não encontrado'
                    }
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-gray-500">Mês Referência</dt>
                      <dd className="text-right">{commission.reference_month}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Valor</dt>
                      <dd className="text-right">R$ {parseFloat(commission.gross_amount).toLocaleString('pt-BR')}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Status</dt>
                      <dd>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            commission.status === 'paga'
                              ? 'bg-green-100 text-green-800'
                              : commission.status === 'aprovada'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {commission.status === 'paga'
                            ? 'Paga'
                            : commission.status === 'aprovada'
                            ? 'Aprovada'
                            : 'Aguardando NF'}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Data</dt>
                      <dd>{new Date(commission.created_at).toLocaleDateString('pt-BR')}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
            
            <div className="hidden sm:block">
              <div className="overflow-x-auto">
                <table className="w-full table-auto min-w-[720px] divide-y divide-gray-200 dark:divide-[#2b3238]">
                  <thead className="bg-gray-50 dark:bg-[#1a1f24]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Consultor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Mês Referência</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase text-right">Valor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-[#2b3238]">
                    {commissions.map((commission) => (
                      <tr key={commission.id} className="hover:bg-gray-50 dark:hover:bg-[#1f252b]">
                        <td className="px-6 py-4 whitespace-normal break-words truncate text-sm font-medium text-gray-900 dark:text-gray-200">
                          {commission.consultant ? 
                            `${commission.consultant.name} ${commission.consultant.surname}` : 
                            'Consultor não encontrado'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                          {commission.reference_month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-200">
                          R$ {parseFloat(commission.gross_amount).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              commission.status === 'paga'
                                ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800'
                                : commission.status === 'aprovada'
                                ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-800'
                                : 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100 dark:border-yellow-800'
                            }`}
                          >
                            {commission.status === 'paga'
                              ? 'Paga'
                              : commission.status === 'aprovada'
                              ? 'Aprovada'
                              : 'Aguardando NF'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                          {new Date(commission.created_at).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-[#2b3238]">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Mostrando {commissions.length} de {pagination.total} comissões
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateFilters({ page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Página {pagination.page} de {pagination.pages}
                    </span>
                    <button
                      onClick={() => updateFilters({ page: pagination.page + 1 })}
                      disabled={pagination.page === pagination.pages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Commission Modal for Admin Users */}
      {isAdmin && (
        <CommissionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleCommissionCreated}
        />
      )}
    </div>
  );
}
