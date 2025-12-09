import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { API_URL } from '../../config';
import type { FooterSection, FooterLinkItem } from '../../types';

function FooterAdminContent(): JSX.Element {
  const [sections, setSections] = useState<FooterSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [editingSection, setEditingSection] = useState<FooterSection | null>(null);
  const [sectionFormData, setSectionFormData] = useState({ title: '' });
  const [showLinkForm, setShowLinkForm] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<{ sectionId: string; link: FooterLinkItem } | null>(null);
  const [linkFormData, setLinkFormData] = useState({ label: '', href: '' });
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    type: 'section' | 'link';
    section: FooterSection | null;
    link?: FooterLinkItem;
  }>({
    show: false,
    type: 'section',
    section: null,
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
        fetchSections();
      } else {
        localStorage.removeItem('faq_admin_token');
        window.location.href = '/admin/login';
      }
    } catch (error) {
      window.location.href = '/admin/login';
    }
  };

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/footer-links`);
      const data = await response.json();
      setSections(data);
    } catch (err) {
      showToast('Erro ao carregar seções do footer', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Section handlers
  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sectionFormData.title.trim()) {
      showToast('Digite o título da seção', 'error');
      return;
    }

    try {
      if (editingSection) {
        const response = await fetch(`${API_URL}/footer-links/${editingSection.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sectionFormData),
        });

        if (!response.ok) throw new Error('Erro ao atualizar');

        const updatedSection = await response.json();
        setSections(sections.map((s) => (s.id === editingSection.id ? { ...s, ...updatedSection } : s)));
        showToast('Seção atualizada!', 'success');
      } else {
        const response = await fetch(`${API_URL}/footer-links`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sectionFormData),
        });

        if (!response.ok) throw new Error('Erro ao criar');

        const newSection = await response.json();
        setSections([...sections, newSection]);
        showToast('Seção criada!', 'success');
      }

      setShowSectionForm(false);
      setEditingSection(null);
      setSectionFormData({ title: '' });
    } catch (err) {
      showToast('Erro ao salvar seção', 'error');
    }
  };

  const handleEditSection = (section: FooterSection) => {
    setEditingSection(section);
    setSectionFormData({ title: section.title });
    setShowSectionForm(true);
  };

  const handleDeleteSection = async () => {
    if (!deleteModal.section) return;

    try {
      const response = await fetch(`${API_URL}/footer-links/${deleteModal.section.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao deletar');

      setSections(sections.filter((s) => s.id !== deleteModal.section?.id));
      showToast('Seção deletada!', 'success');
    } catch (err) {
      showToast('Erro ao deletar seção', 'error');
    } finally {
      setDeleteModal({ show: false, type: 'section', section: null });
    }
  };

  // Link handlers
  const handleLinkSubmit = async (e: React.FormEvent, sectionId: string) => {
    e.preventDefault();

    if (!linkFormData.label.trim() || !linkFormData.href.trim()) {
      showToast('Preencha todos os campos', 'error');
      return;
    }

    try {
      if (editingLink) {
        const response = await fetch(`${API_URL}/footer-links/${sectionId}/items/${editingLink.link.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(linkFormData),
        });

        if (!response.ok) throw new Error('Erro ao atualizar');

        const updatedLink = await response.json();
        setSections(sections.map((s) => {
          if (s.id === sectionId) {
            return {
              ...s,
              items: s.items.map((item) => (item.id === editingLink.link.id ? updatedLink : item))
            };
          }
          return s;
        }));
        showToast('Link atualizado!', 'success');
      } else {
        const response = await fetch(`${API_URL}/footer-links/${sectionId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(linkFormData),
        });

        if (!response.ok) throw new Error('Erro ao criar');

        const newLink = await response.json();
        setSections(sections.map((s) => {
          if (s.id === sectionId) {
            return { ...s, items: [...(s.items || []), newLink] };
          }
          return s;
        }));
        showToast('Link criado!', 'success');
      }

      setShowLinkForm(null);
      setEditingLink(null);
      setLinkFormData({ label: '', href: '' });
    } catch (err) {
      showToast('Erro ao salvar link', 'error');
    }
  };

  const handleEditLink = (sectionId: string, link: FooterLinkItem) => {
    setEditingLink({ sectionId, link });
    setLinkFormData({ label: link.label, href: link.href });
    setShowLinkForm(sectionId);
  };

  const handleDeleteLink = async () => {
    if (!deleteModal.section || !deleteModal.link) return;

    try {
      const response = await fetch(`${API_URL}/footer-links/${deleteModal.section.id}/items/${deleteModal.link.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao deletar');

      setSections(sections.map((s) => {
        if (s.id === deleteModal.section?.id) {
          return { ...s, items: s.items.filter((item) => item.id !== deleteModal.link?.id) };
        }
        return s;
      }));
      showToast('Link deletado!', 'success');
    } catch (err) {
      showToast('Erro ao deletar link', 'error');
    } finally {
      setDeleteModal({ show: false, type: 'section', section: null });
    }
  };

  const handleCancelSection = () => {
    setShowSectionForm(false);
    setEditingSection(null);
    setSectionFormData({ title: '' });
  };

  const handleCancelLink = () => {
    setShowLinkForm(null);
    setEditingLink(null);
    setLinkFormData({ label: '', href: '' });
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
        <h1 className="admin-title">Links do Footer</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/admin" className="admin-btn admin-btn-secondary">
            Voltar
          </Link>
          {!showSectionForm && (
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => setShowSectionForm(true)}
            >
              + Nova Seção
            </button>
          )}
        </div>
      </div>

      {showSectionForm && (
        <form
          className="admin-form"
          onSubmit={handleSectionSubmit}
          style={{ marginBottom: '2rem' }}
        >
          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="sectionTitle">
              Título da Seção
            </label>
            <input
              id="sectionTitle"
              type="text"
              className="admin-form-input"
              placeholder="Ex: Links, Comunidade"
              value={sectionFormData.title}
              onChange={(e) => setSectionFormData({ title: e.target.value })}
              autoFocus
            />
          </div>
          <div className="admin-form-actions">
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={handleCancelSection}
            >
              Cancelar
            </button>
            <button type="submit" className="admin-btn admin-btn-primary">
              {editingSection ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading">
          <div className="loading-spinner" />
        </div>
      ) : sections.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔗</div>
          <p className="empty-state-text">Nenhuma seção cadastrada</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {sections.map((section) => (
            <div key={section.id} className="admin-card" style={{
              background: 'var(--ifm-card-background-color)',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '1px solid var(--ifm-color-emphasis-200)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{section.title}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="admin-btn admin-btn-secondary"
                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => handleEditSection(section)}
                  >
                    Editar
                  </button>
                  <button
                    className="admin-btn admin-btn-danger"
                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => setDeleteModal({ show: true, type: 'section', section })}
                  >
                    Excluir
                  </button>
                </div>
              </div>

              {/* Links da seção */}
              {section.items && section.items.length > 0 ? (
                <table className="admin-table" style={{ marginBottom: '1rem' }}>
                  <thead>
                    <tr>
                      <th>Label</th>
                      <th>URL</th>
                      <th style={{ width: '150px' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.items.map((item) => (
                      <tr key={item.id}>
                        <td><strong>{item.label}</strong></td>
                        <td>
                          <a href={item.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: 'var(--ifm-color-primary)' }}>
                            {item.href}
                          </a>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="admin-btn admin-btn-secondary"
                              style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}
                              onClick={() => handleEditLink(section.id, item)}
                            >
                              Editar
                            </button>
                            <button
                              className="admin-btn admin-btn-danger"
                              style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}
                              onClick={() => setDeleteModal({ show: true, type: 'link', section, link: item })}
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: 'var(--faq-text-muted)', marginBottom: '1rem' }}>Nenhum link nesta seção</p>
              )}

              {/* Formulário de adicionar/editar link */}
              {showLinkForm === section.id ? (
                <form
                  onSubmit={(e) => handleLinkSubmit(e, section.id)}
                  style={{
                    background: 'var(--ifm-color-emphasis-100)',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginTop: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                      <label className="admin-form-label" htmlFor={`linkLabel-${section.id}`}>
                        Label
                      </label>
                      <input
                        id={`linkLabel-${section.id}`}
                        type="text"
                        className="admin-form-input"
                        placeholder="Ex: Discord"
                        value={linkFormData.label}
                        onChange={(e) => setLinkFormData({ ...linkFormData, label: e.target.value })}
                        autoFocus
                      />
                    </div>
                    <div style={{ flex: '2', minWidth: '300px' }}>
                      <label className="admin-form-label" htmlFor={`linkHref-${section.id}`}>
                        URL
                      </label>
                      <input
                        id={`linkHref-${section.id}`}
                        type="text"
                        className="admin-form-input"
                        placeholder="Ex: https://discord.gg/devclub"
                        value={linkFormData.href}
                        onChange={(e) => setLinkFormData({ ...linkFormData, href: e.target.value })}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary"
                      onClick={handleCancelLink}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="admin-btn admin-btn-primary">
                      {editingLink ? 'Salvar' : 'Adicionar'}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  className="admin-btn admin-btn-secondary"
                  onClick={() => {
                    setShowLinkForm(section.id);
                    setEditingLink(null);
                    setLinkFormData({ label: '', href: '' });
                  }}
                >
                  + Adicionar Link
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.show && (
        <div
          className="modal-overlay"
          onClick={() => setDeleteModal({ show: false, type: 'section', section: null })}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Confirmar exclusão</h3>
            <p className="modal-body">
              {deleteModal.type === 'section' ? (
                <>
                  Tem certeza que deseja excluir a seção "{deleteModal.section?.title}"?
                  <br />
                  <small style={{ color: 'var(--faq-text-muted)' }}>
                    Todos os links desta seção serão excluídos.
                  </small>
                </>
              ) : (
                <>Tem certeza que deseja excluir o link "{deleteModal.link?.label}"?</>
              )}
            </p>
            <div className="modal-actions">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setDeleteModal({ show: false, type: 'section', section: null })}
              >
                Cancelar
              </button>
              <button
                className="admin-btn admin-btn-danger"
                onClick={deleteModal.type === 'section' ? handleDeleteSection : handleDeleteLink}
              >
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

export default function FooterAdmin(): JSX.Element {
  return (
    <Layout title="Links do Footer" description="Gerenciar links do footer">
      <BrowserOnly fallback={<div className="loading"><div className="loading-spinner" /></div>}>
        {() => <FooterAdminContent />}
      </BrowserOnly>
    </Layout>
  );
}
