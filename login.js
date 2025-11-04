document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');


    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        errorMessage.style.display = 'none';

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const loginData = { username, password };
        console.log("Tentativa de login com:", loginData);

        try {
            // Envia credenciais para a API
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            });

            // Verifica se houve erro na requisição
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro de autenticação.');
            }

            // Se deu certo, pega o token e redireciona
            const data = await response.json();
            localStorage.setItem('admin_token', data.token);
            window.location.href = 'admin.html';

        } catch (error) {
            console.error(error);
            errorMessage.textContent = 'Erro de login: Verifique seu usuário e senha.';
            errorMessage.style.display = 'block';
        }
    });
});
