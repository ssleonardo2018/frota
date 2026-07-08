const form = document.getElementById('formKm');
const tabelaCorpo = document.getElementById('tabelaCorpo');
const kmInicio = document.getElementById('kmInicio');
const kmFinal = document.getElementById('kmFinal');
const kmTotal = document.getElementById('kmTotal');

// Cálculo automático do KM Total
function calcularTotal() {
    const inicio = parseFloat(kmInicio.value) || 0;
    const fim = parseFloat(kmFinal.value) || 0;
    if (fim >= inicio) {
        kmTotal.value = fim - inicio;
    } else {
        kmTotal.value = 0;
    }
}
kmInicio.addEventListener('input', calcularTotal);
kmFinal.addEventListener('input', calcularTotal);

// Buscar e listar dados cadastrados vindos direto do Supabase
async function buscarRegistros() {
    const { data: registros, error } = await supabaseClient
        .from('registros_km')
        .select('*')
        .order('data', { ascending: false });

    if (error) {
        console.error("Erro ao buscar dados do Supabase:", error);
        return;
    }

    tabelaCorpo.innerHTML = registros.map(reg => {
        // Formata a data para o padrão brasileiro (DD/MM/AAAA) para exibição na tela
        const dataFormatada = reg.data.split('-').reverse().join('/');
        
        // Protege o objeto contra aspas que quebram o HTML do botão editar
        const regString = JSON.stringify(reg).replace(/"/g, '&quot;');
        
        return `
            <tr>
                <td><b>${dataFormatada}</b></td>
                <td>${reg.placa}</td>
                <td>${reg.km_inicio}</td>
                <td>${reg.km_final}</td>
                <td>${reg.km_total}</td>
                <td>${reg.rota}</td>
                <td>${reg.obs || '-'}</td>
                <td>
                    <button class="btn-editar" onclick="carregarParaEditar(${regString})">Editar</button>
                    <button class="btn-excluir" onclick="excluirRegistro(${reg.id})">Excluir</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Salvar ou Atualizar Registro no Supabase
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('idRegistro').value;
    const dados = {
        data: document.getElementById('data').value,
        placa: document.getElementById('placa').value.toUpperCase(),
        km_inicio: parseFloat(kmInicio.value),
        km_final: parseFloat(kmFinal.value),
        km_total: parseFloat(kmTotal.value),
        rota: document.getElementById('rota').value,
        obs: document.getElementById('obs').value
    };

    try {
        if (id) {
            // Se tem ID cadastrado no input oculto, atualiza o registro existente (Equivalente ao PUT)
            const { error } = await supabaseClient
                .from('registros_km')
                .update(dados)
                .eq('id', id);

            if (error) throw error;
            alert('Registro atualizado com sucesso!');
        } else {
            // Se não tem ID, insere um novo registro (Equivalente ao POST)
            const { error } = await supabaseClient
                .from('registros_km')
                .insert([dados]);

            if (error) throw error;
            alert('Registro salvo com sucesso!');
        }

        // Reseta o formulário e volta os botões ao estado padrão
        cancelarEdicao();
        // Atualiza a tabela na tela
        buscarRegistros();

    } catch (erro) {
        console.error("Erro na operação com o Supabase:", erro);
        alert('Ocorreu um erro ao processar a operação no banco de dados.');
    }
});

// Coloca os dados da linha de volta no formulário para edição
function carregarParaEditar(reg) {
    document.getElementById('btnSalvar').innerText = "Atualizar Registro";
    document.getElementById('btnSalvar').style.background = "#ffc107";
    document.getElementById('btnSalvar').style.color = "#000";

    document.getElementById('idRegistro').value = reg.id;
    document.getElementById('data').value = reg.data;
    document.getElementById('placa').value = reg.placa;
    document.getElementById('kmInicio').value = reg.km_inicio;
    document.getElementById('kmFinal').value = reg.km_final;
    document.getElementById('kmTotal').value = reg.km_total;
    document.getElementById('rota').value = reg.rota;
    document.getElementById('obs').value = reg.obs;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Função auxiliar para limpar e redefinir o formulário
function cancelarEdicao() {
    form.reset();
    document.getElementById('idRegistro').value = '';
    document.getElementById('btnSalvar').innerText = "Salvar Registro";
    document.getElementById('btnSalvar').style.background = "#28a745";
    document.getElementById('btnSalvar').style.color = "white";
}

// Excluir registro do Supabase
async function excluirRegistro(id) {
    const confirmou = confirm('Tem certeza absoluta de que deseja excluir este registro de KM?');
    
    if (confirmou) {
        try {
            const { error } = await supabaseClient
                .from('registros_km')
                .delete()
                .eq('id', id);

            if (error) throw error;

            alert('Registro excluído com sucesso!');
            if (document.getElementById('idRegistro').value == id) {
                cancelarEdicao();
            }
            buscarRegistros();
        } catch (erro) {
            console.error("Erro ao excluir do Supabase:", erro);
            alert('Não foi possível excluir o registro.');
        }
    }
}

// Funções do Modal de Impressão
function abrirModalImpressao() {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');
    document.getElementById('modalMesAno').value = `${anoAtual}-${mesAtual}`;
    document.getElementById('modalImpressao').style.display = 'flex';
}

function fecharModalImpressao() {
    document.getElementById('modalImpressao').style.display = 'none';
}

// Dispara a impressão coletando as informações do Modal e os dados do Supabase
async function confirmarEImprimir() {
    const motorista = document.getElementById('modalMotorista').value || "______________________________________";
    const turno = document.getElementById('modalTurno').value || "____________________";
    const campoMesAno = document.getElementById('modalMesAno').value;

    if (!campoMesAno) {
        alert("Por favor, selecione um Mês/Ano para a planilha.");
        return;
    }

    const [ano, mes] = campoMesAno.split('-').map(Number);
    fecharModalImpressao();

    // Busca os registros atualizados do Supabase para montar o relatório impresso
    const { data: registros, error } = await supabaseClient
        .from('registros_km')
        .select('*');

    if (error) {
        console.error("Erro ao carregar dados para impressão:", error);
        alert("Não foi possível carregar os dados para gerar a planilha.");
        return;
    }

    const totalDiasNoMes = new Date(ano, mes, 0).getDate();
    const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const nomeMesSelecionado = nomesMeses[mes - 1];
    
    let tabelaHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Imprimir Planilha Mensal</title>
            <style>
                @page { size: A4 portrait; margin: 10mm; }
                body { font-family: sans-serif; margin: 0; padding: 0; background: #fff; }
                .cabecalho-impressao { width: 100%; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 8px; }
                .titulo-sistema { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 10px; }
                .linha-campos { display: flex; flex-direction: row; justify-content: space-between; width: 100%; }
                .campo-info { font-size: 12px; color: #000; }
                table { width: 100%; border-collapse: collapse; table-layout: fixed; }
                th, td { border: 1px solid #000; padding: 4px 5px; font-size: 11px; color: #000; vertical-align: middle; }
                th { background-color: #f2f2f2; font-weight: bold; text-transform: uppercase; }
            </style>
        </head>
        <body>
            <div class="cabecalho-impressao">
                <div class="titulo-sistema">CONTROLE DE KM DIÁRIO</div>
                <div class="linha-campos">
                    <div class="campo-info" style="width: 50%;"><b>Motorista:</b> ${motorista}</div>
                    <div class="campo-info" style="width: 25%;"><b>Turno:</b> ${turno}</div>
                    <div class="campo-info" style="width: 25%; text-align: right;"><b>Mês/Ano:</b> ${nomeMesSelecionado} / ${ano}</div>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 12%;">Data</th>
                        <th style="width: 12%;">Placa</th>
                        <th style="width: 12%;">KM Inicial</th>
                        <th style="width: 12%;">KM Final</th>
                        <th style="width: 12%;">KM Total</th>
                        <th style="width: 20%;">Rota</th>
                        <th style="width: 18%;">Observações</th>
                    </tr>
                </thead>
                <tbody>
    `;

    for (let dia = 1; dia <= totalDiasNoMes; dia++) {
        const diaFormatado = String(dia).padStart(2, '0');
        const mesFormatado = String(mes).padStart(2, '0');
        const dataChave = `${ano}-${mesFormatado}-${diaFormatado}`;
        const dataExibicao = `${diaFormatado}/${mesFormatado}/${ano}`;

        const registroDoDia = registros.find(reg => reg.data === dataChave);

        if (registroDoDia) {
            tabelaHtml += `
                <tr>
                    <td><b>${dataExibicao}</b></td>

                    <td>${registroDoDia.placa}</td>
                    <td>${registroDoDia.km_inicio}</td>
                    <td>${registroDoDia.km_final}</td>
                    <td>${registroDoDia.km_total}</td>
                    <td>${registroDoDia.rota}</td>
                    <td>${registroDoDia.obs || ''}</td>
                </tr>
            `;
        } else {
            tabelaHtml += `
                <tr>
                    <td><b>${dataExibicao}</b></td>
                    <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
                </tr>
            `;
        }
    }

    tabelaHtml += `
                </tbody>
            </table>
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                }
            <\/script>
        </body>
        </html>
    `;

    // 6. Envia o código pronto direto para a janela temporária de impressão
    const janelaImpressao = window.open('', '_blank', 'width=800,height=600');
    janelaImpressao.document.open();
    janelaImpressao.document.write(tabelaHtml);
    janelaImpressao.document.close();
}








// ETAPA 1: Coloca os dados da linha selecionada de volta no formulário
function carregarParaEditar(reg) {
    // Altera o texto do botão de salvar para indicar modo de edição
    document.getElementById('btnSalvar').innerText = "Atualizar Registro";
    document.getElementById('btnSalvar').style.background = "#ffc107";
    document.getElementById('btnSalvar').style.color = "#000";

    // Preenche os campos do formulário com os valores antigos
    document.getElementById('idRegistro').value = reg.id;
    document.getElementById('data').value = reg.data;
    document.getElementById('placa').value = reg.placa;
    document.getElementById('kmInicio').value = reg.km_inicio;
    document.getElementById('kmFinal').value = reg.km_final;
    document.getElementById('kmTotal').value = reg.km_total;
    document.getElementById('rota').value = reg.rota;
    document.getElementById('obs').value = reg.obs;
    
    // Leva a tela do usuário de volta para o topo (foco no formulário)
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ETAPA 2: Modifique o seu ouvinte de envio do formulário (form.addEventListener)
// Garanta que ele trate tanto a criação (POST) quanto a atualização (PUT)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('idRegistro').value;
    const dados = {
        data: document.getElementById('data').value,
        placa: document.getElementById('placa').value.toUpperCase(),
        km_inicio: parseFloat(kmInicio.value),
        km_final: parseFloat(kmFinal.value),
        km_total: parseFloat(kmTotal.value),
        rota: document.getElementById('rota').value,
        obs: document.getElementById('obs').value
    };

    try {
        if (id) {
            // Se possui ID cadastrado no input oculto, atualiza o registro existente
            const res = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
            if (!res.ok) throw new Error('Erro ao atualizar');
            alert('Registro atualizado com sucesso!');
        } else {
            // Se não possui ID cadastrado, cria um novo registro do zero
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
            if (!res.ok) throw new Error('Erro ao salvar');
            alert('Registro salvo com sucesso!');
        }

        // Reseta o formulário e volta o botão para o estado padrão de salvar
        cancelarEdicao();
        // Atualiza a tabela na tela
    
        
    } catch (erro) {
        console.error(erro);
        alert('Ocorreu um erro ao processar a operação.');
    }
});

// Função auxiliar para resetar o formulário após salvar ou cancelar
function cancelarEdicao() {
    form.reset();
    document.getElementById('idRegistro').value = '';
    document.getElementById('btnSalvar').innerText = "Salvar Registro";
    document.getElementById('btnSalvar').style.background = "#28a745";
    document.getElementById('btnSalvar').style.color = "white";
}



// Função para Excluir um registro de KM do banco de dados
async function excluirRegistro(id) {
    // Exibe um alerta de confirmação na tela do usuário
    const confirmou = confirm('Tem certeza absoluta de que deseja excluir este registro de KM?');
    
    if (confirmou) {
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                alert('Registro excluído com sucesso!');
                // Se o usuário estava editando o registro que acabou de excluir, limpa o formulário
                if (document.getElementById('idRegistro').value == id) {
                    cancelarEdicao();
                }
                // Recarrega a listagem atualizada na tela
                buscarRegistros();
            } else {
                throw new Error('Falha na exclusão');
            }
        } catch (erro) {
            console.error(erro);
            alert('Não foi possível excluir o registro do banco de dados.');
        }
    }
}


// Executa a busca de registros assim que todo o HTML da página estiver pronto e carregado
document.addEventListener('DOMContentLoaded', () => {
    buscarRegistros();
});
