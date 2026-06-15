// Seed: importa os dados atuais de src/database/db.json para o Postgres.
// Idempotente — usa upsert, então pode rodar várias vezes sem duplicar.
const fs = require('fs');
const path = require('path');
const prisma = require('../src/lib/prisma');

async function main() {
  const dbPath = path.join(__dirname, '../src/database/db.json');

  if (!fs.existsSync(dbPath)) {
    console.log('⚠️  db.json não encontrado — nada para importar.');
    return;
  }

  const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

  // ---------- Settings ----------
  if (data.settings) {
    await prisma.setting.upsert({
      where: { id: 'default' },
      update: {
        supportLink: data.settings.supportLink || '',
        supportLabel: data.settings.supportLabel || '',
      },
      create: {
        id: 'default',
        supportLink: data.settings.supportLink || '',
        supportLabel: data.settings.supportLabel || '',
      },
    });
    console.log('✅ Settings importadas');
  }

  // ---------- Categorias ----------
  for (const c of data.categories || []) {
    await prisma.category.upsert({
      where: { id: c.id },
      update: { name: c.name, slug: c.slug, order: c.order ?? 0 },
      create: { id: c.id, name: c.name, slug: c.slug, order: c.order ?? 0 },
    });
  }
  console.log(`✅ ${(data.categories || []).length} categorias importadas`);

  // ---------- FAQs ----------
  for (const f of data.faqs || []) {
    await prisma.faq.upsert({
      where: { id: f.id },
      update: {
        categoryId: f.categoryId,
        question: f.question,
        answer: f.answer,
        order: f.order ?? 0,
      },
      create: {
        id: f.id,
        categoryId: f.categoryId,
        question: f.question,
        answer: f.answer,
        order: f.order ?? 0,
        createdAt: f.createdAt ? new Date(f.createdAt) : undefined,
        updatedAt: f.updatedAt ? new Date(f.updatedAt) : undefined,
      },
    });
  }
  console.log(`✅ ${(data.faqs || []).length} FAQs importadas`);

  // ---------- Featured cards ----------
  for (const fc of data.featuredCards || []) {
    await prisma.featuredCard.upsert({
      where: { id: fc.id },
      update: {
        title: fc.title,
        description: fc.description,
        icon: fc.icon || 'star',
        link: fc.link || '#',
        color: fc.color || '#6366f1',
        order: fc.order ?? 0,
      },
      create: {
        id: fc.id,
        title: fc.title,
        description: fc.description,
        icon: fc.icon || 'star',
        link: fc.link || '#',
        color: fc.color || '#6366f1',
        order: fc.order ?? 0,
      },
    });
  }
  console.log(`✅ ${(data.featuredCards || []).length} featured cards importados`);

  // ---------- Footer (seções + links) ----------
  for (const s of data.footerLinks || []) {
    await prisma.footerSection.upsert({
      where: { id: s.id },
      update: { title: s.title, order: s.order ?? 0 },
      create: { id: s.id, title: s.title, order: s.order ?? 0 },
    });

    for (const item of s.items || []) {
      await prisma.footerLink.upsert({
        where: { id: item.id },
        update: {
          sectionId: s.id,
          label: item.label,
          href: item.href,
          order: item.order ?? 0,
        },
        create: {
          id: item.id,
          sectionId: s.id,
          label: item.label,
          href: item.href,
          order: item.order ?? 0,
        },
      });
    }
  }
  console.log(`✅ ${(data.footerLinks || []).length} seções de footer importadas`);
}

main()
  .then(() => console.log('🌱 Seed concluído com sucesso'))
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
