import React, { useState, useEffect } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequestWithAuth } from '../utils/api';

interface ModalUploadInvoiceProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (lead: any) => void;
  onRefreshRequest?: () => void;
}

// Expose checkPendingOcrJobs as a standalone function for external use
export const checkAndUpdatePendingOcrJobs = async () => {
  try {
    // Import getLeads function dynamically
    const { getLeads, apiRequestWithAuth } = await import('../utils/api');
    
    // Fetch all leads to check for pending OCR jobs
    const leadsData = await getLeads();
    console.log('API Response:', leadsData);
    
    // Handle different possible response structures
    let leads = [];
    if (Array.isArray(leadsData)) {
      leads = leadsData;
    } else if (leadsData.data?.leads && Array.isArray(leadsData.data.leads)) {
      // Structure: { success: true, data: { leads: [...], pagination: {...} } }
      leads = leadsData.data.leads;
    } else if (leadsData.data && Array.isArray(leadsData.data)) {
      leads = leadsData.data;
    } else if (leadsData.leads && Array.isArray(leadsData.leads)) {
      leads = leadsData.leads;
    } else {
      console.error('Unexpected API response structure:', leadsData);
      throw new Error('Invalid API response structure');
    }

    // Filter leads that have "A DETERMINAR" and an idp_id
    const pendingLeads = leads.filter((lead: any) => 
      lead.consumer_unit === 'A DETERMINAR' && 
      lead.idp_id && 
      lead.idp_id.trim() !== ''
    );

    console.log(`Found ${pendingLeads.length} leads with pending OCR processing out of ${leads.length} total leads`);
    
    let updatedCount = 0;

    // Check each pending lead
    for (const lead of pendingLeads) {
      try {
        const ocrResponse = await fetch(`https://d7eqdg7oj5.execute-api.us-east-2.amazonaws.com/dev/document/${lead.idp_id}`);
        
        if (!ocrResponse.ok) continue;
        
        const ocrStatus = await ocrResponse.json();
        
        if (ocrStatus && 
            ocrStatus.status === 'COMPLETED' && 
            ocrStatus.excel_s3_url) {
          
          console.log(`OCR completed for lead ${lead.id}, updating...`);
          
          // Update the lead with extracted data
          const extractedData = ocrStatus.extracted_data;
          
          // Parse month and year from periodo_fatura
          let month = 'A DETERMINAR';
          let year = new Date().getFullYear();
          
          if (extractedData.periodo_fatura) {
            const parts = extractedData.periodo_fatura.split('/');
            if (parts.length === 2) {
              const monthMap: Record<string, string> = {
                'JAN': 'Janeiro', 'FEV': 'Fevereiro', 'MAR': 'Março',
                'ABR': 'Abril', 'MAI': 'Maio', 'JUN': 'Junho',
                'JUL': 'Julho', 'AGO': 'Agosto', 'SET': 'Setembro',
                'OUT': 'Outubro', 'NOV': 'Novembro', 'DEZ': 'Dezembro',
              };
              month = monthMap[parts[0].toUpperCase()] || parts[0];
              year = parseInt(parts[1], 10);
            }
          }

          // Calculate total energy consumption
          let energyValue = 1;
          if (extractedData.historico_consumo && extractedData.historico_consumo.length > 0) {
            const recentConsumption = extractedData.historico_consumo[0];
            energyValue = (recentConsumption.consumo_ponta_kwh || 0) + (recentConsumption.consumo_fora_ponta_kwh || 0);
          }

          // Prepare update payload for lead
          const updatePayload = {
            consumer_unit: extractedData.codigo_instalacao || 'A DETERMINAR',
            name: extractedData.nome_cliente || 'A DETERMINAR',
            phone: '+55 (00) 00000-0000',
            email: extractedData.email || 'contato@determinar.com.br',
            cnpj: extractedData.documento_cliente || '00.000.000/0000-00',
            month: month,
            year: year,
            energy_value: energyValue,
            invoice_amount: extractedData.valor_fatura || 1,
            status: 'qualifiedtobuy',
            address: extractedData.address || '',
            city: extractedData.city || '',
            state: extractedData.state || '',
            zip_code: extractedData.zip_code || '',
          };

          console.log('Updating lead with payload:', updatePayload);

          // Make PUT request to update lead (without /external)
          const updateResponse = await apiRequestWithAuth(`/leads/${lead.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatePayload),
          });

          if (updateResponse.ok) {
            console.log('Lead updated successfully:', lead.id);
            
            // Now update the lead_invoice with extracted data
            if (lead.lead_invoices && lead.lead_invoices.length > 0) {
              const invoice = lead.lead_invoices[0]; // Get the first invoice
              
              // Generate normalized filename: {codigo_instalacao}_{periodo_fatura}.pdf
              const normalizedFilename = `${extractedData.codigo_instalacao || 'unknown'}_${extractedData.periodo_fatura?.replace('/', '-') || 'unknown'}.pdf`;
              
              const invoiceUpdatePayload = {
                idp_id: lead.idp_id,
                invoice_amount: extractedData.valor_fatura?.toString() || invoice.invoice_amount,
                simulation: true,  // Mark simulation as completed since OCR generated Excel
                proposal: true,    // Mark proposal as available
                filename_normalized: normalizedFilename,  // e.g., "701827947_AGO-2025.pdf"
                extracted_data: {
                  nome_cliente: extractedData.nome_cliente,
                  codigo_instalacao: extractedData.codigo_instalacao,
                  documento_cliente: extractedData.documento_cliente,
                  periodo_fatura: extractedData.periodo_fatura,
                  valor_fatura: extractedData.valor_fatura,
                  distribuidora: extractedData.distribuidora,
                  modalidade_tarifaria: extractedData.modalidade_tarifaria,
                  subgrupo: extractedData.subgrupo,
                  address: extractedData.address,
                  city: extractedData.city,
                  state: extractedData.state,
                  zip_code: extractedData.zip_code,
                  data_vencimento: extractedData.data_vencimento,
                  demanda_contratada_fora_ponta: extractedData.demanda_contratada_fora_ponta,
                  demanda_contratada_ponta: extractedData.demanda_contratada_ponta,
                  historico_consumo: extractedData.historico_consumo,
                  historico_demanda: extractedData.historico_demanda,
                  tributos: extractedData.tributos,
                  bandeira_tarifaria: extractedData.bandeira_tarifaria,
                  excel_s3_url: ocrStatus.excel_s3_url,
                }
              };

              console.log('Updating lead invoice:', invoice.id, 'with payload:', invoiceUpdatePayload);

              try {
                const invoiceUpdateResponse = await apiRequestWithAuth(`/leads/invoices/${invoice.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(invoiceUpdatePayload),
                });

                if (invoiceUpdateResponse.ok) {
                  console.log('Lead invoice updated successfully:', invoice.id);
                } else {
                  console.error('Failed to update lead invoice:', invoice.id);
                }
              } catch (invoiceError) {
                console.error('Error updating lead invoice:', invoiceError);
                // Don't fail the whole operation if invoice update fails
              }
            }
            
            updatedCount++;
          }
        }
      } catch (error) {
        console.error(`Error processing OCR for lead ${lead.id}:`, error);
      }
    }
    
    return { success: true, updatedCount, totalPending: pendingLeads.length };
  } catch (error) {
    console.error('Error checking pending OCR jobs:', error);
    return { success: false, error, updatedCount: 0, totalPending: 0 };
  }
};

interface FormData {
  email: string;
  observations: string;
  // Gerador questions
  hasGenerator: 'S' | 'N' | '';
  generatorMonthlyCost: string;
  generatorMonthlyGeneration: string;
  // Geração Solar questions
  hasSolarGeneration: 'S' | 'N' | '';
  isSolarGenerationSameUnit: 'S' | 'N' | '';
  // B Optante questions
  isBOptante: 'S' | 'N' | '';
  hasGroupAInfrastructure: 'S' | 'N' | '';
  companyActivityArea: string;
  // Mercado Livre questions
  isInFreeMarket: 'S' | 'N' | '';
  contractEndDate: string;
}

export default function ModalUploadInvoice({ isOpen, onClose, onSuccess, onRefreshRequest }: ModalUploadInvoiceProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    observations: '',
    hasGenerator: '',
    generatorMonthlyCost: '',
    generatorMonthlyGeneration: '',
    hasSolarGeneration: '',
    isSolarGenerationSameUnit: '',
    isBOptante: '',
    hasGroupAInfrastructure: '',
    companyActivityArea: '',
    isInFreeMarket: '',
    contractEndDate: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail deve ter um formato válido';
    }
    
    // Validate required Yes/No questions
    if (!formData.hasGenerator) {
      newErrors.hasGenerator = 'Esta pergunta é obrigatória';
    }
    if (!formData.hasSolarGeneration) {
      newErrors.hasSolarGeneration = 'Esta pergunta é obrigatória';
    }
    if (!formData.isBOptante) {
      newErrors.isBOptante = 'Esta pergunta é obrigatória';
    }
    if (!formData.isInFreeMarket) {
      newErrors.isInFreeMarket = 'Esta pergunta é obrigatória';
    }

    // Validate conditional fields
    if (formData.hasGenerator === 'S') {
      if (!formData.generatorMonthlyCost.trim()) {
        newErrors.generatorMonthlyCost = 'Gasto por mês é obrigatório quando utiliza gerador';
      } else if (isNaN(parseFloat(formData.generatorMonthlyCost)) || parseFloat(formData.generatorMonthlyCost) <= 0) {
        newErrors.generatorMonthlyCost = 'Gasto por mês deve ser um número positivo';
      }
      if (!formData.generatorMonthlyGeneration.trim()) {
        newErrors.generatorMonthlyGeneration = 'Geração mensal (kWh) é obrigatória quando utiliza gerador';
      } else if (isNaN(parseFloat(formData.generatorMonthlyGeneration)) || parseFloat(formData.generatorMonthlyGeneration) <= 0) {
        newErrors.generatorMonthlyGeneration = 'Geração mensal deve ser um número positivo';
      }
    }

    if (formData.hasSolarGeneration === 'S' && !formData.isSolarGenerationSameUnit) {
      newErrors.isSolarGenerationSameUnit = 'Esta pergunta é obrigatória quando tem geração solar';
    }

    if (formData.isBOptante === 'S') {
      if (formData.hasGroupAInfrastructure === '') {
        newErrors.hasGroupAInfrastructure = 'Esta pergunta é obrigatória quando é B Optante';
      }
      if (!formData.companyActivityArea.trim()) {
        newErrors.companyActivityArea = 'Área de atuação é obrigatória quando é B Optante';
      }
    }

    if (formData.isInFreeMarket === 'S' && !formData.contractEndDate.trim()) {
      newErrors.contractEndDate = 'Data de término do contrato é obrigatória quando já está no Mercado Livre';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileSelect = (file: File) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use PDF, JPG ou PNG.');
      return;
    }

    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Tamanho máximo: 10MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Function to check OCR status for a document
  const checkOcrStatus = async (idpId: string) => {
    try {
      const response = await fetch(`https://d7eqdg7oj5.execute-api.us-east-2.amazonaws.com/dev/document/${idpId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to check OCR status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking OCR status:', error);
      return null;
    }
  };

  // Helper function to convert month abbreviation to full name in Portuguese
  const convertMonthToPortuguese = (monthAbbr: string): string => {
    const monthMap: Record<string, string> = {
      'JAN': 'Janeiro',
      'FEV': 'Fevereiro',
      'MAR': 'Março',
      'ABR': 'Abril',
      'MAI': 'Maio',
      'JUN': 'Junho',
      'JUL': 'Julho',
      'AGO': 'Agosto',
      'SET': 'Setembro',
      'OUT': 'Outubro',
      'NOV': 'Novembro',
      'DEZ': 'Dezembro',
    };
    return monthMap[monthAbbr.toUpperCase()] || monthAbbr;
  };

  // Function to update lead with OCR extracted data
  const updateLeadWithOcrData = async (leadId: string, ocrData: any) => {
    try {
      const extractedData = ocrData.extracted_data;
      
      // Parse month and year from periodo_fatura (e.g., "AGO/2025")
      let month = 'A DETERMINAR';
      let year = new Date().getFullYear();
      
      if (extractedData.periodo_fatura) {
        const parts = extractedData.periodo_fatura.split('/');
        if (parts.length === 2) {
          month = convertMonthToPortuguese(parts[0]);
          year = parseInt(parts[1], 10);
        }
      }

      // Calculate total energy consumption from history (most recent month)
      let energyValue = 1;
      if (extractedData.historico_consumo && extractedData.historico_consumo.length > 0) {
        const recentConsumption = extractedData.historico_consumo[0];
        energyValue = (recentConsumption.consumo_ponta_kwh || 0) + (recentConsumption.consumo_fora_ponta_kwh || 0);
      }

      // Prepare update payload
      const updatePayload = {
        consumer_unit: extractedData.codigo_instalacao || 'A DETERMINAR',
        name: extractedData.nome_cliente || 'A DETERMINAR',
        phone: '+55 (00) 00000-0000', // Phone not available in OCR, keep placeholder
        email: extractedData.email || 'contato@determinar.com.br', // Use existing or placeholder
        cnpj: extractedData.documento_cliente || '00.000.000/0000-00',
        month: month,
        year: year,
        energy_value: energyValue,
        invoice_amount: extractedData.valor_fatura || 1,
        status: 'qualifiedtobuy',
        address: extractedData.address || '',
        city: extractedData.city || '',
        state: extractedData.state || '',
        zip_code: extractedData.zip_code || '',
      };

      console.log('Updating lead with OCR data:', { leadId, updatePayload });

      // Make PUT request to update lead
      const response = await apiRequestWithAuth(`/leads/${leadId}/external`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        throw new Error(`Failed to update lead: ${response.status}`);
      }

      const result = await response.json();
      console.log('Lead updated successfully:', result);
      return result;
    } catch (error) {
      console.error('Error updating lead with OCR data:', error);
      throw error;
    }
  };

  // Function to check and update leads with completed OCR processing
  const checkPendingOcrJobs = async () => {
    const result = await checkAndUpdatePendingOcrJobs();
    
    if (result.success && result.updatedCount > 0) {
      toast.success(`${result.updatedCount} lead(s) atualizado(s) com dados do OCR!`);
      // Trigger refresh callback if provided
      onRefreshRequest?.();
    } else if (result.success && result.totalPending > 0) {
      console.log(`${result.totalPending} lead(s) ainda em processamento OCR`);
    }
  };

  // Check for completed OCR jobs when modal opens
  useEffect(() => {
    if (isOpen) {
      checkPendingOcrJobs();
    }
  }, [isOpen]);

  // Helper function to convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Function to send file to IDP API for processing
  const sendToIdpApi = async (file: File, documentId: string) => {
    try {
      // Convert file to base64
      const base64File = await convertFileToBase64(file);

      // Prepare request payload - matching the working curl example format
      const payload = {
        base64_file: `data:${file.type};base64,${base64File}`,
        filename: file.name,
        document_id: documentId,
      };

      console.log('IDP Payload:', {
        filename: payload.filename,
        document_id: payload.document_id,
        base64_length: base64File.length,
        file_type: file.type
      });

      // Make API call to IDP
      const response = await fetch('https://api.ynovamarketplace.com/api/idp/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Try to get error details from response body
        let errorMessage = `Erro no IDP: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error('IDP API Error Response:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, try to get text
          const errorText = await response.text();
          console.error('IDP API Error Text:', errorText);
          if (errorText) errorMessage = errorText;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erro no processamento do documento');
      }

      console.log('IDP processing started successfully:', result);
      return result;
    } catch (error) {
      console.error('IDP processing error:', error);
      // Don't throw - we don't want to fail the entire upload if IDP fails
      toast.error('Aviso: O processamento OCR pode ter falhado, mas a fatura foi salva.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Por favor, selecione um arquivo');
      return;
    }

    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setIsUploading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', selectedFile);
      
      // Send placeholder values for fields that will be populated by OCR
      formDataToSend.append('consumer_unit', 'A DETERMINAR');
      formDataToSend.append('name', 'A DETERMINAR'); // Client name placeholder
      formDataToSend.append('cnpj', '00.000.000/0000-00'); // Valid CNPJ format placeholder
      formDataToSend.append('phone', '+55 (00) 00000-0000'); // Valid phone format placeholder
      formDataToSend.append('email', formData.email);
      formDataToSend.append('month', 'A DETERMINAR');
      formDataToSend.append('year', new Date().getFullYear().toString());
      formDataToSend.append('energy_value', '1');
      formDataToSend.append('invoice_amount', '1');
      
      // Add conditional fields to observations or as separate fields
      let observationsText = formData.observations;
      
      // Build additional info text
      const additionalInfo: string[] = [];
      
      if (formData.hasGenerator) {
        additionalInfo.push(`Utiliza Gerador: ${formData.hasGenerator}`);
        if (formData.hasGenerator === 'S') {
          additionalInfo.push(`Gasto mensal gerador: R$ ${formData.generatorMonthlyCost}`);
          additionalInfo.push(`Geração mensal gerador: ${formData.generatorMonthlyGeneration} kWh`);
        }
      }
      
      if (formData.hasSolarGeneration) {
        additionalInfo.push(`Tem Geração Solar: ${formData.hasSolarGeneration}`);
        if (formData.hasSolarGeneration === 'S' && formData.isSolarGenerationSameUnit) {
          additionalInfo.push(`Geração na mesma unidade: ${formData.isSolarGenerationSameUnit}`);
        }
      }
      
      if (formData.isBOptante) {
        additionalInfo.push(`É B Optante: ${formData.isBOptante}`);
        if (formData.isBOptante === 'S') {
          if (formData.hasGroupAInfrastructure) {
            additionalInfo.push(`Tem infraestrutura Grupo A: ${formData.hasGroupAInfrastructure}`);
          }
          if (formData.companyActivityArea) {
            additionalInfo.push(`Área de atuação: ${formData.companyActivityArea}`);
          }
        }
      }
      
      if (formData.isInFreeMarket) {
        additionalInfo.push(`Já está no Mercado Livre: ${formData.isInFreeMarket}`);
        if (formData.isInFreeMarket === 'S' && formData.contractEndDate) {
          additionalInfo.push(`Término do contrato: ${formData.contractEndDate}`);
        }
      }
      
      if (additionalInfo.length > 0) {
        observationsText = observationsText 
          ? `${observationsText}\n\nInformações Adicionais:\n${additionalInfo.join('\n')}`
          : `Informações Adicionais:\n${additionalInfo.join('\n')}`;
      }
      
      formDataToSend.append('observations', observationsText);
      formDataToSend.append('status', 'qualifiedtobuy'); // Set default status to Qualificado pipeline

      const response = await apiRequestWithAuth('/leads', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar fatura');
      }

      const result = await response.json();
      
      // Generate a UUID for the document_id (IDP processing)
      const documentId = crypto.randomUUID();
      
      console.log('Lead created:', result.data);
      console.log('Generated Document UUID for IDP:', documentId);
      
      // Update the lead with the idp_id for OCR processing using PUT
      try {
        const updateResponse = await apiRequestWithAuth(`/leads/${result.data.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idp_id: documentId
          }),
        });
        
        console.log('Lead updated with idp_id:', documentId);
        
        // Send the file to IDP API for OCR processing
        console.log('Sending file to IDP API...');
        const idpResult = await sendToIdpApi(selectedFile, documentId);
        console.log('IDP API response:', idpResult);
        
        toast.success('Fatura enviada com sucesso! O processamento OCR foi iniciado.');
      } catch (updateError) {
        console.error('Error updating lead with idp_id or calling IDP:', updateError);
        // Still show success for the upload, but warn about OCR
        toast.success('Fatura enviada com sucesso!');
        toast.error('Aviso: Falha ao iniciar o processamento OCR.');
      }
      
      onSuccess?.(result.data);
      handleClose();
    } catch (error) {
      console.error('Error uploading invoice:', error);
      toast.error('Erro ao enviar fatura. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setFormData({
      email: '',
      observations: '',
      hasGenerator: '',
      generatorMonthlyCost: '',
      generatorMonthlyGeneration: '',
      hasSolarGeneration: '',
      isSolarGenerationSameUnit: '',
      isBOptante: '',
      hasGroupAInfrastructure: '',
      companyActivityArea: '',
      isInFreeMarket: '',
      contractEndDate: '',
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-[#3E3E3E] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Enviar Fatura</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Arquivo da Fatura *
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragging
                    ? 'border-[#FE5200] bg-[#FE5200]/10 dark:bg-[#FE5200]/20'
                    : 'border-gray-300 dark:border-[#1E1E1E]'
                }`}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center space-x-3">
                    <FileText className="text-[#FE5200]" size={24} />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto text-gray-400 dark:text-gray-300 mb-2" size={32} />
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      Arraste e solte o arquivo PDF aqui
                    </p>
                    <input
                      id="invoice-upload"
                      type="file"
                      accept="application/pdf,image/png,image/jpeg,image/jpg"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                    <label
                      htmlFor="invoice-upload"
                      className="inline-block px-4 py-2 bg-[#FE5200] hover:bg-[#FE5200]/90 text-white rounded-lg cursor-pointer text-sm"
                    >
                      Selecionar arquivo
                    </label>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Formatos aceitos: PDF, PNG, JPG. Tamanho máximo: 10MB
              </p>
            </div>

            {/* Form Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                E-mail *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900 ${
                  errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-300'
                }`}
                placeholder="cliente@empresa.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Conditional Questions Section */}
            <div className="space-y-6 pt-4 border-t border-gray-200 dark:border-[#1E1E1E]">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Informações Adicionais</h3>
              
              {/* Gerador Question */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  O cliente utiliza Gerador? *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hasGenerator"
                      value="S"
                      checked={formData.hasGenerator === 'S'}
                      onChange={(e) => handleInputChange('hasGenerator', e.target.value)}
                      className="text-[#FE5200] focus:ring-[#FE5200]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Sim</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hasGenerator"
                      value="N"
                      checked={formData.hasGenerator === 'N'}
                      onChange={(e) => handleInputChange('hasGenerator', e.target.value)}
                      className="text-[#FE5200] focus:ring-[#FE5200]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Não</span>
                  </label>
                </div>
                {errors.hasGenerator && (
                  <p className="text-red-500 text-xs flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.hasGenerator}
                  </p>
                )}
                {formData.hasGenerator === 'S' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Qual o gasto por mês em R$? *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.generatorMonthlyCost}
                        onChange={(e) => handleInputChange('generatorMonthlyCost', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900 ${
                          errors.generatorMonthlyCost ? 'border-red-500' : 'border-gray-300 dark:border-gray-300'
                        }`}
                        placeholder="0.00"
                        min="0"
                      />
                      {errors.generatorMonthlyCost && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle size={12} className="mr-1" />
                          {errors.generatorMonthlyCost}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Quanto gera por mês (kWh)? *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.generatorMonthlyGeneration}
                        onChange={(e) => handleInputChange('generatorMonthlyGeneration', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900 ${
                          errors.generatorMonthlyGeneration ? 'border-red-500' : 'border-gray-300 dark:border-gray-300'
                        }`}
                        placeholder="0.00"
                        min="0"
                      />
                      {errors.generatorMonthlyGeneration && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle size={12} className="mr-1" />
                          {errors.generatorMonthlyGeneration}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Geração Solar Question */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  O cliente tem Geração Solar? *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hasSolarGeneration"
                      value="S"
                      checked={formData.hasSolarGeneration === 'S'}
                      onChange={(e) => handleInputChange('hasSolarGeneration', e.target.value)}
                      className="text-[#FE5200] focus:ring-[#FE5200]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Sim</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hasSolarGeneration"
                      value="N"
                      checked={formData.hasSolarGeneration === 'N'}
                      onChange={(e) => handleInputChange('hasSolarGeneration', e.target.value)}
                      className="text-[#FE5200] focus:ring-[#FE5200]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Não</span>
                  </label>
                </div>
                {errors.hasSolarGeneration && (
                  <p className="text-red-500 text-xs flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.hasSolarGeneration}
                  </p>
                )}
                {formData.hasSolarGeneration === 'S' && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      A geração é nesta mesma unidade? *
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="isSolarGenerationSameUnit"
                          value="S"
                          checked={formData.isSolarGenerationSameUnit === 'S'}
                          onChange={(e) => handleInputChange('isSolarGenerationSameUnit', e.target.value)}
                          className="text-[#FE5200] focus:ring-[#FE5200]"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Sim</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="isSolarGenerationSameUnit"
                          value="N"
                          checked={formData.isSolarGenerationSameUnit === 'N'}
                          onChange={(e) => handleInputChange('isSolarGenerationSameUnit', e.target.value)}
                          className="text-[#FE5200] focus:ring-[#FE5200]"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Não</span>
                      </label>
                    </div>
                    {errors.isSolarGenerationSameUnit && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <AlertCircle size={12} className="mr-1" />
                        {errors.isSolarGenerationSameUnit}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* B Optante Question */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  O cliente é B Optante? *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isBOptante"
                      value="S"
                      checked={formData.isBOptante === 'S'}
                      onChange={(e) => handleInputChange('isBOptante', e.target.value)}
                      className="text-[#FE5200] focus:ring-[#FE5200]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Sim</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isBOptante"
                      value="N"
                      checked={formData.isBOptante === 'N'}
                      onChange={(e) => handleInputChange('isBOptante', e.target.value)}
                      className="text-[#FE5200] focus:ring-[#FE5200]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Não</span>
                  </label>
                </div>
                {errors.isBOptante && (
                  <p className="text-red-500 text-xs flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.isBOptante}
                  </p>
                )}
                {formData.isBOptante === 'S' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tem infraestrutura de grupo A (transformador próprio)? *
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="hasGroupAInfrastructure"
                            value="S"
                            checked={formData.hasGroupAInfrastructure === 'S'}
                            onChange={(e) => handleInputChange('hasGroupAInfrastructure', e.target.value)}
                            className="text-[#FE5200] focus:ring-[#FE5200]"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Sim</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="hasGroupAInfrastructure"
                            value="N"
                            checked={formData.hasGroupAInfrastructure === 'N'}
                            onChange={(e) => handleInputChange('hasGroupAInfrastructure', e.target.value)}
                            className="text-[#FE5200] focus:ring-[#FE5200]"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Não</span>
                        </label>
                      </div>
                      {errors.hasGroupAInfrastructure && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle size={12} className="mr-1" />
                          {errors.hasGroupAInfrastructure}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Qual a área de atuação da empresa? *
                      </label>
                      <input
                        type="text"
                        value={formData.companyActivityArea}
                        onChange={(e) => handleInputChange('companyActivityArea', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900 ${
                          errors.companyActivityArea ? 'border-red-500' : 'border-gray-300 dark:border-gray-300'
                        }`}
                        placeholder="Ex: Indústria, Comércio, Serviços..."
                      />
                      {errors.companyActivityArea && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle size={12} className="mr-1" />
                          {errors.companyActivityArea}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mercado Livre Question */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  O cliente já está no Mercado Livre? *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isInFreeMarket"
                      value="S"
                      checked={formData.isInFreeMarket === 'S'}
                      onChange={(e) => handleInputChange('isInFreeMarket', e.target.value)}
                      className="text-[#FE5200] focus:ring-[#FE5200]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Sim</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isInFreeMarket"
                      value="N"
                      checked={formData.isInFreeMarket === 'N'}
                      onChange={(e) => handleInputChange('isInFreeMarket', e.target.value)}
                      className="text-[#FE5200] focus:ring-[#FE5200]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Não</span>
                  </label>
                </div>
                {errors.isInFreeMarket && (
                  <p className="text-red-500 text-xs flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.isInFreeMarket}
                  </p>
                )}
                {formData.isInFreeMarket === 'S' && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quando acaba o contrato? *
                    </label>
                    <input
                      type="date"
                      value={formData.contractEndDate}
                      onChange={(e) => handleInputChange('contractEndDate', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900 ${
                        errors.contractEndDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-300'
                      }`}
                    />
                    {errors.contractEndDate && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <AlertCircle size={12} className="mr-1" />
                        {errors.contractEndDate}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Observações
              </label>
              <textarea
                value={formData.observations}
                onChange={(e) => handleInputChange('observations', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FE5200] focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900"
                placeholder="Observações adicionais sobre a fatura..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-[#1E1E1E]">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-[#3E3E3E] border border-gray-300 dark:border-[#1E1E1E] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1E1E1E] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isUploading || !selectedFile}
                className="px-4 py-2 bg-[#FE5200] hover:bg-[#FE5200]/90 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>Enviar Fatura</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

