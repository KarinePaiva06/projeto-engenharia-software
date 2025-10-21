document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    // Função de verificação para impedir que o admin logado acesse a página de login novamente
    if (localStorage.getItem('admin_token')) {
        window.location.href = 'admin.html';
        return;
    }

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        errorMessage.style.display = 'none';

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // **PASSO 1: ENVIAR CREDENCIAIS PARA A API DE LOGIN**
        const loginData = { username, password };
        console.log("Tentativa de login com:", loginData);

        // ATENÇÃO: SUBSTITUA ESTA SIMULAÇÃO PELA SUA CHAMADA REAL À API
        // O Back-end deve retornar { token: 'seu_jwt_aqui' }
        try {
            // SIMULAÇÃO DE RESPOSTA (Remover em produção)
            if (username === 'admin' && password === '123456') {
                const fakeToken = 'admin_jwt_token_123456';
                
                // **PASSO 2: SALVAR O TOKEN**
                localStorage.setItem('admin_token', fakeToken);
                
                // **PASSO 3: REDIRECIONAR PARA O PAINEL**
                alert('Login bem-sucedido! Redirecionando para o Painel...');
                window.location.href = 'admin.html';
            } else {
                throw new Error('Credenciais inválidas.');
            }
            
            /*
            // CÓDIGO REAL PARA PRODUÇÃO:
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro de autenticação.');
            }

            const data = await response.json();
            localStorage.setItem('admin_token', data.token);
            window.location.href = 'admin.html';
            */

        } catch (error) {
            console.error(error);
            errorMessage.textContent = 'Erro de login: Verifique seu usuário e senha.';
            errorMessage.style.display = 'block';
        }
    });
});