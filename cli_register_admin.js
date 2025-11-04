// cli_register_admin.js
// Utilitário de linha de comando para cadastrar um administrador no MySQL
// Este script usará bcrypt para hashear a senha antes de salvar.

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');

// Configurações (devem ser consistentes com o seu api.js e .env)
const saltRounds = 10;
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
};

async function registerAdminCLI() {
    const rl = readline.createInterface({ input, output });

    let conn;
    try {
        console.log("==================================================");
        console.log("  CADASTRO DE ADMINISTRADOR (VIA CONSOLE)");
        console.log("==================================================");

        // 1. Obter entradas do usuário
        const login = await rl.question('Digite o novo LOGIN de administrador: ');
        const senha = await rl.question('Digite a nova SENHA: ');

        if (!login || !senha) {
            console.error('\n❌ Login e senha não podem ser vazios.');
            return;
        }

        // 2. Hash da Senha
        console.log(`\n🔑 Gerando hash para a senha...`);
        const hashedPassword = await bcrypt.hash(senha, saltRounds);
        console.log('✅ Hash gerado com sucesso.');

        // 3. Conectar e Inserir no Banco de Dados
        conn = await mysql.createConnection(dbConfig);

        const [result] = await conn.execute(
            'INSERT INTO adm (login, senha) VALUES (?, ?)',
            [login, hashedPassword]
        );

        console.log('\n==================================================');
        if (result.affectedRows === 1) {
            console.log(`🎉 SUCESSO! Administrador '${login}' cadastrado no banco.`);
            console.log(`Lembre-se: O campo 'senha' no MySQL agora contém o hash.`);
        } else {
            console.error('❌ ERRO: Nenhuma linha foi afetada. O cadastro falhou.');
        }
        console.log('==================================================');

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            console.error('\n❌ ERRO: Este login já existe na tabela `adm`.');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('\n❌ ERRO DE CONEXÃO: Verifique se o MySQL está ativo e se suas variáveis .env estão corretas.');
        } else {
            console.error('\n❌ Ocorreu um erro durante o processo:', error.message);
        }
    } finally {
        if (conn) {
            await conn.end(); // Fechar a conexão
        }
        rl.close();
    }
}

registerAdminCLI();
