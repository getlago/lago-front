import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphQLError } from 'graphql'
import { ReactElement, ReactNode } from 'react'

import { CREATE_MORE_SWITCH_TEST_ID } from '~/components/drawers/createMore/CreateMoreControl'
import { addToast } from '~/core/apolloClient'
import {
  AggregationTypeEnum,
  CreateRateCardDocument,
  CurrencyEnum,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RateCardRegroupPaidFeesEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  RATE_CARD_CREATE_LINKED_TOAST_KEY,
  RATE_CARD_CREATE_SUCCESS_TOAST_KEY,
  useRateCardDrawer,
} from '../useRateCardDrawer'

type CapturedDrawerArgs = {
  title?: ReactNode
  children?: ReactNode
  mainAction?: ReactNode
  secondaryAction?: ReactNode
  form?: { id: string; submit: () => void | Promise<void> }
  closeOnSubmitSuccess?: boolean
}

let lastDrawerArgs: CapturedDrawerArgs | null = null
const mockOpen = jest.fn((args: CapturedDrawerArgs) => {
  lastDrawerArgs = args
})
const mockClose = jest.fn()
const mockNavigate = jest.fn()

// Mock the NiceModal-backed drawer hook so Jest never loads the drawer stack
// (drawerStack.ts uses import.meta and crashes Jest) and we can capture the
// args the hook passes to `open`.
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

// Replace the drawer body (imports charge components + import.meta-backed
// modules) with a control that seeds the form fields directly, so the create
// flow (mutation input serialization, create-more, duplicate code) is exercised
// without driving the real comboboxes.
jest.mock('../RateCardDrawerContent', () => ({
  RateCardDrawerContent: ({
    form,
  }: {
    form: {
      setFieldValue: (name: string, value: unknown) => void
    }
  }) => (
    <>
      <button
        data-test="seed-base"
        onClick={() => {
          form.setFieldValue('name', 'Metered API')
          form.setFieldValue('code', 'metered_api')
          form.setFieldValue('productId', 'pi-1')
          // Literal enum runtime values: the jest.mock factory is hoisted and
          // cannot reference the imported enums.
          form.setFieldValue('currency', 'USD')
        }}
      >
        seed base
      </button>
      <button
        data-test="seed-advance"
        onClick={() => {
          form.setFieldValue('billingTiming', 'advance')
          form.setFieldValue('invoicingStrategy', 'regroupPaidFees')
        }}
      >
        seed advance
      </button>
      <button
        data-test="seed-pricing-unit"
        onClick={() => {
          form.setFieldValue('pricingUnit', 'credits')
        }}
      >
        seed pricing unit
      </button>
      <button
        data-test="seed-taxes"
        onClick={() => {
          form.setFieldValue('taxes', [{ id: 'tax-1', code: 'vat_20', name: 'VAT', rate: 20 }])
        }}
      >
        seed taxes
      </button>
    </>
  ),
}))

const rateCardResult = {
  id: 'rc-1',
  name: 'Metered API',
  code: 'metered_api',
  description: null,
  currency: CurrencyEnum.Usd,
  appliedPricingUnitCode: null,
  billingTiming: RateCardBillingTimingEnum.Arrears,
  displayOnInvoice: true,
  regroupPaidFees: null,
  proration: false,
  walletTargetable: false,
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
      recurring: false,
    },
  },
  productFilter: null,
  taxes: [],
}

const createRateCardMock = (
  captureInput: (input: Record<string, unknown>) => void,
  overrides: Partial<MockedResponse['result']> = {},
): MockedResponse => ({
  request: { query: CreateRateCardDocument },
  variableMatcher: (vars) => {
    captureInput(vars?.input)
    return vars?.input?.name === 'Metered API' && vars?.input?.code === 'metered_api'
  },
  result: {
    data: { createRateCard: { ...rateCardResult } },
    ...overrides,
  },
})

const duplicateCodeError = new GraphQLError('Value already exists', {
  extensions: { code: 'value_already_exist', details: { code: ['value_already_exist'] } },
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

const renderDrawerBody = () =>
  render(
    <MockedProvider mocks={[]} addTypename={false}>
      {lastDrawerArgs?.children}
    </MockedProvider>,
  )

const submit = async () => {
  await act(async () => {
    await lastDrawerArgs?.form?.submit()
  })
}

describe('useRateCardDrawer create flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    lastDrawerArgs = null
  })

  it('opens create mode with the create-more control and submit button', () => {
    const { result } = renderDrawerHook()

    act(() => result.current.openDrawer())

    expect(mockOpen).toHaveBeenCalledTimes(1)
    expect(lastDrawerArgs?.form?.id).toBe('rateCardForm')
    expect(lastDrawerArgs?.closeOnSubmitSuccess).toBe(false)
    expect(lastDrawerArgs?.secondaryAction).toBeDefined()

    render(<>{lastDrawerArgs?.mainAction}</>)

    expect(screen.getByRole('button', { name: 'text_1784925227817k72h5sd0wyu' })).toHaveAttribute(
      'type',
      'submit',
    )
  })

  it('creates an arrears rate card priced in a currency, closes, navigates and toasts', async () => {
    let capturedInput: Record<string, unknown> = {}
    const { result } = renderDrawerHook([createRateCardMock((input) => (capturedInput = input))])

    act(() => result.current.openDrawer())
    renderDrawerBody()
    await userEvent.click(screen.getByTestId('seed-base'))
    await submit()

    await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))

    expect(capturedInput).toMatchObject({
      name: 'Metered API',
      code: 'metered_api',
      productId: 'pi-1',
      billingTiming: RateCardBillingTimingEnum.Arrears,
      proration: false,
      walletTargetable: false,
      currency: CurrencyEnum.Usd,
      displayOnInvoice: true,
      regroupPaidFees: null,
      taxCodes: [],
    })
    expect(capturedInput).not.toHaveProperty('appliedPricingUnitCode')
    expect(capturedInput).not.toHaveProperty('productFilterId')
    expect(capturedInput).not.toHaveProperty('description')

    expect(mockNavigate).toHaveBeenCalledWith('/product-catalog/rate-cards/rc-1/overview')
    expect(addToast).toHaveBeenCalledWith({
      severity: 'success',
      message: RATE_CARD_CREATE_SUCCESS_TOAST_KEY,
    })
  })

  it('maps the advance invoicing strategy to displayOnInvoice + regroupPaidFees', async () => {
    let capturedInput: Record<string, unknown> = {}
    const { result } = renderDrawerHook([createRateCardMock((input) => (capturedInput = input))])

    act(() => result.current.openDrawer())
    renderDrawerBody()
    await userEvent.click(screen.getByTestId('seed-base'))
    await userEvent.click(screen.getByTestId('seed-advance'))
    await submit()

    await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))

    expect(capturedInput).toMatchObject({
      billingTiming: RateCardBillingTimingEnum.Advance,
      displayOnInvoice: false,
      regroupPaidFees: RateCardRegroupPaidFeesEnum.Invoice,
    })
  })

  it('sends both the currency and the appliedPricingUnitCode when a pricing unit is picked', async () => {
    let capturedInput: Record<string, unknown> = {}
    const { result } = renderDrawerHook([createRateCardMock((input) => (capturedInput = input))])

    act(() => result.current.openDrawer())
    renderDrawerBody()
    await userEvent.click(screen.getByTestId('seed-base'))
    await userEvent.click(screen.getByTestId('seed-pricing-unit'))
    await submit()

    await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))

    // Currency is mandatory even with a custom pricing unit; both are sent.
    expect(capturedInput).toMatchObject({ currency: 'USD', appliedPricingUnitCode: 'credits' })
  })

  it('sends the selected tax codes', async () => {
    let capturedInput: Record<string, unknown> = {}
    const { result } = renderDrawerHook([createRateCardMock((input) => (capturedInput = input))])

    act(() => result.current.openDrawer())
    renderDrawerBody()
    await userEvent.click(screen.getByTestId('seed-base'))
    await userEvent.click(screen.getByTestId('seed-taxes'))
    await submit()

    await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))

    expect(capturedInput.taxCodes).toEqual(['vat_20'])
  })

  it('keeps the drawer open and links the rate card in the toast when create more is on', async () => {
    let capturedInput: Record<string, unknown> = {}
    const { result } = renderDrawerHook([createRateCardMock((input) => (capturedInput = input))])

    act(() => result.current.openDrawer())

    render(<>{lastDrawerArgs?.secondaryAction}</>)
    await userEvent.click(screen.getByTestId(CREATE_MORE_SWITCH_TEST_ID))

    renderDrawerBody()
    await userEvent.click(screen.getByTestId('seed-base'))
    await submit()

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        severity: 'success',
        message: `${RATE_CARD_CREATE_LINKED_TOAST_KEY}|Metered API|/acme/product-catalog/rate-cards/rc-1/overview`,
      }),
    )
    expect(capturedInput).toMatchObject({ name: 'Metered API' })
    expect(mockClose).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('keeps the drawer and selected taxes on a duplicate code error', async () => {
    const { result } = renderDrawerHook([
      createRateCardMock(() => undefined, {
        data: null,
        errors: [duplicateCodeError],
      }),
    ])

    act(() => result.current.openDrawer())
    renderDrawerBody()
    await userEvent.click(screen.getByTestId('seed-base'))
    await userEvent.click(screen.getByTestId('seed-taxes'))
    await submit()

    expect(mockClose).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(addToast).not.toHaveBeenCalled()

    const content = lastDrawerArgs?.children as ReactElement<{
      form: { state: { values: { taxes: Array<{ code: string }> } } }
    }>

    expect(content.props.form.state.values.taxes.map((tax) => tax.code)).toEqual(['vat_20'])
  })
})
