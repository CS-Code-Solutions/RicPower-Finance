// --- VARIÁVEIS DE ESTADO E FIREBASE ---
let db = null;
let auth = null;
let isFirebaseConnected = false;

// Configuração atualizada do Firebase com a tua nova API Key válida
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
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        auth = firebase.auth();
        isFirebaseConnected = true;
    }
} catch (e) {
    console.error("Erro na inicialização do Firebase:", e);
    isFirebaseConnected = false;
}

// Escuta alteração de login
if (auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            const loginScreen = document.getElementById('login-screen');
            if (loginScreen) loginScreen.style.display = 'none';

            const emailDisplay = document.getElementById('userEmailDisplay');
            if (emailDisplay) emailDisplay.innerText = user.email;

            // Ativa a aba inicial padrão
            trocarAba('dashboard');

            try {
                if (typeof carregarDados === 'function') carregarDados();
            } catch (err) {
                console.error("Erro ao carregar dados pós-login:", err);
            }
        }
    });
}

// FUNÇÃO DE LOGIN COMPLETA
function realizarLogin(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const senha = document.getElementById('loginSenha').value.trim();
    const alertBox = document.getElementById('loginAlert');
    const btnSubmit = document.getElementById('btnLoginSubmit');

    if (alertBox) alertBox.style.display = 'none';
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
    }

    if (isFirebaseConnected && auth) {
        auth.signInWithEmailAndPassword(email, senha)
            .then((userCredential) => {
                const loginScreen = document.getElementById('login-screen');
                if (loginScreen) loginScreen.style.display = 'none';

                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar no Sistema';
                }

                trocarAba('dashboard');

                try {
                    if (typeof carregarDados === 'function') carregarDados();
                } catch (err) {
                    console.error("Erro ao carregar dados do sistema:", err);
                }
            })
            .catch((error) => {
                console.error("Erro na autenticação Firebase:", error.code, error.message);
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar no Sistema';
                }
                if (alertBox) {
                    alertBox.className = 'login-alert error';
                    alertBox.innerText = 'E-mail ou senha incorretos!';
                    alertBox.style.display = 'block';
                } else {
                    alert('E-mail ou senha incorretos!');
                }
            });
    } else {
        // Modo fallback offline
        if ((email === 'admin@richard.com' && senha === 'admin123') || (email === 'richard@ricpower.com' && senha === 'rpmel301')) {
            localStorage.setItem('ric_logged', 'true');
            const loginScreen = document.getElementById('login-screen');
            if (loginScreen) loginScreen.style.display = 'none';

            trocarAba('dashboard');

            if (typeof carregarDados === 'function') carregarDados();
        } else {
            if (alertBox) {
                alertBox.className = 'login-alert error';
                alertBox.innerText = 'Credenciais inválidas!';
                alertBox.style.display = 'block';
            } else {
                alert('Credenciais inválidas!');
            }
        }
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar no Sistema';
        }
    }
}

// --- CONTROLE DE TROCA DE ABAS (CORRIGIDO PARA COMPATIBILIDADE DE IDS) ---
function trocarAba(nomeAba, elemento) {
    if (!nomeAba) return;

    // 1. Oculta todas as abas no DOM
    const abas = document.querySelectorAll('.tab-content');
    abas.forEach(aba => {
        aba.classList.remove('active');
        aba.style.display = 'none';
    });

    // 2. Busca pelo ID com prefixo 'tab-' (ex: 'tab-dashboard') ou pelo ID puro
    let abaAlvo = document.getElementById(`tab-${nomeAba}`) || document.getElementById(nomeAba);

    if (abaAlvo) {
        abaAlvo.classList.add('active');
        abaAlvo.style.display = 'block';
    } else {
        // Fallback caso receba o ID bruto
        const primeiraAba = document.querySelector('.tab-content');
        if (primeiraAba) {
            primeiraAba.classList.add('active');
            primeiraAba.style.display = 'block';
        }
    }

    // 3. Destaca o item do menu lateral clicado
    const navLinks = document.querySelectorAll('.nav-link, .sidebar a');
    navLinks.forEach(link => link.classList.remove('active'));

    if (elemento && elemento.classList) {
        elemento.classList.add('active');
    }

    // 4. Se for mobile, recolhe a barra lateral
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar && window.innerWidth <= 768) {
        sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
    }
}

// --- CONTROLE DE MENU MOBILE ---
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (sidebar) sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}

// Garante que ao carregar a página a tela esteja pronta
document.addEventListener('DOMContentLoaded', () => {
    const abaAtiva = document.querySelector('.tab-content.active') || document.getElementById('tab-dashboard');
    if (abaAtiva) {
        abaAtiva.style.display = 'block';
    }
});
