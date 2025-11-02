import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

type LoginPageProps = {
  onLogin: (e: React.FormEvent, email: string, password: string) => void;
  isLoading: boolean;
  error: string | null;
};

export default function LoginPage({ onLogin, isLoading, error }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [tab, setTab] = useState<'login' | 'register' | 'confirm'>('login');

  // Terms modal visibility
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regCnpj, setRegCnpj] = useState('');
  const [regName, setRegName] = useState('');
  const [regSurname, setRegSurname] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regState, setRegState] = useState('');
  const [regZipCode, setRegZipCode] = useState('');
  const [regBirthDate, setRegBirthDate] = useState('');
  const [regPixKey, setRegPixKey] = useState('');
  const [regError, setRegError] = useState('');
  const [regIsLoading, setRegIsLoading] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);

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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setRegPhone(formatted);
  };

  const handlePasswordConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const confirmValue = e.target.value;
    setRegConfirm(confirmValue);
    
    // Check if passwords match (only if both fields have values)
    if (confirmValue && regPassword) {
      setPasswordsMatch(regPassword === confirmValue);
    } else {
      setPasswordsMatch(true); // Reset to true if either field is empty
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const passwordValue = e.target.value;
    setRegPassword(passwordValue);
    
    // Check if passwords match (only if both fields have values)
    if (passwordValue && regConfirm) {
      setPasswordsMatch(passwordValue === regConfirm);
    } else {
      setPasswordsMatch(true); // Reset to true if either field is empty
    }
  };

  const validateRegistration = (): boolean => {
    setRegError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail)) {
      setRegError('E-mail inválido');
      return false;
    }
    if (regPassword.length < 8 || !/\d/.test(regPassword)) {
      setRegError('Senha deve ter ao menos 8 caracteres e números');
      return false;
    }
    if (regPassword !== regConfirm) {
      setRegError('As senhas não são iguais');
      return false;
    }
    if (!regName.trim()) {
      setRegError('Nome é obrigatório');
      return false;
    }
    if (!regSurname.trim()) {
      setRegError('Sobrenome é obrigatório');
      return false;
    }
    return true;
  };

  const performRegistration = async () => {
    setRegIsLoading(true);
    try {
      const { registerUser } = await import('../utils/api');
      await registerUser({
        email: regEmail,
        password: regPassword,
        name: regName,
        surname: regSurname,
        phone: regPhone || undefined,
        address: regAddress || undefined,
        city: regCity || undefined,
        state: regState || undefined,
        zip_code: regZipCode || undefined,
        birth_date: regBirthDate || undefined,
        pix_key: regPixKey || undefined,
      });
      setTab('confirm');
    } catch (error) {
      console.error('Registration error:', error);
      setRegError(error instanceof Error ? error.message : 'Erro ao cadastrar usuário');
    } finally {
      setRegIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRegistration()) {
      return;
    }
    setShowTermsModal(true);
  };

  const renderLogin = () => (
    <form onSubmit={(e) => onLogin(e, email, password)} className="space-y-4">
      <div>
        <input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FE5200] dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
          required
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FE5200] dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
          required
        />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#FE5200] hover:bg-[#FE5200]/90 text-white font-medium py-2 rounded-md flex items-center justify-center"
      >
        {isLoading ? (
          <RefreshCw className="animate-spin" size={20} />
        ) : (
          'Entrar'
        )}
      </button>
    </form>
  );

  const renderRegister = () => (
    <form onSubmit={handleRegister} className="space-y-4 max-h-[70vh] overflow-y-auto">
      {/* Personal Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <input
            type="text"
            placeholder="Nome *"
            value={regName}
            onChange={(e) => setRegName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FE5200] dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
            required
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Sobrenome *"
            value={regSurname}
            onChange={(e) => setRegSurname(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FE5200] dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
            required
          />
        </div>
      </div>
      
      <div>
        <input
          type="email"
          placeholder="seu@email.com *"
          value={regEmail}
          onChange={(e) => setRegEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FE5200] dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
          required
        />
      </div>
      
      <div>
        <input
          type="tel"
          placeholder="Telefone (ex: +55 11 99999-9999)"
          value={regPhone}
          onChange={handlePhoneChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FE5200] dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
        />
      </div>
      
      <div>
        <input
          type="date"
          value={regBirthDate}
          onChange={(e) => setRegBirthDate(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FE5200] dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
        />
        <label className="block text-xs text-gray-500 mt-1">Data de Nascimento</label>
      </div>
      
      {/* Address Information */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Endereço (opcional)</h4>
        <div>
          <input
            type="text"
            placeholder="Endereço completo"
            value={regAddress}
            onChange={(e) => setRegAddress(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FE5200] dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <input
              type="text"
              placeholder="Cidade"
              value={regCity}
              onChange={(e) => setRegCity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FE5200] dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Estado (ex: SP)"
              value={regState}
              onChange={(e) => setRegState(e.target.value)}
              maxLength={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FE5200] dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
            />
          </div>
        </div>
        <div>
          <input
            type="text"
            placeholder="CEP (ex: 01234-567)"
            value={regZipCode}
            onChange={(e) => setRegZipCode(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FE5200] dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 mt-4"
          />
        </div>
      </div>
      
      {/* Payment Information */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Informações de Pagamento (opcional)</h4>
        <div>
          <input
            type="text"
            placeholder="Chave PIX (email, telefone, cpf, cnpj ou chave aleatória)"
            value={regPixKey}
            onChange={(e) => setRegPixKey(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FE5200] dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
          />
        </div>
      </div>
      
      {/* Password Fields */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Senha</h4>
        <div>
          <input
            type="password"
            placeholder="Senha (mín. 8 caracteres com números) *"
            value={regPassword}
            onChange={handlePasswordChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FE5200] dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Confirme sua senha *"
            value={regConfirm}
            onChange={handlePasswordConfirmChange}
            className={`w-full px-4 py-2 border rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FE5200] dark:bg-gray-800 dark:text-gray-100 mt-4 ${
              passwordsMatch 
                ? 'border-gray-300 dark:border-gray-600' 
                : 'border-red-500 dark:border-red-500'
            }`}
            required
          />
          {!passwordsMatch && regConfirm && (
            <p className="text-red-500 text-xs mt-1">As senhas não coincidem</p>
          )}
        </div>
      </div>
      
      {regError && <p className="text-red-600 text-sm">{regError}</p>}
      <button
        type="submit"
        disabled={regIsLoading || !passwordsMatch}
        className="w-full bg-[#FE5200] hover:bg-[#FE5200]/90 disabled:bg-[#FE5200]/50 text-white font-medium py-2 rounded-md flex items-center justify-center"
      >
        {regIsLoading ? (
          <RefreshCw className="animate-spin" size={20} />
        ) : (
          'Cadastrar'
        )}
      </button>
      <button
        type="button"
        onClick={() => setTab('login')}
        className="w-full border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium py-2 rounded-md"
      >
        Voltar
      </button>
    </form>
  );

  const renderConfirm = () => (
    <div className="text-center space-y-4">
      <div className="text-green-600 text-4xl mb-4">✓</div>
      <h3 className="text-lg font-semibold text-gray-900">Cadastro realizado com sucesso!</h3>
      <p className="text-gray-600">
        Sua conta foi criada com sucesso. Você já pode fazer login com suas credenciais.
      </p>
      <button
        type="button"
        onClick={() => {
          setTab('login');
          // Clear registration form
          setRegEmail('');
          setRegPassword('');
          setRegConfirm('');
          setRegCnpj('');
          setRegName('');
          setRegSurname('');
          setRegPhone('');
          setRegAddress('');
          setRegCity('');
          setRegState('');
          setRegZipCode('');
          setRegBirthDate('');
          setRegPixKey('');
          setRegError('');
          setPasswordsMatch(true);
        }}
        className="w-full bg-[#FE5200] hover:bg-[#FE5200]/90 text-white font-medium py-2 rounded-md"
      >
        Fazer Login
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-400 p-4">
      <div className={`bg-white rounded-lg shadow-md p-8 w-full ${tab === 'register' ? 'max-w-2xl' : 'max-w-md'}`}>
        <h1 className="text-2xl font-bold text-[#FE5200] text-center">YNOVA</h1>
        <p className="text-gray-500 text-center mb-6">Portal dos Consultores</p>

        {tab !== 'confirm' && (
          <div className="flex mb-6">
            <button
              className={`flex-1 py-2 border-b-2 ${
                tab === 'login'
                  ? 'border-[#FE5200] text-[#FE5200]'
                  : 'border-transparent text-gray-500'
              }`}
              onClick={() => setTab('login')}
            >
              Login
            </button>
            <button
              className={`flex-1 py-2 border-b-2 ${
                tab === 'register'
                  ? 'border-[#FE5200] text-[#FE5200]'
                  : 'border-transparent text-gray-500'
              }`}
              onClick={() => setTab('register')}
            >
              Cadastro
            </button>
          </div>
        )}

        {tab === 'login' && renderLogin()}
        {tab === 'register' && renderRegister()}
        {showTermsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">TERMO DE ACEITE E CONSENTIMENTO PARA CADASTRO DE CONSULTOR(A) YNOVA</h2>
              </div>
              <div className="p-6 space-y-4 text-gray-800 dark:text-gray-200">
                <p>Pelo presente instrumento, o(a) usuário(a), ao prosseguir com o processo de cadastro na plataforma Ynova, declara, de forma livre, informada e inequívoca, que leu, compreendeu e aceita integralmente os termos e condições estabelecidos neste Termo de Aceite e na Política de Privacidade da empresa YNOVA, doravante denominada “Ynova”.</p>
                <h3 className="font-semibold">1. Consentimento para Tratamento de Dados Pessoais</h3>
                <p>O(a) usuário(a) autoriza expressamente a coleta, o armazenamento, o uso, o tratamento e o compartilhamento de seus dados pessoais pela Ynova, conforme disposto na Lei nº 13.709/2018 – Lei Geral de Proteção de Dados Pessoais (LGPD), para as seguintes finalidades:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Realização e validação do cadastro como consultor(a) Ynova;</li>
                  <li>Comunicação institucional, envio de informações, materiais e treinamentos relacionados à atuação como consultor(a);</li>
                  <li>Cumprimento de obrigações legais, regulatórias e contratuais;</li>
                  <li>Fins estatísticos e de melhoria dos serviços prestados pela Ynova.</li>
                </ul>
                <h3 className="font-semibold">2. Direitos do Titular dos Dados</h3>
                <p>O(a) usuário(a) declara estar ciente de que possui todos os direitos assegurados pela LGPD, incluindo:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>O direito de acessar, corrigir, atualizar ou excluir seus dados pessoais;</li>
                  <li>O direito de revogar o consentimento a qualquer momento, mediante solicitação expressa;</li>
                  <li>O direito de solicitar informações sobre o uso e o compartilhamento de seus dados.</li>
                </ul>
                <p>As solicitações poderão ser realizadas por meio dos canais oficiais de atendimento da Ynova.</p>
                <h3 className="font-semibold">3. Condição para Cadastro</h3>
                <p>O(a) usuário(a) reconhece que o fornecimento dos dados pessoais é condição indispensável para a conclusão do cadastro e para sua participação no programa de consultores Ynova, compreendendo que a recusa em fornecer ou autorizar o uso dos dados inviabiliza o registro e o acesso à plataforma.</p>
                <h3 className="font-semibold">4. Declaração de Vontade</h3>
                <p>Ao aceitar este termo, o(a) usuário(a):</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Declara ter lido e compreendido integralmente o conteúdo deste documento;</li>
                  <li>Manifesta de forma expressa sua vontade de se tornar consultor(a) Ynova;</li>
                  <li>Concorda com o tratamento de seus dados pessoais nos termos aqui descritos e na Política de Privacidade;</li>
                  <li>Reconhece a validade jurídica deste aceite eletrônico, o qual substitui qualquer outra forma de assinatura, nos termos da legislação vigente.</li>
                </ul>
                <p>Ao clicar em “Li e aceito os termos”, o(a) usuário(a) confirma seu consentimento e autoriza a finalização do cadastro como consultor(a) Ynova.</p>
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="w-full sm:w-auto border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium py-2 px-4 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={regIsLoading}
                  onClick={async () => {
                    setShowTermsModal(false);
                    await performRegistration();
                  }}
                  className="w-full sm:w-auto bg-[#FE5200] hover:bg-[#FE5200]/90 disabled:bg-[#FE5200]/50 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center"
                >
                  {regIsLoading ? <RefreshCw className="animate-spin" size={20} /> : 'Li e aceito os termos'}
                </button>
              </div>
            </div>
          </div>
        )}
        {tab === 'confirm' && renderConfirm()}

        {tab === 'login' && (
          <div className="mt-4 text-center">
            <a href="#" className="text-sm text-[#FE5200] hover:text-[#FE5200]/80">
              Esqueci minha senha
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
