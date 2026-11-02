import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'

// `scrollToFirstInputError` matches inputs by name, and the forever `Checkbox` renders no named
// input: its errors point at the duration input right above it.
export const scrollToFirstRatePhaseError = (
  formId: string,
  errorMap: Record<string, unknown>,
): void =>
  scrollToFirstInputError(formId, {
    ...errorMap,
    durationCycleCount: errorMap.durationCycleCount ?? errorMap.durationType,
  })
