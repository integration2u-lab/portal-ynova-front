import { useState, useMemo, useEffect } from "react";
import { useAddNegociacao } from "../../contexts/AddNegociacaoContext";
import {
  User,
  Building2,
  Calendar,
  Phone,
  Mail,
  X,
  Plus,
  Upload,
  FileText,
  Eye,
  ExternalLink,
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Lead, LeadInvoice } from "../../types";
import { getLeads, createLead, updateLead, deleteLead, uploadLeadInvoice, getLeadInvoices } from "../../utils/api";

// Phone mask utility function
const formatPhoneNumber = (value: string) => {
  // Remove all non-numeric characters
  const phoneNumber = value.replace(/\D/g, '');
  
  // Apply mask: +55 (XX) XXXXX-XXXX
  if (phoneNumber.length <= 2) {
    return phoneNumber;
  } else if (phoneNumber.length <= 4) {
    return `+55 (${phoneNumber.slice(2)})`;
  } else if (phoneNumber.length <= 9) {
    return `+55 (${phoneNumber.slice(2, 4)}) ${phoneNumber.slice(4)}`;
  } else {
    return `+55 (${phoneNumber.slice(2, 4)}) ${phoneNumber.slice(4, 9)}-${phoneNumber.slice(9, 13)}`;
  }
};

const handlePhoneChange = (value: string, setter: (value: string) => void) => {
  const formatted = formatPhoneNumber(value);
  setter(formatted);
};

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function LeadsKanban() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addStage, setAddStage] = useState<Lead["status"]>("novo");
  const { isModalOpen, closeModal, modalStage } = useAddNegociacao();
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedLeadInvoices, setSelectedLeadInvoices] = useState<LeadInvoice[]>([]);
  const [selectedLeadForInvoices, setSelectedLeadForInvoices] = useState<Lead | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newLead, setNewLead] = useState({
    consumer_unit: "",
    name: "",
    cnpj: "",
    phone: "",
    email: "",
    month: "",
    year: new Date().getFullYear(),
    energy_value: 0,
    invoice_amount: 0,
    observations: "",
    has_solar_generation: false,
    solar_generation_type: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    source: "",
  });

  const sourceOptions = [
    "Site",
    "LP", 
    "Indicação",
    "Google Ads",
    "Evento",
    "LinkedIn",
    "WhatsApp",
    "Facebook",
    "Instagram",
    "Outros"
  ];

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load leads on component mount
  useEffect(() => {
    loadLeads();
  }, []);

  // Sync global modal state with local modal state
  useEffect(() => {
    if (isModalOpen) {
      openAddModal(modalStage as Lead["status"]);
      closeModal(); // Reset global modal state
    }
  }, [isModalOpen, modalStage, closeModal]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getLeads({ limit: 100 }); // Get more leads for kanban view
      if (response.success) {
        setLeads(response.data.leads);
      } else {
        setError('Failed to load leads');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = (stage: Lead["status"]) => {
    setAddStage(stage);
    setSelectedSources([]);
    setUploadedFile(null);
    setIsUploading(false);
    setNewLead({
      consumer_unit: "",
      name: "",
      cnpj: "",
      phone: "",
      email: "",
      month: "",
      year: new Date().getFullYear(),
      energy_value: 0,
      invoice_amount: 0,
      observations: "",
      has_solar_generation: false,
      solar_generation_type: "",
      address: "",
      city: "",
      state: "",
      zip_code: "",
      source: "",
    });
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => setIsAddModalOpen(false);

  const handleAddLead = async () => {
    try {
      setError(null);
      setIsUploading(true);
      
      // Create lead with multiple sources
      const leadData = {
        ...newLead,
        status: addStage,
        source: selectedSources.join(','), // Join multiple sources with comma
      };
      
      const response = await createLead(leadData);
      
      if (response.success) {
        const leadId = response.data.id;
        
        // Upload invoice file if provided
        if (uploadedFile) {
          try {
            await uploadLeadInvoice(leadId, uploadedFile);
          } catch (uploadError) {
            console.error('Error uploading invoice:', uploadError);
            // Don't fail the entire operation if file upload fails
            setError('Lead created but invoice upload failed. You can upload it later.');
          }
        }
        
        await loadLeads(); // Reload leads to get the updated list
        closeAddModal();
      } else {
        setError('Failed to create lead');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lead');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      setError(null);
      const response = await deleteLead(leadId);
      
      if (response.success) {
        await loadLeads(); // Reload leads to get the updated list
      } else {
        setError('Failed to delete lead');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lead');
    }
  };

  const handleSourceToggle = (source: string) => {
    setSelectedSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setError('Apenas arquivos PDF, JPG e PNG são permitidos');
        return;
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('Arquivo muito grande. Tamanho máximo: 10MB');
        return;
      }
      
      setUploadedFile(file);
      setError(null);
    }
  };

  const handleOpenInvoices = async (lead: Lead) => {
    try {
      setSelectedLeadForInvoices(lead);
      setError(null);
      
      // Load invoices for this lead
      const response = await getLeadInvoices(lead.id);
      if (response.success) {
        setSelectedLeadInvoices(response.data);
        setIsInvoiceModalOpen(true);
      } else {
        setError('Falha ao carregar faturas');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar faturas');
    }
  };

  const handleCloseInvoiceModal = () => {
    setIsInvoiceModalOpen(false);
    setSelectedLeadInvoices([]);
    setSelectedLeadForInvoices(null);
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as Lead["status"];

    // Find the lead being dragged
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    // If the status hasn't changed, do nothing
    if (lead.status === newStatus) return;

    try {
      setIsUpdatingStatus(true);
      setError(null);

      // Update the lead status via API
      const response = await updateLead(leadId, { status: newStatus });
      
      if (response.success) {
        // Update local state optimistically
        setLeads(prevLeads => 
          prevLeads.map(l => 
            l.id === leadId ? { ...l, status: newStatus } : l
          )
        );
      } else {
        setError('Failed to update lead status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lead status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleOpenFile = (invoice: LeadInvoice) => {
    // Use signed URL if available, otherwise fall back to storage URL
    const url = invoice.signed_url || invoice.storage_url;
    if (url) {
      window.open(url, '_blank');
    } else {
      setError('URL do arquivo não disponível');
    }
  };

  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    const totalPipeline = leads.reduce((sum, l) => sum + parseFloat(l.invoice_amount), 0);
    const ticketMedio = totalLeads ? totalPipeline / totalLeads : 0;
    return { totalLeads, totalPipeline, ticketMedio };
  }, [leads]);

  const columns = [
    {
      key: "novo" as const,
      title: "Novos Leads",
      header: "bg-gray-700",
      body: "bg-gray-100",
    },
    {
      key: "qualificado" as const,
      title: "Qualificados",
      header: "bg-blue-600",
      body: "bg-blue-50",
    },
    {
      key: "proposta" as const,
      title: "Apresentação Realizada",
      header: "bg-yellow-600",
      body: "bg-yellow-50",
    },
    {
      key: "negociacao" as const,
      title: "Em Negociação",
      header: "bg-orange-600",
      body: "bg-orange-50",
    },
    {
      key: "fechado" as const,
      title: "Fechado",
      header: "bg-green-600",
      body: "bg-green-50",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando leads...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadLeads}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Loading indicator for status updates */}
      {isUpdatingStatus && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-blue-600">Atualizando status do lead...</p>
          </div>
        </div>
      )}

      {/* Metrics + CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric title="Total de Leads" value={metrics.totalLeads} />
          <Metric
            title="Valor do Pipeline"
            value={formatCurrency(metrics.totalPipeline)}
          />
          <Metric
            title="Ticket Médio"
            value={formatCurrency(metrics.ticketMedio)}
          />
          <Metric title="Taxa de Conversão" value="25%" />
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <DroppableColumn
              key={col.key}
              column={col}
              leads={leads}
              onDelete={handleDeleteLead}
              onOpenInvoices={handleOpenInvoices}
              onAddLead={openAddModal}
            />
          ))}
        </div>
        
        <DragOverlay>
          {activeId ? (
            <LeadCard 
              lead={leads.find(l => l.id === activeId)!} 
              onDelete={() => {}} 
              onOpenInvoices={() => {}}
              isDragging={true}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <button
        onClick={() => openAddModal("novo")}
        className="fixed right-6 bottom-6 z-40 rounded-full bg-blue-600 p-4 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-blue-700"
        title="Adicionar negociação"
      >
        <Plus size={24} />
      </button>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Adicionar Negociação</h2>
              <button
                onClick={closeAddModal}
                className="text-gray-500 transition-colors hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Unidade Consumidora
                </label>
                <input
                  type="text"
                  value={newLead.consumer_unit}
                  onChange={(e) =>
                    setNewLead((p) => ({ ...p, consumer_unit: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  value={newLead.name}
                  onChange={(e) =>
                    setNewLead((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={newLead.cnpj}
                  onChange={(e) =>
                    setNewLead((p) => ({ ...p, cnpj: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={newLead.phone}
                  onChange={(e) => handlePhoneChange(e.target.value, (value) => 
                    setNewLead((p) => ({ ...p, phone: value }))
                  )}
                  placeholder="+55 (11) 99999-9999"
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  E-mail
                </label>
                <input
                  type="email"
                  value={newLead.email}
                  onChange={(e) =>
                    setNewLead((p) => ({ ...p, email: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Mês
                  </label>
                  <input
                    type="text"
                    value={newLead.month}
                    onChange={(e) =>
                      setNewLead((p) => ({ ...p, month: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Janeiro"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Ano
                  </label>
                  <input
                    type="number"
                    value={newLead.year}
                    onChange={(e) =>
                      setNewLead((p) => ({ ...p, year: Number(e.target.value) }))
                    }
                    className="w-full rounded-lg border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Valor da Energia (kWh)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={newLead.energy_value}
                      onChange={(e) =>
                        setNewLead((p) => ({
                          ...p,
                          energy_value: Number(e.target.value),
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 p-3 pl-10 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Valor da Fatura
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={newLead.invoice_amount}
                      onChange={(e) =>
                        setNewLead((p) => ({
                          ...p,
                          invoice_amount: Number(e.target.value),
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 p-3 pl-10 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Origem (Selecione uma ou mais opções)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {sourceOptions.map((source) => (
                    <label key={source} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSources.includes(source)}
                        onChange={() => handleSourceToggle(source)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{source}</span>
                    </label>
                  ))}
                </div>
                {selectedSources.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selecionado: {selectedSources.join(', ')}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Observações
                </label>
                <textarea
                  value={newLead.observations}
                  onChange={(e) =>
                    setNewLead((p) => ({ ...p, observations: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Fatura (PDF, JPG ou PNG)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      {uploadedFile ? uploadedFile.name : 'Clique para selecionar arquivo'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Máximo 10MB
                    </span>
                  </label>
                </div>
                {uploadedFile && (
                  <div className="mt-2 flex items-center text-sm text-green-600">
                    <FileText className="h-4 w-4 mr-1" />
                    {uploadedFile.name}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newLead.has_solar_generation}
                      onChange={(e) =>
                        setNewLead((p) => ({ ...p, has_solar_generation: e.target.checked }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Possui geração solar
                    </span>
                  </label>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Tipo de geração solar
                  </label>
                  <select
                    value={newLead.solar_generation_type}
                    onChange={(e) =>
                      setNewLead((p) => ({ ...p, solar_generation_type: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    disabled={!newLead.has_solar_generation}
                  >
                    <option value="">Selecione</option>
                    <option value="Distribuída">Distribuída</option>
                    <option value="Centralizada">Centralizada</option>
                    <option value="Híbrida">Híbrida</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={newLead.address}
                    onChange={(e) =>
                      setNewLead((p) => ({ ...p, address: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={newLead.city}
                    onChange={(e) =>
                      setNewLead((p) => ({ ...p, city: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Estado (UF)
                  </label>
                  <input
                    type="text"
                    value={newLead.state}
                    onChange={(e) =>
                      setNewLead((p) => ({ ...p, state: e.target.value.toUpperCase() }))
                    }
                    maxLength={2}
                    className="w-full rounded-lg border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="SP"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={newLead.zip_code}
                    onChange={(e) =>
                      setNewLead((p) => ({ ...p, zip_code: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="01234-567"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleAddLead}
                disabled={isUploading}
                className="rounded-lg bg-blue-500 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {isInvoiceModalOpen && selectedLeadForInvoices && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Faturas - {selectedLeadForInvoices.name}
                </h2>
                <p className="text-sm text-gray-600">
                  {selectedLeadForInvoices.consumer_unit} • {selectedLeadForInvoices.cnpj}
                </p>
              </div>
              <button
                onClick={handleCloseInvoiceModal}
                className="text-gray-500 transition-colors hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {selectedLeadInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma fatura encontrada para este lead.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedLeadInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className={`h-8 w-8 ${invoice.signed_url ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div>
                        <p className="font-medium text-gray-900">
                          {invoice.filename_normalized}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(parseFloat(invoice.invoice_amount))} • 
                          {new Date(invoice.created_at).toLocaleDateString("pt-BR")}
                          {!invoice.signed_url && (
                            <span className="ml-2 text-red-500 text-xs">(Arquivo não disponível)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenFile(invoice)}
                        disabled={!invoice.signed_url}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors ${
                          invoice.signed_url 
                            ? 'border-gray-300 text-gray-700 hover:bg-gray-50' 
                            : 'border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <ExternalLink size={16} />
                        Abrir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

function DroppableColumn({
  column,
  leads,
  onDelete,
  onOpenInvoices,
  onAddLead,
}: {
  column: {
    key: Lead["status"];
    title: string;
    header: string;
    body: string;
  };
  leads: Lead[];
  onDelete: (id: string) => void;
  onOpenInvoices: (lead: Lead) => void;
  onAddLead: (status: Lead["status"]) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: column.key,
  });

  const items = leads.filter((l) => l.status === column.key);
  const sum = items.reduce((acc, l) => acc + parseFloat(l.invoice_amount), 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex w-80 shrink-0 flex-col rounded-lg ${
        isOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      }`}
    >
      <div className={`${column.header} rounded-t-lg px-4 py-2 text-white`}>
        <div className="text-sm font-semibold">{column.title}</div>
        <div className="text-xs">
          {items.length} {items.length === 1 ? "lead" : "leads"} • {""}
          {formatCurrency(sum)}
        </div>
      </div>
      <div className={`${column.body} flex flex-1 flex-col gap-3 p-3 min-h-[400px]`}>
        <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
          {items.map((lead) => (
            <SortableLeadCard 
              key={lead.id} 
              lead={lead} 
              onDelete={onDelete}
              onOpenInvoices={onOpenInvoices}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

function Metric({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg bg-white px-4 py-2 shadow-sm">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function SortableLeadCard({
  lead,
  onDelete,
  onOpenInvoices,
}: {
  lead: Lead;
  onDelete: (id: string) => void;
  onOpenInvoices: (lead: Lead) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative space-y-2 rounded-md bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {/* Action buttons - positioned to avoid drag interference */}
      <div className="absolute right-2 top-2 flex gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenInvoices(lead);
          }}
          className="text-gray-400 hover:text-blue-600"
          aria-label="Ver faturas"
          title="Ver faturas"
        >
          <FileText size={14} />
        </button>
      </div>
      
      {/* Main content area - draggable */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing pr-8"
      >
        <div className="font-semibold text-gray-900 mb-1">{lead.name}</div>
        <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
          <Building2 size={14} className="text-gray-400" />
          {lead.consumer_unit}
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
          <Building2 size={14} className="text-gray-400" />
          {lead.cnpj}
        </div>
        <div className="flex flex-wrap gap-2 text-xs mb-2">
          <span className="rounded bg-gray-200 px-2 py-1 text-gray-700">
            {lead.month} {lead.year}
          </span>
          {lead.source && lead.source.split(',').map((source, index) => (
            <span key={index} className="rounded bg-blue-100 px-2 py-1 text-blue-700 text-xs">
              {source.trim()}
            </span>
          ))}
        </div>
        <div className="text-sm font-semibold text-green-600 mb-1">
          {formatCurrency(parseFloat(lead.invoice_amount))}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <Calendar size={14} className="text-gray-400" />
          {new Date(lead.created_at).toLocaleDateString("pt-BR")}
        </div>
        <div className="flex items-center justify-between pt-1 mb-1">
          <div className="flex gap-2">
            <a
              href={`tel:${lead.phone}`}
              className="text-gray-600 transition-colors hover:text-gray-800"
            >
              <Phone size={16} />
            </a>
            <a
              href={`mailto:${lead.email}`}
              className="text-gray-600 transition-colors hover:text-gray-800"
            >
              <Mail size={16} />
            </a>
          </div>
        </div>
      </div>
      
      {/* FileText info - outside draggable area */}
      {lead.lead_invoices && lead.lead_invoices.length > 0 && (
        <div 
          className="flex items-center gap-1 text-xs text-blue-600 cursor-pointer hover:text-blue-800 transition-colors mt-2"
          onClick={(e) => {
            e.stopPropagation();
            onOpenInvoices(lead);
          }}
          title="Ver faturas"
        >
          <FileText size={12} />
          <span>{lead.lead_invoices.length} fatura{lead.lead_invoices.length > 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}

function LeadCard({
  lead,
  onDelete,
  onOpenInvoices,
  isDragging = false,
}: {
  lead: Lead;
  onDelete: (id: string) => void;
  onOpenInvoices: (lead: Lead) => void;
  isDragging?: boolean;
}) {
  return (
   <div className={`relative space-y-2 rounded-md bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
     isDragging ? 'opacity-50 rotate-3 scale-105' : ''
   }`}>
      <div className="absolute right-2 top-2 flex gap-1">
        <button
          onClick={() => onOpenInvoices(lead)}
          className="text-gray-400 hover:text-blue-600"
          aria-label="Ver faturas"
          title="Ver faturas"
        >
          <FileText size={14} />
        </button>
        <button
          onClick={() => onDelete(lead.id)}
          className="text-gray-400 hover:text-red-600"
          aria-label="Apagar lead"
          title="Apagar lead"
        >
          <X size={14} />
        </button>
      </div>
      <div className="font-semibold text-gray-900 mb-1">{lead.name}</div>
      <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
        <Building2 size={14} className="text-gray-400" />
        {lead.consumer_unit}
      </div>
      <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
        <Building2 size={14} className="text-gray-400" />
        {lead.cnpj}
      </div>
      <div className="flex flex-wrap gap-2 text-xs mb-2">
        <span className="rounded bg-gray-200 px-2 py-1 text-gray-700">
          {lead.month} {lead.year}
        </span>
        {lead.source && lead.source.split(',').map((source, index) => (
          <span key={index} className="rounded bg-blue-100 px-2 py-1 text-blue-700 text-xs">
            {source.trim()}
          </span>
        ))}
      </div>
      <div className="text-sm font-semibold text-green-600 mb-1">
        {formatCurrency(parseFloat(lead.invoice_amount))}
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
        <Calendar size={14} className="text-gray-400" />
        {new Date(lead.created_at).toLocaleDateString("pt-BR")}
      </div>
      <div className="flex items-center justify-between pt-1 mb-1">
        <div className="flex gap-2">
          <a
            href={`tel:${lead.phone}`}
            className="text-gray-600 transition-colors hover:text-gray-800"
          >
            <Phone size={16} />
          </a>
          <a
            href={`mailto:${lead.email}`}
            className="text-gray-600 transition-colors hover:text-gray-800"
          >
            <Mail size={16} />
          </a>
        </div>
      </div>
      
      {/* FileText info - separate from main content */}
      {lead.lead_invoices && lead.lead_invoices.length > 0 && (
        <div 
          className="flex items-center gap-1 text-xs text-blue-600 cursor-pointer hover:text-blue-800 transition-colors mt-2"
          onClick={(e) => {
            e.stopPropagation();
            onOpenInvoices(lead);
          }}
          title="Ver faturas"
        >
          <FileText size={12} />
          <span>{lead.lead_invoices.length} fatura{lead.lead_invoices.length > 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}

