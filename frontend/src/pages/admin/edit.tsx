import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import { useHistory, useLocation } from '@docusaurus/router';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { API_URL } from '../../config';
import type { Category, FAQ } from '../../types';

function EditFAQContent(): JSX.Element {
  const history = useHistory();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const faqId = searchParams.get('id');

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    if (!faqId) {
      history.push('/admin');
      return;
    }
    fetchData();
    // Dynamic import do editor para evitar SSR issues
    import('../../components/RichTextEditor').then((module) => {
      setRichTextEditor(() => module.default);
    });
  }, [faqId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [faqRes, categoriesRes] = await Promise.all([
        fetch(`${API_URL}/faqs/${faqId}`),
        fetch(`${API_URL}/categories`),
      ]);

      if (!faqRes.ok) throw new Error('FAQ não encontrado');

      const faqData: FAQ = await faqRes.json();
      const categoriesData = await categoriesRes.json();

      setCategories(categoriesData);
      setFormData({
        categoryId: faqData.categoryId,
        question: faqData.question,
        answer: faqData.answer,
      });
    } catch (err) {
      showToast('Erro ao carregar dados', 'error');
      setTimeout(() => history.push('/admin'), 2000);
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

    if (!formData.categoryId || !formData.question || !formData.answer) {
      showToast('Preencha todos os campos', 'error');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/faqs/${faqId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erro ao atualizar FAQ');

      showToast('FAQ atualizado com sucesso!', 'success');
      setTimeout(() => history.push('/admin'), 1000);
    } catch (err) {
      showToast('Erro ao atualizar FAQ', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
        <h1 className="admin-title">Editar Pergunta</h1>
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
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
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

export default function EditFAQ(): JSX.Element {
  return (
    <Layout title="Editar Pergunta" description="Editar pergunta do FAQ">
      <BrowserOnly fallback={<div className="loading"><div className="loading-spinner" /></div>}>
        {() => <EditFAQContent />}
      </BrowserOnly>
    </Layout>
  );
}
