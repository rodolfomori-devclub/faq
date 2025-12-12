import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { API_URL } from '../../config';

interface Settings {
  supportLink: string;
  supportLabel: string;
}

function SettingsAdminContent(): JSX.Element {
  const [settings, setSettings] = useState<Settings>({
    supportLink: '',
    supportLabel: 'Suporte'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const token = localStorage.getItem('faq_admin_token');

    if (!token) {
      window.location.href = '/admin/login';
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setIsAuthorized(true);
        fetchSettings();
      } else {
        localStorage.removeItem('faq_admin_token');
        window.location.href = '/admin/login';
      }
    } catch (error) {
      window.location.href = '/admin/login';
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/settings`);
      const data = await response.json();
      setSettings({
        supportLink: data.supportLink || '',
        supportLabel: data.supportLabel || 'Suporte'
      });
    } catch (err) {
      showToast('Erro ao carregar configurações', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('faq_admin_token');
      const response = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) throw new Error('Erro ao salvar');

      showToast('Configurações salvas com sucesso!', 'success');
    } catch (err) {
      showToast('Erro ao salvar configurações', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="admin-container">
        <div className="loading">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title">Configurações</h1>
        <Link to="/admin" className="admin-btn admin-btn-secondary">
          Voltar
        </Link>
      </div>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner" />
        </div>
      ) : (
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="supportLabel">
              Texto do botão de Suporte
            </label>
            <input
              type="text"
              id="supportLabel"
              className="admin-form-input"
              value={settings.supportLabel}
              onChange={(e) => setSettings({ ...settings, supportLabel: e.target.value })}
              placeholder="Ex: Suporte"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="supportLink">
              Link do Suporte
            </label>
            <input
              type="url"
              id="supportLink"
              className="admin-form-input"
              value={settings.supportLink}
              onChange={(e) => setSettings({ ...settings, supportLink: e.target.value })}
              placeholder="https://exemplo.com/suporte"
            />
            <small style={{ color: 'var(--faq-text-muted)', marginTop: '0.5rem', display: 'block' }}>
              Este link aparece na barra de navegação do site
            </small>
          </div>

          <div className="admin-form-actions">
            <Link to="/admin" className="admin-btn admin-btn-secondary">
              Cancelar
            </Link>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      {toast.show && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}

export default function SettingsAdmin(): JSX.Element {
  return (
    <Layout title="Configurações" description="Configurações do site">
      <BrowserOnly fallback={<div className="loading"><div className="loading-spinner" /></div>}>
        {() => <SettingsAdminContent />}
      </BrowserOnly>
    </Layout>
  );
}
