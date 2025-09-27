import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAddNegociacao } from '../contexts/AddNegociacaoContext';
import {
  Home,
  UserCheck,
  Calendar,
  FileText,
  DollarSign,
  User,
  Bell,
  HelpCircle,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Handshake,
  Plus,
} from 'lucide-react';
import CrownIcon from './icons/CrownIcon';
import { User as UserType } from '../types';

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  // { to: '/negociacoes', label: 'Negociações', icon: Handshake },
  // { to: '/agenda', label: 'Agenda', icon: Calendar },
  // { to: '/proposals', label: 'Propostas', icon: FileText },
  // { to: '/notifications', label: 'Notificações', icon: Bell },
  //{ to: '/commissions', label: 'Comissões', icon: DollarSign },
  { to: '/profile', label: 'Perfil', icon: User },
  { to: '/ranking', label: 'Ranking', icon: CrownIcon },
  { to: '/training', label: 'Treinamento para Consultor', icon: GraduationCap },
  { to: '/help', label: 'Ajuda', icon: HelpCircle },
];

interface LayoutProps {
  onLogout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  user: UserType | null;
}

export default function Layout({ onLogout, theme, toggleTheme, user }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { openModal } = useAddNegociacao();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);



  const handleLogout = () => {
    onLogout();
    setIsMobileMenuOpen(false);
  };

  const handleAddNegociacao = () => {
    setIsMobileMenuOpen(false);
    openModal('novo');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#111418] dark:text-gray-100">
      <header
        role="banner"
        className="sticky top-0 z-40 h-16 bg-[#FE5200] text-white shadow-sm px-4 md:px-6"
      >
        <div className="flex items-center justify-between h-full">
          <NavLink
            to="/dashboard"
            aria-label="Ir para a página inicial"
            className="flex items-center gap-2"
          >
            {logoError ? (
              <span className="font-semibold text-white">YNOVA</span>
            ) : (
              <img
                src="https://i.imgur.com/eFBlDDM.png"
                alt="YNOVA"
                className="h-40 md:h-40 w-auto"
                loading="eager"
                onError={() => setLogoError(true)}
              />
            )}
          </NavLink>
          <div className="flex items-center gap-4">
            <button
              className="p-2 rounded-md text-white hover:text-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              aria-label="Adicionar negociação"
              onClick={handleAddNegociacao}
              title="Adicionar negociação"
            >
              <Plus size={20} />
            </button>
            <div className="relative" ref={notifRef}>
              <button
                className="p-2 rounded-md text-white hover:text-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                aria-label="Notificações"
                onClick={() => setShowNotifications((p) => !p)}
                title="Notificações"
              >
                <Bell size={20} />
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1a1f24] border border-gray-200 dark:border-[#2b3238] rounded-lg shadow-lg p-4 text-sm text-gray-700 dark:text-gray-200">
                  <ul className="space-y-2">
                    <li>Verifique seu e-mail</li>
                    <li>Nova mensagem da gestão</li>
                    <li>Duas reuniões perdidas</li>
                  </ul>
                </div>
              )}
            </div>
            <label className="relative inline-flex items-center cursor-pointer focus-within:ring-2 focus-within:ring-white/30 rounded-full">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={theme === 'dark'}
                onChange={toggleTheme}
              />
              <div className="w-11 h-6 bg-white/30 rounded-full peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white/30"></div>
            </label>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center overflow-hidden"
                aria-hidden
              >
                {user?.photo_url ? (
                  <img
                    src={user.photo_url}
                    alt={`${user.name} ${user.surname}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<span class="text-white text-sm font-medium">${user.name[0]}${user.surname[0]}</span>`;
                      }
                    }}
                  />
                ) : (
                  <span className="text-white text-sm font-medium">
                    {user ? `${user.name[0]}${user.surname[0]}` : 'U'}
                  </span>
                )}
              </div>
              <span className="hidden sm:block text-sm font-medium text-white">
                {user ? `${user.name} ${user.surname}` : 'Usuário'}
              </span>
            </div>
            <button
              className="md:hidden p-2 rounded-md text-white hover:text-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:top-16">
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#1a1f24] border-r border-gray-200 dark:border-[#2b3238]">
            <nav className="flex-1 px-4 py-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-[#FE5200]/10 text-[#FE5200] border border-[#FE5200]/40 dark:bg-[#FE5200]/20 dark:text-[#FE5200] dark:border-[#FE5200]/40'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#1f252b]'
                      }`
                    }
                  >
                    <Icon size={20} className="mr-3" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-[#2b3238]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
              >
                <LogOut size={20} className="mr-3" />
                Sair
              </button>
            </div>
          </div>
        </aside>

        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/50" role="dialog" aria-modal="true">
            <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-[#1a1f24]">
              <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-[#2b3238]">
                <div className="text-xl font-bold text-[#FE5200]">YNOVA</div>
                <button onClick={() => setIsMobileMenuOpen(false)} aria-label="Fechar menu">
                  <X size={24} />
                </button>
              </div>
              <nav className="px-4 py-4 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-[#FE5200]/10 text-[#FE5200] border border-[#FE5200]/40 dark:bg-[#FE5200]/20 dark:text-[#FE5200] dark:border-[#FE5200]/40'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#1f252b]'
                        }`
                      }
                    >
                      <Icon size={20} className="mr-3" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-[#2b3238]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                >
                  <LogOut size={20} className="mr-3" />
                  Sair
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 md:ml-64">
          <div className="w-full max-w-screen-lg mx-auto px-4 overflow-x-hidden py-4 sm:py-6 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
