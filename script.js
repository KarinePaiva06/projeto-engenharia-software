// ----------------------------------------------------
// 1. CONFIGURAÇÃO DA API
// ----------------------------------------------------
const API_URL = '/api';

// ----------------------------------------------------
// 2. CAPTURA DE ELEMENTOS DO HTML
// ----------------------------------------------------
const itensContainer = document.getElementById('itensContainer');
const btnAddItem = document.getElementById('btnAddItem');
const form = document.getElementById('formOrcamento');

// ----------------------------------------------------
// 3. FUNÇÃO PARA BUSCAR PRODUTOS DO BANCO DE DADOS
// ----------------------------------------------------

/**
 * Busca produtos do banco de dados via API
 */
async function buscarProdutosDaAPI() {
    try {
        const response = await fetch(`${API_URL}/produtos-public`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar produtos');
        }
        
        const produtos = await response.json();
        return produtos;
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        // Fallback para produtos simulados em caso de erro
        return [
            { id_produto: '1', nome_produto: 'Serviço A', preco_produto: 100.00 },
            { id_produto: '2', nome_produto: 'Produto B', preco_produto: 50.50 },
            { id_produto: '3', nome_produto: 'Licença C', preco_produto: 250.00 },
            { id_produto: '4', nome_produto: 'Pacote D', preco_produto: 75.00 },
        ];
    }
}

/**
 * Pega a lista de produtos da API e cria as tags <option> dentro de um <select>.
 * @param {HTMLSelectElement} selectElement - O elemento <select> a ser populado.
 */
async function popularProdutos(selectElement) {
    try {
        // 1. Buscar produtos do banco de dados
        const produtos = await buscarProdutosDaAPI();
        
        // 2. Resetar o conteúdo, mantendo apenas a opção padrão
        selectElement.innerHTML = '<option value="" disabled selected>Selecione um Produto</option>';

        // 3. Percorrer a lista de produtos da API
        produtos.forEach(produto => {
            // 4. Criar a nova tag <option>
            const option = document.createElement('option');
            
            // 5. Definir o nome visível com preço formatado
            const precoFormatado = parseFloat(produto.preco_produto).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
            option.textContent = `${produto.nome_produto} - ${precoFormatado}`;
            
            // 6. Definir o valor a ser enviado ao servidor (id_produto do banco)
            option.value = produto.id_produto;
            
            // 7. Armazenar o preço em um atributo de dados para cálculos futuros
            option.setAttribute('data-valor', produto.preco_produto);
            option.setAttribute('data-nome', produto.nome_produto);

            // 8. Inserir a <option> dentro do <select>
            selectElement.appendChild(option);
        });
        
        console.log('Produtos carregados do banco:', produtos);
    } catch (error) {
        console.error('Erro ao popular produtos:', error);
    }
}

// ----------------------------------------------------
// 4. FUNÇÕES PARA CALCULAR E MOSTRAR PREÇO TOTAL
// ----------------------------------------------------

function calcularPrecoTotal() {
    let total = 0;
    const itensAdicionados = document.querySelectorAll('.item-produto');
    
    itensAdicionados.forEach(item => {
        const select = item.querySelector('.select-produto');
        const quantidadeInput = item.querySelector('.input-quantidade');
        
        if (select.value) {
            const precoUnitario = parseFloat(select.selectedOptions[0].getAttribute('data-valor'));
            const quantidade = parseInt(quantidadeInput.value) || 0;
            total += precoUnitario * quantidade;
        }
    });
    
    return total;
}

function atualizarDisplayPrecoTotal() {
    const total = calcularPrecoTotal();
    let displayTotal = document.getElementById('displayTotal');
    
    // Criar o elemento se não existir
    if (!displayTotal) {
        displayTotal = document.createElement('div');
        displayTotal.id = 'displayTotal';
        displayTotal.style.cssText = `
            background: #e8f5e8;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #28a745;
            font-weight: bold;
            font-size: 1.2em;
            text-align: center;
        `;
        // Inserir antes do botão de enviar
        const submitButton = form.querySelector('button[type="submit"]');
        form.insertBefore(displayTotal, submitButton);
    }
    
    const totalFormatado = total.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
    
    displayTotal.innerHTML = `💰 <strong>TOTAL ESTIMADO:</strong> ${totalFormatado}`;
}

function atualizarPrecoUnitario(selectElement) {
    const selectedOption = selectElement.selectedOptions[0];
    const itemContainer = selectElement.closest('.item-produto');
    let precoUnitarioDisplay = itemContainer.querySelector('.preco-unitario');
    
    if (selectedOption && selectedOption.value) {
        const precoUnitario = parseFloat(selectedOption.getAttribute('data-valor'));
        const precoFormatado = precoUnitario.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
        
        if (!precoUnitarioDisplay) {
            precoUnitarioDisplay = document.createElement('div');
            precoUnitarioDisplay.className = 'preco-unitario';
            precoUnitarioDisplay.style.cssText = `
                font-size: 0.9em;
                color: #666;
                margin-top: 5px;
                font-style: italic;
            `;
            selectElement.parentNode.appendChild(precoUnitarioDisplay);
        }
        
        precoUnitarioDisplay.textContent = `Preço unitário: ${precoFormatado}`;
    } else if (precoUnitarioDisplay) {
        precoUnitarioDisplay.textContent = '';
    }
}

// ----------------------------------------------------
// 5. INICIALIZAÇÃO E EVENT LISTENERS
// ----------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
    const primeiroSelect = itensContainer.querySelector('.select-produto');
    await popularProdutos(primeiroSelect);
    
    // Atualizar quando a quantidade mudar
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('input-quantidade')) {
            atualizarDisplayPrecoTotal();
        }
    });
    
    // Atualizar quando o produto selecionado mudar
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('select-produto')) {
            atualizarPrecoUnitario(e.target);
            atualizarDisplayPrecoTotal();
        }
    });
    
    // Atualizar display inicial
    setTimeout(atualizarDisplayPrecoTotal, 100);
});

// ----------------------------------------------------
// 6. FUNÇÃO DE ADICIONAR NOVO ITEM
// ----------------------------------------------------

async function adicionarNovoItem() {
    // 1. Pega o primeiro item (o modelo)
    const modeloItem = itensContainer.querySelector('.item-produto');

    // 2. Clona o modelo com todos os seus filhos
    const novoItem = modeloItem.cloneNode(true);

    // 3. Resetar os valores do novo item
    const novoSelect = novoItem.querySelector('.select-produto');
    const novaQuantidade = novoItem.querySelector('.input-quantidade');
    
    // Limpar o select primeiro
    novoSelect.innerHTML = '<option value="" disabled selected>Selecione um Produto</option>';
    
    // 4. Popular o novo select com produtos do banco
    await popularProdutos(novoSelect);
    
    // Resetar quantidade
    novaQuantidade.value = 1;

    // 5. ADICIONAR BOTÃO DE REMOVER
    const btnRemover = document.createElement('button');
    btnRemover.type = 'button';
    btnRemover.textContent = 'Remover';
    btnRemover.classList.add('btn-remover');
    
    btnRemover.onclick = () => {
        novoItem.remove();
        atualizarDisplayPrecoTotal();
    };
    novoItem.appendChild(btnRemover);

    // 6. Adiciona o item recém-clonado ao container
    itensContainer.appendChild(novoItem);
    
    // 7. Atualizar o preço total após adicionar novo item
    setTimeout(atualizarDisplayPrecoTotal, 100);
}

// 8. Associar a função ao clique do botão "+"
btnAddItem.addEventListener('click', adicionarNovoItem);

// ----------------------------------------------------
// 7. PROCESSAMENTO E ENVIO DO FORMULÁRIO
// ----------------------------------------------------

// No script.js, na parte do evento de submit, modifique a coleta de dados:
form.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Validações básicas
    if (!form.checkValidity()) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    const idadeInput = document.getElementById('idade');
    if (parseInt(idadeInput.value) < 18) {
        alert('A idade deve ser maior ou igual a 18 anos.');
        return;
    }
    
    // Coletar dados - FEEDBACK AGORA É OPCIONAL
    const dadosParaAPI = {
        nome: form.nome.value.trim(),
        idade: parseInt(form.idade.value),
        email: form.email.value.trim(),
        telefone: form.telefone.value.trim(),
        feedback: document.getElementById('feedback').value.trim() || null, // Pode ser null
        avaliacao: document.querySelector('input[name="avaliacao"]:checked')?.value || null, // Pode ser null
        itens: []
    };

    // Coletar itens
    const itensAdicionados = document.querySelectorAll('.item-produto');
    let temItemValido = false;
    
    itensAdicionados.forEach(item => {
        const produtoId = item.querySelector('.select-produto').value;
        const quantidade = item.querySelector('.input-quantidade').value;

        if (produtoId && quantidade > 0) {
            dadosParaAPI.itens.push({
                produto_id: parseInt(produtoId),
                quantidade: parseInt(quantidade)
            });
            temItemValido = true;
        }
    });

    if (!temItemValido) {
        alert('Por favor, adicione pelo menos um item válido ao orçamento.');
        return;
    }

    console.log('Enviando dados para API:', dadosParaAPI);

    // Mostrar loading
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Enviando...';
    submitButton.disabled = true;

    try {
        const response = await fetch('/api/orcamentos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadosParaAPI),
        });
        
        const responseData = await response.json();
        console.log('Resposta da API:', responseData);
        
        if (response.ok) {
            const totalFinal = calcularPrecoTotal();
            const totalFormatado = totalFinal.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
            
            alert(`✅ ${responseData.message}\n\nNúmero: ${responseData.numero_orcamento}\nTotal: ${totalFormatado}\n\nEm breve entraremos em contato!`);
            
            // Limpar formulário
            limparFormulario();
            
        } else {
            throw new Error(responseData.message || `Erro ${response.status}`);
        }
        
    } catch (error) {
        console.error('Erro completo:', error);
        alert(`❌ Falha ao enviar orçamento: ${error.message}`);
    } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
});

function limparFormulario() {
    form.reset();
    
    // Limpar itens dinâmicos, mantendo apenas o primeiro
    const itensParaRemover = document.querySelectorAll('.item-produto:not(:first-child)');
    itensParaRemover.forEach(item => item.remove());
    
    // Resetar o primeiro item
    const primeiroSelect = itensContainer.querySelector('.select-produto');
    primeiroSelect.selectedIndex = 0;
    const primeiraQuantidade = itensContainer.querySelector('.input-quantidade');
    primeiraQuantidade.value = 1;
    
    // Limpar displays
    const precosUnitarios = document.querySelectorAll('.preco-unitario');
    precosUnitarios.forEach(preco => preco.remove());
    
    // Limpar estrelas selecionadas
    const estrelasSelecionadas = document.querySelectorAll('input[name="avaliacao"]:checked');
    estrelasSelecionadas.forEach(estrela => estrela.checked = false);
    
    atualizarDisplayPrecoTotal();
}