import React from 'react';
import type { Category } from '../types';

interface SidebarProps {
  categories: Category[];
  activeCategory: string | null;
  onCategoryClick: (categoryId: string | null) => void;
}

export default function Sidebar({ categories, activeCategory, onCategoryClick }: SidebarProps): JSX.Element {
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
            href={`#${category.slug}`}
            className={`sidebar-item ${activeCategory === category.id ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              onCategoryClick(category.id);
              const element = document.getElementById(category.slug);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            {category.name}
          </a>
        ))}
      </div>
    </nav>
  );
}
