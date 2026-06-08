import { act, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'
import { z } from 'zod'

import { fromBillingItems } from '~/core/serializers/serializeQuoteBillingItems'
import { OrderTypeEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { usePricingDrawer } from '../usePricingDrawer'

// --- Mocks ---

const mockFormDrawerOpen = jest.fn()
const mockFormDrawerClose = jest.fn()

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    organization: { defaultCurrency: 'USD' },
  }),
}))

// drawerStack.ts uses import.meta.hot — mock the entire useDrawer module instead
jest.mock('~/components/drawers/useDrawer', () => ({
  useFormDrawer: () => ({
    open: mockFormDrawerOpen,
    close: mockFormDrawerClose,
  }),
  useDrawer: () => ({
    open: jest.fn(),
    close: jest.fn(),
  }),
}))

jest.mock('~/components/drawers/drawerStack', () => ({
  drawerStack: {
    push: jest.fn(),
    remove: jest.fn(),
    subscribe: jest.fn(() => jest.fn()),
    onClear: jest.fn(() => jest.fn()),
    clearAll: jest.fn(),
    getSnapshot: jest.fn(() => []),
  },
}))

const mockFormReset = jest.fn()
const mockHandleSubmit = jest.fn()

// Capture the onSubmit and setFieldValue calls from useAppForm
let capturedOnSubmit: ((args: { value: Record<string, unknown> }) => void) | null = null
const mockSetFieldValue = jest.fn()
let mockFormValues = { planId: '', addOnItems: [] as Record<string, unknown>[] }

jest.mock('@tanstack/react-form', () => ({
  revalidateLogic: () => ({}),
  createFormHookContexts: jest.fn(() => ({
    fieldContext: {},
    useFieldContext: jest.fn(),
    formContext: {},
    useFormContext: jest.fn(),
  })),
}))

jest.mock('~/hooks/forms/useAppform', () => ({
  useAppForm: (config: Record<string, unknown>) => {
    if (typeof config.onSubmit === 'function') {
      capturedOnSubmit = config.onSubmit as typeof capturedOnSubmit
    }

    return {
      reset: mockFormReset,
      handleSubmit: mockHandleSubmit,
      setFieldValue: mockSetFieldValue,
      state: {
        canSubmit: true,
        get values() {
          return mockFormValues
        },
      },
      store: {
        subscribe: jest.fn(() => jest.fn()),
        getState: () => ({
          values: mockFormValues,
          canSubmit: true,
        }),
      },
      AppField: () => null,
      AppForm: () => null,
      Subscribe: () => null,
    }
  },
}))

jest.mock('~/core/serializers/serializeQuoteBillingItems', () => ({
  fromBillingItems: jest.fn(),
  toBillingItems: jest.fn(),
}))

jest.mock('~/components/designSystem/RichTextEditor/PricingBlock/PricingDrawerContent', () => ({
  __esModule: true,
  default: () => null,
}))

const mockedFromBillingItems = fromBillingItems as jest.Mock

const wrapper = ({ children }: { children: ReactNode }) => (
  <AllTheProviders>{children}</AllTheProviders>
)

// --- Helpers ---

const mockAddOnPayload = {
  position: 1,
  add_on_code: 'setup',
  name: 'Setup Fee',
  description: 'One-time setup fee',
  units: 1,
  unit_amount_cents: 10000,
  total_amount_cents: 10000,
  invoice_display_name: 'Setup',
  from_datetime: null,
  to_datetime: null,
  tax_codes: ['vat_20'],
}

const mockBillingItemsPayload = {
  addons: [
    {
      type: 'addon' as const,
      id: 'addon-1',
      payload: mockAddOnPayload,
      overrides: {},
    },
  ],
}

// --- Tests ---

describe('usePricingDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedOnSubmit = null
    mockFormValues = { planId: '', addOnItems: [] }
  })

  describe('GIVEN the hook is called', () => {
    describe('WHEN it returns', () => {
      it('THEN should return onPricingCommand, entities, and syncEntitiesWithBlocks', () => {
        const { result } = renderHook(() => usePricingDrawer(OrderTypeEnum.OneOff), { wrapper })

        expect(typeof result.current.onPricingCommand).toBe('function')
        expect(result.current.entities).toBeDefined()
        expect(typeof result.current.syncEntitiesWithBlocks).toBe('function')
      })
    })

    describe('WHEN no initialBillingItems is provided', () => {
      it('THEN entities should be an empty object', () => {
        const { result } = renderHook(() => usePricingDrawer(OrderTypeEnum.OneOff), { wrapper })

        expect(result.current.entities).toEqual({})
      })
    })
  })

  describe('GIVEN initialBillingItems is provided', () => {
    describe('WHEN the hook mounts with billing items containing add-ons', () => {
      it('THEN should call fromBillingItems and populate entities', () => {
        mockedFromBillingItems.mockReturnValue({
          entities: {
            'addon-1': {
              entityId: 'addon-1',
              entityType: 'addOn',
              name: 'Setup Fee',
              invoiceDisplayName: 'Setup',
              code: 'setup',
              description: 'One-time setup fee',
              units: '1',
              unitAmountCents: '10000',
              totalAmount: '10000',
              fromDatetime: '',
              toDatetime: '',
            },
          },
          originalPayloads: {
            'addon-1': mockAddOnPayload,
          },
          addOnItems: [],
        })

        const { result } = renderHook(
          () => usePricingDrawer(OrderTypeEnum.OneOff, mockBillingItemsPayload),
          { wrapper },
        )

        expect(mockedFromBillingItems).toHaveBeenCalledWith(mockBillingItemsPayload)
        expect(result.current.entities).toEqual({
          'addon-1': expect.objectContaining({
            entityId: 'addon-1',
            entityType: 'addOn',
            name: 'Setup Fee',
            code: 'setup',
          }),
        })
      })
    })

    describe('WHEN initialBillingItems has no addons', () => {
      it('THEN should not call fromBillingItems', () => {
        const emptyPayload = { addons: [] }

        renderHook(() => usePricingDrawer(OrderTypeEnum.OneOff, emptyPayload), { wrapper })

        expect(mockedFromBillingItems).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN onPricingCommand is called', () => {
    describe('WHEN called with an onSave callback and no editData', () => {
      it('THEN should open the form drawer', () => {
        const { result } = renderHook(() => usePricingDrawer(OrderTypeEnum.OneOff), { wrapper })

        act(() => {
          result.current.onPricingCommand({
            onSave: jest.fn(),
            editData: undefined,
          })
        })

        expect(mockFormDrawerOpen).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.any(String),
            form: expect.objectContaining({
              id: expect.any(String),
              submit: expect.any(Function),
            }),
            children: expect.anything(),
          }),
        )
      })
    })

    describe('WHEN called for a subscription creation order type', () => {
      it('THEN should open the form drawer with the plan selection title', () => {
        const { result } = renderHook(() => usePricingDrawer(OrderTypeEnum.SubscriptionCreation), {
          wrapper,
        })

        act(() => {
          result.current.onPricingCommand({
            onSave: jest.fn(),
            editData: undefined,
          })
        })

        expect(mockFormDrawerOpen).toHaveBeenCalledTimes(1)
        const callArgs = mockFormDrawerOpen.mock.calls[0][0]

        // The title for subscription types should be the plan selection key
        expect(callArgs.title).toBe('text_17799586575628qyl2jk1tbn')
      })
    })

    describe('WHEN called for a one-off order type', () => {
      it('THEN should open the form drawer with the add-on selection title', () => {
        const { result } = renderHook(() => usePricingDrawer(OrderTypeEnum.OneOff), { wrapper })

        act(() => {
          result.current.onPricingCommand({
            onSave: jest.fn(),
            editData: undefined,
          })
        })

        expect(mockFormDrawerOpen).toHaveBeenCalledTimes(1)
        const callArgs = mockFormDrawerOpen.mock.calls[0][0]

        // The title for one-off types should be the add-on selection key
        expect(callArgs.title).toBe('text_17799586575620rdqef1d7dq')
      })
    })
  })

  describe('GIVEN isPricingDisabled is called', () => {
    describe('WHEN order type is one-off and entities exist', () => {
      it('THEN should return true', () => {
        mockedFromBillingItems.mockReturnValue({
          entities: {
            'addon-1': {
              entityId: 'addon-1',
              entityType: 'addOn',
              name: 'Setup Fee',
              code: 'setup',
            },
          },
          originalPayloads: {
            'addon-1': mockAddOnPayload,
          },
          addOnItems: [],
        })

        const { result } = renderHook(
          () => usePricingDrawer(OrderTypeEnum.OneOff, mockBillingItemsPayload),
          { wrapper },
        )

        expect(result.current.isPricingDisabled()).toBe(true)
      })
    })

    describe('WHEN order type is one-off and no entities exist', () => {
      it('THEN should return false', () => {
        const { result } = renderHook(() => usePricingDrawer(OrderTypeEnum.OneOff), { wrapper })

        expect(result.current.isPricingDisabled()).toBe(false)
      })
    })

    describe('WHEN order type is subscription creation and entities exist', () => {
      it('THEN should return false', () => {
        mockedFromBillingItems.mockReturnValue({
          entities: {
            'addon-1': {
              entityId: 'addon-1',
              entityType: 'addOn',
              name: 'Setup Fee',
              code: 'setup',
            },
          },
          originalPayloads: {
            'addon-1': mockAddOnPayload,
          },
          addOnItems: [],
        })

        const { result } = renderHook(
          () => usePricingDrawer(OrderTypeEnum.SubscriptionCreation, mockBillingItemsPayload),
          { wrapper },
        )

        expect(result.current.isPricingDisabled()).toBe(false)
      })
    })
  })

  describe('GIVEN onPricingCommand is called for a one-off quote with existing entities', () => {
    describe('WHEN it is a new insertion (no editData)', () => {
      it('THEN should not open the form drawer', () => {
        mockedFromBillingItems.mockReturnValue({
          entities: {
            'addon-1': {
              entityId: 'addon-1',
              entityType: 'addOn',
              name: 'Setup Fee',
              code: 'setup',
            },
          },
          originalPayloads: {
            'addon-1': mockAddOnPayload,
          },
          addOnItems: [],
        })

        const { result } = renderHook(
          () => usePricingDrawer(OrderTypeEnum.OneOff, mockBillingItemsPayload),
          { wrapper },
        )

        act(() => {
          result.current.onPricingCommand({
            onSave: jest.fn(),
            editData: undefined,
          })
        })

        expect(mockFormDrawerOpen).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN syncEntitiesWithBlocks is called', () => {
    describe('WHEN all entities are referenced in blocks', () => {
      it('THEN should return null indicating no orphans', () => {
        mockedFromBillingItems.mockReturnValue({
          entities: {
            'addon-1': {
              entityId: 'addon-1',
              entityType: 'addOn',
              name: 'Setup Fee',
              code: 'setup',
            },
          },
          originalPayloads: {
            'addon-1': mockAddOnPayload,
          },
          addOnItems: [],
        })

        const { result } = renderHook(
          () => usePricingDrawer(OrderTypeEnum.OneOff, mockBillingItemsPayload),
          { wrapper },
        )

        const blocks = [{ pricingType: 'addOns' as const, entityIds: ['addon-1'] }]

        let syncResult: unknown

        act(() => {
          syncResult = result.current.syncEntitiesWithBlocks(blocks)
        })

        expect(syncResult).toBeNull()
      })
    })

    describe('WHEN some entities are not referenced in blocks', () => {
      it('THEN should remove orphaned entities and return updated billing items', () => {
        const secondPayload = {
          ...mockAddOnPayload,
          position: 2,
          add_on_code: 'onboarding',
          name: 'Onboarding Fee',
        }

        mockedFromBillingItems.mockReturnValue({
          entities: {
            'addon-1': {
              entityId: 'addon-1',
              entityType: 'addOn',
              name: 'Setup Fee',
              code: 'setup',
            },
            'addon-2': {
              entityId: 'addon-2',
              entityType: 'addOn',
              name: 'Onboarding Fee',
              code: 'onboarding',
            },
          },
          originalPayloads: {
            'addon-1': mockAddOnPayload,
            'addon-2': secondPayload,
          },
          addOnItems: [],
        })

        const billingItemsWithTwo = {
          addons: [
            {
              type: 'addon' as const,
              id: 'addon-1',
              payload: mockAddOnPayload,
              overrides: {},
            },
            {
              type: 'addon' as const,
              id: 'addon-2',
              payload: secondPayload,
              overrides: {},
            },
          ],
        }

        const { result } = renderHook(
          () => usePricingDrawer(OrderTypeEnum.OneOff, billingItemsWithTwo),
          { wrapper },
        )

        // Blocks only reference addon-1, so addon-2 becomes orphaned
        const blocks = [{ pricingType: 'addOns' as const, entityIds: ['addon-1'] }]

        let syncResult: unknown

        act(() => {
          syncResult = result.current.syncEntitiesWithBlocks(blocks)
        })

        expect(syncResult).not.toBeNull()

        const payload = syncResult as { addons: Array<{ id: string }> }

        // Only addon-1 should remain
        expect(payload.addons).toHaveLength(1)
        expect(payload.addons[0].id).toBe('addon-1')

        // Entities should no longer include addon-2
        expect(result.current.entities).toHaveProperty('addon-1')
        expect(result.current.entities).not.toHaveProperty('addon-2')
      })
    })

    describe('WHEN there are no entities at all', () => {
      it('THEN should return null', () => {
        const { result } = renderHook(() => usePricingDrawer(OrderTypeEnum.OneOff), { wrapper })

        const blocks = [{ pricingType: 'addOns' as const, entityIds: [] }]

        let syncResult: unknown

        act(() => {
          syncResult = result.current.syncEntitiesWithBlocks(blocks)
        })

        expect(syncResult).toBeNull()
      })
    })
  })

  describe('GIVEN onPricingCommand is called with editData', () => {
    describe('WHEN it is a subscription creation with pricingType plan', () => {
      it('THEN should reset the form with the plan ID as initialPlanId', () => {
        const { result } = renderHook(() => usePricingDrawer(OrderTypeEnum.SubscriptionCreation), {
          wrapper,
        })

        act(() => {
          result.current.onPricingCommand({
            onSave: jest.fn(),
            editData: { pricingType: 'plan', entityIds: ['plan-abc'] },
          })
        })

        expect(mockFormReset).toHaveBeenCalledWith(
          { planId: 'plan-abc', addOnItems: [] },
          { keepDefaultValues: true },
        )
        expect(mockFormDrawerOpen).toHaveBeenCalled()
      })
    })

    describe('WHEN it is a one-off order with pricingType addOns and existing entities', () => {
      it('THEN should reset the form with initialAddOnItems from entity data', () => {
        mockedFromBillingItems.mockReturnValue({
          entities: {
            'addon-1': {
              entityId: 'addon-1',
              entityType: 'addOn',
              name: 'Setup Fee',
              invoiceDisplayName: 'Setup',
              code: 'setup',
              description: 'One-time setup',
              units: '2',
              unitAmountCents: '5000',
              totalAmount: '10000',
              fromDatetime: '2026-01-01T00:00:00.000Z',
              toDatetime: '2026-01-31T23:59:59.999Z',
            },
          },
          originalPayloads: { 'addon-1': mockAddOnPayload },
          addOnItems: [],
        })

        const { result } = renderHook(
          () => usePricingDrawer(OrderTypeEnum.OneOff, mockBillingItemsPayload),
          { wrapper },
        )

        act(() => {
          result.current.onPricingCommand({
            onSave: jest.fn(),
            editData: { pricingType: 'addOns', entityIds: ['addon-1'] },
          })
        })

        expect(mockFormReset).toHaveBeenCalledWith(
          expect.objectContaining({
            planId: '',
            addOnItems: expect.arrayContaining([
              expect.objectContaining({
                addOnId: 'addon-1',
                name: 'Setup Fee',
                code: 'setup',
                units: '2',
                unitAmountCents: '5000',
              }),
            ]),
          }),
          { keepDefaultValues: true },
        )
        expect(mockFormDrawerOpen).toHaveBeenCalled()
      })
    })

    describe('WHEN it is a one-off with editData and existing entities', () => {
      it('THEN should still open the drawer (bypass the one-off guard for edits)', () => {
        mockedFromBillingItems.mockReturnValue({
          entities: {
            'addon-1': {
              entityId: 'addon-1',
              entityType: 'addOn',
              name: 'Setup Fee',
              code: 'setup',
            },
          },
          originalPayloads: { 'addon-1': mockAddOnPayload },
          addOnItems: [],
        })

        const { result } = renderHook(
          () => usePricingDrawer(OrderTypeEnum.OneOff, mockBillingItemsPayload),
          { wrapper },
        )

        act(() => {
          result.current.onPricingCommand({
            onSave: jest.fn(),
            editData: { pricingType: 'addOns', entityIds: ['addon-1'] },
          })
        })

        // Edit mode should bypass the one-off single-block guard
        expect(mockFormDrawerOpen).toHaveBeenCalled()
      })
    })

    describe('WHEN it is a subscription creation with no editData planId', () => {
      it('THEN should reset the form with an empty planId', () => {
        const { result } = renderHook(() => usePricingDrawer(OrderTypeEnum.SubscriptionCreation), {
          wrapper,
        })

        act(() => {
          result.current.onPricingCommand({
            onSave: jest.fn(),
            editData: undefined,
          })
        })

        expect(mockFormReset).toHaveBeenCalledWith(
          { planId: '', addOnItems: [] },
          { keepDefaultValues: true },
        )
      })
    })
  })

  describe('GIVEN the form onSubmit handler is invoked', () => {
    describe('WHEN submitting for a subscription creation with a planId', () => {
      it('THEN should call onSave with plan entity data and update entities', () => {
        const mockOnSave = jest.fn()

        const { result } = renderHook(() => usePricingDrawer(OrderTypeEnum.SubscriptionCreation), {
          wrapper,
        })

        // Trigger onPricingCommand to capture onSaveRef and onSubmit
        act(() => {
          result.current.onPricingCommand({
            onSave: mockOnSave,
            editData: undefined,
          })
        })

        // Simulate form values for a plan submission
        mockFormValues = { planId: 'plan-123', addOnItems: [] }

        // Invoke the captured onSubmit
        expect(capturedOnSubmit).not.toBeNull()
        act(() => {
          capturedOnSubmit?.({ value: mockFormValues })
        })

        expect(mockOnSave).toHaveBeenCalledWith(
          { pricingType: 'plan', entityIds: ['plan-123'] },
          expect.objectContaining({
            'plan-123': expect.objectContaining({
              entityId: 'plan-123',
              entityType: 'plan',
            }),
          }),
        )
      })
    })

    describe('WHEN submitting for a subscription creation with no planId', () => {
      it('THEN should not call onSave', () => {
        const mockOnSave = jest.fn()

        const { result } = renderHook(() => usePricingDrawer(OrderTypeEnum.SubscriptionCreation), {
          wrapper,
        })

        act(() => {
          result.current.onPricingCommand({
            onSave: mockOnSave,
            editData: undefined,
          })
        })

        // Empty planId
        mockFormValues = { planId: '', addOnItems: [] }

        act(() => {
          capturedOnSubmit?.({ value: mockFormValues })
        })

        expect(mockOnSave).not.toHaveBeenCalled()
      })
    })

    describe('WHEN submitting for a one-off with confirmed add-on items', () => {
      it('THEN should call onSave with add-on entity data and billing items', () => {
        const mockOnSave = jest.fn()

        const { result } = renderHook(() => usePricingDrawer(OrderTypeEnum.OneOff), {
          wrapper,
        })

        act(() => {
          result.current.onPricingCommand({
            onSave: mockOnSave,
            editData: undefined,
          })
        })

        // Simulate confirmed add-on items
        mockFormValues = {
          planId: '',
          addOnItems: [
            {
              addOnId: 'addon-1',
              name: 'Setup Fee',
              invoiceDisplayName: 'Setup',
              code: 'setup',
              description: 'Desc',
              units: '2',
              unitAmountCents: '5000',
              totalAmount: '10000',
              fromDatetime: '2026-01-01',
              toDatetime: '2026-01-31',
            },
          ],
        }

        act(() => {
          capturedOnSubmit?.({ value: mockFormValues })
        })

        expect(mockOnSave).toHaveBeenCalledWith(
          { pricingType: 'addOns', entityIds: ['addon-1'] },
          expect.objectContaining({
            'addon-1': expect.objectContaining({
              entityId: 'addon-1',
              entityType: 'addOn',
              name: 'Setup Fee',
              units: '2',
            }),
          }),
          undefined, // toBillingItems is mocked, returns undefined
        )

        // Entities should be updated
        expect(result.current.entities).toHaveProperty('addon-1')
      })
    })

    describe('WHEN submitting for a one-off with no confirmed add-on items', () => {
      it('THEN should not call onSave', () => {
        const mockOnSave = jest.fn()

        const { result } = renderHook(() => usePricingDrawer(OrderTypeEnum.OneOff), {
          wrapper,
        })

        act(() => {
          result.current.onPricingCommand({
            onSave: mockOnSave,
            editData: undefined,
          })
        })

        // Only pending items (empty addOnId)
        mockFormValues = {
          planId: '',
          addOnItems: [{ addOnId: '', name: '', code: '' }],
        }

        act(() => {
          capturedOnSubmit?.({ value: mockFormValues })
        })

        expect(mockOnSave).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the captureAddOnPayload callback', () => {
    describe('WHEN an add-on is selected in the drawer', () => {
      it('THEN should store the add-on payload for later serialization', () => {
        const { result } = renderHook(() => usePricingDrawer(OrderTypeEnum.OneOff), { wrapper })

        act(() => {
          result.current.onPricingCommand({
            onSave: jest.fn(),
            editData: undefined,
          })
        })

        // Extract onAddOnPayloadCapture from the rendered PricingDrawerContent children
        const callArgs = mockFormDrawerOpen.mock.calls[0][0]
        const captureCallback = callArgs.children.props.onAddOnPayloadCapture

        expect(captureCallback).toBeDefined()

        // Invoke it to exercise captureAddOnPayload (lines 82-93)
        act(() => {
          captureCallback('addon-new', {
            id: 'addon-new',
            code: 'onboarding',
            name: 'Onboarding Fee',
            description: 'One-time onboarding',
            amountCents: '7500',
            amountCurrency: 'USD',
            invoiceDisplayName: 'Onboarding',
            taxes: [{ id: 'tax-1', code: 'vat_20' }],
          })
        })

        // The payload should now be stored — verify by submitting with this add-on
        mockFormValues = {
          planId: '',
          addOnItems: [
            {
              addOnId: 'addon-new',
              name: 'Onboarding Fee',
              invoiceDisplayName: 'Onboarding',
              code: 'onboarding',
              description: 'One-time onboarding',
              units: '1',
              unitAmountCents: '7500',
              totalAmount: '7500',
              fromDatetime: '2026-01-01',
              toDatetime: '2026-01-31',
            },
          ],
        }

        const mockOnSave = jest.fn()

        // Re-trigger onPricingCommand to set up the onSave ref
        act(() => {
          result.current.onPricingCommand({
            onSave: mockOnSave,
            editData: { pricingType: 'addOns', entityIds: ['addon-new'] },
          })
        })

        act(() => {
          capturedOnSubmit?.({ value: mockFormValues })
        })

        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({ pricingType: 'addOns', entityIds: ['addon-new'] }),
          expect.objectContaining({
            'addon-new': expect.objectContaining({ entityId: 'addon-new' }),
          }),
          undefined, // toBillingItems is mocked, returns undefined
        )
      })
    })
  })

  describe('GIVEN the handleSubmit function inside onPricingCommand', () => {
    describe('WHEN form.submit is invoked from the drawer', () => {
      it('THEN should call form.handleSubmit', async () => {
        const { result } = renderHook(() => usePricingDrawer(OrderTypeEnum.OneOff), { wrapper })

        act(() => {
          result.current.onPricingCommand({
            onSave: jest.fn(),
            editData: undefined,
          })
        })

        const callArgs = mockFormDrawerOpen.mock.calls[0][0]

        await act(async () => {
          await callArgs.form.submit()
        })

        expect(mockHandleSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN isPricingDisabled is called for subscription amendment', () => {
    describe('WHEN order type is subscription amendment and entities exist', () => {
      it('THEN should return false', () => {
        mockedFromBillingItems.mockReturnValue({
          entities: {
            'addon-1': {
              entityId: 'addon-1',
              entityType: 'addOn',
              name: 'Setup Fee',
              code: 'setup',
            },
          },
          originalPayloads: { 'addon-1': mockAddOnPayload },
          addOnItems: [],
        })

        const { result } = renderHook(
          () => usePricingDrawer(OrderTypeEnum.SubscriptionAmendment, mockBillingItemsPayload),
          { wrapper },
        )

        expect(result.current.isPricingDisabled()).toBe(false)
      })
    })
  })
})

// --- Standalone validation schema tests (mirrors the superRefine in usePricingDrawer) ---

const pricingDrawerValidationSchema = z
  .object({
    planId: z.string(),
    addOnItems: z.array(
      z.object({
        addOnId: z.string(),
        name: z.string(),
        invoiceDisplayName: z.string(),
        code: z.string(),
        description: z.string(),
        units: z.string(),
        unitAmountCents: z.string(),
        totalAmount: z.string(),
        fromDatetime: z.string(),
        toDatetime: z.string(),
      }),
    ),
  })
  .superRefine((data, ctx) => {
    // Simulates one-off validation (isPlanSelection = false)
    const confirmed = data.addOnItems.filter((item) => item.addOnId)

    if (confirmed.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one add-on required',
        path: ['addOnItems'],
      })
      return
    }

    data.addOnItems.forEach((item, index) => {
      if (!item.addOnId) return

      if (!item.units || item.units === '0') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Units required',
          path: ['addOnItems', index, 'units'],
        })
      }

      if (!item.unitAmountCents) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Unit price required',
          path: ['addOnItems', index, 'unitAmountCents'],
        })
      }
    })
  })

const validAddOnItem = {
  addOnId: 'addon-1',
  name: 'Setup Fee',
  invoiceDisplayName: 'Setup',
  code: 'setup',
  description: 'desc',
  units: '2',
  unitAmountCents: '5000',
  totalAmount: '10000',
  fromDatetime: '2026-01-01T00:00:00.000Z',
  toDatetime: '2026-01-31T23:59:59.999Z',
}

const pendingAddOnItem = {
  ...validAddOnItem,
  addOnId: '', // pending — no addOnId selected yet
}

describe('pricingDrawer validation schema (one-off path)', () => {
  describe('GIVEN valid data with a confirmed add-on', () => {
    describe('WHEN the schema validates', () => {
      it('THEN should pass validation', () => {
        const result = pricingDrawerValidationSchema.safeParse({
          planId: '',
          addOnItems: [validAddOnItem],
        })

        expect(result.success).toBe(true)
      })
    })
  })

  describe('GIVEN no confirmed add-ons (all have empty addOnId)', () => {
    describe('WHEN the schema validates', () => {
      it('THEN should fail with addOnItems error', () => {
        const result = pricingDrawerValidationSchema.safeParse({
          planId: '',
          addOnItems: [pendingAddOnItem],
        })

        expect(result.success).toBe(false)

        if (!result.success) {
          const addOnError = result.error.issues.find((issue) => issue.path.includes('addOnItems'))

          expect(addOnError).toBeDefined()
        }
      })
    })
  })

  describe('GIVEN a confirmed add-on with missing units', () => {
    describe('WHEN the schema validates', () => {
      it('THEN should fail with units error', () => {
        const result = pricingDrawerValidationSchema.safeParse({
          planId: '',
          addOnItems: [{ ...validAddOnItem, units: '' }],
        })

        expect(result.success).toBe(false)

        if (!result.success) {
          const unitsError = result.error.issues.find((issue) => issue.path.includes('units'))

          expect(unitsError).toBeDefined()
        }
      })
    })
  })

  describe('GIVEN a confirmed add-on with units equal to zero', () => {
    describe('WHEN the schema validates', () => {
      it('THEN should fail with units error', () => {
        const result = pricingDrawerValidationSchema.safeParse({
          planId: '',
          addOnItems: [{ ...validAddOnItem, units: '0' }],
        })

        expect(result.success).toBe(false)

        if (!result.success) {
          const unitsError = result.error.issues.find((issue) => issue.path.includes('units'))

          expect(unitsError).toBeDefined()
        }
      })
    })
  })

  describe('GIVEN a confirmed add-on with missing unitAmountCents', () => {
    describe('WHEN the schema validates', () => {
      it('THEN should fail with unitAmountCents error', () => {
        const result = pricingDrawerValidationSchema.safeParse({
          planId: '',
          addOnItems: [{ ...validAddOnItem, unitAmountCents: '' }],
        })

        expect(result.success).toBe(false)

        if (!result.success) {
          const priceError = result.error.issues.find((issue) =>
            issue.path.includes('unitAmountCents'),
          )

          expect(priceError).toBeDefined()
        }
      })
    })
  })

  describe('GIVEN a mix of pending and confirmed items', () => {
    describe('WHEN the confirmed item is valid', () => {
      it('THEN should pass validation (pending items are skipped)', () => {
        const result = pricingDrawerValidationSchema.safeParse({
          planId: '',
          addOnItems: [pendingAddOnItem, validAddOnItem],
        })

        expect(result.success).toBe(true)
      })
    })
  })

  describe('GIVEN an empty addOnItems array', () => {
    describe('WHEN the schema validates', () => {
      it('THEN should fail with no confirmed add-ons error', () => {
        const result = pricingDrawerValidationSchema.safeParse({
          planId: '',
          addOnItems: [],
        })

        expect(result.success).toBe(false)
      })
    })
  })
})
