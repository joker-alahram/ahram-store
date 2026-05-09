export class AnalyticsService {
  track(event: string, payload: unknown) {
    try {
      console.log('[analytics]', event, payload)
    } catch {
      // noop
    }
  }
}

export const analyticsService = new AnalyticsService()
