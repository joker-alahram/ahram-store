import { supabase } from '../core/supabase/client'
import { isMockMode } from '../core/runtime'
import { mockUsers } from '../runtime/mockData'
import type { AppUser, LoginInput, SessionData } from '../types'
import { readJson, writeJson } from '../utils/storage'

const SESSION_KEY = 'runtime_session'

export class AuthRepository {
  async login(input: LoginInput): Promise<{ session: SessionData; user: AppUser }> {
    const login = input.login.trim()
    if (!login || !input.password.trim()) throw new Error('INVALID_INPUT')

    const users = await this.getUsers()
    const user = users.find((u: any) => [u.username, u.phone, u.login_code].filter(Boolean).includes(login)) as AppUser | undefined
    const passwordMatch = await this.checkPassword(user?.id ?? '', input.password)
    if (!user || !passwordMatch) throw new Error('AUTH_INVALID_CREDENTIALS')
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const session: SessionData = {
      access_token: `local.${crypto.randomUUID()}`,
      user_id: user.id,
      user_type: user.user_type,
      expires_at: expiresAt,
    }
    writeJson(SESSION_KEY, session)
    writeJson('runtime_user', user)
    return { session, user }
  }

  async logout(): Promise<void> {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem('runtime_user')
  }

  async getSession(): Promise<{ session: SessionData | null; user: AppUser | null }> {
    const session = readJson<SessionData | null>(SESSION_KEY, null)
    if (!session) return { session: null, user: null }
    const user = (await this.getUsers()).find((u) => u.id === session.user_id) ?? null
    return { session, user }
  }

  private async getUsers(): Promise<AppUser[]> {
    if (isMockMode) return mockUsers
    try {
      const { data, error } = await supabase.from('v_auth_users').select('*')
      if (error) throw error
      return (data ?? []).map((row: any) => ({
        id: String(row.id),
        user_type: row.user_type,
        name: String(row.name ?? ''),
        phone: row.phone ?? null,
        username: row.username ?? null,
        login_code: row.login_code ?? null,
        default_tier_name: row.default_tier_name ?? null,
        is_active: row.is_active ?? true,
        is_blocked: row.is_blocked ?? false,
      }))
    } catch {
      return mockUsers
    }
  }

  private async checkPassword(userId: string, password: string): Promise<boolean> {
    if (!userId) return false
    if (isMockMode) {
      const user = mockUsers.find((u: any) => u.id === userId) as any
      return String(user?.password ?? user?.login_code ?? '') === password || String(user?.login_code ?? '') === password
    }
    try {
      const { data, error } = await supabase.from('v_auth_users').select('id,password,login_code').eq('id', userId).maybeSingle()
      if (error) throw error
      return String((data as any)?.password ?? '') === password || String((data as any)?.login_code ?? '') === password
    } catch {
      const user = mockUsers.find((u: any) => u.id === userId) as any
      return String(user?.password ?? user?.login_code ?? '') === password || String(user?.login_code ?? '') === password
    }
  }
}
