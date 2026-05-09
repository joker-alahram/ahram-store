import { runtimeService } from './runtimeService'

export class TierService {
  list() { return runtimeService.tiers }
}

export const tierService = new TierService()
