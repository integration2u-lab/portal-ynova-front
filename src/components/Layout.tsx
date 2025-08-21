import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
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
} from 'lucide-react';
import { mockUser } from '../data/mockData';

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/leads', label: 'Leads', icon: UserCheck },
  { to: '/agenda', label: 'Agenda', icon: Calendar },
  { to: '/proposals', label: 'Propostas', icon: FileText },
  { to: '/commissions', label: 'Comissões', icon: DollarSign },
  { to: '/profile', label: 'Perfil', icon: User },
  { to: '/training', label: 'Treinamento para Consultor', icon: GraduationCap },
  { to: '/notifications', label: 'Notificações', icon: Bell },
  { to: '/help', label: 'Ajuda', icon: HelpCircle },
];

interface LayoutProps {
  onLogout: () => void;
}

export default function Layout({ onLogout }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggleTheme = () =>
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const user = mockUser;

  const handleLogout = () => {
    onLogout();
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#1E1E1E] dark:text-gray-100">
      <header className="bg-white dark:bg-[#3E3E3E] shadow-sm border-b border-gray-200 dark:border-[#1E1E1E]">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Abrir menu"
              >
                <Menu size={24} />
              </button>
              <div className="text-xl font-bold text-[#FE5200] ml-2 md:ml-0">YNOVA</div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative" ref={notifRef}>
                <button
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  aria-label="Notificações"
                  onClick={() => setShowNotifications((p) => !p)}
                >
                  <Bell size={20} />
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#3E3E3E] border border-gray-200 dark:border-[#1E1E1E] rounded-lg shadow-lg p-4 text-sm text-gray-700 dark:text-gray-200">
                    <ul className="space-y-2">
                      <li>Verifique seu e-mail</li>
                      <li>Nova mensagem da gestão</li>
                      <li>Duas reuniões perdidas</li>
                    </ul>
                  </div>
                )}
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={theme === 'dark'}
                  onChange={toggleTheme}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FE5200]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FE5200]"></div>
              </label>
              <div className="flex items-center space-x-2">
                <div
                  className="w-8 h-8 bg-[#FE5200] rounded-full flex items-center justify-center"
                  aria-hidden
                >
                  <span className="text-white text-sm font-medium">
                    {user.name.split(' ').map((n) => n[0]).join('')}
                  </span>
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200">
                  {user.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:top-16">
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#3E3E3E] border-r border-gray-200 dark:border-[#1E1E1E]">
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
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#1E1E1E]'
                      }`
                    }
                  >
                    <Icon size={20} className="mr-3" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-[#1E1E1E]">
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
            <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-[#3E3E3E]">
              <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-[#1E1E1E]">
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
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#1E1E1E]'
                        }`
                      }
                    >
                      <Icon size={20} className="mr-3" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-[#1E1E1E]">
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
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
