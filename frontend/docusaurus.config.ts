import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'DevClub',
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

  plugins: [
    './src/plugins/category-pages-plugin.js',
  ],

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
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'FAQ | DevClub',
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
      ],
    },
    footer: {
      style: 'light',
      copyright: ' ',
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
