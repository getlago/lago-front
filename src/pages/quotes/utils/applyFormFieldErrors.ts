import { AnyFormApi } from '@tanstack/react-form'

import { QuoteMutationError } from './quoteMutationErrors'

/**
 * Pushes the field-targeted messages of a failed quote/order-form mutation into the form, so
 * the error shows inline next to the offending input on top of its toast.
 *
 * Fields are handed the translation key, not the translated sentence: the inputs translate
 * whatever error they receive, exactly like the zod messages the same forms already emit.
 *
 * Errors without a `field` are toast-only and ignored here. `AnyFormApi` keeps the helper
 * usable from any of the quote forms — the field names come from the API payload, so they
 * cannot be tied to a single form's shape.
 */
export const applyFormFieldErrors = (formApi: AnyFormApi, errors: QuoteMutationError[]): void => {
  const fields: Record<string, { message: string; path: string[] }> = {}

  for (const { field, message, messageKey } of errors) {
    if (!field) continue

    fields[field] = { message: messageKey ?? message, path: [field] }
  }

  if (!Object.keys(fields).length) return

  formApi.setErrorMap({ onDynamic: { fields } })
}
