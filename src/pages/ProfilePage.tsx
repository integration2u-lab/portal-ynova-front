import React, { useState, useEffect } from 'react';
import { Edit, ArrowRight, Save, X } from 'lucide-react';
import { User } from '../types';
import { updateUserProfile } from '../utils/api';

interface ProfilePageProps {
  user: User | null;
  onUserUpdate?: (updatedUser: User) => void;
}

export default function ProfilePage({ user, onUserUpdate }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    surname: user?.surname || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Update form data when user prop changes
  useEffect(() => {
    setFormData({
      name: user?.name || '',
      surname: user?.surname || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await updateUserProfile(user.id, formData);
      if (response.success && onUserUpdate) {
        onUserUpdate(response.data);
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      surname: user?.surname || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
    setIsEditing(false);
  };
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Perfil</h1>
      <div className="bg-white dark:bg-[#3E3E3E] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-[#1E1E1E]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Dados Pessoais</h3>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button 
                  onClick={handleSave}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
                >
                  <Save size={16} />
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </button>
                <button 
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
                >
                  <X size={16} />
                  Cancelar
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="bg-[#FE5200] hover:bg-[#FE5200]/90 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
              >
                <Edit size={16} />
                Editar
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome</label>
            <input 
              type="text" 
              name="name"
              value={formData.name} 
              onChange={handleInputChange}
              readOnly={!isEditing}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg text-gray-900 dark:text-gray-100 ${
                isEditing 
                  ? 'bg-white dark:bg-[#2E2E2E] focus:ring-2 focus:ring-[#FE5200] focus:border-transparent' 
                  : 'bg-gray-50 dark:bg-[#3E3E3E]'
              }`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sobrenome</label>
            <input 
              type="text" 
              name="surname"
              value={formData.surname} 
              onChange={handleInputChange}
              readOnly={!isEditing}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg text-gray-900 dark:text-gray-100 ${
                isEditing 
                  ? 'bg-white dark:bg-[#2E2E2E] focus:ring-2 focus:ring-[#FE5200] focus:border-transparent' 
                  : 'bg-gray-50 dark:bg-[#3E3E3E]'
              }`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">E-mail</label>
            <input 
              type="email" 
              name="email"
              value={formData.email} 
              onChange={handleInputChange}
              readOnly={!isEditing}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg text-gray-900 dark:text-gray-100 ${
                isEditing 
                  ? 'bg-white dark:bg-[#2E2E2E] focus:ring-2 focus:ring-[#FE5200] focus:border-transparent' 
                  : 'bg-gray-50 dark:bg-[#3E3E3E]'
              }`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Telefone</label>
            <input 
              type="tel" 
              name="phone"
              value={formData.phone} 
              onChange={handleInputChange}
              readOnly={!isEditing}
              placeholder="Ex: +55 11 99999-9999"
              className={`w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg text-gray-900 dark:text-gray-100 ${
                isEditing 
                  ? 'bg-white dark:bg-[#2E2E2E] focus:ring-2 focus:ring-[#FE5200] focus:border-transparent' 
                  : 'bg-gray-50 dark:bg-[#3E3E3E]'
              }`}
            />
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-[#1E1E1E]">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Segurança</h4>
          <div className="space-y-4">
            <button className="flex items-center justify-between w-full p-3 border border-gray-200 dark:border-[#1E1E1E] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1E1E1E]">
              <span className="text-sm font-medium">Alterar senha</span>
              <ArrowRight size={16} />
            </button>
            <button className="flex items-center justify-between w-full p-3 border border-gray-200 dark:border-[#1E1E1E] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1E1E1E]">
              <span className="text-sm font-medium">Configurar 2FA</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
