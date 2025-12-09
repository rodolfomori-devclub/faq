import React, { useEffect, useState, ReactNode } from 'react';
import { API_URL } from '../config';

interface AdminGuardProps {
  children: ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps): JSX.Element {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('faq_admin_token');

    if (!token) {
      redirectToLogin();
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setIsAuthorized(true);
      } else {
        localStorage.removeItem('faq_admin_token');
        redirectToLogin();
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      redirectToLogin();
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToLogin = () => {
    window.location.href = '/admin/login';
  };

  if (isLoading) {
    return (
      <div className="admin-guard-loading">
        <div className="loading">
          <div className="loading-spinner" />
        </div>
        <p>Verificando autenticação...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="admin-guard-loading">
        <div className="loading">
          <div className="loading-spinner" />
        </div>
        <p>Redirecionando para login...</p>
      </div>
    );
  }

  return <>{children}</>;
}

// Hook para obter o token de autenticação
export function useAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('faq_admin_token');
  }
  return null;
}

// Função para fazer logout
export function logout(): void {
  const token = localStorage.getItem('faq_admin_token');

  if (token) {
    fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).catch(console.error);
  }

  localStorage.removeItem('faq_admin_token');
  window.location.href = '/admin/login';
}
