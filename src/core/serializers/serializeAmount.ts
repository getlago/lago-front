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

export const serializeAmount = (value: string | number, currency: CurrencyEnum) => {
  const precision = getCurrencyPrecision(currency)

  if (precision === 0) {
    return Math.round(Number(value))
  } else if (precision === 3) {
    return Number((String(Math.round(Number(value) * 1000)).match(/^-?\d+(?:\.\d{0,3})?/) || [])[0])
  }

  return Number((String(Math.round(Number(value) * 100)).match(/^-?\d+(?:\.\d{0,2})?/) || [])[0])
}

export const deserializeAmount = (value: string | number, currency: CurrencyEnum) => {
  const precision = getCurrencyPrecision(currency)

  if (precision === 0) {
    return Math.round(Number(value))
  } else if (precision === 3) {
    return Number((String(Number(value) / 1000).match(/^-?\d+(?:\.\d{0,3})?/) || [])[0])
  }

  return Number((String(Number(value) / 100).match(/^-?\d+(?:\.\d{0,2})?/) || [])[0])
}

export const getCurrencyPrecision = (currency: CurrencyEnum): number => {
  if (CURRENCIES_WITH_0_DECIMALS.includes(currency)) {
    return 0
  } else if (CURRENCIES_WITH_3_DECIMALS.includes(currency)) {
    return 3
  }

  return 2
}
