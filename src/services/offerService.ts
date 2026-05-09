import { runtimeService } from './runtimeService'

export class OfferService {
  dailyDeals() { return runtimeService.dailyDeals }
  flashOffers() { return runtimeService.flashOffers }
}

export const offerService = new OfferService()
