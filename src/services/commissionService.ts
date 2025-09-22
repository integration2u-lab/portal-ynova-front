import { apiRequestWithAuth } from '../utils/api';
import { Commission } from '../types';

export interface GetCommissionsParams {
  page?: number;
  limit?: number;
  status?: string;
  reference_month?: string;
  userId?: string; // For admin users to filter by consultant
}

export interface GetCommissionsResponse {
  success: boolean;
  data: {
    commissions: Commission[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export const commissionService = {
  async getCommissions(params: GetCommissionsParams = {}): Promise<GetCommissionsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.reference_month) queryParams.append('reference_month', params.reference_month);
    if (params.userId) queryParams.append('userId', params.userId);

    const queryString = queryParams.toString();
    const endpoint = `/commissions${queryString ? `?${queryString}` : ''}`;

    const response = await apiRequestWithAuth(endpoint);
    
    if (!response.ok) {
      throw new Error('Failed to fetch commissions');
    }

    return response.json();
  },

  async getCommissionById(id: string): Promise<{ success: boolean; data: Commission }> {
    const response = await apiRequestWithAuth(`/commissions/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch commission');
    }

    return response.json();
  },

  async createCommission(data: {
    reference_month: string;
    gross_amount: number;
    notes?: string;
    status?: string;
    consultant_id?: string; // For admin users to create commissions for specific consultants
  }): Promise<{ success: boolean; data: Commission }> {
    const response = await apiRequestWithAuth('/commissions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create commission');
    }

    return response.json();
  },

  async updateCommission(id: string, data: {
    reference_month?: string;
    gross_amount?: number;
    notes?: string;
    status?: string;
  }): Promise<{ success: boolean; data: Commission }> {
    const response = await apiRequestWithAuth(`/commissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update commission');
    }

    return response.json();
  },

  async deleteCommission(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiRequestWithAuth(`/commissions/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete commission');
    }

    return response.json();
  },
};
