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

import { RATE_CARD_RATE_DEPENDENT_QUERIES, RATE_CARD_RATE_FORM_DEFAULTS } from './constants'
import { mapRateToFormValues } from './mapRateToFormValues'
import { buildRateCardRateSchema, RateCardRateSchemaContext } from './schema'
import { deriveEffectiveFromBoundary, laterEffectiveFrom, toChargeModel } from './utils'

gql`
  fragment PropertiesForRateCardRate on Properties {
    # Must stay a strict superset of PropertiesForActiveRate: Apollo replaces array fields
    # wholesale, so a narrower write would strip range fields the other one cached.
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

// Plus the rate's own details page, which a create or an update leaves in place.
const RATE_CARD_RATE_REFETCH_QUERIES = [
  ...RATE_CARD_RATE_DEPENDENT_QUERIES,
  'getRateCardRateForDetails',
]

export type RateCardRateFormSuccess = {
  rate: RateCardRateForDrawerFragment
  wasEdit: boolean
}

// Return type inferred: it carries the `useAppForm` instance, whose type cannot be named.
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
  // A boundary moved by a save in this session: the card snapshot the drawer opened with does
  // not know about it, so re-deriving alone would walk the boundary back on every reset.
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
        // `FROZEN_ON_ACTIVE` rejects these on presence, even unchanged, so they are omitted.
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
                // 0 rather than omitted, to clear a minimum saved while the card was in
                // arrears (`validate_min_amount_timing` only refuses a positive value).
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

      // Both fields are unique per card and collide with the same error code, so scope it to
      // the field it came from.
      if (hasDefinedGQLError('ValueAlreadyExist', errors, 'code')) {
        applyExistingCodeError(formApi)
        return
      }

      if (hasDefinedGQLError('ValueAlreadyExist', errors, 'effectiveFrom')) {
        formApi.setFieldMeta('effectiveFrom', (meta) => ({
          ...meta,
          errorMap: {
            ...meta?.errorMap,
            onDynamic: { message: 'text_1787753924848luck8g8y1qd' },
          },
        }))
        return
      }

      // `silentErrorCodes` swallows everything else, so without this the submit looks like a
      // no-op.
      if (errors?.length) {
        addToast({ severity: 'danger', translateKey: 'text_1787753924848adhyrzqb0gz' })
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

  /** Fresh drawer session: the card snapshot is current, so no floor is carried over. */
  const resetForm = (
    rateCard: RateCardForRateDrawerFragment,
    rate?: RateCardRateForDrawerFragment,
  ): void => {
    boundaryFloorRef.current = null
    seedForm(rateCard, rate)
  }

  // Only an already-effective rate becomes the card's active rate and moves the append
  // boundary, so remember it as a floor that survives this reset and every later one.
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
