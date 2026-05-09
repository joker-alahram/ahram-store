import { runtimeService } from './runtimeService'

export class ProductService {
  list() { return runtimeService.products }
}

export const productService = new ProductService()
