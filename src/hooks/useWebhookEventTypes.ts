import { gql } from '@apollo/client'
import { useMemo } from 'react'

import { CheckboxGroup } from '~/components/form'
import { EventTypesQuery, useEventTypesQuery } from '~/generated/graphql'

gql`
  query eventTypes {
    eventTypes {
      name
      description
    }
  }
`

type EventTypeItem = EventTypesQuery['eventTypes'][number]

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
const transformEventTypesToGroups = (eventTypes: EventTypeItem[]): CheckboxGroup[] => {
  // Group events by category
  const groupedByCategory = eventTypes.reduce<Record<string, EventTypeItem[]>>((acc, event) => {
    const category = extractCategory(event.name)

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
        id: eventNameToFormKey(event.name),
        label: event.name,
        sublabel: event.description,
      })),
    }))
}

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
  /** Default form values for all events (all unchecked) — used for form initialization */
  defaultEventFormValues: Record<string, boolean>
  /**
   * Utility function to compute display info for a webhook's eventTypes.
   * Centralizes the logic: null = all events, [] = none, [...] = specific.
   */
  getEventDisplayInfo: (eventTypes: string[] | null | undefined) => WebhookEventDisplayInfo
}

export const useWebhookEventTypes: UseWebhookEventTypes = () => {
  const { data, loading } = useEventTypesQuery()

  const groups = useMemo(() => {
    if (!data?.eventTypes) return []
    return transformEventTypesToGroups(data.eventTypes)
  }, [data?.eventTypes])

  const allEventNames = useMemo(() => {
    return data?.eventTypes?.map((e) => e.name) ?? []
  }, [data?.eventTypes])

  // Builds the default form state for webhook event checkboxes: all events set to false (unchecked).
  // Used to initialize the form and to derive the list of all available form keys.
  const defaultEventFormValues = useMemo(() => {
    if (!data?.eventTypes) return {}
    return data.eventTypes.reduce<Record<string, boolean>>((acc, event) => {
      acc[eventNameToFormKey(event.name)] = false
      return acc
    }, {})
  }, [data?.eventTypes])

  const getEventDisplayInfo = useMemo(
    () => (eventTypes: string[] | null | undefined) =>
      getWebhookEventDisplayInfo(eventTypes, allEventNames),
    [allEventNames],
  )

  return {
    loading,
    groups,
    allEventNames,
    defaultEventFormValues,
    getEventDisplayInfo,
  }
}
