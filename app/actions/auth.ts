// Ficheiro de Server Actions para autenticacao
// Este ficheiro contem funcoes que sao executadas no servidor
// e nao sao expostas ao codigo cliente por razoes de seguranca

'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Funcao de login - User Strategy
// Recebe email e password e autentica contra Supabase
// Verifica se usuario eh admin ou promoter e redireciona para rota apropriada
// 
// Parametro: formData - dados do formulario (email e password)
// Retorna: Objeto com erro se falhar, ou redireciona se sucesso
export async function loginAction(formData: FormData) {
  // Extrai email e password do formulario
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Cria cliente Supabase para o servidor
  const supabase = await createClient()
  
  // Autentica usuario com email e password
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  // Se houver erro na autenticacao, retorna mensagem de erro
  if (error) {
    return { error: error.message }
  }

  // Verifica se usuario tem permissao de admin (is_admin = true)
  const isAdmin = data.user?.user_metadata?.is_admin === true
  
  // Redireciona para /admin se eh admin, caso contrario para /activation
  redirect(isAdmin ? '/admin' : '/activation')
}

// Funcao de logout
// Invalida a sessao JWT/cookies do usuario e redireciona para login
// 
// Parametro: Nenhum
// Efeito: Limpa sessao e redireciona para /login
export async function logoutAction() {
  // Cria cliente Supabase para o servidor
  const supabase = await createClient()
  
  // Faz logout - invalida os cookies/sessao
  await supabase.auth.signOut()
  
  // Redireciona usuario para pagina de login
  redirect('/login')
}
