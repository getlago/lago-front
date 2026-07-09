import type { AnyFormApi } from '@tanstack/react-form'

import type { MappedFieldError } from './mapBillingItemErrors'

// Server (422) field errors are written into the `onDynamic` errorMap slot — the
// same slot Zod validation uses, and the same convention as the charge-code
// duplicate-code error (see `chargeCode.ts`). Fields render `meta.errors`, which
// aggregates the slot, so the message shows inline. Each entry must be an object
// shaped like `{ message }` — fields render via `meta.errors.map((e) => e.message)`,
// so a plain string entry has no `.message` and silently renders nothing.
//
// Because the slot is shared with Zod, clearing is gated by the server
// `messageKey` so a genuine validation error occupying the slot is never wiped.
const SERVER_ERROR_SLOT = 'onDynamic' as const

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

export const clearServerFieldErrors = (
  form: AnyFormApi,
  paths: string[],
  messageKey: string,
): void => {
  paths.forEach((path) => {
    const meta = form.getFieldMeta(path as never) as
      { errorMap?: Record<string, { message?: string } | undefined> } | undefined

    // Only clear our own server error — never a Zod validation error that now
    // occupies the same slot. Reading first also avoids setFieldMeta churn when
    // this runs on every keystroke (e.g. from a form `onChange` listener) and
    // avoids writing back `undefined` meta for a field that never mounted.
    if (meta?.errorMap?.[SERVER_ERROR_SLOT]?.message !== messageKey) return

    form.setFieldMeta(path as never, (current) => ({
      ...current,
      errorMap: { ...current?.errorMap, [SERVER_ERROR_SLOT]: undefined },
    }))
  })
}
