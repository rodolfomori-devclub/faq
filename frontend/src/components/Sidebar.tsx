import React from 'react';
import type { Category } from '../types';

interface SidebarProps {
  categories: Category[];
  activeCategory: string | null;
  onCategoryClick: (categoryId: string | null) => void;
}

export default function Sidebar({ categories, activeCategory, onCategoryClick }: SidebarProps): JSX.Element {
  const handleCategoryClick = (category: Category) => {
    // Redireciona para a rota da categoria
    window.location.href = `/categoria/${category.slug}`;
  };

  return (
    <nav className="sidebar-container">
      <div className="sidebar-category">
        <div className="sidebar-category-title">Categorias</div>
        <a
          href="#"
          className={`sidebar-item ${activeCategory === null ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            onCategoryClick(null);
          }}
        >
          Todas as perguntas
        </a>
        {categories.map((category) => (
          <a
            key={category.id}
            href={`/categoria/${category.slug}`}
            className={`sidebar-item ${activeCategory === category.id ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              handleCategoryClick(category);
            }}
          >
            {category.name}
          </a>
        ))}
      </div>
    </nav>
  );
}
