import type { CatalogRepository } from '@/repositories/catalogRepository';

export class CatalogService {
  constructor(private readonly repo: CatalogRepository) {}

  getAppSettings() { return this.repo.getAppSettings(); }
  listTiers() { return this.repo.listTiers(); }
  listProducts(query?: { search?: string; tier_name?: string; company_id?: string }) { return this.repo.listProducts(query); }
  getProduct(product_id: string) { return this.repo.getProduct(product_id); }
  listOffers() { return this.repo.listOffers(); }
  getRuntimeHealth() { return this.repo.getRuntimeHealth(); }
}
