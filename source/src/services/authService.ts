import type { AuthRepository } from '@/repositories/authRepository';
import type { LoginCommand, LogoutCommand, RestoreSessionCommand, ChangePasswordCommand } from '@/contracts/commands';

export class AuthService {
  constructor(private readonly repo: AuthRepository) {}

  login(command: LoginCommand) { return this.repo.login(command); }
  logout(command: LogoutCommand) { return this.repo.logout(command); }
  restoreSession(command: RestoreSessionCommand) { return this.repo.restoreSession(command); }
  changePassword(command: ChangePasswordCommand) { return this.repo.changePassword(command); }
}
