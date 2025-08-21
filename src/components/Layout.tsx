import React, { useState } from 'react';
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
  { to: '/training', label: 'Consultant Training', icon: GraduationCap },
  { to: '/notifications', label: 'Notificações', icon: Bell },
  { to: '/help', label: 'Ajuda', icon: HelpCircle },
];

interface LayoutProps {
  onLogout: () => void;
}

export default function Layout({ onLogout }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = mockUser;

  const handleLogout = () => {
    onLogout();
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Abrir menu"
              >
                <Menu size={24} />
              </button>
              <div className="text-xl font-bold text-orange-500 ml-2 md:ml-0">YNOVA</div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                className="p-2 text-gray-600 hover:text-gray-900"
                aria-label="Notificações"
              >
                <Bell size={20} />
              </button>
              <div className="flex items-center space-x-2">
                <div
                  className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center"
                  aria-hidden
                >
                  <span className="text-white text-sm font-medium">
                    {user.name.split(' ').map((n) => n[0]).join('')}
                  </span>
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:top-16">
          <div className="flex-1 flex flex-col min-h-0 bg-white border-r">
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
                          ? 'bg-orange-50 text-orange-600 border border-orange-200'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`
                    }
                  >
                    <Icon size={20} className="mr-3" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
            <div className="p-4 border-t">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={20} className="mr-3" />
                Sair
              </button>
            </div>
          </div>
        </aside>

        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/50" role="dialog" aria-modal="true">
            <div className="fixed inset-y-0 left-0 w-64 bg-white">
              <div className="flex items-center justify-between h-16 px-4 border-b">
                <div className="text-xl font-bold text-orange-500">YNOVA</div>
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
                            ? 'bg-orange-50 text-orange-600 border border-orange-200'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`
                      }
                    >
                      <Icon size={20} className="mr-3" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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
