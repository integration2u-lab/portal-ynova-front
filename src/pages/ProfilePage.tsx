import React, { useState, useEffect, useRef } from 'react';
import { Edit, ArrowRight, Save, X, Camera, Upload, Lock, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';
import { updateUserProfile, uploadProfilePhoto, uploadProfilePhotoBase64, checkAuthStatus, changePassword } from '../utils/api';

interface ProfilePageProps {
  user: User | null;
  onUserUpdate?: (updatedUser: User) => void;
}

export default function ProfilePage({ user, onUserUpdate }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Password change modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

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
    // PJ (Pessoa Jurídica) fields
    pj_cnpj: user?.pj_cnpj || '',
    pj_razaosocial: user?.pj_razaosocial || '',
    pj_nomefantasia: user?.pj_nomefantasia || '',
    pj_phone: user?.pj_phone || '',
    pj_address: user?.pj_address || '',
    pj_city: user?.pj_city || '',
    pj_state: user?.pj_state || '',
    pj_zip_code: user?.pj_zip_code || '',
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
      // PJ (Pessoa Jurídica) fields
      pj_cnpj: user?.pj_cnpj || '',
      pj_razaosocial: user?.pj_razaosocial || '',
      pj_nomefantasia: user?.pj_nomefantasia || '',
      pj_phone: user?.pj_phone || '',
      pj_address: user?.pj_address || '',
      pj_city: user?.pj_city || '',
      pj_state: user?.pj_state || '',
      pj_zip_code: user?.pj_zip_code || '',
    });
  }, [user]);

  // CNPJ formatting function (00.000.000/0000-00)
  const formatCnpj = (value: string): string => {
    // Remove all non-digits
    const cnpj = value.replace(/\D/g, '');
    
    // If empty, return empty
    if (!cnpj) return '';
    
    // Apply mask based on length
    if (cnpj.length <= 2) {
      return cnpj;
    } else if (cnpj.length <= 5) {
      return `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`;
    } else if (cnpj.length <= 8) {
      return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`;
    } else if (cnpj.length <= 12) {
      return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8)}`;
    } else {
      // Limit to 14 digits
      const limited = cnpj.slice(0, 14);
      return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8, 12)}-${limited.slice(12)}`;
    }
  };

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
    
    // Apply formatting based on field type
    let formattedValue = value;
    if (name === 'phone' || name === 'pj_phone') {
      formattedValue = formatPhoneNumber(value);
    } else if (name === 'pj_cnpj') {
      formattedValue = formatCnpj(value);
    }
    
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
        // PJ (Pessoa Jurídica) fields
        pj_cnpj: formData.pj_cnpj || null,
        pj_razaosocial: formData.pj_razaosocial || null,
        pj_nomefantasia: formData.pj_nomefantasia || null,
        pj_phone: formData.pj_phone || null,
        pj_address: formData.pj_address || null,
        pj_city: formData.pj_city || null,
        pj_state: formData.pj_state || null,
        pj_zip_code: formData.pj_zip_code || null,
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
      // PJ (Pessoa Jurídica) fields
      pj_cnpj: user?.pj_cnpj || '',
      pj_razaosocial: user?.pj_razaosocial || '',
      pj_nomefantasia: user?.pj_nomefantasia || '',
      pj_phone: user?.pj_phone || '',
      pj_address: user?.pj_address || '',
      pj_city: user?.pj_city || '',
      pj_state: user?.pj_state || '',
      pj_zip_code: user?.pj_zip_code || '',
    });
    setIsEditing(false);
  };

  // Password change handlers
  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handleOpenPasswordModal = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordError('');
    setPasswordSuccess('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsPasswordModalOpen(true);
  };

  const handleClosePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handleChangePassword = async () => {
    // Validate inputs
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Todos os campos são obrigatórios');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('A nova senha deve ter pelo menos 8 caracteres');
      return;
    }

    if (!/\d/.test(passwordData.newPassword)) {
      setPasswordError('A nova senha deve conter pelo menos um número');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('A nova senha e a confirmação não coincidem');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('A nova senha deve ser diferente da senha atual');
      return;
    }

    setIsChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordSuccess('Senha alterada com sucesso!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      // Close modal after 2 seconds on success
      setTimeout(() => {
        handleClosePasswordModal();
      }, 2000);
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao alterar senha';
      // Translate common error messages
      if (errorMessage.includes('Current password is incorrect')) {
        setPasswordError('A senha atual está incorreta');
      } else if (errorMessage.includes('New password must be at least')) {
        setPasswordError('A nova senha deve ter pelo menos 8 caracteres com números');
      } else if (errorMessage.includes('User not found')) {
        setPasswordError('Usuário não encontrado');
      } else if (errorMessage.includes('Unauthorized')) {
        setPasswordError('Sessão expirada. Por favor, faça login novamente.');
      } else {
        setPasswordError(errorMessage);
      }
    } finally {
      setIsChangingPassword(false);
    }
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
        
        {/* PJ (Pessoa Jurídica) Section */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-[#1E1E1E]">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Dados da Pessoa Jurídica</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CNPJ</label>
              <input 
                type="text" 
                name="pj_cnpj"
                value={formData.pj_cnpj} 
                onChange={handleInputChange}
                readOnly={!isEditing}
                placeholder="12.345.678/0001-99"
                maxLength={18}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg text-gray-900 dark:text-gray-100 ${
                  isEditing 
                    ? 'bg-white dark:bg-[#2E2E2E] focus:ring-2 focus:ring-[#FE5200] focus:border-transparent' 
                    : 'bg-gray-50 dark:bg-[#3E3E3E]'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Telefone PJ</label>
              <input 
                type="tel" 
                name="pj_phone"
                value={formData.pj_phone} 
                onChange={handleInputChange}
                readOnly={!isEditing}
                placeholder="+55 11 99999-9999"
                className={`w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg text-gray-900 dark:text-gray-100 ${
                  isEditing 
                    ? 'bg-white dark:bg-[#2E2E2E] focus:ring-2 focus:ring-[#FE5200] focus:border-transparent' 
                    : 'bg-gray-50 dark:bg-[#3E3E3E]'
                }`}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Razão Social</label>
              <input 
                type="text" 
                name="pj_razaosocial"
                value={formData.pj_razaosocial} 
                onChange={handleInputChange}
                readOnly={!isEditing}
                placeholder="Nome da empresa conforme registro"
                maxLength={255}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg text-gray-900 dark:text-gray-100 ${
                  isEditing 
                    ? 'bg-white dark:bg-[#2E2E2E] focus:ring-2 focus:ring-[#FE5200] focus:border-transparent' 
                    : 'bg-gray-50 dark:bg-[#3E3E3E]'
                }`}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome Fantasia</label>
              <input 
                type="text" 
                name="pj_nomefantasia"
                value={formData.pj_nomefantasia} 
                onChange={handleInputChange}
                readOnly={!isEditing}
                placeholder="Nome comercial da empresa"
                maxLength={255}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg text-gray-900 dark:text-gray-100 ${
                  isEditing 
                    ? 'bg-white dark:bg-[#2E2E2E] focus:ring-2 focus:ring-[#FE5200] focus:border-transparent' 
                    : 'bg-gray-50 dark:bg-[#3E3E3E]'
                }`}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Endereço PJ</label>
              <input 
                type="text" 
                name="pj_address"
                value={formData.pj_address} 
                onChange={handleInputChange}
                readOnly={!isEditing}
                placeholder="Rua, número, bairro"
                maxLength={255}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg text-gray-900 dark:text-gray-100 ${
                  isEditing 
                    ? 'bg-white dark:bg-[#2E2E2E] focus:ring-2 focus:ring-[#FE5200] focus:border-transparent' 
                    : 'bg-gray-50 dark:bg-[#3E3E3E]'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cidade PJ</label>
              <input 
                type="text" 
                name="pj_city"
                value={formData.pj_city} 
                onChange={handleInputChange}
                readOnly={!isEditing}
                placeholder="São Paulo"
                maxLength={255}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg text-gray-900 dark:text-gray-100 ${
                  isEditing 
                    ? 'bg-white dark:bg-[#2E2E2E] focus:ring-2 focus:ring-[#FE5200] focus:border-transparent' 
                    : 'bg-gray-50 dark:bg-[#3E3E3E]'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estado PJ</label>
              <input 
                type="text" 
                name="pj_state"
                value={formData.pj_state} 
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CEP PJ</label>
              <input 
                type="text" 
                name="pj_zip_code"
                value={formData.pj_zip_code} 
                onChange={handleInputChange}
                readOnly={!isEditing}
                placeholder="01234-567"
                maxLength={20}
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
            <button 
              onClick={handleOpenPasswordModal}
              className="flex items-center justify-between w-full p-3 border border-gray-200 dark:border-[#1E1E1E] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1E1E1E] text-gray-900 dark:text-gray-100"
            >
              <div className="flex items-center gap-3">
                <Lock size={18} className="text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium">Alterar senha</span>
              </div>
              <ArrowRight size={16} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#3E3E3E] rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#1E1E1E]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#FE5200]/10 rounded-lg">
                  <Lock size={20} className="text-[#FE5200]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Alterar Senha</h3>
              </div>
              <button
                onClick={handleClosePasswordModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#2E2E2E] rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Success Message */}
              {passwordSuccess && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-400">{passwordSuccess}</p>
                </div>
              )}

              {/* Error Message */}
              {passwordError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400">{passwordError}</p>
                </div>
              )}

              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Senha Atual
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Digite sua senha atual"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-[#1E1E1E] rounded-lg bg-white dark:bg-[#2E2E2E] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#FE5200] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Digite sua nova senha"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-[#1E1E1E] rounded-lg bg-white dark:bg-[#2E2E2E] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#FE5200] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Mínimo 8 caracteres com números</p>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Confirme sua nova senha"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-[#1E1E1E] rounded-lg bg-white dark:bg-[#2E2E2E] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#FE5200] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-[#1E1E1E]">
              <button
                onClick={handleClosePasswordModal}
                disabled={isChangingPassword}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#2E2E2E] hover:bg-gray-200 dark:hover:bg-[#1E1E1E] rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                className="px-4 py-2 text-sm font-medium text-white bg-[#FE5200] hover:bg-[#FE5200]/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isChangingPassword ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Alterando...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Alterar Senha
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
