import Decimal from 'decimal.js'

import { AmountFilterInterval } from '~/components/Filters/presentation/types'
import { getCurrencyPrecision } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  PayablePaymentStatusEnum,
  PayableTypeEnum,
  PaymentProviderMethodTypeEnum,
  PaymentTypeEnum,
  ProviderTypeEnum,
} from '~/generated/graphql'

// Keep payment amounts exact through URL parsing, interval ordering and cents conversion.
const PaymentDecimal = Decimal.clone({ precision: 40 })
const decimalValue = (value?: string): string | null =>
  value && /^-?\d+(\.\d*)?$/.test(value) ? value : null

export const orderPaymentAmountBounds = (value: string): string => {
  const [interval, from, to] = value.split(',')

  if (
    interval === AmountFilterInterval.isBetween &&
    decimalValue(from) !== null &&
    decimalValue(to) !== null &&
    new PaymentDecimal(from).greaterThan(to)
  ) {
    return `${interval},${to},${from}`
  }

  return value
}

export const parsePaymentAmountValue = (value: string) => {
  const [interval, from, to] = value.split(',')
  const amountFrom = decimalValue(from)
  const amountTo = decimalValue(to)

  switch (interval) {
    case AmountFilterInterval.isEqualTo:
      return { amountFrom, amountTo: amountFrom }
    case AmountFilterInterval.isBetween:
      return { amountFrom, amountTo }
    case AmountFilterInterval.isAtLeast:
      return { amountFrom, amountTo: null }
    case AmountFilterInterval.isUpTo:
      return { amountFrom: null, amountTo }
    default:
      return { amountFrom: null, amountTo: null }
  }
}

export const paymentAmountToCents = (
  value: string | null,
  currency: CurrencyEnum,
): string | null =>
  value === null
    ? null
    : new PaymentDecimal(value)
        .mul(new PaymentDecimal(10).pow(getCurrencyPrecision(currency)))
        .toFixed(0, Decimal.ROUND_HALF_UP)

export const paymentStatusLabels: Record<PayablePaymentStatusEnum, string> = {
  [PayablePaymentStatusEnum.Pending]: 'text_62da6db136909f52c2704c30',
  [PayablePaymentStatusEnum.Processing]: 'text_1740135074392314rc3ldv02',
  [PayablePaymentStatusEnum.Succeeded]: 'text_63ac86d797f728a87b2f9fa1',
  [PayablePaymentStatusEnum.Failed]: 'text_63e27c56dfe64b846474ef4e',
}

export const paymentProviderLabels: Record<ProviderTypeEnum, string> = {
  [ProviderTypeEnum.Stripe]: 'text_62b1edddbf5f461ab971277d',
  [ProviderTypeEnum.Gocardless]: 'text_634ea0ecc6147de10ddb6625',
  [ProviderTypeEnum.Cashfree]: 'text_17367626793434wkg1rk0114',
  [ProviderTypeEnum.Adyen]: 'text_645d071272418a14c1c76a6d',
  [ProviderTypeEnum.Flutterwave]: 'text_1749724395108m0swrna0zt4',
  [ProviderTypeEnum.Moneyhash]: 'text_1733427981129n3wxjui0bex',
}

export const paymentMethodLabels: Record<PaymentProviderMethodTypeEnum, string> = {
  [PaymentProviderMethodTypeEnum.Card]: 'text_64aeb7b998c4322918c84208',
  [PaymentProviderMethodTypeEnum.SepaDebit]: 'text_64aeb7b998c4322918c8420c',
  [PaymentProviderMethodTypeEnum.UsBankAccount]: 'text_1788818972604ba69nnh1s7s',
  [PaymentProviderMethodTypeEnum.BacsDebit]: 'text_1788818972604ah9hl3coiuc',
  [PaymentProviderMethodTypeEnum.Link]: 'text_6686b316b672a6e75a29eea0',
  [PaymentProviderMethodTypeEnum.Boleto]: 'text_1788818972604hkjgjtydcfx',
  [PaymentProviderMethodTypeEnum.Crypto]: 'text_1788818972604tcp0p5uii7y',
  [PaymentProviderMethodTypeEnum.CustomerBalance]: 'text_1788818972605qax533ui68v',
}

export const paymentTypeLabels: Record<PaymentTypeEnum, string> = {
  [PaymentTypeEnum.Manual]: 'text_1737110192586abtitcui0xt',
  [PaymentTypeEnum.Provider]: 'text_1788818972604frdzy1e5sp2',
}

export const payableTypeLabels: Record<PayableTypeEnum, string> = {
  [PayableTypeEnum.Invoice]: 'text_63fcc3218d35b9377840f5b3',
  [PayableTypeEnum.PaymentRequest]: 'text_17495622741665lrk6dp6czk',
}
