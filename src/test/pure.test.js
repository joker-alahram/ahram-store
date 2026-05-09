import { buildWhatsAppInvoice } from '../services/invoice.js';

const order = { order_number: '1001', status: 'submitted', items: [{ product_name_snapshot: 'A', quantity: 2, line_total: 50 }], subtotal: 50, discount_total: 0, grand_total: 50 };
const text = buildWhatsAppInvoice(order);
if (!text.includes('1001') || !text.includes('Grand Total')) throw new Error('invoice builder failed');
console.log('self-test ok');
