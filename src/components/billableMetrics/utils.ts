import { evaluateExpression, parseExpression } from 'lago-expression'

import { TranslateFunc } from '~/hooks/core/useInternationalization'

export type EventPayload = {
  event: {
    transaction_id: string
    external_subscription_id: string
    code: string
    timestamp: number
    properties: {
      [key: string]: string
    }
  }
}

export type ValidationResult = {
  result?: string | null
  error?: string | null
}

const REQUIRED_EVENT_FIELDS: Array<keyof EventPayload['event']> = [
  'code',
  'timestamp',
  'properties',
]

export const wrappedEvaluateExpression = (
  expression: string,
  payload: EventPayload | string,
  translate: TranslateFunc,
): ValidationResult => {
  try {
    const eventPayload: EventPayload = typeof payload === 'string' ? JSON.parse(payload) : payload

    REQUIRED_EVENT_FIELDS.forEach((property) => {
      if (!eventPayload?.event?.[property]) {
        throw new Error(
          translate('text_17326923760161haoak0v6km', {
            property,
          }),
        )
      }
    })

    const res = evaluateExpression(
      parseExpression(expression),
      eventPayload.event.code,
      BigInt(eventPayload.event.timestamp),
      eventPayload.event.properties,
    )

    return {
      result: res,
    }
  } catch (e) {
    return {
      error: String(e),
    }
  }
}

export const wrappedParseExpression = (expression?: string | null): boolean => {
  if (!expression) {
    return false
  }

  try {
    parseExpression(expression)

    return true
  } catch {
    return false
  }
}

export const isValidJSON = (json?: unknown) => {
  if (!json) {
    return false
  }

  try {
    if (typeof json === 'object') {
      return true
    }

    if (typeof json === 'string') {
      JSON.parse(json)
    }

    return true
  } catch {
    return false
  }
}
