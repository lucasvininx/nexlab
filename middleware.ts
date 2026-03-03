// Middleware global do Next.js
// Este middleware intercepa TODAS as requisicoes (exceto assets)
// e executa logica de atualizacao de sessao e protecao de rotas

import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

// Funcao middleware principal
// Executada em cada requisicao antes de chegar ao servidor
// Valida sessao e atualiza JWT/cookies
//
// Parametro: request - objeto da requisicao HTTP
// Retorna: Resposta HTTP (pode ser redirecionada)
export async function middleware(request: NextRequest) {
  // Chama funcao que valida e atualiza sessao Supabase
  return await updateSession(request)
}

// Configuracao de matcher - define quais rotas o middleware intercepta
// Exclui assets estaticos de image, css, etc por questoes de performance
export const config = {
  matcher: [
    // Match todas as rotas EXCETO:
    // - _next/static (assets Next.js)
    // - _next/image (otimizacao de imagens Next.js)
    // - favicon.ico (icone)
    // - arquivos de imagem/midia (.png, .jpg, .gif, etc)
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

