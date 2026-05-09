import type { CommerceGateway } from '@/gateways/commerceGateway';

export class CatalogRepository {
  constructor(private readonly gateway: CommerceGateway) {}

  getAppSettings() { return this.gateway.getAppSettings(); }
  listTiers() { return this.gateway.listTiers(); }
  listProducts(query?: { search?: string; tier_name?: string; company_id?: string }) { return this.gateway.listProducts(query); }
  getProduct(product_id: string) { return this.gateway.getProduct(product_id); }
  listOffers() { return this.gateway.listOffers(); }
  getRuntimeHealth() { return this.gateway.getRuntimeHealth(); }
}
