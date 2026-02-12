import { gql } from '@apollo/client'
import { useMemo } from 'react'

import { CheckboxGroup } from '~/components/form'

// import { useEventTypesQuery } from '~/generated/graphql'

gql`
  query eventTypes {
    eventTypes
  }
`

// TODO: Backend will change this query to return objects with eventName and eventDescription
// For now, we mock the data
type EventType = {
  eventName: string
  eventDescription: string
}

// Mock data - will be replaced when backend returns the actual data
const MOCK_EVENT_TYPES: EventType[] = [
  // Alerts
  {
    eventName: 'alert.triggered',
    eventDescription: 'Sent when an alert threshold is reached',
  },
  {
    eventName: 'alert.resolved',
    eventDescription: 'Sent when an alert condition is no longer met',
  },
  {
    eventName: 'alert.acknowledged',
    eventDescription: 'Sent when an alert is acknowledged by a user',
  },
  {
    eventName: 'alert.escalated',
    eventDescription: 'Sent when an alert is escalated to another level',
  },
  {
    eventName: 'alert.suppressed',
    eventDescription: 'Sent when an alert is suppressed',
  },
  // Credit Notes
  {
    eventName: 'credit_note.created',
    eventDescription: 'Sent when a new credit note is created',
  },
  {
    eventName: 'credit_note.updated',
    eventDescription: 'Sent when a credit note is updated',
  },
  {
    eventName: 'credit_note.voided',
    eventDescription: 'Sent when a credit note is voided',
  },
  {
    eventName: 'credit_note.refund_initiated',
    eventDescription: 'Sent when a refund is initiated for a credit note',
  },
  {
    eventName: 'credit_note.refund_completed',
    eventDescription: 'Sent when a refund is completed for a credit note',
  },
  // Customers
  {
    eventName: 'customer.created',
    eventDescription: 'Sent when a new customer is created',
  },
  {
    eventName: 'customer.updated',
    eventDescription: 'Sent when a customer is updated',
  },
  {
    eventName: 'customer.deleted',
    eventDescription: 'Sent when a customer is deleted',
  },
  {
    eventName: 'customer.payment_provider_created',
    eventDescription: 'Sent when a payment provider is linked to a customer',
  },
  {
    eventName: 'customer.checkout_url_generated',
    eventDescription: 'Sent when a checkout URL is generated for a customer',
  },
  // Invoices
  {
    eventName: 'invoice.created',
    eventDescription: 'Sent when a new invoice is created',
  },
  {
    eventName: 'invoice.updated',
    eventDescription: 'Sent when an invoice is updated',
  },
  {
    eventName: 'invoice.finalized',
    eventDescription: 'Sent when an invoice is finalized and ready for payment',
  },
  {
    eventName: 'invoice.paid',
    eventDescription: 'Sent when an invoice is marked as paid',
  },
  {
    eventName: 'invoice.voided',
    eventDescription: 'Sent when an invoice is voided',
  },
  // Subscriptions
  {
    eventName: 'subscription.created',
    eventDescription: 'Sent when a new subscription is created',
  },
  {
    eventName: 'subscription.updated',
    eventDescription: 'Sent when a subscription is updated',
  },
  {
    eventName: 'subscription.terminated',
    eventDescription: 'Sent when a subscription is terminated',
  },
  {
    eventName: 'subscription.upgraded',
    eventDescription: 'Sent when a subscription is upgraded to a higher plan',
  },
  {
    eventName: 'subscription.downgraded',
    eventDescription: 'Sent when a subscription is downgraded to a lower plan',
  },
  // Payment receipts
  {
    eventName: 'payment_receipts.plans',
    eventDescription: 'Sent when payment receipt plans are updated',
  },
  {
    eventName: 'payment_receipts.created',
    eventDescription: 'Sent when a new payment receipt is created',
  },
  {
    eventName: 'payment_receipts.updated',
    eventDescription: 'Sent when a payment receipt is updated',
  },
  {
    eventName: 'payment_receipts.processed',
    eventDescription: 'Sent when a payment receipt is successfully processed',
  },
  {
    eventName: 'payment_receipts.failed',
    eventDescription: 'Sent when a payment receipt processing fails',
  },
  // Wallets
  {
    eventName: 'wallet.created',
    eventDescription: 'Sent when a new wallet is created',
  },
  {
    eventName: 'wallet.updated',
    eventDescription: 'Sent when a wallet is updated',
  },
  {
    eventName: 'wallet.depleted',
    eventDescription: 'Sent when a wallet balance is depleted',
  },
  {
    eventName: 'wallet.topped_up',
    eventDescription: 'Sent when a wallet is topped up with credits',
  },
  {
    eventName: 'wallet.terminated',
    eventDescription: 'Sent when a wallet is terminated',
  },
]

/**
 * Extracts the category from an event name.
 * e.g., "customer.created" -> "customer"
 * e.g., "payment_receipts.plans" -> "payment_receipts"
 */
const extractCategory = (eventName: string): string => {
  const dotIndex = eventName.indexOf('.')

  if (dotIndex === -1) return eventName
  return eventName.substring(0, dotIndex)
}

/**
 * Formats a category slug into a display label.
 * e.g., "customer" -> "Customers"
 * e.g., "payment_receipts" -> "Payment receipts"
 * e.g., "credit_note" -> "Credit notes"
 */
const formatCategoryLabel = (category: string): string => {
  // Replace underscores with spaces
  const withSpaces = category.replace(/_/g, ' ')

  // Capitalize first letter
  const capitalized = withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1)

  // Add 's' for plural if not already ending with 's'
  if (!capitalized.endsWith('s')) {
    return `${capitalized}s`
  }

  return capitalized
}

/**
 * Converts an event name to a form-safe key by replacing dots with double underscores.
 * TanStack Form interprets dots as nested paths, so we need to escape them.
 * e.g., "customer.created" -> "customer__created"
 */
export const eventNameToFormKey = (eventName: string): string => {
  return eventName.replace(/\./g, '__')
}

/**
 * Converts a form key back to the original event name.
 * e.g., "customer__created" -> "customer.created"
 */
export const formKeyToEventName = (formKey: string): string => {
  return formKey.replace(/__/g, '.')
}

/**
 * Transforms a list of event types into grouped checkbox data.
 */
const transformEventTypesToGroups = (eventTypes: EventType[]): CheckboxGroup[] => {
  // Group events by category
  const groupedByCategory = eventTypes.reduce<Record<string, EventType[]>>((acc, event) => {
    const category = extractCategory(event.eventName)

    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(event)
    return acc
  }, {})

  // Transform to CheckboxGroup format and sort alphabetically
  return Object.entries(groupedByCategory)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, events]) => ({
      id: category,
      label: formatCategoryLabel(category),
      items: events.map((event) => ({
        // Use form-safe key (no dots) for the checkbox ID
        id: eventNameToFormKey(event.eventName),
        label: event.eventName,
        sublabel: event.eventDescription,
      })),
    }))
}

/**
 * Creates empty boolean values (all false) from the event types.
 * Used for initializing form default values.
 * Uses form-safe keys (no dots) for TanStack Form compatibility.
 */
const createEmptyValuesFromEventTypes = (eventTypes: EventType[]): Record<string, boolean> => {
  return eventTypes.reduce<Record<string, boolean>>((acc, event) => {
    acc[eventNameToFormKey(event.eventName)] = false
    return acc
  }, {})
}

/**
 * Empty values for all webhook events - used to initialize form state.
 * All event names are set to false by default.
 */
export const webhookEventsEmptyValues = createEmptyValuesFromEventTypes(MOCK_EVENT_TYPES)

/**
 * Computed display information for webhook event types.
 * Centralizes the logic for determining which events to display.
 */
type WebhookEventDisplayInfo = {
  /** Whether the webhook is listening to all events (eventTypes is null/undefined) */
  isListeningToAll: boolean
  /** The list of events to display (all events if listening to all, otherwise the specific ones) */
  displayedEvents: string[]
  /** The count of events being listened to */
  eventCount: number
}

/**
 * Computes display information for webhook event types.
 *
 * Logic:
 * - null/undefined eventTypes → listening to ALL events
 * - empty array → listening to NO events
 * - array with values → listening to SPECIFIC events
 *
 * @param eventTypes - The eventTypes from the webhook (null = all, [] = none, [...] = specific)
 * @param allEventNames - All available event names
 */
const getWebhookEventDisplayInfo = (
  eventTypes: string[] | null | undefined,
  allEventNames: string[],
): WebhookEventDisplayInfo => {
  const isListeningToAll = eventTypes === null || eventTypes === undefined
  const displayedEvents = isListeningToAll ? allEventNames : eventTypes
  const eventCount = displayedEvents.length

  return {
    isListeningToAll,
    displayedEvents,
    eventCount,
  }
}

type UseWebhookEventTypes = () => {
  loading: boolean
  groups: CheckboxGroup[]
  /** All available event names */
  allEventNames: string[]
  /**
   * Utility function to compute display info for a webhook's eventTypes.
   * Centralizes the logic: null = all events, [] = none, [...] = specific.
   */
  getEventDisplayInfo: (eventTypes: string[] | null | undefined) => WebhookEventDisplayInfo
}

export const useWebhookEventTypes: UseWebhookEventTypes = () => {
  // TODO: Uncomment when backend is ready
  // const { data, loading } = useEventTypesQuery()

  // Mock loading state
  const loading = false

  const groups = useMemo(() => {
    // TODO: When backend is ready, transform real data
    // if (!data?.eventTypes) return []
    // return transformEventTypesToGroups(data.eventTypes)

    return transformEventTypesToGroups(MOCK_EVENT_TYPES)
  }, [])

  const allEventNames = useMemo(() => {
    // TODO: When backend is ready, use data.eventTypes directly
    // return data?.eventTypes?.map(e => e.eventName) ?? []

    return MOCK_EVENT_TYPES.map((e) => e.eventName)
  }, [])

  const getEventDisplayInfo = useMemo(
    () => (eventTypes: string[] | null | undefined) =>
      getWebhookEventDisplayInfo(eventTypes, allEventNames),
    [allEventNames],
  )

  return {
    loading,
    groups,
    allEventNames,
    getEventDisplayInfo,
  }
}
