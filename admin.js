// admin.js
document.addEventListener('DOMContentLoaded', () => {
     
    // Pega o token de autenticação salvo no login.js
    const adminToken = localStorage.getItem('admin_token');
    
    // =======================================================================
    // 1. SEGURANÇA E SETUP INICIAL
    // =======================================================================
    
    // Verifica se o token existe. Se não, redireciona para a página de login.
    if (!adminToken) {
        showCustomAlert('Sessão inválida. Por favor, faça login novamente.', () => {
            window.location.href = 'login.html'; 
        });
        return; 
    }

    const API_URL = '/api';
    
    // Função auxiliar para montar os headers com o token de autenticação
    const getHeaders = (contentType = 'application/json') => ({
        'Content-Type': contentType,
        'Authorization': `Bearer ${adminToken}`
    });

    // Evento de Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('admin_token');
        showCustomAlert('Sessão encerrada com sucesso!', () => {
            window.location.href = 'login.html';
        });
    });
    

    // =======================================================================
    // 2. FUNÇÕES CRUD: GERENCIAMENTO DE PRODUTOS
    // =======================================================================

    // A. Função: LER PRODUTOS (READ)
    const fetchProdutos = async () => {
        const tabelaBody = document.querySelector('#tabelaProdutos tbody');
        tabelaBody.innerHTML = '<tr><td colspan="4">Carregando produtos...</td></tr>';
        
        try {
            const response = await fetch(`${API_URL}/produtos`, { headers: getHeaders() });
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('Token inválido ou expirado. Faça login novamente.');
                }
                throw new Error('Falha ao carregar produtos.');
            }
            const produtos = await response.json();
            
            tabelaBody.innerHTML = '';

            if (produtos.length === 0) {
                tabelaBody.innerHTML = '<tr><td colspan="4">Nenhum produto cadastrado.</td></tr>';
                return;
            }
        
            produtos.forEach(produto => {
                const row = tabelaBody.insertRow();
                row.id = `produto-${produto.id_produto}`;
                row.insertCell().textContent = produto.id_produto;
                row.insertCell().textContent = produto.nome_produto;
                row.insertCell().textContent = `R$ ${parseFloat(produto.preco_produto).toFixed(2)}`;
                
                const actionCell = row.insertCell();
                
                const btnEdit = document.createElement('button');
                btnEdit.textContent = 'Alterar';
                btnEdit.classList.add('btn-edit');
                btnEdit.onclick = () => iniciarEdicao(row, produto);
                
                const btnDelete = document.createElement('button');
                btnDelete.textContent = 'Excluir';
                btnDelete.classList.add('btn-delete');
                btnDelete.onclick = () => confirmDelete(produto.id_produto);

                actionCell.appendChild(btnEdit);
                actionCell.appendChild(btnDelete);
            });
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            tabelaBody.innerHTML = `<tr><td colspan="4" style="color: red;">Erro: ${error.message}</td></tr>`;
            if (error.message.includes('Token')) {
                showCustomAlert(error.message, () => window.location.href = 'login.html');
            }
        }
    };
    window.fetchProdutos = fetchProdutos;

    // B. Função: CRIAR NOVO PRODUTO (CREATE)
    document.getElementById('formNovoProduto').addEventListener('submit', async function(e) {
        e.preventDefault();

        const nome = document.getElementById('nomeProduto').value;
        const preco = document.getElementById('precoProduto').value;

        const novoProduto = { 
            nome_produto: nome, 
            preco_produto: parseFloat(preco) 
        };
        
        try {
            const response = await fetch(`${API_URL}/produtos`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(novoProduto)
            });
            if (!response.ok) throw new Error('Falha ao cadastrar produto');
            
            showCustomAlert(`Produto "${nome}" cadastrado com sucesso!`);
        
            document.getElementById('formNovoProduto').reset();
            fetchProdutos();
        } catch (error) {
            console.error('Erro ao cadastrar:', error);
            showCustomAlert(`Erro ao cadastrar: ${error.message}`);
        }
    });

    // C. Função: EXCLUIR PRODUTO (DELETE)
    const confirmDelete = (produtoId) => {
        showCustomConfirm(`Tem certeza que deseja EXCLUIR o produto ID ${produtoId}?`, async () => {
            try {
                const response = await fetch(`${API_URL}/produtos/${produtoId}`, {
                    method: 'DELETE',
                    headers: getHeaders()
                });
                if (!response.ok) throw new Error('Falha ao excluir produto');
                
                showCustomAlert(`Produto ID ${produtoId} excluído com sucesso!`);
                fetchProdutos();
            } catch (error) {
                console.error('Erro ao excluir:', error);
                showCustomAlert(`Erro ao excluir: ${error.message}`);
            }
        });
    };
    
    // D. Funções de ALTERAR PRODUTO (UPDATE)
    const iniciarEdicao = (row, produto) => {
        row.innerHTML = `
            <td>${produto.id_produto}</td>
            <td><input type="text" id="edit-nome-${produto.id_produto}" value="${produto.nome_produto}" required></td>
            <td><input type="number" id="edit-valor-${produto.id_produto}" value="${parseFloat(produto.preco_produto).toFixed(2)}" step="0.01" required></td>
            <td>
                <button class="btn-save" onclick="salvarAlteracao(${produto.id_produto})">Salvar</button>
                <button class="btn-cancel" onclick="fetchProdutos()">Cancelar</button>
            </td>
        `;
    };
    window.iniciarEdicao = iniciarEdicao;

    const salvarAlteracao = async (produtoId) => {
        const nome = document.getElementById(`edit-nome-${produtoId}`).value;
        const valor = parseFloat(document.getElementById(`edit-valor-${produtoId}`).value);

        if (isNaN(valor) || valor <= 0) {
            showCustomAlert("O valor do preço deve ser um número válido e maior que zero.");
            return;
        }
        if (!nome) {
            showCustomAlert("O nome do produto não pode ficar em branco.");
            return;
        }

        const dadosAtualizados = { 
            nome_produto: nome, 
            preco_produto: valor 
        };

        try {
            const response = await fetch(`${API_URL}/produtos/${produtoId}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(dadosAtualizados)
            });
            if (!response.ok) throw new Error('Falha ao atualizar produto');
            
            showCustomAlert('Produto atualizado com sucesso!');
            fetchProdutos();
        } catch (error) {
            console.error('Erro ao atualizar:', error);
            showCustomAlert(`Erro ao atualizar: ${error.message}`);
        }
    };
    window.salvarAlteracao = salvarAlteracao;

    // =======================================================================
    // 3. FUNÇÃO DE VISUALIZAÇÃO DE ORÇAMENTOS
    // =======================================================================
    
    const fetchOrcamentos = async () => {
        const container = document.getElementById('orcamentosContainer'); 
        const loadingMessage = document.getElementById('loadingOrcamentos');

        loadingMessage.textContent = 'Carregando orçamentos...';
        container.innerHTML = '';
        
        try {
            const response = await fetch(`${API_URL}/orcamentos`, { 
                headers: getHeaders() 
            });
            
            if (!response.ok) throw new Error('Falha ao carregar orçamentos');
            
            const orcamentos = await response.json();
            loadingMessage.textContent = '';

            if (orcamentos.length === 0) {
                container.innerHTML = '<p>Nenhum orçamento recebido.</p>';
                return;
            }

            orcamentos.forEach(orcamento => {
                const card = document.createElement('div');
                card.classList.add('orcamento-card');
                card.setAttribute('data-orcamento-id', orcamento.id_orcamento);
                
                const dataFormatada = orcamento.data_criacao 
                    ? new Date(orcamento.data_criacao).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                    : 'Data não disponível';

                const statusLido = orcamento.orcamento_lido ? '✅ Lido' : '📝 Não lido';
                const statusFeedback = orcamento.feedback_lido ? '✅ Lido' : '📝 Não lido';

                
                card.innerHTML = `
                    <div class="card-header">
                        <h3>Orçamento #ORC-${orcamento.id_orcamento}</h3>
                        <div class="card-status">
                            <span class="status ${orcamento.orcamento_lido ? 'lido' : 'nao-lido'}">${statusLido}</span>
                        </div>
                    </div>
                    
                    <div class="card-content">
                        <p><strong>Cliente:</strong> ${orcamento.nome_cliente}</p>
                        <p><strong>Idade:</strong> ${orcamento.idade_cliente} anos</p>
                        <p><strong>E-mail:</strong> ${orcamento.email_cliente}</p>
                        <p><strong>Telefone:</strong> ${orcamento.telefone_cliente}</p>
                        <p><strong>Total:</strong> R$ ${parseFloat(orcamento.total || 0).toFixed(2)}</p>
                        <p><strong>Data:</strong> ${dataFormatada}</p>
                        
                        <div class="card-section">
                            <h4>📦 Itens Solicitados:</h4>
                            <p>${orcamento.itens || 'Nenhum item listado'}</p>
                        </div>
                        
                        <!-- FEEDBACK AGORA É OPCIONAL -->
                        ${orcamento.estrelas || orcamento.feedback ? `
                        <div class="card-section">
                            <h4>⭐ Avaliação & Feedback:</h4>
                            ${orcamento.estrelas ? `<p><strong>Avaliação:</strong> ${orcamento.estrelas} estrelas</p>` : ''}
                            ${orcamento.feedback ? `<p><strong>Comentário:</strong> "${orcamento.feedback}"</p>` : ''}
                            <p><strong>Status Feedback:</strong> ${statusFeedback}</p>
                        </div>
                        ` : `
                        <div class="card-section">
                            <h4>💬 Feedback:</h4>
                            <p><em>Cliente não deixou feedback</em></p>
                        </div>
                        `}
                    </div>
                    
                    <div class="card-actions">
                        <div class="action-group">
                            <button class="btn-detalhes" onclick="verDetalhes(${orcamento.id_orcamento})">
                                🔍 Ver Detalhes
                            </button>
                            <button class="btn-marcar-lido" onclick="marcarComoLido(${orcamento.id_orcamento})">
                                ${orcamento.orcamento_lido ? '✅ Marcado como Lido' : '📝 Marcar como Lido'}
                            </button>
                        </div>
                        <div class="action-group">
                            <button class="btn-excluir" onclick="excluirOrcamento(${orcamento.id_orcamento}, '${orcamento.nome_cliente.replace(/'/g, "\\'")}')" title="Excluir orçamento">
                                🗑️ Excluir
                            </button>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
            
        } catch (error) {
            console.error("Erro ao buscar orçamentos:", error);
            loadingMessage.textContent = `Erro ao carregar orçamentos: ${error.message}`;
        }
    };

    // =======================================================================
    // 4. FUNÇÕES DE ORÇAMENTOS (LIDO, DETALHES, EXCLUIR)
    // =======================================================================

    window.marcarComoLido = async (idOrcamento) => {
        try {
            const orcamentoCard = document.querySelector(`[data-orcamento-id="${idOrcamento}"]`);
            const currentlyLido = orcamentoCard.querySelector('.btn-marcar-lido').textContent.includes('Marcado');
            const novoStatus = !currentlyLido;

            const response = await fetch(`${API_URL}/orcamentos/${idOrcamento}/lido`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ lido: novoStatus })
            });

            if (!response.ok) throw new Error('Falha ao atualizar status');

            const data = await response.json();
            
            const btnLido = orcamentoCard.querySelector('.btn-marcar-lido');
            const statusSpan = orcamentoCard.querySelector('.status');
            
            if (novoStatus) {
                btnLido.textContent = '✅ Marcado como Lido';
                btnLido.style.background = '#6c757d';
                statusSpan.textContent = '✅ Lido';
                statusSpan.className = 'status lido';
                orcamentoCard.style.opacity = '0.8';
            } else {
                btnLido.textContent = '📝 Marcar como Lido';
                btnLido.style.background = '#28a745';
                statusSpan.textContent = '📝 Não lido';
                statusSpan.className = 'status nao-lido';
                orcamentoCard.style.opacity = '1';
            }

            showCustomAlert(data.message);

        } catch (error) {
            console.error('Erro ao marcar como lido:', error);
            showCustomAlert(`Erro: ${error.message}`);
        }
    };

    window.verDetalhes = async (idOrcamento) => {
        try {
            const response = await fetch(`${API_URL}/orcamentos/${idOrcamento}/detalhes`, {
                headers: getHeaders()
            });

            if (!response.ok) throw new Error('Falha ao carregar detalhes');

            const orcamento = await response.json();
            mostrarModalDetalhes(orcamento);

        } catch (error) {
            console.error('Erro ao carregar detalhes:', error);
            showCustomAlert(`Erro ao carregar detalhes: ${error.message}`);
        }
    };

    window.excluirOrcamento = async (idOrcamento, nomeCliente) => {
        showCustomConfirm(
            `🗑️ Tem certeza que deseja EXCLUIR o orçamento #ORC-${idOrcamento} do cliente "${nomeCliente}"?\n\n` +
            `⚠️ Esta ação não pode ser desfeita!\n` +
            `❌ Orçamento será permanentemente excluído\n` +
            `❌ Itens do orçamento serão excluídos\n` +
            `❌ Feedback associado será excluído`,
            
            async () => {
                try {
                    const response = await fetch(`${API_URL}/orcamentos/${idOrcamento}`, {
                        method: 'DELETE',
                        headers: getHeaders()
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Falha ao excluir orçamento');
                    }

                    const data = await response.json();
                    
                    const card = document.querySelector(`[data-orcamento-id="${idOrcamento}"]`);
                    if (card) {
                        card.style.transition = 'all 0.3s ease';
                        card.style.opacity = '0';
                        card.style.transform = 'translateX(-100px)';
                        
                        setTimeout(() => {
                            card.remove();
                            showCustomAlert(`✅ ${data.message}`);
                            
                            const cardsRestantes = document.querySelectorAll('.orcamento-card').length;
                            if (cardsRestantes === 0) {
                                fetchOrcamentos();
                            }
                        }, 300);
                    } else {
                        showCustomAlert(`✅ ${data.message}`);
                        fetchOrcamentos();
                    }

                } catch (error) {
                    console.error('Erro ao excluir orçamento:', error);
                    showCustomAlert(`❌ Erro ao excluir: ${error.message}`);
                }
            }
        );
    };

    window.marcarFeedbackLido = async (idFeedback, button) => {
        try {
            const response = await fetch(`${API_URL}/feedback/${idFeedback}/lido`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ lido: true })
            });

            if (!response.ok) throw new Error('Falha ao atualizar feedback');

            const data = await response.json();
            
            button.textContent = '✅ Feedback Lido';
            button.style.background = '#6c757d';
            button.disabled = true;
            
            showCustomAlert(data.message);

        } catch (error) {
            console.error('Erro ao marcar feedback como lido:', error);
            showCustomAlert(`Erro: ${error.message}`);
        }
    };

    // =======================================================================
    // 5. FUNÇÕES DE MODAL
    // =======================================================================

    const mostrarModalDetalhes = (orcamento) => {
        const modal = document.createElement('div');
        modal.id = `modal-${orcamento.id_orcamento}`;
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        const dataFormatada = orcamento.data_criacao 
            ? new Date(orcamento.data_criacao).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            : 'Data não disponível';

        const totalItens = orcamento.itens_detalhados ? orcamento.itens_detalhados.reduce((sum, item) => 
            sum + (parseFloat(item.preco_produto) * parseInt(item.quantidade)), 0) : 0;

        modal.innerHTML = `
            <div class="modal-content" style="
                background: white;
                padding: 30px;
                border-radius: 10px;
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
                width: 90%;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                position: relative;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; color: #333;">Detalhes do Orçamento #ORC-${orcamento.id_orcamento}</h2>
                    <button onclick="fecharModal('${orcamento.id_orcamento}')" style="
                        background: #dc3545;
                        color: white;
                        border: none;
                        padding: 8px 12px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: bold;
                    ">✕ Fechar</button>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div>
                        <h3 style="color: #555; border-bottom: 2px solid #007bff; padding-bottom: 5px;">📋 Dados do Cliente</h3>
                        <p><strong>Nome:</strong> ${orcamento.nome_cliente}</p>
                        <p><strong>Idade:</strong> ${orcamento.idade_cliente} anos</p>
                        <p><strong>E-mail:</strong> ${orcamento.email_cliente}</p>
                        <p><strong>Telefone:</strong> ${orcamento.telefone_cliente}</p>
                        <p><strong>Data:</strong> ${dataFormatada}</p>
                        <p><strong>Status:</strong> ${orcamento.lido ? '✅ Lido' : '📝 Não lido'}</p>
                    </div>

                    <div>
                        <h3 style="color: #555; border-bottom: 2px solid #28a745; padding-bottom: 5px;">💰 Resumo Financeiro</h3>
                        <p><strong>Total do Orçamento:</strong> R$ ${parseFloat(orcamento.orcamento || totalItens).toFixed(2)}</p>
                        <p><strong>Quantidade de Itens:</strong> ${orcamento.quantidade_itens || (orcamento.itens_detalhados ? orcamento.itens_detalhados.length : 0)}</p>
                    </div>
                </div>

                ${orcamento.itens_detalhados ? `
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #555; border-bottom: 2px solid #ffc107; padding-bottom: 5px;">📦 Itens do Orçamento</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Produto</th>
                                <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">Quantidade</th>
                                <th style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">Preço Unit.</th>
                                <th style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orcamento.itens_detalhados.map(item => `
                                <tr>
                                    <td style="padding: 10px; border: 1px solid #dee2e6;">${item.nome_produto}</td>
                                    <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">${item.quantidade}</td>
                                    <td style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">R$ ${parseFloat(item.preco_produto).toFixed(2)}</td>
                                    <td style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">R$ ${(parseFloat(item.preco_produto) * parseInt(item.quantidade)).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr style="background: #e9ecef; font-weight: bold;">
                                <td colspan="3" style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">Total:</td>
                                <td style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">R$ ${totalItens.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                ` : ''}

                ${orcamento.estrelas || orcamento.feedback ? `
                <div>
                    <h3 style="color: #555; border-bottom: 2px solid #17a2b8; padding-bottom: 5px;">⭐ Avaliação do Cliente</h3>
                    ${orcamento.estrelas ? `<p><strong>Avaliação:</strong> ${'★'.repeat(orcamento.estrelas)}${'☆'.repeat(5-orcamento.estrelas)} (${orcamento.estrelas} estrelas)</p>` : ''}
                    ${orcamento.feedback ? `<p><strong>Comentário:</strong> "${orcamento.feedback}"</p>` : ''}
                    <p><strong>Status do Feedback:</strong> ${orcamento.feedback_lido ? '✅ Lido' : '📝 Não lido'}</p>
                    ${!orcamento.feedback_lido && orcamento.id_feedback ? `
                        <button onclick="marcarFeedbackLido(${orcamento.id_feedback}, this)" style="
                            background: #17a2b8;
                            color: white;
                            border: none;
                            padding: 8px 15px;
                            border-radius: 5px;
                            cursor: pointer;
                            margin-top: 10px;
                        ">📝 Marcar Feedback como Lido</button>
                    ` : ''}
                </div>
                ` : ''}

                <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="marcarComoLido(${orcamento.id_orcamento}); fecharModal('${orcamento.id_orcamento}')" style="
                        background: ${orcamento.lido ? '#6c757d' : '#28a745'};
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                    ">
                        ${orcamento.lido ? '✅ Marcado como Lido' : '📝 Marcar como Lido'}
                    </button>
                    <button onclick="fecharModal('${orcamento.id_orcamento}')" style="
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                    ">Fechar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                fecharModal(orcamento.id_orcamento.toString());
            }
        });

        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                fecharModal(orcamento.id_orcamento.toString());
                document.removeEventListener('keydown', keyHandler);
            }
        };
        document.addEventListener('keydown', keyHandler);
    };

    window.fecharModal = (idOrcamento) => {
        const modal = document.getElementById(`modal-${idOrcamento}`);
        if (modal) {
            modal.remove();
        }
    };

    // =======================================================================
    // 6. UTILITÁRIOS (MODAIS SIMPLES)
    // =======================================================================
    
    const showCustomAlert = (message, callback) => {
        alert(message);
        if (callback) {
            callback();
        }
    };
    
    const showCustomConfirm = (message, onConfirm, onCancel) => {
        if (confirm(message)) {
            if (onConfirm) onConfirm();
        } else {
            if (onCancel) onCancel();
        }
    };

    // =======================================================================
    // 7. INICIALIZAÇÃO
    // =======================================================================
    fetchProdutos();
    fetchOrcamentos();
});