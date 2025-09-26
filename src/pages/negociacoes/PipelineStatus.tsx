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
import { pipelineService, type PipelineStage } from '../../services/pipelineService'
import type { Lead } from '../../types'
import { getLeads } from '../../utils/api'

const stageColors = [
  'from-orange-500 to-orange-400',
  'from-sky-500 to-sky-400',
  'from-purple-500 to-purple-400',
  'from-amber-500 to-amber-400',
  'from-emerald-500 to-emerald-400',
  'from-rose-500 to-rose-400'
]

const stageNameStatusMap: Record<string, string[]> = {
  prospeccao: ['novo', 'prospeccao', 'prospecting'],
  qualificacao: ['qualificado', 'qualificacao', 'qualification'],
  'proposta enviada': ['proposta', 'proposta enviada', 'proposal'],
  negociacao: ['negociacao', 'negotiacao', 'negotiation'],
  'fechado ganho': ['fechado', 'fechado ganho', 'ganho', 'won', 'fechado_ganho'],
  'fechado perdido': ['perdido', 'fechado perdido', 'lost', 'fechado_perdido'],
}

const fallbackStatusToStageKey: Record<string, string> = {
  novo: 'prospeccao',
  qualificado: 'qualificacao',
  proposta: 'proposta enviada',
  negociacao: 'negociacao',
  fechado: 'fechado ganho',
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const normalizeStageName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[()]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

const buildStatusToStageIdMap = (stages: PipelineStage[]) => {
  const map = new Map<string, number>()

  stages.forEach(stage => {
    const normalizedKey = normalizeStageName(stage.stage)
    map.set(normalizedKey, stage.id)

    const statuses = stageNameStatusMap[normalizedKey]
    statuses?.forEach(status => {
      map.set(status.toLowerCase(), stage.id)
    })
  })

  Object.entries(fallbackStatusToStageKey).forEach(([status, stageKey]) => {
    if (!map.has(status)) {
      const stage = stages.find(item => normalizeStageName(item.stage) === stageKey)
      if (stage) {
        map.set(status, stage.id)
      }
    }
  })

  return map
}

const groupLeadsByStage = (stages: PipelineStage[], leads: Lead[]) => {
  const grouped = stages.reduce((acc, stage) => {
    acc[stage.id] = [] as Lead[]
    return acc
  }, {} as Record<number, Lead[]>)

  const statusToStageId = buildStatusToStageIdMap(stages)

  leads.forEach(lead => {
    const status = (lead.status ?? '').toString().toLowerCase()
    const stageId = statusToStageId.get(status) ?? statusToStageId.get(normalizeStageName(status))

    if (stageId) {
      grouped[stageId]?.push(lead)
    }
  })

  Object.keys(grouped).forEach(key => {
    const stageId = Number(key)
    grouped[stageId] = grouped[stageId].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return dateB - dateA
    })
  })

  return grouped
}

const getPrimaryStatusForStage = (stage: PipelineStage): Lead['status'] => {
  const normalizedKey = normalizeStageName(stage.stage)

  switch (normalizedKey) {
    case 'prospeccao':
      return 'novo'
    case 'qualificacao':
      return 'qualificado'
    case 'proposta enviada':
      return 'proposta'
    case 'negociacao':
      return 'negociacao'
    default:
      return 'fechado'
  }
}

const createMockStageLeads = (stages: PipelineStage[]) => {
  const now = new Date()

  return stages.reduce((acc, stage) => {
    const leads: Lead[] = Array.from({ length: stage.leads }).map((_, index) => {
      const status = getPrimaryStatusForStage(stage)
      const baseValue = 3200 + stage.id * 450 + index * 180
      const invoiceAmount = (baseValue % 18000) + 950

      return {
        id: `mock-${stage.id}-${index + 1}`,
        consumer_unit: `UC-${stage.id}${(index + 1).toString().padStart(3, '0')}`,
        name: `${stage.stage} ${index + 1}`,
        phone: '+55 (11) 90000-0000',
        email: `lead${stage.id}${index + 1}@exemplo.com`,
        cnpj: '00.000.000/0000-00',
        month: now.toLocaleString('pt-BR', { month: 'long' }),
        year: now.getFullYear(),
        energy_value: (invoiceAmount * 0.6).toFixed(2),
        invoice_amount: invoiceAmount.toFixed(2),
        status,
        observations: '',
        consultant_id: undefined,
        created_at: new Date(now.getTime() - index * 86400000).toISOString(),
        updated_at: new Date(now.getTime() - index * 43200000).toISOString(),
        deleted_at: undefined,
        has_solar_generation: false,
        solar_generation_type: '',
        address: '',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '00000-000',
        source: 'Mock',
        consultant: undefined,
        lead_invoices: [],
      }
    })

    acc[stage.id] = leads
    return acc
  }, {} as Record<number, Lead[]>)
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

const statusDisplayMap: Record<string, { label: string; badgeClass: string }> = {
  novo: { label: 'Prospecção', badgeClass: 'bg-sky-100 text-sky-700' },
  qualificado: { label: 'Qualificação', badgeClass: 'bg-purple-100 text-purple-700' },
  proposta: { label: 'Proposta Enviada', badgeClass: 'bg-amber-100 text-amber-700' },
  negociacao: { label: 'Negociação', badgeClass: 'bg-orange-100 text-orange-700' },
  fechado: { label: 'Fechado', badgeClass: 'bg-emerald-100 text-emerald-700' },
  perdido: { label: 'Fechado (Perdido)', badgeClass: 'bg-rose-100 text-rose-700' },
}

const getStatusDisplay = (status: string) => {
  const normalized = status.toLowerCase()
  return statusDisplayMap[normalized] ?? { label: status, badgeClass: 'bg-gray-100 text-gray-600' }
}


export default function PipelineStatus() {
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [stageLeads, setStageLeads] = useState<Record<number, Lead[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'api' | 'mock'>('mock')
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [leadsError, setLeadsError] = useState<string | null>(null)
  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({})
  const [selectedLeadContext, setSelectedLeadContext] = useState<{
    lead: Lead
    stage: PipelineStage
  } | null>(null)

  const loadStageLeads = async (pipelineStages: PipelineStage[], dataSource: 'api' | 'mock') => {
    setLeadsLoading(true)
    setLeadsError(null)

    try {
      const response = await getLeads({ limit: 200 })

      if (response?.success && Array.isArray(response.data?.leads)) {
        const grouped = groupLeadsByStage(pipelineStages, response.data.leads as Lead[])
        setStageLeads(grouped)
      } else if (dataSource === 'mock') {
        setStageLeads(createMockStageLeads(pipelineStages))
      } else {
        throw new Error('Não foi possível carregar a lista de leads')
      }
    } catch (err) {
      if (dataSource === 'mock') {
        setLeadsError(null)
        setStageLeads(createMockStageLeads(pipelineStages))
      } else {
        setStageLeads(
          pipelineStages.reduce((acc, stage) => {
            acc[stage.id] = []
            return acc
          }, {} as Record<number, Lead[]>)
        )
        setLeadsError(err instanceof Error ? err.message : 'Erro ao carregar os leads do pipeline')
      }
    } finally {
      setLeadsLoading(false)
    }
  }

  const loadStages = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await pipelineService.getPipelineStages()

      if (!response.success) {
        throw new Error('Não foi possível carregar o pipeline')
      }

      setStages(response.data)
      setSource(response.source)

setExpandedStages(prev => {
        const next: Record<number, boolean> = {}
        response.data.forEach(stage => {
          next[stage.id] = prev[stage.id] ?? false
        })
        return next
      })
      await loadStageLeads(response.data, response.source)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao carregar o pipeline')
      setStageLeads({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStages()
  }, [])

  const totalLeads = useMemo(() => stages.reduce((total, stage) => total + stage.leads, 0), [stages])
  const maxLeads = useMemo(() => Math.max(...stages.map(stage => stage.leads), 1), [stages])

  const handleToggleStage = (stageId: number) => {
    setExpandedStages(prev => ({
      ...prev,
      [stageId]: !prev[stageId],
    }))
  }

  const handleLeadClick = (stage: PipelineStage, lead: Lead) => {
    setSelectedLeadContext({ stage, lead })
  }

  const handleRetryLeads = () => {
    if (stages.length) {
      loadStageLeads(stages, source)
    } else {
      loadStages()
    }
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
          onClick={loadStages}
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
          {source === 'mock' && (
            <div className="rounded-full bg-orange-100 px-3 py-1 text-orange-600">
              Dados mockados
            </div>
          )}
        </div>
      </div>

      {leadsError && (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          <span>Não foi possível carregar a lista de leads por etapa. {leadsError}</span>
          <div>
            <button
              onClick={handleRetryLeads}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 font-semibold text-white transition hover:bg-amber-700"
            >
              <RefreshCcw className="h-4 w-4" />
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stages.map((stage, index) => (
          <div
            key={stage.id}
            className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className={`rounded-lg bg-gradient-to-r ${stageColors[index % stageColors.length]} px-4 py-3 text-white`}>
              <p className="text-sm font-medium uppercase tracking-wide">Etapa {stage.id}</p>
              <h3 className="text-lg font-semibold">{stage.stage}</h3>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{stage.leads}</p>
                <p className="text-sm text-gray-500">Leads nesta etapa</p>
              </div>
              <div className="text-right text-sm text-gray-400">
                {((stage.leads / maxLeads) * 100).toFixed(0)}% do topo do funil
              </div>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#ff6b35] to-[#ff8f64]"
                style={{ width: `${Math.max((stage.leads / maxLeads) * 100, 10)}%` }}
              ></div>
            </div>

            <button
              type="button"
              onClick={() => handleToggleStage(stage.id)}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-[#ff6b35]/60 hover:text-[#ff6b35]"
            >
              <span>
                Exibir leads ({(stageLeads[stage.id] ?? []).length}
                {(stageLeads[stage.id] ?? []).length !== stage.leads ? ` de ${stage.leads}` : ''})
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${expandedStages[stage.id] ? 'rotate-180' : ''}`}
              />
            </button>
            {expandedStages[stage.id] && (
              <StageLeadList
                leads={stageLeads[stage.id] ?? []}
                loading={leadsLoading}
                onLeadClick={lead => handleLeadClick(stage, lead)}
              />
            )}

          </div>
        ))}
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
                    style={{ width: `${(stage.leads / maxLeads) * 100}%` }}
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
  loading,
  onLeadClick,
}: {
  leads: Lead[]
  loading: boolean
  onLeadClick: (lead: Lead) => void
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando leads da etapa...
      </div>
    )
  }

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
