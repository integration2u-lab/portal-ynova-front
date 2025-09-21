export type Lead = {
  id: string;
  consumer_unit: string;
  name: string;
  phone: string;
  email: string;
  cnpj: string;
  month: string;
  year: number;
  energy_value: string;
  invoice_amount: string;
  status: 'novo' | 'qualificado' | 'proposta' | 'negociacao' | 'fechado';
  observations?: string;
  consultant_id?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  has_solar_generation?: boolean;
  solar_generation_type?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  source?: string;
  consultant?: {
    id: string;
    name: string;
    surname: string;
    email: string;
  };
  lead_invoices?: LeadInvoice[];
};

export type LeadInvoice = {
  id: string;
  lead_id: string;
  filename_original: string;
  filename_normalized: string;
  storage_url: string;
  signed_url?: string;
  invoice_amount: string;
  extracted_data: any;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
};

export type Proposta = {
  id: number;
  leadId: number;
  data: string;
  status: 'aceita' | 'rejeitada' | 'negociacao';
  valorSimulado: number;
  condicoes: string;
  pptUrl: string;
};

export type DealComissao = {
  dealId: number;
  leadId: number;
  valorContrato: number;
  comissao: number;
  statusPagamento: 'pago' | 'pendente' | 'processando';
  data: string;
};

export type Commission = {
  id: string;
  consultant_id: string;
  reference_month: string;
  gross_amount: string;
  status: 'aguardando_nf' | 'aprovada' | 'paga';
  notes?: string;
  created_at: string;
  updated_at: string;
  consultant?: {
    id: string;
    name: string;
    surname: string;
    email: string;
  };
};

export type User = {
  id: string;
  email: string;
  name: string;
  surname: string;
  phone: string | null;
  photo_url: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  birth_date: string | null;
  pix_key: string | null;
  role: string;
  client_id: string | null;
  created_at: string;
};