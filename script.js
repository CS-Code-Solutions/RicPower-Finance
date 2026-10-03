// --- ATUALIZAÇÃO DO STATUS AUTOMÁTICO DE ATRASO E TABELAS ---

// Função auxiliar para verificar se uma data venceu
function verificarSeAtrasou(dataVenc, statusAtual) {
    if (statusAtual === 'PAGO') return 'PAGO';
    if (!dataVenc) return statusAtual || 'PENDENTE';

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zera o horário para comparar apenas a data

    const venc = new Date(dataVenc + 'T00:00:00');

    if (venc < hoje) {
        return 'ATRASADO';
    }
    return 'PENDENTE';
}

// Subtitua ou atualize a renderTabelas no seu script.js
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
