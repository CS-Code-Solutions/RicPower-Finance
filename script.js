// --- VARIÁVEIS DE ESTADO E FIREBASE ---
let db = null;
let auth = null;
let isFirebaseConnected = false;

// Configuração do Firebase atualizada com a nova API Key
const firebaseConfig = {
    apiKey: "AIzaSyAh08u5nObwe2ITXW1SmS1njgZdjez63mc",
    authDomain: "ricpower-finance-4312b.firebaseapp.com",
    databaseURL: "https://ricpower-finance-4312b-default-rtdb.firebaseio.com",
    projectId: "ricpower-finance-4312b",
    storageBucket: "ricpower-finance-4312b.firebasestorage.app",
    messagingSenderId: "632169254200",
    appId: "1:632169254200:web:776e49224d4f61bc2e05cd"
};

try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        isFirebaseConnected = true;
    }
} catch (e) {
    console.error("Erro na inicialização do Firebase:", e);
    isFirebaseConnected = false;
}

// Oculta login automaticamente se já estiver autenticado
if (auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('userEmailDisplay').innerText = user.email;
            try {
                if (typeof carregarDados === 'function') carregarDados();
            } catch (err) {
                console.error("Erro ao carregar dados pós-login:", err);
            }
        }
    });
}

// FUNÇÃO DE LOGIN COMPLETA E CORRIGIDA
function realizarLogin(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const senha = document.getElementById('loginSenha').value.trim();
    const alertBox = document.getElementById('loginAlert');
    const btnSubmit = document.getElementById('btnLoginSubmit');

    alertBox.style.display = 'none';
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';

    if (isFirebaseConnected && auth) {
        auth.signInWithEmailAndPassword(email, senha)
            .then((userCredential) => {
                // Sucesso: Oculta a tela de login e atualiza e-mail na sidebar
                document.getElementById('login-screen').style.display = 'none';
                document.getElementById('userEmailDisplay').innerText = userCredential.user.email;
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar no Sistema';

                try {
                    if (typeof carregarDados === 'function') carregarDados();
                } catch (err) {
                    console.error("Erro ao carregar dados do sistema:", err);
                }
            })
            .catch((error) => {
                console.error("Erro na autenticação Firebase:", error.code, error.message);
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar no Sistema';
                alertBox.className = 'login-alert error';
                alertBox.innerText = 'E-mail ou senha incorretos!';
                alertBox.style.display = 'block';
            });
    } else {
        // Fallback para login local offline
        if (email === 'richard@ricpower.com' && senha === 'rpmel301') {
            localStorage.setItem('ric_logged', 'true');
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('userEmailDisplay').innerText = email;
            if (typeof carregarDados === 'function') carregarDados();
        } else {
            alertBox.className = 'login-alert error';
            alertBox.innerText = 'Credenciais inválidas (Modo Local)!';
            alertBox.style.display = 'block';
        }
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar no Sistema';
    }
}

// --- CONTROLE DE NAVEGAÇÃO E NAVEGAÇÃO MÓVEL ---

// Função chamada pelos cliques nas abas/links do menu
function trocarAba(nomeAba, elemento) {
    // Esconde todas as seções/abas do sistema
    const abas = document.querySelectorAll('.tab-content, section, .page-section');
    abas.forEach(aba => {
        aba.style.display = 'none';
        aba.classList.remove('active');
    });

    // Remove destaque de todos os itens do menu
    const itensMenu = document.querySelectorAll('.nav-item, .menu-item, .sidebar a, .nav-link');
    itensMenu.forEach(item => item.classList.remove('active'));

    // Exibe a aba alvo
    const abaAlvo = document.getElementById(nomeAba);
    if (abaAlvo) {
        abaAlvo.style.display = 'block';
        abaAlvo.classList.add('active');
    }

    // Marca o botão clicado como ativo
    if (elemento && elemento.classList) {
        elemento.classList.add('active');
    }

    // Fecha o menu hambúrguer no mobile após a seleção
    const sidebar = document.querySelector('.sidebar') || document.getElementById('sidebar');
    if (sidebar && window.innerWidth <= 768) {
        sidebar.classList.remove('active', 'open', 'show');
    }
}

// Função para abrir/fechar o menu mobile (Hambúrguer)
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar') || document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay') || document.getElementById('overlay');

    if (sidebar) {
        sidebar.classList.toggle('active');
        sidebar.classList.toggle('open');
        sidebar.classList.toggle('show');
    }

    if (overlay) {
        overlay.classList.toggle('active');
        overlay.classList.toggle('show');
    }
}
