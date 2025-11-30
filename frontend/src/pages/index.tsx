import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@theme/Layout';
import Sidebar from '../components/Sidebar';
import FAQList from '../components/FAQList';
import SearchBar from '../components/SearchBar';
import FeaturedCards from '../components/FeaturedCards';
import { API_URL } from '../config';
import type { CategoryWithFaqs, Category, FeaturedCard } from '../types';

export default function Home(): JSX.Element {
  const [categories, setCategories] = useState<CategoryWithFaqs[]>([]);
  const [featuredCards, setFeaturedCards] = useState<FeaturedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [faqsRes, cardsRes] = await Promise.all([
        fetch(`${API_URL}/faqs/grouped`),
        fetch(`${API_URL}/featured-cards`),
      ]);

      if (!faqsRes.ok) throw new Error('Erro ao carregar FAQs');

      const faqsData = await faqsRes.json();
      setCategories(faqsData);

      if (cardsRes.ok) {
        const cardsData = await cardsRes.json();
        setFeaturedCards(cardsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    const query = searchQuery.toLowerCase();
    return categories
      .map((category) => ({
        ...category,
        faqs: category.faqs.filter(
          (faq) =>
            faq.question.toLowerCase().includes(query) ||
            faq.answer.toLowerCase().includes(query)
        ),
      }))
      .filter((category) => category.faqs.length > 0);
  }, [categories, searchQuery]);

  const sidebarCategories: Category[] = categories.map(({ faqs, ...rest }) => rest);

  return (
    <Layout
      title="FAQ"
      description="Perguntas frequentes sobre a Formação DevClub"
    >
      <div className="page-header">
        <h1 className="page-title">Central de Ajuda</h1>
        <p className="page-subtitle">
          Encontre respostas para as perguntas mais frequentes sobre a Formação DevClub
        </p>
      </div>

      <div className="container">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        {/* Featured Cards - só mostra quando não está pesquisando */}
        {!searchQuery && featuredCards.length > 0 && (
          <FeaturedCards cards={featuredCards} />
        )}

        <div className="row">
          <div className="col col--3">
            <Sidebar
              categories={sidebarCategories}
              activeCategory={activeCategory}
              onCategoryClick={setActiveCategory}
            />
          </div>

          <div className="col col--9">
            {loading ? (
              <div className="loading">
                <div className="loading-spinner" />
              </div>
            ) : error ? (
              <div className="empty-state">
                <div className="empty-state-icon">⚠️</div>
                <p className="empty-state-text">{error}</p>
                <button
                  className="admin-btn admin-btn-primary"
                  onClick={fetchData}
                  style={{ marginTop: '1rem' }}
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <FAQList
                categories={filteredCategories}
                activeCategory={searchQuery ? null : activeCategory}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
