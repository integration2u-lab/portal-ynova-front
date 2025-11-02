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
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import CrownIcon from './icons/CrownIcon';
import MultinivelIcon from './icons/MultinivelIcon';
import { User as UserType } from '../types';

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/negociacoes', label: 'Negociações', icon: Handshake },
  { to: '/multinivel', label: 'Multinível', icon: MultinivelIcon },
  //{ to: '/agenda', label: 'Agenda', icon: Calendar },
  //{ to: '/proposals', label: 'Propostas', icon: FileText },
  //{ to: '/commissions', label: 'Comissões', icon: DollarSign },
  { to: '/profile', label: 'Perfil', icon: User },
  { to: '/ranking', label: 'Ranking', icon: CrownIcon },
  { to: '/training', label: 'Treinamento para Consultor', icon: GraduationCap },
 // { to: '/notifications', label: 'Notificações', icon: Bell },
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
    // Navigate to negociacoes page first, then open modal
    navigate('/negociacoes');
    // Small delay to ensure page is loaded before opening modal
    setTimeout(() => {
      openModal('novo');
    }, 100);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900 dark:bg-[#111418] dark:text-gray-100 overflow-hidden">
      <header
        role="banner"
        className="flex-shrink-0 z-40 h-16 bg-[#FE5200] text-white shadow-sm px-4 md:px-6"
      >
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-2">
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
            <button
              className="hidden md:flex p-2 rounded-md text-white hover:text-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              aria-label={isSidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
            >
              {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button
              className="px-3 py-2 rounded-md text-white hover:text-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 flex items-center gap-2"
              aria-label="Enviar Fatura"
              onClick={handleAddNegociacao}
              title="Enviar Fatura"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Enviar Fatura</span>
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

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <aside className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 md:top-16 transition-all duration-300 ${
          isSidebarCollapsed ? 'md:w-16' : 'md:w-64'
        }`}>
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#1a1f24] border-r border-gray-200 dark:border-[#2b3238]">
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-hidden">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-2 text-sm font-medium rounded-lg transition-colors group relative ${
                        isActive
                          ? 'bg-[#FE5200]/10 text-[#FE5200] border border-[#FE5200]/40 dark:bg-[#FE5200]/20 dark:text-[#FE5200] dark:border-[#FE5200]/40'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#1f252b]'
                      }`
                    }
                    title={isSidebarCollapsed ? item.label : undefined}
                  >
                    <Icon size={20} className={isSidebarCollapsed ? '' : 'mr-3'} />
                    {!isSidebarCollapsed && <span>{item.label}</span>}
                    {isSidebarCollapsed && (
                      <span className="absolute left-full ml-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                        {item.label}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
            <div className={`border-t border-gray-200 dark:border-[#2b3238] ${isSidebarCollapsed ? 'p-2' : 'p-4'} flex-shrink-0`}>
              <button
                onClick={handleLogout}
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors group relative`}
                title={isSidebarCollapsed ? 'Sair' : undefined}
              >
                <LogOut size={20} className={isSidebarCollapsed ? '' : 'mr-3'} />
                {!isSidebarCollapsed && <span>Sair</span>}
                {isSidebarCollapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                    Sair
                  </span>
                )}
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

        <main className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
          <div className="flex-1 flex flex-col min-h-0 w-full max-w-[115rem] mx-auto px-4 sm:px-6 lg:px-10 overflow-x-hidden py-4 sm:py-6 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
