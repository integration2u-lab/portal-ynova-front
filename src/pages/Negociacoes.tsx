import React, { useState } from "react";
import { Search, Filter, Users, TrendingUp, Trophy, Plus } from "lucide-react";
import { ProgressoDeMetas } from "./ProgressoMetas";
import LeadsKanban from "./negociacoes/LeadsKanban";
import PipelineStatus from "./negociacoes/PipelineStatus";
import CommissionModal from "../components/CommissionModal";
import { useCommissions } from "../hooks/useCommissions";
import { useUser } from "../contexts/UserContext";
import { userService } from "../services/userService";
import { User } from "../types";

export default function Negociacoes() {
  const [tab, setTab] = useState<"leads" | "pipeline" | "comissoes" | "metas">("leads");

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      {/* Título */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 md:text-3xl">Negociações</h1>
        <p className="text-sm text-gray-500 md:text-base">
          Central de acompanhamento de negociações, comissões e metas
        </p>
      </div>

      {/* Tabs */}
      <div className="rounded-xl bg-white shadow">
        <div className="overflow-x-auto border-b border-gray-200">
          <nav className="flex gap-4 px-4">
            <TabBtn
              icon={Users}
              label="Negociações"
              active={tab === "leads"}
              onClick={() => setTab("leads")}
            />
            <TabBtn
              icon={Filter}
              label="Status da Pipeline"
              active={tab === "pipeline"}
              onClick={() => setTab("pipeline")}
            />
            <TabBtn
              icon={TrendingUp}
              label="Comissões"
              active={tab === "comissoes"}
              onClick={() => setTab("comissoes")}
            />
            <TabBtn
              icon={Trophy}
              label="Progresso de Metas"
              active={tab === "metas"}
              onClick={() => setTab("metas")}
            />
          </nav>
        </div>

        <div className="p-4 md:p-6">
          {tab === "leads" && <LeadsKanban />}
          {tab === "pipeline" && <PipelineStatus />}
          {tab === "comissoes" && <ComissoesSection />}
          {tab === "metas" && <ProgressoDeMetas fechamentosAtuais={36} />}
        </div>
      </div>
    </div>
  );
}

function TabBtn({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 border-b-2 px-2 py-3 text-sm font-semibold ${
        active
          ? "border-[#ff6b35] text-[#ff6b35]"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      <Icon size={18} />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

function ComissoesSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedConsultant, setSelectedConsultant] = useState("");
  const [consultants, setConsultants] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAdmin, user } = useUser();

  // Debug logging
  console.log('ComissoesSection - user:', user);
  console.log('ComissoesSection - isAdmin:', isAdmin);
  console.log('ComissoesSection - user role:', user?.role);
  
  const { 
    commissions, 
    loading, 
    error, 
    pagination, 
    updateFilters, 
    refetch 
  } = useCommissions();

  // Filter commissions based on search and status
  const filteredCommissions = commissions.filter(commission => {
    const matchesSearch = searchTerm === "" || 
      commission.consultant?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commission.consultant?.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commission.reference_month.includes(searchTerm);
    
    const matchesStatus = statusFilter === "" || commission.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
  };

  const handleConsultantChange = (consultantId: string) => {
    setSelectedConsultant(consultantId);
    updateFilters({ userId: consultantId || undefined });
  };

  const handleCommissionCreated = () => {
    refetch(); // Refresh the commissions list
  };

  // Load consultants for admin users
  React.useEffect(() => {
    if (isAdmin) {
      userService.getUsers({ role: 'consultant', limit: 100 })
        .then(response => {
          if (response.success) {
            setConsultants(response.data.users);
          }
        })
        .catch(error => {
          console.error('Error loading consultants:', error);
        });
    }
  }, [isAdmin]);

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Erro ao carregar comissões: {error}</p>
          <button 
            onClick={refetch}
            className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Busca + filtro */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative flex-1 min-w-[260px] max-w-[480px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar comissões..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20"
          />
        </label>

        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20"
        >
          <option value="">Todos os status</option>
          <option value="aguardando_nf">Aguardando NF</option>
          <option value="aprovada">Aprovada</option>
          <option value="paga">Paga</option>
        </select>

        {isAdmin && (
          <select
            value={selectedConsultant}
            onChange={(e) => handleConsultantChange(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20"
          >
            <option value="">Todos os consultores</option>
            {consultants.map((consultant) => (
              <option key={consultant.id} value={consultant.id}>
                {consultant.name} {consultant.surname}
              </option>
            ))}
          </select>
        )}

        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Lançar
          </button>
        )}

        <button 
          onClick={refetch}
          disabled={loading}
          className="rounded-lg border border-gray-300 bg-white p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          <Filter className="h-4 w-4" />
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6b35]"></div>
          <p className="mt-2 text-gray-500">Carregando comissões...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredCommissions.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {searchTerm || statusFilter ? 
              "Nenhuma comissão encontrada com os filtros aplicados." : 
              "Nenhuma comissão encontrada."
            }
          </p>
        </div>
      )}

      {/* Tabela */}
      {!loading && filteredCommissions.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="min-w-[900px] w-full bg-white text-sm">
            <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wide text-gray-500">
              <tr>
                <Th>Consultor</Th>
                <Th>Mês Referência</Th>
                <Th>Valor</Th>
                <Th>Status</Th>
                <Th>Data</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCommissions.map((commission) => (
                <tr key={commission.id}>
                  <Td>
                    {commission.consultant ? 
                      `${commission.consultant.name} ${commission.consultant.surname}` : 
                      'Consultor não encontrado'
                    }
                  </Td>
                  <Td>{commission.reference_month}</Td>
                  <Td>R$ {parseFloat(commission.gross_amount).toLocaleString('pt-BR')}</Td>
                  <Td>
                    <Badge 
                      color={
                        commission.status === 'paga' ? 'green' : 
                        commission.status === 'aprovada' ? 'blue' : 
                        'yellow'
                      }
                    >
                      {commission.status === 'paga' ? 'Paga' : 
                       commission.status === 'aprovada' ? 'Aprovada' : 
                       'Aguardando NF'}
                    </Badge>
                  </Td>
                  <Td>{new Date(commission.created_at).toLocaleDateString('pt-BR')}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <BtnLink color="brand">Detalhes (Em breve)</BtnLink>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Commission Modal for Admin Users */}
      {isAdmin && (
        <CommissionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleCommissionCreated}
        />
      )}
    </div>
  );
}

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="px-4 py-3 text-left">{children}</th>
);

const Td = ({ children }: { children: React.ReactNode }) => (
  <td className="px-4 py-3 align-middle text-gray-700">{children}</td>
);

function Badge({
  children,
  color,
}: {
  children: React.ReactNode;
  color: "green" | "blue" | "yellow";
}) {
  const map = {
    green: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    yellow: "bg-amber-100 text-amber-700",
  } as const;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${map[color]}`}>
      {children}
    </span>
  );
}

function BtnLink({
  children,
  color,
}: {
  children: React.ReactNode;
  color: "brand" | "blue";
}) {
  const map = {
    brand: "border-[#ffd0bf] text-[#ff6b35] hover:bg-[#fff0ea]",
    blue: "border-blue-200 text-blue-600 hover:bg-blue-50",
  } as const;
  return (
    <button className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${map[color]}`}>
      {children}
    </button>
  );
}

