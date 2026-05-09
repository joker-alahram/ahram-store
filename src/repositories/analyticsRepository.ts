import type { CommerceGateway } from '@/gateways/commerceGateway';

export class AnalyticsRepository {
  constructor(private readonly gateway: CommerceGateway) {}
  dashboardSummaries(scope?: { role?: string; actor_id?: string | null }) { return this.gateway.dashboardSummaries(scope); }
  repPerformance() { return this.gateway.repPerformance(); }
  customerTotals() { return this.gateway.customerTotals(); }
}
