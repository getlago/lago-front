import { AnyFormApi } from '@tanstack/react-form'

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
