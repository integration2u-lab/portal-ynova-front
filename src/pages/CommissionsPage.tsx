import React from 'react';
import { DollarSign, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import { mockComissoes, mockLeads } from '../data/mockData';

export default function CommissionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Comissões & Performance</h1>
        <div className="flex items-center space-x-2">
          <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option>Janeiro 2025</option>
            <option>Dezembro 2024</option>
            <option>Novembro 2024</option>
          </select>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Exportar CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KpiCard title="Comissão Gerada" value="R$ 45.000" icon={DollarSign} color="green" />
        <KpiCard title="Comissão Paga" value="R$ 35.000" icon={CheckCircle} color="blue" />
        <KpiCard title="Comissão Pendente" value="R$ 10.000" icon={Clock} color="orange" />
        <KpiCard title="Taxa de Sucesso" value="72%" icon={TrendingUp} color="purple" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Histórico de Deals</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Contrato</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comissão</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockComissoes.map((c) => (
                <tr key={c.dealId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{mockLeads.find((l) => l.id === c.leadId)?.nome}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R$ {c.valorContrato.toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R$ {c.comissao.toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      c.statusPagamento === 'pago'
                        ? 'bg-green-100 text-green-800'
                        : c.statusPagamento === 'pendente'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {c.statusPagamento === 'pago'
                        ? 'Pago'
                        : c.statusPagamento === 'pendente'
                        ? 'Pendente'
                        : 'Processando'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(c.data).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
