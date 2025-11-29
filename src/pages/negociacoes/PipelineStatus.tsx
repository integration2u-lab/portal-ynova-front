import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Building2,
  Calendar,
  ChevronDown,
  DollarSign,
  ExternalLink,
  FileSignature,
  FileText,
  FileSpreadsheet,
  Loader2,
  Mail,
  Phone,
  Plus,
  Presentation,
  RefreshCcw,
  User,
  X,
  Search,
  Upload,
  type LucideIcon,
} from 'lucide-react'
import type { Lead, LeadInvoice, LeadDocument } from '../../types'
import { 
  getLeads, 
  getLeadInvoices, 
  getLeadDocuments, 
  getLeadDocumentSignedUrl,
  updateLead,
  downloadFileAsBase64,
  extractPptDataFromExcel,
  generatePptPresentation,
  uploadLeadDocument
} from '../../utils/api'
import { useUser } from '../../contexts/UserContext'
import ModalUploadInvoice, { checkAndUpdatePendingOcrJobs } from '../../components/ModalUploadInvoice'
import ModalUploadInvoiceToLead from '../../components/ModalUploadInvoiceToLead'
import ContractSignatureModal from '../../components/ContractSignatureModal'
import { toast } from 'sonner'

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

const MAX_PIPELINE_STAGES = 11 as const
// Skip first 2 stages (Prospecção and Fatura) - start from Qualificado
const allowedStageDefinitions = stageDefinitions.slice(2, MAX_PIPELINE_STAGES) as StageDefinition[]
const fallbackStageDefinition =
  allowedStageDefinitions[allowedStageDefinitions.length - 1] ?? stageDefinitions[stageDefinitions.length - 1]

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

allowedStageDefinitions.forEach(definition => {
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
    return fallbackStageDefinition
  }

  const normalized = normalizeStageName(status)
  return statusToStageName.get(normalized) ?? fallbackStageDefinition
}

const getStageNameForStatus = (status: string) => {
  const normalized = normalizeStageName(status)
  const friendlyLabel = statusFriendlyNameMap.get(normalized)

  if (friendlyLabel) {
    const mappedDefinition = stageOrderMap.get(friendlyLabel)
    if (mappedDefinition) {
      return mappedDefinition.label
    }
    return friendlyLabel
  }

  const definition = getStageDefinitionForStatus(status)
  if (definition) {
    return definition.label
  }

  return fallbackStageDefinition.label
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
    contract_signed: rawLead?.contract_signed ?? false,
    consultant,
    lead_invoices: Array.isArray(rawLead?.lead_invoices) ? rawLead.lead_invoices : [],
    lead_documents: Array.isArray(rawLead?.lead_documents) ? rawLead.lead_documents : [],
  }
}


const buildPipelineFromLeads = (leads: Lead[]) => {
  const leadsByStageKey = new Map<string, Lead[]>()

  allowedStageDefinitions.forEach(definition => {
    leadsByStageKey.set(definition.key, [])
  })

  leads.forEach(lead => {
    const definition = stageOrderMap.get(getStageNameForStatus(lead.status)) ?? getStageDefinitionForStatus(lead.status)
    const stageDefinition = definition ?? fallbackStageDefinition
    const bucketKey = stageDefinition.key

    if (!leadsByStageKey.has(bucketKey)) {
      leadsByStageKey.set(bucketKey, [])
    }

    leadsByStageKey.get(bucketKey)!.push(lead)
  })

  const stages: PipelineStage[] = []
  const stageLeads: Record<number, Lead[]> = {}

  allowedStageDefinitions.forEach((definition, index) => {
    const stageId = index + 1
    const leadsInStage = (leadsByStageKey.get(definition.key) ?? []).slice().sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return dateB - dateA
    })

    stages.push({ id: stageId, stage: definition.label, leads: leadsInStage.length, definition })
    stageLeads[stageId] = leadsInStage
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
  const { isAdmin } = useUser()
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
  const [searchTerm, setSearchTerm] = useState('')
  const [isRefreshingOcr, setIsRefreshingOcr] = useState(false)
  const [generatingProposalIds, setGeneratingProposalIds] = useState<Set<string>>(new Set())
  const [isContractSignatureModalOpen, setIsContractSignatureModalOpen] = useState(false)
  const [leadForContractSignature, setLeadForContractSignature] = useState<Lead | null>(null)

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


const filteredStageLeads = useMemo(() => {
    const term = searchTerm.trim()
    if (!term) {
      return stageLeads
    }

    const normalizeText = (value?: string | null) =>
      (value ?? '')
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()

    const normalizedTerm = normalizeText(term)
    const matchesSearch = (lead: Lead) => {
      const consultantName = lead.consultant
        ? `${lead.consultant.name ?? ''} ${lead.consultant.surname ?? ''}`
        : ''
      const sources = Array.isArray(lead.source)
        ? lead.source.join(' ')
        : (lead.source ?? '')

      const searchableContent = [
        lead.name,
        lead.consumer_unit,
        lead.cnpj,
        consultantName,
        sources,
        lead.month,
        lead.year,
      ]
        .filter(Boolean)
        .map(value => normalizeText(String(value)))
        .join(' ')

      return searchableContent.includes(normalizedTerm)
    }

    return Object.entries(stageLeads).reduce<Record<number, Lead[]>>(
      (acc, [stageId, leadsInStage]) => {
        acc[Number(stageId)] = leadsInStage.filter(matchesSearch)
        return acc
      },
      {},
    )
  }, [searchTerm, stageLeads])

  const closeLeadDetails = () => setSelectedLeadContext(null)

  const handleInvoiceUploadSuccess = (lead: any) => {
    // Auto-refresh the pipeline after successful invoice upload
    loadPipeline({ silent: true })
  }

  const openInvoiceModal = () => setIsInvoiceModalOpen(true)
  const closeInvoiceModal = () => setIsInvoiceModalOpen(false)

  const handleRefreshAll = async () => {
    setIsRefreshingOcr(true)
    
    try {
      // First: Check and update pending OCR jobs
      const ocrResult = await checkAndUpdatePendingOcrJobs()
      
      // Show OCR-specific feedback
      if (ocrResult.success && ocrResult.updatedCount > 0) {
        toast.success(`${ocrResult.updatedCount} lead(s) atualizado(s) com dados do OCR!`)
      } else if (ocrResult.success && ocrResult.totalPending > 0 && ocrResult.updatedCount === 0) {
        toast.info(`${ocrResult.totalPending} lead(s) ainda em processamento OCR`)
      } else if (!ocrResult.success) {
        toast.error('Erro ao verificar status do OCR')
      }
    } catch (error) {
      console.error('Error refreshing OCR:', error)
      toast.error('Erro ao atualizar leads com OCR')
    } finally {
      setIsRefreshingOcr(false)
    }
    
    // Then: Refresh all pipeline data (always runs, even if OCR check failed)
    await loadPipeline({ silent: true })
  }

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

  const handleGenerateSimulation = async (invoice: LeadInvoice) => {
    try {
      setError(null)
      
      // If simulation already exists, download the Excel file
      if (invoice.simulation && invoice.extracted_data?.excel_s3_url) {
        const excelUrl = invoice.extracted_data.excel_s3_url
        window.open(excelUrl, '_blank')
        return
      }
      
      // TODO: Implement API call to generate simulation
      console.log('Generate simulation for invoice:', invoice.id)
      // After successful generation, refresh the invoices
      // const response = await generateInvoiceSimulation(invoice.id)
      // if (response.success) {
      //   loadPipeline({ silent: true })
      //   setLeadDetailsRefreshTrigger(prev => prev + 1)
      // }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao gerar simulação')
    }
  }

  const handleGenerateProposal = async (invoice: LeadInvoice) => {
    // Mark this invoice as generating
    setGeneratingProposalIds(prev => new Set(prev).add(invoice.id))
    
    try {
      setError(null)
      
      // Check if Excel URL exists
      if (!invoice.extracted_data?.excel_s3_url) {
        toast.error('URL do arquivo Excel não encontrada')
        return
      }

      // Get the lead to check its current stage
      const lead = leads.find(l => l.id === invoice.lead_id)
      const isQualificadoStage = lead ? getStageNameForStatus(lead.status) === 'Qualificado' : false

      toast.info('Baixando arquivo Excel...')
      
      // Step 1: Download Excel file and convert to base64
      const excelBase64 = await downloadFileAsBase64(invoice.extracted_data.excel_s3_url)
      
      toast.info('Extraindo dados da planilha...')
      
      // Step 2: Extract PPT data from Excel
      const pptData = await extractPptDataFromExcel(excelBase64)
      
      if (pptData.warnings && pptData.warnings.length > 0) {
        console.warn('PPT Extraction Warnings:', pptData.warnings)
      }
      
      toast.info('Gerando apresentação...')
      
      // Step 3: Generate PPT presentation via N8N
      const pptResponse = await generatePptPresentation(pptData)
      
      if (!pptResponse.linkDownloadPpt) {
        throw new Error('Link da apresentação não foi retornado')
      }
      
      // Step 4: Open the presentation in a new tab
      window.open(pptResponse.linkDownloadPpt, '_blank')
      
      toast.success('Apresentação gerada com sucesso!')
      
    } catch (err) {
      console.error('Error generating proposal:', err)
      const errorMessage = err instanceof Error ? err.message : 'Falha ao gerar proposta'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      // Remove this invoice from generating set
      setGeneratingProposalIds(prev => {
        const next = new Set(prev)
        next.delete(invoice.id)
        return next
      })
    }
  }

  const handleOpenDocumentFile = (document: LeadDocument) => {
    // Use signed URL if available, otherwise fall back to storage URL
    const url = document.signed_url || document.storage_url
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">Status da Pipeline</h2>
          <p className="text-sm text-gray-500">
            Visualize rapidamente o volume de leads em cada etapa do funil de vendas.
          </p>
        </div>
              <div className="w-full sm:max-w-xs">
                <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Buscar leads..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-gray-400 focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={handleRefreshAll}
          disabled={loading || refreshing || isRefreshingOcr}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-[#ff6b35] px-4 py-2 text-sm font-semibold text-[#ff6b35] transition hover:bg-[#ff6b35] hover:text-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-[#ff6b35] sm:self-auto"
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing || isRefreshingOcr ? 'animate-spin' : ''}`} />
          {refreshing || isRefreshingOcr ? 'Atualizando...' : 'Atualizar Dados'}
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
              const leadsInStage = filteredStageLeads[stage.id] ?? []
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
          onOpenDocumentFile={handleOpenDocumentFile}
          onGenerateSimulation={handleGenerateSimulation}
          onGenerateProposal={handleGenerateProposal}
          onRefreshPipeline={() => {
            loadPipeline({ silent: true })
            setLeadDetailsRefreshTrigger(prev => prev + 1)
          }}
          refreshTrigger={leadDetailsRefreshTrigger}
          generatingProposalIds={generatingProposalIds}
          onOpenContractSignatureModal={(lead: Lead) => {
            setLeadForContractSignature(lead)
            setIsContractSignatureModalOpen(true)
          }}
        />
      )}

      {/* Floating Action Buttons */}
      <div className="fixed right-6 bottom-6 z-40 flex flex-col gap-3">
        {/* Refresh All Button */}
        <button
          onClick={handleRefreshAll}
          disabled={loading || refreshing || isRefreshingOcr}
          className="rounded-full bg-blue-600 p-4 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          title="Atualizar dados"
        >
          <RefreshCcw size={24} className={refreshing || isRefreshingOcr ? 'animate-spin' : ''} />
        </button>
        
        {/* Invoice Upload Button */}
        <button
          onClick={openInvoiceModal}
          className="rounded-full bg-[#FE5200] p-4 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-[#FE5200]/90"
          title="Enviar Fatura"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Invoice Upload Modal */}
      <ModalUploadInvoice
        isOpen={isInvoiceModalOpen}
        onClose={closeInvoiceModal}
        onSuccess={handleInvoiceUploadSuccess}
        onRefreshRequest={() => loadPipeline({ silent: true })}
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
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className={`h-8 w-8 flex-shrink-0 ${invoice.signed_url ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
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
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isAdmin && (
                        <button
                          onClick={() => handleGenerateSimulation(invoice)}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                            invoice.simulation
                              ? 'border-green-500 bg-green-50 text-green-700 hover:bg-green-100'
                              : 'border-emerald-500 text-emerald-700 hover:bg-emerald-50'
                          }`}
                          title={invoice.simulation ? 'Baixar simulação' : 'Gerar simulação'}
                        >
                          <FileSpreadsheet size={16} />
                          <span className="hidden sm:inline">{invoice.simulation ? 'Baixar simulação' : 'Gerar simulação'}</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleGenerateProposal(invoice)}
                        disabled={!invoice.simulation || generatingProposalIds.has(invoice.id)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                          !invoice.simulation || generatingProposalIds.has(invoice.id)
                            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                            : invoice.proposal
                            ? 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100'
                            : 'border-purple-500 text-purple-700 hover:bg-purple-50'
                        }`}
                        title={
                          generatingProposalIds.has(invoice.id)
                            ? 'Gerando proposta...'
                            : !invoice.simulation
                            ? 'Gere a simulação primeiro'
                            : invoice.proposal
                            ? 'Proposta gerada'
                            : 'Gerar proposta'
                        }
                      >
                        {generatingProposalIds.has(invoice.id) ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Presentation size={16} />
                        )}
                        <span className="hidden sm:inline">
                          {generatingProposalIds.has(invoice.id) ? 'Gerando...' : 'Gerar proposta'}
                        </span>
                      </button>
                      <button
                        onClick={() => handleOpenFile(invoice)}
                        disabled={!invoice.signed_url}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                          invoice.signed_url 
                            ? 'border-gray-300 text-gray-700 hover:bg-gray-50' 
                            : 'border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        title={invoice.signed_url ? 'Abrir fatura' : 'Arquivo não disponível'}
                      >
                        <ExternalLink size={16} />
                        <span className="hidden sm:inline">Abrir</span>
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

      {/* Contract Signature Modal */}
      {isContractSignatureModalOpen && leadForContractSignature && (
        <ContractSignatureModal
          isOpen={isContractSignatureModalOpen}
          onClose={() => {
            setIsContractSignatureModalOpen(false)
            setLeadForContractSignature(null)
          }}
          lead={leadForContractSignature}
          extractedData={
            leadForContractSignature.lead_invoices?.[0]?.extracted_data
          }
          onSuccess={() => {
            loadPipeline({ silent: true })
            setIsContractSignatureModalOpen(false)
            setLeadForContractSignature(null)
          }}
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
                  <div className="truncate text-base font-semibold text-gray-900 cursor-pointer" title={lead.name}>
                    {lead.name}
                  </div>
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
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4">
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
  onOpenDocumentFile,
  onGenerateSimulation,
  onGenerateProposal,
  onRefreshPipeline,
  refreshTrigger,
  generatingProposalIds,
  onOpenContractSignatureModal,
}: {
  lead: Lead
  stage: PipelineStage
  onClose: () => void
  onOpenFile: (invoice: LeadInvoice) => void
  onUploadInvoice: (lead: Lead) => void
  onOpenDocumentFile: (document: LeadDocument) => void
  onGenerateSimulation: (invoice: LeadInvoice) => Promise<void>
  onGenerateProposal: (invoice: LeadInvoice) => Promise<void>
  onRefreshPipeline: () => void
  refreshTrigger?: number
  generatingProposalIds: Set<string>
  onOpenContractSignatureModal: (lead: Lead) => void
}) {
  const { isAdmin } = useUser()
  const [invoices, setInvoices] = useState<LeadInvoice[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [documents, setDocuments] = useState<LeadDocument[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [contratoSocialFile, setContratoSocialFile] = useState<File | null>(null)
  const [documentoPessoalFile, setDocumentoPessoalFile] = useState<File | null>(null)
  const [uploadingContratoSocial, setUploadingContratoSocial] = useState(false)
  const [uploadingDocumentoPessoal, setUploadingDocumentoPessoal] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  
  const statusInfo = getStatusDisplay(lead.status)
  const currentStageName = getStageNameForStatus(lead.status)
  const isFechamentoStage = currentStageName === 'Fechamento'
  const isQualificadoStage = currentStageName === 'Qualificado'
  const isApresentacaoStage = currentStageName === 'Apresentação'
  const isNegociacaoStage = currentStageName === 'Negociação'
  const canMoveToNextStage = isQualificadoStage || isApresentacaoStage || isNegociacaoStage
  
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

  // Load documents with signed URLs when modal opens or when refreshTrigger changes
  useEffect(() => {
    const loadDocuments = async () => {
      setLoadingDocuments(true)
      try {
        const response = await getLeadDocuments(lead.id)
        if (response.success) {
          // Fetch signed URLs for each document
          const documentsWithSignedUrls = await Promise.all(
            response.data.map(async (doc: LeadDocument) => {
              if (!doc.signed_url) {
                try {
                  const signedUrlResponse = await getLeadDocumentSignedUrl(doc.id)
                  if (signedUrlResponse.success && signedUrlResponse.data?.signed_url) {
                    return { ...doc, signed_url: signedUrlResponse.data.signed_url }
                  }
                } catch (err) {
                  console.error(`Error fetching signed URL for document ${doc.id}:`, err)
                }
              }
              return doc
            })
          )
          setDocuments(documentsWithSignedUrls)
        } else {
          // Fallback to the original documents if API call fails
          setDocuments(lead.lead_documents || [])
        }
      } catch (error) {
        console.error('Error loading documents:', error)
        // Fallback to the original documents if API call fails
        setDocuments(lead.lead_documents || [])
      } finally {
        setLoadingDocuments(false)
      }
    }

    loadDocuments()
  }, [lead.id, lead.lead_documents, refreshTrigger])

  const handleContratoSocialFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de arquivo não suportado. Use PDF, JPG, PNG ou WEBP.')
        return
      }
      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        toast.error('Arquivo muito grande. Tamanho máximo: 10MB')
        return
      }
      setContratoSocialFile(file)
    }
  }

  const handleDocumentoPessoalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de arquivo não suportado. Use PDF, JPG, PNG ou WEBP.')
        return
      }
      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        toast.error('Arquivo muito grande. Tamanho máximo: 10MB')
        return
      }
      setDocumentoPessoalFile(file)
    }
  }

  const handleUploadContratoSocial = async () => {
    if (!contratoSocialFile) {
      toast.error('Por favor, selecione um arquivo')
      return
    }

    setUploadingContratoSocial(true)
    try {
      await uploadLeadDocument(lead.id, contratoSocialFile, 'Contrato Social')
      toast.success('Contrato Social enviado com sucesso!')
      setContratoSocialFile(null)
      // Refresh documents list
      onRefreshPipeline()
    } catch (error) {
      console.error('Error uploading Contrato Social:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar documento')
    } finally {
      setUploadingContratoSocial(false)
    }
  }

  const handleUploadDocumentoPessoal = async () => {
    if (!documentoPessoalFile) {
      toast.error('Por favor, selecione um arquivo')
      return
    }

    setUploadingDocumentoPessoal(true)
    try {
      await uploadLeadDocument(lead.id, documentoPessoalFile, 'Documento pessoal')
      toast.success('Documento Pessoal enviado com sucesso!')
      setDocumentoPessoalFile(null)
      // Refresh documents list
      onRefreshPipeline()
    } catch (error) {
      console.error('Error uploading Documento Pessoal:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar documento')
    } finally {
      setUploadingDocumentoPessoal(false)
    }
  }

  const handleSendContractForSignature = () => {
    onOpenContractSignatureModal(lead)
  }

  const handleCommissionClosure = () => {
    // TODO: Implement commission closure functionality
    console.log('Commission closure:', lead.id)
  }

  const handleMoveToStage = async (newStatus: string) => {
    if (!newStatus || newStatus === lead.status) {
      return
    }

    setIsUpdatingStatus(true)
    try {
      await updateLead(lead.id, { status: newStatus })
      
      const newStageName = getStageNameForStatus(newStatus)
      toast.success(`Lead movido para ${newStageName} com sucesso!`)
      
      // Refresh the pipeline to show updated stage
      onRefreshPipeline()
      
      // Close the modal as the lead has moved
      onClose()
    } catch (error) {
      console.error('Error updating lead status:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao mover lead')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

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

          {/* Move to Stage Dropdown - Only for Qualificado, Apresentação or Negociação stages */}
          {canMoveToNextStage && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <label htmlFor="move-stage" className="mb-2 block text-sm font-semibold text-blue-900">
                Mover lead para próxima etapa
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  id="move-stage"
                  disabled={isUpdatingStatus}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleMoveToStage(e.target.value)
                    }
                  }}
                  defaultValue=""
                  className="flex-1 rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#ff6b35] focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled>
                    Selecione a próxima etapa
                  </option>
                  {isQualificadoStage && (
                    <option value="1142458135">Apresentação</option>
                  )}
                  {(isQualificadoStage || isApresentacaoStage) && (
                    <option value="decisionmakerboughtin">Negociação</option>
                  )}
                  {(isQualificadoStage || isApresentacaoStage || isNegociacaoStage) && (
                    <option value="presentationscheduled">Fechamento</option>
                  )}
                </select>
                {isUpdatingStatus && (
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Atualizando...</span>
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-blue-700">
                {isQualificadoStage 
                  ? 'Avance o lead para Apresentação, Negociação ou Fechamento'
                  : isApresentacaoStage 
                  ? 'Avance o lead para Negociação ou Fechamento'
                  : 'Avance o lead para Fechamento'}
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow icon={Building2} label="CNPJ" value={lead.cnpj} />
            {/* <InfoRow icon={Mail} label="E-mail" value={lead.email} href={lead.email ? `mailto:${lead.email}` : undefined} />
            <InfoRow icon={Phone} label="Telefone" value={lead.phone} href={lead.phone ? `tel:${lead.phone}` : undefined} /> */}
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

          {/* Action Buttons Section */}
          <div className="flex flex-col sm:flex-row gap-3">
            {!lead.contract_signed && isFechamentoStage && (
              <button
                onClick={handleSendContractForSignature}
                className="flex items-center justify-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                title="Enviar contrato para assinatura"
              >
                <FileSignature className="h-4 w-4" />
                Enviar contrato para assinatura
              </button>
            )}
            {isAdmin && (
              <button
                onClick={handleCommissionClosure}
                className="flex items-center justify-center gap-2 rounded-lg border border-green-600 bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                title="Fechamento de comissão"
              >
                <DollarSign className="h-4 w-4" />
                Fechamento de comissão
              </button>
            )}
          </div>

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
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className={`h-4 w-4 flex-shrink-0 ${invoice.signed_url ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-medium">{invoice.filename_normalized || invoice.filename_original}</div>
                        <div className="text-xs text-gray-500">{formatCurrencyValue(invoice.invoice_amount)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isAdmin && (
                        <button
                          onClick={() => onGenerateSimulation(invoice)}
                          className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                            invoice.simulation
                              ? 'bg-green-50 text-green-700 hover:bg-green-100'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={invoice.simulation ? 'Baixar simulação' : 'Gerar simulação'}
                        >
                          <FileSpreadsheet size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => onGenerateProposal(invoice)}
                        disabled={!invoice.simulation || generatingProposalIds.has(invoice.id)}
                        className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                          !invoice.simulation || generatingProposalIds.has(invoice.id)
                            ? 'text-gray-400 cursor-not-allowed'
                            : invoice.proposal
                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                            : 'text-purple-600 hover:bg-purple-50'
                        }`}
                        title={
                          generatingProposalIds.has(invoice.id)
                            ? 'Gerando proposta...'
                            : !invoice.simulation
                            ? 'Gere a simulação primeiro'
                            : invoice.proposal
                            ? 'Proposta gerada'
                            : 'Gerar proposta'
                        }
                      >
                        {generatingProposalIds.has(invoice.id) ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Presentation size={14} />
                        )}
                      </button>
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

          {/* Documents section - only shown in Fechamento stage */}
          {isFechamentoStage && (
            <div className="space-y-6">
              <div className="mb-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
                  <FileText className="h-4 w-4 text-green-600" />
                  Documentos necessários
                </p>
              </div>

              {/* Contrato Social Section */}
              <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-4">
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">1. Contrato Social</h4>
                  <p className="text-xs text-gray-600">Envie o Contrato Social da empresa</p>
                </div>
                
                {/* Check if Contrato Social already exists */}
                {documents.find(doc => doc.document_type === 'Contrato Social') ? (
                  <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-green-900 truncate">
                          {documents.find(doc => doc.document_type === 'Contrato Social')?.filename_normalized || 
                           documents.find(doc => doc.document_type === 'Contrato Social')?.filename_original}
                        </div>
                        <div className="text-xs text-green-700">Já enviado</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const doc = documents.find(d => d.document_type === 'Contrato Social')
                        if (doc) onOpenDocumentFile(doc)
                      }}
                      className="flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-900 flex-shrink-0"
                    >
                      <ExternalLink size={14} />
                      Abrir
                    </button>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="contrato-social-file" className="block">
                      <input
                        id="contrato-social-file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={handleContratoSocialFileSelect}
                        disabled={uploadingContratoSocial}
                        className="hidden"
                      />
                      <div className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 transition hover:border-[#ff6b35] hover:bg-gray-50">
                        {contratoSocialFile ? (
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-[#ff6b35]" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{contratoSocialFile.name}</p>
                              <p className="text-xs text-gray-500">
                                {(contratoSocialFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Upload className="h-8 w-8 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Clique para selecionar</p>
                              <p className="text-xs text-gray-500">PDF, JPG, PNG ou WEBP (máx. 10MB)</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </label>
                    {contratoSocialFile && (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setContratoSocialFile(null)}
                          disabled={uploadingContratoSocial}
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleUploadContratoSocial}
                          disabled={uploadingContratoSocial}
                          className="flex-1 rounded-lg bg-[#ff6b35] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#e85f2f] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {uploadingContratoSocial ? (
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Enviando...
                            </div>
                          ) : (
                            'Enviar'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Documento Pessoal Section */}
              <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-4">
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">2. Documento Pessoal do Representante</h4>
                  <p className="text-xs text-gray-600">Envie o RG ou CNH do representante legal</p>
                </div>
                
                {/* Check if Documento Pessoal already exists */}
                {documents.find(doc => doc.document_type === 'Documento pessoal') ? (
                  <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-green-900 truncate">
                          {documents.find(doc => doc.document_type === 'Documento pessoal')?.filename_normalized || 
                           documents.find(doc => doc.document_type === 'Documento pessoal')?.filename_original}
                        </div>
                        <div className="text-xs text-green-700">Já enviado</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const doc = documents.find(d => d.document_type === 'Documento pessoal')
                        if (doc) onOpenDocumentFile(doc)
                      }}
                      className="flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-900 flex-shrink-0"
                    >
                      <ExternalLink size={14} />
                      Abrir
                    </button>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="documento-pessoal-file" className="block">
                      <input
                        id="documento-pessoal-file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={handleDocumentoPessoalFileSelect}
                        disabled={uploadingDocumentoPessoal}
                        className="hidden"
                      />
                      <div className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 transition hover:border-[#ff6b35] hover:bg-gray-50">
                        {documentoPessoalFile ? (
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-[#ff6b35]" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{documentoPessoalFile.name}</p>
                              <p className="text-xs text-gray-500">
                                {(documentoPessoalFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Upload className="h-8 w-8 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Clique para selecionar</p>
                              <p className="text-xs text-gray-500">PDF, JPG, PNG ou WEBP (máx. 10MB)</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </label>
                    {documentoPessoalFile && (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDocumentoPessoalFile(null)}
                          disabled={uploadingDocumentoPessoal}
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleUploadDocumentoPessoal}
                          disabled={uploadingDocumentoPessoal}
                          className="flex-1 rounded-lg bg-[#ff6b35] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#e85f2f] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {uploadingDocumentoPessoal ? (
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Enviando...
                            </div>
                          ) : (
                            'Enviar'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
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
