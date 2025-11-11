import { useState } from 'react'
import { X, Loader2, FileSignature } from 'lucide-react'
import type { Lead, InvoiceExtractedData } from '../types'
import { sendDocuSignEnvelope, updateLead } from '../utils/api'
import { toast } from 'sonner'

interface ContractSignatureModalProps {
  isOpen: boolean
  onClose: () => void
  lead: Lead
  extractedData?: InvoiceExtractedData
  onSuccess: () => void
}

export default function ContractSignatureModal({
  isOpen,
  onClose,
  lead,
  extractedData,
  onSuccess,
}: ContractSignatureModalProps) {
  const [contractTerm, setContractTerm] = useState('5')
  const [representativeEmail, setRepresentativeEmail] = useState('')
  const [representativeName, setRepresentativeName] = useState('')
  const [representativeCPF, setRepresentativeCPF] = useState('')
  const [managementFee, setManagementFee] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!contractTerm || !representativeEmail || !representativeName || !representativeCPF || !managementFee) {
      toast.error('Por favor, preencha todos os campos obrigatórios')
      return
    }

    setIsSubmitting(true)

    try {
      // Get current date in DD/MM/YYYY format
      const currentDate = new Date()
      const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`

      // Get current month and year in Portuguese
      const monthNames = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
      ]
      const currentMonthYear = `${monthNames[currentDate.getMonth()]} de ${currentDate.getFullYear()}`

      // Build the payload
      const payload = {
        envelopeDefinition: {
          templateId: '1bd637e9-bad2-42e9-bf8e-6642ae730bca',
          status: 'created',
          emailSubject: 'Contrato de Gestão de Energia - Ynova - Assinatura Necessária',
          emailBlurb: 'Por favor, revise e assine o contrato de gestão de energia.',
          templateRoles: [
            {
              roleName: 'Cliente - Email',
              name: representativeName,
              email: representativeEmail,
            },
            {
              roleName: 'Sócio Ynova 1',
              name: 'Gabriel Bueno Lahóz Moya',
              email: 'gabriel.moya@ynovamarketplace.com.br',
            },
            {
              roleName: 'Sócio Ynova 2',
              name: 'Guilherme Bueno Lahoz Moya',
              email: 'guilherme.moya@ynovamarketplace.com.br',
            },
            {
              roleName: 'Testemunha 1',
              name: 'João da Silva',
              email: 'joao@example.com',
            },
            {
              roleName: 'Testemunha 2',
              name: 'Maria Santos',
              email: 'maria@example.com',
            },
          ],
        },
        docGenFormFields: [
          {
            documentId: '1acf54e0-aa15-4fd4-b555-dc497cf5e9c4',
            docGenFormFieldList: [
              {
                name: 'Nome_da_Empresa',
                value: extractedData?.nome_cliente || lead.name,
              },
              {
                name: 'CNPJ_do_Cliente',
                value: extractedData?.documento_cliente || lead.cnpj,
              },
              {
                name: 'Endereço_do_Cliente',
                value: extractedData?.address || lead.address || '',
              },
              {
                name: 'Cidade_do_Cliente',
                value: extractedData?.city || lead.city || '',
              },
              {
                name: 'Estado_do_Cliente',
                value: extractedData?.state || lead.state || '',
              },
              {
                name: 'CEP_do_Cliente',
                value: extractedData?.zip_code || lead.zip_code || '',
              },
              {
                name: 'Data_atual_DDMMAAAA',
                value: formattedDate,
              },
              {
                name: 'Nome_do_Cliente_Responsavel_legal',
                value: representativeName,
              },
              {
                name: 'CPF_do_Cliente_Responsavel_Legal',
                value: representativeCPF,
              },
              {
                name: 'Prazo_do_Contrato_em_anos',
                value: contractTerm,
              },
              {
                name: 'Unidade_Consumidora_codigo_distribuidora',
                value: extractedData?.codigo_instalacao || lead.consumer_unit,
              },
              {
                name: 'CNPJ_da_Unidade_Consumidora',
                value: extractedData?.documento_cliente || lead.cnpj,
              },
              {
                name: 'Endereço_da_Unidade_Consumidora',
                value: extractedData?.address || lead.address || '',
              },
              {
                name: 'Fee_de_Gestao_Mensal',
                value: managementFee,
              },
              {
                name: 'mes_e_ano_atual',
                value: currentMonthYear,
              },
            ],
          },
        ],
      }

      // Make API call to send DocuSign envelope
      const result = await sendDocuSignEnvelope(payload)
      console.log('DocuSign envelope sent:', result)

      toast.success('Contrato enviado para assinatura com sucesso!')

      // Update lead status to "Em assinatura"
      try {
        await updateLead(lead.id, { status: 'contractsent' })
        toast.success('Lead movido para etapa "Em assinatura"')
      } catch (updateError) {
        console.error('Error updating lead status:', updateError)
        toast.warning('Contrato enviado, mas não foi possível atualizar o status do lead')
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error sending contract:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar contrato')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <FileSignature className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Enviar Contrato para Assinatura</h2>
              <p className="text-sm text-gray-600">{lead.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 transition-colors hover:text-gray-600 disabled:cursor-not-allowed"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Contract Information Section */}
            <div className="rounded-lg bg-blue-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-blue-900">Informações do Contrato</h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="contractTerm" className="block text-sm font-medium text-gray-700">
                    Prazo do Contrato (anos) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="contractTerm"
                    type="number"
                    min="1"
                    max="20"
                    value={contractTerm}
                    onChange={(e) => setContractTerm(e.target.value)}
                    disabled={isSubmitting}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="managementFee" className="block text-sm font-medium text-gray-700">
                    Fee de Gestão Mensal <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="managementFee"
                    type="text"
                    placeholder="Ex: R$ 1.500,00"
                    value={managementFee}
                    onChange={(e) => setManagementFee(e.target.value)}
                    disabled={isSubmitting}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Digite o valor com formatação (ex: R$ 1.500,00)</p>
                </div>
              </div>
            </div>

            {/* Representative Information Section */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Dados do Representante Legal</h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="representativeName" className="block text-sm font-medium text-gray-700">
                    Nome Completo do Representante <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="representativeName"
                    type="text"
                    value={representativeName}
                    onChange={(e) => setRepresentativeName(e.target.value)}
                    disabled={isSubmitting}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100"
                    placeholder="Nome completo"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="representativeCPF" className="block text-sm font-medium text-gray-700">
                    CPF do Representante <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="representativeCPF"
                    type="text"
                    value={representativeCPF}
                    onChange={(e) => setRepresentativeCPF(e.target.value)}
                    disabled={isSubmitting}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100"
                    placeholder="000.000.000-00"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="representativeEmail" className="block text-sm font-medium text-gray-700">
                    E-mail do Representante <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="representativeEmail"
                    type="email"
                    value={representativeEmail}
                    onChange={(e) => setRepresentativeEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100"
                    placeholder="email@exemplo.com.br"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    O contrato será enviado para este e-mail para assinatura
                  </p>
                </div>
              </div>
            </div>

            {/* Lead Information Preview */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Informações da Empresa</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Empresa:</span>
                  <span className="font-medium text-gray-900">{extractedData?.nome_cliente || lead.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">CNPJ:</span>
                  <span className="font-medium text-gray-900">{extractedData?.documento_cliente || lead.cnpj}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Unidade Consumidora:</span>
                  <span className="font-medium text-gray-900">{extractedData?.codigo_instalacao || lead.consumer_unit}</span>
                </div>
                {(extractedData?.distribuidora) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Distribuidora:</span>
                    <span className="font-medium text-gray-900">{extractedData.distribuidora}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </div>
              ) : (
                'Enviar para Assinatura'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

