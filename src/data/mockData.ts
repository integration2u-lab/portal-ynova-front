import { Lead, Proposta, DealComissao } from '../types';

export const mockLeads: Lead[] = [
  {
    id: '1',
    consumer_unit: 'UC-001',
    name: 'Empresa Alpha Ltda',
    phone: '+55 11 99999-9999',
    email: 'contato@empresaalpha.com',
    cnpj: '12.345.678/0001-90',
    month: 'Janeiro',
    year: 2025,
    energy_value: '12500.00',
    invoice_amount: '8750.00',
    status: 'qualificado',
    observations: 'Cliente industrial com alto consumo',
    consultant_id: '1',
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
    consultant: {
      id: '1',
      name: 'João',
      surname: 'Consultor',
      email: 'joao@ynova.com',
    },
  },
  {
    id: '2',
    consumer_unit: 'UC-002',
    name: 'Beta Comércio SA',
    phone: '+55 11 88888-8888',
    email: 'contato@betacomercio.com',
    cnpj: '98.765.432/0001-10',
    month: 'Janeiro',
    year: 2025,
    energy_value: '8500.00',
    invoice_amount: '6200.00',
    status: 'novo',
    observations: 'Cliente comercial em análise',
    consultant_id: '1',
    created_at: '2025-01-14T14:30:00Z',
    updated_at: '2025-01-14T14:30:00Z',
    consultant: {
      id: '1',
      name: 'João',
      surname: 'Consultor',
      email: 'joao@ynova.com',
    },
  },
];

export const mockKpis = {
  leads_ativos: 24,
  taxa_conversao: 27,
  receita_potencial: 1250000,
  propostas_em_negociacao: 5,
  contratos_volume_mwh: 12000,
};

export const mockPropostas: Proposta[] = [
  {
    id: 1,
    leadId: 1,
    data: '2025-01-10',
    status: 'aceita',
    valorSimulado: 150000,
    condicoes: 'Prazo 24 meses',
    pptUrl: '/mock-proposta.ppt',
  },
];

export const mockComissoes: DealComissao[] = [
  {
    dealId: 1,
    leadId: 1,
    valorContrato: 150000,
    comissao: 15000,
    statusPagamento: 'pago',
    data: '2025-01-01',
  },
];


