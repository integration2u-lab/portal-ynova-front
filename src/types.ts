export type Lead = {
  id: string;
  consumer_unit: string;
  client_name: string;
  cnpj: string;
  month: string;
  year: number;
  energy_value: string;
  invoice_amount: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  file_url?: string;
  file_key?: string;
  file_name?: string;
  observations?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  user?: {
    id: string;
    name: string;
    surname: string;
    email: string;
  };
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

export type User = {
  id: string;
  email: string;
  name: string;
  surname: string;
  client_id: string | null;
  created_at: string;
};