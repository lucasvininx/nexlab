// Cliente Supabase para Client Components
// Permite operacoes de autenticacao e dados em componentes React (lado cliente)
// Utilizado em formularios e componentes interativos do usuario

import { createBrowserClient } from '@supabase/ssr'

// Factory function que cria instancia do cliente Supabase para browser
// Utiliza sessao armazenada em cookies para manter usuario logado
//
// Retorna: Cliente Supabase configurado para cliente (browser)
export function createClient() {
  // Cria cliente Supabase otimizado para navegador
  // Gerencia automaticamente JWT tokens nos cookies
  return createBrowserClient(
    // URL da instancia Supabase (variavel publica)
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Chave anonima Supabase (variavel publica)
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

