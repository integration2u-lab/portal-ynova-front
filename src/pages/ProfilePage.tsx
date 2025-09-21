import React, { useState, useEffect, useRef } from 'react';
import { Edit, ArrowRight, Save, X, Camera, Upload } from 'lucide-react';
import { User } from '../types';
import { updateUserProfile, uploadProfilePhoto, uploadProfilePhotoBase64, checkAuthStatus } from '../utils/api';

interface ProfilePageProps {
  user: User | null;
  onUserUpdate?: (updatedUser: User) => void;
}

export default function ProfilePage({ user, onUserUpdate }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    surname: user?.surname || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zip_code: user?.zip_code || '',
    birth_date: user?.birth_date ? user.birth_date.split('T')[0] : '',
    pix_key: user?.pix_key || '',
  });

  // Update form data when user prop changes
  useEffect(() => {
    setFormData({
      name: user?.name || '',
      surname: user?.surname || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
      zip_code: user?.zip_code || '',
      birth_date: user?.birth_date ? user.birth_date.split('T')[0] : '',
      pix_key: user?.pix_key || '',
    });
  }, [user]);

  // Phone number formatting function
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, '');
    
    // If empty, return empty
    if (!phoneNumber) return '';
    
    // Handle different phone number lengths (Brazilian format: +55 XX XXXXX-XXXX)
    if (phoneNumber.length <= 2) {
      return `+${phoneNumber}`;
    } else if (phoneNumber.length <= 4) {
      return `+${phoneNumber.slice(0, 2)} ${phoneNumber.slice(2)}`;
    } else if (phoneNumber.length <= 9) {
      return `+${phoneNumber.slice(0, 2)} ${phoneNumber.slice(2, 4)} ${phoneNumber.slice(4)}`;
    } else if (phoneNumber.length <= 13) {
      return `+${phoneNumber.slice(0, 2)} ${phoneNumber.slice(2, 4)} ${phoneNumber.slice(4, 9)}-${phoneNumber.slice(9)}`;
    } else {
      // Limit to 13 digits (Brazilian phone format: +55 XX XXXXX-XXXX)
      const limited = phoneNumber.slice(0, 13);
      return `+${limited.slice(0, 2)} ${limited.slice(2, 4)} ${limited.slice(4, 9)}-${limited.slice(9)}`;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Apply phone formatting if it's the phone field
    const formattedValue = name === 'phone' ? formatPhoneNumber(value) : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Por favor, selecione um arquivo de imagem válido (JPEG, JPG ou PNG)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 5MB');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // Convert file to base64
      const base64Image = await convertFileToBase64(file);
      
      // Upload base64 image
      const response = await uploadProfilePhotoBase64(user.id, base64Image);
      
      if (response.success && onUserUpdate) {
        onUserUpdate(response.data);
        alert('Foto do perfil atualizada com sucesso!');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Erro ao fazer upload da foto. Tente novamente.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Helper function to convert file to base64 with compression
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Set canvas dimensions (max 400x400 for profile photos)
        const maxSize = 400;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with JPEG compression
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        resolve(base64);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Check authentication status before making the request
    if (!checkAuthStatus()) {
      alert('Sessão expirada. Por favor, faça login novamente.');
      return;
    }
    
    setIsLoading(true);
    try {
      // Prepare data for API call - send all fields that are being edited
      const apiData = {
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zip_code: formData.zip_code || null,
        birth_date: formData.birth_date ? new Date(formData.birth_date).toISOString() : null,
        pix_key: formData.pix_key || null,
      };

      // Debug logging to verify data format
      console.log('Sending user update data:', apiData);

      const response = await updateUserProfile(user.id, apiData);
      console.log('Update response:', response);
      
      if (response.success) {
        if (onUserUpdate) {
          onUserUpdate(response.data);
        }
        alert('Perfil atualizado com sucesso!');
        setIsEditing(false);
      } else {
        alert('Erro ao atualizar perfil. Tente novamente.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(`Erro ao atualizar perfil: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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
      address: user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
      zip_code: user?.zip_code || '',
      birth_date: user?.birth_date ? user.birth_date.split('T')[0] : '',
      pix_key: user?.pix_key || '',
    });
    setIsEditing(false);
  };
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Perfil</h1>
      
      {/* Profile Photo Section */}
      <div className="bg-white dark:bg-[#3E3E3E] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-[#1E1E1E]">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Foto do Perfil</h3>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gray-200 dark:bg-[#2E2E2E] rounded-full flex items-center justify-center overflow-hidden">
              {user?.photo_url ? (
                <img
                  src={user.photo_url}
                  alt={`${user.name} ${user.surname}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-medium text-gray-500 dark:text-gray-400">
                  {user ? `${user.name[0]}${user.surname[0]}` : 'U'}
                </span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="absolute -bottom-2 -right-2 bg-[#FE5200] hover:bg-[#FE5200]/90 disabled:bg-[#FE5200]/50 text-white p-2 rounded-full shadow-lg transition-colors"
            >
              {isUploadingPhoto ? (
                <Upload size={16} className="animate-spin" />
              ) : (
                <Camera size={16} />
              )}
            </button>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {isUploadingPhoto ? 'Enviando foto...' : 'Clique no ícone da câmera para alterar sua foto'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Formatos aceitos: JPG, PNG. Tamanho máximo: 5MB
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handlePhotoUpload}
          className="hidden"
        />
      </div>

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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data de Nascimento</label>
            <input 
              type="date" 
              name="birth_date"
              value={formData.birth_date} 
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chave PIX</label>
            <input 
              type="text" 
              name="pix_key"
              value={formData.pix_key} 
              onChange={handleInputChange}
              readOnly={!isEditing}
              placeholder="Ex: email@exemplo.com ou 11999999999"
              className={`w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg text-gray-900 dark:text-gray-100 ${
                isEditing 
                  ? 'bg-white dark:bg-[#2E2E2E] focus:ring-2 focus:ring-[#FE5200] focus:border-transparent' 
                  : 'bg-gray-50 dark:bg-[#3E3E3E]'
              }`}
            />
          </div>
        </div>
        
        {/* Address Section */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-[#1E1E1E]">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Endereço</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Endereço</label>
              <input 
                type="text" 
                name="address"
                value={formData.address} 
                onChange={handleInputChange}
                readOnly={!isEditing}
                placeholder="Rua, número, bairro"
                className={`w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg text-gray-900 dark:text-gray-100 ${
                  isEditing 
                    ? 'bg-white dark:bg-[#2E2E2E] focus:ring-2 focus:ring-[#FE5200] focus:border-transparent' 
                    : 'bg-gray-50 dark:bg-[#3E3E3E]'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cidade</label>
              <input 
                type="text" 
                name="city"
                value={formData.city} 
                onChange={handleInputChange}
                readOnly={!isEditing}
                placeholder="São Paulo"
                className={`w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg text-gray-900 dark:text-gray-100 ${
                  isEditing 
                    ? 'bg-white dark:bg-[#2E2E2E] focus:ring-2 focus:ring-[#FE5200] focus:border-transparent' 
                    : 'bg-gray-50 dark:bg-[#3E3E3E]'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estado</label>
              <input 
                type="text" 
                name="state"
                value={formData.state} 
                onChange={handleInputChange}
                readOnly={!isEditing}
                placeholder="SP"
                maxLength={2}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg text-gray-900 dark:text-gray-100 ${
                  isEditing 
                    ? 'bg-white dark:bg-[#2E2E2E] focus:ring-2 focus:ring-[#FE5200] focus:border-transparent' 
                    : 'bg-gray-50 dark:bg-[#3E3E3E]'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CEP</label>
              <input 
                type="text" 
                name="zip_code"
                value={formData.zip_code} 
                onChange={handleInputChange}
                readOnly={!isEditing}
                placeholder="01234-567"
                className={`w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg text-gray-900 dark:text-gray-100 ${
                  isEditing 
                    ? 'bg-white dark:bg-[#2E2E2E] focus:ring-2 focus:ring-[#FE5200] focus:border-transparent' 
                    : 'bg-gray-50 dark:bg-[#3E3E3E]'
                }`}
              />
            </div>
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
