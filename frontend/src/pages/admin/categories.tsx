import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { API_URL } from '../../config';
import type { Category } from '../../types';

function CategoriesAdminContent(): JSX.Element {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; category: Category | null }>({
    show: false,
    category: null,
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
      setLoading(true);
      const response = await fetch(`${API_URL}/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      showToast('Erro ao carregar categorias', 'error');
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

    if (!formData.name.trim()) {
      showToast('Digite o nome da categoria', 'error');
      return;
    }

    try {
      if (editingCategory) {
        // Update
        const response = await fetch(`${API_URL}/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error('Erro ao atualizar');

        const updatedCategory = await response.json();
        setCategories(categories.map((c) => (c.id === editingCategory.id ? updatedCategory : c)));
        showToast('Categoria atualizada!', 'success');
      } else {
        // Create
        const response = await fetch(`${API_URL}/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error('Erro ao criar');

        const newCategory = await response.json();
        setCategories([...categories, newCategory]);
        showToast('Categoria criada!', 'success');
      }

      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: '' });
    } catch (err) {
      showToast('Erro ao salvar categoria', 'error');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteModal.category) return;

    try {
      const response = await fetch(`${API_URL}/categories/${deleteModal.category.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar');
      }

      setCategories(categories.filter((c) => c.id !== deleteModal.category?.id));
      showToast('Categoria deletada!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao deletar', 'error');
    } finally {
      setDeleteModal({ show: false, category: null });
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: '' });
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
        <h1 className="admin-title">Categorias</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/admin" className="admin-btn admin-btn-secondary">
            Voltar
          </Link>
          {!showForm && (
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => setShowForm(true)}
            >
              + Nova Categoria
            </button>
          )}
        </div>
      </div>

        {showForm && (
          <form
            className="admin-form"
            onSubmit={handleSubmit}
            style={{ marginBottom: '2rem' }}
          >
            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="name">
                Nome da Categoria
              </label>
              <input
                id="name"
                type="text"
                className="admin-form-input"
                placeholder="Ex: Pagamentos"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                autoFocus
              />
            </div>
            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={handleCancel}
              >
                Cancelar
              </button>
              <button type="submit" className="admin-btn admin-btn-primary">
                {editingCategory ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="loading">
            <div className="loading-spinner" />
          </div>
        ) : categories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <p className="empty-state-text">Nenhuma categoria cadastrada</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Slug</th>
                <th style={{ width: '150px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <strong>{category.name}</strong>
                  </td>
                  <td>
                    <code style={{ fontSize: '0.85rem' }}>{category.slug}</code>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => handleEdit(category)}
                      >
                        Editar
                      </button>
                      <button
                        className="admin-btn admin-btn-danger"
                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => setDeleteModal({ show: true, category })}
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
          <div
            className="modal-overlay"
            onClick={() => setDeleteModal({ show: false, category: null })}
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">Confirmar exclusão</h3>
              <p className="modal-body">
                Tem certeza que deseja excluir a categoria "{deleteModal.category?.name}"?
                <br />
                <small style={{ color: 'var(--faq-text-muted)' }}>
                  Categorias com perguntas não podem ser excluídas.
                </small>
              </p>
              <div className="modal-actions">
                <button
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setDeleteModal({ show: false, category: null })}
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

export default function CategoriesAdmin(): JSX.Element {
  return (
    <Layout title="Categorias" description="Gerenciar categorias do FAQ">
      <BrowserOnly fallback={<div className="loading"><div className="loading-spinner" /></div>}>
        {() => <CategoriesAdminContent />}
      </BrowserOnly>
    </Layout>
  );
}
