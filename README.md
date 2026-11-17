# Orquestra Evangélica de Curitiba — Portal Web (GitHub Pages + Supabase)

Portal oficial da **Orquestra Evangélica de Curitiba** preparado para hospedagem gratuita no **GitHub Pages** com autenticação, banco de dados e armazenamento privado de partituras no **Supabase**.

## Funcionalidades

- **Audição Pública do Repertório:** Qualquer visitante pode ouvir as obras da temporada e filtrar por categoria.
- **Inscrição de Músicos:** Formulário completo com instrumento, naipe, igreja de origem, tempo de experiência e criação de conta (`access_status = 'pending'`).
- **Acervo Privado de Partituras (PDF):** Organizado por naipe (`Cordas`, `Madeiras`, `Metais`, `Percussão & Base`) e por instrumento. Os PDFs no bucket privado `partituras` são protegidos por **Row Level Security (RLS)** no Supabase e só ficam acessíveis para participantes cujo cadastro foi aprovado pela coordenação (`access_status = 'approved'`).
- **Painel da Coordenação:** Permite aprovar ou suspender músicos inscritos e enviar novas partituras em PDF diretamente para o Supabase Storage.

---

## Como configurar o Supabase

1. Acesse [supabase.com](https://supabase.com), crie sua organização e um novo projeto.
2. No menu lateral, abra **SQL Editor** → **New query**.
3. Cole todo o conteúdo do arquivo [`supabase/schema.sql`](./supabase/schema.sql) e clique em **Run**.
4. Em **Project Settings → API**, copie:
   - **Project URL** (`VITE_SUPABASE_URL`)
   - **anon / public key** (`VITE_SUPABASE_ANON_KEY`)
5. Faça o primeiro cadastro no site usando o e-mail da coordenação (`orquestraevangelicadecuritiba@gmail.com`) e execute no SQL Editor:

```sql
update public.profiles
set role = 'admin', access_status = 'approved'
where email = 'orquestraevangelicadecuritiba@gmail.com';
```

---

## Como publicar no GitHub Pages

1. Envie este projeto para um repositório na sua conta **`orquestraevangelicadecuritiba-gif`** (branch `main`).
2. No GitHub, abra **Settings → Pages** e em **Build and deployment → Source**, selecione **GitHub Actions**.
3. Vá em **Settings → Secrets and variables → Actions**:
   - Na aba **Variables**, crie `VITE_SUPABASE_URL` com a URL do seu projeto Supabase.
   - Na aba **Secrets**, crie `VITE_SUPABASE_ANON_KEY` com a chave `anon` pública do Supabase.
4. O workflow em [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) compilará automaticamente o site (`npm run build`) e publicará no GitHub Pages a cada push na branch `main`.
