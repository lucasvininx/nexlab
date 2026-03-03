// Provider de tema para aplicacao
// Permite alternar entre temas (light/dark) usando next-themes
// Envoltorio ao redor da aplicacao para ativar funcionalidade de tema

'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

// Componente provider que ativa gerenciamento de tema
// Usa next-themes para handle automaticamente persistencia de preferencia
// E aplicacao de tema ao renderizar
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Simplesmente passthrough para NextThemesProvider do next-themes
  // Props incluem: attribute, defaultTheme, storageKey, etc
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

