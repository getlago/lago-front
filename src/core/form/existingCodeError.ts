import { AnyFormApi } from '@tanstack/react-form'
import { GraphQLFormattedError } from 'graphql'

import { hasDefinedGQLError } from '~/core/apolloClient/errorUtils'
import { addToast } from '~/core/apolloClient/reactiveVars/toastVar'

// Backend "code already exists" message, surfaced under the Code input on save.
// Shared by every entity form with a unique code so the string can't drift
// between them.
export const EXISTING_CODE_ERROR_MESSAGE = 'text_632a2d437e341dcc76817556'

// The field-error slice `applyExistingCodeError` writes. Exported for the forms
// that also hand it to `scrollToFirstInputError`.
export const EXISTING_CODE_FIELD_ERRORS = {
  code: { message: EXISTING_CODE_ERROR_MESSAGE, path: ['code'] },
}

// Surfaces the backend duplicate-code rejection under the Code input, keeping
// the form open.
//
// Not `setFieldMeta`: only `setErrorMap` stamps `errorSourceMap.onDynamic =
// 'form'`, which is what lets the next form validation drop the error again. An
// error written with `setFieldMeta` reads as field-owned, no field-level
// validator ever clears it, and submit stays disabled for the life of the form.
export const applyExistingCodeError = (formApi: AnyFormApi): void => {
  formApi.setErrorMap({ onDynamic: { fields: EXISTING_CODE_FIELD_ERRORS } })
}

// A `ValueAlreadyExist` rejection only belongs on the Code input when the API
// reports it under `code`; a collision on any other unique field gets the
// generic toast rather than a wrong — or missing — field error. Callers must
// silence the error at the link (`silentErrorDetails`) so the toast is not
// raised twice. Returns whether the Code input was flagged.
export const applyExistingCodeErrorOrToast = (
  formApi: AnyFormApi,
  errors?: readonly GraphQLFormattedError[],
): boolean => {
  if (!hasDefinedGQLError('ValueAlreadyExist', errors)) return false

  if (!hasDefinedGQLError('ValueAlreadyExist', errors, 'code')) {
    addToast({ severity: 'danger', translateKey: 'text_622f7a3dc32ce100c46a5154' })

    return false
  }

  applyExistingCodeError(formApi)

  return true
}
