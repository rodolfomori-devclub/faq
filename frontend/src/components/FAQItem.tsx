import React, { useState } from 'react';
import type { FAQ } from '../types';
import './FAQContent.css';

interface FAQItemProps {
  faq: FAQ;
}

export default function FAQItem({ faq }: FAQItemProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`faq-item ${isOpen ? 'open' : ''}`}>
      <button
        className="faq-question"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="faq-question-text">{faq.question}</span>
        <svg
          className="faq-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="faq-answer">
          <div
            className="faq-content"
            dangerouslySetInnerHTML={{ __html: faq.answer }}
          />
        </div>
      )}
    </div>
  );
}
