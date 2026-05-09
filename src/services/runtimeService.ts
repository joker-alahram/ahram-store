import { RuntimeRepository } from '../repositories/runtimeRepository'

export const runtimeRepository = new RuntimeRepository()

export class RuntimeService {
  get settings() { return runtimeRepository.getSettings() }
  get tiers() { return runtimeRepository.getTiers() }
  get products() { return runtimeRepository.getProducts() }
  get dailyDeals() { return runtimeRepository.getDailyDeals() }
  get flashOffers() { return runtimeRepository.getFlashOffers() }
}

export const runtimeService = new RuntimeService()
