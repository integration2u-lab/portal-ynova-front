type StageDefinition = {
  key: string;
  label: string;
  badgeClass: string;
  statuses: string[];
};

export const stageDefinitions: readonly StageDefinition[] = [
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
    statuses: ['qualifiedtobuy', 'qualificado', 'qualificacao', 'qualification'],
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

export type StageKey = (typeof stageDefinitions)[number]['key'];

export const DEFAULT_STAGE_KEY = 'outros';

export const stageKeyOrder: StageKey[] = stageDefinitions.map(definition => definition.key);

export const stageColorMap: Record<string, string> = {
  prospeccao: 'bg-blue-500',
  qualificacao: 'bg-yellow-500',
  'proposta enviada': 'bg-purple-500',
  negociacao: 'bg-orange-500',
  'em assinatura': 'bg-indigo-500',
  'fechado ganho': 'bg-green-500',
  'fechado perdido': 'bg-rose-500',
  [DEFAULT_STAGE_KEY]: 'bg-gray-500',
};

export const stageDisplayNameMap: Record<string, string> = {
  prospeccao: 'Apresentação Agendada',
  qualificacao: 'Qualificação',
  'proposta enviada': 'Proposta Enviada',
  negociacao: 'Em Negociação',
  'em assinatura': 'Em Assinatura',
  'fechado ganho': 'Fechado (Ganho)',
  'fechado perdido': 'Fechado (Perdido)',
};

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[()]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

export const normalizeStatus = (value: string): string => normalizeText(value).replace(/\s+/g, '');

export const formatStatusLabel = (value: string) => {
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

const statusToStageMap = new Map<string, StageDefinition>();

stageDefinitions.forEach(definition => {
  definition.statuses.forEach(status => {
    statusToStageMap.set(normalizeStatus(status), definition);
  });
});

const rawStatusFriendlyNames: Record<string, string> = {
  appointmentscheduled: 'Apresentação Agendada',
  novo: 'Novo Lead',
  prospeccao: 'Prospecção',
  prospecting: 'Prospecção',
  qualifiedtobuy: 'Qualificado para Comprar',
  qualificado: 'Lead Qualificado',
  qualificacao: 'Qualificação',
  qualification: 'Qualificação',
  presentationscheduled: 'Apresentação Realizada',
  proposta: 'Proposta Enviada',
  'proposta enviada': 'Proposta Enviada',
  proposal: 'Proposta Enviada',
  decisionmakerboughtin: 'Decisor Engajado',
  negociacao: 'Em Negociação',
  negotiation: 'Em Negociação',
  contractsent: 'Contrato Enviado',
  emassinatura: 'Em Assinatura',
  closedwon: 'Fechado (Ganho)',
  fechado: 'Fechado (Ganho)',
  'fechado ganho': 'Fechado (Ganho)',
  fechado_ganho: 'Fechado (Ganho)',
  won: 'Fechado (Ganho)',
  ganho: 'Fechado (Ganho)',
  closedlost: 'Fechado (Perdido)',
  'fechado perdido': 'Fechado (Perdido)',
  fechado_perdido: 'Fechado (Perdido)',
  lost: 'Fechado (Perdido)',
  perdido: 'Fechado (Perdido)',
};

const statusFriendlyNames = new Map<string, string>();

Object.entries(rawStatusFriendlyNames).forEach(([key, label]) => {
  statusFriendlyNames.set(normalizeStatus(key), label);
});

export const getStageDefinitionForStatus = (status: string) => {
  const normalized = normalizeStatus(status);
  if (!normalized) {
    return undefined;
  }
  return statusToStageMap.get(normalized);
};

export const getStageLabelForStatus = (status: string) => {
  const definition = getStageDefinitionForStatus(status);
  if (definition) {
    return definition.label;
  }
  return formatStatusLabel(status);
};

export const getStageKeyForStatus = (status: string): string => {
  const definition = getStageDefinitionForStatus(status);
  return definition?.key ?? DEFAULT_STAGE_KEY;
};

export const translateStatus = (status: string) => {
  const normalized = normalizeStatus(status);
  if (!normalized) {
    return 'Sem status';
  }

  if (statusFriendlyNames.has(normalized)) {
    return statusFriendlyNames.get(normalized)!;
  }

  const stageDefinition = getStageDefinitionForStatus(status);
  if (stageDefinition) {
    const displayName = stageDisplayNameMap[stageDefinition.key];
    if (displayName) {
      return displayName;
    }
    return stageDefinition.label;
  }

  return formatStatusLabel(status);
};

const buildStatusSet = (stageKey: StageKey) => {
  const definition = stageDefinitions.find(def => def.key === stageKey);
  if (!definition) {
    return new Set<string>();
  }
  return new Set(definition.statuses.map(status => normalizeStatus(status)));
};

export const closedWonStatusSet = buildStatusSet('fechado ganho');
export const closedLostStatusSet = buildStatusSet('fechado perdido');

export const closedStatusSet = new Set<string>([
  ...Array.from(closedWonStatusSet),
  ...Array.from(closedLostStatusSet),
]);

export const negotiationStatusSet = buildStatusSet('negociacao');

export const getStageDisplayName = (stageKey: string) => {
  return stageDisplayNameMap[stageKey] ?? stageLabelMap.get(stageKey) ?? 'Outros';
};

const stageLabelMap = new Map<string, string>();
stageDefinitions.forEach(def => {
  stageLabelMap.set(def.key, def.label);
});

export const getStageBadgeClass = (stageKey: string) => {
  return stageDefinitions.find(def => def.key === stageKey)?.badgeClass ?? 'bg-gray-100 text-gray-600';
};

export const getStageOrderIndex = (stageKey: string) => {
  const index = stageKeyOrder.indexOf(stageKey as StageKey);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

export const sortByStageOrder = <T extends { stageKey?: string }>(items: T[]) => {
  return items.slice().sort((a, b) => {
    const stageA = a.stageKey ?? DEFAULT_STAGE_KEY;
    const stageB = b.stageKey ?? DEFAULT_STAGE_KEY;
    const orderDiff = getStageOrderIndex(stageA) - getStageOrderIndex(stageB);
    if (orderDiff !== 0) {
      return orderDiff;
    }
    return 0;
  });
};
