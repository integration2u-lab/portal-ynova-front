import React from 'react';
import { Edit, ArrowRight } from 'lucide-react';
import { mockUser } from '../data/mockData';

export default function ProfilePage() {
  const user = mockUser;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Dados Pessoais</h3>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
            <Edit size={16} />
            Editar
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
            <input type="text" value={user.name} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
            <input type="text" value="123.456.789-00" readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
            <input type="email" value={user.email} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
            <input type="tel" value="(11) 99999-9999" readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
          </div>
        </div>
        <div className="mt-8 pt-6 border-t">
          <h4 className="font-medium text-gray-900 mb-4">Segurança</h4>
          <div className="space-y-4">
            <button className="flex items-center justify-between w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <span className="text-sm font-medium">Alterar senha</span>
              <ArrowRight size={16} />
            </button>
            <button className="flex items-center justify-between w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <span className="text-sm font-medium">Configurar 2FA</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
