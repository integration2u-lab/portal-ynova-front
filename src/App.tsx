import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import { useTheme } from './hooks/useTheme';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
// import AgendaPage from './pages/AgendaPage';
// import ProposalsPage from './pages/ProposalsPage';
// import CommissionsPage from './pages/CommissionsPage';
// import ProfilePage from './pages/ProfilePage';
// import NotificationsPage from './pages/NotificationsPage';
import HelpPage from './pages/HelpPage';
import LoginPage from './pages/LoginPage';
import TrainingPage from './pages/TrainingPage';
import { apiRequest } from './utils/api';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Check if user is already authenticated on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token by calling /me endpoint
      apiRequest('/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            setIsAuthenticated(true);
            setUser(data.data);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('token');
          }
        })
        .catch(() => {
          // Token is invalid, remove it
          localStorage.removeItem('token');
        });
    }
  }, []);

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
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };

  return (
    <Routes>
      {isAuthenticated ? (
        <>
          <Route path="/" element={<Layout onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />}> 
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="leads" element={<LeadsPage />} />
            {/* <Route path="agenda" element={<AgendaPage />} /> */}
            {/* <Route path="proposals" element={<ProposalsPage />} /> */}
            {/* <Route path="commissions" element={<CommissionsPage />} /> */}
            {/* <Route path="profile" element={<ProfilePage />} /> */}
            <Route path="training" element={<TrainingPage />} />
            {/* <Route path="notifications" element={<NotificationsPage />} /> */}
            <Route path="help" element={<HelpPage />} />
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
  );
}
