import { AnyFormApi } from '@tanstack/react-form'

// Backend "code already exists" message, surfaced under the Code input on save
// and cleared when the user edits the code (so submit re-enables). Shared by
// every entity form with a unique code so the string can't drift between them.
export const EXISTING_CODE_ERROR_MESSAGE = 'text_632a2d437e341dcc76817556'

// Surfaces the backend duplicate-code rejection under the Code input (keeps the
// drawer open). Same pattern as plan-settings code.
export const applyExistingCodeError = (formApi: AnyFormApi): void => {
  formApi.setFieldMeta('code', (meta) => ({
    ...meta,
    errorMap: { ...meta.errorMap, onDynamic: { message: EXISTING_CODE_ERROR_MESSAGE } },
  }))
}
