# Controle de KM — Guia rápido

Aplicação web responsiva (funciona em celular, tablet e computador) para
registrar KM diário e abastecimentos, conectada direto ao Supabase.

## 1. Crie o projeto no Supabase
1. Acesse https://supabase.com e crie um projeto gratuito.
2. Vá em **SQL Editor** e execute o conteúdo do arquivo `schema.sql`
   (cria as tabelas `kmdiario` e `abastecimento`, as permissões corretas
   e o bucket de armazenamento `abastecimento-imagens` usado para as
   fotos anexadas no abastecimento).
   - Se você já tinha uma tabela `abastecimento` de uma versão anterior
     (com campos como litros/valor/km/posto), apague-a antes
     (`drop table if exists public.abastecimento;`) e rode o script de
     novo, pois os campos mudaram.
3. Vá em **Project Settings → API** e copie:
   - **Project URL**
   - **anon public key**

## 2. Configure o app
1. Abra `menu.html` no navegador (ou hospede os arquivos em qualquer
   servidor estático — Netlify, Vercel, GitHub Pages, etc.).
2. Na primeira vez ele vai te levar para **Configurações**.
3. Cole a URL e a chave anon do Supabase e clique em **Salvar conexão**.
4. Pronto — os dados ficam salvos no navegador (localStorage) e o app
   já consegue ler e gravar no seu banco.

## 3. Estrutura dos arquivos
- `menu.html` — tela inicial com KM total do mês, litros e quantidade de
  abastecimentos do mês, e os 4 botões de navegação.
- `kmdiario.html` — formulário de KM diário (data, km início, km final,
  km total automático, placa, rota, observações) + lista dos registros
  do mês com opções de editar e excluir.
- `abastecimento.html` — formulário de abastecimento (data, motorista,
  placa, carro, diesel em litros, ARLA em litros e até 4 imagens
  anexadas) + lista dos registros do mês com miniaturas das fotos e
  opções de editar e excluir. As imagens ficam armazenadas no bucket
  `abastecimento-imagens` do Supabase Storage.
- `configuracoes.html` — tela para conectar/trocar o projeto Supabase.
- `style.css` — visual responsivo compartilhado por todas as páginas.
- `supabase-config.js` — funções de conexão e utilitários de data
  usados em todas as páginas.
- `schema.sql` — script para criar as tabelas no Supabase.

## 4. Sobre o "Sair"
Como o app não usa login de usuário (só a chave anon do Supabase), o
botão **Sair** desconecta o dispositivo do banco configurado (apaga a
URL/chave salvas localmente) e volta para a tela de Configurações.
Se no futuro você quiser autenticação real de usuários (Supabase Auth,
e-mail/senha ou Google), me avise — dá para adicionar sem mudar a
estrutura do banco.

## 5. Por que não usei Python?
O Supabase já fornece um SDK JavaScript que conversa diretamente com o
banco de dados (com Row Level Security garantindo a segurança), então
não é necessário um backend Python no meio para esse tipo de app. Isso
deixa a aplicação mais simples de hospedar (basta um servidor estático)
e mais rápida no celular. Se você tiver uma razão específica para
precisar de um backend em Python (por exemplo, regras de negócio
complexas, integrações externas, jobs agendados), posso montar uma API
em Flask/FastAPI e ajustar o front-end para conversar com ela.

## 6. Testando localmente
Como os navegadores bloqueiam alguns recursos ao abrir arquivos HTML
direto do disco, o ideal é servir a pasta com um servidor simples:

```bash
cd pasta-do-app
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000/menu.html` no navegador do
computador ou do celular (na mesma rede Wi-Fi).
