import { ApolloError } from '@apollo/client'
import { act, renderHook, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { addToast } from '~/core/apolloClient'
import type { BillingItemsPayload } from '~/core/serializers/serializeQuoteBillingItems'
import { CouponFrequency, CouponTypeEnum, CurrencyEnum } from '~/generated/graphql'
import {
  QUOTE_FIELD_ERROR_KEY,
  QUOTE_SAVE_FAILED_TOAST_KEY,
} from '~/pages/quotes/utils/quoteSaveErrorKeys'
import * as serverFieldErrorsUtil from '~/pages/quotes/utils/serverFieldErrors'
import { render } from '~/test-utils'

import { DISCOUNT_DRAWER_SAVE_TEST_ID, useDiscountDrawer } from '../useDiscountDrawer'

// --- Mocks ---

const mockCryptoRandomUUID = jest.fn(() => 'mock-uuid-1')

Object.defineProperty(globalThis, 'crypto', {
  value: {
    ...globalThis.crypto,
    randomUUID: mockCryptoRandomUUID,
  },
  writable: true,
})

const mockDrawerOpen = jest.fn()
const mockDrawerClose = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: mockDrawerOpen, close: mockDrawerClose }),
  useFormDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const mockAddToast = addToast as jest.Mock

// Controllable coupon dataset returned by the lazy query. The standalone async
// ComboBox reads `data` and calls `getCoupons` (the fetch trigger). Must be
// prefixed with `mock` to be referenceable inside the jest.mock factory.
const mockGetCoupons = jest.fn()

jest.mock('~/generated/graphql', () => {
  const actual = jest.requireActual('~/generated/graphql')

  const fixedAmountCoupon = {
    __typename: 'Coupon',
    id: 'cpn_fixed',
    name: 'Ten Off',
    code: 'COUPON_CODE',
    amountCurrency: actual.CurrencyEnum.Eur,
    amountCents: 1000,
    couponType: actual.CouponTypeEnum.FixedAmount,
    percentageRate: null,
    frequency: actual.CouponFrequency.Once,
    frequencyDuration: null,
    plans: [],
    billableMetrics: [],
  }

  return {
    ...actual,
    useGetCouponsForDiscountDrawerLazyQuery: () => [
      mockGetCoupons,
      {
        loading: false,
        data: { coupons: { collection: [fixedAmountCoupon] } },
      },
    ],
  }
})

// Note: @tanstack/react-form is NOT mocked — real revalidateLogic is required
// so form.setFieldValue works without "validates is not iterable" errors.

// The ComboBox renders its options through a virtualizer that has no layout in
// jsdom — mock it so the option list is actually rendered and clickable.
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 56,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, i) => ({
        index: i,
        key: String(i),
        start: i * 56,
        size: 56,
      })),
    scrollToIndex: jest.fn(),
    measureElement: jest.fn(),
  }),
}))

const options = { currency: CurrencyEnum.Usd }

describe('useDiscountDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCryptoRandomUUID.mockReturnValue('mock-uuid-1')
  })

  it('returns the expected interface', () => {
    const { result } = renderHook(() => useDiscountDrawer(undefined, options))

    expect(result.current).toHaveProperty('onDiscountCommand')
    expect(result.current).toHaveProperty('entities')
    expect(result.current).toHaveProperty('syncDiscountBlocks')
  })

  it('opens the drawer when onDiscountCommand is called', () => {
    const { result } = renderHook(() => useDiscountDrawer(undefined, options))

    act(() => {
      result.current.onDiscountCommand({ onSave: jest.fn() })
    })

    expect(mockDrawerOpen).toHaveBeenCalledTimes(1)
  })

  it('blocks save when no coupon is selected', async () => {
    const { result } = renderHook(() => useDiscountDrawer(undefined, options))

    const onSave = jest.fn()

    act(() => {
      result.current.onDiscountCommand({ onSave })
    })

    const openArgs = mockDrawerOpen.mock.calls[0][0]

    render(
      <>
        {openArgs.children}
        {openArgs.actions}
      </>,
    )

    // Attempting to save without a coupon runs validation, which fails on the
    // required couponId — onSave must not fire and the drawer must stay open.
    await userEvent.click(screen.getByTestId(DISCOUNT_DRAWER_SAVE_TEST_ID))

    await waitFor(() => {
      expect(screen.getByTestId(DISCOUNT_DRAWER_SAVE_TEST_ID)).toBeDisabled()
    })

    expect(onSave).not.toHaveBeenCalled()
    expect(mockDrawerClose).not.toHaveBeenCalled()
  })

  it('prefills amount and locks currency when a fixed-amount coupon is selected', async () => {
    const { result } = renderHook(() => useDiscountDrawer(undefined, options))

    act(() => {
      result.current.onDiscountCommand({ onSave: jest.fn() })
    })

    const openArgs = mockDrawerOpen.mock.calls[0][0]

    render(<>{openArgs.children}</>)

    const comboBoxInput = screen.getByRole('combobox') as HTMLInputElement

    await userEvent.type(comboBoxInput, 'Ten')

    await waitFor(() => {
      const listboxId = comboBoxInput.getAttribute('aria-controls')

      expect(listboxId).toBeTruthy()
    })

    const listboxId = comboBoxInput.getAttribute('aria-controls') as string
    const listbox = document.getElementById(listboxId) as HTMLElement

    await userEvent.click(within(listbox).getByText('Ten Off'))

    // Amount field appears prefilled from the coupon (1000 cents / EUR precision).
    await waitFor(() => {
      const amountInput = screen.getByDisplayValue('10') as HTMLInputElement

      expect(amountInput).toBeInTheDocument()
    })

    // Currency is locked to the drawer's currency (USD), not the coupon's EUR.
    expect(screen.getByDisplayValue(CurrencyEnum.Usd)).toBeInTheDocument()
  })

  it('saves a valid fixed-amount coupon and produces the coupons payload via syncDiscountBlocks', async () => {
    const { result } = renderHook(() => useDiscountDrawer(undefined, options))

    const onSave = jest.fn()

    act(() => {
      result.current.onDiscountCommand({ onSave })
    })

    const openArgs = mockDrawerOpen.mock.calls[0][0]

    render(
      <>
        {openArgs.children}
        {openArgs.actions}
      </>,
    )

    const comboBoxInput = screen.getByRole('combobox') as HTMLInputElement

    await userEvent.type(comboBoxInput, 'Ten')

    await waitFor(() => {
      expect(comboBoxInput.getAttribute('aria-controls')).toBeTruthy()
    })

    const listboxId = comboBoxInput.getAttribute('aria-controls') as string
    const listbox = document.getElementById(listboxId) as HTMLElement

    await userEvent.click(within(listbox).getByText('Ten Off'))

    const saveButton = screen.getByTestId(DISCOUNT_DRAWER_SAVE_TEST_ID)

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled()
    })

    await userEvent.click(saveButton)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({ couponId: 'cpn_fixed', localId: 'mock-uuid-1' })
    })

    expect(mockDrawerClose).toHaveBeenCalled()

    // Saving rebuilds the entities from the toCoupons -> fromCoupons round-trip,
    // which is the same serialization that produces the payload overrides.
    await waitFor(() => {
      expect(result.current.entities).toHaveProperty('mock-uuid-1')
    })
    expect(result.current.entities['mock-uuid-1']).toMatchObject({
      entityType: 'coupon',
      couponType: CouponTypeEnum.FixedAmount,
      amountCents: '1000',
      percentageRate: null,
      frequency: CouponFrequency.Once,
      frequencyDuration: null,
    })

    // Regression guard: the saved item's code must come from coupon.code, NOT coupon.name.
    // Previously form.setFieldValue('code', coupon.name) wrote the name into the code field.
    expect(result.current.entities['mock-uuid-1']).toMatchObject({ code: 'COUPON_CODE' })

    // syncDiscountBlocks returns undefined when nothing changed, and a rebuilt
    // payload when a block is removed.
    let payload: BillingItemsPayload | undefined

    act(() => {
      payload = result.current.syncDiscountBlocks([
        { couponId: 'cpn_fixed', localId: 'mock-uuid-1' },
      ])
    })

    expect(payload).toBeUndefined()

    act(() => {
      payload = result.current.syncDiscountBlocks([])
    })

    expect(payload).toBeDefined()
    expect(payload?.coupons).toEqual([])
  })

  it('calls onPersist with billingItems containing coupon overrides on add', async () => {
    const onPersist = jest.fn()
    const { result } = renderHook(() =>
      useDiscountDrawer(undefined, { currency: CurrencyEnum.Usd, onPersist }),
    )

    const onSave = jest.fn()

    act(() => {
      result.current.onDiscountCommand({ onSave })
    })

    const openArgs = mockDrawerOpen.mock.calls[0][0]

    render(
      <>
        {openArgs.children}
        {openArgs.actions}
      </>,
    )

    const comboBoxInput = screen.getByRole('combobox') as HTMLInputElement

    await userEvent.type(comboBoxInput, 'Ten')

    await waitFor(() => {
      expect(comboBoxInput.getAttribute('aria-controls')).toBeTruthy()
    })

    const listboxId = comboBoxInput.getAttribute('aria-controls') as string
    const listbox = document.getElementById(listboxId) as HTMLElement

    await userEvent.click(within(listbox).getByText('Ten Off'))

    const saveButton = screen.getByTestId(DISCOUNT_DRAWER_SAVE_TEST_ID)

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled()
    })

    await userEvent.click(saveButton)

    await waitFor(() => {
      expect(onPersist).toHaveBeenCalledTimes(1)
    })

    const persistedPayload = onPersist.mock.calls[0][0] as {
      coupons: Array<{
        id: string
        localId: string
        overrides: {
          amountCents: number | null
          percentageRate: number | null
          frequency: string
          frequencyDuration: number | null
        }
      }>
    }

    expect(persistedPayload.coupons).toHaveLength(1)

    const [coupon] = persistedPayload.coupons

    expect(coupon.id).toBe('cpn_fixed')
    expect(coupon.localId).toBe('mock-uuid-1')
    expect(coupon.overrides).toEqual({
      amountCents: 1000,
      percentageRate: null,
      frequency: 'once',
      frequencyDuration: null,
    })
  })

  it('persists a typed recurring duration (int formatter yields a number, not a string)', async () => {
    // Regression: the `int` beforeChangeFormatter runs parseInt and stores
    // frequencyDuration as a NUMBER. The schema previously declared z.string(),
    // so typing a duration on a recurring discount failed validation
    // ("Invalid input: expected string, received number") and blocked save.
    const onPersist = jest.fn()
    const { result } = renderHook(() =>
      useDiscountDrawer(undefined, { currency: CurrencyEnum.Usd, onPersist }),
    )

    const onSave = jest.fn()

    act(() => {
      result.current.onDiscountCommand({ onSave })
    })

    const openArgs = mockDrawerOpen.mock.calls[0][0]

    render(
      <>
        {openArgs.children}
        {openArgs.actions}
      </>,
    )

    // Only the coupon combobox is rendered until a coupon is selected.
    const comboBoxInput = screen.getByRole('combobox') as HTMLInputElement

    await userEvent.type(comboBoxInput, 'Ten')

    await waitFor(() => {
      expect(comboBoxInput.getAttribute('aria-controls')).toBeTruthy()
    })

    const listboxId = comboBoxInput.getAttribute('aria-controls') as string
    const listbox = document.getElementById(listboxId) as HTMLElement

    await userEvent.click(within(listbox).getByText('Ten Off'))

    // Selecting the coupon prefills frequency = Once (its label key). Switch the
    // frequency dropdown to Recurring so the duration field appears.
    const freqInput = (await screen.findByDisplayValue(
      'text_632d68358f1fedc68eed3ea3',
    )) as HTMLInputElement

    await userEvent.click(freqInput)

    await waitFor(() => {
      expect(freqInput.getAttribute('aria-controls')).toBeTruthy()
    })

    const freqListbox = document.getElementById(
      freqInput.getAttribute('aria-controls') as string,
    ) as HTMLElement

    await userEvent.click(within(freqListbox).getByText('text_632d68358f1fedc68eed3e64'))

    // Duration field now renders. Typing runs the `int` formatter → number.
    const durationInput = await screen.findByPlaceholderText('text_632d68358f1fedc68eed3e88')

    await userEvent.type(durationInput, '6')

    const saveButton = screen.getByTestId(DISCOUNT_DRAWER_SAVE_TEST_ID)

    // Before the fix, the numeric value failed z.string() validation, so
    // canSubmit stayed false and the button never enabled.
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled()
    })

    await userEvent.click(saveButton)

    await waitFor(() => {
      expect(onPersist).toHaveBeenCalledTimes(1)
    })

    const persistedPayload = onPersist.mock.calls[0][0] as {
      coupons: Array<{
        overrides: { frequency: string; frequencyDuration: number | null }
      }>
    }

    expect(persistedPayload.coupons[0].overrides.frequency).toBe('recurring')
    expect(persistedPayload.coupons[0].overrides.frequencyDuration).toBe(6)
  })

  it('calls onPersist with updated overrides when editing an existing coupon', async () => {
    const initialBillingItems: BillingItemsPayload = {
      addOns: [],
      coupons: [
        {
          type: 'coupon',
          id: 'cpn_fixed',
          localId: 'saved-local',
          payload: {
            position: 1,
            code: 'COUPON_CODE',
            id: 'cpn_fixed',
            name: 'Ten Off',
            type: 'fixed_amount',
            amountCents: 1000,
            percentageRate: null,
            currency: CurrencyEnum.Usd,
            frequency: 'once',
            frequencyDuration: null,
            expirationAt: null,
            limitedPlans: false,
            planCodes: [],
            limitedBillableMetrics: false,
            billableMetricCodes: [],
            couponOverrides: null,
            catalogSnapshot: null,
            resolvedPayload: null,
          },
          overrides: {
            amountCents: 1000,
            percentageRate: null,
            frequency: 'once',
            frequencyDuration: null,
          },
        },
      ],
    }

    const onPersist = jest.fn()
    const { result } = renderHook(() =>
      useDiscountDrawer(initialBillingItems, { currency: CurrencyEnum.Usd, onPersist }),
    )

    const onSave = jest.fn()

    act(() => {
      result.current.onDiscountCommand({
        onSave,
        editData: { couponId: 'cpn_fixed', localId: 'saved-local' },
      })
    })

    const openArgs = mockDrawerOpen.mock.calls[0][0]

    render(
      <>
        {openArgs.children}
        {openArgs.actions}
      </>,
    )

    // The form opens pre-filled with valid values from the existing coupon, so the save
    // button is enabled immediately — no combobox interaction needed.
    const allSaveButtons = screen.getAllByTestId(DISCOUNT_DRAWER_SAVE_TEST_ID)
    const saveButton = allSaveButtons[allSaveButtons.length - 1]

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled()
    })

    await userEvent.click(saveButton)

    await waitFor(() => {
      expect(onPersist).toHaveBeenCalledTimes(1)
    })

    const persistedPayload = onPersist.mock.calls[0][0] as {
      coupons: Array<{ id: string; localId: string }>
    }

    expect(persistedPayload.coupons).toHaveLength(1)
    expect(persistedPayload.coupons[0].id).toBe('cpn_fixed')
    expect(persistedPayload.coupons[0].localId).toBe('saved-local')
  })

  it('does NOT remove the existing block when editing and the save fails', async () => {
    const initialBillingItems: BillingItemsPayload = {
      addOns: [],
      coupons: [
        {
          type: 'coupon',
          id: 'cpn_fixed',
          localId: 'saved-local',
          payload: {
            position: 1,
            code: 'COUPON_CODE',
            id: 'cpn_fixed',
            name: 'Ten Off',
            type: 'fixed_amount',
            amountCents: 1000,
            percentageRate: null,
            currency: CurrencyEnum.Usd,
            frequency: 'once',
            frequencyDuration: null,
            expirationAt: null,
            limitedPlans: false,
            planCodes: [],
            limitedBillableMetrics: false,
            billableMetricCodes: [],
            couponOverrides: null,
            catalogSnapshot: null,
            resolvedPayload: null,
          },
          overrides: {
            amountCents: 1000,
            percentageRate: null,
            frequency: 'once',
            frequencyDuration: null,
          },
        },
      ],
    }

    const onPersist = jest.fn().mockResolvedValue({ ok: false, error: new ApolloError({}) })
    const onRemoveBlock = jest.fn()

    const { result } = renderHook(() =>
      useDiscountDrawer(initialBillingItems, {
        currency: CurrencyEnum.Usd,
        onPersist,
        onRemoveBlock,
      }),
    )

    act(() => {
      result.current.onDiscountCommand({
        onSave: jest.fn(),
        editData: { couponId: 'cpn_fixed', localId: 'saved-local' },
      })
    })

    const openArgs = mockDrawerOpen.mock.calls[0][0]

    render(
      <>
        {openArgs.children}
        {openArgs.actions}
      </>,
    )

    const allSaveButtons = screen.getAllByTestId(DISCOUNT_DRAWER_SAVE_TEST_ID)
    const saveButton = allSaveButtons[allSaveButtons.length - 1]

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled()
    })

    await userEvent.click(saveButton)

    await waitFor(() => {
      expect(onPersist).toHaveBeenCalledTimes(1)
    })

    // A failed edit keeps the drawer open but must NOT remove the existing block.
    expect(onRemoveBlock).not.toHaveBeenCalled()
    expect(mockDrawerClose).not.toHaveBeenCalled()
  })

  it('prefills from saved override values when editing', () => {
    const initialBillingItems: BillingItemsPayload = {
      addOns: [],
      coupons: [
        {
          type: 'coupon',
          id: 'cpn_edit',
          localId: 'saved-local',
          payload: {
            position: 1,
            code: 'EDIT',
            id: 'cpn_edit',
            name: 'Edit Coupon',
            type: 'fixed_amount',
            amountCents: 5000,
            percentageRate: null,
            currency: CurrencyEnum.Usd,
            frequency: 'recurring',
            frequencyDuration: 3,
            expirationAt: null,
            limitedPlans: false,
            planCodes: [],
            limitedBillableMetrics: false,
            billableMetricCodes: [],
            couponOverrides: null,
            catalogSnapshot: null,
            resolvedPayload: null,
          },
          overrides: {
            amountCents: 4200,
            percentageRate: null,
            frequency: 'recurring',
            frequencyDuration: 6,
          },
        },
      ],
    }

    const { result } = renderHook(() => useDiscountDrawer(initialBillingItems, options))

    // entities hydrated from saved coupon
    expect(result.current.entities).toHaveProperty('saved-local')
    expect(result.current.entities['saved-local'].entityType).toBe('coupon')

    act(() => {
      result.current.onDiscountCommand({
        onSave: jest.fn(),
        editData: { couponId: 'cpn_edit', localId: 'saved-local' },
      })
    })

    const openArgs = mockDrawerOpen.mock.calls[0][0]

    render(<>{openArgs.children}</>)

    // Prefilled amount from override (4200 cents / USD = 42), no trailing .00, currency locked USD.
    expect(screen.getByDisplayValue('42')).toBeInTheDocument()
    expect(screen.getByDisplayValue(CurrencyEnum.Usd)).toBeInTheDocument()
  })

  it('rebuilds the entity to the new coupon when editing to a different coupon', async () => {
    // Existing block bound to a different coupon than the one offered by the
    // combobox mock (cpn_fixed / "Ten Off"). Switching coupon must refresh the
    // block + preview to the newly selected coupon, not keep the old identity.
    const initialBillingItems: BillingItemsPayload = {
      addOns: [],
      coupons: [
        {
          type: 'coupon',
          id: 'cpn_edit',
          localId: 'saved-local',
          payload: {
            position: 1,
            code: 'EDIT',
            id: 'cpn_edit',
            name: 'Edit Coupon',
            type: 'fixed_amount',
            amountCents: 5000,
            percentageRate: null,
            currency: CurrencyEnum.Usd,
            frequency: 'once',
            frequencyDuration: null,
            expirationAt: null,
            limitedPlans: false,
            planCodes: [],
            limitedBillableMetrics: false,
            billableMetricCodes: [],
            couponOverrides: null,
            catalogSnapshot: null,
            resolvedPayload: null,
          },
          overrides: {
            amountCents: 5000,
            percentageRate: null,
            frequency: 'once',
            frequencyDuration: null,
          },
        },
      ],
    }

    const onPersist = jest.fn()
    const { result } = renderHook(() =>
      useDiscountDrawer(initialBillingItems, { currency: CurrencyEnum.Usd, onPersist }),
    )

    // Sanity: entity starts as the old coupon.
    expect(result.current.entities['saved-local']).toMatchObject({
      name: 'Edit Coupon',
      code: 'EDIT',
    })

    const onSave = jest.fn()

    act(() => {
      result.current.onDiscountCommand({
        onSave,
        editData: { couponId: 'cpn_edit', localId: 'saved-local' },
      })
    })

    const openArgs = mockDrawerOpen.mock.calls[0][0]

    render(
      <>
        {openArgs.children}
        {openArgs.actions}
      </>,
    )

    // Switch to the different coupon offered by the combobox. Editing a prefilled
    // fixed-amount coupon also renders the locked currency combobox, so target the
    // coupon selector explicitly — it is the first combobox rendered.
    const comboBoxInput = screen.getAllByRole('combobox')[0] as HTMLInputElement

    await userEvent.type(comboBoxInput, 'Ten')

    await waitFor(() => {
      expect(comboBoxInput.getAttribute('aria-controls')).toBeTruthy()
    })

    const listboxId = comboBoxInput.getAttribute('aria-controls') as string
    const listbox = document.getElementById(listboxId) as HTMLElement

    await userEvent.click(within(listbox).getByText('Ten Off'))

    const allSaveButtons = screen.getAllByTestId(DISCOUNT_DRAWER_SAVE_TEST_ID)
    const saveButton = allSaveButtons[allSaveButtons.length - 1]

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled()
    })

    await userEvent.click(saveButton)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({ couponId: 'cpn_fixed', localId: 'saved-local' })
    })

    // The rebuilt entity (drives both the editor block and the preview) must
    // reflect the NEW coupon's identity, not the stale one.
    expect(result.current.entities['saved-local']).toMatchObject({
      name: 'Ten Off',
      code: 'COUPON_CODE',
      couponType: CouponTypeEnum.FixedAmount,
    })
  })

  describe('GIVEN onPersist rejects the save', () => {
    const selectFixedAmountCoupon = async () => {
      const comboBoxInput = screen.getByRole('combobox') as HTMLInputElement

      await userEvent.type(comboBoxInput, 'Ten')

      await waitFor(() => {
        expect(comboBoxInput.getAttribute('aria-controls')).toBeTruthy()
      })

      const listboxId = comboBoxInput.getAttribute('aria-controls') as string
      const listbox = document.getElementById(listboxId) as HTMLElement

      await userEvent.click(within(listbox).getByText('Ten Off'))
    }

    it('keeps the drawer open, rolls back the block, and shows a field error on a mapped 422', async () => {
      const setServerFieldErrorsSpy = jest.spyOn(serverFieldErrorsUtil, 'setServerFieldErrors')

      const mappedError = new ApolloError({
        graphQLErrors: [
          {
            message: 'Unprocessable Entity',
            extensions: {
              code: 'unprocessable_entity',
              details: { 'billingItems.coupons.0.amountCents': ['value_is_invalid'] },
            },
          } as never,
        ],
      })

      const onPersist = jest.fn().mockResolvedValue({ ok: false, error: mappedError })
      const onRemoveBlock = jest.fn()
      const onSave = jest.fn()

      const { result } = renderHook(() =>
        useDiscountDrawer(undefined, { currency: CurrencyEnum.Usd, onPersist, onRemoveBlock }),
      )

      act(() => {
        result.current.onDiscountCommand({ onSave })
      })

      const openArgs = mockDrawerOpen.mock.calls[0][0]

      render(
        <>
          {openArgs.children}
          {openArgs.actions}
        </>,
      )

      await selectFixedAmountCoupon()

      const saveButton = screen.getByTestId(DISCOUNT_DRAWER_SAVE_TEST_ID)

      await waitFor(() => {
        expect(saveButton).not.toBeDisabled()
      })

      await userEvent.click(saveButton)

      await waitFor(() => {
        expect(onPersist).toHaveBeenCalledTimes(1)
      })

      // The block was inserted optimistically, then rolled back on failure.
      expect(onSave).toHaveBeenCalledWith({ couponId: 'cpn_fixed', localId: 'mock-uuid-1' })
      expect(onRemoveBlock).toHaveBeenCalledWith('mock-uuid-1')

      // Field-level error surfaced inline on the amount field via the `onDynamic`
      // errorMap slot (gated by messageKey so Zod revalidation can't clobber it).
      await waitFor(() => {
        expect(setServerFieldErrorsSpy).toHaveBeenCalledWith(
          expect.anything(),
          [{ path: 'amount', code: 'value_is_invalid' }],
          QUOTE_FIELD_ERROR_KEY,
        )
      })

      expect(mockAddToast).not.toHaveBeenCalled()
      expect(mockDrawerClose).not.toHaveBeenCalled()

      // Nothing was committed — the drawer's local state stays empty.
      expect(result.current.entities).not.toHaveProperty('mock-uuid-1')

      // Deadlock recovery: the 422 leaves the server error in the slot, so the
      // save button is disabled (canSubmit=false). Editing the field clears the
      // error via the onChange listener, re-enabling the button for a resubmit.
      await waitFor(() => {
        expect(saveButton).toBeDisabled()
      })

      await userEvent.type(screen.getByDisplayValue('10'), '5')

      await waitFor(() => {
        expect(saveButton).not.toBeDisabled()
      })

      setServerFieldErrorsSpy.mockRestore()
    })

    it('toasts and stays open on an unmappable failure', async () => {
      const unmappableError = new ApolloError({
        graphQLErrors: [
          {
            message: 'Internal Server Error',
            extensions: { code: 'internal_server_error' },
          } as never,
        ],
      })

      const onPersist = jest.fn().mockResolvedValue({ ok: false, error: unmappableError })
      const onRemoveBlock = jest.fn()
      const onSave = jest.fn()

      const { result } = renderHook(() =>
        useDiscountDrawer(undefined, { currency: CurrencyEnum.Usd, onPersist, onRemoveBlock }),
      )

      act(() => {
        result.current.onDiscountCommand({ onSave })
      })

      const openArgs = mockDrawerOpen.mock.calls[0][0]

      render(
        <>
          {openArgs.children}
          {openArgs.actions}
        </>,
      )

      await selectFixedAmountCoupon()

      const saveButton = screen.getByTestId(DISCOUNT_DRAWER_SAVE_TEST_ID)

      await waitFor(() => {
        expect(saveButton).not.toBeDisabled()
      })

      await userEvent.click(saveButton)

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          severity: 'danger',
          translateKey: QUOTE_SAVE_FAILED_TOAST_KEY,
        })
      })

      expect(onRemoveBlock).toHaveBeenCalledWith('mock-uuid-1')
      expect(mockDrawerClose).not.toHaveBeenCalled()
      expect(result.current.entities).not.toHaveProperty('mock-uuid-1')
    })

    it('commits and closes on success', async () => {
      const onPersist = jest.fn().mockResolvedValue({ ok: true })
      const onRemoveBlock = jest.fn()
      const onSave = jest.fn()

      const { result } = renderHook(() =>
        useDiscountDrawer(undefined, { currency: CurrencyEnum.Usd, onPersist, onRemoveBlock }),
      )

      act(() => {
        result.current.onDiscountCommand({ onSave })
      })

      const openArgs = mockDrawerOpen.mock.calls[0][0]

      render(
        <>
          {openArgs.children}
          {openArgs.actions}
        </>,
      )

      await selectFixedAmountCoupon()

      const saveButton = screen.getByTestId(DISCOUNT_DRAWER_SAVE_TEST_ID)

      await waitFor(() => {
        expect(saveButton).not.toBeDisabled()
      })

      await userEvent.click(saveButton)

      await waitFor(() => {
        expect(mockDrawerClose).toHaveBeenCalled()
      })

      expect(onRemoveBlock).not.toHaveBeenCalled()

      await waitFor(() => {
        expect(result.current.entities).toHaveProperty('mock-uuid-1')
      })
    })
  })
})
