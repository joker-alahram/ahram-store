import type { RuntimeMode } from '../types'

function requiredEnv(value: string | undefined, name: string): string {
  if (!value || !value.trim()) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

export const env = {
  supabaseUrl: requiredEnv(import.meta.env.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL'),
  supabaseAnonKey: requiredEnv(import.meta.env.VITE_SUPABASE_ANON_KEY, 'VITE_SUPABASE_ANON_KEY'),
  runtimeMode: (import.meta.env.VITE_RUNTIME_MODE || 'auto') as RuntimeMode,
}
