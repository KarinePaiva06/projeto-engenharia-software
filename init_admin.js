// init_admin.js
// Script para criar/atualizar o admin no banco usando bcrypt para hash de senha
require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./db');

async function init() {
  const user = process.env.ADMIN_USER || 'admin';
  const pass = process.env.ADMIN_PASS || 'admin123';
  const saltRounds = 10;
  try {
    const hash = await bcrypt.hash(pass, saltRounds);
    const conn = await db.getConnection();
    await conn.execute('INSERT INTO adm (login, senha) VALUES (?, ?) ON DUPLICATE KEY UPDATE senha = VALUES(senha)', [user, hash]);
    conn.release();
    console.log('Admin inicializado:', user);
    process.exit(0);
  } catch (err) {
    console.error('Erro ao inicializar admin:', err);
    process.exit(1);
  }
}

init();
