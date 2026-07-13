import { z } from 'zod'

import { generateUniqueCode } from '~/core/utils/generateUniqueCode'

// Duplicate-code helpers now live in core so non-plan entity forms can share
// them; re-exported here so the charge drawers keep their historical import.
export { applyExistingCodeError, EXISTING_CODE_ERROR_MESSAGE } from '~/core/form/existingCodeError'

const CODE_REQUIRED_MESSAGE = 'text_624ea7c29103fd010732ab7d'

// `code` is only required when the field is shown (v2 details/edition via
// `showCode`); the legacy plan form keeps it optional so its hidden, empty code
// never blocks submit.
export const buildChargeCodeSchema = (requireCode: boolean) =>
  requireCode ? z.string().min(1, { message: CODE_REQUIRED_MESSAGE }) : z.string()

// Seeds a unique charge code from a source (add-on / billable-metric) code when
// the Code field is shown in create mode; backend still enforces final
// uniqueness. No-op when disabled so callers can pass the guard inline.
export const seedChargeCode = ({
  enabled,
  sourceCode,
  existingChargeCodes,
  setCode,
}: {
  enabled: boolean
  sourceCode: string
  existingChargeCodes: (string | null | undefined)[] | undefined
  setCode: (code: string) => void
}): void => {
  if (!enabled) return

  setCode(generateUniqueCode(sourceCode, existingChargeCodes ?? []))
}
