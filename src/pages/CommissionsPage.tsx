import React from 'react';
import { DollarSign, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import { mockComissoes, mockLeads } from '../data/mockData';

export default function CommissionsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Comissões & Performance</h1>
      <header className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 min-w-0 w-full">
          <select className="w-full px-3 py-2 border border-gray-300 dark:border-[#2b3238] rounded-lg text-sm bg-white dark:bg-[#20262c] text-gray-900 dark:text-gray-100">
            <option>Janeiro 2025</option>
            <option>Dezembro 2024</option>
            <option>Novembro 2024</option>
          </select>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Exportar CSV</button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Comissão Gerada" value="R$ 45.000" icon={DollarSign} color="green" />
        <KpiCard title="Comissão Paga" value="R$ 35.000" icon={CheckCircle} color="blue" />
        <KpiCard title="Comissão Pendente" value="R$ 10.000" icon={Clock} color="orange" />
        <KpiCard title="Taxa de Sucesso" value="72%" icon={TrendingUp} color="purple" />
      </div>

      <div className="bg-white dark:bg-[#1a1f24] rounded-lg shadow-sm border border-gray-200 dark:border-[#2b3238]">
        <h3 className="p-6 text-lg font-semibold text-gray-900 dark:text-gray-100">Histórico de Deals</h3>
        <div className="space-y-3 sm:hidden p-4">
          {mockComissoes.map((c) => {
            const lead = mockLeads.find((l) => l.id === c.leadId);
            return (
              <article key={c.dealId} className="rounded-lg border p-4 bg-white dark:bg-[#1a1f24]">
                <div className="font-semibold truncate">{lead?.nome}</div>
                <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-gray-500">Valor Contrato</dt>
                    <dd className="text-right">R$ {c.valorContrato.toLocaleString('pt-BR')}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Comissão</dt>
                    <dd className="text-right">R$ {c.comissao.toLocaleString('pt-BR')}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Status</dt>
                    <dd>
                      {c.statusPagamento === 'pago'
                        ? 'Pago'
                        : c.statusPagamento === 'pendente'
                        ? 'Pendente'
                        : 'Processando'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Data</dt>
                    <dd>{new Date(c.data).toLocaleDateString('pt-BR')}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
        <div className="hidden sm:block">
          <div className="overflow-x-auto">
            <table className="w-full table-auto min-w-[720px] divide-y divide-gray-200 dark:divide-[#2b3238]">
              <thead className="bg-gray-50 dark:bg-[#1a1f24]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase text-right">Valor Contrato</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase text-right">Comissão</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#2b3238]">
                {mockComissoes.map((c) => {
                  const lead = mockLeads.find((l) => l.id === c.leadId);
                  return (
                    <tr key={c.dealId} className="hover:bg-gray-50 dark:hover:bg-[#1f252b]">
                      <td className="px-6 py-4 whitespace-normal break-words truncate text-sm font-medium text-gray-900 dark:text-gray-200">
                        {lead?.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-200">
                        R$ {c.valorContrato.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-200">
                        R$ {c.comissao.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${
                            c.statusPagamento === 'pago'
                              ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800'
                              : c.statusPagamento === 'pendente'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100 dark:border-yellow-800'
                              : 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-800'
                          }`}
                        >
                          {c.statusPagamento === 'pago'
                            ? 'Pago'
                            : c.statusPagamento === 'pendente'
                            ? 'Pendente'
                            : 'Processando'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {new Date(c.data).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
