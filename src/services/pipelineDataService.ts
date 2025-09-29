import type { Lead } from '../types';
import { getLeads } from '../utils/api';
import {
  getStageDefinitionForStatus,
  getStageNameForStatus,
  getStageOrderMap,
  StageDefinition,
  normalizeStageName,
  stageDefinitions,
} from '../utils/pipelineStageUtils';

const stageOrderMap = getStageOrderMap();

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

const shouldFetchNextPage = (
  page: number,
  leadsFetched: number,
  limit: number,
  aggregateCount: number,
  pagination?: any
) => {
  if (pagination) {
    const currentPage = Number(pagination.current_page ?? pagination.currentPage);
    const lastPage = Number(pagination.last_page ?? pagination.lastPage);
    const totalPages = Number(
      pagination.total_pages ?? pagination.totalPages ?? pagination.pages
    );
    const totalItems = Number(
      pagination.total ?? pagination.total_items ?? pagination.totalItems ?? pagination.count
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

const parsePeriodToMonthYear = (period?: string | null, fallbackDate?: string | null) => {
  if (period) {
    const sanitized = period.toString().trim();
    if (sanitized) {
      const parts = sanitized.split(/[^0-9]/).filter(Boolean);

      let year: number | null = null;
      let month: number | null = null;

      if (parts.length === 1) {
        const only = parts[0];
        if (only.length === 6) {
          year = Number(only.slice(0, 4));
          month = Number(only.slice(4, 6));
        } else if (only.length === 8) {
          year = Number(only.slice(0, 4));
          month = Number(only.slice(4, 6));
        }
      } else if (parts.length >= 2) {
        const [first, second] = parts;
        if (first.length === 4) {
          year = Number(first);
          month = Number(second.slice(0, 2));
        } else if (second.length === 4) {
          month = Number(first.slice(-2));
          year = Number(second);
        } else if (parts.length >= 3) {
          month = Number(second.slice(0, 2));
          year = Number(parts[2].slice(0, 4));
        }
      }

      if (year && month && month >= 1 && month <= 12) {
        const date = new Date(year, month - 1, 1);
        if (!Number.isNaN(date.getTime())) {
          return {
            month: date.toLocaleString('pt-BR', { month: 'long' }),
            year: date.getFullYear(),
          };
        }
      }
    }
  }

  if (fallbackDate) {
    const date = new Date(fallbackDate);
    if (!Number.isNaN(date.getTime())) {
      return {
        month: date.toLocaleString('pt-BR', { month: 'long' }),
        year: date.getFullYear(),
      };
    }
  }

  const now = new Date();
  return {
    month: now.toLocaleString('pt-BR', { month: 'long' }),
    year: now.getFullYear(),
  };
};

export const normalizeLead = (rawLead: any): Lead => {
  const fallbackId = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const id = rawLead?.id ?? rawLead?.consumer_unit ?? rawLead?.consumerUnit ?? rawLead?.uc ?? fallbackId;
  const createdAt = rawLead?.dataCriacao ?? rawLead?.created_at ?? rawLead?.createdAt ?? null;

  const periodInfo = parsePeriodToMonthYear(
    rawLead?.periodo ?? rawLead?.period ?? rawLead?.reference_period,
    createdAt
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

  return {
    id: String(id ?? fallbackId),
    consumer_unit: String(
      rawLead?.consumer_unit ?? rawLead?.consumerUnit ?? rawLead?.uc ?? rawLead?.id ?? fallbackId
    ),
    name: String(rawLead?.nome ?? rawLead?.name ?? 'Lead sem nome'),
    phone: String(rawLead?.telefone ?? rawLead?.phone ?? ''),
    email: String(rawLead?.email ?? ''),
    cnpj: String(rawLead?.cnpj ?? rawLead?.documento ?? rawLead?.document ?? ''),
    month: periodInfo.month,
    year: Number.isFinite(periodInfo.year) ? periodInfo.year : new Date().getFullYear(),
    energy_value: normalizeInvoiceValue(rawLead?.valorEnergia ?? rawLead?.energy_value),
    invoice_amount: normalizeInvoiceValue(
      rawLead?.valorFatura ?? rawLead?.invoice_amount ?? rawLead?.invoiceAmount
    ),
    status: String(rawLead?.status ?? rawLead?.status_pipeline ?? rawLead?.stage ?? 'Sem status'),
    observations: rawLead?.observations ?? rawLead?.observacao ?? '',
    consultant_id: rawLead?.consultant_id ?? rawLead?.consultor_id ?? undefined,
    created_at: createdAt ?? new Date().toISOString(),
    updated_at:
      rawLead?.dataAtualizacao ??
      rawLead?.updated_at ??
      rawLead?.updatedAt ??
      createdAt ??
      new Date().toISOString(),
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
    commission_amount: normalizeInvoiceValue(
      rawLead?.commission_amount ?? rawLead?.commission ?? rawLead?.comissao ?? rawLead?.commissionValue
    ),
  };
};

export const fetchAllPipelineLeads = async () => {
  const aggregatedLeads: any[] = [];
  const limitPerPage = 100;
  const MAX_PAGES = 100;

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await getLeads({ page, limit: limitPerPage });

    if (response?.success === false) {
      throw new Error(response?.message || 'Não foi possível carregar os leads da pipeline.');
    }

    const leadsData = extractLeadsFromResponse(response);

    if (!Array.isArray(leadsData)) {
      break;
    }

    aggregatedLeads.push(...leadsData);

    const pagination =
      response?.data?.meta ??
      response?.data?.pagination ??
      response?.meta ??
      response?.pagination;

    if (!shouldFetchNextPage(page, leadsData.length, limitPerPage, aggregatedLeads.length, pagination)) {
      break;
    }
  }

  return aggregatedLeads.map(normalizeLead);
};

export const buildPipelineFromLeads = (leads: Lead[]) => {
  const groupedByStage = new Map<string, { definition?: StageDefinition; leads: Lead[] }>();

  leads.forEach(lead => {
    const stageName = getStageNameForStatus(lead.status);
    const definition = stageOrderMap.get(stageName) ?? getStageDefinitionForStatus(lead.status);
    const key = stageName || 'Sem status';

    if (!groupedByStage.has(key)) {
      groupedByStage.set(key, { definition: definition ?? undefined, leads: [] });
    }

    groupedByStage.get(key)!.leads.push(lead);
  });

  const sortedEntries = Array.from(groupedByStage.entries())
    .map(([stageName, value]) => {
      const sortedLeads = value.leads.slice().sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });

      return {
        stageName,
        definition: value.definition,
        leads: sortedLeads,
      };
    })
    .sort((a, b) => {
      const defA = stageOrderMap.get(a.stageName);
      const defB = stageOrderMap.get(b.stageName);

      if (defA && defB) {
        return stageDefinitions.indexOf(defA) - stageDefinitions.indexOf(defB);
      }

      if (defA) {
        return -1;
      }

      if (defB) {
        return 1;
      }

      return a.stageName.localeCompare(b.stageName, 'pt-BR');
    });

  const stages: { id: number; stage: string; leads: number; definition?: StageDefinition }[] = [];
  const stageLeads: Record<number, Lead[]> = {};

  sortedEntries.forEach((entry, index) => {
    const stageId = index + 1;
    stages.push({ id: stageId, stage: entry.stageName, leads: entry.leads.length, definition: entry.definition });
    stageLeads[stageId] = entry.leads;
  });

  return { stages, stageLeads };
};

export const parseCurrencyToNumber = (value: string | number | null | undefined) => {
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

    const sanitized = trimmed
      .replace(/R\$\s*/gi, '')
      .replace(/\./g, '')
      .replace(/,/g, '.')
      .replace(/[^0-9.-]/g, '');

    const parsed = Number(sanitized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

export const normalizeStatusForGrouping = (status?: string | null) => normalizeStageName(status ?? '');
