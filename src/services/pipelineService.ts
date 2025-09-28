import { apiRequest } from '../utils/api'
import { mockPipelineStages, type PipelineStage } from '../data/pipelineStages'

export interface PipelineStagesResponse {
  success: boolean
  data: PipelineStage[]
  source: 'api' | 'mock'
}

export const pipelineService = {
  async getPipelineStages(): Promise<PipelineStagesResponse> {
    try {
      const response = await apiRequest('/pipeline/stages')

      if (!response.ok) {
        throw new Error('Pipeline stages request failed')
      }

      const json = await response.json()

      if (Array.isArray(json?.data)) {
        return { success: true, data: json.data, source: 'api' }
      }

      return { success: true, data: mockPipelineStages, source: 'mock' }
    } catch (error) {
      console.warn('Falling back to mock pipeline stages:', error)
      return { success: true, data: mockPipelineStages, source: 'mock' }
    }
  }
}

export type { PipelineStage }
