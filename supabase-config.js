// ============================================================
// Conexão com o Supabase
// A URL e a chave (anon key) são salvas no localStorage do
// navegador através da tela "Configurações" (configuracoes.html).
// Assim você não precisa editar código para usar o app.
// ============================================================

function getSupabaseCredenciais() {
  return {
    url: normalizarUrlSupabase(localStorage.getItem('supabase_url') || ''),
    key: localStorage.getItem('supabase_key') || ''
  };
}

// Aceita que o usuário cole a URL com /rest/v1, barra no final, etc.
// e devolve sempre só "https://xxxx.supabase.co", que é o formato
// que o supabase-js espera (ele mesmo adiciona /rest/v1 depois).
function normalizarUrlSupabase(urlBruta) {
  if (!urlBruta) return '';
  try {
    const u = new URL(urlBruta.trim());
    return `${u.protocol}//${u.host}`;
  } catch (e) {
    return urlBruta.trim().replace(/\/+$/, '');
  }
}

function criarClienteSupabase() {
  const { url, key } = getSupabaseCredenciais();
  if (!url || !key) {
    return null;
  }
  return supabase.createClient(url, key);
}

// Garante que existe configuração antes de usar a página.
// Se não existir, manda o usuário para a tela de configurações.
function exigirConfiguracaoSupabase() {
  const { url, key } = getSupabaseCredenciais();
  if (!url || !key) {
    alert('Configure a conexão com o Supabase antes de usar o aplicativo.');
    window.location.href = 'configuracoes.html';
    return null;
  }
  return criarClienteSupabase();
}

// ============================================================
// Sessão do motorista logado (guardada no localStorage após o
// login validar usuário/senha na tabela motoristas do Supabase)
// ============================================================

function getMotoristaLogado() {
  const bruto = localStorage.getItem('motorista_logado');
  if (!bruto) return null;
  try {
    return JSON.parse(bruto);
  } catch (e) {
    return null;
  }
}

function salvarMotoristaLogado(motorista) {
  localStorage.setItem('motorista_logado', JSON.stringify(motorista));
}

function encerrarSessaoMotorista() {
  localStorage.removeItem('motorista_logado');
}

// Garante que existe um motorista logado antes de usar a página.
// Se não existir, manda para a tela de login.
function exigirLogin() {
  const motorista = getMotoristaLogado();
  if (!motorista) {
    window.location.href = 'login.html';
    return null;
  }
  return motorista;
}

// Helpers de data (mês atual em formato YYYY-MM-DD)
function primeiroDiaMesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function ultimoDiaMesAtual() {
  const d = new Date();
  const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${ultimo.getFullYear()}-${String(ultimo.getMonth() + 1).padStart(2, '0')}-${String(ultimo.getDate()).padStart(2, '0')}`;
}

function formatarDataBR(dataISO) {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

function formatarNumero(valor, casas = 1) {
  const n = Number(valor);
  if (isNaN(n)) return '0';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}
