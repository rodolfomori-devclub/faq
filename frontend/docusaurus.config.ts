import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'FAQ DevClub',
  tagline: 'Tire suas dúvidas sobre a Formação DevClub',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://faq.devclub.com.br',
  baseUrl: '/',

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'pt-BR',
    locales: ['pt-BR'],
  },

  presets: [
    [
      'classic',
      {
        docs: false,
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/devclub-social-card.jpg',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'FAQ DevClub',
      logo: {
        alt: 'DevClub Logo',
        src: 'img/logo-devclub.png',
      },
      items: [
        {
          to: '/',
          label: 'FAQ',
          position: 'left',
        },
        {
          to: '/admin',
          label: 'Admin',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Links',
          items: [
            {
              label: 'Site DevClub',
              href: 'https://devclub.com.br',
            },
            {
              label: 'Área do Aluno',
              href: 'https://aluno.devclub.com.br',
            },
          ],
        },
        {
          title: 'Comunidade',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/devclub',
            },
            {
              label: 'Instagram',
              href: 'https://instagram.com/devcluboficial',
            },
            {
              label: 'YouTube',
              href: 'https://youtube.com/devclub',
            },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} DevClub. Todos os direitos reservados.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
