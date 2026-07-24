import { screen } from '@testing-library/react'

import type { WalletPreviewData } from '~/core/serializers/buildWalletPreviewData'
import { LocaleEnum } from '~/core/translations'
import { CurrencyEnum } from '~/generated/graphql'
import type { TranslateFunc } from '~/hooks/core/useInternationalization'
import { render } from '~/test-utils'

import { WALLET_PREVIEW_TABLE_TEST_ID, WalletPreviewTable } from '../WalletPreviewTable'

const translate = ((key: string, data?: Record<string, unknown>) => {
  const map: Record<string, string> = {
    // headers + footer
    text_178222304861526lr006rl38: 'Name',
    text_17822230486157n020egd1q3: 'Billed',
    text_1782223048615rmf57qlo7ka: 'Units',
    text_17822230486157sa0x6qnkwn: 'Price',
    text_17804985042422iw5hwj0u2v: 'All prices exclude any applicable taxes',
    // labels
    text_1784883525803ne7j9k70cy2: 'Free credits',
    text_17848821795797viukiwsvkd: 'Recurring top-up',
    text_1784882179579jrpo7xq992a: 'One-time',
    text_1784882179579muknx9hd8bw: 'Free',
    text_1784882179579v64foe5ytas: `Expires ${data?.date}`,
    text_1784882179580txsoj9pf51f: `Applies to ${data?.scope}`,
    text_1784882179580hb24cd5e4jc: 'Applies to all fees',
    text_17848821795809xtwzsq7ot9: 'On low balance',
    text_178488217958075syit8qyd5: `Up to ${data?.count}`,
    // wallet-owned interval + fee-type keys
    text_1784883525803lunzztlh547: 'Monthly',
    text_1784883525803oz45f5x0ier: 'Usage charges',
    // block label — empty-name fallback
    text_1783352692386xocpgvrz3na: 'Credits',
  }

  return map[key] ?? key
}) as unknown as TranslateFunc

const fullData: WalletPreviewData = {
  name: 'Prepaid credits',
  currency: CurrencyEnum.Usd,
  expirationAt: '2026-09-16',
  appliesTo: {
    feeTypes: ['charge'] as WalletPreviewData['appliesTo']['feeTypes'],
    billableMetricCodes: ['api_calls'],
  },
  rows: [
    {
      kind: 'paid',
      isPrimary: true,
      billed: { type: 'oneTime' },
      units: { type: 'count', value: 100 },
      price: { type: 'displayAmount', amount: '100' },
    },
    {
      kind: 'free',
      isPrimary: false,
      billed: { type: 'none' },
      units: { type: 'count', value: 20 },
      price: { type: 'free' },
    },
    {
      kind: 'recurring',
      isPrimary: false,
      billed: { type: 'interval', interval: 'monthly' },
      units: { type: 'count', value: 50 },
      price: { type: 'displayAmount', amount: '50' },
    },
    {
      kind: 'recurring',
      isPrimary: false,
      billed: { type: 'threshold' },
      units: { type: 'upTo', value: 200 },
      price: { type: 'empty' },
    },
  ],
}

const renderTable = (data: WalletPreviewData) =>
  render(
    <WalletPreviewTable
      data={data}
      translate={translate}
      currency={CurrencyEnum.Usd}
      locale={LocaleEnum.en}
    />,
  )

describe('WalletPreviewTable', () => {
  it('renders the table and column headers', () => {
    renderTable(fullData)

    expect(screen.getByTestId(WALLET_PREVIEW_TABLE_TEST_ID)).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Billed')).toBeInTheDocument()
    expect(screen.getByText('Units')).toBeInTheDocument()
    expect(screen.getByText('Price')).toBeInTheDocument()
  })

  it('renders the wallet name with an expiration + scope caption on the primary row', () => {
    renderTable(fullData)

    expect(screen.getByText('Prepaid credits')).toBeInTheDocument()
    expect(
      screen.getByText('Expires Sep 16, 2026 · Applies to Usage charges, api_calls'),
    ).toBeInTheDocument()
  })

  it('renders the paid row with One-time billing and a formatted price', () => {
    renderTable(fullData)

    expect(screen.getByText('One-time')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('$100.00')).toBeInTheDocument()
  })

  it('renders the free credits row', () => {
    renderTable(fullData)

    expect(screen.getByText('Free credits')).toBeInTheDocument()
    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('renders recurring rows with interval and threshold billing', () => {
    renderTable(fullData)

    expect(screen.getAllByText('Recurring top-up')).toHaveLength(2)
    expect(screen.getByText('Monthly')).toBeInTheDocument()
    expect(screen.getByText('$50.00')).toBeInTheDocument()
    expect(screen.getByText('On low balance')).toBeInTheDocument()
    expect(screen.getByText('Up to 200')).toBeInTheDocument()
  })

  it('renders the tax footer', () => {
    renderTable(fullData)

    expect(screen.getByText('All prices exclude any applicable taxes')).toBeInTheDocument()
  })

  it('falls back to "all fees" when the scope is empty', () => {
    renderTable({
      ...fullData,
      expirationAt: null,
      appliesTo: { feeTypes: [], billableMetricCodes: [] },
    })

    expect(screen.getByText('Applies to all fees')).toBeInTheDocument()
  })

  it('falls back to the block label when the wallet name is empty', () => {
    renderTable({ ...fullData, name: '' })

    expect(screen.getByText('Credits')).toBeInTheDocument()
  })
})
