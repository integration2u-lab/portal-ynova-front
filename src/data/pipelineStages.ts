export type PipelineStage = {
  id: number
  stage: string
  leads: number
}

export const mockPipelineStages: PipelineStage[] = [
  { id: 1, stage: 'Prospecção', leads: 12 },
  { id: 2, stage: 'Qualificação', leads: 8 },
  { id: 3, stage: 'Proposta Enviada', leads: 5 },
  { id: 4, stage: 'Negociação', leads: 3 },
  { id: 5, stage: 'Fechado (Ganho)', leads: 2 },
  { id: 6, stage: 'Fechado (Perdido)', leads: 1 }
]
