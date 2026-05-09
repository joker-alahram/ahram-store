import type { OrderRepository } from '@/repositories/orderRepository';
import type { EditOrderItemsCommand, SubmitCheckoutCommand, UpdateOrderStatusCommand } from '@/contracts/commands';

export class OrderService {
  constructor(private readonly repo: OrderRepository) {}

  createOrder(command: SubmitCheckoutCommand & { customer_id: string; sales_rep_id?: string | null; tier_name: string; items: Array<{ product_id?: string; offer_id?: string; unit_code: string; quantity: number }> }) {
    return this.repo.createOrder(command);
  }

  listOrders(scope?: { customer_id?: string | null; sales_rep_id?: string | null }) { return this.repo.listOrders(scope); }
  getOrder(id: string) { return this.repo.getOrder(id); }
  updateOrderStatus(command: UpdateOrderStatusCommand) { return this.repo.updateOrderStatus(command); }
  editOrderItems(command: EditOrderItemsCommand) { return this.repo.editOrderItems(command); }
  sendOrderWhatsApp(order_id: string) { return this.repo.sendOrderWhatsApp(order_id); }
}
