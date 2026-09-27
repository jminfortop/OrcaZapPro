# OrçaZAP Pro

Projeto modularizado a partir do `index3.html`, com:

- aplicativo da empresa em `public/app.html`;
- CSS separado em `public/css/app.css`;
- lógica principal em `public/js/app.js`;
- login Supabase em `public/login.html`;
- painel administrativo em `public/admin.html`;
- página pública em `public/public-quote.html`;
- Netlify Functions para criação de empresas, links públicos, visualização, aprovação, recusa e assinatura;
- schema e políticas RLS em `supabase/migrations`.

## Configuração

1. Crie um projeto no Supabase.
2. Execute `supabase/migrations/001_schema.sql` no SQL Editor.
3. Execute `supabase/migrations/002_rls.sql`.
4. Crie manualmente o primeiro usuário admin no Supabase Auth.
5. Insira o perfil desse usuário:

```sql
insert into public.profiles(id, role, name, active) values ('UUID_DO_USUARIO', 'admin', 'Administrador', true);
```

6. No Netlify, configure:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

7. Faça deploy pelo GitHub.

`SUPABASE_SERVICE_ROLE_KEY` deve ser usada apenas pelas Netlify Functions. Nunca publique essa chave no frontend.

## Desenvolvimento pelo Android

Abra o repositório no GitHub Codespaces e execute:

```bash
npm install
npm run check
npm run dev
```

O modo sem configuração Supabase continua usando o `localStorage` do protótipo para permitir desenvolvimento visual. Com as variáveis configuradas, o login é obrigatório e o carregamento inicial usa o Supabase.

## Limitação importante do MVP

O sincronismo atual grava os dados principais e mantém a UI antiga compatível. Antes de uso comercial, é recomendável trocar o salvamento integral por operações específicas (criar/editar/excluir cada registro), adicionar paginação, validação completa, upload de logos e backups externos.
