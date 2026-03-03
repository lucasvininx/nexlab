# NEXLab - Photo Activation Platform

Plataforma web para ativação de fotos em kiosks, com fluxo de login, captura fotográfica, revisão e geração de QR codes para download.

## Funcionalidades Principais

- **Login Seguro**: Autenticação com Supabase (email/password)
- **Fluxo Promoter**: Interface de ativação em kiosk (9:16 aspect ratio)
  - Captura de foto com câmera
  - Preview e revisão de foto
  - Geração de QR code para download
  - **Logout**: Botão para sair da sessão
- **Painel Admin**: Dashboard para gestão (acesso restrito)
- **Download de Fotos**: Link seguro com ID único
- **Proteção de Rotas**: Controle de acesso por papel (promoter vs admin)

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **pnpm** v9+ (`npm install -g pnpm`)
- **Git** ([Download](https://git-scm.com/))

## Instalação Local

### 1. Clone o Repositório

```bash
git clone <seu-repositorio>
cd nexlab
```

### 2. Instale as Dependências

```bash
pnpm install
```

### 3. Configure as Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=<sua_url_supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua_anon_key>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<sua_publishable_key>

# Vercel Blob (para upload de fotos)
BLOB_READ_WRITE_TOKEN=<seu_token_blob>

# Database (Opcional para desenvolvimento local)
POSTGRES_URL=<sua_postgres_url>
POSTGRES_PRISMA_URL=<sua_prisma_url>

# Supabase Service Role (Opcional)
SUPABASE_SERVICE_ROLE_KEY=<sua_service_role_key>
SUPABASE_JWT_SECRET=<seu_jwt_secret>
```

> **Nota**: As variáveis `NEXT_PUBLIC_*` são públicas (seguras de expor). As demais são privadas e nunca devem ser compartilhadas.

### 4. Defina as Variáveis de Tema (Opcional)

Adicione ao seu CSS global (`app/globals.css`) ou crie um arquivo de configuração:

```css
:root {
  --kiosk-bg: #ffffff; /* Cor de fundo do kiosk */
}
```

## Rodando o Projeto

### Modo Desenvolvimento

```bash
pnpm dev
```

O projeto estará disponível em: **http://localhost:3000**

### Build para Produção

```bash
pnpm build
pnpm start
```

### Linting

```bash
pnpm lint
```

## Estrutura do Projeto

```
nexlab/
├── app/                          # Aplicação Next.js
│   ├── actions/
│   │   ├── auth.ts              # Login e logout
│   │   └── photos.ts            # Upload de fotos
│   ├── activation/              # Fluxo promoter
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── admin/                   # Dashboard admin
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── download/                # Download de fotos
│   ├── login/                   # Página de login
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/                   # Componentes React
│   ├── activation/
│   │   └── ActivationClient.tsx # Componente principal do kiosk
│   ├── admin/
│   ├── ui/                      # Componentes Radix UI
│   └── theme-provider.tsx
├── lib/
│   ├── supabase/               # Cliente Supabase
│   │   ├── client.ts           # Cliente para componentes
│   │   ├── server.ts           # Cliente para server actions
│   │   └── middleware.ts       # Middleware de autenticação
│   └── utils.ts
├── hooks/                       # Custom React hooks
├── public/                      # Assets estáticos
├── scripts/
│   └── 001_schema.sql          # Schema do banco de dados
├── middleware.ts                # Middleware Next.js
├── next.config.mjs              # Configuração Next.js
├── tsconfig.json
├── package.json
└── README.md
```

## Fluxo de Autenticação

### Login (Promoter)
1. Usuário acessa `/login`
2. Insere email e senha
3. Supabase valida credenciais
4. Se `is_admin = false`: Redireciona para `/activation`
5. Se `is_admin = true`: Redireciona para `/admin`

### Logout
1. Clica no botão "Logout" (canto superior direito)
2. `logoutAction()` executa `supabase.auth.signOut()`
3. Sessão é invalidada (cookies limpos)
4. Redireciona para `/login`
5. Browser back button não permite retornar

### Proteção de Rotas
- **Middleware** (`lib/supabase/middleware.ts`):
  - Sem autenticação: Redireciona para `/login`
  - Promoter em `/admin`: Redireciona para `/activation`
  - Admin em `/activation`: Redireciona para `/admin`
  - Logado em `/login`: Redireciona para rota apropriada

## Fluxo de Ativação (Promoter)

```
Tela Inicial
    ↓
[Clica Start] → Solicita acesso à câmera
    ↓
Visualização Câmera
    ↓
[Clica botão redondo] → Inicia contagem regressiva (3s)
    ↓
Captura Automática → Aplica frame overlay
    ↓
Review da Foto
    ↓
[Clica "Approve"] → Upload para Vercel Blob → Gera QR code
    ↓
Tela QR Code
    ↓
Auto-reset após 15s → Volta à tela inicial
```

## Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `pnpm dev` | Inicia servidor de desenvolvimento |
| `pnpm build` | Build para produção |
| `pnpm start` | Inicia servidor de produção |
| `pnpm lint` | Executa linter (ESLint) |

## Endpoints Principais

| Rota | Tipo | Descrição |
|------|------|-----------|
| `/login` | GET/POST | Página de login |
| `/activation` | GET | Fluxo de ativação (promoter) |
| `/admin` | GET | Dashboard admin |
| `/download/[id]` | GET | Download de foto |
| `/api/auth/logout` | POST | Logout (server action) |

## Variáveis de Ambiente Necessárias

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`: URL da instância Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima (pública)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Chave publicável
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de role de serviço (privada)
- `SUPABASE_JWT_SECRET`: Secret JWT para validação de tokens

### Vercel Blob
- `BLOB_READ_WRITE_TOKEN`: Token para upload de fotos

### Database (Opcional)
- `POSTGRES_URL`: URL completa do PostgreSQL
- `POSTGRES_PRISMA_URL`: URL otimizada para Prisma
- `POSTGRES_USER`: Usuário do banco
- `POSTGRES_PASSWORD`: Senha do banco

## Desenvolvimento

### Adicionar Novo Componente

```bash
# Criar componente em components/
# Usar Radix UI + Tailwind CSS
# Garantir acessibilidade (ARIA labels, semantic HTML)
```

### Adicionar Nova Rota

```bash
# 1. Criar pasta em app/[nome]/
# 2. Criar layout.tsx (com proteção de autenticação se necessário)
# 3. Criar page.tsx (conteúdo)
```

### Adicionar Server Action

```bash
# 1. Criar/atualizar arquivo em app/actions/
# 2. Marcar como 'use server'
# 3. Importar clients Supabase conforme necessário
```

## Segurança

- Server Actions (`'use server'`) para operações sensíveis
- Middleware para proteção de rotas
- Supabase Auth para autenticação segura
- Tokens JWT com expiração
- Validação de papéis (admin vs promoter)
- Logout com invalidação completa de sessão

## Troubleshooting

### Erro: "Camera access denied"
- Verifique permissões do navegador
- Use HTTPS em produção (camera requer contexto seguro)
- Teste em localhost primeiro

### Erro: "Supabase connection failed"
- Verifique variáveis de ambiente em `.env.local`
- Confirme que a instância Supabase está ativa
- Teste conexão com Supabase CLI:
  ```bash
  supabase status
  ```

### Erro: "Module not found"
```bash
# Limpe cache e reinstale
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Build falhando
```bash
# Reconstrua o projeto
pnpm build --no-cache
```

## Teste em Dispositivo Mobile

```bash
# Inicie o dev server com acesso de rede
pnpm dev -- -H 0.0.0.0

# Acesse em seu dispositivo via: http://<seu-ip>:3000
```

## Deploy

### Vercel (Recomendado)

```bash
# 1. Push para GitHub
git push origin main

# 2. Acesse https://vercel.com
# 3. Importe projeto
# 4. Configure variáveis de ambiente
# 5. Deploy automático
```

### Outros Hosts
- Railway
- Render
- Heroku
- DigitalOcean App Platform

## Documentação Adicional

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)

## Licença

Privado - NEXLab

## Suporte

Para dúvidas ou problemas, abra uma issue ou entre em contato com o time de desenvolvimento.
