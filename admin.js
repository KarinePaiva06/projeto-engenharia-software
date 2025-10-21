// admin.js

document.addEventListener('DOMContentLoaded', () => {
    
    // Pega o token de autenticação salvo no login.js
    const adminToken = localStorage.getItem('admin_token');
    
    // =======================================================================
    // 1. SEGURANÇA E SETUP INICIAL
    // =======================================================================
    
    // Verifica se o token existe. Se não, redireciona para a página de login.
    if (!adminToken) {
        alert('Sessão inválida. Por favor, faça login novamente.');
        window.location.href = 'login.html'; 
        return; 
    }

    const API_URL = '/api'; // URL base da sua API (Back-end)
    
    // Função auxiliar para montar os headers com o token de autenticação
    const getHeaders = (contentType = 'application/json') => ({
        'Content-Type': contentType,
        'Authorization': `Bearer ${adminToken}` // ESSENCIAL: Envia o token
    });

    // Evento de Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('admin_token'); // Remove o token
        alert('Sessão encerrada com sucesso!');
        window.location.href = 'login.html'; // Redireciona para o login
    });
    

    // =======================================================================
    // 2. FUNÇÕES CRUD: GERENCIAMENTO DE PRODUTOS
    // =======================================================================

    // A. Função: LER PRODUTOS (READ)
    const fetchProdutos = async () => {
        const tabelaBody = document.querySelector('#tabelaProdutos tbody');
        tabelaBody.innerHTML = '<tr><td colspan="4">Carregando produtos...</td></tr>';
        
        // SIMULAÇÃO DE DADOS (Substituir pela chamada real da API)
        const produtosSimulados = [
            { id: 1, nome: "Serviço de Consultoria", valor: 150.00 },
            { id: 2, nome: "Licença de Software", valor: 75.90 },
            { id: 3, nome: "Manutenção", valor: 25.00 },
        ];
        
        // CÓDIGO REAL PARA PRODUÇÃO:
        /*
        const response = await fetch(`${API_URL}/produtos`, { headers: getHeaders() });
        const produtosSimulados = await response.json(); 
        */
        
        tabelaBody.innerHTML = ''; // Limpa a mensagem de carregamento
        
        produtosSimulados.forEach(produto => {
            const row = tabelaBody.insertRow();
            row.id = `produto-${produto.id}`;
            row.insertCell().textContent = produto.id;
            row.insertCell().textContent = produto.nome;
            row.insertCell().textContent = `R$ ${produto.valor.toFixed(2)}`;
            
            // Célula das Ações
            const actionCell = row.insertCell();
            
            const btnEdit = document.createElement('button');
            btnEdit.textContent = 'Alterar';
            btnEdit.classList.add('btn-edit');
            btnEdit.onclick = () => iniciarEdicao(row, produto);
            
            const btnDelete = document.createElement('button');
            btnDelete.textContent = 'Excluir';
            btnDelete.classList.add('btn-delete');
            btnDelete.onclick = () => confirmDelete(produto.id);

            actionCell.appendChild(btnEdit);
            actionCell.appendChild(btnDelete);

        });
    };
    window.fetchProdutos = fetchProdutos; // <--- ADICIONE AQUI
    

    // B. Função: CRIAR NOVO PRODUTO (CREATE)
    document.getElementById('formNovoProduto').addEventListener('submit', async function(e) {
        e.preventDefault();

        const nome = document.getElementById('nomeProduto').value;
        const valor = document.getElementById('precoProduto').value;

        const novoProduto = { nome, valor: parseFloat(valor) };

        console.log('Enviando para a API (Criar Produto):', novoProduto);
        
        // CÓDIGO REAL PARA PRODUÇÃO:
        /*
        const response = await fetch(`${API_URL}/produtos`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(novoProduto)
        });
        if (!response.ok) throw new Error('Falha ao cadastrar produto');
        alert(`Produto "${nome}" cadastrado com sucesso!`);
        */
        
        alert(`PRODUTO SIMULADO CADASTRADO: ${nome}`);
        document.getElementById('formNovoProduto').reset();
        fetchProdutos(); // Recarrega a lista para mostrar o novo produto
    });

    // C. Função: EXCLUIR PRODUTO (DELETE)
    const confirmDelete = async (produtoId) => {
        if (!confirm(`Tem certeza que deseja EXCLUIR o produto ID ${produtoId}?`)) return;

        console.log(`Deletando produto ID ${produtoId}...`);

        // CÓDIGO REAL PARA PRODUÇÃO:
        /*
        const response = await fetch(`${API_URL}/produtos/${produtoId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Falha ao excluir produto');
        alert(`Produto ID ${produtoId} excluído com sucesso!`);
        */
        
        alert(`SIMULANDO EXCLUSÃO do produto ID ${produtoId}.`);
        fetchProdutos(); // Recarrega a lista
    };
    
    // D. Funções de ALTERAR PRODUTO (UPDATE)
    
    // 1. Inicia o modo de Edição na linha da tabela
    const iniciarEdicao = (row, produto) => {
        // Assegura que o HTML da linha seja preenchido com inputs
        row.innerHTML = `
            <td>${produto.id}</td>
            <td><input type="text" id="edit-nome-${produto.id}" value="${produto.nome}" required></td>
            <td><input type="number" id="edit-valor-${produto.id}" value="${produto.valor.toFixed(2)}" step="0.01" required></td>
            <td>
                <button class="btn-save" onclick="salvarAlteracao(${produto.id})">Salvar</button>
                <button class="btn-cancel" onclick="fetchProdutos()">Cancelar</button>
            </td>
        `;
    };
    window.iniciarEdicao = iniciarEdicao; // <--- ADICIONE AQUI

    // 2. Salva as Alterações
    const salvarAlteracao = async (produtoId) => {
        const nome = document.getElementById(`edit-nome-${produtoId}`).value;
        const valor = parseFloat(document.getElementById(`edit-valor-${produtoId}`).value);

        if (isNaN(valor)) {
            alert("O valor do preço deve ser um número válido.");
            return;
        }

        const dadosAtualizados = { id: produtoId, nome, valor };

        console.log('Enviando para a API (Alterar Produto):', dadosAtualizados);

        // CÓDIGO REAL PARA PRODUÇÃO:
        /*
        const response = await fetch(`${API_URL}/produtos/${produtoId}`, {
            method: 'PUT', // ou PATCH
            headers: getHeaders(),
            body: JSON.stringify(dadosAtualizados)
        });
        if (!response.ok) throw new Error('Falha ao atualizar produto');
        alert('Produto atualizado com sucesso!');
        */

        alert(`SIMULANDO ALTERAÇÃO do produto ID ${produtoId}.`);
        fetchProdutos(); // Recarrega a lista para ver o resultado
    };
    window.salvarAlteracao = salvarAlteracao; // <--- ADICIONE AQUI

    // =======================================================================
    // 3. FUNÇÃO DE VISUALIZAÇÃO DE FORMULÁRIOS (FORMATO CARTÕES)
    // =======================================================================
    
    const fetchOrcamentos = async () => {
        const container = document.getElementById('orcamentosContainer'); 
        const loadingMessage = document.getElementById('loadingOrcamentos');

        loadingMessage.textContent = 'Carregando orçamentos...';
        container.innerHTML = ''; // Limpa o container
        
        // SIMULAÇÃO DE DADOS (Substituir pela chamada real da API)
        const orcamentosSimulados = [
            { id: 101, nome: "João Silva", email: "joao@exemplo.com", avaliacao: 5, telefone: "(99) 9999-9999", idade: 35, feedback: "Ótimo atendimento e sistema rápido!", data: "2025-01-20", itens: [{ nome: "Serviço X", qtd: 2 }, { nome: "Produto Y", qtd: 1 }] },
            { id: 102, nome: "Maria Souza", email: "maria@exemplo.com", telefone: "(88) 8888-8888", avaliacao: 3, idade: 30 ,feedback: "Poderia ser mais rápido.", data: "2025-01-21", itens: [{ nome: "Licença C", qtd: 5 }] },
            { id: 103, nome: "Carlos Lima", email: "carlos@exemplo.com", telefone: "(77) 7777-7777", idade: 22, avaliacao: null, feedback: "", data: "2025-01-22", itens: [{ nome: "Serviço X", qtd: 1 }] },
        ];

        // CÓDIGO REAL PARA PRODUÇÃO:
        /*
        const response = await fetch(`${API_URL}/orcamentos`, { headers: getHeaders() });
        const orcamentosSimulados = await response.json(); 
        */

        loadingMessage.textContent = ''; // Oculta a mensagem de carregamento

        if (orcamentosSimulados.length === 0) {
            container.innerHTML = '<p>Nenhum orçamento recebido.</p>';
            return;
        }

        orcamentosSimulados.forEach(orcamento => {
            // Formata a lista de itens para o cartão
            const listaItens = orcamento.itens.map(i => `• ${i.nome} (${i.qtd} un)`).join('<br>');
            
            const card = document.createElement('div');
            card.classList.add('orcamento-card');
            
            // Define o conteúdo do cartão
            card.innerHTML = `
                <h3>Orçamento #${orcamento.id} - ${orcamento.nome}</h3>
                
                <p><strong>Data:</strong> ${new Date(orcamento.data).toLocaleDateString('pt-BR')}</p>
                <p><strong>E-mail:</strong> ${orcamento.email}</p>
                <p><strong>Telefone:</strong> ${orcamento.telefone}</p>
                <p><strong>Idade:</strong> ${orcamento.idade || 'N/A'}</p>
                <p>
                    <strong>Avaliação:</strong> 
                    ${orcamento.avaliacao ? `${orcamento.avaliacao} Estrelas` : 'N/A'}
                </p>
                
                <div class="card-itens">
                    <h4>Itens do Pedido:</h4>
                    <p>${listaItens}</p>
                </div>
                
                <div class="card-feedback">
                    <strong>Feedback do Cliente:</strong> 
                    ${orcamento.feedback || 'O cliente não deixou um feedback escrito.'}
                </div>
                
                <button class="btn-detalhes" style="margin-top: 15px;">Marcar como Lido</button>
            `;

            container.appendChild(card);
        });
    };

    // =======================================================================
    // 4. INICIALIZAÇÃO
    // =======================================================================
    fetchProdutos();
    fetchOrcamentos();
});