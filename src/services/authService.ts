import { AuthRepository } from '../repositories/authRepository'

export const authRepository = new AuthRepository()

export class AuthService {
  login(login: string, password: string) { return authRepository.login({ login, password }) }
  logout() { return authRepository.logout() }
  session() { return authRepository.getSession() }
}

export const authService = new AuthService()
