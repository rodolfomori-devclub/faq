const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Credenciais do admin (em produção, use variáveis de ambiente e hash seguro)
const ADMIN_EMAIL = 'devclub438@gmail.com';
const ADMIN_PASSWORD = 'Rma230705@';

// Caminho para arquivo de tokens
const tokensPath = path.join(__dirname, '../database/tokens.json');

// Funções para persistir tokens
const readTokens = () => {
  try {
    if (fs.existsSync(tokensPath)) {
      const data = fs.readFileSync(tokensPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao ler tokens:', error);
  }
  return {};
};

const writeTokens = (tokens) => {
  try {
    fs.writeFileSync(tokensPath, JSON.stringify(tokens, null, 2), 'utf-8');
  } catch (error) {
    console.error('Erro ao salvar tokens:', error);
  }
};

// Gerar token seguro
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// POST /api/auth/login - Login do admin
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Verificar credenciais
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = generateToken();
      const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 horas

      const tokens = readTokens();
      tokens[token] = {
        email,
        expiresAt
      };
      writeTokens(tokens);

      return res.json({
        success: true,
        token,
        expiresAt,
        user: { email }
      });
    }

    return res.status(401).json({ error: 'Credenciais inválidas' });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// POST /api/auth/logout - Logout
router.post('/logout', (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const tokens = readTokens();
      delete tokens[token];
      writeTokens(tokens);
    }

    res.json({ success: true, message: 'Logout realizado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao fazer logout' });
  }
});

// GET /api/auth/verify - Verificar se token é válido
router.get('/verify', (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false, error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7);
    const tokens = readTokens();
    const tokenData = tokens[token];

    if (!tokenData) {
      return res.status(401).json({ valid: false, error: 'Token inválido' });
    }

    // Verificar expiração
    if (Date.now() > tokenData.expiresAt) {
      delete tokens[token];
      writeTokens(tokens);
      return res.status(401).json({ valid: false, error: 'Token expirado' });
    }

    res.json({ valid: true, user: { email: tokenData.email } });
  } catch (error) {
    res.status(500).json({ valid: false, error: 'Erro ao verificar token' });
  }
});

// Middleware para verificar autenticação (exportado para uso em outras rotas)
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acesso não autorizado' });
  }

  const token = authHeader.substring(7);
  const tokens = readTokens();
  const tokenData = tokens[token];

  if (!tokenData) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  if (Date.now() > tokenData.expiresAt) {
    delete tokens[token];
    writeTokens(tokens);
    return res.status(401).json({ error: 'Token expirado' });
  }

  req.user = { email: tokenData.email };
  next();
};

module.exports = { router, authMiddleware };
