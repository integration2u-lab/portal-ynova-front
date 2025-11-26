// API utility functions
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

// Debug function to check authentication status
export const checkAuthStatus = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Don't set Content-Type for FormData (let browser set it with boundary)
  const isFormData = options.body instanceof FormData;
  
  const requestOptions: RequestInit = {
    method: options.method || 'GET',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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
  // PJ (Pessoa Jurídica) fields
  pj_cnpj?: string | null;
  pj_razaosocial?: string | null;
  pj_nomefantasia?: string | null;
  pj_phone?: string | null;
  pj_address?: string | null;
  pj_city?: string | null;
  pj_state?: string | null;
  pj_zip_code?: string | null;
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
  userId?: string; // For admin users to filter by consultant
}) => {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.month) queryParams.append('month', params.month);
  if (params?.year) queryParams.append('year', params.year.toString());
  if (params?.userId) queryParams.append('userId', params.userId);

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
  status?: string;
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
  status?: string;
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

// Lead Document API functions
export const uploadLeadDocument = async (leadId: string, file: File, documentType: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('document_type', documentType);

  const response = await fetch(`${API_BASE_URL}/leads/${leadId}/documents`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload document');
  }

  return response.json();
};

export const getLeadDocuments = async (leadId: string) => {
  const response = await apiRequestWithAuth(`/leads/${leadId}/documents`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch documents');
  }

  return response.json();
};

export const getLeadDocumentSignedUrl = async (documentId: string) => {
  const response = await apiRequestWithAuth(`/leads/documents/${documentId}/signed-url`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get document signed URL');
  }

  return response.json();
};

export const deleteLeadDocument = async (documentId: string) => {
  const response = await apiRequestWithAuth(`/leads/documents/${documentId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete document');
  }

  return response.json();
};

export const createDocumentExternal = async (leadId: string, data: any) => {
  const response = await apiRequestWithAuth(`/leads/${leadId}/documents/external`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create document via external API');
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
  // PJ (Pessoa Jurídica) fields
  pj_cnpj?: string;
  pj_razaosocial?: string;
  pj_nomefantasia?: string;
  pj_phone?: string;
  pj_address?: string;
  pj_city?: string;
  pj_state?: string;
  pj_zip_code?: string;
}) => {
  const registerData = {
    ...userData,
    photo_url: 'https://ynova-mkp-portal-files.s3.us-east-2.amazonaws.com/profile-photos/default-ynova-consultant.png',
    role: 'consultant',
    client_id: null
  };
  
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

// PPT Generation API functions
export const downloadFileAsBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to download file');
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,")
        const base64Content = base64String.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error('Failed to download and convert file to base64');
  }
};

export const extractPptDataFromExcel = async (arquivoBase64: string) => {
  const PPT_API_URL = `${API_BASE_URL}/ppt/extract`;
  
  const response = await fetch(PPT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ arquivoBase64 }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to extract PPT data' }));
    throw new Error(errorData.error || 'Failed to extract PPT data from Excel');
  }

  return response.json();
};

export const generatePptPresentation = async (pptData: any) => {
  const N8N_WEBHOOK_URL = 'https://n8n.ynovamarketplace.com/webhook/cria-ppt';
  
  const response = await fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pptData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to generate presentation' }));
    throw new Error(errorData.error || 'Failed to generate PowerPoint presentation');
  }

  return response.json();
};

// DocuSign API functions
export const sendDocuSignEnvelope = async (payload: any) => {
  const DOCUSIGN_API_URL = `${API_BASE_URL}/docusign/send-docusign-envelope`;
  
  const response = await fetch(DOCUSIGN_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to send DocuSign envelope' }));
    throw new Error(errorData.error || 'Failed to send contract for signature');
  }

  return response.json();
};

// Change Password API function
export const changePassword = async (currentPassword: string, newPassword: string) => {
  const response = await apiRequestWithAuth('/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to change password');
  }

  return data;
};

// Partner Invoice API functions
export const getMyPartnerInvoices = async (params?: {
  reference_month?: number;
  reference_year?: number;
}) => {
  const queryParams = new URLSearchParams();
  
  if (params?.reference_month) queryParams.append('reference_month', params.reference_month.toString());
  if (params?.reference_year) queryParams.append('reference_year', params.reference_year.toString());

  const queryString = queryParams.toString();
  const endpoint = `/partner-invoices/me${queryString ? `?${queryString}` : ''}`;

  const response = await apiRequestWithAuth(endpoint);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch partner invoices');
  }

  return response.json();
};

export const getAllPartnerInvoices = async (params?: {
  page?: number;
  limit?: number;
  reference_month?: number;
  reference_year?: number;
  partner_id?: string;
}) => {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.reference_month) queryParams.append('reference_month', params.reference_month.toString());
  if (params?.reference_year) queryParams.append('reference_year', params.reference_year.toString());
  if (params?.partner_id) queryParams.append('partner_id', params.partner_id);

  const queryString = queryParams.toString();
  const endpoint = `/partner-invoices/${queryString ? `?${queryString}` : ''}`;

  const response = await apiRequestWithAuth(endpoint);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch partner invoices');
  }

  return response.json();
};

export const uploadMyPartnerInvoice = async (
  file: File,
  reference_month: number,
  reference_year: number,
  invoice_amount?: string
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('reference_month', reference_month.toString());
  formData.append('reference_year', reference_year.toString());
  if (invoice_amount) {
    formData.append('invoice_amount', invoice_amount);
  }

  const response = await fetch(`${API_BASE_URL}/partner-invoices/me`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload partner invoice');
  }

  return response.json();
};

export const uploadPartnerInvoiceForPartner = async (
  partnerId: string,
  file: File,
  reference_month: number,
  reference_year: number,
  invoice_amount?: string
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('reference_month', reference_month.toString());
  formData.append('reference_year', reference_year.toString());
  if (invoice_amount) {
    formData.append('invoice_amount', invoice_amount);
  }

  const response = await fetch(`${API_BASE_URL}/partner-invoices/partner/${partnerId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload partner invoice');
  }

  return response.json();
};

export const getPartnerInvoiceSignedUrl = async (invoiceId: string) => {
  const response = await apiRequestWithAuth(`/partner-invoices/invoice/${invoiceId}/signed-url`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get invoice signed URL');
  }

  return response.json();
};