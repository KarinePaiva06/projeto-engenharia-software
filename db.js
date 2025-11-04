// db.js
// Conexão com MySQL usando mysql2/promise
const mysql = require('mysql2/promise');
let pool;
function initPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '13142526',
      database: process.env.DB_NAME || 'site',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return pool;
}
module.exports = {
  getConnection: async () => {
    initPool();
    return pool.getConnection();
  },
  pool: () => {
    initPool();
    return pool;
  }
};
