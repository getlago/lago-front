import { renderHook } from '@testing-library/react'

import { FORM_ERRORS_ENUM } from '~/core/constants/form'
import { ERROR_404_ROUTE } from '~/core/router'
import { serializeAmount } from '~/core/serializers/serializeAmount'
import {
  CouponExpiration,
  CouponFrequency,
  CouponTypeEnum,
  CurrencyEnum,
} from '~/generated/graphql'
import { useCreateEditCoupon } from '~/hooks/useCreateEditCoupon'

// --- generated graphql module (real enums kept, data hooks stubbed) ---
type MutationOptions = {
  onCompleted?: (data: Record<string, { id: string } | null | undefined>) => void
}

let mockCreateOptions: MutationOptions = {}
let mockUpdateOptions: MutationOptions = {}
let mockCreateError: unknown = undefined
let mockUpdateError: unknown = undefined
let mockSingleCouponResult: { data?: unknown; loading: boolean; error?: unknown } = {
  data: undefined,
  loading: false,
  error: undefined,
}

const mockCreate = jest.fn()
const mockUpdate = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetSingleCouponQuery: () => mockSingleCouponResult,
  useCreateCouponMutation: (options: MutationOptions) => {
    mockCreateOptions = options

    return [mockCreate, { error: mockCreateError }]
  },
  useUpdateCouponMutation: (options: MutationOptions) => {
    mockUpdateOptions = options

    return [mockUpdate, { error: mockUpdateError }]
  },
}))

// --- routing ---
const mockNavigate = jest.fn()
const mockParams: { couponId?: string } = {}

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useNavigate: () => mockNavigate,
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockParams,
}))

// --- toasts / error helpers ---
const mockAddToast = jest.fn()
const mockHasDefinedGQLError = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (...args: unknown[]) => mockAddToast(...args),
  hasDefinedGQLError: (...args: unknown[]) => mockHasDefinedGQLError(...args),
}))

// Minimal builder — formatCouponInput reads only the fields asserted below and
// spreads the rest through untouched, so a partial object cast is sufficient.
type CouponFormValues = Parameters<ReturnType<typeof useCreateEditCoupon>['onSave']>[0]

// The runtime form stores amount/percentage as strings, so overrides are typed
// loosely and the merged object is cast to the input shape once.
const buildValues = (overrides: Record<string, unknown> = {}): CouponFormValues =>
  ({
    name: 'My coupon',
    code: 'MY_COUPON',
    couponType: CouponTypeEnum.FixedAmount,
    amountCents: '10',
    amountCurrency: CurrencyEnum.Usd,
    expiration: CouponExpiration.TimeLimit,
    frequency: CouponFrequency.Once,
    reusable: true,
    ...overrides,
  }) as CouponFormValues

describe('useCreateEditCoupon', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateError = undefined
    mockUpdateError = undefined
    mockParams.couponId = undefined
    mockSingleCouponResult = { data: undefined, loading: false, error: undefined }
    mockHasDefinedGQLError.mockReturnValue(false)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN the hook is initialized in creation mode', () => {
    describe('WHEN there is no couponId param', () => {
      it('THEN should expose isEdition false and an onSave function', () => {
        const { result } = renderHook(() => useCreateEditCoupon())

        expect(result.current.isEdition).toBe(false)
        expect(typeof result.current.onSave).toBe('function')
      })
    })

    describe('WHEN a couponId param is present', () => {
      it('THEN should expose isEdition true', () => {
        mockParams.couponId = 'coupon-1'

        const { result } = renderHook(() => useCreateEditCoupon())

        expect(result.current.isEdition).toBe(true)
      })
    })
  })

  describe('GIVEN onSave is called in creation mode', () => {
    describe('WHEN the coupon is a fixed amount', () => {
      it('THEN should serialize the amount and omit the percentage rate', async () => {
        const { result } = renderHook(() => useCreateEditCoupon())

        await result.current.onSave(
          buildValues({
            couponType: CouponTypeEnum.FixedAmount,
            amountCents: '10',
            amountCurrency: CurrencyEnum.Usd,
          }),
        )

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: {
              input: expect.objectContaining({
                amountCents: serializeAmount(10, CurrencyEnum.Usd),
                amountCurrency: CurrencyEnum.Usd,
                percentageRate: undefined,
              }),
            },
          }),
        )
      })
    })

    describe('WHEN the coupon is a percentage', () => {
      it('THEN should set a numeric percentage rate and omit amount fields', async () => {
        const { result } = renderHook(() => useCreateEditCoupon())

        await result.current.onSave(
          buildValues({
            couponType: CouponTypeEnum.Percentage,
            percentageRate: '15',
          }),
        )

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: {
              input: expect.objectContaining({
                percentageRate: 15,
                amountCents: undefined,
                amountCurrency: undefined,
              }),
            },
          }),
        )
      })
    })

    describe('WHEN plan and billable-metric limits are enabled', () => {
      it('THEN should map the limited lists to their ids', async () => {
        const { result } = renderHook(() => useCreateEditCoupon())

        await result.current.onSave(
          buildValues({
            hasPlanLimit: true,
            limitPlansList: [
              { id: 'plan-1', name: 'Plan 1', code: 'plan_1' },
              { id: 'plan-2', name: 'Plan 2', code: 'plan_2' },
            ],
            hasBillableMetricLimit: true,
            limitBillableMetricsList: [{ id: 'bm-1', name: 'BM 1', code: 'bm_1' }],
          }),
        )

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: {
              input: expect.objectContaining({
                appliesTo: {
                  planIds: ['plan-1', 'plan-2'],
                  billableMetricIds: ['bm-1'],
                },
              }),
            },
          }),
        )
      })
    })

    describe('WHEN plan and billable-metric limits are disabled', () => {
      it('THEN should send empty id arrays', async () => {
        const { result } = renderHook(() => useCreateEditCoupon())

        await result.current.onSave(
          buildValues({
            hasPlanLimit: false,
            limitPlansList: [{ id: 'plan-1', name: 'Plan 1', code: 'plan_1' }],
            hasBillableMetricLimit: false,
            limitBillableMetricsList: [{ id: 'bm-1', name: 'BM 1', code: 'bm_1' }],
          }),
        )

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: {
              input: expect.objectContaining({
                appliesTo: { planIds: [], billableMetricIds: [] },
              }),
            },
          }),
        )
      })
    })

    describe('WHEN the expiration is set to no-expiration but a date is present', () => {
      it('THEN should null out the expiration date', async () => {
        const { result } = renderHook(() => useCreateEditCoupon())

        await result.current.onSave(
          buildValues({
            expiration: CouponExpiration.NoExpiration,
            expirationAt: '2030-01-01T00:00:00Z',
          }),
        )

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: { input: expect.objectContaining({ expirationAt: null }) },
          }),
        )
      })
    })

    describe('WHEN the expiration is time-limited with a date', () => {
      it('THEN should keep the expiration date', async () => {
        const { result } = renderHook(() => useCreateEditCoupon())

        await result.current.onSave(
          buildValues({
            expiration: CouponExpiration.TimeLimit,
            expirationAt: '2030-01-01T00:00:00Z',
          }),
        )

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: {
              input: expect.objectContaining({ expirationAt: '2030-01-01T00:00:00Z' }),
            },
          }),
        )
      })
    })

    describe.each([
      ['recurring', CouponFrequency.Recurring, 3],
      ['once', CouponFrequency.Once, undefined],
      ['forever', CouponFrequency.Forever, undefined],
    ])('WHEN the frequency is %s', (_label, frequency, expected) => {
      it('THEN should only keep the frequency duration for recurring coupons', async () => {
        const { result } = renderHook(() => useCreateEditCoupon())

        await result.current.onSave(buildValues({ frequency, frequencyDuration: 3 }))

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: {
              input: expect.objectContaining({ frequencyDuration: expected }),
            },
          }),
        )
      })
    })
  })

  describe('GIVEN onSave is called in edition mode', () => {
    describe('WHEN a couponId param is present', () => {
      it('THEN should call update with the injected id and not create', async () => {
        mockParams.couponId = 'coupon-42'

        const { result } = renderHook(() => useCreateEditCoupon())

        await result.current.onSave(buildValues())

        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: { input: expect.objectContaining({ id: 'coupon-42' }) },
          }),
        )
        expect(mockCreate).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a coupon mutation completes', () => {
    describe('WHEN creation succeeds', () => {
      it('THEN should show a success toast and navigate to the coupon details', () => {
        renderHook(() => useCreateEditCoupon())

        mockCreateOptions.onCompleted?.({ createCoupon: { id: 'created-id' } })

        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
        expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('created-id'))
      })
    })

    describe('WHEN update succeeds', () => {
      it('THEN should show a success toast and navigate to the coupon details', () => {
        mockParams.couponId = 'updated-id'

        renderHook(() => useCreateEditCoupon())

        mockUpdateOptions.onCompleted?.({ updateCoupon: { id: 'updated-id' } })

        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
        expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('updated-id'))
      })
    })

    describe('WHEN the completed mutation returns no coupon', () => {
      it('THEN should not navigate', () => {
        renderHook(() => useCreateEditCoupon())

        mockCreateOptions.onCompleted?.({ createCoupon: null })

        expect(mockNavigate).not.toHaveBeenCalled()
        expect(mockAddToast).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the single-coupon query returns a not-found error', () => {
    describe('WHEN the hook mounts', () => {
      it('THEN should redirect to the 404 route', () => {
        mockSingleCouponResult = { data: undefined, loading: false, error: { message: 'boom' } }
        mockHasDefinedGQLError.mockImplementation((code: string) => code === 'NotFound')

        renderHook(() => useCreateEditCoupon())

        expect(mockNavigate).toHaveBeenCalledWith(ERROR_404_ROUTE)
      })
    })
  })

  describe('GIVEN a mutation fails with an already-existing code', () => {
    describe('WHEN the error is ValueAlreadyExist', () => {
      it('THEN should expose the existing-code form error', () => {
        mockCreateError = { message: 'exists' }
        mockHasDefinedGQLError.mockImplementation((code: string) => code === 'ValueAlreadyExist')

        const { result } = renderHook(() => useCreateEditCoupon())

        expect(result.current.errorCode).toBe(FORM_ERRORS_ENUM.existingCode)
      })
    })

    describe('WHEN no recognized error is present', () => {
      it('THEN should expose no error code', () => {
        const { result } = renderHook(() => useCreateEditCoupon())

        expect(result.current.errorCode).toBeUndefined()
      })
    })
  })
})
