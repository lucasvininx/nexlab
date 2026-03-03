// Cliente Supabase para Server Components e Server Actions
// Gerencia autenticacao JWT via cookies seguindo padrao SSR (Server-Side Rendering)
// Utilizado em layout.tsx e actions/* para operacoes que requerem seguranca

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Factory function que cria instancia do cliente Supabase para servidor
// Usa cookies para armazenar e renovar JWT tokens automaticamente
//
// Retorna: Cliente Supabase configurado para SSR
export async function createClient() {
  // Obtem armazenamento de cookies do Next.js
  const cookieStore = await cookies()

  // Cria cliente Supabase com configuracao SSR
  // SSR = Supabase SSR - especialmente otimizado para servidor Next.js
  return createServerClient(
    // URL da instancia Supabase (variavel de ambiente publica)
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Chave anonima para cliente (publica, segura de expor)
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Configuracao de cookies para gerenciar sessao
      cookies: {
        // Le cookies existentes da requisicao (contem JWT)
        getAll() {
          return cookieStore.getAll()
        },
        // Escreve cookies atualizados na resposta
        // Chamado quando JWT eh renovado automaticamente
        setAll(cookiesToSet) {
          try {
            // Tenta setar cookies (pode falhar em alguns contextos Server Component)
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Seguro ignorar - significa que estamos em Server Component
            // Os cookies ainda sao propagados normalmente
          }
        },
      },
    },
  )
}
