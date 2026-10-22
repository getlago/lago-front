import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'

// `scrollToFirstInputError` matches inputs by name: the forever `Checkbox` renders no named input
// and the shared rate model selector names its input `chargeModel`.
export const scrollToFirstRatePhaseError = (
  formId: string,
  errorMap: Record<string, unknown>,
): void =>
  scrollToFirstInputError(formId, {
    ...errorMap,
    durationCycleCount: errorMap.durationCycleCount ?? errorMap.durationType,
    chargeModel: errorMap.rateModel,
  })
