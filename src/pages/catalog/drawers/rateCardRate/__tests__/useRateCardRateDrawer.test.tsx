import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook, screen, waitFor } from '@testing-library/react'
import { GraphQLError } from 'graphql'
import { ReactElement, ReactNode } from 'react'

import { addToast } from '~/core/apolloClient'
import {
  CurrencyEnum,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
  RateCardRateStatusEnum,
  UpdateRateCardRateDocument,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import { buildRateCardForRateDrawer } from '../../../__tests__/fixtures'
import { RATE_CARD_RATE_DRAWER_TITLE_EDIT_KEY } from '../constants'
import {
  RATE_CARD_RATE_EDIT_SUCCESS_TOAST_KEY,
  useRateCardRateDrawer,
} from '../useRateCardRateDrawer'

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

jest.mock('~/hooks/plans/useCustomPricingUnits', () => ({
  useCustomPricingUnits: () => ({
    hasAnyPricingUnitConfigured: true,
    pricingUnits: [{ id: 'pu-1', name: 'Tokens', code: 'tokens', shortName: 'tok' }],
  }),
}))

jest.mock('../RateCardRateDrawerContent', () => ({
  RateCardRateDrawerContent: () => null,
}))

const pendingRate = {
  id: 'rate-1',
  code: 'rate_01_24_2026',
  effectiveFrom: '2026-01-24T00:00:00.000Z',
  status: RateCardRateStatusEnum.Pending,
  rateModel: RateCardRateModelEnum.Standard,
  billingIntervalCount: 2,
  billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Week,
  minAmountCents: '1500',
  appliedPricingUnitConversionRate: null,
  rateProperties: { amount: '12' },
}

const activeRate = { ...pendingRate, status: RateCardRateStatusEnum.Active }

const updateMock = (captureInput: (input: Record<string, unknown>) => void): MockedResponse => ({
  request: { query: UpdateRateCardRateDocument },
  maxUsageCount: Number.POSITIVE_INFINITY,
  variableMatcher: (vars) => {
    captureInput(vars?.input)
    return vars?.input?.id === 'rate-1'
  },
  result: { data: { updateRateCardRate: pendingRate } },
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

const submit = async () => {
  await act(async () => {
    await lastDrawerArgs?.form?.submit()
  })
}

const contentProps = () => (lastDrawerArgs?.children as ReactElement)?.props

describe('useRateCardRateDrawer edit flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    lastDrawerArgs = null
  })

  describe('GIVEN an existing rate is opened for edition', () => {
    describe('WHEN the drawer opens', () => {
      it('THEN uses the edit title and offers no create-more control', () => {
        const { result } = renderDrawerHook()

        act(() =>
          result.current.openDrawer({ rateCard: buildRateCardForRateDrawer(), rate: pendingRate }),
        )

        expect(lastDrawerArgs?.title).toBe(RATE_CARD_RATE_DRAWER_TITLE_EDIT_KEY)
        expect(lastDrawerArgs?.secondaryAction).toBeUndefined()
      })

      it('THEN renders a submit-type save button', () => {
        const { result } = renderDrawerHook()

        act(() =>
          result.current.openDrawer({ rateCard: buildRateCardForRateDrawer(), rate: pendingRate }),
        )
        render(<>{lastDrawerArgs?.mainAction}</>)

        expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
      })
    })
  })

  describe('GIVEN a pending rate', () => {
    describe('WHEN it is saved', () => {
      it('THEN sends every field, since nothing is frozen yet', async () => {
        let capturedInput: Record<string, unknown> = {}
        const { result } = renderDrawerHook([updateMock((input) => (capturedInput = input))])

        act(() =>
          result.current.openDrawer({ rateCard: buildRateCardForRateDrawer(), rate: pendingRate }),
        )
        await submit()

        await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))

        expect(capturedInput).toMatchObject({
          id: 'rate-1',
          code: 'rate_01_24_2026',
          effectiveFrom: '2026-01-24T00:00:00.000Z',
          rateModel: RateCardRateModelEnum.Standard,
          billingIntervalCount: 2,
          billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Week,
          // 1500 cents round-trips through the decimal amount the form edits.
          minAmountCents: 1500,
        })
      })

      it('THEN closes and toasts without navigating away', async () => {
        const { result } = renderDrawerHook([updateMock(() => undefined)])

        act(() =>
          result.current.openDrawer({ rateCard: buildRateCardForRateDrawer(), rate: pendingRate }),
        )
        await submit()

        await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))

        expect(mockNavigate).not.toHaveBeenCalled()
        expect(addToast).toHaveBeenCalledWith({
          severity: 'success',
          message: RATE_CARD_RATE_EDIT_SUCCESS_TOAST_KEY,
        })
      })
    })
  })

  describe('GIVEN an active rate', () => {
    describe('WHEN it is saved', () => {
      it('THEN omits every field the backend freezes on presence', async () => {
        let capturedInput: Record<string, unknown> = {}
        const { result } = renderDrawerHook([updateMock((input) => (capturedInput = input))])

        act(() =>
          result.current.openDrawer({ rateCard: buildRateCardForRateDrawer(), rate: activeRate }),
        )
        await submit()

        await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))

        expect(capturedInput).toMatchObject({ id: 'rate-1' })
        expect(capturedInput).toHaveProperty('rateProperties')
        // FROZEN_ON_ACTIVE + the code, which the design freezes too.
        expect(capturedInput).not.toHaveProperty('effectiveFrom')
        expect(capturedInput).not.toHaveProperty('rateModel')
        expect(capturedInput).not.toHaveProperty('billingIntervalCount')
        expect(capturedInput).not.toHaveProperty('billingIntervalUnit')
        expect(capturedInput).not.toHaveProperty('minAmountCents')
        expect(capturedInput).not.toHaveProperty('code')
      })

      it('THEN tells the body to lock the timeline fields', () => {
        const { result } = renderDrawerHook()

        act(() =>
          result.current.openDrawer({ rateCard: buildRateCardForRateDrawer(), rate: activeRate }),
        )

        expect(contentProps()?.isActiveRate).toBe(true)
      })
    })
  })

  describe('GIVEN a card billed in a pay-in-advance timing', () => {
    describe('WHEN a pending rate is saved', () => {
      // The field is hidden there, but the rate can still carry a minimum saved while the card
      // was in arrears: 0 clears it, where omitting the key would leave it invisible forever.
      // Only a positive value is rejected on an advance card.
      it('THEN clears the spending minimum instead of leaving it behind', async () => {
        let capturedInput: Record<string, unknown> = {}
        const { result } = renderDrawerHook([updateMock((input) => (capturedInput = input))])

        act(() =>
          result.current.openDrawer({
            rateCard: buildRateCardForRateDrawer({
              billingTiming: RateCardBillingTimingEnum.Advance,
            }),
            rate: pendingRate,
          }),
        )
        await submit()

        await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))

        expect(capturedInput.minAmountCents).toBe(0)
      })
    })
  })

  describe('GIVEN a card pricing in a custom pricing unit', () => {
    describe('WHEN the drawer opens', () => {
      // The short name is resolved inside the body, which re-renders when the units query
      // resolves - `children` is captured once here, so a name read now could never update.
      it('THEN passes the pricing unit code to the body', () => {
        const { result } = renderDrawerHook()

        act(() =>
          result.current.openDrawer({
            rateCard: buildRateCardForRateDrawer({ appliedPricingUnitCode: 'tokens' }),
            rate: pendingRate,
          }),
        )

        expect(contentProps()?.rateCard.appliedPricingUnitCode).toBe('tokens')
        expect(contentProps()).not.toHaveProperty('pricingUnitShortName')
      })
    })

    describe('WHEN the rate is saved', () => {
      it('THEN sends the conversion rate', async () => {
        let capturedInput: Record<string, unknown> = {}
        const { result } = renderDrawerHook([updateMock((input) => (capturedInput = input))])

        act(() =>
          result.current.openDrawer({
            rateCard: buildRateCardForRateDrawer({ appliedPricingUnitCode: 'tokens' }),
            rate: { ...pendingRate, appliedPricingUnitConversionRate: 2.5 },
          }),
        )
        await submit()

        await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))

        expect(capturedInput.appliedPricingUnitConversionRate).toBe(2.5)
      })
    })
  })

  describe('GIVEN the card already has an effective rate', () => {
    describe('WHEN a different rate is opened', () => {
      it('THEN passes that rate effective date as the append boundary', () => {
        const { result } = renderDrawerHook()

        act(() =>
          result.current.openDrawer({
            rateCard: buildRateCardForRateDrawer({
              activeRate: { __typename: 'RateCardRate', id: 'rate-0', effectiveFrom: '2026-01-01' },
            }),
            rate: pendingRate,
          }),
        )

        expect(contentProps()?.getEffectiveFromBoundary()).toBe('2026-01-01')
      })
    })

    describe('WHEN that very rate is the one being edited', () => {
      // Comparing the active rate against itself would make its own date invalid and block
      // every save, so the boundary drops - exactly what the backend does by excluding self.
      it('THEN passes no boundary at all', () => {
        const { result } = renderDrawerHook()

        act(() =>
          result.current.openDrawer({
            rateCard: buildRateCardForRateDrawer({
              activeRate: {
                __typename: 'RateCardRate',
                id: activeRate.id,
                effectiveFrom: activeRate.effectiveFrom,
              },
            }),
            rate: activeRate,
          }),
        )

        expect(contentProps()?.getEffectiveFromBoundary()).toBeNull()
      })

      it('THEN still reaches the mutation on save', async () => {
        let capturedInput: Record<string, unknown> = {}
        const { result } = renderDrawerHook([updateMock((input) => (capturedInput = input))])

        act(() =>
          result.current.openDrawer({
            rateCard: buildRateCardForRateDrawer({
              activeRate: {
                __typename: 'RateCardRate',
                id: activeRate.id,
                effectiveFrom: activeRate.effectiveFrom,
              },
            }),
            rate: activeRate,
          }),
        )
        await submit()

        await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))

        expect(capturedInput).toMatchObject({ id: 'rate-1' })
      })
    })
  })

  describe('GIVEN the parent card is already in a plan or a subscription', () => {
    const attachedCard = buildRateCardForRateDrawer({ attachedToPlanOrSubscription: true })

    describe('WHEN an existing rate is opened', () => {
      it('THEN tells the body the code is frozen', () => {
        const { result } = renderDrawerHook()

        act(() => result.current.openDrawer({ rateCard: attachedCard, rate: pendingRate }))

        expect(contentProps()?.isCodeLocked).toBe(true)
      })
    })

    describe('WHEN a new rate is created', () => {
      // The backend only refuses a code CHANGE; a rate that does not exist yet has no identity
      // to protect, and its code is what the date seeds.
      it('THEN leaves the code editable', () => {
        const { result } = renderDrawerHook()

        act(() => result.current.openDrawer({ rateCard: attachedCard }))

        expect(contentProps()?.isCodeLocked).toBe(false)
      })
    })
  })

  describe('GIVEN the backend rejects the save', () => {
    const rejectedUpdateMock = (details: Record<string, string[]>): MockedResponse => ({
      request: { query: UpdateRateCardRateDocument },
      maxUsageCount: Number.POSITIVE_INFINITY,
      variableMatcher: () => true,
      result: {
        data: null,
        errors: [
          new GraphQLError('Unprocessable Entity', {
            extensions: { status: 422, code: 'unprocessable_entity', details },
          }),
        ],
      },
    })

    const openAndSubmit = async (mock: MockedResponse) => {
      const { result } = renderDrawerHook([mock])

      act(() =>
        result.current.openDrawer({ rateCard: buildRateCardForRateDrawer(), rate: pendingRate }),
      )
      await submit()
    }

    describe('WHEN the effective date collides with another rate', () => {
      it('THEN keeps the drawer open without blaming the code', async () => {
        await openAndSubmit(rejectedUpdateMock({ effectiveFrom: ['value_already_exist'] }))

        expect(mockClose).not.toHaveBeenCalled()
        expect(addToast).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the rejection maps to no field the form owns', () => {
      it('THEN surfaces it as an error toast instead of a silent no-op', async () => {
        await openAndSubmit(rejectedUpdateMock({ rateModel: ['not_allowed_for_product'] }))

        await waitFor(() =>
          expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' })),
        )
        expect(mockClose).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the edited rate carries a spending minimum', () => {
    describe('WHEN the drawer opens', () => {
      // Read back from the form the reset just seeded rather than deserialized a second time.
      it('THEN hands the body the decimal amount the form holds', () => {
        const { result } = renderDrawerHook()

        act(() =>
          result.current.openDrawer({ rateCard: buildRateCardForRateDrawer(), rate: pendingRate }),
        )

        expect(contentProps()?.initialMinAmountCents).toBe('15')
      })
    })
  })

  describe('GIVEN the parent card', () => {
    describe('WHEN the drawer opens', () => {
      it('THEN passes only the pricing context the body needs', () => {
        const { result } = renderDrawerHook()

        act(() =>
          result.current.openDrawer({
            rateCard: buildRateCardForRateDrawer(),
            rate: pendingRate,
          }),
        )

        expect(contentProps()?.rateCard).toEqual({
          currency: CurrencyEnum.Usd,
          appliedPricingUnitCode: null,
          billingTiming: RateCardBillingTimingEnum.Arrears,
          productType: ProductTypeEnum.Usage,
          aggregationType: 'sum_agg',
        })
      })
    })
  })
})
