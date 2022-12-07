import { CurrencyEnum } from '~/generated/graphql'

const CURRENCIES_WITH_3_DECIMALS = ['BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND']
const CURRENCIES_WITH_0_DECIMALS = [
  'CVE',
  'DJF',
  'GNF',
  'IDR',
  'ISK',
  'JPY',
  'KMF',
  'KRW',
  'PYG',
  'RWF',
  'UGX',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF',
]

const multiply = (x: number, y: number) => x * y
const divide = (x: number, y: number) => x / y
const formatAmount = (
  value: string | number,
  currency: CurrencyEnum,
  operator: (x: number, y: number) => number
) => {
  const precision = getCurrencyPrecision(currency)

  if (precision === 0) {
    return Math.round(Number(value))
  } else if (precision === 3) {
    return Number((String(operator(Number(value), 1000)).match(/^-?\d+(?:\.\d{0,3})?/) || [])[0])
  }

  return Number((String(operator(Number(value), 100)).match(/^-?\d+(?:\.\d{0,2})?/) || [])[0])
}

export const serializeAmount = (value: string | number, currency: CurrencyEnum) => {
  return formatAmount(value, currency, multiply)
}

export const deserializeAmount = (value: string | number, currency: CurrencyEnum) => {
  return formatAmount(value, currency, divide)
}

export const getCurrencyPrecision = (currency: CurrencyEnum): number => {
  if (CURRENCIES_WITH_0_DECIMALS.includes(currency)) {
    return 0
  } else if (CURRENCIES_WITH_3_DECIMALS.includes(currency)) {
    return 3
  }

  return 2
}
