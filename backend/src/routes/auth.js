const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const prisma = require('../lib/prisma');

// Credenciais do admin — configuráveis via variáveis de ambiente.
// Fallback para os valores anteriores para não quebrar produção caso as envs
// ainda não estejam definidas. RECOMENDADO: definir ADMIN_EMAIL/ADMIN_PASSWORD.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'devclub438@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Rma230705@';

// Gerar token seguro
const generateToken = () => crypto.randomBytes(32).toString('hex');

// POST /api/auth/login - Login do admin
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = generateToken();
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 horas

      await prisma.authToken.create({
        data: { token, email, expiresAt: BigInt(expiresAt) },
      });

      return res.json({
        success: true,
        token,
        expiresAt,
        user: { email },
      });
    }

    return res.status(401).json({ error: 'Credenciais inválidas' });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// POST /api/auth/logout - Logout
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await prisma.authToken.deleteMany({ where: { token } });
    }

    res.json({ success: true, message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({ error: 'Erro ao fazer logout' });
  }
});

// GET /api/auth/verify - Verificar se token é válido
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false, error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7);
    const tokenData = await prisma.authToken.findUnique({ where: { token } });

    if (!tokenData) {
      return res.status(401).json({ valid: false, error: 'Token inválido' });
    }

    if (Date.now() > Number(tokenData.expiresAt)) {
      await prisma.authToken.deleteMany({ where: { token } });
      return res.status(401).json({ valid: false, error: 'Token expirado' });
    }

    res.json({ valid: true, user: { email: tokenData.email } });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(500).json({ valid: false, error: 'Erro ao verificar token' });
  }
});

// Middleware para verificar autenticação (exportado para uso em outras rotas)
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acesso não autorizado' });
    }

    const token = authHeader.substring(7);
    const tokenData = await prisma.authToken.findUnique({ where: { token } });

    if (!tokenData) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    if (Date.now() > Number(tokenData.expiresAt)) {
      await prisma.authToken.deleteMany({ where: { token } });
      return res.status(401).json({ error: 'Token expirado' });
    }

    req.user = { email: tokenData.email };
    next();
  } catch (error) {
    console.error('Erro no middleware de auth:', error);
    res.status(500).json({ error: 'Erro ao verificar autenticação' });
  }
};

module.exports = { router, authMiddleware };
