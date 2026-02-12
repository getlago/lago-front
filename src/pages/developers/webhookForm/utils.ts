import { eventNameToFormKey, formKeyToEventName } from '~/hooks/useWebhookEventTypes'

/**
 * Converts the webhookEvents form state (Record<formKey, boolean>) to the eventTypes
 * API value:
 *  - null     → filtering OFF (all checkboxes selected → receive everything)
 *  - []       → filtering ON, no events (no checkbox selected → receive nothing)
 *  - string[] → filtering ON (only selected events)
 *
 * Apollo Client serialises null in JSON correctly, so we do NOT need ["*"].
 */
export const formValuesToEventTypes = (webhookEvents: Record<string, boolean>): string[] | null => {
  const entries = Object.entries(webhookEvents)
  const selectedEvents = entries
    .filter(([, checked]) => checked)
    .map(([key]) => formKeyToEventName(key))

  // All selected → null (filtering OFF, backend sends everything)
  if (selectedEvents.length === entries.length) {
    return null
  }

  // None or partial selection → return the array (possibly empty)
  return selectedEvents
}

/**
 * Converts the eventTypes from the API back to the webhookEvents form state.
 *  - null / undefined → all checkboxes true (filtering OFF = receive everything)
 *  - []               → all checkboxes false (filtering ON, no events)
 *  - string[]         → matching checkboxes true
 *
 * @param eventTypes  - value from the API
 * @param allFormKeys - all available form keys (from the event types list)
 */
export const eventTypesToFormValues = (
  eventTypes: string[] | null | undefined,
  allFormKeys: string[],
): Record<string, boolean> => {
  // Build a fresh record with all keys set to false
  const values: Record<string, boolean> = {}

  for (const key of allFormKeys) {
    values[key] = false
  }

  // null/undefined means filtering OFF → all events selected
  if (eventTypes === null || eventTypes === undefined) {
    for (const key of allFormKeys) {
      values[key] = true
    }

    return values
  }

  // Empty array or specific events → set matching ones to true
  for (const eventName of eventTypes) {
    const key = eventNameToFormKey(eventName)

    if (key in values) {
      values[key] = true
    }
  }

  return values
}
