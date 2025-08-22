import React from 'react';
import { Download, Eye } from 'lucide-react';
import { mockPropostas, mockLeads } from '../data/mockData';

export default function ProposalsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Propostas</h1>
      <div className="bg-white dark:bg-[#1a1f24] rounded-lg shadow-sm border border-gray-200 dark:border-[#2b3238] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-[#2b3238]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Lista de Propostas</h3>
            <div className="flex items-center space-x-2">
              <select className="px-3 py-2 border border-gray-300 dark:border-[#2b3238] rounded-lg text-sm bg-white dark:bg-[#20262c] text-gray-900 dark:text-gray-100">
                <option>Todas</option>
                <option>Em negociação</option>
                <option>Aceitas</option>
                <option>Rejeitadas</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-[#2b3238]">
            <thead className="bg-gray-50 dark:bg-[#1a1f24]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#2b3238]">
              {mockPropostas.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-[#1f252b]">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">{mockLeads.find((l) => l.id === p.leadId)?.nome}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{new Date(p.data).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                      p.status === 'aceita'
                        ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800'
                        : p.status === 'rejeitada'
                        ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100 dark:border-red-800'
                        : 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100 dark:border-yellow-800'
                    }`}>
                      {p.status === 'aceita' ? 'Aceita' : p.status === 'rejeitada' ? 'Rejeitada' : 'Em negociação'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">R$ {p.valorSimulado.toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 inline-flex items-center gap-1">
                      <Download size={14} />
                      PPT
                    </button>
                    <button className="text-[#FE5200] dark:text-orange-400 hover:text-[#FE5200]/80 dark:hover:text-orange-300 inline-flex items-center gap-1">
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
  );
}
