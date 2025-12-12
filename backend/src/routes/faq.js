const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '../database/db.json');

// Helper para ler o banco
const readDb = () => {
  const data = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(data);
};

// Helper para salvar no banco
const writeDb = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
};

// ==================== SETTINGS ====================

// GET /api/settings - Obter configurações do site
router.get('/settings', (req, res) => {
  try {
    const db = readDb();
    res.json(db.settings || {});
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

// PUT /api/settings - Atualizar configurações do site
router.put('/settings', (req, res) => {
  try {
    const { supportLink, supportLabel } = req.body;
    const db = readDb();

    if (!db.settings) db.settings = {};

    db.settings = {
      ...db.settings,
      ...(supportLink !== undefined && { supportLink }),
      ...(supportLabel !== undefined && { supportLabel })
    };

    writeDb(db);
    res.json(db.settings);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

// ==================== FEATURED CARDS ====================

// GET /api/featured-cards - Listar todos os cards em destaque
router.get('/featured-cards', (req, res) => {
  try {
    const db = readDb();
    const cards = (db.featuredCards || []).sort((a, b) => a.order - b.order);
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cards em destaque' });
  }
});

// POST /api/featured-cards - Criar card em destaque
router.post('/featured-cards', (req, res) => {
  try {
    const { title, description, icon, link, color } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Título e descrição são obrigatórios' });
    }

    const db = readDb();
    if (!db.featuredCards) db.featuredCards = [];

    const newCard = {
      id: uuidv4(),
      title,
      description,
      icon: icon || 'star',
      link: link || '#',
      color: color || '#6366f1',
      order: db.featuredCards.length + 1
    };

    db.featuredCards.push(newCard);
    writeDb(db);
    res.status(201).json(newCard);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar card em destaque' });
  }
});

// PUT /api/featured-cards/:id - Atualizar card em destaque
router.put('/featured-cards/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, icon, link, color, order } = req.body;

    const db = readDb();
    if (!db.featuredCards) db.featuredCards = [];

    const index = db.featuredCards.findIndex(c => c.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Card não encontrado' });
    }

    db.featuredCards[index] = {
      ...db.featuredCards[index],
      ...(title && { title }),
      ...(description && { description }),
      ...(icon && { icon }),
      ...(link && { link }),
      ...(color && { color }),
      ...(order !== undefined && { order })
    };

    writeDb(db);
    res.json(db.featuredCards[index]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar card em destaque' });
  }
});

// DELETE /api/featured-cards/:id - Deletar card em destaque
router.delete('/featured-cards/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();

    if (!db.featuredCards) {
      return res.status(404).json({ error: 'Card não encontrado' });
    }

    db.featuredCards = db.featuredCards.filter(c => c.id !== id);
    writeDb(db);
    res.json({ message: 'Card deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar card em destaque' });
  }
});

// ==================== CATEGORIES ====================

// GET /api/categories - Listar todas as categorias
router.get('/categories', (req, res) => {
  try {
    const db = readDb();
    const categories = db.categories.sort((a, b) => a.order - b.order);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

// POST /api/categories - Criar categoria
router.post('/categories', (req, res) => {
  try {
    const { name, slug } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const db = readDb();
    const newCategory = {
      id: uuidv4(),
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      order: db.categories.length + 1
    };

    db.categories.push(newCategory);
    writeDb(db);
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

// PUT /api/categories/:id - Atualizar categoria
router.put('/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, order } = req.body;

    const db = readDb();
    const index = db.categories.findIndex(c => c.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    db.categories[index] = {
      ...db.categories[index],
      ...(name && { name }),
      ...(slug && { slug }),
      ...(order !== undefined && { order })
    };

    writeDb(db);
    res.json(db.categories[index]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
});

// GET /api/categories/slug/:slug - Buscar categoria por slug
router.get('/categories/slug/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const db = readDb();
    const category = db.categories.find(c => c.slug === slug);

    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar categoria' });
  }
});

// DELETE /api/categories/:id - Deletar categoria
router.delete('/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();

    // Verificar se há FAQs nesta categoria
    const hasItems = db.faqs.some(f => f.categoryId === id);
    if (hasItems) {
      return res.status(400).json({ error: 'Não é possível deletar categoria com itens' });
    }

    db.categories = db.categories.filter(c => c.id !== id);
    writeDb(db);
    res.json({ message: 'Categoria deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar categoria' });
  }
});

// GET /api/faqs - Listar todos os FAQs
router.get('/faqs', (req, res) => {
  try {
    const db = readDb();
    const faqs = db.faqs.sort((a, b) => a.order - b.order);
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar FAQs' });
  }
});

// GET /api/faqs/grouped - FAQs agrupados por categoria
router.get('/faqs/grouped', (req, res) => {
  try {
    const db = readDb();
    const categories = db.categories.sort((a, b) => a.order - b.order);

    const grouped = categories.map(category => ({
      ...category,
      faqs: db.faqs
        .filter(f => f.categoryId === category.id)
        .sort((a, b) => a.order - b.order)
    }));

    res.json(grouped);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar FAQs agrupados' });
  }
});

// GET /api/faqs/:id - Buscar FAQ específico
router.get('/faqs/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    const faq = db.faqs.find(f => f.id === id);

    if (!faq) {
      return res.status(404).json({ error: 'FAQ não encontrado' });
    }

    res.json(faq);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar FAQ' });
  }
});

// GET /api/faqs/category/:categoryId - FAQs por categoria
router.get('/faqs/category/:categoryId', (req, res) => {
  try {
    const { categoryId } = req.params;
    const db = readDb();
    const faqs = db.faqs
      .filter(f => f.categoryId === categoryId)
      .sort((a, b) => a.order - b.order);

    res.json(faqs);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar FAQs da categoria' });
  }
});

// POST /api/faqs - Criar FAQ
router.post('/faqs', (req, res) => {
  try {
    const { categoryId, question, answer } = req.body;

    if (!categoryId || !question || !answer) {
      return res.status(400).json({ error: 'Categoria, pergunta e resposta são obrigatórios' });
    }

    const db = readDb();

    // Verificar se categoria existe
    const categoryExists = db.categories.some(c => c.id === categoryId);
    if (!categoryExists) {
      return res.status(400).json({ error: 'Categoria não encontrada' });
    }

    // Calcular próxima ordem
    const categoryFaqs = db.faqs.filter(f => f.categoryId === categoryId);
    const nextOrder = categoryFaqs.length > 0
      ? Math.max(...categoryFaqs.map(f => f.order)) + 1
      : 1;

    const now = new Date().toISOString();
    const newFaq = {
      id: uuidv4(),
      categoryId,
      question,
      answer,
      order: nextOrder,
      createdAt: now,
      updatedAt: now
    };

    db.faqs.push(newFaq);
    writeDb(db);
    res.status(201).json(newFaq);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar FAQ' });
  }
});

// PUT /api/faqs/:id - Atualizar FAQ
router.put('/faqs/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, question, answer, order } = req.body;

    const db = readDb();
    const index = db.faqs.findIndex(f => f.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'FAQ não encontrado' });
    }

    db.faqs[index] = {
      ...db.faqs[index],
      ...(categoryId && { categoryId }),
      ...(question && { question }),
      ...(answer && { answer }),
      ...(order !== undefined && { order }),
      updatedAt: new Date().toISOString()
    };

    writeDb(db);
    res.json(db.faqs[index]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar FAQ' });
  }
});

// DELETE /api/faqs/:id - Deletar FAQ
router.delete('/faqs/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();

    const index = db.faqs.findIndex(f => f.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'FAQ não encontrado' });
    }

    db.faqs = db.faqs.filter(f => f.id !== id);
    writeDb(db);
    res.json({ message: 'FAQ deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar FAQ' });
  }
});

// PUT /api/faqs/reorder - Reordenar FAQs
router.put('/faqs/reorder', (req, res) => {
  try {
    const { items } = req.body; // [{ id, order }]

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items deve ser um array' });
    }

    const db = readDb();

    items.forEach(item => {
      const index = db.faqs.findIndex(f => f.id === item.id);
      if (index !== -1) {
        db.faqs[index].order = item.order;
        db.faqs[index].updatedAt = new Date().toISOString();
      }
    });

    writeDb(db);
    res.json({ message: 'FAQs reordenados com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao reordenar FAQs' });
  }
});

// GET /api/search - Buscar FAQs
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const db = readDb();
    const searchTerm = q.toLowerCase();

    const results = db.faqs.filter(faq =>
      faq.question.toLowerCase().includes(searchTerm) ||
      faq.answer.toLowerCase().includes(searchTerm)
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Erro na busca' });
  }
});

// ==================== FOOTER LINKS ====================

// GET /api/footer-links - Listar todas as seções do footer
router.get('/footer-links', (req, res) => {
  try {
    const db = readDb();
    const sections = (db.footerLinks || []).sort((a, b) => a.order - b.order);
    // Ordenar items dentro de cada seção
    sections.forEach(section => {
      if (section.items) {
        section.items.sort((a, b) => a.order - b.order);
      }
    });
    res.json(sections);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar links do footer' });
  }
});

// POST /api/footer-links - Criar seção do footer
router.post('/footer-links', (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }

    const db = readDb();
    if (!db.footerLinks) db.footerLinks = [];

    const newSection = {
      id: uuidv4(),
      title,
      order: db.footerLinks.length + 1,
      items: []
    };

    db.footerLinks.push(newSection);
    writeDb(db);
    res.status(201).json(newSection);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar seção do footer' });
  }
});

// PUT /api/footer-links/:id - Atualizar seção do footer
router.put('/footer-links/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, order } = req.body;

    const db = readDb();
    if (!db.footerLinks) db.footerLinks = [];

    const index = db.footerLinks.findIndex(s => s.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Seção não encontrada' });
    }

    db.footerLinks[index] = {
      ...db.footerLinks[index],
      ...(title && { title }),
      ...(order !== undefined && { order })
    };

    writeDb(db);
    res.json(db.footerLinks[index]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar seção do footer' });
  }
});

// DELETE /api/footer-links/:id - Deletar seção do footer
router.delete('/footer-links/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();

    if (!db.footerLinks) {
      return res.status(404).json({ error: 'Seção não encontrada' });
    }

    db.footerLinks = db.footerLinks.filter(s => s.id !== id);
    writeDb(db);
    res.json({ message: 'Seção deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar seção do footer' });
  }
});

// POST /api/footer-links/:sectionId/items - Adicionar link a uma seção
router.post('/footer-links/:sectionId/items', (req, res) => {
  try {
    const { sectionId } = req.params;
    const { label, href } = req.body;

    if (!label || !href) {
      return res.status(400).json({ error: 'Label e href são obrigatórios' });
    }

    const db = readDb();
    if (!db.footerLinks) db.footerLinks = [];

    const sectionIndex = db.footerLinks.findIndex(s => s.id === sectionId);

    if (sectionIndex === -1) {
      return res.status(404).json({ error: 'Seção não encontrada' });
    }

    if (!db.footerLinks[sectionIndex].items) {
      db.footerLinks[sectionIndex].items = [];
    }

    const newItem = {
      id: uuidv4(),
      label,
      href,
      order: db.footerLinks[sectionIndex].items.length + 1
    };

    db.footerLinks[sectionIndex].items.push(newItem);
    writeDb(db);
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar link do footer' });
  }
});

// PUT /api/footer-links/:sectionId/items/:itemId - Atualizar link
router.put('/footer-links/:sectionId/items/:itemId', (req, res) => {
  try {
    const { sectionId, itemId } = req.params;
    const { label, href, order } = req.body;

    const db = readDb();
    if (!db.footerLinks) db.footerLinks = [];

    const sectionIndex = db.footerLinks.findIndex(s => s.id === sectionId);

    if (sectionIndex === -1) {
      return res.status(404).json({ error: 'Seção não encontrada' });
    }

    const itemIndex = db.footerLinks[sectionIndex].items?.findIndex(i => i.id === itemId);

    if (itemIndex === -1 || itemIndex === undefined) {
      return res.status(404).json({ error: 'Link não encontrado' });
    }

    db.footerLinks[sectionIndex].items[itemIndex] = {
      ...db.footerLinks[sectionIndex].items[itemIndex],
      ...(label && { label }),
      ...(href && { href }),
      ...(order !== undefined && { order })
    };

    writeDb(db);
    res.json(db.footerLinks[sectionIndex].items[itemIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar link do footer' });
  }
});

// DELETE /api/footer-links/:sectionId/items/:itemId - Deletar link
router.delete('/footer-links/:sectionId/items/:itemId', (req, res) => {
  try {
    const { sectionId, itemId } = req.params;
    const db = readDb();

    if (!db.footerLinks) {
      return res.status(404).json({ error: 'Seção não encontrada' });
    }

    const sectionIndex = db.footerLinks.findIndex(s => s.id === sectionId);

    if (sectionIndex === -1) {
      return res.status(404).json({ error: 'Seção não encontrada' });
    }

    db.footerLinks[sectionIndex].items = db.footerLinks[sectionIndex].items?.filter(i => i.id !== itemId) || [];
    writeDb(db);
    res.json({ message: 'Link deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar link do footer' });
  }
});

module.exports = router;
