export function money(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
}

export function dealValue(volume: number, unitPrice: number) {
  return Math.round(volume * unitPrice * 100) / 100;
}

export function commissionAmount(total: number, percentage: number) {
  return Math.round(total * (percentage / 100) * 100) / 100;
}