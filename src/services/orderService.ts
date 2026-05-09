import { OrderRepository, type OrderRecord } from '../repositories/orderRepository'

export { type OrderRecord }
export const orderRepository = new OrderRepository()

export class OrderService {
  list() { return orderRepository.list() }
  create(payload: Parameters<OrderRepository['create']>[0]) { return orderRepository.create(payload) }
}

export const orderService = new OrderService()
