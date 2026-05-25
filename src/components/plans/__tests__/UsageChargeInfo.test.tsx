import { render, screen } from '@testing-library/react'

import {
  ChargeModelEnum,
  CurrencyEnum,
  PlanInterval,
  RegroupPaidFeesEnum,
} from '~/generated/graphql'

import { UsageChargeInfo, UsageChargeInfoCharge } from '../UsageChargeInfo'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (k: string) => k }),
}))

const buildCharge = (overrides: Partial<UsageChargeInfoCharge> = {}): UsageChargeInfoCharge => ({
  __typename: 'Charge',
  id: 'charge_1',
  chargeModel: ChargeModelEnum.Standard,
  invoiceDisplayName: null,
  invoiceable: true,
  payInAdvance: false,
  prorated: false,
  minAmountCents: '0',
  regroupPaidFees: null,
  properties: { amount: '10', graduatedRanges: null, volumeRanges: null } as never,
  filters: [],
  appliedPricingUnit: null,
  taxes: [],
  billableMetric: {
    __typename: 'BillableMetric',
    id: 'bm_1',
    name: 'API calls',
    code: 'api_calls',
    recurring: false,
    filters: [],
  } as never,
  ...overrides,
})

describe('UsageChargeInfo', () => {
  it('renders standard charge amount via PlanDetailsChargeWrapperSwitch', () => {
    render(
      <UsageChargeInfo
        charge={buildCharge()}
        currency={CurrencyEnum.Usd}
        planInterval={PlanInterval.Monthly}
        planTaxes={[]}
      />,
    )
    expect(screen.getByText('text_65201b8216455901fe273dd5')).toBeInTheDocument()
  })

  it('does not render a filter sub-accordion when charge has no filters', () => {
    render(
      <UsageChargeInfo
        charge={buildCharge({ filters: [] })}
        currency={CurrencyEnum.Usd}
        planInterval={PlanInterval.Monthly}
        planTaxes={[]}
      />,
    )
    expect(screen.queryByText('text_64e620bca31226337ffc62ad')).not.toBeInTheDocument()
  })

  it('renders the filter sub-accordion when charge has filters', () => {
    const charge = buildCharge({
      filters: [
        {
          __typename: 'ChargeFilter',
          id: 'flt_1',
          invoiceDisplayName: 'Region: EU',
          values: ['{"region":"eu"}'] as never,
          properties: { amount: '15', graduatedRanges: null, volumeRanges: null } as never,
        } as never,
      ],
    })
    render(
      <UsageChargeInfo
        charge={charge}
        currency={CurrencyEnum.Usd}
        planInterval={PlanInterval.Monthly}
        planTaxes={[]}
      />,
    )
    expect(screen.getByText('Region: EU')).toBeInTheDocument()
  })

  it('renders "Pay later" when payInAdvance is false', () => {
    render(
      <UsageChargeInfo
        charge={buildCharge({ payInAdvance: false })}
        currency={CurrencyEnum.Usd}
        planInterval={PlanInterval.Monthly}
        planTaxes={[]}
      />,
    )
    expect(screen.getByText('text_646e2d0cc536351b62ba6f8c')).toBeInTheDocument()
  })

  it('falls back to invoiced strategy when payInAdvance + invoiceable', () => {
    render(
      <UsageChargeInfo
        charge={buildCharge({ payInAdvance: true, invoiceable: true })}
        currency={CurrencyEnum.Usd}
        planInterval={PlanInterval.Monthly}
        planTaxes={[]}
      />,
    )
    expect(screen.getByText('text_66968fba80f8f89a8aefdebf')).toBeInTheDocument()
  })

  it('uses regrouped invoice strategy when payInAdvance + non-invoiceable + regroup=invoice', () => {
    render(
      <UsageChargeInfo
        charge={buildCharge({
          payInAdvance: true,
          invoiceable: false,
          regroupPaidFees: RegroupPaidFeesEnum.Invoice,
        })}
        currency={CurrencyEnum.Usd}
        planInterval={PlanInterval.Monthly}
        planTaxes={[]}
      />,
    )
    expect(screen.getByText('text_66968fba80f8f89a8aefdec0')).toBeInTheDocument()
  })

  it('uses plan taxes when charge has no taxes', () => {
    render(
      <UsageChargeInfo
        charge={buildCharge({ taxes: [] })}
        currency={CurrencyEnum.Usd}
        planInterval={PlanInterval.Monthly}
        planTaxes={[
          { __typename: 'Tax', id: 't1', name: 'VAT', code: 'vat', rate: 20 } as never,
        ]}
      />,
    )
    expect(screen.getByText(/VAT/)).toBeInTheDocument()
  })
})
