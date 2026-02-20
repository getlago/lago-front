import { renderHook } from '@testing-library/react'
import { ReactNode } from 'react'

import { useEventTypesQuery } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import {
  eventNameToFormKey,
  formKeyToEventName,
  useWebhookEventTypes,
} from '../useWebhookEventTypes'

// Mock the GraphQL query
const mockEventTypesData = {
  eventTypes: [
    { name: 'customer.created', description: 'Customer created event' },
    { name: 'customer.updated', description: 'Customer updated event' },
    { name: 'invoice.created', description: 'Invoice created event' },
    { name: 'invoice.paid', description: 'Invoice paid event' },
    { name: 'subscription.started', description: 'Subscription started event' },
    { name: 'payment_receipts.plans', description: 'Payment receipts plans event' },
  ],
}

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useEventTypesQuery: jest.fn(() => ({
    data: mockEventTypesData,
    loading: false,
  })),
}))

const TestWrapper = ({ children }: { children: ReactNode }) => (
  <AllTheProviders>{children}</AllTheProviders>
)

TestWrapper.displayName = 'TestWrapper'

describe('useWebhookEventTypes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('eventNameToFormKey', () => {
    describe('GIVEN an event name with a dot', () => {
      describe('WHEN converting to form key', () => {
        it('THEN should replace dot with double underscore', () => {
          expect(eventNameToFormKey('customer.created')).toBe('customer__created')
        })
      })
    })

    describe('GIVEN an event name with underscores and dot', () => {
      describe('WHEN converting to form key', () => {
        it('THEN should only replace the dot', () => {
          expect(eventNameToFormKey('payment_receipts.plans')).toBe('payment_receipts__plans')
        })
      })
    })
  })

  describe('formKeyToEventName', () => {
    describe('GIVEN a form key with double underscore', () => {
      describe('WHEN converting to event name', () => {
        it('THEN should replace double underscore with dot', () => {
          expect(formKeyToEventName('customer__created')).toBe('customer.created')
        })
      })
    })
  })

  describe('hook return values', () => {
    describe('GIVEN the hook is called', () => {
      describe('WHEN data is loaded', () => {
        it('THEN should return loading as false', () => {
          const { result } = renderHook(() => useWebhookEventTypes(), { wrapper: TestWrapper })

          expect(result.current.loading).toBe(false)
        })

        it('THEN should return groups organized by category', () => {
          const { result } = renderHook(() => useWebhookEventTypes(), { wrapper: TestWrapper })

          expect(result.current.groups).toHaveLength(4)

          const customerGroup = result.current.groups.find((g) => g.id === 'customer')

          expect(customerGroup).toBeDefined()
          expect(customerGroup?.label).toBe('Customers')
          expect(customerGroup?.items).toHaveLength(2)
        })

        it('THEN should return all event names', () => {
          const { result } = renderHook(() => useWebhookEventTypes(), { wrapper: TestWrapper })

          expect(result.current.allEventNames).toEqual([
            'customer.created',
            'customer.updated',
            'invoice.created',
            'invoice.paid',
            'subscription.started',
            'payment_receipts.plans',
          ])
        })

        it('THEN should return default form values with all events unchecked', () => {
          const { result } = renderHook(() => useWebhookEventTypes(), { wrapper: TestWrapper })

          expect(result.current.defaultEventFormValues).toEqual({
            customer__created: false,
            customer__updated: false,
            invoice__created: false,
            invoice__paid: false,
            subscription__started: false,
            payment_receipts__plans: false,
          })
        })
      })
    })
  })

  describe('getEventDisplayInfo', () => {
    describe('GIVEN eventTypes is null', () => {
      describe('WHEN getting display info', () => {
        it('THEN should indicate listening to all events', () => {
          const { result } = renderHook(() => useWebhookEventTypes(), { wrapper: TestWrapper })

          const displayInfo = result.current.getEventDisplayInfo(null)

          expect(displayInfo.isListeningToAll).toBe(true)
          expect(displayInfo.displayedEvents).toEqual(result.current.allEventNames)
          expect(displayInfo.eventCount).toBe(6)
        })
      })
    })

    describe('GIVEN eventTypes is undefined', () => {
      describe('WHEN getting display info', () => {
        it('THEN should indicate listening to all events', () => {
          const { result } = renderHook(() => useWebhookEventTypes(), { wrapper: TestWrapper })

          const displayInfo = result.current.getEventDisplayInfo(undefined)

          expect(displayInfo.isListeningToAll).toBe(true)
          expect(displayInfo.eventCount).toBe(6)
        })
      })
    })

    describe('GIVEN eventTypes is an empty array', () => {
      describe('WHEN getting display info', () => {
        it('THEN should indicate not listening to all events with count 0', () => {
          const { result } = renderHook(() => useWebhookEventTypes(), { wrapper: TestWrapper })

          const displayInfo = result.current.getEventDisplayInfo([])

          expect(displayInfo.isListeningToAll).toBe(false)
          expect(displayInfo.displayedEvents).toEqual([])
          expect(displayInfo.eventCount).toBe(0)
        })
      })
    })

    describe('GIVEN eventTypes has specific events', () => {
      describe('WHEN getting display info', () => {
        it('THEN should return the specific events', () => {
          const { result } = renderHook(() => useWebhookEventTypes(), { wrapper: TestWrapper })

          const eventTypes = ['customer.created', 'invoice.paid']
          const displayInfo = result.current.getEventDisplayInfo(eventTypes)

          expect(displayInfo.isListeningToAll).toBe(false)
          expect(displayInfo.displayedEvents).toEqual(eventTypes)
          expect(displayInfo.eventCount).toBe(2)
        })
      })
    })
  })

  describe('groups structure', () => {
    describe('GIVEN events from different categories', () => {
      describe('WHEN groups are generated', () => {
        it('THEN should sort groups alphabetically by category', () => {
          const { result } = renderHook(() => useWebhookEventTypes(), { wrapper: TestWrapper })

          const groupIds = result.current.groups.map((g) => g.id)

          expect(groupIds).toEqual(['customer', 'invoice', 'payment_receipts', 'subscription'])
        })

        it('THEN should format category labels correctly', () => {
          const { result } = renderHook(() => useWebhookEventTypes(), { wrapper: TestWrapper })

          const labels = result.current.groups.map((g) => g.label)

          expect(labels).toContain('Customers')
          expect(labels).toContain('Invoices')
          expect(labels).toContain('Subscriptions')
          expect(labels).toContain('Payment receipts')
        })

        it('THEN should use form-safe keys for item IDs', () => {
          const { result } = renderHook(() => useWebhookEventTypes(), { wrapper: TestWrapper })

          const customerGroup = result.current.groups.find((g) => g.id === 'customer')
          const itemIds = customerGroup?.items.map((i) => i.id)

          expect(itemIds).toContain('customer__created')
          expect(itemIds).toContain('customer__updated')
        })

        it('THEN should preserve original event names as item labels', () => {
          const { result } = renderHook(() => useWebhookEventTypes(), { wrapper: TestWrapper })

          const customerGroup = result.current.groups.find((g) => g.id === 'customer')
          const itemLabels = customerGroup?.items.map((i) => i.label)

          expect(itemLabels).toContain('customer.created')
          expect(itemLabels).toContain('customer.updated')
        })

        it('THEN should include event descriptions as sublabels', () => {
          const { result } = renderHook(() => useWebhookEventTypes(), { wrapper: TestWrapper })

          const customerGroup = result.current.groups.find((g) => g.id === 'customer')
          const createdItem = customerGroup?.items.find((i) => i.id === 'customer__created')

          expect(createdItem?.sublabel).toBe('Customer created event')
        })
      })
    })
  })
})

describe('useWebhookEventTypes loading state', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Override mock to return loading state
    jest.mocked(useEventTypesQuery).mockReturnValue({
      data: undefined,
      loading: true,
    } as ReturnType<typeof useEventTypesQuery>)
  })

  describe('GIVEN data is loading', () => {
    describe('WHEN the hook is called', () => {
      it('THEN should return loading as true', () => {
        const { result } = renderHook(() => useWebhookEventTypes(), { wrapper: TestWrapper })

        expect(result.current.loading).toBe(true)
      })

      it('THEN should return empty groups', () => {
        const { result } = renderHook(() => useWebhookEventTypes(), { wrapper: TestWrapper })

        expect(result.current.groups).toEqual([])
      })

      it('THEN should return empty allEventNames', () => {
        const { result } = renderHook(() => useWebhookEventTypes(), { wrapper: TestWrapper })

        expect(result.current.allEventNames).toEqual([])
      })

      it('THEN should return empty defaultEventFormValues', () => {
        const { result } = renderHook(() => useWebhookEventTypes(), { wrapper: TestWrapper })

        expect(result.current.defaultEventFormValues).toEqual({})
      })
    })
  })
})
