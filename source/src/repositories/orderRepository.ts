import type { CommerceGateway } from '@/gateways/commerceGateway';
import type { EditOrderItemsCommand, SubmitCheckoutCommand, UpdateOrderStatusCommand } from '@/contracts/commands';

export class OrderRepository {
  constructor(private readonly gateway: CommerceGateway) {}

  createOrder(command: SubmitCheckoutCommand & { customer_id: string; sales_rep_id?: string | null; tier_name: string; items: Array<{ product_id?: string; offer_id?: string; unit_code: string; quantity: number }> }) {
    return this.gateway.createOrder(command);
  }

  listOrders(scope?: { customer_id?: string | null; sales_rep_id?: string | null }) { return this.gateway.listOrders(scope); }
  getOrder(id: string) { return this.gateway.getOrder(id); }
  updateOrderStatus(command: UpdateOrderStatusCommand) { return this.gateway.updateOrderStatus(command); }
  editOrderItems(command: EditOrderItemsCommand) { return this.gateway.editOrderItems(command); }
  sendOrderWhatsApp(order_id: string) { return this.gateway.sendOrderWhatsApp(order_id); }
}
