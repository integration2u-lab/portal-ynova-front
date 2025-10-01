import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Building2,
  Calendar,
  ChevronDown,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  Phone,
  Plus,
  RefreshCcw,
  User,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { Lead, LeadInvoice } from '../../types'
import { getLeads, getLeadInvoices } from '../../utils/api'
import ModalUploadInvoice from '../../components/ModalUploadInvoice'
import ModalUploadInvoiceToLead from '../../components/ModalUploadInvoiceToLead'

const stageColors = [
  'from-sky-500 to-sky-400',
  'from-amber-500 to-amber-400',
  'from-purple-500 to-purple-400',
  'from-indigo-500 to-indigo-400',
  'from-orange-500 to-orange-400',
  'from-cyan-500 to-cyan-400',
  'from-blue-500 to-blue-400',
  'from-emerald-500 to-emerald-400',
  'from-lime-500 to-lime-400',
  'from-teal-500 to-teal-400',
  'from-rose-500 to-rose-400',
]

const rawStatusFriendlyNames = {
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
} as const

const stageDefinitions = [
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
    statuses: ['decisionmakerboughtin', 'negociacao', 'negociacao', 'negotiation'],
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

const statusFriendlyNameMap = new Map<string, string>()

Object.entries(rawStatusFriendlyNames).forEach(([status, label]) => {
  statusFriendlyNameMap.set(normalizeStageName(status), label)
})

stageDefinitions.forEach(definition => {
  stageOrderMap.set(definition.label, definition)
  const normalizedLabel = normalizeStageName(definition.label)
  statusToStageName.set(normalizedLabel, definition)
  statusFriendlyNameMap.set(normalizedLabel, definition.label)
  definition.statuses.forEach(status => {
    const normalizedStatus = normalizeStageName(status)
    statusToStageName.set(normalizedStatus, definition)
  })
})

statusFriendlyNameMap.forEach((friendlyLabel, normalizedStatus) => {
  const def = statusToStageName.get(normalizedStatus)
  if (!def || !friendlyLabel) return

  stageOrderMap.set(friendlyLabel, def)
  statusToStageName.set(normalizeStageName(friendlyLabel), def)
})

const getStageDefinitionForStatus = (status: string) => {
  if (!status) {
    return undefined
  }

  const normalized = normalizeStageName(status)
  return statusToStageName.get(normalized)
}

const getStageNameForStatus = (status: string) => {

  const normalized = normalizeStageName(status)
  const friendlyLabel = statusFriendlyNameMap.get(normalized)
  if (friendlyLabel) {
    return friendlyLabel
  }


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

const extractLeadsFromResponse = (response: any): any[] => {
  if (Array.isArray(response?.data?.leads)) {
    return response.data.leads
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data
  }

  if (Array.isArray(response?.data)) {
    return response.data
  }

  if (Array.isArray(response?.leads)) {
    return response.leads
  }

  if (Array.isArray(response)) {
    return response
  }

  return []
}

const shouldFetchNextPage = (
  page: number,
  leadsFetched: number,
  limit: number,
  aggregateCount: number,
  pagination?: any
) => {
  if (pagination) {
    const currentPage = Number(pagination.current_page ?? pagination.currentPage)
    const lastPage = Number(pagination.last_page ?? pagination.lastPage)
    const totalPages = Number(
      pagination.total_pages ?? pagination.totalPages ?? pagination.pages
    )
    const totalItems = Number(
      pagination.total ?? pagination.total_items ?? pagination.totalItems ?? pagination.count
    )

    if (Number.isFinite(currentPage) && Number.isFinite(lastPage)) {
      return currentPage < lastPage
    }

    if (Number.isFinite(totalPages)) {
      return page < totalPages
    }

    if (Number.isFinite(totalItems)) {
      return aggregateCount < totalItems
    }
  }

  return leadsFetched >= limit
}

const fetchAllLeads = async () => {
  const aggregatedLeads: any[] = []
  const limitPerPage = 100
  const MAX_PAGES = 100

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await getLeads({ page, limit: limitPerPage })

    if (response?.success === false) {
      throw new Error(response?.message || 'Não foi possível carregar os leads da pipeline.')
    }

    const leadsData = extractLeadsFromResponse(response)

    if (!Array.isArray(leadsData)) {
      break
    }

    aggregatedLeads.push(...leadsData)

    const pagination =
      response?.data?.meta ??
      response?.data?.pagination ??
      response?.meta ??
      response?.pagination

    if (!shouldFetchNextPage(page, leadsData.length, limitPerPage, aggregatedLeads.length, pagination)) {
      break
    }
  }

  return aggregatedLeads
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

  stageDefinitions.forEach(definition => {
    groupedByStage.set(definition.label, { definition, leads: [] })
  })

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
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({})
  const [selectedLeadContext, setSelectedLeadContext] = useState<{
    lead: Lead
    stage: PipelineStage
  } | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [isLeadInvoiceModalOpen, setIsLeadInvoiceModalOpen] = useState(false)
  const [selectedLeadInvoices, setSelectedLeadInvoices] = useState<LeadInvoice[]>([])
  const [selectedLeadForInvoices, setSelectedLeadForInvoices] = useState<Lead | null>(null)
  const [isUploadInvoiceToLeadModalOpen, setIsUploadInvoiceToLeadModalOpen] = useState(false)
  const [selectedLeadForUpload, setSelectedLeadForUpload] = useState<Lead | null>(null)
  const [leadDetailsRefreshTrigger, setLeadDetailsRefreshTrigger] = useState(0)

  const loadPipeline = useCallback(async (options?: { silent?: boolean }) => {
    const isSilent = options?.silent ?? false

    try {
      if (isSilent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError(null)

      const leadsData = await fetchAllLeads()

      if (!Array.isArray(leadsData)) {
        throw new Error('Formato inesperado de resposta ao carregar os leads.')
      }

      const normalizedLeads = leadsData.map(normalizeLead)
      const { stages: computedStages, stageLeads: groupedLeads } = buildPipelineFromLeads(normalizedLeads)

      setStages(computedStages)
      setStageLeads(groupedLeads)
      setLeads(normalizedLeads)
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

  const handleInvoiceUploadSuccess = (lead: any) => {
    // Auto-refresh the pipeline after successful invoice upload
    loadPipeline({ silent: true })
  }

  const openInvoiceModal = () => setIsInvoiceModalOpen(true)
  const closeInvoiceModal = () => setIsInvoiceModalOpen(false)

  const handleOpenLeadInvoices = async (lead: Lead) => {
    try {
      setSelectedLeadForInvoices(lead)
      setError(null)
      
      // Load invoices for this lead
      const response = await getLeadInvoices(lead.id)
      if (response.success) {
        setSelectedLeadInvoices(response.data)
        setIsLeadInvoiceModalOpen(true)
      } else {
        setError('Falha ao carregar faturas')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar faturas')
    }
  }

  const handleCloseLeadInvoiceModal = () => {
    setIsLeadInvoiceModalOpen(false)
    setSelectedLeadInvoices([])
    setSelectedLeadForInvoices(null)
  }

  const handleOpenUploadInvoiceToLead = (lead: Lead) => {
    setSelectedLeadForUpload(lead)
    setIsUploadInvoiceToLeadModalOpen(true)
  }

  const handleCloseUploadInvoiceToLead = () => {
    setIsUploadInvoiceToLeadModalOpen(false)
    setSelectedLeadForUpload(null)
  }

  const handleUploadInvoiceToLeadSuccess = () => {
    // Auto-refresh the pipeline after successful invoice upload
    loadPipeline({ silent: true })
    
    // Trigger refresh of lead details modal if it's open
    setLeadDetailsRefreshTrigger(prev => prev + 1)
  }

  const handleOpenFile = (invoice: LeadInvoice) => {
    // Use signed URL if available, otherwise fall back to storage URL
    const url = invoice.signed_url || invoice.storage_url
    if (url) {
      window.open(url, '_blank')
    } else {
      setError('URL do arquivo não disponível')
    }
  }

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
          Nenhuma negociação encontrado na pipeline.
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
                    className="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-[#ff6b35]/60 hover:text-[#ff6b35]"
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
                      onOpenInvoices={handleOpenLeadInvoices}
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
                  <div className="w-full sm:w-48 relative group">
                    <p className="text-sm font-medium text-gray-700 truncate relative">
                      {stage.stage}
                      {/* Tooltip for full stage name */}
                      <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap max-w-xs">
                        <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        {stage.stage}
                      </div>
                    </p>
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
          onOpenFile={handleOpenFile}
          onUploadInvoice={handleOpenUploadInvoiceToLead}
          refreshTrigger={leadDetailsRefreshTrigger}
        />
      )}

      {/* Floating Action Button for Invoice Upload */}
      <button
        onClick={openInvoiceModal}
        className="fixed right-6 bottom-6 z-40 rounded-full bg-[#FE5200] p-4 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-[#FE5200]/90"
        title="Enviar Fatura"
      >
        <Plus size={24} />
      </button>

      {/* Invoice Upload Modal */}
      <ModalUploadInvoice
        isOpen={isInvoiceModalOpen}
        onClose={closeInvoiceModal}
        onSuccess={handleInvoiceUploadSuccess}
      />

      {/* Lead Invoices Modal */}
      {isLeadInvoiceModalOpen && selectedLeadForInvoices && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Faturas - {selectedLeadForInvoices.name}
                </h2>
                <p className="text-sm text-gray-600">
                  {selectedLeadForInvoices.consumer_unit} • {selectedLeadForInvoices.cnpj}
                </p>
              </div>
              <button
                onClick={handleCloseLeadInvoiceModal}
                className="text-gray-500 transition-colors hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {selectedLeadInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma fatura encontrada para este lead.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedLeadInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className={`h-8 w-8 ${invoice.signed_url ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div>
                        <p className="font-medium text-gray-900">
                          {invoice.filename_normalized}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatCurrencyValue(invoice.invoice_amount)} • 
                          {new Date(invoice.created_at).toLocaleDateString("pt-BR")}
                          {!invoice.signed_url && (
                            <span className="ml-2 text-red-500 text-xs">(Arquivo não disponível)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenFile(invoice)}
                        disabled={!invoice.signed_url}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors ${
                          invoice.signed_url 
                            ? 'border-gray-300 text-gray-700 hover:bg-gray-50' 
                            : 'border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <ExternalLink size={16} />
                        Abrir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Invoice to Lead Modal */}
      {isUploadInvoiceToLeadModalOpen && selectedLeadForUpload && (
        <ModalUploadInvoiceToLead
          isOpen={isUploadInvoiceToLeadModalOpen}
          onClose={handleCloseUploadInvoiceToLead}
          onSuccess={handleUploadInvoiceToLeadSuccess}
          leadId={selectedLeadForUpload.id}
          leadName={selectedLeadForUpload.name}
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
  onOpenInvoices,
}: {
  leads: Lead[]
  onLeadClick: (lead: Lead) => void
  onOpenInvoices: (lead: Lead) => void
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
        <div
          key={lead.id}
          className="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[#ff6b35]/70 hover:shadow-md relative"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1 flex-1">
              <button
                type="button"
                onClick={() => onLeadClick(lead)}
                className="text-left w-full"
              >
                <div className="relative group">
                  <p className="truncate text-base font-semibold text-gray-900 cursor-pointer" title={lead.name}>
                    {lead.name}
                  </p>
                  {/* Tooltip for full company name */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap max-w-xs">
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    {lead.name}
                  </div>
                </div>
                <p className="truncate text-sm text-gray-600">{lead.consumer_unit}</p>
                <p className="truncate text-xs text-gray-400">{lead.cnpj}</p>
              </button>
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
          
          {/* Invoice section */}
          {lead.lead_invoices && lead.lead_invoices.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenInvoices(lead)
                }}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
              >
                <FileText size={16} />
                <span>{lead.lead_invoices.length} fatura{lead.lead_invoices.length > 1 ? 's' : ''}</span>
              </button>
            </div>
          )}
          
        </div>
      ))}
    </div>
  )
}

function LeadDetailsModal({
  lead,
  stage,
  onClose,
  onOpenFile,
  onUploadInvoice,
  refreshTrigger,
}: {
  lead: Lead
  stage: PipelineStage
  onClose: () => void
  onOpenFile: (invoice: LeadInvoice) => void
  onUploadInvoice: (lead: Lead) => void
  refreshTrigger?: number
}) {
  const [invoices, setInvoices] = useState<LeadInvoice[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  
  const statusInfo = getStatusDisplay(lead.status)
  const sources = lead.source
    ?.split(',')
    .map(source => source.trim())
    .filter(Boolean)
    ?? []

  // Load invoices with signed URLs when modal opens or when refreshTrigger changes
  useEffect(() => {
    const loadInvoices = async () => {
      setLoadingInvoices(true)
      try {
        const response = await getLeadInvoices(lead.id)
        if (response.success) {
          setInvoices(response.data)
        } else {
          // Fallback to the original invoices if API call fails
          setInvoices(lead.lead_invoices || [])
        }
      } catch (error) {
        console.error('Error loading invoices:', error)
        // Fallback to the original invoices if API call fails
        setInvoices(lead.lead_invoices || [])
      } finally {
        setLoadingInvoices(false)
      }
    }

    loadInvoices()
  }, [lead.id, lead.lead_invoices, refreshTrigger])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
      <div className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden rounded-xl sm:rounded-2xl bg-white shadow-2xl">
        {/* Fixed Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-4 sm:px-6 py-4 flex-shrink-0">
          <div className="min-w-0 flex-1 pr-3 sm:pr-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{stage.stage}</p>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">{lead.name}</h3>
            <p className="text-sm text-gray-500 truncate">{lead.consumer_unit}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 flex-shrink-0"
            aria-label="Fechar detalhes do lead"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="space-y-6">
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

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <FileText className="h-4 w-4 text-[#ff6b35]" />
                Faturas enviadas
                {loadingInvoices && (
                  <span className="text-xs text-gray-500">(carregando...)</span>
                )}
              </p>
              <button
                onClick={() => onUploadInvoice(lead)}
                className="flex items-center gap-1 rounded-lg border border-[#ff6b35] bg-[#ff6b35] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#e85f2f]"
                title="Adicionar nova fatura"
              >
                <Plus className="h-3 w-3" />
                Adicionar
              </button>
            </div>
            {invoices.length > 0 ? (
              <div className="space-y-2">
                {invoices.map(invoice => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className={`h-4 w-4 flex-shrink-0 ${invoice.signed_url ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="truncate">{invoice.filename_normalized || invoice.filename_original}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-gray-500">{formatCurrencyValue(invoice.invoice_amount)}</span>
                      <button
                        onClick={() => onOpenFile(invoice)}
                        disabled={!invoice.signed_url}
                        className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                          invoice.signed_url 
                            ? 'text-blue-600 hover:text-blue-800' 
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={invoice.signed_url ? "Abrir arquivo" : "Arquivo não disponível"}
                      >
                        <ExternalLink size={14} />
                        Abrir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-gray-500">
                Nenhuma fatura enviada ainda
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex justify-end border-t border-gray-100 bg-gray-50 px-4 sm:px-6 py-4 flex-shrink-0">
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
