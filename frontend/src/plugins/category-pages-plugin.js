const path = require('path');
const fs = require('fs');

module.exports = function categoryPagesPlugin(context, options) {
  return {
    name: 'category-pages-plugin',

    async contentLoaded({ actions }) {
      const { addRoute } = actions;

      // Ler categorias do arquivo db.json
      let categories = [];
      try {
        const dbPath = path.resolve(__dirname, '../../../backend/src/database/db.json');
        const dbContent = fs.readFileSync(dbPath, 'utf8');
        const db = JSON.parse(dbContent);
        categories = db.categories || [];
      } catch (error) {
        console.warn('Could not load categories from db.json:', error.message);
        // Fallback categories
        categories = [
          { slug: 'sobre-a-formacao' },
          { slug: 'acesso-e-plataforma' },
          { slug: 'pagamento-e-matricula' },
          { slug: 'conteudo-e-metodologia' },
          { slug: 'suporte-e-comunidade' },
          { slug: 'carreira' },
        ];
      }

      // Criar uma rota para cada categoria
      categories.forEach((category) => {
        addRoute({
          path: `/categoria/${category.slug}`,
          component: path.resolve(__dirname, '../pages/CategoryPage.tsx'),
          exact: true,
        });
      });
    },
  };
};
