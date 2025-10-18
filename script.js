// ----------------------------------------------------
// 1. DADOS DE PRODUTOS (SIMULAÇÃO DA API)
// ----------------------------------------------------

// Em um projeto real, você substituiria esta constante 
// pela chamada 'fetch' ou 'axios' para sua API.
const listaProdutosAPI = [
    { id: '1', nome: 'Serviço A', valor: 100.00 },
    { id: '2', nome: 'Produto B', valor: 50.50 },
    { id: '3', nome: 'Licença C', valor: 250.00 },
    { id: '4', nome: 'Pacote D', valor: 75.00 },
];

// ----------------------------------------------------
// 2. CAPTURA DE ELEMENTOS DO HTML
// ----------------------------------------------------

const itensContainer = document.getElementById('itensContainer');
const btnAddItem = document.getElementById('btnAddItem');
const form = document.getElementById('formOrcamento');

// ----------------------------------------------------
// 3. FUNÇÃO DE POPULAR O DROPDOWN (SELECT)
// ----------------------------------------------------

/**
 * Pega a lista de produtos (simulada) e cria as tags <option> dentro de um <select>.
 * @param {HTMLSelectElement} selectElement - O elemento <select> a ser populado.
 */
function popularProdutos(selectElement) {
    // 1. Resetar o conteúdo, mantendo apenas a opção padrão
    selectElement.innerHTML = '<option value="" disabled selected>Selecione um Produto</option>';

    // 2. Percorrer a lista de produtos da API
    listaProdutosAPI.forEach(produto => {
        // 3. Criar a nova tag <option>
        const option = document.createElement('option');
        
        // 4. Definir o nome visível
        option.textContent = produto.nome;
        
        // 5. Definir o valor a ser enviado ao servidor
        option.value = produto.id;
        
        // 6. Armazenar o preço (valor) em um atributo de dados, se necessário
        option.setAttribute('data-valor', produto.valor);

        // 7. Inserir a <option> dentro do <select>
        selectElement.appendChild(option);
    });
}

// 8. Chamar a função para o primeiro campo de produto quando a página carrega
const primeiroSelect = itensContainer.querySelector('.select-produto');
popularProdutos(primeiroSelect);

// ----------------------------------------------------
// 4. FUNÇÃO DE ADICIONAR NOVO ITEM
// ----------------------------------------------------

function adicionarNovoItem() {
    // 1. Pega o primeiro item (o modelo)
    const modeloItem = itensContainer.querySelector('.item-produto');

    // 2. Clona o modelo com todos os seus filhos (os campos de select e input)
    const novoItem = modeloItem.cloneNode(true);

    // 3. Resetar os valores do novo item
    const novoSelect = novoItem.querySelector('.select-produto');
    const novaQuantidade = novoItem.querySelector('.input-quantidade');
    
    // Assegura que o novo <select> e <input> estejam limpos e resetados
    novoSelect.selectedIndex = 0; 
    novaQuantidade.value = 1;

    // 4. ADICIONAR BOTÃO DE REMOVER
    // Criamos um botão para permitir que o usuário desista de um item
    const btnRemover = document.createElement('button');
    btnRemover.type = 'button';
    btnRemover.textContent = 'Remover';
    btnRemover.classList.add('btn-remover'); // Para você estilizar no CSS
    
    // Define o que acontece ao clicar: ele remove o div pai (.item-produto)
    btnRemover.onclick = () => novoItem.remove();

    novoItem.appendChild(btnRemover);

    // 5. Adiciona o item recém-clonado e resetado ao container
    itensContainer.appendChild(novoItem);
}

// 6. Associar a função ao clique do botão "+"
btnAddItem.addEventListener('click', adicionarNovoItem);

// ----------------------------------------------------
// 5. PROCESSAMENTO E ENVIO DO FORMULÁRIO
// ----------------------------------------------------

form.addEventListener('submit', function(e) {
    e.preventDefault(); // 1. IMPEDE O ENVIO PADRÃO DO NAVEGADOR

    // A validação 'required' do HTML já cuida da maioria dos campos.
    if (!form.checkValidity()) {
        // Se a validação do HTML falhar, o navegador já mostra o erro.
        return;
    }

    // 2. VALIDAÇÃO EXTRA (Ex: Idade)
    const idadeInput = document.getElementById('idade');
    if (parseInt(idadeInput.value) < 18) {
        alert('A idade deve ser maior ou igual a 18 anos.');
        return;
    }
    
    // 3. COLETA DOS DADOS DE CONTATO
    const dadosParaAPI = {
        nome: form.nome.value,
        idade: form.idade.value,
        email: form.email.value,
        telefone: form.telefone.value,
        feedback: document.getElementById('feedback').value, 
        avaliacao: document.querySelector('input[name="avaliacao"]:checked')?.value || null, 
        itens: [] // Array para guardar os produtos
    };

    // 4. COLETA DOS ITENS ADICIONADOS DINAMICAMENTE
    const itensAdicionados = document.querySelectorAll('.item-produto');
    
    itensAdicionados.forEach(item => {
        const produtoId = item.querySelector('.select-produto').value;
        const quantidade = item.querySelector('.input-quantidade').value;

        if (produtoId) { // Verifica se um produto foi selecionado (ID é diferente de "")
            dadosParaAPI.itens.push({
                produto_id: produtoId, // ID que veio da API
                quantidade: parseInt(quantidade)
            });
        }
    });

    // 5. VALIDAÇÃO FINAL (pelo menos um produto deve ter sido adicionado)
    if (dadosParaAPI.itens.length === 0) {
        alert('Por favor, adicione pelo menos um item ao orçamento.');
        return;
    }

    // 6. ENVIAR OS DADOS PARA O BACK-END (API)
    console.log('Dados prontos para enviar à API:', dadosParaAPI);
    
    // Exemplo de como você enviaria (usando a função 'fetch' nativa):
    /*
    fetch('/sua-api-url/orcamentos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosParaAPI),
    })
    .then(response => response.json())
    .then(data => {
        alert('Orçamento enviado com sucesso! Número: ' + data.numero_orcamento);
    })
    .catch(error => {
        console.error('Erro ao enviar o orçamento:', error);
        alert('Ocorreu um erro ao enviar o orçamento.');
    });
    */

    alert('Orçamento simulado enviado! (Dados no console)');
    form.reset();
});