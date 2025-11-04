// api.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'troque_isto_para_segredo';

// Servir arquivos estáticos do diretório pai (frontend)
const frontendPath = path.join(__dirname, '..');
app.use(express.static(frontendPath));

app.use(express.json());

// =======================================================================
// ROTAS PÚBLICAS
// =======================================================================

// Rota pública para listar produtos (para o formulário de orçamento)
app.get('/api/produtos-public', async (req, res) => {
  try {
    const conn = await db.getConnection();
    const [rows] = await conn.execute('SELECT id_produto, nome_produto, preco_produto FROM produtos');
    conn.release();
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar produtos' });
  }
});


// Rota para salvar orçamento - VERSÃO COM FEEDBACK OPCIONAL
app.post('/api/orcamentos', async (req, res) => {
  let conn;
  try {
    const { nome, idade, email, telefone, feedback, avaliacao, itens } = req.body;

    console.log('📥 Dados recebidos para orçamento:', req.body);

    // Validações básicas - APENAS DADOS DE CONTATO SÃO OBRIGATÓRIOS
    if (!nome || !idade || !email || !telefone) {
      return res.status(400).json({ 
        message: 'Dados de contato são obrigatórios: nome, idade, email e telefone' 
      });
    }

    if (!itens || itens.length === 0) {
      return res.status(400).json({ message: 'Pelo menos um item é obrigatório' });
    }

    // Validar tipos de dados
    const idadeNum = parseInt(idade);
    if (isNaN(idadeNum) || idadeNum < 18) {
      return res.status(400).json({ message: 'Idade deve ser um número maior ou igual a 18' });
    }

    conn = await db.getConnection();
    await conn.beginTransaction();

    // CALCULAR O TOTAL DO ORÇAMENTO E AGRUPAR ITENS DUPLICADOS
    let totalOrcamento = 0;
    const itensAgrupados = {};

    // Agrupar itens por produto_id para somar quantidades
    for (const item of itens) {
      const produtoId = parseInt(item.produto_id);
      const quantidade = parseInt(item.quantidade);
      
      if (isNaN(produtoId) || isNaN(quantidade) || quantidade <= 0) {
        throw new Error(`Dados inválidos para item: produto_id=${item.produto_id}, quantidade=${item.quantidade}`);
      }

      if (itensAgrupados[produtoId]) {
        itensAgrupados[produtoId] += quantidade;
      } else {
        itensAgrupados[produtoId] = quantidade;
      }
    }

    console.log('📦 Itens agrupados:', itensAgrupados);

    // Calcular total com itens agrupados
    for (const [produtoId, quantidade] of Object.entries(itensAgrupados)) {
      const [produto] = await conn.execute(
        'SELECT preco_produto, nome_produto FROM produtos WHERE id_produto = ?', 
        [produtoId]
      );
      
      if (produto.length === 0) {
        throw new Error(`Produto com ID ${produtoId} não encontrado`);
      }
      
      const precoUnitario = parseFloat(produto[0].preco_produto);
      totalOrcamento += precoUnitario * quantidade;
      
      console.log(`💰 Produto ${produto[0].nome_produto}: ${quantidade} × R$ ${precoUnitario} = R$ ${(precoUnitario * quantidade).toFixed(2)}`);
    }

    console.log('💰 Total calculado do orçamento: R$', totalOrcamento.toFixed(2));

    // 1. Salvar feedback (se existir) - AGORA É OPCIONAL
    let idFeedback = null;
    
    // Só salva feedback se o usuário forneceu avaliação OU comentário
    const temFeedback = feedback && feedback.trim() !== '';
    const temAvaliacao = avaliacao !== null && avaliacao !== undefined;
    
    if (temFeedback || temAvaliacao) {
      console.log('💾 Salvando feedback opcional...');
      const queryFeedback = 'INSERT INTO feedback (estrelas, feedback, lido) VALUES (?, ?, ?)';
      const [resultFeedback] = await conn.execute(queryFeedback, [
        temAvaliacao ? parseInt(avaliacao) : null, 
        temFeedback ? feedback.trim() : null, 
        false
      ]);
      idFeedback = resultFeedback.insertId;
      console.log('✅ Feedback salvo com ID:', idFeedback);
    } else {
      console.log('ℹ️ Nenhum feedback fornecido pelo cliente');
    }

    // 2. Salvar orçamento
    console.log('💾 Salvando orçamento...');
    const queryOrcamento = `
      INSERT INTO orcamento (id_feedback, nome_cliente, idade_cliente, email_cliente, telefone_cliente, lido, orcamento) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [resultOrcamento] = await conn.execute(queryOrcamento, [
      idFeedback, 
      nome.trim(), 
      idadeNum, 
      email.trim(), 
      telefone.trim(), 
      false,
      totalOrcamento
    ]);
    const idOrcamento = resultOrcamento.insertId;
    console.log('✅ Orçamento salvo com ID:', idOrcamento, 'Total: R$', totalOrcamento.toFixed(2));

    // 3. Salvar itens do orçamento
    console.log('💾 Salvando itens do orçamento...', itensAgrupados);
    
    for (const [produtoId, quantidade] of Object.entries(itensAgrupados)) {
      const queryItem = `
        INSERT INTO orcamento_produto (id_orcamento, id_produto, quantidade) 
        VALUES (?, ?, ?)
      `;
      await conn.execute(queryItem, [idOrcamento, parseInt(produtoId), quantidade]);
      console.log(`✅ Item salvo: produto ${produtoId}, quantidade ${quantidade}`);
    }

    await conn.commit();
    conn.release();
    
    console.log('🎉 Orçamento salvo com sucesso!');
    
    res.status(201).json({ 
      message: 'Orçamento salvo com sucesso!', 
      id_orcamento: idOrcamento,
      numero_orcamento: `ORC-${idOrcamento}`,
      total: totalOrcamento,
      tem_feedback: !!idFeedback // Indica se tem feedback associado
    });

  } catch (error) {
    console.error('❌ Erro detalhado ao salvar orçamento:', error);
    
    if (conn) {
      await conn.rollback();
      conn.release();
    }
    
    res.status(500).json({ 
      message: 'Erro interno ao salvar orçamento',
      error: error.message 
    });
  }
});

// LOGIN 
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'username e password são obrigatórios' });

    const conn = await db.getConnection();
    const [rows] = await conn.execute('SELECT login, senha FROM adm WHERE login = ? LIMIT 1', [username]);
    conn.release();

    if (!rows || rows.length === 0)
      return res.status(401).json({ message: 'Credenciais inválidas' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.senha);

    if (!match) {
      console.log(`❌ Tentativa de login falhou para: ${username}. Senha incorreta.`);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    console.log(`✅ Login bem-sucedido para: ${user.login}`);
    const token = jwt.sign(
      { login: user.login },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro interno no servidor' });
  }
});

// =======================================================================
// MIDDLEWARE DE AUTENTICAÇÃO
// =======================================================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 
  
  if (token == null) {
    console.log('❌ Acesso negado: Nenhum token fornecido.');
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ Acesso negado: Token inválido ou expirado.');
      return res.status(403).json({ message: 'Token inválido ou expirado.' }); 
    }
    
    req.user = user; 
    console.log(`➡️ Acesso permitido para: ${user.login}`);
    next();
  });
};

// =======================================================================
// ROTAS PROTEGIDAS
// =======================================================================

// Rota para deletar orçamento (com feedback e itens) - LIXEIRA
app.delete('/api/orcamentos/:id', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { id } = req.params;

    conn = await db.getConnection();
    await conn.beginTransaction();

    console.log(`🗑️ Iniciando exclusão do orçamento ${id}...`);

    // 1. Buscar o id_feedback associado ao orçamento
    const [orcamentos] = await conn.execute(
      'SELECT id_feedback FROM orcamento WHERE id_orcamento = ?', 
      [parseInt(id)]
    );

    if (orcamentos.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ message: 'Orçamento não encontrado' });
    }

    const idFeedback = orcamentos[0].id_feedback;

    // 2. Deletar itens do orçamento (cascata pela FK)
    console.log(`🗑️ Deletando itens do orçamento ${id}...`);
    await conn.execute(
      'DELETE FROM orcamento_produto WHERE id_orcamento = ?', 
      [parseInt(id)]
    );

    // 3. Deletar o orçamento
    console.log(`🗑️ Deletando orçamento ${id}...`);
    const [resultOrcamento] = await conn.execute(
      'DELETE FROM orcamento WHERE id_orcamento = ?', 
      [parseInt(id)]
    );

    // 4. Deletar o feedback associado (se existir)
    if (idFeedback) {
      console.log(`🗑️ Deletando feedback ${idFeedback}...`);
      await conn.execute(
        'DELETE FROM feedback WHERE id_feedback = ?', 
        [idFeedback]
      );
    }

    await conn.commit();
    conn.release();

    console.log(`✅ Orçamento ${id} excluído com sucesso!`);

    res.json({ 
      message: 'Orçamento excluído com sucesso!',
      orcamento_excluido: id,
      feedback_excluido: idFeedback || null
    });

  } catch (error) {
    console.error('❌ Erro ao excluir orçamento:', error);
    
    if (conn) {
      await conn.rollback();
      conn.release();
    }
    
    res.status(500).json({ 
      message: 'Erro ao excluir orçamento',
      error: error.message
    });
  }
});
// =======================================================================
// NOVAS ROTAS PARA FUNCIONALIDADES DE ORÇAMENTOS
// =======================================================================

// Rota para marcar orçamento como lido/não lido
app.put('/api/orcamentos/:id/lido', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { lido } = req.body;

    const conn = await db.getConnection();
    const query = 'UPDATE orcamento SET lido = ? WHERE id_orcamento = ?';
    const [result] = await conn.execute(query, [lido, parseInt(id)]);
    conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Orçamento não encontrado' });
    }

    res.json({ 
      message: lido ? 'Orçamento marcado como lido!' : 'Orçamento marcado como não lido!',
      lido: lido 
    });
  } catch (error) {
    console.error('Erro ao atualizar status de leitura:', error);
    res.status(500).json({ message: 'Erro ao atualizar orçamento' });
  }
});

// Rota para buscar detalhes completos de um orçamento
app.get('/api/orcamentos/:id/detalhes', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const conn = await db.getConnection();
    
    // Buscar dados básicos do orçamento
    const [orcamentos] = await conn.execute(`
      SELECT 
        o.*,
        f.estrelas,
        f.feedback,
        f.lido as feedback_lido,
        f.data_criacao as feedback_data
      FROM orcamento o
      LEFT JOIN feedback f ON o.id_feedback = f.id_feedback
      WHERE o.id_orcamento = ?
    `, [parseInt(id)]);

    if (orcamentos.length === 0) {
      conn.release();
      return res.status(404).json({ message: 'Orçamento não encontrado' });
    }

    const orcamento = orcamentos[0];

    // Buscar itens detalhados do orçamento
    const [itens] = await conn.execute(`
      SELECT 
        p.id_produto,
        p.nome_produto,
        p.preco_produto,
        op.quantidade,
        (p.preco_produto * op.quantidade) as subtotal
      FROM orcamento_produto op 
      JOIN produtos p ON op.id_produto = p.id_produto 
      WHERE op.id_orcamento = ?
    `, [parseInt(id)]);

    conn.release();

    // Calcular totais
    const totalItens = itens.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
    const totalCalculado = parseFloat(orcamento.orcamento || totalItens);

    res.json({
      ...orcamento,
      itens_detalhados: itens,
      total_calculado: totalCalculado,
      quantidade_itens: itens.length
    });

  } catch (error) {
    console.error('Erro ao buscar detalhes do orçamento:', error);
    res.status(500).json({ message: 'Erro ao buscar detalhes do orçamento' });
  }
});

// Rota para marcar feedback como lido
app.put('/api/feedback/:id/lido', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { lido } = req.body;

    const conn = await db.getConnection();
    const query = 'UPDATE feedback SET lido = ? WHERE id_feedback = ?';
    const [result] = await conn.execute(query, [lido, parseInt(id)]);
    conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Feedback não encontrado' });
    }

    res.json({ 
      message: lido ? 'Feedback marcado como lido!' : 'Feedback marcado como não lido!',
      lido: lido 
    });
  } catch (error) {
    console.error('Erro ao atualizar status do feedback:', error);
    res.status(500).json({ message: 'Erro ao atualizar feedback' });
  }
});

// Rota para buscar orçamentos (protegida - para o admin) - VERSÃO COM DATA
app.get('/api/orcamentos', authenticateToken, async (req, res) => {
  try {
    const conn = await db.getConnection();
    
    const query = `
      SELECT 
        o.id_orcamento,
        o.nome_cliente,
        o.idade_cliente,
        o.email_cliente,
        o.telefone_cliente,
        o.orcamento as total,
        o.lido as orcamento_lido,
        o.data_criacao,
        f.estrelas,
        f.feedback,
        f.lido as feedback_lido
      FROM orcamento o
      LEFT JOIN feedback f ON o.id_feedback = f.id_feedback
      ORDER BY o.data_criacao DESC
    `;
    
    const [orcamentos] = await conn.execute(query);
    
    // Buscar itens separadamente para cada orçamento
    for (let orcamento of orcamentos) {
      const [itens] = await conn.execute(`
        SELECT p.nome_produto, op.quantidade, p.preco_produto
        FROM orcamento_produto op 
        JOIN produtos p ON op.id_produto = p.id_produto 
        WHERE op.id_orcamento = ?
      `, [orcamento.id_orcamento]);
      
      orcamento.itens = itens.map(item => 
        `${item.nome_produto} (${item.quantidade} un × R$ ${parseFloat(item.preco_produto).toFixed(2)})`
      ).join(', ');
    }
    
    conn.release();
    res.json(orcamentos);
    
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    res.status(500).json({ message: 'Erro ao buscar orçamentos' });
  }
});

// Listar todos os produtos (Protegida)
app.get('/api/produtos', authenticateToken, async (req, res) => {
  try {
    const conn = await db.getConnection();
    const [rows] = await conn.execute('SELECT * FROM produtos');
    conn.release();
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar produtos' });
  }
});

// Cadastrar Produto (Protegida)
app.post('/api/produtos', authenticateToken, async (req, res) => {
  try {
    const { nome_produto, preco_produto } = req.body;
    if (!nome_produto || preco_produto === undefined || preco_produto <= 0) {
      return res.status(400).json({ message: 'Nome e preço (válido) são obrigatórios' });
    }

    const conn = await db.getConnection();
    const query = 'INSERT INTO produtos (nome_produto, preco_produto) VALUES (?, ?)';
    const [result] = await conn.execute(query, [nome_produto, parseFloat(preco_produto)]);
    conn.release();

    res.status(201).json({ message: 'Produto cadastrado com sucesso!', insertedId: result.insertId });
  } catch (error) {
    console.error('Erro ao cadastrar produto:', error);
    res.status(500).json({ message: 'Erro ao cadastrar produto' });
  }
});

// Alterar Produto
app.put('/api/produtos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome_produto, preco_produto } = req.body;

    if (!nome_produto || preco_produto === undefined || preco_produto <= 0) {
      return res.status(400).json({ message: 'Nome e preço (válido) são obrigatórios' });
    }
    
    const conn = await db.getConnection();
    const query = 'UPDATE produtos SET nome_produto = ?, preco_produto = ? WHERE id_produto = ?';
    const [result] = await conn.execute(query, [nome_produto, parseFloat(preco_produto), parseInt(id)]);
    conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    res.status(200).json({ message: 'Produto atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ message: 'Erro ao atualizar produto' });
  }
});

// Excluir Produto (DELETE) (Protegida)
app.delete('/api/produtos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const conn = await db.getConnection();
    const query = 'DELETE FROM produtos WHERE id_produto = ?';
    const [result] = await conn.execute(query, [parseInt(id)]);
    conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    res.status(200).json({ message: 'Produto excluído com sucesso!' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({ message: 'Erro ao excluir produto' });
  }
});

// Rota de teste para checar DB
app.get('/api/ping-db', async (req, res) => {
  try {
    const conn = await db.getConnection();
    const [rows] = await conn.execute('SELECT 1 + 1 AS result');
    conn.release();
    return res.json({ ok: true, result: rows[0].result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Rota para testar estrutura das tabelas
app.get('/api/test-tables', async (req, res) => {
  try {
    const conn = await db.getConnection();
    
    const [tabelas] = await conn.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN ('feedback', 'orcamento', 'orcamento_produto', 'produtos', 'adm')
    `);
    
    const tabelasExistentes = tabelas.map(t => t.TABLE_NAME);
    console.log('📊 Tabelas existentes:', tabelasExistentes);
    
    conn.release();
    
    res.json({
      tabelas_existem: tabelasExistentes,
      status: 'OK',
      mensagem: `Encontradas ${tabelasExistentes.length} tabelas necessárias`
    });
    
  } catch (error) {
    console.error('Erro no teste de tabelas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Qualquer rota não-API cai no frontend
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ message: 'API endpoint não encontrado' });
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 API + frontend servidos em http://localhost:${PORT}`);
});