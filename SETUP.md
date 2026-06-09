# Setup — Vôlei System

## 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto gratuito
2. Vá em **Settings → API** e copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Configurar variáveis de ambiente

Edite o arquivo `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Criar as tabelas no banco

No Supabase, vá em **SQL Editor** e execute o conteúdo de:

```
supabase/migrations/001_initial.sql
```

## 4. Configurar autenticação (OTP por e-mail)

1. No Supabase, vá em **Authentication → Providers**
2. Certifique-se que **Email** está habilitado
3. Em **Email Templates**, o template de OTP já vem configurado por padrão

## 5. Rodar localmente

```bash
# Instalar dependências (use Node.js >= 20)
npm install

# Rodar em desenvolvimento
npm run dev
```

Acesse http://localhost:3000

## 6. Deploy no Vercel

1. Push o código para GitHub
2. Importe o repositório no [Vercel](https://vercel.com)
3. Adicione as variáveis de ambiente no painel do Vercel
4. Deploy automático a cada push

## Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| Login | E-mail com código OTP (sem senha) |
| Criar vôlei | Data, horário, local, quadra, duração, limite, valor, chave PIX |
| Lista de jogos | Tabs: ativos / encerrados |
| Participar | Colocar/retirar nome da lista (com janela de horário) |
| Lista de espera | Automática quando jogo lotado — promoção automática ao sair |
| Pagamento | Exibe chave PIX + valor por pessoa + confirmação |
| Encerrar | Organizador confirma pagamentos e encerra o jogo |
| Cancelar | Organizador pode cancelar o jogo |

## Regras de horário

- **Entrar**: até 1h antes do jogo
- **Sair**: até 2h antes do jogo
- Fora da janela: mensagem explicativa, sem ação destrutiva
