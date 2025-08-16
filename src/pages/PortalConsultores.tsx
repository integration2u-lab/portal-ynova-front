import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Users,
  TrendingUp,
  Clock,
  Star,
  Menu,
  X,
  Home,
  UserCheck,
  Calendar,
  FileText,
  DollarSign,
  User,
  Bell,
  HelpCircle,
  LogOut,
  Upload,
  Download,
  Eye,
  Edit,
  Save,
  Phone,
  Mail,
  Building,
  MapPin,
  Filter,
  Search,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";

/** Types **/
type Lead = {
  id: number;
  nome: string;
  cnpj: string;
  segmento: string;
  statusFunil: "vermelho" | "amarelo" | "verde";
  statusMigracao: "em_analise" | "aprovado" | "rejeitado" | "pendente";
  ultimaInteracao: string;
  contato?: string;
  telefone?: string;
  email?: string;
};

type Proposta = {
  id: number;
  leadId: number;
  data: string;
  status: "aceita" | "rejeitada" | "negociacao";
  valorSimulado: number;
  condicoes: string;
  pptUrl: string;
};

type DealComissao = {
  dealId: number;
  leadId: number;
  valorContrato: number;
  comissao: number;
  statusPagamento: "pago" | "pendente" | "processando";
  data: string;
};

/** Mocks **/
const mockLeads: Lead[] = [
  {
    id: 1,
    nome: "Empresa Alpha Ltda",
    cnpj: "12.345.678/0001-90",
    segmento: "Industrial",
    statusFunil: "verde",
    statusMigracao: "aprovado",
    ultimaInteracao: "2025-01-15",
    contato: "João Silva",
    telefone: "(11) 99999-9999",
    email: "joao@alpha.com.br",
  },
  {
    id: 2,
    nome: "Beta Comércio SA",
    cnpj: "98.765.432/0001-10",
    segmento: "Comercial",
    statusFunil: "amarelo",
    statusMigracao: "em_analise",
    ultimaInteracao: "2025-01-14",
    contato: "Maria Santos",
    telefone: "(11) 88888-8888",
    email: "maria@beta.com.br",
  },
];

const mockKpis = {
  leads_ativos: 24,
  taxa_conversao: 27,
  receita_potencial: 1250000,
  propostas_em_negociacao: 5,
  contratos_volume_mwh: 12000,
};

const mockPropostas: Proposta[] = [
  {
    id: 1,
    leadId: 1,
    data: "2025-01-10",
    status: "aceita",
    valorSimulado: 150000,
    condicoes: "Prazo 24 meses",
    pptUrl: "/mock-proposta.ppt",
  },
];

const mockComissoes: DealComissao[] = [
  {
    dealId: 1,
    leadId: 1,
    valorContrato: 150000,
    comissao: 15000,
    statusPagamento: "pago",
    data: "2025-01-01",
  },
];

/** Components **/
function StatusBadge({
  status,
  type,
}: {
  status: string;
  type: "funil" | "migracao";
}) {
  const getColor = () => {
    if (type === "funil") {
      switch (status) {
        case "verde":
          return "bg-green-100 text-green-800 border-green-200";
        case "amarelo":
          return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "vermelho":
          return "bg-red-100 text-red-800 border-red-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    } else {
      switch (status) {
        case "aprovado":
          return "bg-green-100 text-green-800 border-green-200";
        case "em_analise":
          return "bg-blue-100 text-blue-800 border-blue-200";
        case "pendente":
          return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "rejeitado":
          return "bg-red-100 text-red-800 border-red-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    }
  };

  const getLabel = () => {
    if (type === "funil") {
      switch (status) {
        case "verde":
          return "Qualificado";
        case "amarelo":
          return "Em análise";
        case "vermelho":
          return "Frio";
        default:
          return status;
      }
    } else {
      switch (status) {
        case "aprovado":
          return "Aprovado";
        case "em_analise":
          return "Em análise";
        case "pendente":
          return "Pendente";
        case "rejeitado":
          return "Rejeitado";
        default:
          return status;
      }
    }
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium border ${getColor()}`}
    >
      {getLabel()}
    </span>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  color = "blue",
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color?: string;
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div
          className={`p-3 rounded-lg ${
            colorClasses[color as keyof typeof colorClasses]
          }`}
        >
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div
      className="flex items-center justify-center p-8"
      role="status"
      aria-live="polite"
    >
      <RefreshCw className="animate-spin h-8 w-8 text-blue-600" />
      <span className="sr-only">Carregando...</span>
    </div>
  );
}

function EmptyState({
  message,
  action,
}: {
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
        <FileText className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Nenhum item encontrado
      </h3>
      <p className="text-gray-500 mb-4">{message}</p>
      {action}
    </div>
  );
}

/** Main **/
export default function PortalConsultores() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState("resumo");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [user] = useState({ name: "João Consultor", email: "joao@ynova.com" });

  const navigation = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "leads", label: "Leads", icon: UserCheck },
    { id: "agenda", label: "Agenda", icon: Calendar },
    { id: "propostas", label: "Propostas", icon: FileText },
    { id: "comissoes", label: "Comissões", icon: DollarSign },
    { id: "perfil", label: "Perfil", icon: User },
    { id: "notificacoes", label: "Notificações", icon: Bell },
    { id: "ajuda", label: "Ajuda", icon: HelpCircle },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsAuthenticated(true);
      setCurrentPage("dashboard");
      setIsLoading(false);
    }, 800);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage("login");
    setIsMobileMenuOpen(false);
  };

  if (currentPage === "login" || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="text-3xl font-bold text-orange-500 mb-2">
                YNOVA
              </div>
              <p className="text-gray-600">Portal dos Consultores</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? (
                  <RefreshCw className="animate-spin h-5 w-5" />
                ) : (
                  "Entrar"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <a
                href="#"
                className="text-sm text-orange-500 hover:text-orange-600"
              >
                Esqueci minha senha
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Abrir menu"
              >
                <Menu size={24} />
              </button>
              <div className="text-xl font-bold text-orange-500 ml-2 md:ml-0">
                YNOVA
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                className="p-2 text-gray-600 hover:text-gray-900"
                aria-label="Notificações"
              >
                <Bell size={20} />
              </button>
              <div className="flex items-center space-x-2">
                <div
                  className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center"
                  aria-hidden
                >
                  <span className="text-white text-sm font-medium">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:top-16">
          <div className="flex-1 flex flex-col min-h-0 bg-white border-r">
            <nav className="flex-1 px-4 py-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentPage(item.id);
                      setSelectedLead(null);
                    }}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === item.id
                        ? "bg-orange-50 text-orange-600 border border-orange-200"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                    aria-current={currentPage === item.id ? "page" : undefined}
                  >
                    <Icon size={20} className="mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={20} className="mr-3" />
                Sair
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {isMobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/50"
            role="dialog"
            aria-modal="true"
          >
            <div className="fixed inset-y-0 left-0 w-64 bg-white">
              <div className="flex items-center justify-between h-16 px-4 border-b">
                <div className="text-xl font-bold text-orange-500">YNOVA</div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Fechar menu"
                >
                  <X size={24} />
                </button>
              </div>
              <nav className="px-4 py-4 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentPage(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === item.id
                          ? "bg-orange-50 text-orange-600 border border-orange-200"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <Icon size={20} className="mr-3" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={20} className="mr-3" />
                  Sair
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main */}
        <main className="flex-1 md:ml-64">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Dashboard */}
            {currentPage === "dashboard" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Dashboard
                  </h1>
                  <div className="flex items-center space-x-2">
                    <select
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      aria-label="Período"
                    >
                      <option>Último mês</option>
                      <option>Último trimestre</option>
                      <option>Último ano</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <KpiCard
                    title="Leads Ativos"
                    value={mockKpis.leads_ativos}
                    icon={UserCheck}
                    color="blue"
                  />
                  <KpiCard
                    title="Taxa de Conversão"
                    value={`${mockKpis.taxa_conversao}%`}
                    icon={TrendingUp}
                    color="green"
                  />
                  <KpiCard
                    title="Receita Potencial"
                    value={`R$ ${(mockKpis.receita_potencial / 1000000).toFixed(
                      1
                    )}M`}
                    icon={DollarSign}
                    color="orange"
                  />
                  <KpiCard
                    title="Propostas em Negociação"
                    value={mockKpis.propostas_em_negociacao}
                    icon={FileText}
                    color="purple"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-6 shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Evolução Mensal
                    </h3>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      Gráfico de evolução (mock)
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-6 shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Distribuição por Segmento
                    </h3>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      Gráfico de pizza (mock)
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => setCurrentPage("leads")}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Ver Leads
                  </button>
                  <button
                    onClick={() => setCurrentPage("agenda")}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Agendar Apresentação
                  </button>
                  <button
                    onClick={() => setCurrentPage("comissoes")}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Ver Comissões
                  </button>
                </div>
              </div>
            )}

            {/* Leads List */}
            {currentPage === "leads" && !selectedLead && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search
                        size={20}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        placeholder="Buscar leads..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      aria-label="Filtros"
                    >
                      <Filter size={20} />
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  {mockLeads.length === 0 ? (
                    <EmptyState
                      message="Você ainda não possui leads. Importe um arquivo ou cadastre manualmente."
                      action={
                        <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium">
                          Importar Leads
                        </button>
                      }
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Empresa
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              CNPJ
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Segmento
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status Funil
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Migração
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {mockLeads
                            .filter(
                              (lead) =>
                                lead.nome
                                  .toLowerCase()
                                  .includes(searchTerm.toLowerCase()) ||
                                lead.cnpj.includes(searchTerm)
                            )
                            .map((lead) => (
                              <tr key={lead.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {lead.nome}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {lead.contato}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {lead.cnpj}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {lead.segmento}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <StatusBadge
                                    status={lead.statusFunil}
                                    type="funil"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <StatusBadge
                                    status={lead.statusMigracao}
                                    type="migracao"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button
                                    onClick={() => setSelectedLead(lead)}
                                    className="text-orange-600 hover:text-orange-900 mr-4"
                                  >
                                    Abrir
                                  </button>
                                  <button className="text-blue-600 hover:text-blue-900 mr-4">
                                    Solicitar fatura
                                  </button>
                                  <button
                                    className="text-gray-400 hover:text-gray-600"
                                    aria-label="Mais ações"
                                  >
                                    <MoreVertical size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lead Detail */}
            {currentPage === "leads" && selectedLead && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    aria-label="Voltar"
                  >
                    ←
                  </button>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {selectedLead.nome}
                  </h1>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <label className="text-sm text-gray-600">CNPJ</label>
                      <p className="font-medium">{selectedLead.cnpj}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Contato</label>
                      <p className="font-medium">{selectedLead.contato}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">
                        Status Funil
                      </label>
                      <div className="mt-1">
                        <StatusBadge
                          status={selectedLead.statusFunil}
                          type="funil"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">
                        Status Migração
                      </label>
                      <div className="mt-1">
                        <StatusBadge
                          status={selectedLead.statusMigracao}
                          type="migracao"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-b mb-6">
                    <nav className="-mb-px flex space-x-8" role="tablist">
                      {[
                        { id: "resumo", label: "Resumo" },
                        { id: "cadastro", label: "Cadastro" },
                        { id: "faturas", label: "Faturas & Extração" },
                        { id: "propostas", label: "Propostas" },
                        { id: "contratos", label: "Contratos" },
                        { id: "migracao", label: "Migração" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          role="tab"
                          aria-selected={activeTab === tab.id}
                          className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === tab.id
                              ? "border-orange-500 text-orange-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </nav>
                  </div>

                  {activeTab === "resumo" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">
                            Próximas Ações
                          </h4>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Validar fatura de energia</li>
                            <li>• Agendar apresentação</li>
                          </ul>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-medium text-green-900 mb-2">
                            Status Atual
                          </h4>
                          <p className="text-sm text-green-700">
                            Lead qualificado - documentação em análise
                          </p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <h4 className="font-medium text-orange-900 mb-2">
                            Última Interação
                          </h4>
                          <p className="text-sm text-orange-700">
                            {new Date(
                              selectedLead.ultimaInteracao
                            ).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3">
                          Timeline de Eventos
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-600">
                              Fatura enviada - 15/01/2025
                            </span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-gray-600">
                              Primeiro contato - 10/01/2025
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "cadastro" && (
                    <div className="space-y-6">
                      <div className="flex justify-end">
                        <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                          <Edit size={16} />
                          Editar
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Razão Social
                          </label>
                          <input
                            type="text"
                            value={selectedLead.nome}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CNPJ
                          </label>
                          <input
                            type="text"
                            value={selectedLead.cnpj}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Segmento
                          </label>
                          <input
                            type="text"
                            value={selectedLead.segmento}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contato Principal
                          </label>
                          <input
                            type="text"
                            value={selectedLead.contato}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Telefone
                          </label>
                          <input
                            type="text"
                            value={selectedLead.telefone}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            E-mail
                          </label>
                          <input
                            type="email"
                            value={selectedLead.email}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          />
                        </div>
                      </div>

                      <div className="border-t pt-6">
                        <h4 className="font-medium text-gray-900 mb-4">
                          Upload de Fatura
                        </h4>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-sm text-gray-600 mb-2">
                            Arraste e solte um arquivo PDF ou clique para
                            selecionar
                          </p>
                          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                            Selecionar Arquivo
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "faturas" && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-900">
                          Histórico de Faturas
                        </h4>
                        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
                          Nova Extração
                        </button>
                      </div>

                      <div className="bg-white border rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Arquivo
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Data Upload
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Ações
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                fatura_jan_2025.pdf
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                15/01/2025
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                  Pendente validação
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button className="text-blue-600 hover:text-blue-900 mr-4">
                                  Revisar dados
                                </button>
                                <button className="text-orange-600 hover:text-orange-900">
                                  Reprocessar
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h5 className="font-medium text-blue-900 mb-2">
                          Dados Extraídos - Confiança: 95%
                        </h5>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-blue-700 font-medium">
                              Consumo kWh:
                            </span>
                            <span className="ml-2">12.450</span>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">
                              Valor Total:
                            </span>
                            <span className="ml-2">R$ 8.750,00</span>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">
                              Tarifa Média:
                            </span>
                            <span className="ml-2">R$ 0,702/kWh</span>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">
                              Distribuidora:
                            </span>
                            <span className="ml-2">ENEL SP</span>
                          </div>
                        </div>
                        <div className="mt-4 flex space-x-2">
                          <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                            Aceitar
                          </button>
                          <button className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm">
                            Editar
                          </button>
                          <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                            Rejeitar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "propostas" && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-900">
                          Histórico de Propostas
                        </h4>
                        <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
                          Nova Proposta
                        </button>
                      </div>

                      <div className="bg-white border rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Período
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Valor Simulado
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Ações
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {mockPropostas.map((proposta) => (
                              <tr key={proposta.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {new Date(proposta.data).toLocaleDateString(
                                    "pt-BR"
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      proposta.status === "aceita"
                                        ? "bg-green-100 text-green-800"
                                        : proposta.status === "rejeitada"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {proposta.status === "aceita"
                                      ? "Aceita"
                                      : proposta.status === "rejeitada"
                                      ? "Rejeitada"
                                      : "Em negociação"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  R${" "}
                                  {proposta.valorSimulado.toLocaleString(
                                    "pt-BR"
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button className="text-blue-600 hover:text-blue-900 mr-4 flex items-center gap-1">
                                    <Download size={14} />
                                    Baixar PPT
                                  </button>
                                  <button className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
                                    <Eye size={14} />
                                    Visualizar
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTab === "contratos" && (
                    <div className="space-y-6">
                      <h4 className="font-medium text-gray-900">
                        Histórico de Contratos
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h5 className="font-medium text-blue-900">
                            Volume Total
                          </h5>
                          <p className="text-2xl font-bold text-blue-900">
                            12.000 MWh
                          </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h5 className="font-medium text-green-900">
                            Preço Médio
                          </h5>
                          <p className="text-2xl font-bold text-green-900">
                            R$ 285/MWh
                          </p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <h5 className="font-medium text-orange-900">
                            Contratos Ativos
                          </h5>
                          <p className="text-2xl font-bold text-orange-900">
                            3
                          </p>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-600 text-center">
                          Histórico detalhado de contratos será exibido aqui
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === "migracao" && (
                    <div className="space-y-6">
                      <h4 className="font-medium text-gray-900">
                        Status da Migração
                      </h4>
                      <div className="bg-white border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                          <span className="text-sm text-gray-600">
                            Progresso
                          </span>
                          <span className="text-sm text-gray-600">75%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                          <div className="bg-orange-500 h-2 rounded-full w-3/4"></div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="text-sm text-gray-700">
                              Documentação enviada
                            </span>
                            <span className="text-xs text-gray-500 ml-auto">
                              10/01/2025
                            </span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="text-sm text-gray-700">
                              Validação interna
                            </span>
                            <span className="text-xs text-gray-500 ml-auto">
                              12/01/2025
                            </span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <AlertCircle className="h-5 w-5 text-orange-500" />
                            <span className="text-sm text-gray-700">
                              Protocolado na CCEE
                            </span>
                            <span className="text-xs text-gray-500 ml-auto">
                              Em andamento
                            </span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="h-5 w-5 border-2 border-gray-300 rounded-full"></div>
                            <span className="text-sm text-gray-400">
                              Aprovação final
                            </span>
                            <span className="text-xs text-gray-400 ml-auto">
                              Aguardando
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Agenda */}
            {currentPage === "agenda" && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Agendar Apresentação
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cliente
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                        <option>Selecionar cliente...</option>
                        <option>Empresa Alpha Ltda</option>
                        <option>Beta Comércio SA</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duração
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                        <option>30 minutos</option>
                        <option>45 minutos</option>
                        <option>60 minutos</option>
                      </select>
                    </div>
                  </div>

                  <h4 className="font-medium text-gray-900 mb-3">
                    Horários Sugeridos
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {[
                      "Hoje 14:00",
                      "Amanhã 09:00",
                      "Amanhã 15:00",
                      "19/01 10:00",
                      "19/01 16:00",
                      "20/01 09:30",
                      "20/01 14:00",
                      "21/01 11:00",
                    ].map((horario, i) => (
                      <button
                        key={i}
                        className="p-3 border border-gray-300 rounded-lg text-sm hover:border-orange-500 hover:bg-orange-50 transition-colors"
                      >
                        {horario}
                      </button>
                    ))}
                  </div>

                  <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium">
                    Confirmar Agendamento
                  </button>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Próximos Compromissos
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium">
                          Apresentação - Empresa Alpha
                        </p>
                        <p className="text-sm text-gray-600">
                          18/01/2025 às 14:00
                        </p>
                      </div>
                      <button className="text-orange-600 hover:text-orange-700 text-sm">
                        Reagendar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Comissões */}
            {currentPage === "comissoes" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Comissões & Performance
                  </h1>
                  <div className="flex items-center space-x-2">
                    <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                      <option>Janeiro 2025</option>
                      <option>Dezembro 2024</option>
                      <option>Novembro 2024</option>
                    </select>
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                      Exportar CSV
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <KpiCard
                    title="Comissão Gerada"
                    value="R$ 45.000"
                    icon={DollarSign}
                    color="green"
                  />
                  <KpiCard
                    title="Comissão Paga"
                    value="R$ 35.000"
                    icon={CheckCircle}
                    color="blue"
                  />
                  <KpiCard
                    title="Comissão Pendente"
                    value="R$ 10.000"
                    icon={Clock}
                    color="orange"
                  />
                  <KpiCard
                    title="Taxa de Sucesso"
                    value="72%"
                    icon={TrendingUp}
                    color="purple"
                  />
                </div>

                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Histórico de Deals
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Cliente
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Valor Contrato
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Comissão
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Data
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {mockComissoes.map((c) => (
                          <tr key={c.dealId}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {mockLeads.find((l) => l.id === c.leadId)?.nome}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              R$ {c.valorContrato.toLocaleString("pt-BR")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              R$ {c.comissao.toLocaleString("pt-BR")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  c.statusPagamento === "pago"
                                    ? "bg-green-100 text-green-800"
                                    : c.statusPagamento === "pendente"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {c.statusPagamento === "pago"
                                  ? "Pago"
                                  : c.statusPagamento === "pendente"
                                  ? "Pendente"
                                  : "Processando"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(c.data).toLocaleDateString("pt-BR")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Perfil */}
            {currentPage === "perfil" && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>
                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Dados Pessoais
                    </h3>
                    <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
                      <Edit size={16} />
                      Editar
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        value={user.name}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CPF
                      </label>
                      <input
                        type="text"
                        value="123.456.789-00"
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={user.email}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        value="(11) 99999-9999"
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t">
                    <h4 className="font-medium text-gray-900 mb-4">
                      Segurança
                    </h4>
                    <div className="space-y-4">
                      <button className="flex items-center justify-between w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <span className="text-sm font-medium">
                          Alterar senha
                        </span>
                        <ArrowRight size={16} />
                      </button>
                      <button className="flex items-center justify-between w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <span className="text-sm font-medium">
                          Configurar 2FA
                        </span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notificações */}
            {currentPage === "notificacoes" && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  Preferências de Notificação
                </h1>
                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Canais de Notificação
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">WhatsApp</h4>
                        <p className="text-sm text-gray-600">
                          Receba atualizações via WhatsApp
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">E-mail</h4>
                        <p className="text-sm text-gray-600">
                          Receba atualizações por e-mail
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Tipos de Notificação
                  </h3>
                  <div className="space-y-4">
                    {[
                      {
                        label: "Novos leads",
                        desc: "Quando um novo lead for atribuído",
                      },
                      {
                        label: "Contratos fechados",
                        desc: "Quando um contrato for assinado",
                      },
                      {
                        label: "Comissão paga",
                        desc: "Quando uma comissão for processada",
                      },
                      {
                        label: "Lembretes de reunião",
                        desc: "Lembrete 15 minutos antes da reunião",
                      },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {item.label}
                          </h4>
                          <p className="text-sm text-gray-600">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Horário de Silêncio
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Das
                      </label>
                      <input
                        type="time"
                        defaultValue="22:00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Até
                      </label>
                      <input
                        type="time"
                        defaultValue="08:00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium">
                    Salvar Preferências
                  </button>
                </div>
              </div>
            )}

            {/* Ajuda */}
            {currentPage === "ajuda" && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  Central de Ajuda
                </h1>
                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <div className="text-center py-12">
                    <HelpCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Central de Ajuda
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Encontre respostas para suas dúvidas ou entre em contato
                      conosco
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium">
                        Abrir Ticket de Suporte
                      </button>
                      <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium">
                        Acessar FAQ
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-6 shadow-sm border">
                    <h4 className="font-medium text-gray-900 mb-4">
                      Contatos Úteis
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Phone size={16} className="text-gray-400" />
                        <span className="text-sm">(11) 4000-0000</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail size={16} className="text-gray-400" />
                        <span className="text-sm">suporte@ynova.com.br</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock size={16} className="text-gray-400" />
                        <span className="text-sm">Seg-Sex: 8h às 18h</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm border">
                    <h4 className="font-medium text-gray-900 mb-4">
                      Links Rápidos
                    </h4>
                    <div className="space-y-2">
                      <a
                        href="#"
                        className="block text-sm text-blue-600 hover:text-blue-700"
                      >
                        Manual do Usuário
                      </a>
                      <a
                        href="#"
                        className="block text-sm text-blue-600 hover:text-blue-700"
                      >
                        Vídeos Tutoriais
                      </a>
                      <a
                        href="#"
                        className="block text-sm text-blue-600 hover:text-blue-700"
                      >
                        Políticas e Termos
                      </a>
                      <a
                        href="#"
                        className="block text-sm text-blue-600 hover:text-blue-700"
                      >
                        Atualizações do Sistema
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Propostas */}
            {currentPage === "propostas" && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">Propostas</h1>
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Lista de Propostas
                      </h3>
                      <div className="flex items-center space-x-2">
                        <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                          <option>Todas</option>
                          <option>Em negociação</option>
                          <option>Aceitas</option>
                          <option>Rejeitadas</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Cliente
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Data
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Valor
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {mockPropostas.map((p) => (
                          <tr key={p.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {mockLeads.find((l) => l.id === p.leadId)?.nome}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(p.data).toLocaleDateString("pt-BR")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  p.status === "aceita"
                                    ? "bg-green-100 text-green-800"
                                    : p.status === "rejeitada"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {p.status === "aceita"
                                  ? "Aceita"
                                  : p.status === "rejeitada"
                                  ? "Rejeitada"
                                  : "Em negociação"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              R$ {p.valorSimulado.toLocaleString("pt-BR")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1">
                                <Download size={14} />
                                PPT
                              </button>
                              <button className="text-orange-600 hover:text-orange-900 inline-flex items-center gap-1">
                                <Eye size={14} />
                                Ver
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
