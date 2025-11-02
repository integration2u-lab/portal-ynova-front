import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import { useTheme } from './hooks/useTheme';
import { AddNegociacaoProvider } from './contexts/AddNegociacaoContext';
import { UserProvider } from './contexts/UserContext';
import DashboardPage from './pages/DashboardPage';
// import AgendaPage from './pages/AgendaPage';
// import ProposalsPage from './pages/ProposalsPage';
import CommissionsPage from './pages/CommissionsPage';
import ProfilePage from './pages/ProfilePage';
import RankingPage from "./pages/RankingPage"; // ajuste o caminho conforme sua estrutura
// import NotificationsPage from './pages/NotificationsPage';
import HelpPage from './pages/HelpPage';
import LoginPage from './pages/LoginPage';
import TrainingPage from './pages/TrainingPage';
import MultinivelPage from './pages/MultinivelPage';
import { apiRequest } from './utils/api';
import { User } from './types';
import Negociacoes from './pages/Negociacoes';
// const Negociacoes = lazy(() => import('./pages/Negociacoes'));


export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    if (storedAuth !== null) {
      return storedAuth === 'true';
    }
    return !!localStorage.getItem('token');
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as User;
    } catch (err) {
      console.error('Failed to parse stored user', err);
      localStorage.removeItem('user');
      return null;
    }
  });
  const [isCheckingAuth, setIsCheckingAuth] = useState(() => !!localStorage.getItem('token'));
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Check if user is already authenticated on app load
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      setIsCheckingAuth(false);
      return;
    }

    apiRequest('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setIsAuthenticated(true);
          localStorage.setItem('isAuthenticated', 'true');
          setUser(data.data);
          localStorage.setItem('user', JSON.stringify(data.data));
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setUser(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('isAuthenticated', 'true');
    } else {
      localStorage.removeItem('isAuthenticated');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const handleLogin = async (
    e: React.FormEvent,
    email: string,
    password: string
  ) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user data
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(data.data.user));
        setUser(data.data.user);
        setIsAuthenticated(true);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Credenciais inválidas');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        Verificando sessão...
      </div>
    );
  }

  return (
    <UserProvider user={user}>
      <AddNegociacaoProvider>
        <Routes>
          {isAuthenticated ? (
            <>
              <Route path="/" element={<Layout onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} user={user} />}> 
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="negociacoes" element={<Negociacoes />} />
                {/* <Route path="agenda" element={<AgendaPage />} /> */}
                {/* <Route path="proposals" element={<ProposalsPage />} /> */}
                <Route path="commissions" element={<CommissionsPage />} /> 
                <Route path="profile" element={<ProfilePage user={user} onUserUpdate={setUser} />} />
                <Route path="ranking" element={<RankingPage />} />
                <Route path="training" element={<TrainingPage />} />
                <Route path="multinivel" element={<MultinivelPage />} />
                {/* <Route path="notifications" element={<NotificationsPage />} /> */}
                <Route path="help" element={<HelpPage />} />
                {/*
                <Route
                  path="negociacoes"
                  element={
                    <Suspense fallback={null}>
                      <Negociacoes />
                    </Suspense>
                  }
                />
                */}
              </Route>
              <Route path="/login" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          ) : (
            <>
              <Route
                path="/login"
                element={
                  <LoginPage
                    onLogin={handleLogin}
                    isLoading={isLoading}
                    error={error}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          )}
        </Routes>
      </AddNegociacaoProvider>
    </UserProvider>
  );
}
