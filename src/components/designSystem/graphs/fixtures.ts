import { DateTime } from 'luxon'

import { REVENUE_STREAMS_GRAPH_COLORS } from '~/components/designSystem/graphs/const'
import { TInvoiceCollectionsDataResult } from '~/components/graphs/Invoices'
import { TGetInvoicedUsagesQuery } from '~/components/graphs/Usage'
import { TAreaChartDataResult } from '~/components/graphs/utils'
import { TSubscriptionUsageLifetimeGraphDataResult } from '~/components/subscriptions/SubscriptionUsageLifetimeGraph'
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

export const subscriptionLifetimeUsageFakeData: TSubscriptionUsageLifetimeGraphDataResult = {
  lastThresholdAmountCents: '100000',
  nextThresholdAmountCents: '200000',
  totalUsageAmountCents: '125000',
  totalUsageFromDatetime: DateTime.now().minus({ month: 12 }).toISO(),
  totalUsageToDatetime: DateTime.now().toISO(),
}

export const multipleLineChartFakeData = [
  {
    subscriptionFeeAmountCents: '20',
    usageBasedFeeAmountCents: '16',
    commitmentFeeAmountCents: '10',
    oneOffFeeAmountCents: '10',
    amountCurrency: CurrencyEnum.Eur,
    startOfPeriodDt: '2024-01-01',
    endOfPeriodDt: '2024-01-31',
    couponsAmountCents: '0',
    grossRevenueAmountCents: '0',
    netRevenueAmountCents: '0',
  },
  {
    subscriptionFeeAmountCents: '35',
    usageBasedFeeAmountCents: '23',
    commitmentFeeAmountCents: '20',
    oneOffFeeAmountCents: '12',
    amountCurrency: CurrencyEnum.Eur,
    startOfPeriodDt: '2024-02-01',
    endOfPeriodDt: '2024-02-29',
    couponsAmountCents: '0',
    grossRevenueAmountCents: '0',
    netRevenueAmountCents: '0',
  },
  {
    subscriptionFeeAmountCents: '50',
    usageBasedFeeAmountCents: '45',
    commitmentFeeAmountCents: '30',
    oneOffFeeAmountCents: '27',
    amountCurrency: CurrencyEnum.Eur,
    startOfPeriodDt: '2024-03-01',
    endOfPeriodDt: '2024-03-31',
    couponsAmountCents: '0',
    grossRevenueAmountCents: '0',
    netRevenueAmountCents: '0',
  },
  {
    subscriptionFeeAmountCents: '50',
    usageBasedFeeAmountCents: '45',
    commitmentFeeAmountCents: '30',
    oneOffFeeAmountCents: '28',
    amountCurrency: CurrencyEnum.Eur,
    startOfPeriodDt: '2024-04-01',
    endOfPeriodDt: '2024-04-30',
    couponsAmountCents: '0',
    grossRevenueAmountCents: '0',
    netRevenueAmountCents: '0',
  },
  {
    subscriptionFeeAmountCents: '50',
    usageBasedFeeAmountCents: '55',
    commitmentFeeAmountCents: '30',
    oneOffFeeAmountCents: '35',
    amountCurrency: CurrencyEnum.Eur,
    startOfPeriodDt: '2024-05-01',
    endOfPeriodDt: '2024-05-31',
    couponsAmountCents: '0',
    grossRevenueAmountCents: '0',
    netRevenueAmountCents: '0',
  },
  {
    subscriptionFeeAmountCents: '55',
    usageBasedFeeAmountCents: '50',
    commitmentFeeAmountCents: '35',
    oneOffFeeAmountCents: '36',
    amountCurrency: CurrencyEnum.Eur,
    startOfPeriodDt: '2024-06-01',
    endOfPeriodDt: '2024-06-30',
    couponsAmountCents: '0',
    grossRevenueAmountCents: '0',
    netRevenueAmountCents: '0',
  },
  {
    subscriptionFeeAmountCents: '60',
    usageBasedFeeAmountCents: '55',
    commitmentFeeAmountCents: '47',
    oneOffFeeAmountCents: '40',
    amountCurrency: CurrencyEnum.Eur,
    startOfPeriodDt: '2024-07-01',
    endOfPeriodDt: '2024-07-31',
    couponsAmountCents: '0',
    grossRevenueAmountCents: '0',
    netRevenueAmountCents: '0',
  },
  {
    subscriptionFeeAmountCents: '65',
    usageBasedFeeAmountCents: '55',
    commitmentFeeAmountCents: '50',
    oneOffFeeAmountCents: '44',
    amountCurrency: CurrencyEnum.Eur,
    startOfPeriodDt: '2024-08-01',
    endOfPeriodDt: '2024-08-31',
    couponsAmountCents: '0',
    grossRevenueAmountCents: '0',
    netRevenueAmountCents: '0',
  },
  {
    subscriptionFeeAmountCents: '80',
    usageBasedFeeAmountCents: '65',
    commitmentFeeAmountCents: '50',
    oneOffFeeAmountCents: '48',
    amountCurrency: CurrencyEnum.Eur,
    startOfPeriodDt: '2024-09-01',
    endOfPeriodDt: '2024-09-30',
    couponsAmountCents: '0',
    grossRevenueAmountCents: '0',
    netRevenueAmountCents: '0',
  },
  {
    subscriptionFeeAmountCents: '75',
    usageBasedFeeAmountCents: '62',
    commitmentFeeAmountCents: '55',
    oneOffFeeAmountCents: '52',
    amountCurrency: CurrencyEnum.Eur,
    startOfPeriodDt: '2024-10-01',
    endOfPeriodDt: '2024-10-31',
    couponsAmountCents: '0',
    grossRevenueAmountCents: '0',
    netRevenueAmountCents: '0',
  },
  {
    subscriptionFeeAmountCents: '80',
    usageBasedFeeAmountCents: '70',
    commitmentFeeAmountCents: '60',
    oneOffFeeAmountCents: '50',
    amountCurrency: CurrencyEnum.Eur,
    startOfPeriodDt: '2024-11-01',
    endOfPeriodDt: '2024-11-30',
    couponsAmountCents: '0',
    grossRevenueAmountCents: '0',
    netRevenueAmountCents: '0',
  },
  {
    subscriptionFeeAmountCents: '75',
    usageBasedFeeAmountCents: '70',
    commitmentFeeAmountCents: '55',
    oneOffFeeAmountCents: '52',
    amountCurrency: CurrencyEnum.Eur,
    startOfPeriodDt: '2024-12-01',
    endOfPeriodDt: '2024-12-31',
    couponsAmountCents: '0',
    grossRevenueAmountCents: '0',
    netRevenueAmountCents: '0',
  },
  {
    subscriptionFeeAmountCents: '99',
    usageBasedFeeAmountCents: '85',
    commitmentFeeAmountCents: '75',
    oneOffFeeAmountCents: '60',
    amountCurrency: CurrencyEnum.Eur,
    startOfPeriodDt: '2025-01-01',
    endOfPeriodDt: '2025-01-31',
    couponsAmountCents: '0',
    grossRevenueAmountCents: '0',
    netRevenueAmountCents: '0',
  },
]

export const multipleLineChartFakeLines = [
  {
    hideOnGraph: false,
    dataKey: 'subscriptionFeeAmountCents',
    colorHex: REVENUE_STREAMS_GRAPH_COLORS.subscriptionFeeAmountCents,
    name: '',
  },
  {
    hideOnGraph: false,
    dataKey: 'usageBasedFeeAmountCents',
    colorHex: REVENUE_STREAMS_GRAPH_COLORS.usageBasedFeeAmountCents,
    name: '',
  },
  {
    hideOnGraph: false,
    dataKey: 'commitmentFeeAmountCents',
    colorHex: REVENUE_STREAMS_GRAPH_COLORS.commitmentFeeAmountCents,
    name: '',
  },
  {
    hideOnGraph: false,
    dataKey: 'oneOffFeeAmountCents',
    colorHex: REVENUE_STREAMS_GRAPH_COLORS.oneOffFeeAmountCents,
    name: '',
  },
]

export const multipleLineChartLoadingFakeData = [
  {
    amountCurrency: CurrencyEnum.Eur,
    startOfPeriodDt: '2024-01-01',
    subscriptionFeeAmountCents: '0',
  },
  {
    amountCurrency: CurrencyEnum.Eur,
    startOfPeriodDt: '2024-02-01',
    subscriptionFeeAmountCents: '545',
  },
  {
    amountCurrency: CurrencyEnum.Eur,
    startOfPeriodDt: '2024-03-01',
    subscriptionFeeAmountCents: '550',
  },
  {
    amountCurrency: CurrencyEnum.Eur,
    startOfPeriodDt: '2024-04-01',
    subscriptionFeeAmountCents: '575',
  },
  {
    amountCurrency: CurrencyEnum.Eur,
    startOfPeriodDt: '2024-05-01',
    subscriptionFeeAmountCents: '650',
  },
  {
    amountCurrency: CurrencyEnum.Eur,
    startOfPeriodDt: '2024-06-01',
    subscriptionFeeAmountCents: '675',
  },
  {
    amountCurrency: CurrencyEnum.Eur,
    startOfPeriodDt: '2024-07-01',
    subscriptionFeeAmountCents: '725',
  },
  {
    amountCurrency: CurrencyEnum.Eur,
    startOfPeriodDt: '2024-08-01',
    subscriptionFeeAmountCents: '640',
  },
  {
    amountCurrency: CurrencyEnum.Eur,
    startOfPeriodDt: '2024-09-01',
    subscriptionFeeAmountCents: '700',
  },
  {
    amountCurrency: CurrencyEnum.Eur,
    startOfPeriodDt: '2024-10-01',
    subscriptionFeeAmountCents: '850',
  },
  {
    amountCurrency: CurrencyEnum.Eur,
    startOfPeriodDt: '2024-11-01',
    subscriptionFeeAmountCents: '900',
  },
  {
    amountCurrency: CurrencyEnum.Eur,
    startOfPeriodDt: '2024-12-01',
    subscriptionFeeAmountCents: '875',
  },
  {
    amountCurrency: CurrencyEnum.Eur,
    startOfPeriodDt: '2025-01-01',
    subscriptionFeeAmountCents: '999',
  },
]

export const multipleLineChartLoadingFakeLines = [
  {
    dataKey: 'subscriptionFeeAmountCents',
    colorHex: '#E7EAEE',
    name: 'Gross Revenue',
    hideOnGraph: false,
  },
]
