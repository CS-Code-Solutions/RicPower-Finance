/* AUTENTICAÇÃO REAL NO FIREBASE */
function realizarLogin(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const senha = document.getElementById('loginSenha').value.trim();
    const alertBox = document.getElementById('loginAlert');
    const btnSubmit = document.getElementById('btnLoginSubmit');

    alertBox.style.display = 'none';
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Autenticando...';

    if (isFirebaseConnected && auth) {
        auth.signInWithEmailAndPassword(email, senha)
            .then((userCredential) => {
                alertBox.style.display = 'none';
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar no Sistema';
            })
            .catch((error) => {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar no Sistema';
                alertBox.className = 'login-alert error';
                
                // Exibe a mensagem de erro exata vinda do Firebase ou traduz os principais
                let msg = error.message;
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    msg = 'E-mail ou senha incorretos!';
                } else if (error.code === 'auth/invalid-email') {
                    msg = 'E-mail em formato inválido!';
                } else if (error.code === 'auth/operation-not-allowed') {
                    msg = 'O login por E-mail/Senha não está ativado no Firebase Console!';
                } else if (error.code === 'auth/unauthorized-domain') {
                    msg = 'O domínio cs-code-solutions.github.io não está autorizado no Firebase!';
                }
                
                alertBox.innerText = msg;
                alertBox.style.display = 'block';
            });
    } else {
        // Fallback local caso o Firebase não conecte
        if (email === 'richard@ricpower.com' && senha === 'rpmel301') {
            localStorage.setItem('ric_logged', 'true');
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('userEmailDisplay').innerText = email;
            carregarDadosLocais();
        } else {
            alertBox.className = 'login-alert error';
            alertBox.innerText = 'E-mail ou senha incorretos (Modo Local)!';
            alertBox.style.display = 'block';
        }
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar no Sistema';
    }
}
