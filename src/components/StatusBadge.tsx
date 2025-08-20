import React from 'react';

export default function StatusBadge({
  status,
  type,
}: {
  status: string;
  type: 'funil' | 'migracao';
}) {
  const getColor = () => {
    if (type === 'funil') {
      switch (status) {
        case 'verde':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'amarelo':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'vermelho':
          return 'bg-red-100 text-red-800 border-red-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    } else {
      switch (status) {
        case 'aprovado':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'em_analise':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'pendente':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'rejeitado':
          return 'bg-red-100 text-red-800 border-red-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    }
  };

  const getLabel = () => {
    if (type === 'funil') {
      switch (status) {
        case 'verde':
          return 'Qualificado';
        case 'amarelo':
          return 'Em análise';
        case 'vermelho':
          return 'Frio';
        default:
          return status;
      }
    } else {
      switch (status) {
        case 'aprovado':
          return 'Aprovado';
        case 'em_analise':
          return 'Em análise';
        case 'pendente':
          return 'Pendente';
        case 'rejeitado':
          return 'Rejeitado';
        default:
          return status;
      }
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getColor()}`}>
      {getLabel()}
    </span>
  );
}
