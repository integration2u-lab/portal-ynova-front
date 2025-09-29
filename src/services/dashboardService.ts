import type { Lead } from '../types';
import {
  getStageDefinitionForStatus,
  getStageNameForStatus,
  getStatusDisplayName,
  normalizeStatusKey,
  stageDefinitions,
} from '../utils/pipelineStageUtils';
import {
  fetchAllPipelineLeads,
  parseCurrencyToNumber,
} from './pipelineDataService';

export interface DashboardStats {
  negociacoes_ativas: number;
  taxa_conversao: number;
  receita_potencial: number;
  propostas_em_negociacao: number;
  total_leads: number;
  comissoes: number;
  total_consultants?: number;
  current_month_leads?: number;
  monthly_growth?: number;
}

export interface MonthlyEvolution {
  month: string;
  year: number;
  leads: number;
  closed_leads: number;
}

export interface SegmentDistribution {
  status: string;
  key: string;
  count: number;
}

export interface ChartData {
  monthly_evolution: MonthlyEvolution[];
  segment_distribution: SegmentDistribution[];
}

export interface DashboardData {
  stats: DashboardStats;
  charts: ChartData;
}

const monthNames = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const stageOrderMap = new Map(stageDefinitions.map((definition, index) => [definition.label, index]));

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const getMonthInfoFromLead = (lead: Lead) => {
  const createdDate = new Date(lead.created_at);
  const normalizedMonth = lead.month ? lead.month.toString().toLowerCase() : '';
  let monthIndex = normalizedMonth ? monthNames.indexOf(normalizedMonth) : -1;
  let year = Number.isFinite(lead.year) ? lead.year : NaN;

  if (monthIndex === -1 && !Number.isNaN(createdDate.getTime())) {
    monthIndex = createdDate.getMonth();
    year = createdDate.getFullYear();
  }

  if (Number.isNaN(year) || year <= 0) {
    year = !Number.isNaN(createdDate.getTime()) ? createdDate.getFullYear() : new Date().getFullYear();
  }

  if (monthIndex < 0 || monthIndex > 11) {
    const fallbackDate = !Number.isNaN(createdDate.getTime()) ? createdDate : new Date(year, 0, 1);
    monthIndex = fallbackDate.getMonth();
  }

  const monthLabel = new Date(year, monthIndex, 1).toLocaleString('pt-BR', { month: 'long' });

  return {
    monthIndex,
    monthLabel: capitalize(monthLabel),
    year,
  };
};

const computeDashboardStats = (leads: Lead[]): DashboardStats => {
  let activeDeals = 0;
  let negotiationDeals = 0;
  let closedWonDeals = 0;
  let potentialRevenue = 0;
  let commissions = 0;

  leads.forEach(lead => {
    const stageLabel = getStageNameForStatus(lead.status);
    const amount = parseCurrencyToNumber(lead.invoice_amount);
    const commissionAmount = parseCurrencyToNumber(lead.commission_amount);

    const isClosedWon = stageLabel === 'Fechado (Ganho)';
    const isClosedLost = stageLabel === 'Fechado (Perdido)';
    const isActive = !isClosedWon && !isClosedLost;

    if (isActive) {
      activeDeals += 1;
      potentialRevenue += amount;
    }

    if (stageLabel === 'Negociação' || stageLabel === 'Proposta Enviada') {
      negotiationDeals += 1;
    }

    if (isClosedWon) {
      closedWonDeals += 1;
    }

    if (commissionAmount > 0) {
      commissions += commissionAmount;
    }
  });

  const totalLeads = leads.length;
  const conversionRate = totalLeads > 0 ? (closedWonDeals / totalLeads) * 100 : 0;

  return {
    negociacoes_ativas: activeDeals,
    taxa_conversao: Number(conversionRate.toFixed(2)),
    receita_potencial: Number(potentialRevenue.toFixed(2)),
    propostas_em_negociacao: negotiationDeals,
    total_leads: totalLeads,
    comissoes: Number(commissions.toFixed(2)),
    total_consultants: 0,
    current_month_leads: 0,
    monthly_growth: 0,
  };
};

const computeSegmentDistribution = (leads: Lead[]): SegmentDistribution[] => {
  const segments = new Map<string, { key: string; status: string; count: number; order: number }>();

  leads.forEach(lead => {
    const displayName = getStatusDisplayName(lead.status);
    const normalizedKey = normalizeStatusKey(displayName);
    const definition = getStageDefinitionForStatus(lead.status);
    const order = definition ? stageOrderMap.get(definition.label) ?? stageDefinitions.length : stageDefinitions.length;

    if (!segments.has(normalizedKey)) {
      segments.set(normalizedKey, {
        key: normalizedKey,
        status: displayName,
        count: 0,
        order,
      });
    }

    const segment = segments.get(normalizedKey)!;
    segment.count += 1;
  });

  return Array.from(segments.values())
    .sort((a, b) => {
      if (a.order === b.order) {
        return a.status.localeCompare(b.status, 'pt-BR');
      }
      return a.order - b.order;
    })
    .map(({ key, status, count }) => ({ key, status, count }));
};

const computeMonthlyEvolution = (leads: Lead[]): MonthlyEvolution[] => {
  const monthlyMap = new Map<string, { month: string; year: number; monthIndex: number; leads: number; closed: number }>();

  leads.forEach(lead => {
    const { monthIndex, monthLabel, year } = getMonthInfoFromLead(lead);
    const key = `${year}-${monthIndex}`;
    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, { month: monthLabel, year, monthIndex, leads: 0, closed: 0 });
    }

    const entry = monthlyMap.get(key)!;
    entry.leads += 1;

    const stageLabel = getStageNameForStatus(lead.status);
    if (stageLabel === 'Fechado (Ganho)') {
      entry.closed += 1;
    }
  });

  return Array.from(monthlyMap.values())
    .sort((a, b) => {
      if (a.year === b.year) {
        return a.monthIndex - b.monthIndex;
      }
      return a.year - b.year;
    })
    .map(entry => ({
      month: entry.month,
      year: entry.year,
      leads: entry.leads,
      closed_leads: entry.closed,
    }));
};

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    const leads = await fetchAllPipelineLeads();

    const stats = computeDashboardStats(leads);
    const segment_distribution = computeSegmentDistribution(leads);
    const monthly_evolution = computeMonthlyEvolution(leads);

    return {
      stats,
      charts: {
        monthly_evolution,
        segment_distribution,
      },
    };
  },
};
