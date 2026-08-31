import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphQLError } from 'graphql'
import { ReactNode } from 'react'

import { CREATE_MORE_SWITCH_TEST_ID } from '~/components/drawers/createMore/CreateMoreControl'
import { addToast } from '~/core/apolloClient'
import {
  CreateRateCardRateDocument,
  RateCardBillingTimingEnum,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
  RateCardRateStatusEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import { buildRateCardForRateDrawer } from '../../../__tests__/fixtures'
import { RATE_CARD_RATE_DRAWER_TITLE_CREATE_KEY } from '../constants'
import {
  RATE_CARD_RATE_CREATE_LINKED_TOAST_KEY,
  RATE_CARD_RATE_CREATE_SUCCESS_TOAST_KEY,
  RATE_CARD_RATE_DRAWER_SUBMIT_CREATE_KEY,
  useRateCardRateDrawer,
} from '../useRateCardRateDrawer'

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

// drawerStack.ts uses `import.meta`, which jest cannot parse; mocking also lets us capture
// the args passed to `open`.
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

jest.mock('~/hooks/plans/useCustomPricingUnits', () => ({
  useCustomPricingUnits: () => ({ hasAnyPricingUnitConfigured: false, pricingUnits: [] }),
}))

// Replace the drawer body with controls that seed the form directly, so the create flow is
// exercised without driving the real inputs.
jest.mock('../RateCardRateDrawerContent', () => ({
  RateCardRateDrawerContent: ({
    form,
  }: {
    form: { setFieldValue: (name: string, value: unknown) => void }
  }) => (
    <>
      <button
        data-test="seed-rate"
        onClick={() => {
          form.setFieldValue('effectiveFrom', '2026-03-01T00:00:00.000Z')
          form.setFieldValue('code', 'rate_03_01_2026')
          form.setFieldValue('properties', { amount: '9' })
        }}
      >
        seed
      </button>
      <button
        data-test="seed-second-rate"
        onClick={() => {
          form.setFieldValue('effectiveFrom', '2099-01-01T00:00:00.000Z')
          form.setFieldValue('code', 'rate_01_01_2099')
          form.setFieldValue('properties', { amount: '11' })
        }}
      >
        seed another
      </button>
      <button
        data-test="seed-spending-minimum"
        onClick={() => form.setFieldValue('minAmountCents', '20')}
      >
        spending minimum
      </button>
    </>
  ),
}))

const createdRate = {
  id: 'rate-9',
  code: 'rate_03_01_2026',
  effectiveFrom: '2026-03-01T00:00:00.000Z',
  status: RateCardRateStatusEnum.Pending,
  rateModel: RateCardRateModelEnum.Standard,
  billingIntervalCount: 1,
  billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
  minAmountCents: '0',
  appliedPricingUnitConversionRate: null,
  rateProperties: { amount: '9' },
}

const duplicateCodeError = new GraphQLError('Value already exists', {
  extensions: {
    status: 422,
    code: 'unprocessable_entity',
    details: { code: ['value_already_exist'] },
  },
})

const createMock = (
  captureInput: (input: Record<string, unknown>) => void,
  result: Record<string, unknown> = { data: { createRateCardRate: createdRate } },
): MockedResponse => ({
  request: { query: CreateRateCardRateDocument },
  maxUsageCount: Number.POSITIVE_INFINITY,
  variableMatcher: (vars) => {
    captureInput(vars?.input)
    return true
  },
  result,
})

const renderDrawerHook = (mocks: MockedResponse[] = []) =>
  renderHook(() => useRateCardRateDrawer(), {
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

describe('useRateCardRateDrawer create flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    lastDrawerArgs = null
  })

  describe('GIVEN a rate card with no rate yet', () => {
    describe('WHEN the drawer opens', () => {
      it('THEN uses the create title, the create submit label and offers the create-more control', () => {
        const { result } = renderDrawerHook()

        act(() => result.current.openDrawer({ rateCard: buildRateCardForRateDrawer() }))

        expect(lastDrawerArgs?.title).toBe(RATE_CARD_RATE_DRAWER_TITLE_CREATE_KEY)
        expect(lastDrawerArgs?.secondaryAction).toBeDefined()
        expect(lastDrawerArgs?.closeOnSubmitSuccess).toBe(false)

        render(<>{lastDrawerArgs?.mainAction}</>)

        expect(
          screen.getByRole('button', { name: RATE_CARD_RATE_DRAWER_SUBMIT_CREATE_KEY }),
        ).toHaveAttribute('type', 'submit')
      })

      it('THEN tells the body it is not editing an active rate', () => {
        const { result } = renderDrawerHook()

        act(() => result.current.openDrawer({ rateCard: buildRateCardForRateDrawer() }))

        expect((lastDrawerArgs?.children as { props: Record<string, unknown> })?.props.isEdit).toBe(
          false,
        )
      })
    })
  })

  describe('GIVEN the create form is filled', () => {
    describe('WHEN it is submitted with create-more off', () => {
      it('THEN sends the rate card id and the billing interval defaults', async () => {
        let capturedInput: Record<string, unknown> = {}
        const { result } = renderDrawerHook([createMock((input) => (capturedInput = input))])

        act(() => result.current.openDrawer({ rateCard: buildRateCardForRateDrawer() }))
        renderDrawerBody()
        await userEvent.click(screen.getByTestId('seed-rate'))
        await submit()

        await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))

        expect(capturedInput).toMatchObject({
          rateCardId: 'rc-1',
          code: 'rate_03_01_2026',
          effectiveFrom: '2026-03-01T00:00:00.000Z',
          rateModel: RateCardRateModelEnum.Standard,
          billingIntervalCount: 1,
          billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
        })
      })

      it('THEN omits the spending minimum when it was left empty', async () => {
        let capturedInput: Record<string, unknown> = {}
        const { result } = renderDrawerHook([createMock((input) => (capturedInput = input))])

        act(() => result.current.openDrawer({ rateCard: buildRateCardForRateDrawer() }))
        renderDrawerBody()
        await userEvent.click(screen.getByTestId('seed-rate'))
        await submit()

        await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))

        expect(capturedInput).not.toHaveProperty('minAmountCents')
      })

      it('THEN serializes a filled spending minimum into cents', async () => {
        let capturedInput: Record<string, unknown> = {}
        const { result } = renderDrawerHook([createMock((input) => (capturedInput = input))])

        act(() => result.current.openDrawer({ rateCard: buildRateCardForRateDrawer() }))
        renderDrawerBody()
        await userEvent.click(screen.getByTestId('seed-rate'))
        await userEvent.click(screen.getByTestId('seed-spending-minimum'))
        await submit()

        await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))

        expect(capturedInput.minAmountCents).toBe(2000)
      })

      it('THEN drops the spending minimum on a pay-in-advance card', async () => {
        let capturedInput: Record<string, unknown> = {}
        const { result } = renderDrawerHook([createMock((input) => (capturedInput = input))])

        act(() =>
          result.current.openDrawer({
            rateCard: buildRateCardForRateDrawer({
              billingTiming: RateCardBillingTimingEnum.Advance,
            }),
          }),
        )
        renderDrawerBody()
        await userEvent.click(screen.getByTestId('seed-rate'))
        await userEvent.click(screen.getByTestId('seed-spending-minimum'))
        await submit()

        await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))

        expect(capturedInput).not.toHaveProperty('minAmountCents')
      })

      it('THEN closes, lands on the new rate and toasts', async () => {
        const { result } = renderDrawerHook([createMock(() => undefined)])

        act(() => result.current.openDrawer({ rateCard: buildRateCardForRateDrawer() }))
        renderDrawerBody()
        await userEvent.click(screen.getByTestId('seed-rate'))
        await submit()

        await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))

        expect(mockNavigate).toHaveBeenCalledWith(
          '/product-catalog/rate-cards/rc-1/rates/rate-9/overview',
        )
        expect(addToast).toHaveBeenCalledWith({
          severity: 'success',
          message: RATE_CARD_RATE_CREATE_SUCCESS_TOAST_KEY,
        })
      })
    })

    describe('WHEN it is submitted with create-more on', () => {
      it('THEN keeps the drawer open and links the created rate in the toast', async () => {
        const { result } = renderDrawerHook([createMock(() => undefined)])

        act(() => result.current.openDrawer({ rateCard: buildRateCardForRateDrawer() }))

        render(<>{lastDrawerArgs?.secondaryAction}</>)
        await userEvent.click(screen.getByTestId(CREATE_MORE_SWITCH_TEST_ID))

        renderDrawerBody()
        await userEvent.click(screen.getByTestId('seed-rate'))
        await submit()

        await waitFor(() =>
          expect(addToast).toHaveBeenCalledWith({
            severity: 'success',
            message: `${RATE_CARD_RATE_CREATE_LINKED_TOAST_KEY}|rate_03_01_2026|/acme/product-catalog/rate-cards/rc-1/rates/rate-9/overview`,
          }),
        )

        expect(mockClose).not.toHaveBeenCalled()
        expect(mockNavigate).not.toHaveBeenCalled()
      })
    })

    describe('WHEN a rate that is already effective is created with create-more on', () => {
      // The reset re-derives the boundary from the card as it was at open(), so the advance
      // has to land after it.
      it('THEN the append boundary moves to the new rate, surviving the form reset', async () => {
        const alreadyEffective = { ...createdRate, effectiveFrom: '2020-01-01T00:00:00.000Z' }
        const { result } = renderDrawerHook([
          createMock(() => undefined, { data: { createRateCardRate: alreadyEffective } }),
        ])

        act(() => result.current.openDrawer({ rateCard: buildRateCardForRateDrawer() }))

        render(<>{lastDrawerArgs?.secondaryAction}</>)
        await userEvent.click(screen.getByTestId(CREATE_MORE_SWITCH_TEST_ID))

        renderDrawerBody()
        await userEvent.click(screen.getByTestId('seed-rate'))
        await submit()

        await waitFor(() => expect(addToast).toHaveBeenCalled())

        expect(
          (
            lastDrawerArgs?.children as {
              props: { getEffectiveFromBoundary: () => string | null }
            }
          )?.props.getEffectiveFromBoundary(),
        ).toBe('2020-01-01T00:00:00.000Z')
      })
    })

    describe('WHEN a second, still-pending rate follows an already-effective one', () => {
      // The card snapshot knows nothing about the first save, so without a floor the boundary
      // would drop back to null.
      it('THEN the boundary stays on the effective rate instead of regressing', async () => {
        const alreadyEffective = { ...createdRate, effectiveFrom: '2020-01-01T00:00:00.000Z' }
        const stillPending = {
          ...createdRate,
          id: 'rate-10',
          code: 'rate_01_01_2099',
          effectiveFrom: '2099-01-01T00:00:00.000Z',
        }
        const { result } = renderDrawerHook([
          {
            request: { query: CreateRateCardRateDocument },
            maxUsageCount: Number.POSITIVE_INFINITY,
            variableMatcher: (vars) => vars?.input?.code === 'rate_03_01_2026',
            result: { data: { createRateCardRate: alreadyEffective } },
          },
          {
            request: { query: CreateRateCardRateDocument },
            maxUsageCount: Number.POSITIVE_INFINITY,
            variableMatcher: (vars) => vars?.input?.code === 'rate_01_01_2099',
            result: { data: { createRateCardRate: stillPending } },
          },
        ])

        act(() => result.current.openDrawer({ rateCard: buildRateCardForRateDrawer() }))

        render(<>{lastDrawerArgs?.secondaryAction}</>)
        await userEvent.click(screen.getByTestId(CREATE_MORE_SWITCH_TEST_ID))

        renderDrawerBody()
        await userEvent.click(screen.getByTestId('seed-rate'))
        await submit()
        await waitFor(() => expect(addToast).toHaveBeenCalledTimes(1))

        await userEvent.click(screen.getByTestId('seed-second-rate'))
        await submit()
        await waitFor(() => expect(addToast).toHaveBeenCalledTimes(2))

        expect(
          (
            lastDrawerArgs?.children as {
              props: { getEffectiveFromBoundary: () => string | null }
            }
          )?.props.getEffectiveFromBoundary(),
        ).toBe('2020-01-01T00:00:00.000Z')
      })
    })

    describe('WHEN a future rate is created with create-more on', () => {
      it('THEN leaves the boundary alone, since a pending rate never becomes the active one', async () => {
        const stillPending = { ...createdRate, effectiveFrom: '2099-01-01T00:00:00.000Z' }
        const { result } = renderDrawerHook([
          createMock(() => undefined, { data: { createRateCardRate: stillPending } }),
        ])

        act(() => result.current.openDrawer({ rateCard: buildRateCardForRateDrawer() }))

        render(<>{lastDrawerArgs?.secondaryAction}</>)
        await userEvent.click(screen.getByTestId(CREATE_MORE_SWITCH_TEST_ID))

        renderDrawerBody()
        await userEvent.click(screen.getByTestId('seed-rate'))
        await submit()

        await waitFor(() => expect(addToast).toHaveBeenCalled())

        expect(
          (
            lastDrawerArgs?.children as {
              props: { getEffectiveFromBoundary: () => string | null }
            }
          )?.props.getEffectiveFromBoundary(),
        ).toBeNull()
      })
    })

    describe('WHEN the backend rejects the code as a duplicate', () => {
      it('THEN keeps the drawer open without toasting a success', async () => {
        const { result } = renderDrawerHook([
          createMock(() => undefined, { data: null, errors: [duplicateCodeError] }),
        ])

        act(() => result.current.openDrawer({ rateCard: buildRateCardForRateDrawer() }))
        renderDrawerBody()
        await userEvent.click(screen.getByTestId('seed-rate'))
        await submit()

        expect(mockClose).not.toHaveBeenCalled()
        expect(mockNavigate).not.toHaveBeenCalled()
        expect(addToast).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the effective date is left empty', () => {
    describe('WHEN the form is submitted', () => {
      it('THEN never reaches the mutation', async () => {
        const captureInput = jest.fn()
        const { result } = renderDrawerHook([createMock(captureInput)])

        act(() => result.current.openDrawer({ rateCard: buildRateCardForRateDrawer() }))
        await submit()

        expect(captureInput).not.toHaveBeenCalled()
        expect(mockClose).not.toHaveBeenCalled()
      })
    })
  })
})
