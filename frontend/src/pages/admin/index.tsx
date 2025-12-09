import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { API_URL } from '../../config';
import type { Category, FAQ } from '../../types';

interface FAQWithCategory extends FAQ {
  categoryName?: string;
}

function AdminDashboardContent(): JSX.Element {
  const [faqs, setFaqs] = useState<FAQWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; faq: FAQ | null }>({
    show: false,
    faq: null,
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
        fetchData();
      } else {
        localStorage.removeItem('faq_admin_token');
        window.location.href = '/admin/login';
      }
    } catch (error) {
      window.location.href = '/admin/login';
    }
  };

  const handleLogout = () => {
    const token = localStorage.getItem('faq_admin_token');
    if (token) {
      fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(console.error);
    }
    localStorage.removeItem('faq_admin_token');
    window.location.href = '/admin/login';
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [faqsRes, categoriesRes] = await Promise.all([
        fetch(`${API_URL}/faqs`),
        fetch(`${API_URL}/categories`),
      ]);

      const faqsData = await faqsRes.json();
      const categoriesData = await categoriesRes.json();

      setCategories(categoriesData);

      const faqsWithCategory = faqsData.map((faq: FAQ) => ({
        ...faq,
        categoryName: categoriesData.find((c: Category) => c.id === faq.categoryId)?.name || 'Sem categoria',
      }));

      setFaqs(faqsWithCategory);
    } catch (err) {
      showToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleDelete = async () => {
    if (!deleteModal.faq) return;

    try {
      const response = await fetch(`${API_URL}/faqs/${deleteModal.faq.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao deletar');

      setFaqs(faqs.filter((f) => f.id !== deleteModal.faq?.id));
      showToast('FAQ deletado com sucesso!', 'success');
    } catch (err) {
      showToast('Erro ao deletar FAQ', 'error');
    } finally {
      setDeleteModal({ show: false, faq: null });
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
        <h1 className="admin-title">Gerenciar FAQ</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link to="/admin/cards" className="admin-btn admin-btn-secondary">
            Cards Destaque
          </Link>
          <Link to="/admin/categories" className="admin-btn admin-btn-secondary">
            Categorias
          </Link>
          <Link to="/admin/footer" className="admin-btn admin-btn-secondary">
            Footer
          </Link>
          <Link to="/admin/create" className="admin-btn admin-btn-primary">
            + Nova Pergunta
          </Link>
          <button onClick={handleLogout} className="admin-btn admin-btn-danger">
            Sair
          </button>
        </div>
      </div>

        {loading ? (
          <div className="loading">
            <div className="loading-spinner" />
          </div>
        ) : faqs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <p className="empty-state-text">Nenhuma pergunta cadastrada ainda</p>
            <Link
              to="/admin/create"
              className="admin-btn admin-btn-primary"
              style={{ marginTop: '1rem' }}
            >
              Criar primeira pergunta
            </Link>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Pergunta</th>
                <th>Categoria</th>
                <th style={{ width: '150px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((faq) => (
                <tr key={faq.id}>
                  <td>
                    <strong>{faq.question}</strong>
                    <p
                      style={{
                        margin: '0.25rem 0 0',
                        fontSize: '0.875rem',
                        color: 'var(--faq-text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '500px',
                      }}
                    >
                      {faq.answer}
                    </p>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        background: 'var(--ifm-color-primary-lightest)',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}
                    >
                      {faq.categoryName}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link
                        to={`/admin/edit?id=${faq.id}`}
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        Editar
                      </Link>
                      <button
                        className="admin-btn admin-btn-danger"
                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => setDeleteModal({ show: true, faq })}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Delete Modal */}
        {deleteModal.show && (
          <div className="modal-overlay" onClick={() => setDeleteModal({ show: false, faq: null })}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">Confirmar exclusão</h3>
              <p className="modal-body">
                Tem certeza que deseja excluir a pergunta "{deleteModal.faq?.question}"?
              </p>
              <div className="modal-actions">
                <button
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setDeleteModal({ show: false, faq: null })}
                >
                  Cancelar
                </button>
                <button className="admin-btn admin-btn-danger" onClick={handleDelete}>
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Toast */}
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}

export default function AdminDashboard(): JSX.Element {
  return (
    <Layout title="Admin" description="Painel administrativo do FAQ">
      <BrowserOnly fallback={<div className="loading"><div className="loading-spinner" /></div>}>
        {() => <AdminDashboardContent />}
      </BrowserOnly>
    </Layout>
  );
}
