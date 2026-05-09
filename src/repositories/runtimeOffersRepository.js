export async function loadRuntimeOffers(api) {
  const [daily, flash] = await Promise.allSettled([
    api.get('v_daily_deals', { select: '*', order: 'id.desc' }),
    api.get('v_flash_offers', { select: '*', order: 'start_time.desc' }),
  ]);

  return {
    daily: daily.status === 'fulfilled' && Array.isArray(daily.value) ? daily.value : [],
    flash: flash.status === 'fulfilled' && Array.isArray(flash.value) ? flash.value : [],
  };
}
