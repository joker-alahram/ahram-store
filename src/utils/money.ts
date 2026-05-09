export const money = (value: number, currency = 'EGP'): string =>
  new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
