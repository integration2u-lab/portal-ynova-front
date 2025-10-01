import React, { useState, useEffect } from 'react';
import { UserCheck, TrendingUp, DollarSign, FileText, Users, BarChart3 } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { dashboardService, DashboardStats, ChartData } from '../services/dashboardService';
import { stageColorMap } from '../utils/leadStatusMapping';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('pt-BR');

const parseNumericValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  const sanitized = trimmed.replace(/[^0-9.,-]/g, '');
  const normalized = sanitized.includes(',')
    ? sanitized.replace(/\./g, '').replace(',', '.')
    : sanitized;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrencyValue = (value: string | number | null | undefined) =>
  currencyFormatter.format(parseNumericValue(value));

const formatNumberValue = (value: number | null | undefined) => numberFormatter.format(value ?? 0);

const formatPercentageValue = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '0%';
  }

  const absolute = Math.abs(value);
  const formatted = absolute.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  if (value > 0) {
    return `+${formatted}%`;
  }

  if (value < 0) {
    return `-${formatted}%`;
  }

  return `${formatted}%`;
};

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
        
        const response = await dashboardService.getDashboardData();

        setDashboardStats(response.data.stats);
        setChartData(response.data.charts);
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Prospecções Ativas"
          value={formatNumberValue(dashboardStats?.leads_ativos ?? 0)}
          icon={UserCheck}
          color="blue"
        />
        <KpiCard
          title="Taxa de Conversão"
          value={formatPercentageValue(dashboardStats?.taxa_conversao ?? 0)}
          icon={TrendingUp}
          color="green"
        />
        <KpiCard
          title="Receita Potencial"
          value={formatCurrencyValue(dashboardStats?.receita_potencial ?? 0)}
          icon={DollarSign}
          color="orange"
        />
        <KpiCard
          title="Propostas em Negociação"
          value={formatNumberValue(dashboardStats?.propostas_em_negociacao ?? 0)}
          icon={FileText}
          color="purple"
        />
      </div>

      {/* Additional admin-only KPIs */}
      {isAdmin && dashboardStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <KpiCard
            title="Total de Consultores"
            value={formatNumberValue(dashboardStats.total_consultants ?? 0)}
            icon={Users}
            color="indigo"
          />
          <KpiCard
            title="Leads Este Mês"
            value={formatNumberValue(dashboardStats.current_month_leads ?? 0)}
            icon={BarChart3}
            color="teal"
          />
          <KpiCard
            title="Crescimento Mensal"
            value={formatPercentageValue(dashboardStats.monthly_growth ?? 0)}
            icon={TrendingUp}
            color={
              dashboardStats.monthly_growth && dashboardStats.monthly_growth > 0
                ? 'green'
                : dashboardStats.monthly_growth && dashboardStats.monthly_growth < 0
                  ? 'red'
                  : 'orange'
            }
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
                  <div key={`${month.year}-${month.month}-${index}`} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {month.month} {month.year}
                    </span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatNumberValue(month.leads)} leads
                      </span>
                      <span className="text-sm text-green-600 dark:text-green-400">
                        {formatNumberValue(month.closed_leads)} fechados
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
            <div className="max-h-72 overflow-y-auto pr-2">
              <div className="space-y-3">
                {chartData.segment_distribution.map(segment => {
                  const colorClass = stageColorMap[segment.stageKey] || stageColorMap['outros'] || 'bg-gray-500';
                  const stageLabel = segment.stageLabel?.trim() ?? '';
                  const showStageLabel = stageLabel && stageLabel.toLowerCase() !== segment.label.toLowerCase();

                  return (
                    <div
                      key={`${segment.stageKey}-${segment.status}`}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {segment.label}
                          </span>
                          {showStageLabel && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {stageLabel}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatNumberValue(segment.count)}
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

      {/* 
<div className="flex flex-wrap gap-4">
  <button 
    onClick={() => navigate('/negociacoes')} 
    className="bg-[#FE5200] hover:bg-[#FE5200]/90 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full sm:w-auto"
  >
    Ver Negociações
  </button>
  <button 
    onClick={() => navigate('/agenda')} 
    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full sm:w-auto"
  >
    Agendar Apresentação
  </button>
  <button 
    onClick={() => navigate('/commissions')} 
    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full sm:w-auto"
  >
    Ver Comissões
  </button>
</div>
*/} 
    </div>
  );
}
