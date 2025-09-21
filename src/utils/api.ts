// API utility functions
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

// Debug function to check authentication status
export const checkAuthStatus = () => {
  const token = localStorage.getItem('token');
  console.log('Auth Status Check:', {
    hasToken: !!token,
    tokenLength: token?.length || 0,
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token',
    localStorageKeys: Object.keys(localStorage)
  });
  return !!token;
};

export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const requestOptions: RequestInit = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: options.body,
    // Don't spread options here as it overrides the headers
  };

  return fetch(url, requestOptions);
};

export const apiRequestWithAuth = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = localStorage.getItem('token');
  
  // Debug logging
  console.log('API Request Debug:', {
    endpoint,
    token: token ? `${token.substring(0, 20)}...` : 'No token found',
    hasToken: !!token,
    options: options
  });
  
  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }
  
  const authOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  };

  console.log('Auth options prepared:', authOptions);
  return apiRequest(endpoint, authOptions);
};

// User API functions
export const updateUserProfile = async (userId: string, userData: {
  name?: string;
  surname?: string;
  email?: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  birth_date?: string | null;
  pix_key?: string | null;
}) => {
  console.log('updateUserProfile called with:', { userId, userData });
  
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

export const uploadProfilePhoto = async (userId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/users/${userId}/photo`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload profile photo');
  }

  return response.json();
};

export const uploadProfilePhotoBase64 = async (userId: string, base64Image: string) => {
  const response = await apiRequestWithAuth(`/users/${userId}/photo-base64`, {
    method: 'POST',
    body: JSON.stringify({ base64Image }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload profile photo');
  }

  return response.json();
};

// Lead API functions
export const getLeads = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  month?: string;
  year?: number;
}) => {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.month) queryParams.append('month', params.month);
  if (params?.year) queryParams.append('year', params.year.toString());

  const response = await apiRequestWithAuth(`/leads?${queryParams.toString()}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch leads');
  }

  return response.json();
};

export const getLeadById = async (leadId: string) => {
  const response = await apiRequestWithAuth(`/leads/${leadId}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch lead');
  }

  return response.json();
};

export const createLead = async (leadData: {
  consumer_unit: string;
  name: string;
  phone: string;
  email: string;
  cnpj: string;
  month: string;
  year: number;
  energy_value: number;
  invoice_amount: number;
  status?: 'novo' | 'qualificado' | 'proposta' | 'negociacao' | 'fechado';
  observations?: string;
  has_solar_generation?: boolean;
  solar_generation_type?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  origem?: string;
}) => {
  const response = await apiRequestWithAuth('/leads', {
    method: 'POST',
    body: JSON.stringify(leadData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create lead');
  }

  return response.json();
};

export const updateLead = async (leadId: string, leadData: {
  consumer_unit?: string;
  name?: string;
  phone?: string;
  email?: string;
  cnpj?: string;
  month?: string;
  year?: number;
  energy_value?: number;
  invoice_amount?: number;
  status?: 'novo' | 'qualificado' | 'proposta' | 'negociacao' | 'fechado';
  observations?: string;
  has_solar_generation?: boolean;
  solar_generation_type?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  origem?: string;
}) => {
  const response = await apiRequestWithAuth(`/leads/${leadId}`, {
    method: 'PUT',
    body: JSON.stringify(leadData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update lead');
  }

  return response.json();
};

export const deleteLead = async (leadId: string) => {
  const response = await apiRequestWithAuth(`/leads/${leadId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete lead');
  }

  return response.json();
};

// Lead Invoice API functions
export const uploadLeadInvoice = async (leadId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/leads/${leadId}/invoices`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload invoice');
  }

  return response.json();
};

export const getLeadInvoices = async (leadId: string) => {
  const response = await apiRequestWithAuth(`/leads/${leadId}/invoices`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch invoices');
  }

  return response.json();
};

export const deleteLeadInvoice = async (invoiceId: string) => {
  const response = await apiRequestWithAuth(`/leads/invoices/${invoiceId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete invoice');
  }

  return response.json();
};

// Register user function
export const registerUser = async (userData: {
  email: string;
  password: string;
  name: string;
  surname: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  birth_date?: string;
  pix_key?: string;
}) => {
  const registerData = {
    ...userData,
    photo_url: 'https://ynova-mkp-portal-files.s3.us-east-2.amazonaws.com/profile-photos/default-ynova-consultant.png',
    role: 'consultant',
    client_id: null
  };

  console.log('registerUser called with:', registerData);
  
  const response = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(registerData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to register user');
  }

  return response.json();
};