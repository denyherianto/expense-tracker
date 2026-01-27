export type CurrencyCode = 'IDR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'SGD' | 'MYR';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', locale: 'id-ID', decimals: 0 },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', decimals: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE', decimals: 2 },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB', decimals: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', decimals: 0 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG', decimals: 2 },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', locale: 'ms-MY', decimals: 2 },
];

export const DEFAULT_CURRENCY: CurrencyCode = 'IDR';

export function getCurrencyConfig(code: CurrencyCode): CurrencyConfig {
  return SUPPORTED_CURRENCIES.find(c => c.code === code) || SUPPORTED_CURRENCIES[0];
}

export function getCurrencySymbol(code: CurrencyCode): string {
  return getCurrencyConfig(code).symbol;
}

export function formatCurrency(amount: number | string, currencyCode: CurrencyCode = DEFAULT_CURRENCY): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  const config = getCurrencyConfig(currencyCode);

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(num);
}

export function formatCurrencyValue(amount: number | string, currencyCode: CurrencyCode = DEFAULT_CURRENCY): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  const config = getCurrencyConfig(currencyCode);

  return new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(num);
}
