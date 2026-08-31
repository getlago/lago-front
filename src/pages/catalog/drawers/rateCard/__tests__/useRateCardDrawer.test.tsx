import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactElement, ReactNode } from 'react'

import { addToast } from '~/core/apolloClient'
import {
  AggregationTypeEnum,
  CurrencyEnum,
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

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
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
    <button data-test="clear-description" onClick={() => form.setFieldValue('description', '')}>
      clear
    </button>
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
  walletTargetable: true,
  attachedToPlanOrSubscription: false,
  attachedToSubscriptions: false,
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

  it('updates editable fields only, closes and toasts without navigating', async () => {
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
      walletTargetable: true,
      currency: CurrencyEnum.Usd,
      displayOnInvoice: false,
      regroupPaidFees: RateCardRegroupPaidFeesEnum.Invoice,
    })
    // Create-only fields must never be sent on update.
    expect(capturedInput).not.toHaveProperty('code')
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

  it('passes locked flags to the content when the rate card is attached', () => {
    const { result } = renderDrawerHook()

    act(() =>
      result.current.openDrawer({
        rateCard: { ...rateCardFixture, attachedToSubscriptions: true },
      }),
    )

    const contentProps = (lastDrawerArgs?.children as ReactElement)?.props

    expect(contentProps?.isLocked).toBe(true)
    expect(contentProps?.disableCodeInput).toBe(true)
  })

  it('locks only the code input (not the whole form) on an unattached edit', () => {
    const { result } = renderDrawerHook()

    act(() => result.current.openDrawer({ rateCard: rateCardFixture }))

    const contentProps = (lastDrawerArgs?.children as ReactElement)?.props

    expect(contentProps?.isLocked).toBe(false)
    expect(contentProps?.disableCodeInput).toBe(true)
  })
})
