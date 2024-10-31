import { EventPayload, ValidationResult } from '~/components/billableMetrics/CustomExpressionDrawer'

import { evaluateExpression, parseExpression } from '../../lago-expression/expression_js'

export const wrappedEvaluateExpression = (
  expression: string,
  payload: EventPayload,
): ValidationResult => {
  try {
    let eventPayload = payload

    if (typeof payload === 'string') {
      eventPayload = JSON.parse(payload)
    }

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
      error: e as string,
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
