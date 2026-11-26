import type { CurrencyLabels, CurrencyOption } from '../components/amount-input'

export const currencyOptions: CurrencyOption[] = [
  { value: 'USD', label: 'US Dollar' },
  { value: 'EUR', label: 'Euro' },
  { value: 'JPY', label: 'Japanese Yen' },
]
export const currencyLabels: CurrencyLabels = {
  trigger: 'Currency, USD',
  search: 'Search currencies…',
  clear: 'Clear currency search',
  empty: 'No currencies found',
}

export const acceptValue = (raw: string): string => raw
