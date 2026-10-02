// TOGGLE SIDEBAR MOBILE (MENU RETRÁTIL RG SOL TEC)
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.querySelector('.sidebar-overlay').classList.toggle('active');
}

// 1. CONFIGURAÇÃO OFICIAL DO FIREBASE COM REALTIME FIRESTORE & AUTH
const firebaseConfig = {
    apiKey: "AIzaSyAMIo-e1IQVvoVNvHfjyCvQ3mpmA8XpEZU",
    authDomain: "ricpower-finance-4312b.firebaseapp.com",
    databaseURL: "https://ricpower-finance-4312b-default-rtdb.firebaseio.com",
    projectId: "ricpower-finance-4312b",
    storageBucket: "ricpower-finance-4312b.firebasestorage.app",
    messagingSenderId: "632169254200",
    appId: "1:632169254200:web:776e49224d4f61bc2e05cd"
};

let db = null;
let auth = null;
let isFirebaseConnected = false;

// INICIALIZAÇÃO FIREBASE AUTH & FIRESTORE
try {
    if (typeof firebase !== 'undefined' && firebaseConfig.apiKey) {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        auth = firebase.auth();
        isFirebaseConnected = true;
    }
} catch (e) {
    console.warn("Firebase operando em modo local por padrão.", e);
}

// ESTADO GLOBAL DA APLICAÇÃO
let dbPagar = [];
let dbReceber = [];
let dbEstoque = [];

// FILTRAGEM GLOBAL DE DATAS
let filtroPeriodoGlobal = 'todos';
let dtInicioCustom = null;
let dtFimCustom = null;

let chartFluxo, chartCat;

// ESCUTADOR DE AUTENTICAÇÃO E INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    if (isFirebaseConnected && auth) {
        auth.onAuthStateChanged(user => {
            if (user) {
                document.getElementById('login-screen').style.display = 'none';
                document.getElementById('userEmailDisplay').innerText = user.email || 'Usuário Autenticado';
                iniciarSincronizacaoNuvem();
            } else {
                document.getElementById('login-screen').style.display = 'flex';
                document.getElementById('userEmailDisplay').innerText = 'Desconectado';
            }
        });
    } else {
        // Fallback para ambiente local se o Firebase não estiver carregado
        if (localStorage.getItem('ric_logged') === 'true') {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('userEmailDisplay').innerText = 'admin@richard.com (Local)';
            carregarDadosLocais();
        }
    }
});

function iniciarSincronizacaoNuvem() {
    if (isFirebaseConnected && db) {
        document.getElementById('syncBadge').className = 'sync-badge online';
        document.getElementById('syncBadge').innerHTML = '<i class="fas fa-wifi"></i> Nuvem Sincronizada';

        db.collection("pagar").onSnapshot(snapshot => {
            dbPagar = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            carregarDados();
        });

        db.collection("receber").onSnapshot(snapshot => {
            dbReceber = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            carregarDados();
        });

        db.collection("estoque").onSnapshot(snapshot => {
            dbEstoque = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            carregarDados();
        });
    }
}

function carregarDadosLocais() {
    document.getElementById('syncBadge').className = 'sync-badge offline';
    document.getElementById('syncBadge').innerHTML = '<i class="fas fa-exclamation-triangle"></i> Modo Off-line (Local)';
    
    dbPagar = JSON.parse(localStorage.getItem('ric_pagar')) || [];
    dbReceber = JSON.parse(localStorage.getItem('ric_receber')) || [];
    dbEstoque = JSON.parse(localStorage.getItem('ric_estoque')) || [];
    carregarDados();
}

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
                
                let msg = 'Erro ao realizar login.';
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    msg = 'E-mail ou senha incorretos!';
                } else if (error.code === 'auth/invalid-email') {
                    msg = 'E-mail em formato inválido!';
                }
                alertBox.innerText = msg;
                alertBox.style.display = 'block';
            });
    } else {
        // Fallback demo local
        if (email === 'admin@richard.com' && senha === 'admin123') {
            localStorage.setItem('ric_logged', 'true');
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('userEmailDisplay').innerText = email;
            carregarDadosLocais();
        } else {
            alertBox.className = 'login-alert error';
            alertBox.innerText = 'E-mail ou senha incorretos (Modo Local)';
            alertBox.style.display = 'block';
        }
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar no Sistema';
    }
}

function fazerLogout() {
    if (isFirebaseConnected && auth) {
        auth.signOut().then(() => {
            document.getElementById('login-screen').style.display = 'flex';
        });
    } else {
        localStorage.removeItem('ric_logged');
        document.getElementById('login-screen').style.display = 'flex';
    }
}

// CONTROLADOR DE ABAS
function trocarAba(abaId, el) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
    
    const targetTab = document.getElementById(`tab-${abaId}`);
    if (targetTab) targetTab.classList.add('active');
    if (el) el.classList.add('active');

    // Fechar sidebar no celular após selecionar item do menu
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('active');
        document.querySelector('.sidebar-overlay').classList.remove('active');
    }
}

// FORMATADOR DE MOEDA
const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// AUXILIAR DE FILTRAGEM POR DATA
function filtrarPorPeriodo(item) {
    if (!item || !item.venc) return true;
    if (filtroPeriodoGlobal === 'todos') return true;

    const itemDate = new Date(item.venc + 'T00:00:00');
    const hoje = new Date();

    if (filtroPeriodoGlobal === 'este-mes') {
        return itemDate.getMonth() === hoje.getMonth() && itemDate.getFullYear() === hoje.getFullYear();
    } else if (filtroPeriodoGlobal === 'mes-passado') {
        const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        return itemDate.getMonth() === mesPassado.getMonth() && itemDate.getFullYear() === mesPassado.getFullYear();
    } else if (filtroPeriodoGlobal === 'este-ano') {
        return itemDate.getFullYear() === hoje.getFullYear();
    } else if (filtroPeriodoGlobal === 'custom' && dtInicioCustom && dtFimCustom) {
        const ini = new Date(dtInicioCustom + 'T00:00:00');
        const fim = new Date(dtFimCustom + 'T23:59:59');
        return itemDate >= ini && itemDate <= fim;
    }
    return true;
}

// CARREGAR E RENDERIZAR MÉTRICAS
function carregarDados() {
    if (!isFirebaseConnected) {
        localStorage.setItem('ric_pagar', JSON.stringify(dbPagar));
        localStorage.setItem('ric_receber', JSON.stringify(dbReceber));
        localStorage.setItem('ric_estoque', JSON.stringify(dbEstoque));
    }

    const pagarFiltrado = dbPagar.filter(filtrarPorPeriodo);
    const receberFiltrado = dbReceber.filter(filtrarPorPeriodo);

    let realIn = receberFiltrado.filter(x => x.status === 'PAGO').reduce((a,b) => a + Number(b.valor), 0);
    let pendingIn = receberFiltrado.filter(x => x.status !== 'PAGO').reduce((a,b) => a + Number(b.valor), 0);
    
    let realOut = pagarFiltrado.filter(x => x.status === 'PAGO').reduce((a,b) => a + Number(b.valor), 0);
    let pendingOut = pagarFiltrado.filter(x => x.status !== 'PAGO').reduce((a,b) => a + Number(b.valor), 0);

    let balReal = realIn - realOut;
    let balProj = (realIn + pendingIn) - (realOut + pendingOut);
    let stockTot = dbEstoque.reduce((a,b) => a + (Number(b.qtd) * Number(b.custo)), 0);

    document.getElementById('kpiRealIn').innerText = fmt(realIn);
    document.getElementById('kpiPendingIn').innerText = fmt(pendingIn);
    document.getElementById('kpiRealOut').innerText = fmt(realOut);
    document.getElementById('kpiPendingOut').innerText = fmt(pendingOut);
    document.getElementById('kpiBalanceReal').innerText = fmt(balReal);
    document.getElementById('kpiBalanceProjected').innerText = fmt(balProj);
    document.getElementById('kpiStockTotal').innerText = fmt(stockTot);

    let catPessoal = pagarFiltrado.filter(x => x.cc === 'PESSOAL').reduce((a,b) => a + Number(b.valor), 0);
    let catAdmin = pagarFiltrado.filter(x => x.cc === 'ADMINISTRATIVO').reduce((a,b) => a + Number(b.valor), 0);
    let catPecas = pagarFiltrado.filter(x => x.cc === 'PEÇAS').reduce((a,b) => a + Number(b.valor), 0);

    atualizarDREDual(pagarFiltrado, receberFiltrado);
    renderTabelas(pagarFiltrado, receberFiltrado);
    renderGraficos(realIn, realOut, catPessoal, catAdmin, catPecas);

    if (!window.fixasVerificadasAuto) {
        window.fixasVerificadasAuto = true;
        gerarDespesasFixasMesAtual(true);
    }
}

// CÁLCULO DRE DUAL
function atualizarDREDual(pagarList = dbPagar, receberList = dbReceber) {
    let recReal = receberList.filter(x => x.status === 'PAGO').reduce((a,b) => a + Number(b.valor), 0);
    let recPend = receberList.filter(x => x.status !== 'PAGO').reduce((a,b) => a + Number(b.valor), 0);
    let recProj = recReal + recPend;

    let custoReal = pagarList.filter(x => x.status === 'PAGO' && x.cc === 'PEÇAS').reduce((a,b) => a + Number(b.valor), 0);
    let custoPend = pagarList.filter(x => x.status !== 'PAGO' && x.cc === 'PEÇAS').reduce((a,b) => a + Number(b.valor), 0);
    let custoProj = custoReal + custoPend;

    let despFixaReal = pagarList.filter(x => x.status === 'PAGO' && x.cc === 'ADMINISTRATIVO').reduce((a,b) => a + Number(b.valor), 0);
    let despFixaPend = pagarList.filter(x => x.status !== 'PAGO' && x.cc === 'ADMINISTRATIVO').reduce((a,b) => a + Number(b.valor), 0);
    let despFixaProj = despFixaReal + despFixaPend;

    let despPessReal = pagarList.filter(x => x.status === 'PAGO' && x.cc === 'PESSOAL').reduce((a,b) => a + Number(b.valor), 0);
    let despPessPend = pagarList.filter(x => x.status !== 'PAGO' && x.cc === 'PESSOAL').reduce((a,b) => a + Number(b.valor), 0);
    let despPessProj = despPessReal + despPessPend;

    let lucroBrutoReal = recReal - custoReal;
    let lucroBrutoPend = recPend - custoPend;
    let lucroBrutoProj = recProj - custoProj;

    let resReal = lucroBrutoReal - (despFixaReal + despPessReal);
    let resPend = lucroBrutoPend - (despFixaPend + despPessPend);
    let resProj = lucroBrutoProj - (despFixaProj + despPessProj);

    let margemReal = recReal > 0 ? ((resReal / recReal) * 100).toFixed(1) : '0.0';
    let margemProj = recProj > 0 ? ((resProj / recProj) * 100).toFixed(1) : '0.0';

    document.getElementById('dreRecReal').innerText = fmt(recReal);
    document.getElementById('dreRecPend').innerText = fmt(recPend);
    document.getElementById('dreRecProj').innerText = fmt(recProj);

    document.getElementById('dreCustoReal').innerText = fmt(custoReal);
    document.getElementById('dreCustoPend').innerText = fmt(custoPend);
    document.getElementById('dreCustoProj').innerText = fmt(custoProj);

    document.getElementById('dreLucroBrutoReal').innerText = fmt(lucroBrutoReal);
    document.getElementById('dreLucroBrutoPend').innerText = fmt(lucroBrutoPend);
    document.getElementById('dreLucroBrutoProj').innerText = fmt(lucroBrutoProj);

    document.getElementById('dreDespFixaReal').innerText = fmt(despFixaReal);
    document.getElementById('dreDespFixaPend').innerText = fmt(despFixaPend);
    document.getElementById('dreDespFixaProj').innerText = fmt(despFixaProj);

    document.getElementById('dreDespPessReal').innerText = fmt(despPessReal);
    document.getElementById('dreDespPessPend').innerText = fmt(despPessPend);
    document.getElementById('dreDespPessProj').innerText = fmt(despPessProj);

    document.getElementById('dreResLiquidoReal').innerText = fmt(resReal);
    document.getElementById('dreResLiquidoPend').innerText = fmt(resPend);
    document.getElementById('dreResLiquidoProj').innerText = fmt(resProj);

    document.getElementById('dreMargemReal').innerText = `${margemReal}%`;
    document.getElementById('dreMargemProj').innerText = `${margemProj}%`;

    let badge = document.getElementById('dreHealthBadge');
    if (resReal > 0) {
        badge.className = 'status-badge pago';
        badge.innerHTML = '<i class="fas fa-check-circle"></i> Operação Lucrativa';
    } else if (resReal === 0) {
        badge.className = 'status-badge pendente';
        badge.innerHTML = '<i class="fas fa-exclamation-circle"></i> Ponto de Equilíbrio';
    } else {
        badge.className = 'status-badge atrasado';
        badge.innerHTML = '<i class="fas fa-arrow-down"></i> Operação em Prejuízo';
    }
}

// RENDERIZAÇÃO DAS TABELAS
function renderTabelas(pagarList = dbPagar, receberList = dbReceber) {
    let tbVenc = document.getElementById('tbProximosVencimentos');
    tbVenc.innerHTML = '';
    [...pagarList, ...receberList].sort((a,b) => new Date(a.venc) - new Date(b.venc)).slice(0, 5).forEach(item => {
        let isPagar = item.fornecedor !== undefined;
        tbVenc.innerHTML += `
            <tr>
                <td>${item.venc}</td>
                <td><span class="status-badge ${isPagar ? 'atrasado' : 'pago'}">${isPagar ? 'SAÍDA' : 'ENTRADA'}</span></td>
                <td>${isPagar ? item.fornecedor : item.cliente}</td>
                <td><strong>${fmt(Number(item.valor))}</strong></td>
                <td><span class="status-badge ${(item.status || 'PENDENTE').toLowerCase()}">${item.status}</span></td>
                <td><button class="btn btn-secondary btn-sm" onclick="alternarStatus('${item.id}', ${isPagar})"><i class="fas fa-sync"></i> Mudar Status</button></td>
            </tr>
        `;
    });

    // Contas a Pagar
    let buscaP = (document.getElementById('buscaPagar')?.value || '').toLowerCase();
    let statusP = document.getElementById('filtroStatusPagar')?.value || 'TODOS';
    let ccP = document.getElementById('filtroCCPagar')?.value || 'TODOS';

    let tbP = document.getElementById('tbPagar');
    tbP.innerHTML = '';

    pagarList.filter(item => {
        let matchBusca = (item.fornecedor || '').toLowerCase().includes(buscaP) || (item.desc || '').toLowerCase().includes(buscaP);
        let matchStatus = statusP === 'TODOS' || item.status === statusP;
        let matchCC = ccP === 'TODOS' || item.cc === ccP;
        return matchBusca && matchStatus && matchCC;
    }).forEach(item => {
        let tagFixa = (item.fixa === true || item.fixa === 'SIM') ? '<span class="badge-fixa">FIXA</span>' : '';
        tbP.innerHTML += `
            <tr>
                <td>${item.venc}</td>
                <td>${item.fornecedor}</td>
                <td>${item.desc} ${tagFixa}</td>
                <td><strong>${fmt(Number(item.valor))}</strong></td>
                <td><span class="status-badge ${(item.status || 'PENDENTE').toLowerCase()}">${item.status}</span></td>
                <td>${item.cc || '-'}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn ${item.status === 'PAGO' ? 'btn-warning' : 'btn-success'} btn-sm" onclick="alternarStatus('${item.id}', true)">
                            <i class="fas ${item.status === 'PAGO' ? 'fa-undo' : 'fa-check'}"></i> ${item.status === 'PAGO' ? 'Reverter' : 'Dar Baixa'}
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="editarPagar('${item.id}')"><i class="fas fa-edit"></i> Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="excluirItem('${item.id}', true)"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });

    // Contas a Receber
    let buscaR = (document.getElementById('buscaReceber')?.value || '').toLowerCase();
    let statusR = document.getElementById('filtroStatusReceber')?.value || 'TODOS';
    let ccR = document.getElementById('filtroCCReceber')?.value || 'TODOS';

    let tbR = document.getElementById('tbReceber');
    tbR.innerHTML = '';

    receberList.filter(item => {
        let matchBusca = (item.cliente || '').toLowerCase().includes(buscaR) || (item.desc || '').toLowerCase().includes(buscaR);
        let matchStatus = statusR === 'TODOS' || item.status === statusR;
        let matchCC = ccR === 'TODOS' || item.cc === ccR;
        return matchBusca && matchStatus && matchCC;
    }).forEach(item => {
        tbR.innerHTML += `
            <tr>
                <td>${item.venc}</td>
                <td>${item.cliente}</td>
                <td>${item.desc}</td>
                <td><strong>${fmt(Number(item.valor))}</strong></td>
                <td><span class="status-badge ${(item.status || 'PENDENTE').toLowerCase()}">${item.status}</span></td>
                <td>${item.cc || '-'}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn ${item.status === 'PAGO' ? 'btn-warning' : 'btn-success'} btn-sm" onclick="alternarStatus('${item.id}', false)">
                            <i class="fas ${item.status === 'PAGO' ? 'fa-undo' : 'fa-check'}"></i> ${item.status === 'PAGO' ? 'Reverter' : 'Dar Baixa'}
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="editarReceber('${item.id}')"><i class="fas fa-edit"></i> Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="excluirItem('${item.id}', false)"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });

    // Estoque
    let buscaE = (document.getElementById('buscaEstoque')?.value || '').toLowerCase();
    let statusE = document.getElementById('filtroStatusEstoque')?.value || 'TODOS';

    let tbE = document.getElementById('tbEstoque');
    tbE.innerHTML = '';

    dbEstoque.filter(item => {
        let matchBusca = (item.nome || '').toLowerCase().includes(buscaE) || (item.sku || '').toLowerCase().includes(buscaE);
        let isBaixo = Number(item.qtd) <= Number(item.min);
        let matchStatus = statusE === 'TODOS' || (statusE === 'BAIXO' && isBaixo) || (statusE === 'NORMAL' && !isBaixo);
        return matchBusca && matchStatus;
    }).forEach(item => {
        let isBaixo = Number(item.qtd) <= Number(item.min);
        tbE.innerHTML += `
            <tr>
                <td>${item.sku}</td>
                <td>${item.nome} ${isBaixo ? '<span class="status-badge atrasado">Estoque Baixo</span>' : ''}</td>
                <td>${item.cat || 'Peças'}</td>
                <td><strong>${item.qtd}</strong></td>
                <td>${item.min}</td>
                <td>${fmt(Number(item.custo))}</td>
                <td>${fmt(Number(item.venda))}</td>
                <td>${fmt(Number(item.qtd) * Number(item.custo))}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-primary btn-sm" onclick="movimentarEstoque('${item.id}')"><i class="fas fa-exchange-alt"></i> +/-</button>
                        <button class="btn btn-secondary btn-sm" onclick="editarEstoque('${item.id}')"><i class="fas fa-edit"></i> Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="excluirEstoque('${item.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
}

// GRÁFICOS DINÂMICOS
function renderGraficos(realIn, realOut, catPessoal = 0, catAdmin = 0, catPecas = 0) {
    const ctxFluxoEl = document.getElementById('chartFluxoCaixa');
    if (ctxFluxoEl) {
        const ctxFluxo = ctxFluxoEl.getContext('2d');
        if (chartFluxo) chartFluxo.destroy();
        chartFluxo = new Chart(ctxFluxo, {
            type: 'bar',
            data: {
                labels: ['Entradas Realizadas', 'Saídas Realizadas'],
                datasets: [{
                    label: 'Valores em R$',
                    data: [realIn, realOut],
                    backgroundColor: ['#2ecc71', '#e74c3c']
                }]
            },
            options: { responsive: true }
        });
    }

    const ctxCatEl = document.getElementById('chartCategorias');
    if (ctxCatEl) {
        const ctxCat = ctxCatEl.getContext('2d');
        if (chartCat) chartCat.destroy();
        chartCat = new Chart(ctxCat, {
            type: 'doughnut',
            data: {
                labels: ['Pessoal', 'Administrativo', 'Peças'],
                datasets: [{ 
                    data: [catPessoal, catAdmin, catPecas], 
                    backgroundColor: ['#FFD500', '#111111', '#e74c3c'] 
                }]
            },
            options: { responsive: true }
        });
    }
}

// OPERAÇÕES DE BANCO DE DADOS (CRUD)
function salvarPagar(e) {
    e.preventDefault();
    let id = document.getElementById('pagarId').value || String(Date.now());
    let isFixa = document.getElementById('pagarFixa').value === 'SIM';

    let item = {
        fornecedor: document.getElementById('pagarFornecedor').value,
        desc: document.getElementById('pagarDesc').value,
        valor: Number(document.getElementById('pagarValor').value),
        venc: document.getElementById('pagarVenc').value,
        status: document.getElementById('pagarStatus').value,
        cc: document.getElementById('pagarCC').value,
        fixa: isFixa
    };

    if (isFirebaseConnected && db) {
        db.collection("pagar").doc(id).set(item);
    } else {
        let idx = dbPagar.findIndex(x => String(x.id) === String(id));
        if (idx !== -1) dbPagar[idx] = { id, ...item };
        else dbPagar.push({ id, ...item });
        carregarDados();
    }
    fecharModal('modalPagar');
}

function salvarReceber(e) {
    e.preventDefault();
    let id = document.getElementById('receberId').value || String(Date.now());
    let item = {
        cliente: document.getElementById('receberCliente').value,
        desc: document.getElementById('receberDesc').value,
        valor: Number(document.getElementById('receberValor').value),
        venc: document.getElementById('receberVenc').value,
        status: document.getElementById('receberStatus').value,
        cc: document.getElementById('receberCC').value
    };

    if (isFirebaseConnected && db) {
        db.collection("receber").doc(id).set(item);
    } else {
        let idx = dbReceber.findIndex(x => String(x.id) === String(id));
        if (idx !== -1) dbReceber[idx] = { id, ...item };
        else dbReceber.push({ id, ...item });
        carregarDados();
    }
    fecharModal('modalReceber');
}

function salvarEstoque(e) {
    e.preventDefault();
    let id = document.getElementById('estId').value || String(Date.now());
    let item = {
        sku: document.getElementById('estSKU').value,
        nome: document.getElementById('estNome').value,
        cat: 'Peças',
        qtd: Number(document.getElementById('estQtd').value),
        min: Number(document.getElementById('estMin').value),
        custo: Number(document.getElementById('estCusto').value),
        venda: Number(document.getElementById('estVenda').value)
    };

    if (isFirebaseConnected && db) {
        db.collection("estoque").doc(id).set(item);
    } else {
        let idx = dbEstoque.findIndex(x => String(x.id) === String(id));
        if (idx !== -1) dbEstoque[idx] = { id, ...item };
        else dbEstoque.push({ id, ...item });
        carregarDados();
    }
    fecharModal('modalEstoque');
}

function alternarStatus(id, isPagar) {
    let collection = isPagar ? "pagar" : "receber";
    let list = isPagar ? dbPagar : dbReceber;
    let item = list.find(x => String(x.id) === String(id));
    if (item) {
        let novoStatus = item.status === 'PAGO' ? 'PENDENTE' : 'PAGO';
        if (isFirebaseConnected && db) {
            db.collection(collection).doc(String(id)).update({ status: novoStatus });
        } else {
            item.status = novoStatus;
            carregarDados();
        }
    }
}

function excluirItem(id, isPagar) {
    if (confirm('Deseja realmente excluir este lançamento?')) {
        let collection = isPagar ? "pagar" : "receber";
        if (isFirebaseConnected && db) {
            db.collection(collection).doc(String(id)).delete();
        } else {
            if (isPagar) dbPagar = dbPagar.filter(x => String(x.id) !== String(id));
            else dbReceber = dbReceber.filter(x => String(x.id) !== String(id));
            carregarDados();
        }
    }
}

function excluirEstoque(id) {
    if (confirm('Deseja remover esta peça do estoque?')) {
        if (isFirebaseConnected && db) {
            db.collection("estoque").doc(String(id)).delete();
        } else {
            dbEstoque = dbEstoque.filter(x => String(x.id) !== String(id));
            carregarDados();
        }
    }
}

// AUTOMATIZAÇÃO DE DESPESAS FIXAS
function gerarDespesasFixasMesAtual(silencioso = false) {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');

    const contasFixas = dbPagar.filter(item => item.fixa === true || item.fixa === 'SIM');

    if (contasFixas.length === 0) {
        if (!silencioso) alert("Nenhuma conta marcada como FIXA foi encontrada no cadastro.");
        return;
    }

    let novosLancamentos = 0;

    contasFixas.forEach(conta => {
        const diaVenc = (conta.venc && conta.venc.split('-')[2]) ? conta.venc.split('-')[2] : '10';
        const novoVencimento = `${anoAtual}-${mesAtual}-${diaVenc}`;

        const jaExiste = dbPagar.some(x => 
            (x.desc || '').toLowerCase().trim() === (conta.desc || '').toLowerCase().trim() && 
            x.venc === novoVencimento
        );

        if (!jaExiste) {
            const novoId = String(Date.now() + Math.random());
            const novaConta = {
                fornecedor: conta.fornecedor,
                desc: conta.desc,
                valor: Number(conta.valor),
                venc: novoVencimento,
                status: 'PENDENTE',
                cc: conta.cc || 'ADMINISTRATIVO',
                fixa: true
            };

            if (isFirebaseConnected && db) {
                db.collection("pagar").doc(novoId).set(novaConta);
            } else {
                dbPagar.push({ id: novoId, ...novaConta });
            }
            novosLancamentos++;
        }
    });

    if (!isFirebaseConnected && novosLancamentos > 0) carregarDados();
    
    if (!silencioso) {
        alert(`${novosLancamentos} despesa(s) fixa(s) gerada(s) para o mês ${mesAtual}/${anoAtual}!`);
    }
}

// IMPORTAÇÃO DIRETA DE PLANILHA EXCEL (.XLSX)
function importarPlanilhaExcel(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });

            let countPagar = 0;
            let countReceber = 0;

            function parseExcelDate(val) {
                if (!val) return new Date().toISOString().slice(0, 10);
                if (val instanceof Date && !isNaN(val.getTime())) {
                    const y = val.getFullYear();
                    const m = String(val.getMonth() + 1).padStart(2, '0');
                    const d = String(val.getDate()).padStart(2, '0');
                    return `${y}-${m}-${d}`;
                }
                if (typeof val === 'number') {
                    const dateObj = XLSX.SSF.parse_date_code(val);
                    if (dateObj) {
                        const y = dateObj.y;
                        const m = String(dateObj.m).padStart(2, '0');
                        const d = String(dateObj.d).padStart(2, '0');
                        return `${y}-${m}-${d}`;
                    }
                }
                if (typeof val === 'string') {
                    val = val.trim();
                    if (val.includes('/')) {
                        const parts = val.split('/');
                        if (parts.length === 3) {
                            if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}`;
                            return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
                        }
                    }
                    if (val.includes('-')) {
                        const parts = val.split('-');
                        if (parts.length === 3 && parts[0].length === 4) return val;
                    }
                }
                return new Date().toISOString().slice(0, 10);
            }

            // 1. Processar Aba "CONTAS A PAGAR"
            const sheetPagarName = workbook.SheetNames.find(s => s.toUpperCase().includes('PAGAR'));
            if (sheetPagarName) {
                const sheetPagar = workbook.Sheets[sheetPagarName];
                const rows = XLSX.utils.sheet_to_json(sheetPagar, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });

                let headerIdx = -1;
                for (let i = 0; i < Math.min(10, rows.length); i++) {
                    const rStr = (rows[i] || []).map(c => String(c).toUpperCase()).join(' ');
                    if (rStr.includes('FORNECEDOR') || rStr.includes('VALOR') || rStr.includes('VENCIMENTO')) {
                        headerIdx = i;
                        break;
                    }
                }

                if (headerIdx !== -1) {
                    const headers = rows[headerIdx].map(h => String(h || '').trim().toUpperCase());
                    
                    const idxVenc = headers.findIndex(h => h.includes('VENCIMENTO') || h.includes('DATA'));
                    const idxForn = headers.findIndex(h => h.includes('FORNECEDOR') || h.includes('EMPRESA') || h.includes('NOME'));
                    const idxDesc = headers.findIndex(h => h.includes('DESCRIÇÃO') || h.includes('DESCRICAO'));
                    const idxValor = headers.findIndex(h => h.includes('VALOR'));
                    const idxStatus = headers.findIndex(h => h.includes('STATUS'));
                    const idxCC = headers.findIndex(h => h.includes('CENTRO') || h.includes('CUSTO'));

                    for (let i = headerIdx + 1; i < rows.length; i++) {
                        const row = rows[i];
                        if (!row || row.length === 0) continue;

                        const rawValor = idxValor !== -1 ? row[idxValor] : null;
                        if (rawValor === undefined || rawValor === null || rawValor === '') continue;

                        let numValor = 0;
                        if (typeof rawValor === 'number') {
                            numValor = rawValor;
                        } else {
                            let strV = String(rawValor).replace('R$', '').replace(/\s/g, '');
                            if (strV.includes(',') && strV.includes('.')) strV = strV.replace(/\./g, '').replace(',', '.');
                            else if (strV.includes(',')) strV = strV.replace(',', '.');
                            numValor = parseFloat(strV) || 0;
                        }

                        if (numValor === 0) continue;

                        const rawVenc = idxVenc !== -1 ? row[idxVenc] : '';
                        const vencFormated = parseExcelDate(rawVenc);
                        const fornecedor = idxForn !== -1 && row[idxForn] ? String(row[idxForn]).trim() : 'Fornecedor Importado';
                        const desc = idxDesc !== -1 && row[idxDesc] ? String(row[idxDesc]).trim() : 'Lançamento Excel';
                        const rawStatus = idxStatus !== -1 && row[idxStatus] ? String(row[idxStatus]).trim().toUpperCase() : 'PENDENTE';
                        const status = rawStatus.includes('PAG') ? 'PAGO' : 'PENDENTE';
                        const rawCC = idxCC !== -1 && row[idxCC] ? String(row[idxCC]).trim().toUpperCase() : 'ADMINISTRATIVO';

                        let cc = 'ADMINISTRATIVO';
                        if (rawCC.includes('PESS')) cc = 'PESSOAL';
                        else if (rawCC.includes('PEÇ') || rawCC.includes('PEC')) cc = 'PEÇAS';
                        else if (rawCC.includes('ADMIN')) cc = 'ADMINISTRATIVO';

                        const newId = 'imp_p_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
                        const itemData = {
                            fornecedor: fornecedor,
                            desc: desc,
                            valor: numValor,
                            venc: vencFormated,
                            status: status,
                            cc: cc,
                            fixa: false
                        };

                        if (isFirebaseConnected && db) {
                            db.collection("pagar").doc(newId).set(itemData);
                        } else {
                            dbPagar.push({ id: newId, ...itemData });
                        }
                        countPagar++;
                    }
                }
            }

            // 2. Processar Aba "CONTAS A RECEBER"
            const sheetReceberName = workbook.SheetNames.find(s => s.toUpperCase().includes('RECEBER'));
            if (sheetReceberName) {
                const sheetReceber = workbook.Sheets[sheetReceberName];
                const rows = XLSX.utils.sheet_to_json(sheetReceber, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });

                let headerIdx = -1;
                for (let i = 0; i < Math.min(10, rows.length); i++) {
                    const rStr = (rows[i] || []).map(c => String(c).toUpperCase()).join(' ');
                    if (rStr.includes('CLIENTE') || rStr.includes('VALOR') || rStr.includes('VENCIMENTO')) {
                        headerIdx = i;
                        break;
                    }
                }

                if (headerIdx !== -1) {
                    const headers = rows[headerIdx].map(h => String(h || '').trim().toUpperCase());
                    
                    const idxVenc = headers.findIndex(h => h.includes('VENCIMENTO') || h.includes('DATA'));
                    const idxCli = headers.findIndex(h => h.includes('CLIENTE') || h.includes('NOME'));
                    const idxDesc = headers.findIndex(h => h.includes('DESCRIÇÃO') || h.includes('DESCRICAO'));
                    const idxValor = headers.findIndex(h => h.includes('VALOR'));
                    const idxStatus = headers.findIndex(h => h.includes('STATUS'));
                    const idxCC = headers.findIndex(h => h.includes('CENTRO') || h.includes('CUSTO'));

                    for (let i = headerIdx + 1; i < rows.length; i++) {
                        const row = rows[i];
                        if (!row || row.length === 0) continue;

                        const rawValor = idxValor !== -1 ? row[idxValor] : null;
                        if (rawValor === undefined || rawValor === null || rawValor === '') continue;

                        let numValor = 0;
                        if (typeof rawValor === 'number') {
                            numValor = rawValor;
                        } else {
                            let strV = String(rawValor).replace('R$', '').replace(/\s/g, '');
                            if (strV.includes(',') && strV.includes('.')) strV = strV.replace(/\./g, '').replace(',', '.');
                            else if (strV.includes(',')) strV = strV.replace(',', '.');
                            numValor = parseFloat(strV) || 0;
                        }

                        if (numValor === 0) continue;

                        const rawVenc = idxVenc !== -1 ? row[idxVenc] : '';
                        const vencFormated = parseExcelDate(rawVenc);
                        const cliente = idxCli !== -1 && row[idxCli] ? String(row[idxCli]).trim() : 'Cliente Importado';
                        const desc = idxDesc !== -1 && row[idxDesc] ? String(row[idxDesc]).trim() : 'Recebimento Excel';
                        const rawStatus = idxStatus !== -1 && row[idxStatus] ? String(row[idxStatus]).trim().toUpperCase() : 'PENDENTE';
                        const status = rawStatus.includes('PAG') || rawStatus.includes('RECEB') ? 'PAGO' : 'PENDENTE';
                        const rawCC = idxCC !== -1 && row[idxCC] ? String(row[idxCC]).trim().toUpperCase() : 'SERVIÇOS';

                        let cc = 'SERVIÇOS';
                        if (rawCC.includes('VEND')) cc = 'VENDAS';
                        else if (rawCC.includes('SERV')) cc = 'SERVIÇOS';

                        const newId = 'imp_r_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
                        const itemData = {
                            cliente: cliente,
                            desc: desc,
                            valor: numValor,
                            venc: vencFormated,
                            status: status,
                            cc: cc
                        };

                        if (isFirebaseConnected && db) {
                            db.collection("receber").doc(newId).set(itemData);
                        } else {
                            dbReceber.push({ id: newId, ...itemData });
                        }
                        countReceber++;
                    }
                }
            }

            carregarDados();
            e.target.value = '';

            alert(`Importação da Planilha Excel concluída com sucesso!\n\n• Contas a Pagar importadas: ${countPagar}\n• Contas a Receber importadas: ${countReceber}`);

        } catch (err) {
            console.error('Erro ao ler a planilha Excel:', err);
            alert('Erro ao processar o arquivo de planilha. Verifique se é um arquivo Excel (.xlsx ou .xls) válido.');
        }
    };
    reader.readAsArrayBuffer(file);
}

// CONTROLADORES DE MODAL
function abrirModalPagar() { 
    document.getElementById('pagarId').value = ''; 
    document.getElementById('pagarFornecedor').value = '';
    document.getElementById('pagarDesc').value = '';
    document.getElementById('pagarValor').value = '';
    document.getElementById('pagarVenc').value = '';
    document.getElementById('pagarStatus').value = 'PENDENTE';
    document.getElementById('pagarCC').value = 'ADMINISTRATIVO';
    document.getElementById('pagarFixa').value = 'NAO';
    document.getElementById('modalPagarTitle').innerText = 'Nova Conta a Pagar';
    abrirModal('modalPagar'); 
}

function editarPagar(id) {
    let item = dbPagar.find(x => String(x.id) === String(id));
    if (!item) return;
    document.getElementById('modalPagarTitle').innerText = 'Editar Conta a Pagar';
    document.getElementById('pagarId').value = item.id;
    document.getElementById('pagarFornecedor').value = item.fornecedor;
    document.getElementById('pagarDesc').value = item.desc;
    document.getElementById('pagarValor').value = item.valor;
    document.getElementById('pagarVenc').value = item.venc;
    document.getElementById('pagarStatus').value = item.status;
    document.getElementById('pagarCC').value = item.cc || 'PESSOAL';
    document.getElementById('pagarFixa').value = (item.fixa === true || item.fixa === 'SIM') ? 'SIM' : 'NAO';
    abrirModal('modalPagar');
}

function abrirModalReceber() { 
    document.getElementById('receberId').value = ''; 
    document.getElementById('receberCliente').value = '';
    document.getElementById('receberDesc').value = '';
    document.getElementById('receberValor').value = '';
    document.getElementById('receberVenc').value = '';
    document.getElementById('receberStatus').value = 'PENDENTE';
    document.getElementById('receberCC').value = 'SERVIÇOS';
    document.getElementById('modalReceberTitle').innerText = 'Nova Conta a Receber';
    abrirModal('modalReceber'); 
}

function editarReceber(id) {
    let item = dbReceber.find(x => String(x.id) === String(id));
    if (!item) return;
    document.getElementById('modalReceberTitle').innerText = 'Editar Conta a Receber';
    document.getElementById('receberId').value = item.id;
    document.getElementById('receberCliente').value = item.cliente;
    document.getElementById('receberDesc').value = item.desc;
    document.getElementById('receberValor').value = item.valor;
    document.getElementById('receberVenc').value = item.venc;
    document.getElementById('receberStatus').value = item.status;
    document.getElementById('receberCC').value = item.cc || 'SERVIÇOS';
    abrirModal('modalReceber');
}

function abrirModalEstoque() { 
    document.getElementById('estId').value = ''; 
    document.getElementById('estSKU').value = '';
    document.getElementById('estNome').value = '';
    document.getElementById('estQtd').value = '';
    document.getElementById('estMin').value = '';
    document.getElementById('estCusto').value = '';
    document.getElementById('estVenda').value = '';
    document.getElementById('modalEstoqueTitle').innerText = 'Cadastrar Peça no Estoque';
    abrirModal('modalEstoque'); 
}

function editarEstoque(id) {
    let item = dbEstoque.find(x => String(x.id) === String(id));
    if (!item) return;
    document.getElementById('modalEstoqueTitle').innerText = 'Editar Peça no Estoque';
    document.getElementById('estId').value = item.id;
    document.getElementById('estSKU').value = item.sku;
    document.getElementById('estNome').value = item.nome;
    document.getElementById('estQtd').value = item.qtd;
    document.getElementById('estMin').value = item.min;
    document.getElementById('estCusto').value = item.custo;
    document.getElementById('estVenda').value = item.venda;
    abrirModal('modalEstoque');
}

function movimentarEstoque(id) {
    let item = dbEstoque.find(x => String(x.id) === String(id));
    if (!item) return;
    document.getElementById('movEstId').value = item.id;
    document.getElementById('movEstNome').value = item.nome;
    document.getElementById('movQtd').value = '1';
    abrirModal('modalMovimentar');
}

function salvarMovimentacaoEstoque(e) {
    e.preventDefault();
    let id = document.getElementById('movEstId').value;
    let tipo = document.getElementById('movTipo').value;
    let qtd = Number(document.getElementById('movQtd').value);
    let item = dbEstoque.find(x => String(x.id) === String(id));
    if (item) {
        let novaQtd = tipo === 'ENTRADA' ? (Number(item.qtd) + qtd) : Math.max(0, Number(item.qtd) - qtd);
        if (isFirebaseConnected && db) {
            db.collection("estoque").doc(String(id)).update({ qtd: novaQtd });
        } else {
            item.qtd = novaQtd;
            carregarDados();
        }
    }
    fecharModal('modalMovimentar');
}

// BACKUP JSON E EXPORTAÇÃO CSV
function exportarBackupJSON() {
    const backupData = { dbPagar, dbReceber, dbEstoque, exportDate: new Date().toISOString() };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ricpower_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importarBackupJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.dbPagar) dbPagar = data.dbPagar;
            if (data.dbReceber) dbReceber = data.dbReceber;
            if (data.dbEstoque) dbEstoque = data.dbEstoque;

            if (isFirebaseConnected && db) {
                dbPagar.forEach(item => db.collection("pagar").doc(String(item.id)).set(item));
                dbReceber.forEach(item => db.collection("receber").doc(String(item.id)).set(item));
                dbEstoque.forEach(item => db.collection("estoque").doc(String(item.id)).set(item));
            }
            carregarDados();
            alert('Backup JSON restaurado e sincronizado com sucesso!');
        } catch (err) {
            alert('Erro ao importar arquivo JSON de backup.');
        }
    };
    reader.readAsText(file);
}

function exportarCSV(tipo) {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (tipo === 'pagar') {
        csvContent += "Vencimento;Recebedor / Empresa;Descricao;Valor;Status;CentroCusto\n";
        dbPagar.forEach(p => { csvContent += `${p.venc};${p.fornecedor};${p.desc};${p.valor};${p.status};${p.cc}\n`; });
    } else if (tipo === 'receber') {
        csvContent += "Vencimento;Cliente;Descricao;Valor;Status;CentroCusto\n";
        dbReceber.forEach(r => { csvContent += `${r.venc};${r.cliente};${r.desc};${r.valor};${r.status};${r.cc}\n`; });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ricpower_${tipo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// UTILS
function abrirModal(id) { document.getElementById(id).style.display = 'flex'; }
function fecharModal(id) { document.getElementById(id).style.display = 'none'; }
function toggleDateFilter() { document.getElementById('dateFilterDropdown').classList.toggle('show'); }

function selecionarFiltroData(tipo, txt) {
    filtroPeriodoGlobal = tipo;
    document.getElementById('currentPeriodText').innerText = txt;
    document.getElementById('dateFilterDropdown').classList.remove('show');
    carregarDados();
}

function aplicarDataPersonalizada() {
    let i = document.getElementById('dtInicio').value;
    let f = document.getElementById('dtFim').value;
    if(i && f) {
        filtroPeriodoGlobal = 'custom';
        dtInicioCustom = i;
        dtFimCustom = f;
        document.getElementById('currentPeriodText').innerText = `${i} até ${f}`;
        document.getElementById('dateFilterDropdown').classList.remove('show');
        carregarDados();
    }
}

function limparFiltroData() {
    filtroPeriodoGlobal = 'todos';
    dtInicioCustom = null;
    dtFimCustom = null;
    document.getElementById('dtInicio').value = '';
    document.getElementById('dtFim').value = '';
    document.getElementById('currentPeriodText').innerText = 'Todos os Registros';
    document.getElementById('dateFilterDropdown').classList.remove('show');
    carregarDados();
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
    if (!event.target.closest('.modern-filter-container')) {
        const dropdown = document.getElementById('dateFilterDropdown');
        if (dropdown && dropdown.classList.contains('show')) dropdown.classList.remove('show');
    }
};
