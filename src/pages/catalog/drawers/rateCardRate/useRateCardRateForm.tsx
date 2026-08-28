import { FetchResult, gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { DateTime } from 'luxon'
import { useRef } from 'react'

import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { applyExistingCodeError } from '~/core/form/existingCodeError'
import { serializeAmount } from '~/core/serializers/serializeAmount'
import { serializeProperties } from '~/core/serializers/serializePlanInput'
import {
  CustomChargeFragmentDoc,
  GraduatedChargeFragmentDoc,
  GraduatedPercentageChargeFragmentDoc,
  LagoApiError,
  PackageChargeFragmentDoc,
  PercentageChargeFragmentDoc,
  PricingGroupKeysFragmentDoc,
  Properties,
  PropertiesForActiveRateFragmentDoc,
  PropertiesInput,
  RateCardBillingTimingEnum,
  RateCardForRateDrawerFragment,
  RateCardRateForDrawerFragment,
  RateCardRateStatusEnum,
  StandardChargeFragmentDoc,
  UpdateRateCardRateInput,
  useCreateRateCardRateMutation,
  useUpdateRateCardRateMutation,
  VolumeRangesFragmentDoc,
} from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'

import {
  RATE_CARD_RATE_DEPENDENT_QUERIES,
  RATE_CARD_RATE_DUPLICATE_DATE_KEY,
  RATE_CARD_RATE_FORM_DEFAULTS,
  RATE_CARD_RATE_SAVE_FAILED_KEY,
} from './constants'
import { mapRateToFormValues } from './mapRateToFormValues'
import { buildRateCardRateSchema, RateCardRateSchemaContext } from './schema'
import { deriveEffectiveFromBoundary, laterEffectiveFrom, toChargeModel } from './utils'

gql`
  fragment PropertiesForRateCardRate on Properties {
    # Spread rather than re-listed: the rate-card list writes only PropertiesForActiveRate for
    # the same normalized rate, and Apollo replaces array fields wholesale. Keeping this a
    # strict superset means neither write can drop range fields the other one cached.
    ...PropertiesForActiveRate
    ...StandardCharge
    ...PackageCharge
    ...PercentageCharge
    ...CustomCharge
    ...PricingGroupKeys
    graduatedRanges {
      ...GraduatedCharge
    }
    graduatedPercentageRanges {
      ...GraduatedPercentageCharge
    }
    volumeRanges {
      ...VolumeRanges
    }
  }

  fragment RateCardRateForDrawer on RateCardRate {
    id
    code
    effectiveFrom
    status
    rateModel
    billingIntervalCount
    billingIntervalUnit
    minAmountCents
    appliedPricingUnitConversionRate
    rateProperties {
      ...PropertiesForRateCardRate
    }
  }

  fragment RateCardForRateDrawer on RateCard {
    id
    currency
    appliedPricingUnitCode
    billingTiming
    attachedToPlanOrSubscription
    attachedToSubscriptions
    product {
      id
      productType
      billableMetric {
        id
        aggregationType
      }
    }
    activeRate {
      id
      effectiveFrom
    }
  }

  mutation createRateCardRate($input: CreateRateCardRateInput!) {
    createRateCardRate(input: $input) {
      id
      ...RateCardRateForDrawer
    }
  }

  mutation updateRateCardRate($input: UpdateRateCardRateInput!) {
    updateRateCardRate(input: $input) {
      id
      ...RateCardRateForDrawer
    }
  }

  ${PropertiesForActiveRateFragmentDoc}
  ${StandardChargeFragmentDoc}
  ${PackageChargeFragmentDoc}
  ${PercentageChargeFragmentDoc}
  ${CustomChargeFragmentDoc}
  ${PricingGroupKeysFragmentDoc}
  ${GraduatedChargeFragmentDoc}
  ${GraduatedPercentageChargeFragmentDoc}
  ${VolumeRangesFragmentDoc}
`

// A create or an update leaves the rate in place, so the rate's own details page - the surface
// that offers the Edit action, and the only one reading the card through it - is refetched too.
const RATE_CARD_RATE_REFETCH_QUERIES = [
  ...RATE_CARD_RATE_DEPENDENT_QUERIES,
  'getRateCardRateForDetails',
]

export type RateCardRateFormSuccess = {
  rate: RateCardRateForDrawerFragment
  wasEdit: boolean
}

// Return type left inferred: it carries the `useAppForm` instance, whose type cannot be named
// (the hook's generics have no usable defaults). Every member it returns is annotated instead.
export const useRateCardRateForm = ({
  onSuccess,
}: {
  onSuccess: (result: RateCardRateFormSuccess) => void
}) => {
  const editedRateRef = useRef<RateCardRateForDrawerFragment | undefined>(undefined)
  const rateCardRef = useRef<RateCardForRateDrawerFragment | undefined>(undefined)
  const schemaContextRef = useRef<RateCardRateSchemaContext>({
    requiresConversionRate: false,
    effectiveFromBoundary: null,
  })
  // A boundary already moved by a save made in this drawer session. The card snapshot the
  // drawer opened with does not know about it, so re-deriving from that snapshot alone would
  // walk the boundary back on every "create more" reset.
  const boundaryFloorRef = useRef<string | null>(null)

  const [createRateCardRate] = useCreateRateCardRateMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    refetchQueries: RATE_CARD_RATE_REFETCH_QUERIES,
  })
  const [updateRateCardRate] = useUpdateRateCardRateMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    refetchQueries: RATE_CARD_RATE_REFETCH_QUERIES,
  })

  const form = useAppForm({
    defaultValues: RATE_CARD_RATE_FORM_DEFAULTS,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: buildRateCardRateSchema(() => schemaContextRef.current),
    },
    onSubmit: async ({ value, formApi }) => {
      const rateCard = rateCardRef.current
      const editedRate = editedRateRef.current

      if (!rateCard) return

      const rateProperties = serializeProperties(
        (value.properties ?? {}) as Properties,
        toChargeModel(value.rateModel),
      ) as PropertiesInput

      const conversionRate = rateCard.appliedPricingUnitCode
        ? { appliedPricingUnitConversionRate: Number(value.conversionRate) }
        : {}

      const minAmountCents = Number(serializeAmount(value.minAmountCents || 0, rateCard.currency))
      const supportsSpendingMinimum = rateCard.billingTiming === RateCardBillingTimingEnum.Arrears

      let rate: RateCardRateForDrawerFragment | null | undefined
      let errors: FetchResult['errors']

      if (editedRate) {
        // An active rate freezes its timeline and model server-side, and rejects them on
        // presence even when unchanged (`FROZEN_ON_ACTIVE`), so they are omitted entirely.
        const isActiveRate = editedRate.status === RateCardRateStatusEnum.Active
        const input: UpdateRateCardRateInput = {
          id: editedRate.id,
          rateProperties,
          ...conversionRate,
          ...(isActiveRate
            ? {}
            : {
                code: value.code,
                effectiveFrom: value.effectiveFrom,
                rateModel: value.rateModel,
                billingIntervalCount: Number(value.billingIntervalCount),
                billingIntervalUnit: value.billingIntervalUnit,
                // A pay-in-advance card hides the field, but a rate saved while the card was
                // still in arrears can carry a minimum the user can no longer see: send 0
                // rather than omitting the key, so the stale value is cleared instead of
                // living on invisibly. Only a positive value is refused there
                // (`validate_min_amount_timing`).
                minAmountCents: supportsSpendingMinimum ? minAmountCents : 0,
              }),
        }

        const result = await updateRateCardRate({ variables: { input } })

        rate = result.data?.updateRateCardRate
        errors = result.errors
      } else {
        const result = await createRateCardRate({
          variables: {
            input: {
              rateCardId: rateCard.id,
              code: value.code,
              effectiveFrom: value.effectiveFrom,
              rateModel: value.rateModel,
              rateProperties,
              billingIntervalCount: Number(value.billingIntervalCount),
              billingIntervalUnit: value.billingIntervalUnit,
              ...conversionRate,
              ...(supportsSpendingMinimum && minAmountCents ? { minAmountCents } : {}),
            },
          },
        })

        rate = result.data?.createRateCardRate
        errors = result.errors
      }

      // Both the code and the effective date are unique per card, so the backend answers a
      // collision on either with the same error code - scope it to the field it came from,
      // otherwise a duplicate date reads as a duplicate code.
      if (hasDefinedGQLError('ValueAlreadyExist', errors, 'code')) {
        applyExistingCodeError(formApi)
        return
      }

      if (hasDefinedGQLError('ValueAlreadyExist', errors, 'effectiveFrom')) {
        formApi.setFieldMeta('effectiveFrom', (meta) => ({
          ...meta,
          errorMap: {
            ...meta?.errorMap,
            onDynamic: { message: RATE_CARD_RATE_DUPLICATE_DATE_KEY },
          },
        }))
        return
      }

      // Anything else the backend refuses (an incompatible rate model, a spending minimum on a
      // pay-in-advance card, a frozen field) is silenced by `silentErrorCodes`, so without this
      // the submit would look like a no-op.
      if (errors?.length) {
        addToast({ severity: 'danger', translateKey: RATE_CARD_RATE_SAVE_FAILED_KEY })
        return
      }

      if (rate) {
        onSuccess({ rate, wasEdit: !!editedRate })
      }
    },
  })

  const seedForm = (
    rateCard: RateCardForRateDrawerFragment,
    rate?: RateCardRateForDrawerFragment,
  ): void => {
    rateCardRef.current = rateCard
    editedRateRef.current = rate
    schemaContextRef.current = {
      requiresConversionRate: !!rateCard.appliedPricingUnitCode,
      effectiveFromBoundary: laterEffectiveFrom(
        deriveEffectiveFromBoundary(rateCard, rate),
        boundaryFloorRef.current,
      ),
    }

    form.reset(rate ? mapRateToFormValues(rate, rateCard.currency) : RATE_CARD_RATE_FORM_DEFAULTS, {
      keepDefaultValues: true,
    })
  }

  /** Seeds a fresh drawer session: the card snapshot is current, so no floor is carried over. */
  const resetForm = (
    rateCard: RateCardForRateDrawerFragment,
    rate?: RateCardRateForDrawerFragment,
  ): void => {
    boundaryFloorRef.current = null
    seedForm(rateCard, rate)
  }

  /**
   * Re-seeds the form for the next "create more" iteration. Only a rate that is already
   * effective becomes the card's active rate, and only that moves the append boundary
   * (`others.where(effective_from: ..now).maximum`) - so it is remembered as a floor that
   * survives this reset and every later one in the session.
   */
  const resetFormForNextCreate = (
    rateCard: RateCardForRateDrawerFragment,
    savedRate: RateCardRateForDrawerFragment,
  ): void => {
    if (DateTime.fromISO(savedRate.effectiveFrom) <= DateTime.utc()) {
      boundaryFloorRef.current = laterEffectiveFrom(
        boundaryFloorRef.current,
        savedRate.effectiveFrom,
      )
    }

    seedForm(rateCard)
  }

  return {
    form,
    resetForm,
    resetFormForNextCreate,
    getEffectiveFromBoundary: (): string | null => schemaContextRef.current.effectiveFromBoundary,
  }
}
