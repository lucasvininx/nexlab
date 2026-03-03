// Layout para rota /admin (painel administrativo)
// Responsavel por:
// 1. Validar autenticacao - redireciona para /login se nao logado
// 2. Validar papel - garante que usuario eh admin
// 3. Renderizar container da aplicacao admin

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Componente assíncrono de layout para /admin/*
// Funciona como guarda de servidor para rota de admin
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Cria cliente Supabase para servidor
  const supabase = await createClient()
  
  // Obtem usuario autenticado da sessao JWT
  const { data: { user } } = await supabase.auth.getUser()

  // PROTECAO 1: Requer autenticacao para acessar /admin
  // Se nao logado, redireciona para pagina de login
  if (!user) redirect('/login')

  // PROTECAO 2: Requer ser admin - verifica flag is_admin nos metadados
  // Se eh promoter (nao-admin), redireciona para /activation
  const isAdmin = user.user_metadata?.is_admin === true
  if (!isAdmin) redirect('/activation')

  // Validacoes passadas - renderiza painel admin
  return (
    // Container tela cheia com fundo padrao da aplicacao
    <div className="min-h-screen bg-background">
      {/* Renderiza componentes filhos do painel (AdminDashboard, etc) */}
      {children}
    </div>
  )
}
