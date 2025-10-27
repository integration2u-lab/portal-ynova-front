import React, { useState, useEffect } from 'react';
import { DollarSign, Users, Award, Gift, Share2, CheckCircle, Lock, TrendingUp, GitBranch, User } from 'lucide-react';

const COMMISSION_TABLE = [
  { minValue: 2000, maxValue: 5000, commission: 300 },
  { minValue: 5001, maxValue: 10000, commission: 700 },
  { minValue: 10001, maxValue: 15000, commission: 1200 },
  { minValue: 15001, maxValue: 20000, commission: 1800 },
  { minValue: 20001, maxValue: 30000, commission: 2700 },
  { minValue: 30001, maxValue: 50000, commission: 4500 },
  { minValue: 50001, maxValue: 75000, commission: 7000 },
  { minValue: 75001, maxValue: 100000, commission: 10000 },
];

const CONTRACT_MULTIPLIERS = [
  { years: 3, percentage: 30 },
  { years: 5, percentage: 50 },
  { years: 7, percentage: 70 },
  { years: 8, percentage: 80 },
  { years: 12, percentage: 120 },
  { years: 15, percentage: 150 },
];

const LEVEL_REQUIREMENTS = [
  { level: 1, pointsRequired: 0, unlocked: true },
  { level: 2, pointsRequired: 500, unlocked: false },
  { level: 3, pointsRequired: 5000, unlocked: false },
  { level: 4, pointsRequired: 50000, unlocked: false },
  { level: 5, pointsRequired: 250000, unlocked: false },
  { level: 6, pointsRequired: 500000, unlocked: false },
  { level: 7, pointsRequired: 1000000, unlocked: false },
];

const MAINTENANCE_BONUS = {
  monthly: 29.99,
  perLevel: 1.99,
};

const NETWORK_DATA = {
  id: 1,
  name: 'Você',
  level: 1,
  sales: 45000,
  commission: 3200,
  children: [
    {
      id: 2,
      name: 'Maria Silva',
      level: 2,
      sales: 28000,
      commission: 1800,
      children: [
        { id: 5, name: 'Pedro Costa', level: 3, sales: 12000, commission: 800, children: [] },
        { id: 6, name: 'Ana Santos', level: 3, sales: 8500, commission: 600, children: [] },
        { id: 7, name: 'Carlos Lima', level: 3, sales: 15000, commission: 950, children: [] }
      ]
    },
    {
      id: 3,
      name: 'João Pereira',
      level: 2,
      sales: 35000,
      commission: 2400,
      children: [
        { id: 8, name: 'Julia Rocha', level: 3, sales: 18000, commission: 1200, children: [] },
        { id: 9, name: 'Roberto Alves', level: 3, sales: 9500, commission: 650, children: [] }
      ]
    },
    {
      id: 4,
      name: 'Fernanda Souza',
      level: 2,
      sales: 22000,
      commission: 1500,
      children: [
        { id: 10, name: 'Lucas Martins', level: 3, sales: 11000, commission: 750, children: [] },
        { id: 11, name: 'Camila Dias', level: 3, sales: 7800, commission: 520, children: [] },
        { id: 12, name: 'Rafael Torres', level: 3, sales: 13500, commission: 900, children: [] }
      ]
    }
  ]
};

const getCurrentLevel = (points: number) => {
  for (let i = LEVEL_REQUIREMENTS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_REQUIREMENTS[i].pointsRequired) return LEVEL_REQUIREMENTS[i].level;
  }
  return 1;
};

const NavButton = ({ icon: Icon, label, active, onClick }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button 
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all whitespace-nowrap font-medium ${
      active 
        ? 'bg-[#FE5200]/10 text-[#FE5200] border-b-2 border-[#FE5200] dark:bg-[#FE5200]/20 dark:text-[#FE5200]' 
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1f252b]'
    }`}
  >
    <Icon className="w-4 h-4" />
    <span className="text-sm">{label}</span>
  </button>
);

const NetworkMap = () => {
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const renderNode = (node: any, isRoot = false) => {
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNode?.id === node.id;

    return (
      <div key={node.id} className="flex flex-col items-center">
        <div
          onClick={() => setSelectedNode(node)}
          className={`relative cursor-pointer transition-all transform hover:scale-105 ${
            isSelected ? 'scale-110' : ''
          }`}
        >
          <div className={`${
            isRoot 
              ? 'w-32 h-32 bg-gradient-to-br from-[#FE5200] to-[#FE5200]/80' 
              : node.level === 2
              ? 'w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600'
              : 'w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-500'
          } rounded-full flex flex-col items-center justify-center text-white shadow-lg ${
            isSelected ? 'ring-4 ring-[#FE5200]/30' : ''
          }`}>
            <User className={`${isRoot ? 'w-8 h-8' : node.level === 2 ? 'w-6 h-6' : 'w-5 h-5'} mb-1`} />
            <span className={`${isRoot ? 'text-sm' : 'text-xs'} font-bold text-center px-2`}>
              {node.name}
            </span>
          </div>
          {!isRoot && (
            <div className="absolute -top-1 -right-1 bg-white dark:bg-[#1a1f24] rounded-full px-2 py-0.5 text-xs font-bold text-gray-700 dark:text-gray-300 shadow border border-gray-200 dark:border-[#2b3238]">
              N{node.level}
            </div>
          )}
        </div>

        {hasChildren && (
          <>
            <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600" />
            <div className="flex gap-8 relative">
              {node.children.map((child: any, index: number) => (
                <div key={child.id} className="relative">
                  {index > 0 && (
                    <div className="absolute top-0 -left-4 w-8 h-0.5 bg-gray-300 dark:bg-gray-600" style={{ top: '0' }} />
                  )}
                  {renderNode(child)}
                </div>
              ))}
              {node.children.length > 1 && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-300 dark:bg-gray-600" style={{ width: `calc(100% - ${isRoot ? '64px' : '48px'})`, left: isRoot ? '64px' : '48px' }} />
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#3E3E3E] rounded-xl shadow-sm border border-gray-200 dark:border-[#1E1E1E] p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Visualização Dinâmica da Rede</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Explore sua estrutura de rede e acompanhe o desempenho de cada membro</p>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#2b3238] dark:to-[#1a1f24] rounded-lg p-8 overflow-x-auto border border-gray-200 dark:border-[#2b3238]">
          <div className="flex justify-center min-w-max">
            {renderNode(NETWORK_DATA, true)}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#FE5200]/10 dark:bg-[#FE5200]/20 rounded-lg p-4 border border-[#FE5200]/20 dark:border-[#FE5200]/40">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#FE5200] to-[#FE5200]/80 rounded-full" />
              <span className="font-semibold text-gray-800 dark:text-gray-100">Nível 1 - Você</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Líder da rede</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full" />
              <span className="font-semibold text-gray-800 dark:text-gray-100">Nível 2 - Diretos</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Membros que você indicou</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full" />
              <span className="font-semibold text-gray-800 dark:text-gray-100">Nível 3 - Indiretos</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Indicações dos seus diretos</p>
          </div>
        </div>
      </div>

      {selectedNode && (
        <div className="bg-white dark:bg-[#3E3E3E] rounded-xl shadow-sm border border-gray-200 dark:border-[#1E1E1E] p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
            <User className="w-5 h-5 text-[#FE5200] mr-2" />
            Detalhes do Membro
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-[#2b3238]">
                  <span className="text-gray-600 dark:text-gray-400">Nome:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100">{selectedNode.name}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-[#2b3238]">
                  <span className="text-gray-600 dark:text-gray-400">Nível:</span>
                  <span className="font-semibold text-[#FE5200]">Nível {selectedNode.level}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-[#2b3238]">
                  <span className="text-gray-600 dark:text-gray-400">Vendas Totais:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100">R$ {selectedNode.sales.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-[#2b3238]">
                  <span className="text-gray-600 dark:text-gray-400">Comissão Gerada:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">R$ {selectedNode.commission.toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#FE5200]/10 to-[#FE5200]/20 dark:from-[#FE5200]/20 dark:to-[#FE5200]/30 rounded-lg p-4 border border-[#FE5200]/20 dark:border-[#FE5200]/40">
              <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Estatísticas</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Membros Diretos:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100">{selectedNode.children?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Sua Comissão (10%):</span>
                  <span className="font-semibold text-[#FE5200]">R$ {(selectedNode.commission * 0.1).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">Ativo</span>
                </div>
              </div>
            </div>
          </div>

          {selectedNode.children && selectedNode.children.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Membros Indicados ({selectedNode.children.length})</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {selectedNode.children.map((child: any) => (
                  <div
                    key={child.id}
                    onClick={() => setSelectedNode(child)}
                    className="bg-gray-50 dark:bg-[#2b3238] rounded-lg p-3 border border-gray-200 dark:border-[#2b3238] hover:border-[#FE5200]/30 dark:hover:border-[#FE5200]/40 cursor-pointer transition-colors"
                  >
                    <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{child.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">R$ {child.sales.toLocaleString('pt-BR')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Network = ({ userPoints, currentLevel }: { userPoints: number; currentLevel: number }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#3E3E3E] rounded-xl shadow-sm border border-gray-200 dark:border-[#1E1E1E] p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Sua Rede Multinível</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Comissão de Rede = 10% da Tabela padrão</p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 dark:bg-[#2b3238] rounded-lg p-6 border border-gray-200 dark:border-[#2b3238]">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 text-[#FE5200] mr-2" />
              Status dos Níveis
            </h3>
            <div className="space-y-3">
              {LEVEL_REQUIREMENTS.map(level => {
                const isUnlocked = userPoints >= level.pointsRequired;
                return (
                  <div key={level.level} className="flex items-center justify-between p-3 bg-white dark:bg-[#1a1f24] rounded-lg border border-gray-200 dark:border-[#2b3238]">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isUnlocked ? 'bg-[#FE5200]/10 text-[#FE5200] dark:bg-[#FE5200]/20' : 'bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500'
                      }`}>
                        {isUnlocked ? <CheckCircle className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-100">Nível {level.level}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{level.pointsRequired.toLocaleString('pt-BR')} pts</p>
                      </div>
                    </div>
                    {isUnlocked && (
                      <span className="text-xs font-semibold text-[#FE5200] bg-[#FE5200]/10 dark:bg-[#FE5200]/20 px-3 py-1 rounded-full">Ativo</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-[#2b3238] rounded-lg p-6 border border-gray-200 dark:border-[#2b3238]">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
              <Users className="w-5 h-5 text-[#FE5200] mr-2" />
              Informações da Rede
            </h3>
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#1a1f24] rounded-lg p-4 border border-gray-200 dark:border-[#2b3238]">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Membros Diretos</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">12</p>
              </div>
              <div className="bg-white dark:bg-[#1a1f24] rounded-lg p-4 border border-gray-200 dark:border-[#2b3238]">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total na Rede</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">47</p>
              </div>
              <div className="bg-gradient-to-r from-[#FE5200] to-[#FE5200]/80 rounded-lg p-4 text-white">
                <p className="text-sm text-orange-100 mb-1">Comissão de Rede (Mês)</p>
                <p className="text-3xl font-bold">R$ 1.245,00</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-[#FE5200]/10 dark:bg-[#FE5200]/20 rounded-lg p-5 border border-[#FE5200]/20 dark:border-[#FE5200]/40">
          <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
            <Gift className="w-5 h-5 text-[#FE5200] mr-2" />
            Como funciona?
          </h4>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start">
              <span className="text-[#FE5200] mr-2">•</span>
              <span>Você ganha 10% sobre as comissões dos membros que indicar</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#FE5200] mr-2">•</span>
              <span>Quanto mais níveis desbloqueados, maior seu potencial de ganho</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#FE5200] mr-2">•</span>
              <span>Construa uma rede sólida e ganhe passivamente</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const Bonuses = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#3E3E3E] rounded-xl shadow-sm border border-gray-200 dark:border-[#1E1E1E] p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Sistema de Comissões</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Central de acompanhamento de comissões e metas</p>
        
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-[#FE5200]/10 to-[#FE5200]/20 dark:from-[#FE5200]/20 dark:to-[#FE5200]/30 rounded-lg p-6 border border-[#FE5200]/20 dark:border-[#FE5200]/40">
            <div className="w-12 h-12 bg-[#FE5200] rounded-lg flex items-center justify-center mb-4">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">Bônus de Indicação</h3>
            <p className="text-3xl font-bold text-[#FE5200] mb-2">R$ 100,00</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Por cada novo membro que você indicar e ativar</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">Bônus Manutenção</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">R$ 29,99</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Mensal + R$ 1,99 por nível desbloqueado</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/30 rounded-lg p-6 border border-amber-200 dark:border-amber-800">
            <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">Bônus Contrato</h3>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-2">30-150%</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Baseado no prazo do contrato fechado</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1f24] border-2 border-gray-200 dark:border-[#2b3238] rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 text-[#FE5200] mr-2" />
            Multiplicadores de Contrato
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CONTRACT_MULTIPLIERS.map(mult => (
              <div key={mult.years} className="bg-gray-50 dark:bg-[#2b3238] rounded-lg p-4 text-center border border-gray-200 dark:border-[#2b3238] hover:border-[#FE5200]/30 dark:hover:border-[#FE5200]/40 transition-colors">
                <p className="text-2xl font-bold text-[#FE5200]">{mult.years} anos</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">+{mult.percentage}% bônus</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1f24] border-2 border-gray-200 dark:border-[#2b3238] rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 text-[#FE5200] mr-2" />
            Comissões por Valor de Fatura
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-[#2b3238] bg-gray-50 dark:bg-[#2b3238]">
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Faixa de Valor</th>
                  <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Comissão</th>
                </tr>
              </thead>
              <tbody>
                {COMMISSION_TABLE.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-[#2b3238] hover:bg-[#FE5200]/5 dark:hover:bg-[#FE5200]/10 transition-colors">
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      R$ {row.minValue.toLocaleString('pt-BR')} - R$ {row.maxValue.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-[#FE5200]">
                      R$ {row.commission.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 bg-[#FE5200]/10 dark:bg-[#FE5200]/20 rounded-lg p-5 border border-[#FE5200]/20 dark:border-[#FE5200]/40">
          <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
            <Award className="w-5 h-5 text-[#FE5200] mr-2" />
            Como Maximizar seus Ganhos
          </h4>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start">
              <span className="text-[#FE5200] mr-2">•</span>
              <span>Foque em contratos de longo prazo para maiores multiplicadores</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#FE5200] mr-2">•</span>
              <span>Construa sua rede para ganhos recorrentes de 10%</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#FE5200] mr-2">•</span>
              <span>Acumule pontos para desbloquear níveis e aumentar bônus de manutenção</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#FE5200] mr-2">•</span>
              <span>Cada indicação ativa garante R$ 100,00 imediatos</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default function MultinivelPage() {
  const [currentPage, setCurrentPage] = useState('network');
  const [userPoints, setUserPoints] = useState(0);

  useEffect(() => {
    const savedPoints = localStorage.getItem('ynovaPoints');
    if (savedPoints) setUserPoints(parseInt(savedPoints));
  }, []);

  const currentLevel = getCurrentLevel(userPoints);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Multinível</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Sistema de rede e comissões</p>
        </div>
        <div className="flex items-center space-x-2 text-sm bg-white dark:bg-[#1a1f24] rounded-full px-4 py-2 border border-gray-200 dark:border-[#2b3238]">
          <Award className="w-5 h-5 text-[#FE5200]" />
          <span className="font-semibold text-gray-800 dark:text-gray-100">{userPoints.toLocaleString('pt-BR')} pontos</span>
        </div>
      </div>

      <nav className="bg-white dark:bg-[#3E3E3E] border-b border-gray-200 dark:border-[#1E1E1E] shadow-sm rounded-lg">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-2 overflow-x-auto">
            <NavButton icon={Share2} label="Rede" active={currentPage === 'network'} onClick={() => setCurrentPage('network')} />
            <NavButton icon={GitBranch} label="Visualização da Rede" active={currentPage === 'network-map'} onClick={() => setCurrentPage('network-map')} />
            <NavButton icon={Gift} label="Comissões" active={currentPage === 'bonuses'} onClick={() => setCurrentPage('bonuses')} />
          </div>
        </div>
      </nav>

      <main>
        {currentPage === 'network' && <Network userPoints={userPoints} currentLevel={currentLevel} />}
        {currentPage === 'network-map' && <NetworkMap />}
        {currentPage === 'bonuses' && <Bonuses />}
      </main>
    </div>
  );
}
