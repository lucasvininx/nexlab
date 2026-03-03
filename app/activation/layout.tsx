// Layout para rota /activation (fluxo promoter)
// Responsavel por:
// 1. Validar autenticacao - redireciona para /login se nao logado
// 2. Validar papel - redireciona admins para /admin
// 3. Renderizar container kiosk com aspecto 9:16

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Componente assíncrono de layout
// Funciona como middleware de servidor para a rota /activation
export default async function ActivationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Cria cliente Supabase para servidor
  const supabase = await createClient()
  
  // Obtem usuario da sessao (JWT dos cookies)
  const { data: { user } } = await supabase.auth.getUser()
  
  // VALIDACAO 1: Se nao esta autenticado, redireciona para login
  if (!user) redirect('/login')

  // VALIDACAO 2: Se eh admin, nao deve acessar /activation
  // Redireciona para /admin em vez disso
  const isAdmin = user.user_metadata?.is_admin === true
  if (isAdmin) redirect('/admin')

  // Layout bem-sucedido - renderiza UI do kiosk
  return (
    // Container tela cheia com fundo customizavel
    <div className="min-h-screen bg-[var(--kiosk-bg)] flex items-center justify-center">
      {/* Frame do kiosk com aspecto vertical 9:16 (como tela de kiosk real)
          Max-width de 540px = dimensao padrão para um kiosk */}
      <div
        className="relative w-full max-w-[540px] overflow-hidden"
        style={{ aspectRatio: '9/16' }}
      >
        {/* Renderiza pagina filha (/activation/page.tsx ou componentes dentro) */}
        {children}
      </div>
    </div>
  )
}


