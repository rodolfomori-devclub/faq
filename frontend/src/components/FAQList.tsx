import React from 'react';
import FAQItem from './FAQItem';
import type { CategoryWithFaqs } from '../types';

interface FAQListProps {
  categories: CategoryWithFaqs[];
  activeCategory: string | null;
}

export default function FAQList({ categories, activeCategory }: FAQListProps): JSX.Element {
  const filteredCategories = activeCategory
    ? categories.filter(c => c.id === activeCategory)
    : categories;

  if (filteredCategories.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📭</div>
        <p className="empty-state-text">Nenhuma pergunta encontrada</p>
      </div>
    );
  }

  return (
    <div>
      {filteredCategories.map((category) => (
        <div key={category.id} className="faq-category" id={category.slug}>
          <h2 className="faq-category-title">{category.name}</h2>
          {category.faqs.length > 0 ? (
            category.faqs.map((faq) => (
              <FAQItem key={faq.id} faq={faq} />
            ))
          ) : (
            <p style={{ color: 'var(--faq-text-muted)' }}>
              Nenhuma pergunta nesta categoria ainda.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
