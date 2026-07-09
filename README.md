# Controle de KM — Guia rápido

https://ssleonardo2018.github.io/frota/

Aplicação web responsiva (funciona em celular, tablet e computador) para
registrar KM diário e abastecimentos, conectada direto ao Supabase.

## 1. Crie o projeto no Supabase
1. Acesse https://supabase.com e crie um projeto gratuito.
2. Vá em **SQL Editor** e execute o conteúdo do arquivo `schema.sql`
   (cria as tabelas `motoristas`, `kmdiario` e `abastecimento`, a
   função de login, as permissões corretas e o bucket de
   armazenamento `abastecimento-imagens` usado para as fotos
   anexadas no abastecimento).
   - Se você já tinha uma tabela `abastecimento` de uma versão anterior
     (com campos como litros/valor/km/posto), apague-a antes
     (`drop table if exists public.abastecimento;`) e rode o script de
     novo, pois os campos mudaram.
   - Se você já tinha `kmdiario`/`abastecimento` da versão sem login,
     não precisa apagar nada: o script adiciona a coluna
     `motorista_id` automaticamente nas tabelas existentes.
3. Vá em **Project Settings → API** e copie:
   - **Project URL**
   - **anon public key**

## 2. Cadastre os motoristas
Ainda não existe uma tela de cadastro de motorista no app (só a de
login). Para cadastrar cada motorista, rode um comando destes no
**SQL Editor** do Supabase — troque nome, celular, turno, usuário e
senha:

```sql
insert into public.motoristas (nome, celular, turno, login, senha_hash)
values ('João Silva', '(21) 99999-9999', 'Manhã', 'joao',
        crypt('senha123', gen_salt('bf')));
```

A senha nunca fica salva em texto puro — ela é armazenada com hash
(`crypt`/bcrypt) e comparada de forma seguraatravés de uma função no
banco (`autenticar_motorista`), que é a única forma de ler a tabela
`motoristas` pelo app.

## 3. Configure o app
1. Abra `login.html` no navegador (ou hospede os arquivos em qualquer
   servidor estático — Netlify, Vercel, GitHub Pages, etc.).
2. Na primeira vez ele vai te levar para **Configurações**.
3. Cole a URL e a chave anon do Supabase e clique em **Salvar conexão**.
4. Você será levado para a tela de **Login** — entre com o usuário e
   senha de um motorista já cadastrado no passo 2.
5. Pronto — cada motorista só vê e cadastra os próprios registros de
   KM diário e abastecimento.

## 4. Estrutura dos arquivos
- `login.html` — tela de login: valida usuário e senha contra a
  tabela `motoristas` e guarda a sessão no navegador.
- `menu.html` — tela inicial com KM total do mês, litros e quantidade
  de abastecimentos do mês **do motorista logado**, e os 4 botões de
  navegação.
- `kmdiario.html` — formulário de KM diário (data, km início, km final,
  km total automático, placa, rota, observações) + lista dos registros
  do mês **do motorista logado**, com opções de editar e excluir.
- `abastecimento.html` — formulário de abastecimento (data, motorista
  preenchido automaticamente pela sessão, placa, carro, diesel em
  litros, ARLA em litros e até 4 imagens anexadas) + lista dos
  registros do mês **do motorista logado**, com miniaturas das fotos e
  opções de editar e excluir. As imagens ficam armazenadas no bucket
  `abastecimento-imagens` do Supabase Storage.
- `configuracoes.html` — tela para conectar/trocar o projeto Supabase.
- `style.css` — visual responsivo compartilhado por todas as páginas.
- `supabase-config.js` — funções de conexão, sessão do motorista
  (login/logout) e utilitários de data usados em todas as páginas.
- `schema.sql` — script para criar as tabelas, a função de login e o
  bucket de imagens no Supabase.

## 5. Sobre login e o botão "Sair"
Cada motorista tem seu próprio usuário e senha (tabela `motoristas`).
Ao entrar, o app guarda a sessão no navegador e passa a filtrar todos
os registros de KM diário e abastecimento pelo `motorista_id` do
usuário logado — ou seja, cada um só vê e edita os próprios dados.

O botão **Sair** no menu encerra a sessão do motorista e volta para a
tela de login (não apaga a conexão com o Supabase). Se precisar trocar
de projeto Supabase neste dispositivo, use o botão **Desconectar deste
projeto** na tela de Configurações.

⚠️ **Sobre segurança:** como o app usa a chave `anon` do Supabase
direto no navegador (sem o Supabase Auth nativo), a separação por
motorista é garantida pelo código do app e pela função de login
protegida — mas a chave anon, por padrão, ainda pode ler/gravar nas
tabelas `kmdiario` e `abastecimento` de qualquer motorista caso
alguém monte requisições manuais para a API. Para um controle mais
rígido a nível de banco (impedir isso mesmo com acesso à chave anon),
o próximo passo seria migrar para o Supabase Auth nativo e usar
`auth.uid()` nas policies de RLS — posso te ajudar com isso se quiser
reforçar a segurança mais adiante.

## 6. Por que não usei Python?
O Supabase já fornece um SDK JavaScript que conversa diretamente com o
banco de dados (com Row Level Security garantindo a segurança), então
não é necessário um backend Python no meio para esse tipo de app. Isso
deixa a aplicação mais simples de hospedar (basta um servidor estático)
e mais rápida no celular. Se você tiver uma razão específica para
precisar de um backend em Python (por exemplo, regras de negócio
complexas, integrações externas, jobs agendados), posso montar uma API
em Flask/FastAPI e ajustar o front-end para conversar com ela.

## 7. Testando localmente
Como os navegadores bloqueiam alguns recursos ao abrir arquivos HTML
direto do disco, o ideal é servir a pasta com um servidor simples:

```bash
cd pasta-do-app
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000/menu.html` no navegador do
computador ou do celular (na mesma rede Wi-Fi).
