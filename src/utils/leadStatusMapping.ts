export type StageDefinition = {
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
    key: 'fatura',
    label: 'Fatura',
    badgeClass: 'bg-amber-100 text-amber-700',
    statuses: ['1142458134', 'fatura', 'invoice'],
  },
  {
    key: 'qualificado',
    label: 'Qualificado',
    badgeClass: 'bg-purple-100 text-purple-700',
    statuses: ['qualifiedtobuy', 'qualificado', 'qualificacao', 'qualification'],
  },
  {
    key: 'apresentacao',
    label: 'Apresentação',
    badgeClass: 'bg-indigo-100 text-indigo-700',
    statuses: ['1142458135', 'apresentacao', 'apresentação', 'apresentacao realizada'],
  },
  {
    key: 'negociacao',
    label: 'Negociação',
    badgeClass: 'bg-orange-100 text-orange-700',
    statuses: ['decisionmakerboughtin', 'negociacao', 'negotiacao', 'negotiation'],
  },
  {
    key: 'fechamento',
    label: 'Fechamento',
    badgeClass: 'bg-cyan-100 text-cyan-700',
    statuses: ['presentationscheduled', 'fechamento', 'fechamento agendado'],
  },
  {
    key: 'em_assinatura',
    label: 'Em assinatura',
    badgeClass: 'bg-blue-100 text-blue-700',
    statuses: ['contractsent', 'emassinatura', 'em assinatura', 'assinatura'],
  },
  {
    key: 'nutricao',
    label: 'Nutrição',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    statuses: [
      'closedwon',
      'nutricao',
      'nutrição',
      'nurturing',
      'fechado',
      'fechado ganho',
      'fechado_ganho',
      'won',
      'ganho',
    ],
  },
  {
    key: 'contrato_gestao_ok',
    label: 'Contrato Gestão ok',
    badgeClass: 'bg-lime-100 text-lime-700',
    statuses: ['1173301169', 'contrato gestao', 'contrato gestao ok'],
  },
  {
    key: 'contrato_energia_ok',
    label: 'Contrato Energia ok',
    badgeClass: 'bg-teal-100 text-teal-700',
    statuses: ['1173301170', 'contrato energia', 'contrato energia ok'],
  },
  {
    key: 'perdido',
    label: 'Perdido',
    badgeClass: 'bg-rose-100 text-rose-700',
    statuses: ['1173301171', 'closedlost', 'perdido', 'lost', 'fechado perdido', 'fechado_perdido'],
  },
] as const;

export type StageKey = (typeof stageDefinitions)[number]['key'];

export const DEFAULT_STAGE_KEY = 'outros';

export const stageKeyOrder: StageKey[] = stageDefinitions.map(definition => definition.key);

export const stageColorMap: Record<string, string> = {
  prospeccao: 'bg-sky-500',
  fatura: 'bg-amber-500',
  qualificado: 'bg-purple-500',
  apresentacao: 'bg-indigo-500',
  negociacao: 'bg-orange-500',
  fechamento: 'bg-cyan-500',
  em_assinatura: 'bg-blue-500',
  nutricao: 'bg-emerald-500',
  contrato_gestao_ok: 'bg-lime-500',
  contrato_energia_ok: 'bg-teal-500',
  perdido: 'bg-rose-500',
  [DEFAULT_STAGE_KEY]: 'bg-gray-500',
};

export const stageDisplayNameMap: Record<string, string> = {
  prospeccao: 'Prospecção',
  fatura: 'Fatura',
  qualificado: 'Qualificado',
  apresentacao: 'Apresentação',
  negociacao: 'Negociação',
  fechamento: 'Fechamento',
  em_assinatura: 'Em assinatura',
  nutricao: 'Nutrição',
  contrato_gestao_ok: 'Contrato Gestão ok',
  contrato_energia_ok: 'Contrato Energia ok',
  perdido: 'Perdido',
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
  appointmentscheduled: 'Prospecção',
  novo: 'Prospecção',
  prospeccao: 'Prospecção',
  prospecting: 'Prospecção',
  '1142458134': 'Fatura',
  fatura: 'Fatura',
  invoice: 'Fatura',
  qualifiedtobuy: 'Qualificado',
  qualificado: 'Qualificado',
  qualificacao: 'Qualificado',
  qualification: 'Qualificado',
  '1142458135': 'Apresentação',
  apresentacao: 'Apresentação',
  apresentação: 'Apresentação',
  'apresentacao realizada': 'Apresentação',
  decisionmakerboughtin: 'Negociação',
  negociacao: 'Negociação',
  negotiacao: 'Negociação',
  negotiation: 'Negociação',
  presentationscheduled: 'Fechamento',
  fechamento: 'Fechamento',
  'fechamento agendado': 'Fechamento',
  contractsent: 'Em assinatura',
  emassinatura: 'Em assinatura',
  'em assinatura': 'Em assinatura',
  assinatura: 'Em assinatura',
  closedwon: 'Nutrição',
  nutricao: 'Nutrição',
  nutrição: 'Nutrição',
  nurturing: 'Nutrição',
  fechado: 'Nutrição',
  'fechado ganho': 'Nutrição',
  fechado_ganho: 'Nutrição',
  won: 'Nutrição',
  ganho: 'Nutrição',
  '1173301169': 'Contrato Gestão ok',
  'contrato gestao': 'Contrato Gestão ok',
  'contrato gestao ok': 'Contrato Gestão ok',
  '1173301170': 'Contrato Energia ok',
  'contrato energia': 'Contrato Energia ok',
  'contrato energia ok': 'Contrato Energia ok',
  '1173301171': 'Perdido',
  closedlost: 'Perdido',
  perdido: 'Perdido',
  lost: 'Perdido',
  'fechado perdido': 'Perdido',
  fechado_perdido: 'Perdido',
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

export const closedWonStatusSet = buildStatusSet('nutricao');
export const closedLostStatusSet = buildStatusSet('perdido');

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
