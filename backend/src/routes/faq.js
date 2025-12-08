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

module.exports = router;
