const { PrismaClient } = require('@prisma/client');

// Singleton para evitar múltiplas conexões (especialmente em dev com hot reload)
const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
