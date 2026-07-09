import type { AnyFormApi } from '@tanstack/react-form'

import type { MappedFieldError } from './mapBillingItemErrors'

// The drawers validate on the `onDynamic` slot (Zod). Server errors go into the
// unused `onSubmit` slot so Zod re-validation does not clobber them; fields read
// `meta.errors` which aggregates all slots. Each errorMap entry must be an
// object shaped like `{ message }` — fields (e.g. `TextInputFieldForTanstack`)
// render via `state.meta.errors.map((e) => e.message)`, so a plain string
// entry has no `.message` and silently renders nothing.
const SERVER_ERROR_SLOT = 'onSubmit' as const

export const setServerFieldErrors = (
  form: AnyFormApi,
  fieldErrors: MappedFieldError[],
  messageKey: string,
): void => {
  fieldErrors.forEach(({ path }) => {
    // `meta` is undefined when the target field has never mounted a `Field`
    // component (e.g. a conditionally-rendered field for a coupon type/frequency
    // the user isn't currently on) — fall back to an empty errorMap instead of
    // crashing on `meta.errorMap`.
    form.setFieldMeta(path as never, (meta) => ({
      ...meta,
      errorMap: { ...meta?.errorMap, [SERVER_ERROR_SLOT]: { message: messageKey } },
    }))
  })
}

export const clearServerFieldErrors = (form: AnyFormApi, paths: string[]): void => {
  paths.forEach((path) => {
    form.setFieldMeta(path as never, (meta) => ({
      ...meta,
      errorMap: { ...meta?.errorMap, [SERVER_ERROR_SLOT]: undefined },
    }))
  })
}
