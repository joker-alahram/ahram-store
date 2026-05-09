import type { CommerceGateway } from '@/gateways/commerceGateway';
import type { LoginCommand, LogoutCommand, RestoreSessionCommand, ChangePasswordCommand } from '@/contracts/commands';

export class AuthRepository {
  constructor(private readonly gateway: CommerceGateway) {}

  login(command: LoginCommand) {
    return this.gateway.login(command);
  }

  logout(command: LogoutCommand) {
    return this.gateway.logout(command);
  }

  restoreSession(command: RestoreSessionCommand) {
    return this.gateway.restoreSession(command);
  }

  changePassword(command: ChangePasswordCommand) {
    return this.gateway.changePassword(command);
  }
}
