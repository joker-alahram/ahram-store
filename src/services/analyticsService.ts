import type { AnalyticsRepository } from '@/repositories/analyticsRepository';

export class AnalyticsService {
  constructor(private readonly repo: AnalyticsRepository) {}
  dashboardSummaries(scope?: { role?: string; actor_id?: string | null }) { return this.repo.dashboardSummaries(scope); }
  repPerformance() { return this.repo.repPerformance(); }
  customerTotals() { return this.repo.customerTotals(); }
}
