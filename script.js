// --- VARIÁVEIS DE ESTADO E FIREBASE ---
let db = null;
let auth = null;
let isFirebaseConnected = false;

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "ricpower-finance-4312b.firebaseapp.com",
    projectId: "ricpower-finance-4312b",
    storageBucket: "ricpower-finance-4312b.appspot.com",
    messagingSenderId: "SEU_SENDER_ID",
    appId: "SEU_APP_ID"
};

// Inicialização segura do Firebase
try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        isFirebaseConnected = true;
        console.log("Firebase conectado com sucesso!");
    } else {
        console.warn("SDKs do Firebase não encontrados. Operando em modo offline.");
    }
} catch (e) {
    console.error("Erro ao inicializar Firebase:", e);
    isFirebaseConnected = false;
}

// Mantém sessão ativa se já estiver logado
if (auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('userEmailDisplay').innerText = user.email;
            if (typeof carregarDados === 'function') carregarDados();
        }
    });
}
