import React, { useState, useEffect } from 'react';
import { UserCheck, TrendingUp, DollarSign, FileText, Users, BarChart3, Coins } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { dashboardService, DashboardStats, ChartData } from '../services/dashboardService';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useUser();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { stats, charts } = await dashboardService.getDashboardData();

        setDashboardStats(stats);
        setChartData(charts);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados do dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const formatCurrency = (value: string | number | null | undefined) => {
    const rawValue = typeof value === 'string' ? Number(value) : value ?? 0;
    const numValue = Number.isFinite(rawValue) ? Number(rawValue) : 0;

    if (Math.abs(numValue) >= 1_000_000) {
      return `R$ ${(numValue / 1_000_000).toFixed(1)}M`;
    }

    if (Math.abs(numValue) >= 1_000) {
      return `R$ ${(numValue / 1_000).toFixed(1)}K`;
    }

    return `R$ ${numValue.toFixed(2)}`;
  };

  const formatPercentage = (value: number | null | undefined) => {
    const numericValue = Number.isFinite(value ?? 0) ? Number(value ?? 0) : 0;
    return `${numericValue.toFixed(2)}%`;
  };

  const formatNumber = (value: number | null | undefined) => {
    const numericValue = Number.isFinite(value ?? 0) ? Number(value ?? 0) : 0;
    return numericValue.toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#3E3E3E] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-[#1E1E1E] animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const stats = dashboardStats ?? {
    negociacoes_ativas: 0,
    taxa_conversao: 0,
    receita_potencial: 0,
    propostas_em_negociacao: 0,
    total_leads: 0,
    comissoes: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard {isAdmin ? '(Administrador)' : '(Consultor)'}
        </h1>
        <div className="flex items-center space-x-2">
          <select className="px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg text-sm bg-white dark:bg-[#3E3E3E] dark:text-gray-100" aria-label="Período">
            <option>Último mês</option>
            <option>Último trimestre</option>
            <option>Último ano</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          title="Negociações Ativas"
          value={formatNumber(stats.negociacoes_ativas)}
          icon={UserCheck}
          color="blue"
        />
        <KpiCard
          title="Taxa de Conversão"
          value={formatPercentage(stats.taxa_conversao)}
          icon={TrendingUp}
          color="green"
        />
        <KpiCard
          title="Receita Potencial"
          value={formatCurrency(stats.receita_potencial)}
          icon={DollarSign}
          color="orange"
        />
        <KpiCard
          title="Propostas em Negociação"
          value={formatNumber(stats.propostas_em_negociacao)}
          icon={FileText}
          color="purple"
        />
        <KpiCard
          title="Total de Leads"
          value={formatNumber(stats.total_leads)}
          icon={Users}
          color="indigo"
        />
        <KpiCard
          title="Comissões"
          value={formatCurrency(stats.comissoes)}
          icon={Coins}
          color="teal"
        />
      </div>

      {/* Additional admin-only KPIs */}
      {isAdmin && dashboardStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <KpiCard
            title="Total de Consultores"
            value={formatNumber(stats.total_consultants)}
            icon={Users}
            color="indigo"
          />
          <KpiCard
            title="Leads Este Mês"
            value={formatNumber(stats.current_month_leads)}
            icon={BarChart3}
            color="teal"
          />
          <KpiCard
            title="Crescimento Mensal"
            value={formatPercentage(stats.monthly_growth)}
            icon={TrendingUp}
            color={stats.monthly_growth && stats.monthly_growth > 0 ? 'green' : 'red'}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#3E3E3E] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-[#1E1E1E]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Evolução Mensal</h3>
          {chartData && chartData.monthly_evolution.length > 0 ? (
            <div className="h-64 flex flex-col justify-center">
              <div className="space-y-2">
                {chartData.monthly_evolution.slice(-6).map((month, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {month.month} {month.year}
                    </span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatNumber(month.leads)} leads
                      </span>
                      <span className="text-sm text-green-600 dark:text-green-400">
                        {formatNumber(month.closed_leads)} fechados
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              Nenhum dado disponível
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-[#3E3E3E] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-[#1E1E1E]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Distribuição por Status</h3>
          {chartData && chartData.segment_distribution.length > 0 ? (
            <div className="h-64 flex flex-col justify-center">
              <div className="space-y-3">
                {chartData.segment_distribution.map(segment => {
                  const statusColors: Record<string, string> = {
                    'apresentacao agendada': 'bg-blue-500',
                    'prospeccao': 'bg-sky-500',
                    'qualificado': 'bg-yellow-500',
                    'proposta enviada': 'bg-purple-500',
                    'negociacao': 'bg-orange-500',
                    'em assinatura': 'bg-indigo-500',
                    'fechado ganho': 'bg-green-500',
                    'fechado perdido': 'bg-rose-500',
                    'sem status': 'bg-gray-500',
                  };

                  const colorClass = statusColors[segment.key] || 'bg-gray-500';

                  return (
                    <div key={segment.key} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {segment.status}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatNumber(segment.count)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              Nenhum dado disponível
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <button onClick={() => navigate('/negociacoes')} className="bg-[#FE5200] hover:bg-[#FE5200]/90 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full sm:w-auto">
          Ver Negociações
        </button>
        <button onClick={() => navigate('/agenda')} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full sm:w-auto">
          Agendar Apresentação
        </button>
        <button onClick={() => navigate('/commissions')} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full sm:w-auto">
          Ver Comissões
        </button>
      </div>
    </div>
  );
}
