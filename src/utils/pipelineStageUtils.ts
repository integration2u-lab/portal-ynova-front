const normalizeStageName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[()]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const formatStatusLabel = (value: string) => {
  if (!value) {
    return 'Sem status';
  }

  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const stageDefinitions = [
  {
    key: 'prospeccao',
    label: 'Prospecção',
    badgeClass: 'bg-sky-100 text-sky-700',
    statuses: ['appointmentscheduled', 'novo', 'prospeccao', 'prospecting'],
  },
  {
    key: 'qualificacao',
    label: 'Qualificação',
    badgeClass: 'bg-purple-100 text-purple-700',
    statuses: ['qualifiedtobuy', 'qualificado', 'qualificacao', 'qualification', 'qualified'],
  },
  {
    key: 'proposta enviada',
    label: 'Proposta Enviada',
    badgeClass: 'bg-amber-100 text-amber-700',
    statuses: ['presentationscheduled', 'proposta', 'proposta enviada', 'proposal'],
  },
  {
    key: 'negociacao',
    label: 'Negociação',
    badgeClass: 'bg-orange-100 text-orange-700',
    statuses: ['decisionmakerboughtin', 'negociacao', 'negotiacao', 'negotiation'],
  },
  {
    key: 'em assinatura',
    label: 'Em assinatura',
    badgeClass: 'bg-indigo-100 text-indigo-700',
    statuses: ['contractsent', 'emassinatura'],
  },
  {
    key: 'fechado ganho',
    label: 'Fechado (Ganho)',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    statuses: ['closedwon', 'fechado', 'fechado ganho', 'fechado_ganho', 'won', 'ganho'],
  },
  {
    key: 'fechado perdido',
    label: 'Fechado (Perdido)',
    badgeClass: 'bg-rose-100 text-rose-700',
    statuses: ['closedlost', 'fechado perdido', 'fechado_perdido', 'lost', 'perdido'],
  },
] as const;

export type StageDefinition = (typeof stageDefinitions)[number];

const stageOrderMap = new Map<string, StageDefinition>();
const statusToStageDefinition = new Map<string, StageDefinition>();

stageDefinitions.forEach(definition => {
  stageOrderMap.set(definition.label, definition);
  statusToStageDefinition.set(normalizeStageName(definition.label), definition);

  definition.statuses.forEach(status => {
    statusToStageDefinition.set(normalizeStageName(status), definition);
  });
});

const statusLabelOverrides: Record<string, string> = {
  appointmentscheduled: 'Apresentação agendada',
  presentationscheduled: 'Apresentação agendada',
  novo: 'Novo',
  prospecting: 'Prospecção',
  qualified: 'Qualificado',
  qualifiedtobuy: 'Qualificado',
  qualificacao: 'Qualificação',
  qualification: 'Qualificação',
  proposta: 'Proposta enviada',
  proposal: 'Proposta enviada',
  decisionmakerboughtin: 'Negociação',
  negociacao: 'Negociação',
  negotiation: 'Negociação',
  contractsent: 'Em assinatura',
  emassinatura: 'Em assinatura',
  closedwon: 'Fechado (ganho)',
  won: 'Fechado (ganho)',
  ganho: 'Fechado (ganho)',
  fechado: 'Fechado (ganho)',
  fechado_ganho: 'Fechado (ganho)',
  closedlost: 'Fechado (perdido)',
  lost: 'Fechado (perdido)',
  perdido: 'Fechado (perdido)',
  fechado_perdido: 'Fechado (perdido)',
};

const buildStatusMap = () => {
  const entries = new Map<string, string>();

  const register = (status: string, label: string) => {
    const normalized = normalizeStageName(status);
    if (!normalized) {
      return;
    }
    if (!entries.has(normalized)) {
      entries.set(normalized, label);
    }
  };

  Object.entries(statusLabelOverrides).forEach(([status, label]) => {
    register(status, label);
  });

  stageDefinitions.forEach(definition => {
    register(definition.label, definition.label);
    definition.statuses.forEach(status => {
      const normalized = normalizeStageName(status);
      const override = statusLabelOverrides[normalized];
      register(status, override ?? definition.label);
    });
  });

  return entries;
};

const statusDisplayMap = buildStatusMap();

export const statusMap: Record<string, string> = Object.fromEntries(statusDisplayMap.entries());

export const getStageDefinitionForStatus = (status?: string | null) => {
  if (!status) {
    return undefined;
  }

  const normalized = normalizeStageName(status);
  return statusToStageDefinition.get(normalized);
};

export const getStageNameForStatus = (status?: string | null) => {
  if (!status) {
    return 'Sem status';
  }

  const definition = getStageDefinitionForStatus(status);
  if (definition) {
    return definition.label;
  }

  return formatStatusLabel(status);
};

export const getBadgeClassForStage = (stageName: string) => {
  const definition = stageOrderMap.get(stageName);
  return definition?.badgeClass ?? 'bg-gray-100 text-gray-600';
};

export const getStageOrderMap = () => stageOrderMap;

export const getStatusDisplayName = (status?: string | null) => {
  if (!status) {
    return 'Sem status';
  }

  const normalized = normalizeStageName(status);
  if (statusDisplayMap.has(normalized)) {
    return statusDisplayMap.get(normalized)!;
  }

  return getStageNameForStatus(status);
};

export const normalizeStatusKey = (status?: string | null) => {
  if (!status) {
    return 'sem status';
  }
  const normalized = normalizeStageName(status);
  return normalized || 'sem status';
};

export { normalizeStageName, formatStatusLabel, statusToStageDefinition as statusToStageDefinitionMap };
