// Middleware de autenticacao Supabase
// Valida sessao JWT, atualiza tokens e controla acesso por papel (role-based)
// Executado em cada requisicao pelo middleware.ts global

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Funcao principal que atualiza sessao e aplica protecao de rotas
// Verifica se usuario esta autenticado e tem permissao para acessar rota
//
// Parametro: request - objeto da requisicao HTTP
// Retorna: Resposta (pode redirecionar se sessao invalida ou acesso negado)
export async function updateSession(request: NextRequest) {
  // Cria resposta inicial padrao
  let supabaseResponse = NextResponse.next({ request })

  // Cria cliente Supabase para o servidor
  // Este cliente gerencia JWT tokens nos cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Configuracao de cookies para SSR (Server-Side Rendering)
      // Valida e atualiza JWT tokens automaticamente
      cookies: {
        // Le cookies da requisicao
        getAll() {
          return request.cookies.getAll()
        },
        // Configura cookies na resposta (para renovacao de tokens)
        setAll(cookiesToSet) {
          // Adiciona cookies a requisicao
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          // Cria nova resposta com cookies atualizados
          supabaseResponse = NextResponse.next({ request })
          // Adiciona cookies a resposta
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Recupera usuario autenticado da sessao JWT
  // Se JWT invalido ou expirado, user sera null
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Le caminho da URL (ex: /activation, /admin, /login)
  const pathname = request.nextUrl.pathname

  // PROTECAO 1: Rotas protegidas requerem autenticacao
  // Se tentando acessar /activation ou /admin SEM estar logado
  if (
    (pathname.startsWith('/activation') || pathname.startsWith('/admin')) &&
    !user
  ) {
    // Redireciona para pagina de login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // PROTECAO 2: Controle de acesso baseado em papel (Role-Based Access Control)
  if (user) {
    // Verifica se usuario eh admin
    const isAdmin = user.user_metadata?.is_admin === true

    // Se admin tentar acessar /activation (rota promoter), redireciona para /admin
    if (pathname.startsWith('/activation') && isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }

    // Se promoter (nao-admin) tentar acessar /admin, redireciona para /activation
    if (pathname.startsWith('/admin') && !isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/activation'
      return NextResponse.redirect(url)
    }
  }

  // PROTECAO 3: Usuario logado nao pode acessar /login
  // Se ja esta autenticado e tenta voltar para login
  if (pathname === '/login' && user) {
    const isAdmin = user.user_metadata?.is_admin === true
    // Redireciona para rota apropriada (admin ou activation)
    const url = request.nextUrl.clone()
    url.pathname = isAdmin ? '/admin' : '/activation'
    return NextResponse.redirect(url)
  }

  // Se nenhuma restricao foi acionada, retorna resposta normal
  // (Usuario pode acessar rota ou eh rota publica como homepage)
  return supabaseResponse
}
