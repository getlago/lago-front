import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactElement, ReactNode } from 'react'

import { addToast } from '~/core/apolloClient'
import {
  AggregationTypeEnum,
  CurrencyEnum,
  ProductForRateCardDrawerFragment,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RateCardForDrawerFragment,
  RateCardRegroupPaidFeesEnum,
  UpdateRateCardDocument,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  RATE_CARD_DRAWER_SUBMIT_EDIT_KEY,
  RATE_CARD_DRAWER_TITLE_EDIT_KEY,
  RATE_CARD_EDIT_SUCCESS_TOAST_KEY,
  useRateCardDrawer,
} from '../useRateCardDrawer'

type CapturedDrawerArgs = {
  title?: ReactNode
  children?: ReactNode
  mainAction?: ReactNode
  secondaryAction?: ReactNode
  form?: { id: string; submit: () => void | Promise<void> }
}

let lastDrawerArgs: CapturedDrawerArgs | null = null
const mockOpen = jest.fn((args: CapturedDrawerArgs) => {
  lastDrawerArgs = args
})
const mockClose = jest.fn()
const mockNavigate = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useNavigate: () => mockNavigate,
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: () => ({ organizationSlug: 'acme' }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, vars?: Record<string, unknown>) =>
      vars ? [key, ...Object.values(vars)].join('|') : key,
  }),
}))

jest.mock('../RateCardDrawerContent', () => ({
  RateCardDrawerContent: ({
    form,
  }: {
    form: {
      setFieldValue: (name: string, value: unknown) => void
    }
  }) => (
    <>
      <button data-test="clear-description" onClick={() => form.setFieldValue('description', '')}>
        clear description
      </button>
      <button
        data-test="clear-pricing-unit"
        onClick={() => form.setFieldValue('pricingUnit', undefined)}
      >
        clear pricing unit
      </button>
    </>
  ),
}))

const rateCardFixture: RateCardForDrawerFragment = {
  id: 'rc-1',
  name: 'Metered API',
  code: 'metered_api',
  description: 'Old description',
  currency: CurrencyEnum.Usd,
  appliedPricingUnitCode: null,
  billingTiming: RateCardBillingTimingEnum.Advance,
  displayOnInvoice: false,
  regroupPaidFees: RateCardRegroupPaidFeesEnum.Invoice,
  proration: true,
  attachedToPlanOrSubscription: false,
  attachedToSubscriptions: false,
  ratesCount: 0,
  product: {
    id: 'pi-1',
    name: 'Metered API',
    code: 'metered_api',
    productType: ProductTypeEnum.Usage,
    billableMetric: {
      id: 'bm-1',
      name: 'API calls',
      code: 'api_calls',
      aggregationType: AggregationTypeEnum.CountAgg,
      recurring: true,
    },
  },
  productFilter: null,
}

const updateRateCardMock = (
  captureInput: (input: Record<string, unknown>) => void,
): MockedResponse => ({
  request: { query: UpdateRateCardDocument },
  variableMatcher: (vars) => {
    captureInput(vars?.input)
    return vars?.input?.id === 'rc-1'
  },
  result: { data: { updateRateCard: { ...rateCardFixture, name: 'Metered API v2' } } },
})

const renderDrawerHook = (mocks: MockedResponse[] = []) =>
  renderHook(() => useRateCardDrawer(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
        defaultOptions={{ mutate: { errorPolicy: 'all' } }}
      >
        {children}
      </MockedProvider>
    ),
  })

const submit = async () => {
  await act(async () => {
    await lastDrawerArgs?.form?.submit()
  })
}

describe('useRateCardDrawer edit flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    lastDrawerArgs = null
  })

  it('opens with the edit title, no create-more control and the save label', () => {
    const { result } = renderDrawerHook()

    act(() => result.current.openDrawer({ rateCard: rateCardFixture }))

    expect(lastDrawerArgs?.title).toBe(RATE_CARD_DRAWER_TITLE_EDIT_KEY)
    expect(lastDrawerArgs?.secondaryAction).toBeUndefined()

    render(<>{lastDrawerArgs?.mainAction}</>)

    expect(screen.getByRole('button', { name: RATE_CARD_DRAWER_SUBMIT_EDIT_KEY })).toHaveAttribute(
      'type',
      'submit',
    )
  })

  it('updates the editable fields, closes and toasts without navigating', async () => {
    let capturedInput: Record<string, unknown> = {}
    const { result } = renderDrawerHook([updateRateCardMock((input) => (capturedInput = input))])

    act(() => result.current.openDrawer({ rateCard: rateCardFixture }))
    await submit()

    await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))

    expect(capturedInput).toMatchObject({
      id: 'rc-1',
      name: 'Metered API',
      description: 'Old description',
      billingTiming: RateCardBillingTimingEnum.Advance,
      proration: true,
      currency: CurrencyEnum.Usd,
      displayOnInvoice: false,
      regroupPaidFees: RateCardRegroupPaidFeesEnum.Invoice,
      code: 'metered_api',
    })
    // Create-only fields must never be sent on update.
    expect(capturedInput).not.toHaveProperty('productId')
    expect(capturedInput).not.toHaveProperty('productFilterId')

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(addToast).toHaveBeenCalledWith({
      severity: 'success',
      message: RATE_CARD_EDIT_SUCCESS_TOAST_KEY,
    })
  })

  it('serializes a cleared description as null', async () => {
    let capturedInput: Record<string, unknown> = {}
    const { result } = renderDrawerHook([updateRateCardMock((input) => (capturedInput = input))])

    act(() => result.current.openDrawer({ rateCard: rateCardFixture }))
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        {lastDrawerArgs?.children}
      </MockedProvider>,
    )
    await userEvent.click(screen.getByTestId('clear-description'))
    await submit()

    await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))

    expect(capturedInput.description).toBeNull()
  })

  it('serializes a removed pricing unit as null', async () => {
    let capturedInput: Record<string, unknown> = {}
    const { result } = renderDrawerHook([updateRateCardMock((input) => (capturedInput = input))])

    act(() =>
      result.current.openDrawer({
        rateCard: { ...rateCardFixture, appliedPricingUnitCode: 'credits' },
      }),
    )
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        {lastDrawerArgs?.children}
      </MockedProvider>,
    )
    await userEvent.click(screen.getByTestId('clear-pricing-unit'))
    await submit()

    await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))

    expect(capturedInput.appliedPricingUnitCode).toBeNull()
  })

  // Locking follows `attached_to_plan_or_subscription?`; the narrower subscriptions flag
  // must not freeze anything on its own.
  it('leaves everything editable when only the subscriptions flag is set', () => {
    const { result } = renderDrawerHook()

    act(() =>
      result.current.openDrawer({
        rateCard: {
          ...rateCardFixture,
          attachedToPlanOrSubscription: false,
          attachedToSubscriptions: true,
        },
      }),
    )

    const contentProps = (lastDrawerArgs?.children as ReactElement)?.props

    expect(contentProps?.isAttached).toBe(false)
    expect(contentProps?.disableCodeInput).toBe(false)
  })

  // `LOCKED_WITH_RATES` keys off `rate_card.rates.exists?`, not off any attachment.
  it('flags the billing-semantic fields as frozen as soon as the card has a rate', () => {
    const { result } = renderDrawerHook()

    act(() => result.current.openDrawer({ rateCard: { ...rateCardFixture, ratesCount: 2 } }))

    const contentProps = (lastDrawerArgs?.children as ReactElement)?.props

    expect(contentProps?.hasRates).toBe(true)
    expect(contentProps?.isAttached).toBe(false)
  })

  it('leaves them editable while the card has no rate, even when attached', () => {
    const { result } = renderDrawerHook()

    act(() =>
      result.current.openDrawer({
        rateCard: { ...rateCardFixture, attachedToPlanOrSubscription: true, ratesCount: 0 },
      }),
    )

    const contentProps = (lastDrawerArgs?.children as ReactElement)?.props

    expect(contentProps?.hasRates).toBe(false)
    expect(contentProps?.isAttached).toBe(true)
  })

  // `RateCards::UpdateService` rejects a changed code on `attached_to_plan_or_subscription?`,
  // so the input follows that flag rather than the narrower subscriptions one.
  it('locks the code input as soon as the rate card sits in a plan', () => {
    const { result } = renderDrawerHook()

    act(() =>
      result.current.openDrawer({
        rateCard: { ...rateCardFixture, attachedToPlanOrSubscription: true },
      }),
    )

    const contentProps = (lastDrawerArgs?.children as ReactElement)?.props

    expect(contentProps?.disableCodeInput).toBe(true)
  })

  it('keeps the code input editable on an unattached edit', () => {
    const { result } = renderDrawerHook()

    act(() => result.current.openDrawer({ rateCard: rateCardFixture }))

    const contentProps = (lastDrawerArgs?.children as ReactElement)?.props

    expect(contentProps?.isAttached).toBe(false)
    expect(contentProps?.disableCodeInput).toBe(false)
  })
})

describe('rate card attachment metadata', () => {
  const product: ProductForRateCardDrawerFragment = {
    id: 'attached-usage',
    name: 'Recurring API',
    productType: ProductTypeEnum.Usage,
    billableMetric: {
      id: 'metric-1',
      aggregationType: AggregationTypeEnum.SumAgg,
      recurring: true,
    },
  }

  it.each([
    { attachToProduct: product },
    { attachToProductFilter: { id: 'filter-1', name: 'Europe', product } },
  ])('passes complete metadata for an attached product or filter', (attachment) => {
    const { result } = renderDrawerHook()

    act(() => result.current.openDrawer(attachment))

    expect((lastDrawerArgs?.children as ReactElement).props.productSeed).toEqual({
      value: 'attached-usage',
      label: 'Recurring API',
      productType: ProductTypeEnum.Usage,
      aggregationType: AggregationTypeEnum.SumAgg,
      recurring: true,
    })
  })
})
