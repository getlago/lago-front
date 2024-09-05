import { DateTime } from 'luxon'

import { TInvoiceCollectionsDataResult } from '~/components/graphs/Invoices'
import { TSubscriptionLifetimeUsageDataResult } from '~/components/graphs/LifetimeUsage'
import { TGetInvoicedUsagesQuery } from '~/components/graphs/Usage'
import { TAreaChartDataResult } from '~/components/graphs/utils'
import { CurrencyEnum, InvoicePaymentStatusTypeEnum } from '~/generated/graphql'

export const AreaGrossRevenuesChartFakeData: TAreaChartDataResult = [
  {
    amountCents: '5810000',
    currency: CurrencyEnum.Eur,
    month: DateTime.now().startOf('month').toISO(),
  },
  {
    amountCents: '3600000',
    currency: CurrencyEnum.Eur,
    month: DateTime.now().minus({ month: 1 }).startOf('month').toISO(),
  },
  {
    amountCents: '4200000',
    currency: CurrencyEnum.Eur,
    month: DateTime.now().minus({ month: 2 }).startOf('month').toISO(),
  },
  {
    amountCents: '4000000',
    currency: CurrencyEnum.Eur,
    month: DateTime.now().minus({ month: 3 }).startOf('month').toISO(),
  },
  {
    amountCents: '3700000',
    currency: CurrencyEnum.Eur,
    month: DateTime.now().minus({ month: 4 }).startOf('month').toISO(),
  },
  {
    amountCents: '3400000',
    currency: CurrencyEnum.Eur,
    month: DateTime.now().minus({ month: 5 }).startOf('month').toISO(),
  },
  {
    amountCents: '3200000',
    currency: CurrencyEnum.Eur,
    month: DateTime.now().minus({ month: 6 }).startOf('month').toISO(),
  },
  {
    amountCents: '4000000',
    currency: CurrencyEnum.Eur,
    month: DateTime.now().minus({ month: 7 }).startOf('month').toISO(),
  },
  {
    amountCents: '1200000',
    currency: CurrencyEnum.Eur,
    month: DateTime.now().minus({ month: 8 }).startOf('month').toISO(),
  },
  {
    amountCents: '1200000',
    currency: CurrencyEnum.Eur,
    month: DateTime.now().minus({ month: 9 }).startOf('month').toISO(),
  },
  {
    amountCents: '800000',
    currency: CurrencyEnum.Eur,
    month: DateTime.now().minus({ month: 10 }).startOf('month').toISO(),
  },
  {
    amountCents: '400000',
    currency: CurrencyEnum.Eur,
    month: DateTime.now().minus({ month: 11 }).startOf('month').toISO(),
  },
  {
    amountCents: '0',
    currency: CurrencyEnum.Eur,
    month: DateTime.now().minus({ month: 12 }).startOf('month').toISO(),
  },
]

export const AreaMrrChartFakeData: TAreaChartDataResult = [
  {
    amountCents: '5810000',
    currency: CurrencyEnum.Eur,
    month: DateTime.now().startOf('month').toISO(),
  },
  {
    amountCents: '3600000',
    currency: CurrencyEnum.Eur,
    month: DateTime.now().minus({ month: 1 }).startOf('month').toISO(),
  },
  {
    amountCents: '4200000',
    currency: CurrencyEnum.Eur,
    month: DateTime.now().minus({ month: 2 }).startOf('month').toISO(),
  },
  {
    amountCents: '2400000',
    currency: CurrencyEnum.Eur,
    month: DateTime.now().minus({ month: 3 }).startOf('month').toISO(),
  },
  {
    amountCents: '3700000',
    currency: CurrencyEnum.Eur,
    month: DateTime.now().minus({ month: 4 }).startOf('month').toISO(),
  },
  {
    amountCents: '3400000',
    currency: CurrencyEnum.Eur,
    month: DateTime.now().minus({ month: 5 }).startOf('month').toISO(),
  },
  {
    amountCents: '3200000',
    currency: CurrencyEnum.Eur,
    month: DateTime.now().minus({ month: 6 }).startOf('month').toISO(),
  },
  {
    amountCents: '2000000',
    currency: CurrencyEnum.Eur,
    month: DateTime.now().minus({ month: 7 }).startOf('month').toISO(),
  },
  {
    amountCents: '1200000',
    currency: CurrencyEnum.Eur,
    month: DateTime.now().minus({ month: 8 }).startOf('month').toISO(),
  },
  {
    amountCents: '1200000',
    currency: CurrencyEnum.Eur,
    month: DateTime.now().minus({ month: 9 }).startOf('month').toISO(),
  },
  {
    amountCents: '800000',
    currency: CurrencyEnum.Eur,
    month: DateTime.now().minus({ month: 10 }).startOf('month').toISO(),
  },
  {
    amountCents: '200000',
    currency: CurrencyEnum.Eur,
    month: DateTime.now().minus({ month: 11 }).startOf('month').toISO(),
  },
  {
    amountCents: '0',
    currency: CurrencyEnum.Eur,
    month: DateTime.now().minus({ month: 12 }).startOf('month').toISO(),
  },
]

export const InvoiceCollectionsFakeData: TInvoiceCollectionsDataResult = [
  {
    paymentStatus: InvoicePaymentStatusTypeEnum.Succeeded,
    invoicesCount: '6',
    amountCents: '4197400',
    currency: CurrencyEnum.Eur,
    month: '2023-11-01T00:00:00Z',
  },
  {
    paymentStatus: InvoicePaymentStatusTypeEnum.Failed,
    invoicesCount: '6',
    amountCents: '4197400',
    currency: CurrencyEnum.Eur,
    month: '2023-11-01T00:00:00Z',
  },
  {
    paymentStatus: InvoicePaymentStatusTypeEnum.Pending,
    invoicesCount: '6',
    amountCents: '4197400',
    currency: CurrencyEnum.Eur,
    month: '2023-11-01T00:00:00Z',
  },
]

export const InvoicedUsageFakeData: TGetInvoicedUsagesQuery = [
  {
    amountCents: '42500',
    month: DateTime.now().startOf('month').toISO(),
    currency: CurrencyEnum.Eur,
    code: 'sum_bm',
  },
  {
    amountCents: '45100',
    month: DateTime.now().startOf('month').toISO(),
    currency: CurrencyEnum.Eur,
    code: 'count_bm',
  },
  {
    amountCents: '43130',
    month: DateTime.now().startOf('month').toISO(),
    currency: CurrencyEnum.Eur,
    code: 'count_bm_two_dimensions',
  },
  {
    amountCents: '42300',
    month: DateTime.now().startOf('month').toISO(),
    currency: CurrencyEnum.Eur,
    code: 'count_bm_one_dimension',
  },
  {
    amountCents: '42300',
    month: DateTime.now().startOf('month').toISO(),
    currency: CurrencyEnum.Eur,
    code: 'user_seats',
  },
  {
    amountCents: '40020',
    month: DateTime.now().startOf('month').toISO(),
    currency: CurrencyEnum.Eur,
    code: 'gb',
  },
]

export const subscriptionLifetimeUsageFakeData: TSubscriptionLifetimeUsageDataResult = {
  lastThresholdAmountCents: '100000',
  nextThresholdAmountCents: '200000',
  totalUsageAmountCents: '300000',
  totalUsageFromDatetime: DateTime.now().minus({ month: 12 }).toISO(),
  totalUsageToDatetime: DateTime.now().toISO(),
}
