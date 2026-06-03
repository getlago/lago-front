import { act, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'

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
  useAppForm: () => ({
    reset: mockFormReset,
    handleSubmit: mockHandleSubmit,
    state: { canSubmit: true, values: { planId: '', addOnItems: [] } },
    store: {
      subscribe: jest.fn(() => jest.fn()),
      getState: () => ({
        values: { planId: '', addOnItems: [] },
        canSubmit: true,
      }),
    },
    AppField: () => null,
    AppForm: () => null,
    Subscribe: () => null,
  }),
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
})
