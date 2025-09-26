import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Loader2, RefreshCcw } from 'lucide-react'
import { pipelineService, type PipelineStage } from '../../services/pipelineService'

const stageColors = [
  'from-orange-500 to-orange-400',
  'from-sky-500 to-sky-400',
  'from-purple-500 to-purple-400',
  'from-amber-500 to-amber-400',
  'from-emerald-500 to-emerald-400',
  'from-rose-500 to-rose-400'
]

export default function PipelineStatus() {
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'api' | 'mock'>('mock')

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao carregar o pipeline')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStages()
  }, [])

  const totalLeads = useMemo(() => stages.reduce((total, stage) => total + stage.leads, 0), [stages])
  const maxLeads = useMemo(() => Math.max(...stages.map(stage => stage.leads), 1), [stages])

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
    </div>
  )
}
