import React, { useEffect } from 'react';
import { API_URL } from '../config';

export default function Root({ children }: { children: React.ReactNode }): JSX.Element {
  useEffect(() => {
    const updateSupportLink = async () => {
      try {
        const response = await fetch(`${API_URL}/settings`);
        if (!response.ok) return;

        const settings = await response.json();

        if (settings.supportLink) {
          // Aguarda a navbar carregar
          const checkAndUpdate = () => {
            const navLinks = document.querySelectorAll('.navbar__link');
            navLinks.forEach((link) => {
              if (link.textContent?.trim() === 'Suporte' || link.getAttribute('href')?.includes('suporte')) {
                link.setAttribute('href', settings.supportLink);
                if (settings.supportLabel) {
                  link.textContent = settings.supportLabel;
                }
              }
            });
          };

          // Executa imediatamente e depois de um delay para garantir
          checkAndUpdate();
          setTimeout(checkAndUpdate, 100);
          setTimeout(checkAndUpdate, 500);
        }
      } catch (error) {
        console.error('Erro ao carregar configuracoes:', error);
      }
    };

    updateSupportLink();
  }, []);

  return <>{children}</>;
}
