// --- VARIÁVEIS DE ESTADO E FIREBASE ---
let db = null;
let auth = null;
let isFirebaseConnected = false;

let dbPagar = [];
let dbReceber = [];
let dbEstoque = [];

let filtroPeriodoGlobal = 'todos';
let dtInicioCustom = null;
let dtFimCustom = null;

let chartFluxo = null;
let chartCat = null;

// Controla se a migração automática de datas antigas já foi executada
let jaCorrigiuDatas = false;

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

// INICIALIZAÇÃO E SESSÃO
document.addEventListener('DOMContentLoaded', () => {
    carregarDadosLocal(false);

    if (auth) {
        auth.onAuthStateChanged((user) => {
            if (user) {
                document.getElementById('login-screen').style.display = 'none';
                trocarAba('dashboard');
                iniciarEscutaFirebase();
            } else {
                verificarModoLocal();
            }
        });
    } else {
        verificarModoLocal();
    }
});

function verificarModoLocal() {
    if (localStorage.getItem('ric_logged') === 'true') {
        document.getElementById('login-screen').style.display = 'none';
        trocarAba('dashboard');
        carregarDadosLocal(true);
    }
}

function iniciarEscutaFirebase() {
    if (isFirebaseConnected && db) {
        document.getElementById('syncBadge').className = 'sync-badge online';
        document.getElementById('syncBadge').innerHTML = '<i class="fas fa-wifi"></i> Nuvem Sincronizada';

        db.collection("pagar").onSnapshot(snapshot => {
            dbPagar = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            carregarDados();
        }, error => {
            console.error("Erro no Firebase (pagar):", error);
            carregarDadosLocal(true);
        });

        db.collection("receber").onSnapshot(snapshot => {
            dbReceber = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            carregarDados();
        }, error => {
            console.error("Erro no Firebase (receber):", error);
            carregarDadosLocal(true);
        });

        db.collection("estoque").onSnapshot(snapshot => {
            dbEstoque = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            carregarDados();
        }, error => {
            console.error("Erro no Firebase (estoque):", error);
            carregarDadosLocal(true);
        });
    } else {
        carregarDadosLocal(true);
    }
}

function carregarDadosLocal(renderizar = true) {
    const badge = document.getElementById('syncBadge');
    if (badge && !isFirebaseConnected) {
        badge.className = 'sync-badge offline';
        badge.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Modo Off-line';
    }
    
    dbPagar = JSON.parse(localStorage.getItem('ric_pagar')) || [];
    dbReceber = JSON.parse(localStorage.getItem('ric_receber')) || [];
    dbEstoque = JSON.parse(localStorage.getItem('ric_estoque')) || [];

    if (renderizar) {
        carregarDados();
    }
}

// LOGIN / LOGOUT SEGURO
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
                localStorage.setItem('ric_logged', 'true');
                document.getElementById('login-screen').style.display = 'none';
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar no Sistema';
                }
                trocarAba('dashboard');
            })
            .catch((error) => {
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar no Sistema';
                }
                if (alertBox) {
                    alertBox.style.display = 'block';
                    alertBox.style.background = '#f8d7da';
                    alertBox.style.color = '#721c24';
                    alertBox.innerText = 'E-mail ou senha incorretos!';
                }
            });
    } else {
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar no Sistema';
        }
        if (alertBox) {
            alertBox.style.display = 'block';
            alertBox.style.background = '#f8d7da';
            alertBox.style.color = '#721c24';
            alertBox.innerText = 'Serviço de autenticação indisponível. Verifique sua conexão com o Firebase.';
        }
    }
}

function fazerLogout() {
    if (auth) auth.signOut();
    localStorage.removeItem('ric_logged');
    document.getElementById('login-screen').style.display = 'flex';
}

// NAVEGAÇÃO ENTRE ABAS
function trocarAba(nomeAba, elemento) {
    if (!nomeAba) return;

    const abas = document.querySelectorAll('.tab-content');
    abas.forEach(aba => {
        aba.classList.remove('active');
        aba.style.display = 'none';
    });

    let abaAlvo = document.getElementById(`tab-${nomeAba}`) || document.getElementById(nomeAba);

    if (abaAlvo) {
        abaAlvo.classList.add('active');
        abaAlvo.style.display = 'block';
    }

    const navLinks = document.querySelectorAll('.nav-link, .sidebar a');
    navLinks.forEach(link => link.classList.remove('active'));

    if (elemento && elemento.classList) {
        elemento.classList.add('active');
    }

    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar) sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}

// FORMATAÇÃO E FILTROS
const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function verificarSeAtrasou(dataVenc, statusAtual) {
    if (statusAtual === 'PAGO') return 'PAGO';
    if (!dataVenc) return statusAtual || 'PENDENTE';

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const venc = new Date(dataVenc + 'T00:00:00');

    if (venc < hoje) {
        return 'ATRASADO';
    }
    return 'PENDENTE';
}

function filtrarPorPeriodo(item) {
    if (!item || (!item.venc && !item.vencimento)) return true;
    if (filtroPeriodoGlobal === 'todos') return true;

    const dataStr = item.venc || item.vencimento;
    const itemDate = new Date(dataStr + 'T00:00:00');
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

// --- CORRIGIR REGISTROS ANTIGOS COM DATA SERIAL NO BANCO DE DADOS (OTIMIZADO COM BATCH) ---
async function corrigirDatasRegistrosAntigos() {
    if (jaCorrigiuDatas) return;
    jaCorrigiuDatas = true;

    let alterouPagar = false;
    let alterouReceber = false;

    const batch = (isFirebaseConnected && db) ? db.batch() : null;
    let operacoesBatch = 0;

    // 1. Corrigir Contas a Pagar
    dbPagar.forEach(item => {
        const rawVenc = item.venc || item.vencimento;
        if (rawVenc && (!isNaN(rawVenc) && Number(rawVenc) > 30000)) {
            const dataCorrigida = formatarDataExcel(rawVenc);
            item.venc = dataCorrigida;
            item.vencimento = dataCorrigida;
            alterouPagar = true;

            if (batch) {
                const docRef = db.collection("pagar").doc(String(item.id));
                batch.update(docRef, { venc: dataCorrigida, vencimento: dataCorrigida });
                operacoesBatch++;
            }
        }
    });

    // 2. Corrigir Contas a Receber
    dbReceber.forEach(item => {
        const rawVenc = item.venc || item.vencimento;
        if (rawVenc && (!isNaN(rawVenc) && Number(rawVenc) > 30000)) {
            const dataCorrigida = formatarDataExcel(rawVenc);
            item.venc = dataCorrigida;
            item.vencimento = dataCorrigida;
            alterouReceber = true;

            if (batch) {
                const docRef = db.collection("receber").doc(String(item.id));
                batch.update(docRef, { venc: dataCorrigida, vencimento: dataCorrigida });
                operacoesBatch++;
            }
        }
    });

    if (batch && operacoesBatch > 0) {
        try {
            await batch.commit();
        } catch (err) {
            console.error("Erro ao aplicar lote de atualização de datas:", err);
        }
    }

    if (alterouPagar) localStorage.setItem('ric_pagar', JSON.stringify(dbPagar));
    if (alterouReceber) localStorage.setItem('ric_receber', JSON.stringify(dbReceber));
}

// RENDERIZAÇÃO
function carregarDados() {
    // Executa a verificação de migração apenas uma vez na carga inicial
    corrigirDatasRegistrosAntigos();

    localStorage.setItem('ric_pagar', JSON.stringify(dbPagar));
    localStorage.setItem('ric_receber', JSON.stringify(dbReceber));
    localStorage.setItem('ric_estoque', JSON.stringify(dbEstoque));

    const pagarFiltrado = dbPagar.filter(filtrarPorPeriodo);
    const receberFiltrado = dbReceber.filter(filtrarPorPeriodo);

    let realIn = receberFiltrado.filter(x => x.status === 'PAGO').reduce((a,b) => a + Number(b.valor), 0);
    let pendingIn = receberFiltrado.filter(x => x.status !== 'PAGO').reduce((a,b) => a + Number(b.valor), 0);
    
    let realOut = pagarFiltrado.filter(x => x.status === 'PAGO').reduce((a,b) => a + Number(b.valor), 0);
    let pendingOut = pagarFiltrado.filter(x => x.status !== 'PAGO').reduce((a,b) => a + Number(b.valor), 0);

    let balReal = realIn - realOut;
    let balProj = (realIn + pendingIn) - (realOut + pendingOut);
    let stockTot = dbEstoque.reduce((a,b) => a + (Number(b.qtd) * Number(b.custo || b.precoCusto || 0)), 0);

    if (document.getElementById('kpiRealIn')) document.getElementById('kpiRealIn').innerText = fmt(realIn);
    if (document.getElementById('kpiPendingIn')) document.getElementById('kpiPendingIn').innerText = fmt(pendingIn);
    if (document.getElementById('kpiRealOut')) document.getElementById('kpiRealOut').innerText = fmt(realOut);
    if (document.getElementById('kpiPendingOut')) document.getElementById('kpiPendingOut').innerText = fmt(pendingOut);
    if (document.getElementById('kpiBalanceReal')) document.getElementById('kpiBalanceReal').innerText = fmt(balReal);
    if (document.getElementById('kpiBalanceProjected')) document.getElementById('kpiBalanceProjected').innerText = fmt(balProj);
    if (document.getElementById('kpiStockTotal')) document.getElementById('kpiStockTotal').innerText = fmt(stockTot);

    let catPessoal = pagarFiltrado.filter(x => (x.cc || x.categoria) === 'PESSOAL').reduce((a,b) => a + Number(b.valor), 0);
    let catAdmin = pagarFiltrado.filter(x => (x.cc || x.categoria) === 'ADMINISTRATIVO').reduce((a,b) => a + Number(b.valor), 0);
    let catPecas = pagarFiltrado.filter(x => (x.cc || x.categoria) === 'PEÇAS').reduce((a,b) => a + Number(b.valor), 0);

    atualizarDREDual(pagarFiltrado, receberFiltrado);
    renderTabelas(pagarFiltrado, receberFiltrado);
    renderGraficos(realIn, realOut, catPessoal, catAdmin, catPecas);
}

function atualizarDREDual(pagarList = dbPagar, receberList = dbReceber) {
    let recReal = receberList.filter(x => x.status === 'PAGO').reduce((a,b) => a + Number(b.valor), 0);
    let recPend = receberList.filter(x => x.status !== 'PAGO').reduce((a,b) => a + Number(b.valor), 0);
    let recProj = recReal + recPend;

    let custoReal = pagarList.filter(x => x.status === 'PAGO' && (x.cc === 'PEÇAS' || x.categoria === 'Peças Novas')).reduce((a,b) => a + Number(b.valor), 0);
    let custoPend = pagarList.filter(x => x.status !== 'PAGO' && (x.cc === 'PEÇAS' || x.categoria === 'Peças Novas')).reduce((a,b) => a + Number(b.valor), 0);
    let custoProj = custoReal + custoPend;

    let despFixaReal = pagarList.filter(x => x.status === 'PAGO' && (x.cc === 'ADMINISTRATIVO' || x.categoria === 'Custos Fixos')).reduce((a,b) => a + Number(b.valor), 0);
    let despFixaPend = pagarList.filter(x => x.status !== 'PAGO' && (x.cc === 'ADMINISTRATIVO' || x.categoria === 'Custos Fixos')).reduce((a,b) => a + Number(b.valor), 0);
    let despFixaProj = despFixaReal + despFixaPend;

    let despPessReal = pagarList.filter(x => x.status === 'PAGO' && (x.cc === 'PESSOAL' || x.categoria === 'Pessoal')).reduce((a,b) => a + Number(b.valor), 0);
    let despPessPend = pagarList.filter(x => x.status !== 'PAGO' && (x.cc === 'PESSOAL' || x.categoria === 'Pessoal')).reduce((a,b) => a + Number(b.valor), 0);
    let despPessProj = despPessReal + despPessPend;

    let lucroBrutoReal = recReal - custoReal;
    let lucroBrutoPend = recPend - custoPend;
    let lucroBrutoProj = recProj - custoProj;

    let resReal = lucroBrutoReal - (despFixaReal + despPessReal);
    let resPend = lucroBrutoPend - (despFixaPend + despPessPend);
    let resProj = lucroBrutoProj - (despFixaProj + despPessProj);

    let margemReal = recReal > 0 ? ((resReal / recReal) * 100).toFixed(1) : '0.0';
    let margemProj = recProj > 0 ? ((resProj / recProj) * 100).toFixed(1) : '0.0';

    if(document.getElementById('dreRecReal')) document.getElementById('dreRecReal').innerText = fmt(recReal);
    if(document.getElementById('dreRecPend')) document.getElementById('dreRecPend').innerText = fmt(recPend);
    if(document.getElementById('dreRecProj')) document.getElementById('dreRecProj').innerText = fmt(recProj);

    if(document.getElementById('dreCustoReal')) document.getElementById('dreCustoReal').innerText = fmt(custoReal);
    if(document.getElementById('dreCustoPend')) document.getElementById('dreCustoPend').innerText = fmt(custoPend);
    if(document.getElementById('dreCustoProj')) document.getElementById('dreCustoProj').innerText = fmt(custoProj);

    if(document.getElementById('dreLucroBrutoReal')) document.getElementById('dreLucroBrutoReal').innerText = fmt(lucroBrutoReal);
    if(document.getElementById('dreLucroBrutoPend')) document.getElementById('dreLucroBrutoPend').innerText = fmt(lucroBrutoPend);
    if(document.getElementById('dreLucroBrutoProj')) document.getElementById('dreLucroBrutoProj').innerText = fmt(lucroBrutoProj);

    if(document.getElementById('dreDespFixaReal')) document.getElementById('dreDespFixaReal').innerText = fmt(despFixaReal);
    if(document.getElementById('dreDespFixaPend')) document.getElementById('dreDespFixaPend').innerText = fmt(despFixaPend);
    if(document.getElementById('dreDespFixaProj')) document.getElementById('dreDespFixaProj').innerText = fmt(despFixaProj);

    if(document.getElementById('dreDespPessReal')) document.getElementById('dreDespPessReal').innerText = fmt(despPessReal);
    if(document.getElementById('dreDespPessPend')) document.getElementById('dreDespPessPend').innerText = fmt(despPessPend);
    if(document.getElementById('dreDespPessProj')) document.getElementById('dreDespPessProj').innerText = fmt(despPessProj);

    if(document.getElementById('dreResLiquidoReal')) document.getElementById('dreResLiquidoReal').innerText = fmt(resReal);
    if(document.getElementById('dreResLiquidoPend')) document.getElementById('dreResLiquidoPend').innerText = fmt(resPend);
    if(document.getElementById('dreResLiquidoProj')) document.getElementById('dreResLiquidoProj').innerText = fmt(resProj);

    if(document.getElementById('dreMargemReal')) document.getElementById('dreMargemReal').innerText = `${margemReal}%`;
    if(document.getElementById('dreMargemProj')) document.getElementById('dreMargemProj').innerText = `${margemProj}%`;
}

function renderTabelas(pagarList = dbPagar, receberList = dbReceber) {
    let tbVenc = document.getElementById('tbProximosVencimentos');
    if (tbVenc) {
        tbVenc.innerHTML = '';
        [...pagarList, ...receberList].sort((a,b) => new Date(a.venc || a.vencimento) - new Date(b.venc || b.vencimento)).slice(0, 5).forEach(item => {
            let isPagar = item.fornecedor !== undefined;
            let statusCalculado = verificarSeAtrasou(item.venc || item.vencimento, item.status);
            
            tbVenc.innerHTML += `
                <tr>
                    <td>${item.venc || item.vencimento}</td>
                    <td><span class="status-badge ${isPagar ? 'atrasado' : 'pago'}">${isPagar ? 'SAÍDA' : 'ENTRADA'}</span></td>
                    <td>${isPagar ? item.fornecedor : item.cliente}</td>
                    <td><strong>${fmt(Number(item.valor))}</strong></td>
                    <td><span class="status-badge ${statusCalculado.toLowerCase()}">${statusCalculado}</span></td>
                    <td><button class="btn btn-secondary btn-sm" onclick="alternarStatus('${item.id}', ${isPagar})"><i class="fas fa-sync"></i> Status</button></td>
                </tr>
            `;
        });
    }

    let tbP = document.getElementById('tbPagar');
    if (tbP) {
        let buscaP = (document.getElementById('buscaPagar')?.value || '').toLowerCase();
        let statusP = document.getElementById('filtroStatusPagar')?.value || 'TODOS';
        let ccP = document.getElementById('filtroCCPagar')?.value || 'TODOS';

        tbP.innerHTML = '';
        pagarList.filter(item => {
            let statusReal = verificarSeAtrasou(item.venc || item.vencimento, item.status);
            let matchBusca = (item.fornecedor || '').toLowerCase().includes(buscaP) || (item.desc || item.descricao || '').toLowerCase().includes(buscaP);
            let matchStatus = statusP === 'TODOS' || statusReal === statusP;
            let matchCC = ccP === 'TODOS' || (item.cc || item.categoria) === ccP;
            return matchBusca && matchStatus && matchCC;
        }).forEach(item => {
            let statusReal = verificarSeAtrasou(item.venc || item.vencimento, item.status);
            let tagFixa = (item.fixa === true || item.fixa === 'SIM') ? '<span class="badge-fixa">FIXA</span>' : '';
            
            tbP.innerHTML += `
                <tr>
                    <td>${item.venc || item.vencimento}</td>
                    <td>${item.fornecedor}</td>
                    <td>${item.desc || item.descricao} ${tagFixa}</td>
                    <td><strong>${fmt(Number(item.valor))}</strong></td>
                    <td><span class="status-badge ${statusReal.toLowerCase()}">${statusReal}</span></td>
                    <td>${item.cc || item.categoria || '-'}</td>
                    <td>
                        <button class="btn ${item.status === 'PAGO' ? 'btn-warning' : 'btn-success'} btn-sm" onclick="alternarStatus('${item.id}', true)">
                            ${item.status === 'PAGO' ? 'Reverter' : 'Baixa'}
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="editarPagar('${item.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="excluirItem('${item.id}', true)"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    }

    let tbR = document.getElementById('tbReceber');
    if (tbR) {
        let buscaR = (document.getElementById('buscaReceber')?.value || '').toLowerCase();
        let statusR = document.getElementById('filtroStatusReceber')?.value || 'TODOS';
        let ccR = document.getElementById('filtroCCReceber')?.value || 'TODOS';

        tbR.innerHTML = '';
        receberList.filter(item => {
            let statusReal = verificarSeAtrasou(item.venc || item.vencimento, item.status);
            let matchBusca = (item.cliente || '').toLowerCase().includes(buscaR) || (item.desc || item.descricao || '').toLowerCase().includes(buscaR);
            let matchStatus = statusR === 'TODOS' || statusReal === statusR;
            let matchCC = ccR === 'TODOS' || (item.cc || item.categoria) === ccR;
            return matchBusca && matchStatus && matchCC;
        }).forEach(item => {
            let statusReal = verificarSeAtrasou(item.venc || item.vencimento, item.status);
            tbR.innerHTML += `
                <tr>
                    <td>${item.venc || item.vencimento}</td>
                    <td>${item.cliente}</td>
                    <td>${item.desc || item.descricao}</td>
                    <td><strong>${fmt(Number(item.valor))}</strong></td>
                    <td><span class="status-badge ${statusReal.toLowerCase()}">${statusReal}</span></td>
                    <td>${item.cc || item.categoria || '-'}</td>
                    <td>
                        <button class="btn ${item.status === 'PAGO' ? 'btn-warning' : 'btn-success'} btn-sm" onclick="alternarStatus('${item.id}', false)">
                            ${item.status === 'PAGO' ? 'Reverter' : 'Baixa'}
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="editarReceber('${item.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="excluirItem('${item.id}', false)"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    }

    let tbE = document.getElementById('tbEstoque');
    if (tbE) {
        let buscaE = (document.getElementById('buscaEstoque')?.value || '').toLowerCase();
        let statusE = document.getElementById('filtroStatusEstoque')?.value || 'TODOS';

        tbE.innerHTML = '';
        dbEstoque.filter(item => {
            let matchBusca = (item.nome || '').toLowerCase().includes(buscaE) || (item.sku || '').toLowerCase().includes(buscaE);
            let isBaixo = Number(item.qtd) <= Number(item.min || item.qtdMin || 0);
            let matchStatus = statusE === 'TODOS' || (statusE === 'BAIXO' && isBaixo) || (statusE === 'NORMAL' && !isBaixo);
            return matchBusca && matchStatus;
        }).forEach(item => {
            let custo = Number(item.custo || item.precoCusto || 0);
            let venda = Number(item.venda || item.precoVenda || 0);
            let min = Number(item.min || item.qtdMin || 0);
            let isBaixo = Number(item.qtd) <= min;

            tbE.innerHTML += `
                <tr>
                    <td>${item.sku}</td>
                    <td>${item.nome} ${isBaixo ? '<span class="status-badge atrasado">Estoque Baixo</span>' : ''}</td>
                    <td>${item.cat || item.categoria || 'Peças'}</td>
                    <td><strong>${item.qtd}</strong></td>
                    <td>${min}</td>
                    <td>${fmt(custo)}</td>
                    <td>${fmt(venda)}</td>
                    <td>${fmt(Number(item.qtd) * custo)}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="movimentarEstoque('${item.id}')">+/-</button>
                        <button class="btn btn-secondary btn-sm" onclick="editarEstoque('${item.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="excluirEstoque('${item.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    }
}

function renderGraficos(realIn, realOut, catPessoal = 0, catAdmin = 0, catPecas = 0) {
    if (typeof Chart === 'undefined') return;

    const elFluxo = document.getElementById('chartFluxoCaixa');
    if (elFluxo) {
        const ctxFluxo = elFluxo.getContext('2d');
        if (chartFluxo) chartFluxo.destroy();
        chartFluxo = new Chart(ctxFluxo, {
            type: 'bar',
            data: {
                labels: ['Entradas Realizadas', 'Saídas Realizadas'],
                datasets: [{ label: 'Valores em R$', data: [realIn, realOut], backgroundColor: ['#2ecc71', '#e74c3c'] }]
            },
            options: { responsive: true }
        });
    }

    const elCat = document.getElementById('chartCategorias');
    if (elCat) {
        const ctxCat = elCat.getContext('2d');
        if (chartCat) chartCat.destroy();
        chartCat = new Chart(ctxCat, {
            type: 'doughnut',
            data: {
                labels: ['Pessoal', 'Administrativo', 'Peças'],
                datasets: [{ data: [catPessoal, catAdmin, catPecas], backgroundColor: ['#FFD500', '#111111', '#e74c3c'] }]
            },
            options: { responsive: true }
        });
    }
}

// --- ZERAR TODO O BANCO DE DADOS E ARMAZENAMENTO LOCAL ---
async function zerarTodoSistema() {
    if (!confirm("⚠️ ATENÇÃO: Deseja realmente apagar TODOS os registros de Contas a Pagar, Contas a Receber e Estoque? Esta ação não pode ser desfeita.")) {
        return;
    }

    try {
        if (isFirebaseConnected && db) {
            const colecoes = ["pagar", "receber", "estoque"];
            for (const col of colecoes) {
                const snapshot = await db.collection(col).get();
                const batch = db.batch();
                snapshot.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
            }
        }

        dbPagar = [];
        dbReceber = [];
        dbEstoque = [];
        localStorage.removeItem('ric_pagar');
        localStorage.removeItem('ric_receber');
        localStorage.removeItem('ric_estoque');

        carregarDados();
        alert("O banco de dados foi totalmente zerado! Você já pode realizar uma nova importação limpa.");
    } catch (err) {
        console.error("Erro ao zerar banco:", err);
        alert("Erro ao limpar dados no Firebase. Verifique se possui conexão e permissões ativas.");
    }
}

// --- GERAR DESPESAS FIXAS DO MÊS ATUAL ---
function gerarDespesasFixasMesAtual() {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');

    const fixas = dbPagar.filter(p => p.fixa === true || p.fixa === 'SIM');

    if (fixas.length === 0) {
        alert("Nenhuma despesa marcada como 'Fixa' foi encontrada para replicação.");
        return;
    }

    let criadas = 0;
    fixas.forEach(item => {
        const diaOriginal = (item.venc || item.vencimento || '10').split('-')[2] || '10';
        const novoVenc = `${anoAtual}-${mesAtual}-${diaOriginal}`;

        const jaExiste = dbPagar.some(p => p.fornecedor === item.fornecedor && (p.venc || p.vencimento) === novoVenc);

        if (!jaExiste) {
            const newId = 'fixa_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            const novoItem = {
                fornecedor: item.fornecedor,
                desc: item.desc || item.descricao,
                valor: Number(item.valor),
                venc: novoVenc,
                status: 'PENDENTE',
                cc: item.cc || item.categoria || 'ADMINISTRATIVO',
                fixa: true
            };

            if (isFirebaseConnected && db) {
                db.collection("pagar").doc(newId).set(novoItem);
            } else {
                dbPagar.push({ id: newId, ...novoItem });
            }
            criadas++;
        }
    });

    carregarDados();
    alert(`Geradas ${criadas} despesas fixas para o mês de ${mesAtual}/${anoAtual}!`);
}

// --- FUNÇÃO AUXILIAR DE MAPEAMENTO DE CAMPOS MULTI-MODELO ---
function extrairValorPorSinonimos(row, sinonimos) {
    if (!row) return undefined;
    const keys = Object.keys(row);
    for (let s of sinonimos) {
        const keyEncontrada = keys.find(k => k.toString().trim().toUpperCase() === s.toUpperCase());
        if (keyEncontrada && row[keyEncontrada] !== undefined && row[keyEncontrada] !== null) {
            return row[keyEncontrada];
        }
    }
    return undefined;
}

// --- ENCONTRAR A LINHA DO CABEÇALHO AUTOMATICAMENTE ---
function encontrarLinhaCabecalho(sheet) {
    const rawMatrix = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const palavrasChave = ['FORNECEDOR', 'CLIENTE', 'VALOR', 'VENCIMENTO', 'DATA', 'STATUS', 'DESCRIÇÃO', 'DESCRICAO', 'EMPRESA', 'PAGADOR', 'CÓDIGO', 'CODIGO', 'PRODUTO', 'ITEM', 'QUANTIDADE'];
    
    for (let r = 0; r < Math.min(rawMatrix.length, 15); r++) {
        const row = rawMatrix[r];
        if (Array.isArray(row)) {
            const strRow = row.join(' ').toUpperCase();
            const matches = palavrasChave.filter(kw => strRow.includes(kw));
            if (matches.length >= 2) {
                return r;
            }
        }
    }
    return 0;
}

// --- AUXILIAR DE FILTRO DE DATA NA IMPORTAÇÃO EXCEL ---
function validarDataImportacao(dataStr, filtroOpcao) {
    if (!filtroOpcao || filtroOpcao === 'ALL' || !dataStr) return true;

    let dataItem;
    if (dataStr.includes('-')) {
        const partes = dataStr.split('-');
        dataItem = new Date(partes[0], partes[1] - 1, partes[2]);
    } else if (dataStr.includes('/')) {
        const partes = dataStr.split('/');
        dataItem = new Date(partes[2], partes[1] - 1, partes[0]);
    } else {
        dataItem = new Date(dataStr);
    }

    if (isNaN(dataItem.getTime())) return true;

    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    if (filtroOpcao === '30DAYS') {
        const limite30DiasAtras = new Date();
        limite30DiasAtras.setDate(hoje.getDate() - 30);
        limite30DiasAtras.setHours(0, 0, 0, 0);

        return dataItem >= limite30DiasAtras;
    }

    if (filtroOpcao === 'ESTE_MES') {
        return dataItem.getMonth() === hoje.getMonth() && dataItem.getFullYear() === hoje.getFullYear();
    }

    if (filtroOpcao === 'ESTE_ANO') {
        return dataItem.getFullYear() === hoje.getFullYear();
    }

    return true;
}

// --- CONVERSÃO DE DATAS DO EXCEL (FORMATO SERIAL / DATE OBJECT / STRING) ---
function formatarDataExcel(valorData) {
    if (!valorData) return new Date().toISOString().split('T')[0];

    if (typeof valorData === 'string' && valorData.includes('-')) {
        return valorData.trim();
    }

    if (valorData instanceof Date) {
        if (!isNaN(valorData.getTime())) {
            return valorData.toISOString().split('T')[0];
        }
    }

    if (!isNaN(valorData) && Number(valorData) > 30000) {
        const dataJS = new Date((Number(valorData) - (25567 + 2)) * 86400 * 1000);
        if (!isNaN(dataJS.getTime())) {
            return dataJS.toISOString().split('T')[0];
        }
    }

    return String(valorData);
}

// --- IMPORTAÇÃO EXCEL MULTI-MODELO COM DETECÇÃO E FILTRO DE DATA AUTOMÁTICOS ---
function importarPlanilhaExcel(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array', cellDates: true, dateNF: 'yyyy-mm-dd' });

            const limitSelect = document.getElementById('excelImportLimit');
            const limitValue = limitSelect ? limitSelect.value : 'ALL';

            const dateFilterSelect = document.getElementById('excelDateFilter');
            const dateFilterValue = dateFilterSelect ? dateFilterSelect.value : 'ALL';

            let countPagar = 0;
            let countReceber = 0;
            let countEstoque = 0;

            const sinFornecedor = ['FORNECEDOR', 'EMPRESA', 'RECEBEDOR', 'NOME', 'FORNECEDORA', 'RAZÃO SOCIAL', 'RAZAO SOCIAL'];
            const sinCliente = ['CLIENTE', 'PAGADOR', 'NOME', 'CLIENTA', 'RAZÃO SOCIAL', 'RAZAO SOCIAL'];
            const sinValor = ['VALOR A PAGAR', 'VALOR A RECEBER', 'VALOR', 'VALOR TOTAL', 'MONTANTE', 'VLR'];
            const sinVenc = ['DATA DE VENCIMENTO', 'VENCIMENTO', 'DATA VENC', 'VENC', 'DATA DE VENC', 'DATA VENCIMENTO'];
            const sinDesc = ['DESCRIÇÃO', 'DESCRICAO', 'DESC', 'OBSERVAÇÃO', 'OBSERVACAO', 'HISTÓRICO', 'HISTORICO', 'DESCRIÇÃO DO ITEM'];
            const sinStatus = ['STATUS', 'SITUAÇÃO', 'SITUACAO', 'ESTADO', 'PAGO?'];
            const sinCC = ['CENTRO DE CUSTO', 'CATEGORIA', 'CC', 'CENTRO CUSTO', 'C. CUSTO'];

            const sinSku = ['CÓDIGO', 'CODIGO', 'SKU', 'CÓD', 'COD'];
            const sinNomeItem = ['DESCRIÇÃO DO ITEM', 'DESCRICAO DO ITEM', 'NOME', 'PRODUTO', 'ITEM', 'DESCRIÇÃO', 'DESCRICAO'];
            const sinCatItem = ['CATEGORIA', 'CAT', 'GRUPO', 'TIPO'];
            const sinQtd = ['QUANTIDADE', 'QTD', 'ESTOQUE', 'QUANT'];
            const sinCusto = ['CUSTO UNITÁRIO', 'CUSTO UNITARIO', 'PREÇO CUSTO', 'PRECO CUSTO', 'CUSTO'];
            const sinVenda = ['PREÇO DE VENDA', 'PRECO DE VENDA', 'PREÇO VENDA', 'PRECO VENDA', 'VENDA'];

            // 1. Processar Contas a Pagar
            const sheetPagarName = workbook.SheetNames.find(s => 
                s.toUpperCase().includes('PAGAR') || s.toUpperCase().includes('SAIDA') || s.toUpperCase().includes('SAÍDA')
            );
            
            if (sheetPagarName) {
                const sheetPagar = workbook.Sheets[sheetPagarName];
                const linhaCabecalho = encontrarLinhaCabecalho(sheetPagar);
                let rows = XLSX.utils.sheet_to_json(sheetPagar, { range: linhaCabecalho });

                if (limitValue !== 'ALL') rows = rows.slice(-parseInt(limitValue, 10));

                rows.forEach(row => {
                    const fornecedor = extrairValorPorSinonimos(row, sinFornecedor) || 'Fornecedor Importado';
                    let valor = extrairValorPorSinonimos(row, sinValor);

                    if (typeof valor === 'string') valor = parseFloat(valor.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
                    valor = parseFloat(valor) || 0;

                    const rawVenc = extrairValorPorSinonimos(row, sinVenc);
                    const dataVenc = formatarDataExcel(rawVenc);

                    if (valor > 0 && validarDataImportacao(dataVenc, dateFilterValue)) {
                        const newId = 'imp_p_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
                        const statusLido = String(extrairValorPorSinonimos(row, sinStatus) || 'PENDENTE').toUpperCase();
                        
                        const itemData = {
                            fornecedor: String(fornecedor),
                            desc: String(extrairValorPorSinonimos(row, sinDesc) || 'Importado via Excel'),
                            valor: valor,
                            venc: dataVenc,
                            status: statusLido.includes('PAG') ? 'PAGO' : 'PENDENTE',
                            cc: String(extrairValorPorSinonimos(row, sinCC) || 'ADMINISTRATIVO'),
                            fixa: false
                        };

                        if (isFirebaseConnected && db) db.collection("pagar").doc(newId).set(itemData);
                        else dbPagar.push({ id: newId, ...itemData });
                        countPagar++;
                    }
                });
            }

            // 2. Processar Contas a Receber
            const sheetReceberName = workbook.SheetNames.find(s => 
                s.toUpperCase().includes('RECEBER') || s.toUpperCase().includes('ENTRADA')
            );

            if (sheetReceberName) {
                const sheetReceber = workbook.Sheets[sheetReceberName];
                const linhaCabecalho = encontrarLinhaCabecalho(sheetReceber);
                let rows = XLSX.utils.sheet_to_json(sheetReceber, { range: linhaCabecalho });

                if (limitValue !== 'ALL') rows = rows.slice(-parseInt(limitValue, 10));

                rows.forEach(row => {
                    const cliente = extrairValorPorSinonimos(row, sinCliente) || 'Cliente Importado';
                    let valor = extrairValorPorSinonimos(row, sinValor);

                    if (typeof valor === 'string') valor = parseFloat(valor.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
                    valor = parseFloat(valor) || 0;

                    const rawVenc = extrairValorPorSinonimos(row, sinVenc);
                    const dataVenc = formatarDataExcel(rawVenc);

                    if (valor > 0 && validarDataImportacao(dataVenc, dateFilterValue)) {
                        const newId = 'imp_r_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
                        const statusLido = String(extrairValorPorSinonimos(row, sinStatus) || 'PENDENTE').toUpperCase();

                        const itemData = {
                            cliente: String(cliente),
                            desc: String(extrairValorPorSinonimos(row, sinDesc) || 'Importado via Excel'),
                            valor: valor,
                            venc: dataVenc,
                            status: statusLido.includes('PAG') ? 'PAGO' : 'PENDENTE',
                            cc: String(extrairValorPorSinonimos(row, sinCC) || 'SERVIÇOS')
                        };

                        if (isFirebaseConnected && db) db.collection("receber").doc(newId).set(itemData);
                        else dbReceber.push({ id: newId, ...itemData });
                        countReceber++;
                    }
                });
            }

            // 3. Processar Estoque
            const sheetEstoqueName = workbook.SheetNames.find(s => 
                s.toUpperCase().includes('ESTOQUE') || s.toUpperCase().includes('PRODUTO') || s.toUpperCase().includes('PECA') || s.toUpperCase().includes('PEÇA')
            );

            if (sheetEstoqueName) {
                const sheetEstoque = workbook.Sheets[sheetEstoqueName];
                const linhaCabecalho = encontrarLinhaCabecalho(sheetEstoque);
                let rows = XLSX.utils.sheet_to_json(sheetEstoque, { range: linhaCabecalho });

                if (limitValue !== 'ALL') rows = rows.slice(-parseInt(limitValue, 10));

                rows.forEach(row => {
                    const sku = extrairValorPorSinonimos(row, sinSku) || ('SKU-' + Math.floor(Math.random() * 1000));
                    const nome = extrairValorPorSinonimos(row, sinNomeItem);
                    let qtd = parseInt(extrairValorPorSinonimos(row, sinQtd)) || 0;
                    let custo = parseFloat(extrairValorPorSinonimos(row, sinCusto)) || 0;
                    let venda = parseFloat(extrairValorPorSinonimos(row, sinVenda)) || 0;

                    if (nome && (qtd > 0 || custo > 0 || venda > 0)) {
                        const newId = 'imp_e_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
                        const itemData = {
                            sku: String(sku),
                            nome: String(nome),
                            cat: String(extrairValorPorSinonimos(row, sinCatItem) || 'Peças'),
                            qtd: qtd,
                            min: 5,
                            custo: custo,
                            venda: venda
                        };

                        if (isFirebaseConnected && db) db.collection("estoque").doc(newId).set(itemData);
                        else dbEstoque.push({ id: newId, ...itemData });
                        countEstoque++;
                    }
                });
            }

            carregarDados();

            e.target.value = '';
            alert(`Planilha importada com sucesso!\n\n• Contas a Pagar: ${countPagar}\n• Contas a Receber: ${countReceber}\n• Itens do Estoque: ${countEstoque}`);

        } catch (err) {
            console.error("Erro na importação Excel:", err);
            alert("Erro ao ler planilha Excel. Certifique-se de que é um arquivo .xlsx válido.");
        }
    };
    reader.readAsArrayBuffer(file);
}

// BACKUP E EXPORTAÇÃO
function exportarBackupJSON() {
    const backupData = { dbPagar, dbReceber, dbEstoque, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
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
            if (data.dbPagar || data.contasPagar) dbPagar = data.dbPagar || data.contasPagar;
            if (data.dbReceber || data.contasReceber) dbReceber = data.dbReceber || data.contasReceber;
            if (data.dbEstoque || data.estoque) dbEstoque = data.dbEstoque || data.estoque;

            if (isFirebaseConnected && db) {
                dbPagar.forEach(item => db.collection("pagar").doc(String(item.id)).set(item));
                dbReceber.forEach(item => db.collection("receber").doc(String(item.id)).set(item));
                dbEstoque.forEach(item => db.collection("estoque").doc(String(item.id)).set(item));
            }

            carregarDados();
            alert('Backup JSON restaurado com sucesso!');
        } catch (err) {
            alert('Erro ao restaurar o arquivo JSON.');
        }
    };
    reader.readAsText(file);
}

function exportarCSV(tipo) {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (tipo === 'pagar') {
        csvContent += "Vencimento;Recebedor / Empresa;Descricao;Valor;Status;CentroCusto\n";
        dbPagar.forEach(p => { 
            let statusReal = verificarSeAtrasou(p.venc || p.vencimento, p.status);
            csvContent += `${p.venc || p.vencimento};${p.fornecedor};${p.desc || p.descricao};${p.valor};${statusReal};${p.cc || p.categoria}\n`; 
        });
    } else {
        csvContent += "Vencimento;Cliente;Descricao;Valor;Status;CentroCusto\n";
        dbReceber.forEach(r => { 
            let statusReal = verificarSeAtrasou(r.venc || r.vencimento, r.status);
            csvContent += `${r.venc || r.vencimento};${r.cliente};${r.desc || r.descricao};${r.valor};${statusReal};${r.cc || r.categoria}\n`; 
        });
    }

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `ricpower_${tipo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// MODAIS E UTILS
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

function salvarPagar(e) {
    e.preventDefault();
    let id = document.getElementById('pagarId').value || String(Date.now());
    let item = {
        fornecedor: document.getElementById('pagarFornecedor').value,
        desc: document.getElementById('pagarDesc').value,
        valor: Number(document.getElementById('pagarValor').value),
        venc: document.getElementById('pagarVenc').value,
        status: document.getElementById('pagarStatus').value,
        cc: document.getElementById('pagarCC').value,
        fixa: document.getElementById('pagarFixa').value === 'SIM'
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

// --- FUNÇÕES DE EDIÇÃO E MOVIMENTAÇÃO DE ESTOQUE ---

function movimentarEstoque(id) {
    let item = dbEstoque.find(x => String(x.id) === String(id));
    if (!item) return;

    let qtdStr = prompt(`Movimentação de Estoque: ${item.nome}\nQuantidade Atual: ${item.qtd}\n\nDigite a quantidade a adicionar ou subtrair (Ex: 5 ou -2):`);
    if (qtdStr === null || qtdStr.trim() === "") return;

    let qtdDelta = parseInt(qtdStr, 10);
    if (isNaN(qtdDelta)) {
        alert("Quantidade inválida!");
        return;
    }

    let novaQtd = Math.max(0, Number(item.qtd) + qtdDelta);

    if (isFirebaseConnected && db) {
        db.collection("estoque").doc(String(id)).update({ qtd: novaQtd });
    } else {
        item.qtd = novaQtd;
        carregarDados();
    }
}

function editarEstoque(id) {
    let item = dbEstoque.find(x => String(x.id) === String(id));
    if (!item) return;

    document.getElementById('estId').value = item.id;
    document.getElementById('estSKU').value = item.sku || '';
    document.getElementById('estNome').value = item.nome || '';
    document.getElementById('estQtd').value = item.qtd || 0;
    document.getElementById('estMin').value = item.min || item.qtdMin || 5;
    document.getElementById('estCusto').value = item.custo || item.precoCusto || 0;
    document.getElementById('estVenda').value = item.venda || item.precoVenda || 0;

    document.getElementById('modalEstoqueTitle').innerText = 'Editar Peça no Estoque';
    abrirModal('modalEstoque');
}

function editarPagar(id) {
    let item = dbPagar.find(x => String(x.id) === String(id));
    if (!item) return;

    document.getElementById('pagarId').value = item.id;
    document.getElementById('pagarFornecedor').value = item.fornecedor || '';
    document.getElementById('pagarDesc').value = item.desc || item.descricao || '';
    document.getElementById('pagarValor').value = item.valor || 0;
    document.getElementById('pagarVenc').value = item.venc || item.vencimento || '';
    document.getElementById('pagarStatus').value = item.status || 'PENDENTE';
    document.getElementById('pagarCC').value = item.cc || item.categoria || 'ADMINISTRATIVO';
    document.getElementById('pagarFixa').value = (item.fixa === true || item.fixa === 'SIM') ? 'SIM' : 'NAO';

    document.getElementById('modalPagarTitle').innerText = 'Editar Conta a Pagar';
    abrirModal('modalPagar');
}

function editarReceber(id) {
    let item = dbReceber.find(x => String(x.id) === String(id));
    if (!item) return;

    document.getElementById('receberId').value = item.id;
    document.getElementById('receberCliente').value = item.cliente || '';
    document.getElementById('receberDesc').value = item.desc || item.descricao || '';
    document.getElementById('receberValor').value = item.valor || 0;
    document.getElementById('receberVenc').value = item.venc || item.vencimento || '';
    document.getElementById('receberStatus').value = item.status || 'PENDENTE';
    document.getElementById('receberCC').value = item.cc || item.categoria || 'SERVIÇOS';

    document.getElementById('modalReceberTitle').innerText = 'Editar Conta a Receber';
    abrirModal('modalReceber');
}
