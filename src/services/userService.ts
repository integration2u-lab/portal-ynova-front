import { apiRequestWithAuth } from '../utils/api';
import { User } from '../types';

export interface GetUsersResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export const userService = {
  async getUsers(params: {
    page?: number;
    limit?: number;
    role?: string;
  } = {}): Promise<GetUsersResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.role) queryParams.append('role', params.role);

    const queryString = queryParams.toString();
    const endpoint = `/users${queryString ? `?${queryString}` : ''}`;

    console.log('Fetching users with params:', params);
    console.log('API endpoint:', endpoint);

    const response = await apiRequestWithAuth(endpoint);
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to fetch users: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Users response data:', data);
    return data;
  },

  async getCurrentUser(): Promise<{ success: boolean; data: User }> {
    const response = await apiRequestWithAuth('/auth/me');
    
    if (!response.ok) {
      throw new Error('Failed to fetch current user');
    }

    return response.json();
  },
};
