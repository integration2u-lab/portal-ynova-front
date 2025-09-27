import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Building2,
  Calendar,
  ChevronDown,
  FileText,
  Loader2,
  Mail,
  Phone,
  RefreshCcw,
  User,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { Lead } from '../../types'
import { getLeads } from '../../utils/api'

const YNOVA_LEADS_ENDPOINT = 'https://api.ynovamarketplace.com/api/leads'

const stageColors = [
  'from-orange-500 to-orange-400',
  'from-sky-500 to-sky-400',
  'from-purple-500 to-purple-400',
  'from-amber-500 to-amber-400',
  'from-indigo-500 to-indigo-400',
  'from-emerald-500 to-emerald-400',
  'from-rose-500 to-rose-400',
]

const stageDefinitions = [
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
] as const

type StageDefinition = (typeof stageDefinitions)[number]

type PipelineStage = {
  id: number
  stage: string
  leads: number
  definition?: StageDefinition
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const getPayloadErrorMessage = (payload: unknown) => {
  if (payload && typeof payload === 'object') {
    const candidateMessages = [
      (payload as any).error,
      (payload as any).message,
      (payload as any).msg,
      (payload as any).detail,
      (payload as any)?.data?.message,
    ]

    for (const candidate of candidateMessages) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim()
      }
    }
  }

  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim()
  }

  return 'Não foi possível carregar os leads da pipeline.'
}

const unwrapLeadsPayload = (payload: unknown): unknown[] => {
  if (payload && typeof payload === 'object' && 'success' in (payload as any) && (payload as any).success === false) {
    throw new Error(getPayloadErrorMessage(payload))
  }

  const candidates = [
    payload,
    (payload as any)?.data?.leads,
    (payload as any)?.data?.data,
    (payload as any)?.data,
    (payload as any)?.leads,
    (payload as any)?.items,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
    }
  }

  return []
}

const fetchPipelineLeads = async (token: string) => {
  try {
    const response = await getLeads({ limit: 500 })
    const leads = unwrapLeadsPayload(response)
    if (Array.isArray(leads) && leads.length >= 0) {
      return leads
    }
  } catch (internalError) {
    console.error('Falha ao carregar leads pela API configurada. Tentando endpoint Ynova direto.', internalError)
  }

  const directResponse = await fetch(YNOVA_LEADS_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  let payload: unknown = null
  let rawBody = ''

  try {
    rawBody = await directResponse.text()
    payload = rawBody ? JSON.parse(rawBody) : null
  } catch (parseError) {
    payload = rawBody || null
    console.error('Falha ao interpretar resposta do endpoint Ynova.', parseError)
  }

  if (!directResponse.ok) {
    throw new Error(getPayloadErrorMessage(payload))
  }

  return unwrapLeadsPayload(payload)
}

const normalizeStageName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[()]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

const formatStatusLabel = (value: string) => {
  if (!value) {
    return 'Sem status'
  }

  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const stageOrderMap = new Map<string, StageDefinition>()
const statusToStageName = new Map<string, StageDefinition>()

stageDefinitions.forEach(definition => {
  stageOrderMap.set(definition.label, definition)
  statusToStageName.set(normalizeStageName(definition.label), definition)
  definition.statuses.forEach(status => {
    statusToStageName.set(normalizeStageName(status), definition)
  })
})

const getStageDefinitionForStatus = (status: string) => {
  if (!status) {
    return undefined
  }

  const normalized = normalizeStageName(status)
  return statusToStageName.get(normalized)
}

const getStageNameForStatus = (status: string) => {
  const definition = getStageDefinitionForStatus(status)
  if (definition) {
    return definition.label
  }
  return formatStatusLabel(status)
}

const getBadgeClassForStage = (stageName: string) => {
  const definition = stageOrderMap.get(stageName)
  return definition?.badgeClass ?? 'bg-gray-100 text-gray-600'
}

const parsePeriodToMonthYear = (period?: string | null, fallbackDate?: string | null) => {
  if (period) {
    const sanitized = period.toString().trim()
    if (sanitized) {
      const parts = sanitized.split(/[^0-9]/).filter(Boolean)

      let year: number | null = null
      let month: number | null = null

      if (parts.length === 1) {
        const only = parts[0]
        if (only.length === 6) {
          year = Number(only.slice(0, 4))
          month = Number(only.slice(4, 6))
        } else if (only.length === 8) {
          year = Number(only.slice(0, 4))
          month = Number(only.slice(4, 6))
        }
      } else if (parts.length >= 2) {
        const [first, second] = parts
        if (first.length === 4) {
          year = Number(first)
          month = Number(second.slice(0, 2))
        } else if (second.length === 4) {
          month = Number(first.slice(-2))
          year = Number(second)
        } else if (parts.length >= 3) {
          month = Number(second.slice(0, 2))
          year = Number(parts[2].slice(0, 4))
        }
      }

      if (year && month && month >= 1 && month <= 12) {
        const date = new Date(year, month - 1, 1)
        if (!Number.isNaN(date.getTime())) {
          return {
            month: date.toLocaleString('pt-BR', { month: 'long' }),
            year: date.getFullYear(),
          }
        }
      }
    }
  }

  if (fallbackDate) {
    const date = new Date(fallbackDate)
    if (!Number.isNaN(date.getTime())) {
      return {
        month: date.toLocaleString('pt-BR', { month: 'long' }),
        year: date.getFullYear(),
      }
    }
  }

  const now = new Date()
  return {
    month: now.toLocaleString('pt-BR', { month: 'long' }),
    year: now.getFullYear(),
  }
}

const normalizeInvoiceValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'number') {
    return value.toString()
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return ''
    }
    return trimmed
  }

  return ''
}

const normalizeLead = (rawLead: any): Lead => {
  const fallbackId = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const id = rawLead?.id ?? rawLead?.consumer_unit ?? rawLead?.consumerUnit ?? rawLead?.uc ?? fallbackId
  const createdAt = rawLead?.dataCriacao ?? rawLead?.created_at ?? rawLead?.createdAt ?? null

  const periodInfo = parsePeriodToMonthYear(rawLead?.periodo ?? rawLead?.period ?? rawLead?.reference_period, createdAt)

  const consultantSource = rawLead?.consultant ?? rawLead?.consultor
  const consultant = (() => {
    if (!consultantSource) {
      return undefined
    }

    const idValue = consultantSource.id ?? consultantSource.consultant_id ?? consultantSource.user_id
    const nameValue = consultantSource.name ?? consultantSource.nome ?? ''
    const surnameValue = consultantSource.surname ?? consultantSource.sobrenome ?? ''
    const emailValue = consultantSource.email ?? ''

    if (!idValue && !nameValue && !surnameValue && !emailValue) {
      return undefined
    }

    return {
      id: String(idValue ?? ''),
      name: String(nameValue ?? ''),
      surname: String(surnameValue ?? ''),
      email: String(emailValue ?? ''),
    }
  })()

  return {
    id: String(id ?? fallbackId),
    consumer_unit: String(rawLead?.consumer_unit ?? rawLead?.consumerUnit ?? rawLead?.uc ?? rawLead?.id ?? fallbackId),
    name: String(rawLead?.nome ?? rawLead?.name ?? 'Lead sem nome'),
    phone: String(rawLead?.telefone ?? rawLead?.phone ?? ''),
    email: String(rawLead?.email ?? ''),
    cnpj: String(rawLead?.cnpj ?? rawLead?.documento ?? rawLead?.document ?? ''),
    month: periodInfo.month,
    year: Number.isFinite(periodInfo.year) ? periodInfo.year : new Date().getFullYear(),
    energy_value: normalizeInvoiceValue(rawLead?.valorEnergia ?? rawLead?.energy_value),
    invoice_amount: normalizeInvoiceValue(rawLead?.valorFatura ?? rawLead?.invoice_amount ?? rawLead?.invoiceAmount),
    status: String(rawLead?.status ?? rawLead?.status_pipeline ?? rawLead?.stage ?? 'Sem status'),
    observations: rawLead?.observations ?? rawLead?.observacao ?? '',
    consultant_id: rawLead?.consultant_id ?? rawLead?.consultor_id ?? undefined,
    created_at: createdAt ?? new Date().toISOString(),
    updated_at: rawLead?.dataAtualizacao ?? rawLead?.updated_at ?? rawLead?.updatedAt ?? createdAt ?? new Date().toISOString(),
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
  }
}

const buildPipelineFromLeads = (leads: Lead[]) => {
  const groupedByStage = new Map<string, { definition?: StageDefinition; leads: Lead[] }>()

  leads.forEach(lead => {
    const stageName = getStageNameForStatus(lead.status)
    const definition = stageOrderMap.get(stageName) ?? getStageDefinitionForStatus(lead.status)
    const key = stageName || 'Sem status'

    if (!groupedByStage.has(key)) {
      groupedByStage.set(key, { definition: definition ?? undefined, leads: [] })
    }

    groupedByStage.get(key)!.leads.push(lead)
  })

  const sortedEntries = Array.from(groupedByStage.entries())
    .map(([stageName, value]) => {
      const sortedLeads = value.leads.slice().sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return dateB - dateA
      })

      return {
        stageName,
        definition: value.definition,
        leads: sortedLeads,
      }
    })
    .sort((a, b) => {
      const defA = stageOrderMap.get(a.stageName)
      const defB = stageOrderMap.get(b.stageName)

      if (defA && defB) {
        return stageDefinitions.indexOf(defA) - stageDefinitions.indexOf(defB)
      }

      if (defA) {
        return -1
      }

      if (defB) {
        return 1
      }

      return a.stageName.localeCompare(b.stageName, 'pt-BR')
    })

  const stages: PipelineStage[] = []
  const stageLeads: Record<number, Lead[]> = {}

  sortedEntries.forEach((entry, index) => {
    const stageId = index + 1
    stages.push({ id: stageId, stage: entry.stageName, leads: entry.leads.length, definition: entry.definition })
    stageLeads[stageId] = entry.leads
  })

  return { stages, stageLeads }
}

const formatCurrencyValue = (value?: string | number | null) => {
  if (value === null || value === undefined) {
    return '—'
  }

  if (typeof value === 'number') {
    return currencyFormatter.format(value)
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return '—'
  }

  const numericValue = (() => {
    const sanitized = trimmed.replace(/[^0-9.,-]/g, '')
    if (sanitized.includes(',')) {
      const normalized = sanitized.replace(/\./g, '').replace(',', '.')
      const parsed = Number(normalized)
      return Number.isFinite(parsed) ? parsed : null
    }
    const parsed = Number(sanitized)
    return Number.isFinite(parsed) ? parsed : null
  })()

  return numericValue === null ? '—' : currencyFormatter.format(numericValue)
}

const formatDate = (value?: string | null) => {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const getStatusDisplay = (status: string) => {
  const stageName = getStageNameForStatus(status)
  return {
    label: stageName,
    badgeClass: getBadgeClassForStage(stageName),
  }
}

export default function PipelineStatus() {
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [stageLeads, setStageLeads] = useState<Record<number, Lead[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({})
  const [selectedLeadContext, setSelectedLeadContext] = useState<{
    lead: Lead
    stage: PipelineStage
  } | null>(null)

  const loadPipeline = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.')
      }

      const rawLeads = await fetchPipelineLeads(token)
      const normalizedLeads = rawLeads.map(normalizeLead)
      const { stages: computedStages, stageLeads: groupedLeads } = buildPipelineFromLeads(normalizedLeads)

      setStages(computedStages)
      setStageLeads(groupedLeads)
      setExpandedStages(prev => {
        const next: Record<number, boolean> = {}
        computedStages.forEach((stage, index) => {
          next[stage.id] = prev[stage.id] ?? index === 0
        })
        return next
      })
    } catch (err) {
      console.error('Erro ao carregar os dados da pipeline.', err)
      setError(err instanceof Error ? err.message : 'Erro inesperado ao carregar os leads da pipeline.')
      setStages([])
      setStageLeads({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPipeline()
  }, [])

  const totalLeads = useMemo(
    () => stages.reduce((total, stage) => total + stage.leads, 0),
    [stages]
  )

  const maxLeads = useMemo(() => {
    if (!stages.length) {
      return 0
    }
    return Math.max(...stages.map(stage => stage.leads))
  }, [stages])

  const safeMaxLeads = maxLeads > 0 ? maxLeads : 1

  const handleToggleStage = (stageId: number) => {
    setExpandedStages(prev => ({
      ...prev,
      [stageId]: !prev[stageId],
    }))
  }

  const handleLeadClick = (stage: PipelineStage, lead: Lead) => {
    setSelectedLeadContext({ stage, lead })
  }

  const closeLeadDetails = () => setSelectedLeadContext(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando etapas do funil...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <div>
          <p className="text-lg font-semibold text-red-700">Erro ao carregar o funil</p>
          <p className="text-sm text-red-600">{error}</p>
        </div>
        <button
          onClick={loadPipeline}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          <RefreshCcw className="h-4 w-4" />
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Status da Pipeline</h2>
          <p className="text-sm text-gray-500">
            Visualize rapidamente o volume de leads em cada etapa do funil de vendas.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
            Total de leads: {totalLeads}
          </div>
        </div>
      </div>

      {!stages.length ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
          Nenhum lead encontrado na pipeline.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stages.map((stage, index) => {
              const leadsInStage = stageLeads[stage.id] ?? []
              return (
                <div
                  key={stage.id}
                  className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className={`rounded-lg bg-gradient-to-r ${stageColors[index % stageColors.length]} px-4 py-3 text-white`}>
                    <p className="text-sm font-medium uppercase tracking-wide">Etapa {index + 1}</p>
                    <h3 className="text-lg font-semibold">{stage.stage}</h3>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold text-gray-900">{stage.leads}</p>
                      <p className="text-sm text-gray-500">Leads nesta etapa</p>
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      {safeMaxLeads > 0 ? ((stage.leads / safeMaxLeads) * 100).toFixed(0) : 0}% do topo do funil
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#ff6b35] to-[#ff8f64]"
                      style={{ width: `${safeMaxLeads > 0 ? Math.max((stage.leads / safeMaxLeads) * 100, stage.leads > 0 ? 10 : 0) : 0}%` }}
                    ></div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleStage(stage.id)}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-[#ff6b35]/60 hover:text-[#ff6b35]"
                  >
                    <span>
                      Exibir leads ({leadsInStage.length}
                      {leadsInStage.length !== stage.leads ? ` de ${stage.leads}` : ''})
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${expandedStages[stage.id] ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {expandedStages[stage.id] && (
                    <StageLeadList
                      leads={leadsInStage}
                      onLeadClick={lead => handleLeadClick(stage, lead)}
                    />
                  )}
                </div>
              )
            })}
          </div>

          <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Visão em funil</h3>
            <div className="space-y-4">
              {stages.map((stage, index) => (
                <div key={stage.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="w-full sm:w-48">
                    <p className="text-sm font-medium text-gray-700">{stage.stage}</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-3 rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${stageColors[index % stageColors.length]}`}
                        style={{ width: `${safeMaxLeads > 0 ? (stage.leads / safeMaxLeads) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-full text-right text-sm font-semibold text-gray-700 sm:w-24">
                    {stage.leads} leads
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {selectedLeadContext && (
        <LeadDetailsModal
          lead={selectedLeadContext.lead}
          stage={selectedLeadContext.stage}
          onClose={closeLeadDetails}
        />
      )}
    </div>
  )
}

function StageLeadList({
  leads,
  onLeadClick,
}: {
  leads: Lead[]
  onLeadClick: (lead: Lead) => void
}) {
  if (!leads.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
        Nenhum lead disponível nesta etapa.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {leads.map(lead => (
        <button
          key={lead.id}
          type="button"
          onClick={() => onLeadClick(lead)}
          className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-[#ff6b35]/70 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/40"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <p className="truncate text-base font-semibold text-gray-900">{lead.name}</p>
              <p className="truncate text-sm text-gray-600">{lead.consumer_unit}</p>
              <p className="truncate text-xs text-gray-400">{lead.cnpj}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-gray-900">{formatCurrencyValue(lead.invoice_amount)}</p>
              <p className="text-xs text-gray-500">{formatDate(lead.created_at)}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="rounded-full bg-gray-100 px-2 py-0.5">{lead.month} {lead.year}</span>
            {lead.consultant?.name && (
              <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                <User className="h-3 w-3" />
                <span className="truncate">
                  {lead.consultant.name} {lead.consultant.surname}
                </span>
              </span>
            )}
            {lead.source &&
              lead.source
                .split(',')
                .map(source => source.trim())
                .filter(Boolean)
                .map((source, index) => (
                  <span key={`${lead.id}-source-${index}`} className="rounded-full bg-orange-100 px-2 py-0.5 text-orange-600">
                    {source}
                  </span>
                ))}
          </div>
        </button>
      ))}
    </div>
  )
}

function LeadDetailsModal({
  lead,
  stage,
  onClose,
}: {
  lead: Lead
  stage: PipelineStage
  onClose: () => void
}) {
  const statusInfo = getStatusDisplay(lead.status)
  const sources = lead.source
    ?.split(',')
    .map(source => source.trim())
    .filter(Boolean)
    ?? []
  const invoices = lead.lead_invoices ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{stage.stage}</p>
            <h3 className="text-2xl font-bold text-gray-900">{lead.name}</h3>
            <p className="text-sm text-gray-500">{lead.consumer_unit}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Fechar detalhes do lead"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.badgeClass}`}>
              {statusInfo.label}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
              Criado em {formatDate(lead.created_at)}
            </span>
            {sources.map((source, index) => (
              <span
                key={`${lead.id}-modal-source-${index}`}
                className="rounded-full bg-orange-100 px-3 py-1 text-xs text-orange-600"
              >
                {source}
              </span>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow icon={Building2} label="CNPJ" value={lead.cnpj} />
            <InfoRow icon={Mail} label="E-mail" value={lead.email} href={lead.email ? `mailto:${lead.email}` : undefined} />
            <InfoRow icon={Phone} label="Telefone" value={lead.phone} href={lead.phone ? `tel:${lead.phone}` : undefined} />
            <InfoRow icon={Calendar} label="Período" value={`${lead.month} ${lead.year}`} />
            <InfoRow icon={FileText} label="Valor da fatura" value={formatCurrencyValue(lead.invoice_amount)} />
          </div>

          {lead.consultant && (
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase text-gray-500">Consultor responsável</p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {lead.consultant.name} {lead.consultant.surname}
              </p>
              <p className="text-xs text-gray-500">{lead.consultant.email}</p>
            </div>
          )}

          {lead.observations && (
            <div className="rounded-lg bg-orange-50 p-4">
              <p className="text-xs font-semibold uppercase text-orange-600">Observações</p>
              <p className="mt-2 whitespace-pre-line text-sm text-orange-700">{lead.observations}</p>
            </div>
          )}

          {invoices.length > 0 && (
            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <FileText className="h-4 w-4 text-[#ff6b35]" />
                Faturas enviadas
              </p>
              <div className="space-y-2">
                {invoices.map(invoice => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  >
                    <span className="truncate pr-4">{invoice.filename_normalized || invoice.filename_original}</span>
                    <span className="shrink-0 text-gray-500">{formatCurrencyValue(invoice.invoice_amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-[#ff6b35] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#e85f2f] focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon
  label: string
  value?: string | number | null
  href?: string
}) {
  return (
    <div className="rounded-lg border border-gray-100 p-3 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      {value ? (
        href ? (
          <a
            href={href}
            className="mt-1 block text-sm font-medium text-[#ff6b35] transition hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="mt-1 text-sm font-medium text-gray-900">{value}</p>
        )
      ) : (
        <p className="mt-1 text-sm text-gray-400">—</p>
      )}

    </div>
  )
}
