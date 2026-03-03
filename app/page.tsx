// Pagina inicial / root da aplicacao
// Rota: GET /
// Nao exibe conteudo - redireciona usuario para rota apropriada:
// - /login se nao autenticado
// - /admin se eh admin
// - /activation se eh promoter

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Componente assíncrono que automaticamente redireciona
// Similar ao middleware, mas em camada de pagina
export default async function HomePage() {
  // Cria cliente Supabase para servidor
  const supabase = await createClient()
  
  // Obtem usuario autenticado da sessao
  const { data: { user } } = await supabase.auth.getUser()

  // Se nao autenticado, redireciona para login
  if (!user) redirect('/login')

  // Se autenticado, valida papel
  const isAdmin = user.user_metadata?.is_admin === true
  
  // Redireciona usuario para rota apropriada
  // Admins vao para /admin (painel administrativo)
  if (isAdmin) redirect('/admin')
  
  // Promoters vao para /activation (fluxo de ativacao)
  redirect('/activation')
}

