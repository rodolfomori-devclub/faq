import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import { useHistory } from '@docusaurus/router';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { API_URL } from '../../config';
import type { Category } from '../../types';

function CreateFAQContent(): JSX.Element {
  const history = useHistory();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [RichTextEditor, setRichTextEditor] = useState<any>(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    question: '',
    answer: '',
  });
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
        fetchCategories();
        // Dynamic import do editor para evitar SSR issues
        import('../../components/RichTextEditor').then((module) => {
          setRichTextEditor(() => module.default);
        });
      } else {
        localStorage.removeItem('faq_admin_token');
        window.location.href = '/admin/login';
      }
    } catch (error) {
      window.location.href = '/admin/login';
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`);
      const data = await response.json();
      setCategories(data);
      if (data.length > 0) {
        setFormData((prev) => ({ ...prev, categoryId: data[0].id }));
      }
    } catch (err) {
      showToast('Erro ao carregar categorias', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoryId || !formData.question || !formData.answer) {
      showToast('Preencha todos os campos', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/faqs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erro ao criar FAQ');

      showToast('FAQ criado com sucesso!', 'success');
      setTimeout(() => history.push('/admin'), 1000);
    } catch (err) {
      showToast('Erro ao criar FAQ', 'error');
    } finally {
      setLoading(false);
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
        <h1 className="admin-title">Nova Pergunta</h1>
      </div>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-group">
          <label className="admin-form-label" htmlFor="category">
            Categoria
          </label>
          <select
            id="category"
            className="admin-form-select"
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            required
          >
            <option value="">Selecione uma categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-form-group">
          <label className="admin-form-label" htmlFor="question">
            Pergunta
          </label>
          <input
            id="question"
            type="text"
            className="admin-form-input"
            placeholder="Ex: Como acesso a plataforma?"
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            required
          />
        </div>

        <div className="admin-form-group">
          <label className="admin-form-label">
            Resposta
          </label>
          {RichTextEditor ? (
            <RichTextEditor
              content={formData.answer}
              onChange={(content: string) => setFormData({ ...formData, answer: content })}
              placeholder="Escreva a resposta completa aqui..."
            />
          ) : (
            <div className="loading" style={{ minHeight: '300px' }}>
              <div className="loading-spinner" />
            </div>
          )}
        </div>

        <div className="admin-form-actions">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => history.push('/admin')}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Criar Pergunta'}
          </button>
        </div>
      </form>

      {/* Toast */}
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}

export default function CreateFAQ(): JSX.Element {
  return (
    <Layout title="Nova Pergunta" description="Criar nova pergunta no FAQ">
      <BrowserOnly fallback={<div className="loading"><div className="loading-spinner" /></div>}>
        {() => <CreateFAQContent />}
      </BrowserOnly>
    </Layout>
  );
}
