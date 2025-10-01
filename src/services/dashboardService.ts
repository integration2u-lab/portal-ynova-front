import type { Lead } from '../types';
import { getLeads } from '../utils/api';
import {
  DEFAULT_STAGE_KEY,
  closedStatusSet,
  closedWonStatusSet,
  getStageDisplayName,
  getStageKeyForStatus,
  getStageOrderIndex,
  negotiationStatusSet,
  normalizeStatus,
  stageDefinitions,
  translateStatus,
} from '../utils/leadStatusMapping';

export interface DashboardStats {
  leads_ativos: number;
  taxa_conversao: number;
  receita_potencial: number;
  propostas_em_negociacao: number;
  total_consultants?: number;
  current_month_leads?: number;
  previous_month_leads?: number;
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
  label: string;
  stageKey: string;
  stageLabel: string;
  count: number;
}

export interface ChartData {
  monthly_evolution: MonthlyEvolution[];
  segment_distribution: SegmentDistribution[];
}

export interface DashboardStatsResponse {
  success: boolean;
  data: DashboardStats;
}

export interface DashboardChartsResponse {
  success: boolean;
  data: ChartData;
}

export interface DashboardDataResponse {
  success: boolean;
  data: {
    stats: DashboardStats;
    charts: ChartData;
  };
}

type NormalizedLead = Lead & { monthNumber: number };

const extractLeadsFromResponse = (response: any): any[] => {
  if (Array.isArray(response?.data?.leads)) {
    return response.data.leads;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.leads)) {
    return response.leads;
  }

  if (Array.isArray(response)) {
    return response;
  }

  return [];
};

const shouldFetchNextPage = (
  page: number,
  leadsFetched: number,
  limit: number,
  aggregateCount: number,
  pagination?: any,
) => {
  if (pagination) {
    const currentPage = Number(pagination.current_page ?? pagination.currentPage);
    const lastPage = Number(pagination.last_page ?? pagination.lastPage);
    const totalPages = Number(
      pagination.total_pages ?? pagination.totalPages ?? pagination.pages,
    );
    const totalItems = Number(
      pagination.total ?? pagination.total_items ?? pagination.totalItems ?? pagination.count,
    );

    if (Number.isFinite(currentPage) && Number.isFinite(lastPage)) {
      return currentPage < lastPage;
    }

    if (Number.isFinite(totalPages)) {
      return page < totalPages;
    }

    if (Number.isFinite(totalItems)) {
      return aggregateCount < totalItems;
    }
  }

  return leadsFetched >= limit;
};

const parsePeriodToMonthYear = (period?: string | null, fallbackDate?: string | null) => {
  const now = new Date();
  let year = now.getFullYear();
  let monthNumber = now.getMonth() + 1;

  const parseWithDate = (date: Date) => {
    const parsedMonth = date.getMonth() + 1;
    const parsedYear = date.getFullYear();
    if (!Number.isNaN(parsedMonth) && !Number.isNaN(parsedYear)) {
      monthNumber = parsedMonth;
      year = parsedYear;
    }
  };

  const sanitize = (value: string) => value.toString().trim();

  if (period) {
    const sanitized = sanitize(period);
    if (sanitized) {
      const parts = sanitized.split(/[^0-9]/).filter(Boolean);

      let parsedYear: number | null = null;
      let parsedMonth: number | null = null;

      if (parts.length === 1) {
        const only = parts[0];
        if (only.length === 6) {
          parsedYear = Number(only.slice(0, 4));
          parsedMonth = Number(only.slice(4, 6));
        } else if (only.length === 8) {
          parsedYear = Number(only.slice(0, 4));
          parsedMonth = Number(only.slice(4, 6));
        }
      } else if (parts.length >= 2) {
        const [first, second] = parts;
        if (first.length === 4) {
          parsedYear = Number(first);
          parsedMonth = Number(second.slice(0, 2));
        } else if (second.length === 4) {
          parsedMonth = Number(first.slice(-2));
          parsedYear = Number(second);
        } else if (parts.length >= 3) {
          parsedMonth = Number(second.slice(0, 2));
          parsedYear = Number(parts[2].slice(0, 4));
        }
      }

      if (parsedYear && parsedMonth && parsedMonth >= 1 && parsedMonth <= 12) {
        parseWithDate(new Date(parsedYear, parsedMonth - 1, 1));
      }
    }
  }

  if (fallbackDate) {
    const date = new Date(fallbackDate);
    if (!Number.isNaN(date.getTime())) {
      parseWithDate(date);
    }
  }

  const dateForLabel = new Date(year, monthNumber - 1, 1);
  const monthName = dateForLabel.toLocaleString('pt-BR', { month: 'long' });

  return {
    monthName,
    year,
    monthNumber,
  };
};

const capitalizeWords = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const normalizeInvoiceValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }
    return trimmed;
  }

  return '';
};

const normalizeLead = (rawLead: any): NormalizedLead => {
  const fallbackId = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const id = rawLead?.id ?? rawLead?.consumer_unit ?? rawLead?.consumerUnit ?? rawLead?.uc ?? fallbackId;
  const createdAt = rawLead?.dataCriacao ?? rawLead?.created_at ?? rawLead?.createdAt ?? null;

  const periodInfo = parsePeriodToMonthYear(
    rawLead?.periodo ?? rawLead?.period ?? rawLead?.reference_period,
    createdAt,
  );

  const consultantSource = rawLead?.consultant ?? rawLead?.consultor;
  const consultant = (() => {
    if (!consultantSource) {
      return undefined;
    }

    const idValue = consultantSource.id ?? consultantSource.consultant_id ?? consultantSource.user_id;
    const nameValue = consultantSource.name ?? consultantSource.nome ?? '';
    const surnameValue = consultantSource.surname ?? consultantSource.sobrenome ?? '';
    const emailValue = consultantSource.email ?? '';

    if (!idValue && !nameValue && !surnameValue && !emailValue) {
      return undefined;
    }

    return {
      id: String(idValue ?? ''),
      name: String(nameValue ?? ''),
      surname: String(surnameValue ?? ''),
      email: String(emailValue ?? ''),
    };
  })();

  const monthLabel = capitalizeWords(periodInfo.monthName);

  return {
    id: String(id ?? fallbackId),
    consumer_unit: String(
      rawLead?.consumer_unit ?? rawLead?.consumerUnit ?? rawLead?.uc ?? rawLead?.id ?? fallbackId,
    ),
    name: String(rawLead?.nome ?? rawLead?.name ?? 'Lead sem nome'),
    phone: String(rawLead?.telefone ?? rawLead?.phone ?? ''),
    email: String(rawLead?.email ?? ''),
    cnpj: String(rawLead?.cnpj ?? rawLead?.documento ?? rawLead?.document ?? ''),
    month: monthLabel,
    year: Number.isFinite(periodInfo.year) ? periodInfo.year : new Date().getFullYear(),
    energy_value: normalizeInvoiceValue(rawLead?.valorEnergia ?? rawLead?.energy_value),
    invoice_amount: normalizeInvoiceValue(
      rawLead?.valorFatura ?? rawLead?.invoice_amount ?? rawLead?.invoiceAmount,
    ),
    status: String(rawLead?.status ?? rawLead?.status_pipeline ?? rawLead?.stage ?? 'Sem status'),
    observations: rawLead?.observations ?? rawLead?.observacao ?? '',
    consultant_id: rawLead?.consultant_id ?? rawLead?.consultor_id ?? undefined,
    created_at: createdAt ?? new Date().toISOString(),
    updated_at:
      rawLead?.dataAtualizacao ?? rawLead?.updated_at ?? rawLead?.updatedAt ?? createdAt ?? new Date().toISOString(),
    deleted_at: rawLead?.deleted_at ?? undefined,
    has_solar_generation: rawLead?.has_solar_generation ?? false,
    solar_generation_type: rawLead?.solar_generation_type ?? '',
    address: rawLead?.address ?? '',
    city: rawLead?.city ?? '',
    state: rawLead?.state ?? '',
    zip_code: rawLead?.zip_code ?? '',
    source: rawLead?.source ?? rawLead?.origem ?? '',
    consultant,
    lead_invoices: Array.isArray(rawLead?.lead_invoices) ? rawLead.lead_invoices : [],
    monthNumber: periodInfo.monthNumber,
  };
};

const fetchAllLeads = async (): Promise<NormalizedLead[]> => {
  const aggregatedLeads: NormalizedLead[] = [];
  const limitPerPage = 100;
  const MAX_PAGES = 100;

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await getLeads({ page, limit: limitPerPage });

    if (response?.success === false) {
      throw new Error(response?.message || 'Não foi possível carregar os leads da pipeline.');
    }

    const leadsData = extractLeadsFromResponse(response);

    if (!Array.isArray(leadsData) || !leadsData.length) {
      break;
    }

    aggregatedLeads.push(...leadsData.map(normalizeLead));

    const pagination =
      response?.data?.meta ??
      response?.data?.pagination ??
      response?.meta ??
      response?.pagination;

    if (!shouldFetchNextPage(page, leadsData.length, limitPerPage, aggregatedLeads.length, pagination)) {
      break;
    }
  }

  return aggregatedLeads;
};

const parseCurrencyToNumber = (value: unknown): number => {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return 0;
    }

    const sanitized = trimmed.replace(/[^0-9.,-]/g, '');
    const normalized = sanitized.includes(',') ? sanitized.replace(/\./g, '').replace(',', '.') : sanitized;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const computeDashboardStats = (leads: NormalizedLead[]): DashboardStats => {
  const totalLeads = leads.length;
  const activeLeads = leads.filter(lead => !closedStatusSet.has(normalizeStatus(lead.status))).length;
  const closedWon = leads.filter(lead => closedWonStatusSet.has(normalizeStatus(lead.status))).length;
  const negotiationLeads = leads.filter(lead => negotiationStatusSet.has(normalizeStatus(lead.status))).length;
  const totalRevenue = leads.reduce((sum, lead) => sum + parseCurrencyToNumber(lead.invoice_amount), 0);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const previousMonthDate = new Date(currentYear, currentMonth - 2, 1);
  const previousMonth = previousMonthDate.getMonth() + 1;
  const previousYear = previousMonthDate.getFullYear();

  const currentMonthLeads = leads.filter(
    lead => lead.year === currentYear && lead.monthNumber === currentMonth,
  ).length;
  const previousMonthLeads = leads.filter(
    lead => lead.year === previousYear && lead.monthNumber === previousMonth,
  ).length;

  const conversionRate = totalLeads > 0 ? (closedWon / totalLeads) * 100 : 0;
  const monthlyGrowth = previousMonthLeads > 0
    ? ((currentMonthLeads - previousMonthLeads) / previousMonthLeads) * 100
    : currentMonthLeads > 0
      ? 100
      : 0;

  const consultants = new Set<string>();
  leads.forEach(lead => {
    const consultantId = lead.consultant?.id ?? (lead.consultant_id ? String(lead.consultant_id) : undefined);
    if (consultantId) {
      consultants.add(consultantId);
    }
  });

  return {
    leads_ativos: activeLeads,
    taxa_conversao: Number(conversionRate.toFixed(2)),
    receita_potencial: Number(totalRevenue.toFixed(2)),
    propostas_em_negociacao: negotiationLeads,
    total_consultants: consultants.size || undefined,
    current_month_leads: currentMonthLeads,
    previous_month_leads: previousMonthLeads,
    monthly_growth: Number(monthlyGrowth.toFixed(2)),
  };
};

const computeMonthlyEvolution = (leads: NormalizedLead[]): MonthlyEvolution[] => {
  const monthlyMap = new Map<string, { month: string; year: number; monthNumber: number; leads: number; closed: number }>();

  leads.forEach(lead => {
    const key = `${lead.year}-${lead.monthNumber}`;
    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, {
        month: lead.month,
        year: lead.year,
        monthNumber: lead.monthNumber,
        leads: 0,
        closed: 0,
      });
    }

    const entry = monthlyMap.get(key)!;
    entry.leads += 1;
    if (closedWonStatusSet.has(normalizeStatus(lead.status))) {
      entry.closed += 1;
    }
  });

  return Array.from(monthlyMap.values())
    .sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year;
      }
      return a.monthNumber - b.monthNumber;
    })
    .map(entry => ({
      month: entry.month,
      year: entry.year,
      leads: entry.leads,
      closed_leads: entry.closed,
    }));
};

const computeSegmentDistribution = (leads: NormalizedLead[]): SegmentDistribution[] => {
  const distributionMap = new Map<string, SegmentDistribution>();
  const baseStageEntries = new Map<string, SegmentDistribution>();

  stageDefinitions.forEach(definition => {
    const entry: SegmentDistribution = {
      status: definition.key,
      label: definition.label,
      stageKey: definition.key,
      stageLabel: definition.label,
      count: 0,
    };
    baseStageEntries.set(definition.key, entry);
    distributionMap.set(definition.key, entry);
  });

  const additionalEntries = new Map<string, SegmentDistribution>();

  leads.forEach(lead => {
    const stageKey = getStageKeyForStatus(lead.status) || DEFAULT_STAGE_KEY;

    if (distributionMap.has(stageKey)) {
      distributionMap.get(stageKey)!.count += 1;
      return;
    }

    const label = translateStatus(lead.status);
    const normalizedLabel = normalizeStatus(label) || stageKey;
    const key = `${DEFAULT_STAGE_KEY}:${normalizedLabel}`;

    if (!additionalEntries.has(key)) {
      additionalEntries.set(key, {
        status: normalizedLabel,
        label,
        stageKey: DEFAULT_STAGE_KEY,
        stageLabel: getStageDisplayName(DEFAULT_STAGE_KEY),
        count: 0,
      });
    }

    additionalEntries.get(key)!.count += 1;
  });

  const result = [
    ...baseStageEntries.values(),
    ...additionalEntries.values(),
  ];

  return result.sort((a, b) => {
    const orderDiff = getStageOrderIndex(a.stageKey) - getStageOrderIndex(b.stageKey);
    if (orderDiff !== 0) {
      return orderDiff;
    }
    return a.label.localeCompare(b.label, 'pt-BR');
  });
};

export const dashboardService = {
  async getDashboardData(): Promise<DashboardDataResponse> {
    const leads = await fetchAllLeads();
    const stats = computeDashboardStats(leads);
    const charts: ChartData = {
      monthly_evolution: computeMonthlyEvolution(leads),
      segment_distribution: computeSegmentDistribution(leads),
    };

    return {
      success: true,
      data: {
        stats,
        charts,
      },
    };
  },

  async getDashboardStats(): Promise<DashboardStatsResponse> {
    const response = await this.getDashboardData();
    return {
      success: response.success,
      data: response.data.stats,
    };
  },

  async getDashboardCharts(): Promise<DashboardChartsResponse> {
    const response = await this.getDashboardData();
    return {
      success: response.success,
      data: response.data.charts,
    };
  },
};
