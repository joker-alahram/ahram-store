import type { CustomerRepository } from '@/repositories/customerRepository';
import type { CreateCustomerCommand, UpdateCustomerCommand, ReassignCustomersCommand } from '@/contracts/commands';

export class CustomerService {
  constructor(private readonly repo: CustomerRepository) {}

  listCustomers(scope?: { sales_rep_id?: string | null }) { return this.repo.listCustomers(scope); }
  getCustomer(id: string) { return this.repo.getCustomer(id); }
  createCustomer(command: CreateCustomerCommand) { return this.repo.createCustomer(command); }
  updateCustomer(command: UpdateCustomerCommand) { return this.repo.updateCustomer(command); }
  listSalesReps() { return this.repo.listSalesReps(); }
  createSalesRep(command: { name: string; phone: string; username: string; password?: string }) { return this.repo.createSalesRep(command); }
  updateSalesRep(command: { id: string; name?: string; phone?: string; username?: string; is_active?: boolean; is_blocked?: boolean }) { return this.repo.updateSalesRep(command); }
  reassignCustomers(command: ReassignCustomersCommand) { return this.repo.reassignCustomers(command); }
}
