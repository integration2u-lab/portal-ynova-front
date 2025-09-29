import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { getBadgeClassForStage, getStageNameForStatus, StageDefinition } from '../../utils/pipelineStageUtils'
import { buildPipelineFromLeads, fetchAllPipelineLeads } from '../../services/pipelineDataService'

const stageColors = [
  'from-orange-500 to-orange-400',
  'from-sky-500 to-sky-400',
  'from-purple-500 to-purple-400',
  'from-amber-500 to-amber-400',
  'from-indigo-500 to-indigo-400',
  'from-emerald-500 to-emerald-400',
  'from-rose-500 to-rose-400',
]

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
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({})
  const [selectedLeadContext, setSelectedLeadContext] = useState<{
    lead: Lead
    stage: PipelineStage
  } | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])

  const loadPipeline = useCallback(async (options?: { silent?: boolean }) => {
    const isSilent = options?.silent ?? false

    try {
      if (isSilent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError(null)

      const leadsData = await fetchAllPipelineLeads()
      const { stages: computedStages, stageLeads: groupedLeads } = buildPipelineFromLeads(leadsData)

      setStages(computedStages)
      setStageLeads(groupedLeads)
      setLeads(leadsData)
      setExpandedStages(prev => {
        const next: Record<number, boolean> = {}
        computedStages.forEach((stage, index) => {
          next[stage.id] = prev[stage.id] ?? index === 0
        })
        return next
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao carregar os leads da pipeline.')
      setStages([])
      setStageLeads({})
      setLeads([])
    } finally {
      if (isSilent) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadPipeline()
  }, [loadPipeline])

  const metrics = useMemo(() => {
    const totalLeads = leads.length
    const totalPipeline = leads.reduce((sum, lead) => {
      const amount = lead.invoice_amount ?? '0'
      const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount)
      return sum + (Number.isFinite(parsedAmount) ? parsedAmount : 0)
    }, 0)
    const ticketMedio = totalLeads ? totalPipeline / totalLeads : 0
    return { totalLeads, totalPipeline, ticketMedio }
  }, [leads])

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
          onClick={() => loadPipeline()}
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
        <button
          type="button"
          onClick={() => loadPipeline({ silent: true })}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-[#ff6b35] px-4 py-2 text-sm font-semibold text-[#ff6b35] transition hover:bg-[#ff6b35] hover:text-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-[#ff6b35] sm:self-auto"
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Atualizando...' : 'Atualizar Dados'}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          title="Total de Leads"
          value={metrics.totalLeads.toLocaleString('pt-BR')}
          description="Quantidade total de oportunidades disponíveis."
        />
        <MetricCard
          title="Valor do Pipeline"
          value={currencyFormatter.format(metrics.totalPipeline)}
          description="Somatório do valor potencial de todas as oportunidades."
        />
        <MetricCard
          title="Ticket Médio"
          value={currencyFormatter.format(metrics.ticketMedio)}
          description="Média de valor por lead no funil."
        />
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

function MetricCard({
  title,
  value,
  description,
}: {
  title: string
  value: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
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
