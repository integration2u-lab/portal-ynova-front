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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-400 p-4">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-[#FE5200] text-center">YNOVA</h1>
        <p className="text-gray-500 text-center mb-6">Portal dos Consultores</p>
        <form
          onSubmit={(e) => onLogin(e, email, password)}
          className="space-y-4"
        >
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
        <div className="mt-4 text-center">
          <a href="#" className="text-sm text-[#FE5200] hover:text-[#FE5200]/80">
            Esqueci minha senha
          </a>
        </div>
      </div>
    </div>
  );
}
