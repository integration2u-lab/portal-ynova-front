import { apiRequestWithAuth } from '../utils/api';

export interface DashboardStats {
  leads_ativos: number;
  taxa_conversao: number;
  receita_potencial: string;
  propostas_em_negociacao: number;
  total_consultants?: number;
  current_month_leads?: number;
  previous_month_leads?: number;
  monthly_growth?: number;
}

export interface MonthlyEvolution {
  month: string;
  year: number;
  leads: number;
  closed_leads: number;
}

export interface SegmentDistribution {
  status: string;
  count: number;
}

export interface ChartData {
  monthly_evolution: MonthlyEvolution[];
  segment_distribution: SegmentDistribution[];
}

export interface DashboardStatsResponse {
  success: boolean;
  data: DashboardStats;
}

export interface DashboardChartsResponse {
  success: boolean;
  data: ChartData;
}

export const dashboardService = {
  async getDashboardStats(): Promise<DashboardStatsResponse> {
    const response = await apiRequestWithAuth('/dashboard/stats');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch dashboard statistics');
    }

    return response.json();
  },

  async getDashboardCharts(): Promise<DashboardChartsResponse> {
    const response = await apiRequestWithAuth('/dashboard/charts');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch dashboard charts');
    }

    return response.json();
  },
};
