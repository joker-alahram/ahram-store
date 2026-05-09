import type { CommerceGateway } from '@/gateways/commerceGateway';
import type { CreateCustomerCommand, UpdateCustomerCommand, ReassignCustomersCommand } from '@/contracts/commands';

export class CustomerRepository {
  constructor(private readonly gateway: CommerceGateway) {}

  listCustomers(scope?: { sales_rep_id?: string | null }) { return this.gateway.listCustomers(scope); }
  getCustomer(id: string) { return this.gateway.getCustomer(id); }
  createCustomer(command: CreateCustomerCommand) { return this.gateway.createCustomer(command); }
  updateCustomer(command: UpdateCustomerCommand) { return this.gateway.updateCustomer(command); }
  listSalesReps() { return this.gateway.listSalesReps(); }
  createSalesRep(command: { name: string; phone: string; username: string; password?: string }) { return this.gateway.createSalesRep(command); }
  updateSalesRep(command: { id: string; name?: string; phone?: string; username?: string; is_active?: boolean; is_blocked?: boolean }) { return this.gateway.updateSalesRep(command); }
  reassignCustomers(command: ReassignCustomersCommand) { return this.gateway.reassignCustomers(command); }
}
