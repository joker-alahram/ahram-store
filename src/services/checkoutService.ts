import type { CartItem, Order } from '@/contracts/types';
import type { OrderService } from './orderService';
import type { CustomerService } from './customerService';

export class CheckoutService {
  constructor(
    private readonly orderService: OrderService,
    private readonly customerService: CustomerService,
  ) {}

  async submit(command: {
    customer_id: string;
    sales_rep_id?: string | null;
    tier_name: string;
    items: CartItem[];
    notes?: string;
    payment_method?: 'cod' | 'invoice_later';
  }): Promise<{ order: Order; invoice: any; whatsapp_text: string }> {
    const customer = await this.customerService.getCustomer(command.customer_id);
    if (!customer) throw Object.assign(new Error('VALIDATION_FAILED'), { code: 'VALIDATION_FAILED' });

    return this.orderService.createOrder({
      customer_id: command.customer_id,
      sales_rep_id: command.sales_rep_id ?? null,
      tier_name: command.tier_name,
      notes: command.notes,
      payment_method: command.payment_method ?? 'cod',
      items: command.items.map((item) => ({
        product_id: item.product_id,
        offer_id: item.offer_id,
        unit_code: item.unit_code,
        quantity: item.quantity,
      })),
    });
  }
}
