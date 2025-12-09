import React, { useEffect, useState } from 'react';
import { API_URL } from '../../config';
import type { FooterSection } from '../../types';
import './Footer.css';

function Footer(): JSX.Element {
  const [sections, setSections] = useState<FooterSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFooterLinks();
  }, []);

  const fetchFooterLinks = async () => {
    try {
      const response = await fetch(`${API_URL}/footer-links`);
      if (response.ok) {
        const data = await response.json();
        setSections(data);
      }
    } catch (error) {
      console.error('Error fetching footer links:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="custom-footer">
      <div className="custom-footer-container">
        {loading ? (
          <div className="custom-footer-loading">Carregando...</div>
        ) : (
          <div className="custom-footer-links">
            {sections.map((section) => (
              <div key={section.id} className="custom-footer-column">
                <h3 className="custom-footer-title">{section.title}</h3>
                <ul className="custom-footer-list">
                  {section.items?.map((item) => (
                    <li key={item.id}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="custom-footer-link"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        <div className="custom-footer-bottom">
          <p className="custom-footer-copyright">
            &copy; {currentYear} DevClub. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default React.memo(Footer);
