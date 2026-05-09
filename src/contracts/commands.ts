export interface LoginCommand {
  login: string;
  password: string;
}

export interface LogoutCommand {
  session_id: string;
}

export interface RestoreSessionCommand {
  access_token: string;
}

export interface ChangePasswordCommand {
  current_password: string;
  next_password: string;
}

export interface CreateCustomerCommand {
  name: string;
  phone: string;
  username: string;
  password?: string;
  sales_rep_id?: string | null;
  customer_type?: 'direct' | 'rep_customer';
}

export interface UpdateCustomerCommand {
  id: string;
  name?: string;
  phone?: string;
  username?: string;
  is_active?: boolean;
  is_blocked?: boolean;
  sales_rep_id?: string | null;
}

export interface ReassignCustomersCommand {
  sales_rep_id: string;
  customer_ids: string[];
}

export interface AddToCartCommand {
  product_id: string;
  unit_code: string;
  quantity: number;
}

export interface RemoveFromCartCommand {
  cart_item_id: string;
}

export interface ChangeQuantityCommand {
  cart_item_id: string;
  quantity: number;
}

export interface SelectTierCommand {
  tier_name: string;
}

export interface SubmitCheckoutCommand {
  notes?: string;
  payment_method?: 'cod' | 'invoice_later';
}

export interface UpdateOrderStatusCommand {
  order_id: string;
  status: 'submitted' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

export interface EditOrderItemsCommand {
  order_id: string;
  items: Array<{
    product_id?: string;
    offer_id?: string;
    unit_code: string;
    quantity: number;
  }>;
}

export interface CreateOrderCommand {
  notes?: string;
  payment_method?: 'cod' | 'invoice_later';
}
