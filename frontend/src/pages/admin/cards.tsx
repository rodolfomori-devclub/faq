import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { API_URL } from '../../config';
import type { FeaturedCard } from '../../types';

const AVAILABLE_ICONS = [
  { value: 'settings', label: 'Configurações' },
  { value: 'wallet', label: 'Carteira' },
  { value: 'shield', label: 'Escudo' },
  { value: 'star', label: 'Estrela' },
  { value: 'book', label: 'Livro' },
  { value: 'users', label: 'Usuários' },
  { value: 'code', label: 'Código' },
  { value: 'rocket', label: 'Foguete' },
  { value: 'help', label: 'Ajuda' },
  { value: 'play', label: 'Play' },
  { value: 'graduation', label: 'Graduação' },
  { value: 'briefcase', label: 'Trabalho' },
];

const PRESET_COLORS = [
  { value: '#10b981', label: 'Verde' },
  { value: '#6366f1', label: 'Roxo' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#f59e0b', label: 'Amarelo' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#8b5cf6', label: 'Violeta' },
  { value: '#14b8a6', label: 'Teal' },
];

function CardsAdminContent(): JSX.Element {
  const [cards, setCards] = useState<FeaturedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<FeaturedCard | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'star',
    link: '',
    color: '#10b981',
  });
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/featured-cards`);
      const data = await response.json();
      // Garantir que data é um array
      setCards(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast('Erro ao carregar cards', 'error');
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const openModal = (card?: FeaturedCard) => {
    if (card) {
      setEditingCard(card);
      setFormData({
        title: card.title,
        description: card.description,
        icon: card.icon,
        link: card.link,
        color: card.color,
      });
    } else {
      setEditingCard(null);
      setFormData({
        title: '',
        description: '',
        icon: 'star',
        link: '',
        color: '#10b981',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCard(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      showToast('Preencha título e descrição', 'error');
      return;
    }

    setSaving(true);

    try {
      const url = editingCard
        ? `${API_URL}/featured-cards/${editingCard.id}`
        : `${API_URL}/featured-cards`;

      const response = await fetch(url, {
        method: editingCard ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erro ao salvar');

      showToast(editingCard ? 'Card atualizado!' : 'Card criado!', 'success');
      closeModal();
      fetchCards();
    } catch (err) {
      showToast('Erro ao salvar card', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este card?')) return;

    try {
      const response = await fetch(`${API_URL}/featured-cards/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao excluir');

      showToast('Card excluído!', 'success');
      fetchCards();
    } catch (err) {
      showToast('Erro ao excluir card', 'error');
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
        <div>
          <h1 className="admin-title">Cards em Destaque</h1>
          <p className="admin-subtitle">Gerencie os cards de destaque da página inicial</p>
        </div>
        <div className="admin-header-actions">
          <a href="/admin" className="admin-btn admin-btn-secondary">
            Voltar
          </a>
          <button className="admin-btn admin-btn-primary" onClick={() => openModal()}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Novo Card
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="cards-admin-grid">
        {cards.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum card em destaque cadastrado.</p>
            <button className="admin-btn admin-btn-primary" onClick={() => openModal()}>
              Criar primeiro card
            </button>
          </div>
        ) : (
          cards.map((card) => (
            <div key={card.id} className="card-admin-item" style={{ '--card-color': card.color } as React.CSSProperties}>
              <div className="card-admin-icon" style={{ backgroundColor: `${card.color}20`, color: card.color }}>
                <span>{AVAILABLE_ICONS.find(i => i.value === card.icon)?.label || card.icon}</span>
              </div>
              <div className="card-admin-content">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <span className="card-admin-link">{card.link || 'Sem link'}</span>
              </div>
              <div className="card-admin-actions">
                <button
                  className="admin-btn-icon"
                  onClick={() => openModal(card)}
                  title="Editar"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  className="admin-btn-icon admin-btn-danger"
                  onClick={() => handleDelete(card.id)}
                  title="Excluir"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCard ? 'Editar Card' : 'Novo Card'}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label className="admin-form-label">Título</label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="Ex: Configurações de Conta"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Descrição</label>
                <textarea
                  className="admin-form-textarea"
                  placeholder="Descreva o que o usuário encontrará..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Link</label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="Ex: /categoria/configuracoes ou https://..."
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Ícone</label>
                  <select
                    className="admin-form-select"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  >
                    {AVAILABLE_ICONS.map((icon) => (
                      <option key={icon.value} value={icon.value}>
                        {icon.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Cor</label>
                  <div className="color-picker">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={`color-option ${formData.color === color.value ? 'active' : ''}`}
                        style={{ backgroundColor: color.value }}
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="card-preview">
                <label className="admin-form-label">Preview</label>
                <div
                  className="preview-card"
                  style={{ '--card-color': formData.color } as React.CSSProperties}
                >
                  <div
                    className="preview-card-icon"
                    style={{ backgroundColor: `${formData.color}20`, color: formData.color }}
                  >
                    {AVAILABLE_ICONS.find(i => i.value === formData.icon)?.label?.[0] || '★'}
                  </div>
                  <h4>{formData.title || 'Título do Card'}</h4>
                  <p>{formData.description || 'Descrição do card aparecerá aqui...'}</p>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  {saving ? 'Salvando...' : editingCard ? 'Salvar Alterações' : 'Criar Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}

      <style>{`
        .cards-admin-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .card-admin-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: var(--ifm-background-color);
          border: 1px solid var(--faq-border-color);
          border-radius: 10px;
          transition: all 0.2s;
        }

        .card-admin-item:hover {
          border-color: var(--card-color);
        }

        .card-admin-icon {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        .card-admin-content {
          flex: 1;
          min-width: 0;
        }

        .card-admin-content h3 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.25rem;
          color: var(--ifm-font-color-base);
        }

        .card-admin-content p {
          font-size: 0.875rem;
          color: var(--faq-text-muted);
          margin: 0 0 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-admin-link {
          font-size: 0.75rem;
          color: var(--ifm-color-primary);
        }

        .card-admin-actions {
          display: flex;
          gap: 0.5rem;
        }

        .admin-btn-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid var(--faq-border-color);
          background: var(--ifm-background-color);
          color: var(--faq-text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .admin-btn-icon:hover {
          border-color: var(--ifm-color-primary);
          color: var(--ifm-color-primary);
        }

        .admin-btn-icon.admin-btn-danger:hover {
          border-color: #ef4444;
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: var(--faq-text-muted);
        }

        .empty-state button {
          margin-top: 1rem;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-content {
          background: var(--ifm-background-color);
          border-radius: 12px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--faq-border-color);
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.25rem;
        }

        .modal-close {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: transparent;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--faq-text-muted);
        }

        .modal-close:hover {
          background: var(--ifm-background-surface-color);
        }

        .modal-content form {
          padding: 1.5rem;
        }

        .modal-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--faq-border-color);
        }

        .admin-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .admin-form-textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid var(--faq-border-color);
          border-radius: 8px;
          font-size: 0.9375rem;
          background: var(--ifm-background-color);
          color: var(--ifm-font-color-base);
          resize: vertical;
          font-family: inherit;
        }

        .admin-form-textarea:focus {
          outline: none;
          border-color: var(--ifm-color-primary);
        }

        .color-picker {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .color-option {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
        }

        .color-option:hover {
          transform: scale(1.1);
        }

        .color-option.active {
          border-color: var(--ifm-font-color-base);
          box-shadow: 0 0 0 2px var(--ifm-background-color);
        }

        .card-preview {
          margin-top: 1rem;
        }

        .preview-card {
          padding: 1rem;
          border: 1px solid var(--faq-border-color);
          border-radius: 10px;
          margin-top: 0.5rem;
        }

        .preview-card-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          margin-bottom: 0.75rem;
        }

        .preview-card h4 {
          font-size: 1rem;
          margin: 0 0 0.25rem;
          color: var(--ifm-font-color-base);
        }

        .preview-card p {
          font-size: 0.875rem;
          color: var(--faq-text-muted);
          margin: 0;
        }

        @media (max-width: 640px) {
          .card-admin-item {
            flex-wrap: wrap;
          }

          .card-admin-content {
            width: 100%;
            order: 2;
          }

          .card-admin-actions {
            order: 1;
          }

          .admin-form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default function CardsAdmin(): JSX.Element {
  return (
    <Layout title="Cards em Destaque" description="Gerenciar cards em destaque">
      <BrowserOnly fallback={<div className="loading"><div className="loading-spinner" /></div>}>
        {() => <CardsAdminContent />}
      </BrowserOnly>
    </Layout>
  );
}
