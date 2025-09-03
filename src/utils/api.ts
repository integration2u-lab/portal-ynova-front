// API utility functions
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  return fetch(url, { ...defaultOptions, ...options });
};

export const apiRequestWithAuth = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = localStorage.getItem('token');
  
  const authOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': token ? `Bearer ${token}` : '',
    },
  };

  return apiRequest(endpoint, authOptions);
};

// User API functions
export const updateUserProfile = async (userId: string, userData: {
  name?: string;
  surname?: string;
  email?: string;
  phone?: string | null;
}) => {
  const response = await apiRequestWithAuth(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update user profile');
  }

  return response.json();
};