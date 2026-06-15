const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// ==================== SETTINGS ====================

// GET /api/settings - Obter configurações do site
router.get('/settings', async (req, res) => {
  try {
    const settings = await prisma.setting.findUnique({ where: { id: 'default' } });
    res.json(settings || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

// PUT /api/settings - Atualizar configurações do site
router.put('/settings', async (req, res) => {
  try {
    const { supportLink, supportLabel } = req.body;

    const data = {
      ...(supportLink !== undefined && { supportLink }),
      ...(supportLabel !== undefined && { supportLabel }),
    };

    const settings = await prisma.setting.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', ...data },
    });

    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

// ==================== FEATURED CARDS ====================

// GET /api/featured-cards - Listar todos os cards em destaque
router.get('/featured-cards', async (req, res) => {
  try {
    const cards = await prisma.featuredCard.findMany({ orderBy: { order: 'asc' } });
    res.json(cards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar cards em destaque' });
  }
});

// POST /api/featured-cards - Criar card em destaque
router.post('/featured-cards', async (req, res) => {
  try {
    const { title, description, icon, link, color } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Título e descrição são obrigatórios' });
    }

    const count = await prisma.featuredCard.count();

    const newCard = await prisma.featuredCard.create({
      data: {
        title,
        description,
        icon: icon || 'star',
        link: link || '#',
        color: color || '#6366f1',
        order: count + 1,
      },
    });

    res.status(201).json(newCard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar card em destaque' });
  }
});

// PUT /api/featured-cards/:id - Atualizar card em destaque
router.put('/featured-cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, icon, link, color, order } = req.body;

    const card = await prisma.featuredCard.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(icon && { icon }),
        ...(link && { link }),
        ...(color && { color }),
        ...(order !== undefined && { order }),
      },
    });

    res.json(card);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Card não encontrado' });
    }
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar card em destaque' });
  }
});

// DELETE /api/featured-cards/:id - Deletar card em destaque
router.delete('/featured-cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.featuredCard.delete({ where: { id } });
    res.json({ message: 'Card deletado com sucesso' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Card não encontrado' });
    }
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar card em destaque' });
  }
});

// ==================== CATEGORIES ====================

// GET /api/categories - Listar todas as categorias
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { order: 'asc' } });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

// GET /api/categories/slug/:slug - Buscar categoria por slug
router.get('/categories/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await prisma.category.findUnique({ where: { slug } });

    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar categoria' });
  }
});

// POST /api/categories - Criar categoria
router.post('/categories', async (req, res) => {
  try {
    const { name, slug } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const count = await prisma.category.count();

    const newCategory = await prisma.category.create({
      data: {
        name,
        slug:
          slug ||
          name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-'),
        order: count + 1,
      },
    });

    res.status(201).json(newCategory);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Já existe uma categoria com este slug' });
    }
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

// PUT /api/categories/:id - Atualizar categoria
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, order } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(order !== undefined && { order }),
      },
    });

    res.json(category);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Já existe uma categoria com este slug' });
    }
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
});

// DELETE /api/categories/:id - Deletar categoria
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se há FAQs nesta categoria
    const hasItems = await prisma.faq.count({ where: { categoryId: id } });
    if (hasItems > 0) {
      return res.status(400).json({ error: 'Não é possível deletar categoria com itens' });
    }

    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Categoria deletada com sucesso' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar categoria' });
  }
});

// ==================== FAQS ====================

// GET /api/faqs - Listar todos os FAQs
router.get('/faqs', async (req, res) => {
  try {
    const faqs = await prisma.faq.findMany({ orderBy: { order: 'asc' } });
    res.json(faqs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar FAQs' });
  }
});

// GET /api/faqs/grouped - FAQs agrupados por categoria
router.get('/faqs/grouped', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        faqs: { orderBy: { order: 'asc' } },
      },
    });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar FAQs agrupados' });
  }
});

// PUT /api/faqs/reorder - Reordenar FAQs (antes de /:id para não colidir)
router.put('/faqs/reorder', async (req, res) => {
  try {
    const { items } = req.body; // [{ id, order }]

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items deve ser um array' });
    }

    await prisma.$transaction(
      items.map((item) =>
        prisma.faq.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    res.json({ message: 'FAQs reordenados com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao reordenar FAQs' });
  }
});

// GET /api/faqs/category/:categoryId - FAQs por categoria
router.get('/faqs/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const faqs = await prisma.faq.findMany({
      where: { categoryId },
      orderBy: { order: 'asc' },
    });
    res.json(faqs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar FAQs da categoria' });
  }
});

// GET /api/faqs/:id - Buscar FAQ específico
router.get('/faqs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await prisma.faq.findUnique({ where: { id } });

    if (!faq) {
      return res.status(404).json({ error: 'FAQ não encontrado' });
    }

    res.json(faq);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar FAQ' });
  }
});

// POST /api/faqs - Criar FAQ
router.post('/faqs', async (req, res) => {
  try {
    const { categoryId, question, answer } = req.body;

    if (!categoryId || !question || !answer) {
      return res.status(400).json({ error: 'Categoria, pergunta e resposta são obrigatórios' });
    }

    // Verificar se categoria existe
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return res.status(400).json({ error: 'Categoria não encontrada' });
    }

    // Calcular próxima ordem dentro da categoria
    const last = await prisma.faq.findFirst({
      where: { categoryId },
      orderBy: { order: 'desc' },
    });
    const nextOrder = last ? last.order + 1 : 1;

    const newFaq = await prisma.faq.create({
      data: { categoryId, question, answer, order: nextOrder },
    });

    res.status(201).json(newFaq);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar FAQ' });
  }
});

// PUT /api/faqs/:id - Atualizar FAQ
router.put('/faqs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, question, answer, order } = req.body;

    const faq = await prisma.faq.update({
      where: { id },
      data: {
        ...(categoryId && { categoryId }),
        ...(question && { question }),
        ...(answer && { answer }),
        ...(order !== undefined && { order }),
      },
    });

    res.json(faq);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'FAQ não encontrado' });
    }
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar FAQ' });
  }
});

// DELETE /api/faqs/:id - Deletar FAQ
router.delete('/faqs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.faq.delete({ where: { id } });
    res.json({ message: 'FAQ deletado com sucesso' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'FAQ não encontrado' });
    }
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar FAQ' });
  }
});

// GET /api/search - Buscar FAQs
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const results = await prisma.faq.findMany({
      where: {
        OR: [
          { question: { contains: q, mode: 'insensitive' } },
          { answer: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: { order: 'asc' },
    });

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro na busca' });
  }
});

// ==================== FOOTER LINKS ====================

// GET /api/footer-links - Listar todas as seções do footer
router.get('/footer-links', async (req, res) => {
  try {
    const sections = await prisma.footerSection.findMany({
      orderBy: { order: 'asc' },
      include: {
        items: { orderBy: { order: 'asc' } },
      },
    });
    res.json(sections);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar links do footer' });
  }
});

// POST /api/footer-links - Criar seção do footer
router.post('/footer-links', async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }

    const count = await prisma.footerSection.count();

    const section = await prisma.footerSection.create({
      data: { title, order: count + 1 },
      include: { items: true },
    });

    res.status(201).json(section);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar seção do footer' });
  }
});

// PUT /api/footer-links/:id - Atualizar seção do footer
router.put('/footer-links/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, order } = req.body;

    const section = await prisma.footerSection.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(order !== undefined && { order }),
      },
    });

    res.json(section);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Seção não encontrada' });
    }
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar seção do footer' });
  }
});

// DELETE /api/footer-links/:id - Deletar seção do footer (e seus links em cascata)
router.delete('/footer-links/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.footerSection.delete({ where: { id } });
    res.json({ message: 'Seção deletada com sucesso' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Seção não encontrada' });
    }
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar seção do footer' });
  }
});

// POST /api/footer-links/:sectionId/items - Adicionar link a uma seção
router.post('/footer-links/:sectionId/items', async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { label, href } = req.body;

    if (!label || !href) {
      return res.status(400).json({ error: 'Label e href são obrigatórios' });
    }

    const section = await prisma.footerSection.findUnique({ where: { id: sectionId } });
    if (!section) {
      return res.status(404).json({ error: 'Seção não encontrada' });
    }

    const count = await prisma.footerLink.count({ where: { sectionId } });

    const item = await prisma.footerLink.create({
      data: { sectionId, label, href, order: count + 1 },
    });

    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar link do footer' });
  }
});

// PUT /api/footer-links/:sectionId/items/:itemId - Atualizar link
router.put('/footer-links/:sectionId/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { label, href, order } = req.body;

    const item = await prisma.footerLink.update({
      where: { id: itemId },
      data: {
        ...(label && { label }),
        ...(href && { href }),
        ...(order !== undefined && { order }),
      },
    });

    res.json(item);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Link não encontrado' });
    }
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar link do footer' });
  }
});

// DELETE /api/footer-links/:sectionId/items/:itemId - Deletar link
router.delete('/footer-links/:sectionId/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    await prisma.footerLink.delete({ where: { id: itemId } });
    res.json({ message: 'Link deletado com sucesso' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Link não encontrado' });
    }
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar link do footer' });
  }
});

module.exports = router;
