// Pagina do fluxo de ativacao /activation
// Renderiza o componente cliente ActivationClient que gerencia
// toda a maquina de estados de captura fotografica

import ActivationClient from '@/components/activation/ActivationClient'

// Componente de pagina simples - apenas renderiza o cliente
// Layout.tsx valida autenticacao e papel antes de chegar aqui
export default function ActivationPage() {
  // Renderiza componente cliente com toda a logica interativa
  return <ActivationClient />
}

