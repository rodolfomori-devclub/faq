import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { API_URL } from '../config';
import type { Category, FAQ } from '../types';
import './CategoryPage.css';

interface AllCategories extends Category {
  faqs?: FAQ[];
}

interface ExpandedCategories {
  [key: string]: {
    expanded: boolean;
    faqs: FAQ[];
    loading: boolean;
  };
}

function CategoryPageContent(): JSX.Element {
  const [category, setCategory] = useState<Category | null>(null);
  const [allCategories, setAllCategories] = useState<AllCategories[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);
  const [currentFaqIndex, setCurrentFaqIndex] = useState(0);
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  const [currentSlug, setCurrentSlug] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<ExpandedCategories>({});

  // Detectar mudanças na URL
  useEffect(() => {
    const getSlugFromPath = () => {
      const pathParts = window.location.pathname.split('/');
      return pathParts[pathParts.length - 1];
    };

    const slug = getSlugFromPath();

    if (slug && slug !== 'categoria' && slug !== currentSlug) {
      setCurrentSlug(slug);
      fetchCategoryData(slug);
    } else if (!slug || slug === 'categoria') {
      setError('Categoria não especificada');
      setLoading(false);
    }

    // Listener para mudanças de URL (popstate)
    const handlePopState = () => {
      const newSlug = getSlugFromPath();
      if (newSlug && newSlug !== 'categoria') {
        setCurrentSlug(newSlug);
        fetchCategoryData(newSlug);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentSlug]);

  const fetchCategoryData = async (slug: string) => {
    try {
      setLoading(true);
      setError(null);
      setFeedback(null);

      const categoriesRes = await fetch(`${API_URL}/categories`);
      if (!categoriesRes.ok) throw new Error('Erro ao carregar categorias');

      const categories: Category[] = await categoriesRes.json();
      setAllCategories(categories);

      const foundCategory = categories.find(c => c.slug === slug);

      if (!foundCategory) {
        setError('Categoria não encontrada');
        setLoading(false);
        return;
      }

      setCategory(foundCategory);

      const faqsRes = await fetch(`${API_URL}/faqs/category/${foundCategory.id}`);
      if (faqsRes.ok) {
        const faqsData = await faqsRes.json();
        setFaqs(faqsData);
        if (faqsData.length > 0) {
          setSelectedFaq(faqsData[0]);
          setCurrentFaqIndex(0);
        } else {
          setSelectedFaq(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const navigateToCategory = (slug: string) => {
    window.location.href = `/categoria/${slug}`;
  };

  const toggleCategoryExpand = async (cat: AllCategories) => {
    const catId = cat.id;

    // Se já está expandido, colapsa
    if (expandedCategories[catId]?.expanded) {
      setExpandedCategories(prev => ({
        ...prev,
        [catId]: { ...prev[catId], expanded: false }
      }));
      return;
    }

    // Se não tem FAQs carregadas, busca
    if (!expandedCategories[catId]?.faqs?.length) {
      setExpandedCategories(prev => ({
        ...prev,
        [catId]: { expanded: true, faqs: [], loading: true }
      }));

      try {
        const res = await fetch(`${API_URL}/faqs/category/${catId}`);
        if (res.ok) {
          const faqsData = await res.json();
          setExpandedCategories(prev => ({
            ...prev,
            [catId]: { expanded: true, faqs: faqsData, loading: false }
          }));
        }
      } catch {
        setExpandedCategories(prev => ({
          ...prev,
          [catId]: { expanded: true, faqs: [], loading: false }
        }));
      }
    } else {
      // Já tem FAQs, apenas expande
      setExpandedCategories(prev => ({
        ...prev,
        [catId]: { ...prev[catId], expanded: true }
      }));
    }
  };

  const selectFaq = (faq: FAQ, index: number) => {
    setSelectedFaq(faq);
    setCurrentFaqIndex(index);
    setFeedback(null);
  };

  const goToPrevious = () => {
    if (currentFaqIndex > 0) {
      const newIndex = currentFaqIndex - 1;
      setSelectedFaq(faqs[newIndex]);
      setCurrentFaqIndex(newIndex);
      setFeedback(null);
    }
  };

  const goToNext = () => {
    if (currentFaqIndex < faqs.length - 1) {
      const newIndex = currentFaqIndex + 1;
      setSelectedFaq(faqs[newIndex]);
      setCurrentFaqIndex(newIndex);
      setFeedback(null);
    }
  };

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedback(type);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);

      // Usar Intl.DateTimeFormat para formatar corretamente no timezone de São Paulo
      const formatter = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'America/Sao_Paulo'
      });

      return formatter.format(date);
    } catch {
      return 'Data não disponível';
    }
  };

  if (loading) {
    return (
      <div className="category-page">
        <div className="loading">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="category-page">
        <div className="category-error">
          <div className="error-icon">🔍</div>
          <h2>Categoria não encontrada</h2>
          <p>{error || 'A categoria que você está procurando não existe.'}</p>
          <Link to="/" className="back-home-btn">
            Voltar para Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="category-page">
      {/* Sidebar */}
      <aside className="category-sidebar">
        <div className="sidebar-header">
          <Link to="/" className="sidebar-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Central de Ajuda
          </Link>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-title">{category.name}</div>
            <ul className="sidebar-list">
              {faqs.map((faq, index) => (
                <li key={faq.id}>
                  <button
                    className={`sidebar-link ${selectedFaq?.id === faq.id ? 'active' : ''}`}
                    onClick={() => selectFaq(faq, index)}
                  >
                    {faq.question}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Outras categorias */}
          <div className="sidebar-section">
            <div className="sidebar-section-title">Outras Categorias</div>
            <ul className="sidebar-list">
              {allCategories
                .filter(c => c.id !== category.id)
                .map(cat => {
                  const catState = expandedCategories[cat.id];
                  const isExpanded = catState?.expanded || false;
                  const catFaqs = catState?.faqs || [];
                  const isLoading = catState?.loading || false;

                  return (
                    <li key={cat.id} className="sidebar-category-item">
                      <button
                        className={`sidebar-link sidebar-link-category ${isExpanded ? 'expanded' : ''}`}
                        onClick={() => toggleCategoryExpand(cat)}
                      >
                        <span className="category-name">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="category-icon">
                            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          {cat.name}
                        </span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="expand-icon">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>

                      {/* Submenu com FAQs da categoria */}
                      <div className={`category-faqs-submenu ${isExpanded ? 'expanded' : ''}`}>
                        {isLoading ? (
                          <div className="submenu-loading">Carregando...</div>
                        ) : catFaqs.length === 0 ? (
                          <div className="submenu-empty">Nenhuma pergunta</div>
                        ) : (
                          <>
                            {catFaqs.slice(0, 5).map(faq => (
                              <button
                                key={faq.id}
                                className="submenu-faq-link"
                                onClick={() => navigateToCategory(cat.slug)}
                              >
                                {faq.question}
                              </button>
                            ))}
                            {catFaqs.length > 5 && (
                              <button
                                className="submenu-view-all"
                                onClick={() => navigateToCategory(cat.slug)}
                              >
                                Ver todas ({catFaqs.length})
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="category-main">
        {selectedFaq ? (
          <>
            {/* Breadcrumb */}
            <div className="content-breadcrumb">
              <Link to="/">Central de Ajuda</Link>
              <span className="breadcrumb-separator">›</span>
              <span>{category.name}</span>
            </div>

            {/* Content Header */}
            <div className="content-header">
              <h1 className="content-title">{selectedFaq.question}</h1>

              <div className="content-meta">
                <span className="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Atualizado em {formatDate(selectedFaq.updatedAt)}
                </span>
              </div>
            </div>

            {/* Content Body */}
            <article className="content-body">
              <div
                className="content-text"
                dangerouslySetInnerHTML={{ __html: selectedFaq.answer }}
              />
            </article>

            {/* Feedback Section */}
            <div className="content-feedback">
              <span className="feedback-label">Isto foi útil?</span>
              <div className="feedback-buttons">
                <button
                  className={`feedback-btn feedback-positive ${feedback === 'positive' ? 'active' : ''}`}
                  onClick={() => handleFeedback('positive')}
                  title="Sim, foi útil"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                  </svg>
                </button>
                <button
                  className={`feedback-btn feedback-negative ${feedback === 'negative' ? 'active' : ''}`}
                  onClick={() => handleFeedback('negative')}
                  title="Não foi útil"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                  </svg>
                </button>
              </div>
              {feedback && (
                <span className={`feedback-message ${feedback}`}>
                  {feedback === 'positive' ? 'Obrigado pelo feedback!' : 'Vamos melhorar!'}
                </span>
              )}
            </div>

            {/* Navigation */}
            <nav className="content-navigation">
              <button
                className={`nav-btn nav-prev ${currentFaqIndex === 0 ? 'disabled' : ''}`}
                onClick={goToPrevious}
                disabled={currentFaqIndex === 0}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-arrow">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                <div className="nav-content">
                  <span className="nav-label">Anterior</span>
                  <span className="nav-title">
                    {currentFaqIndex > 0 ? faqs[currentFaqIndex - 1].question : ''}
                  </span>
                </div>
              </button>

              <button
                className={`nav-btn nav-next ${currentFaqIndex === faqs.length - 1 ? 'disabled' : ''}`}
                onClick={goToNext}
                disabled={currentFaqIndex === faqs.length - 1}
              >
                <div className="nav-content">
                  <span className="nav-label">Próximo</span>
                  <span className="nav-title">
                    {currentFaqIndex < faqs.length - 1 ? faqs[currentFaqIndex + 1].question : ''}
                  </span>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-arrow">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </nav>
          </>
        ) : (
          <div className="no-faqs">
            <div className="no-faqs-icon">📝</div>
            <h2>Nenhuma pergunta nesta categoria</h2>
            <p>Esta categoria ainda não possui perguntas cadastradas.</p>
            <Link to="/" className="back-home-btn">
              Voltar para Home
            </Link>
          </div>
        )}
      </main>

      {/* Table of Contents (Right Sidebar) */}
      {selectedFaq && (
        <aside className="category-toc">
          <div className="toc-header">Nesta página</div>
          <div className="toc-content">
            <div className="toc-item active">{category.name}</div>
          </div>
        </aside>
      )}
    </div>
  );
}

export default function CategoryPage(): JSX.Element {
  return (
    <Layout title="Categoria" description="Perguntas frequentes por categoria">
      <BrowserOnly fallback={<div className="loading"><div className="loading-spinner" /></div>}>
        {() => <CategoryPageContent />}
      </BrowserOnly>
    </Layout>
  );
}
