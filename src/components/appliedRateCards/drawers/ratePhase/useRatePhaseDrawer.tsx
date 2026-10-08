import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'

import { useFormDrawer } from '~/components/drawers/useDrawer'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  PropertiesForRateCardRateFragmentDoc,
  RateCardBillingTimingEnum,
  RatePhaseForDrawerFragment,
  useCreateContractRatePhaseMutation,
  useCreateRatePhaseMutation,
  useUpdateContractRatePhaseMutation,
  useUpdateRatePhaseMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import { RatePhaseDrawerContent } from './RatePhaseDrawerContent'
import {
  buildPhaseInput,
  buildRatePhaseFormSchema,
  RATE_PHASE_FORM_DEFAULTS,
  RatePhaseFormSchemaContext,
  RatePhaseFormValues,
} from './ratePhaseFormSchema'
import { RatePhaseDrawerProps } from './types'

gql`
  fragment RatePhaseForDrawer on RatePhase {
    id
    code
    name
    position
    billingIntervalCycleCount
    rateOverride {
      rateModel
      rateProperties {
        ...PropertiesForRateCardRate
      }
      billingIntervalCount
      billingIntervalUnit
      minAmountCents
      pricingUnitConversionRate
    }
  }

  mutation createRatePhase($input: CreateRatePhaseInput!) {
    createRatePhase(input: $input) {
      id
      code
    }
  }

  mutation updateRatePhase($input: UpdateRatePhaseInput!) {
    updateRatePhase(input: $input) {
      id
      code
    }
  }

  mutation createContractRatePhase($input: CreateContractRatePhaseInput!) {
    createContractRatePhase(input: $input) {
      id
      code
    }
  }

  mutation updateContractRatePhase($input: UpdateContractRatePhaseInput!) {
    updateContractRatePhase(input: $input) {
      id
      code
    }
  }

  ${PropertiesForRateCardRateFragmentDoc}
`

const RATE_PHASE_FORM_ID = 'rate-phase-drawer-form'

// `phase` is a `RatePhaseForDrawerFragment` (GraphQL field names), not a `RatePhaseFormValues`
// (form field names) - a plain spread leaves every override field at its default even when
// the phase actually has one. Mirrors `buildPhaseInput`'s field-name mapping in reverse.
//
// `billingTiming` is the rate card's *current* value, not necessarily what it was when this
// phase's override was first saved. `minAmountCents` only renders for `arrears`, so a stale
// non-zero value carried over from an `arrears` phase onto a now-`advance` card would fail
// `buildRatePhaseFormSchema`'s validation forever on a field the form no longer shows - drop it
// at the seeding boundary instead of leaving the drawer permanently unsavable.
const mapRatePhaseFragmentToFormValues = (
  phase: RatePhaseForDrawerFragment,
  billingTiming: RateCardBillingTimingEnum,
  currency: CurrencyEnum,
): RatePhaseFormValues => {
  const override = phase.rateOverride

  return {
    code: phase.code,
    name: phase.name || '',
    durationType: phase.billingIntervalCycleCount ? 'finite' : 'forever',
    durationCycleCount: phase.billingIntervalCycleCount
      ? String(phase.billingIntervalCycleCount)
      : '',
    overrideEnabled: !!override,
    rateModel: override?.rateModel ?? RATE_PHASE_FORM_DEFAULTS.rateModel,
    properties: override?.rateProperties ?? RATE_PHASE_FORM_DEFAULTS.properties,
    overrideBillingIntervalCount: override?.billingIntervalCount
      ? String(override.billingIntervalCount)
      : RATE_PHASE_FORM_DEFAULTS.overrideBillingIntervalCount,
    overrideBillingIntervalUnit:
      override?.billingIntervalUnit ?? RATE_PHASE_FORM_DEFAULTS.overrideBillingIntervalUnit,
    minAmountCents:
      billingTiming === RateCardBillingTimingEnum.Arrears && override?.minAmountCents
        ? String(deserializeAmount(override.minAmountCents, currency))
        : RATE_PHASE_FORM_DEFAULTS.minAmountCents,
    conversionRate: override?.pricingUnitConversionRate
      ? String(override.pricingUnitConversionRate)
      : RATE_PHASE_FORM_DEFAULTS.conversionRate,
  }
}

export const useRatePhaseDrawer = (): { openDrawer: (params: RatePhaseDrawerProps) => void } => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()
  const [createRatePhase] = useCreateRatePhaseMutation()
  const [updateRatePhase] = useUpdateRatePhaseMutation()
  const [createContractRatePhase] = useCreateContractRatePhaseMutation()
  const [updateContractRatePhase] = useUpdateContractRatePhaseMutation()
  const currentParams = useRef<RatePhaseDrawerProps | null>(null)
  const schemaContext = useRef<RatePhaseFormSchemaContext>({
    isLastPosition: true,
    billingTiming: RateCardBillingTimingEnum.Arrears,
    hasPricingUnit: false,
    rateModelConfiguration: undefined,
  })

  const form = useAppForm({
    defaultValues: RATE_PHASE_FORM_DEFAULTS,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: buildRatePhaseFormSchema(() => schemaContext.current) },
    onSubmit: async ({ value }) => {
      const params = currentParams.current

      if (!params) return

      const position = params.mode === 'create' ? params.position : params.phase.position
      const phaseInput = buildPhaseInput({ ...value, position }, params.rateCard.currency)

      if (params.context === 'plan') {
        if (params.mode === 'create') {
          await createRatePhase({
            variables: {
              input: { planAppliedRateCardId: params.planAppliedRateCardId, ...phaseInput },
            },
          })
        } else {
          await updateRatePhase({
            variables: {
              input: {
                planAppliedRateCardId: params.planAppliedRateCardId,
                code: params.phase.code,
                ...(value.code !== params.phase.code ? { newCode: value.code } : {}),
                name: phaseInput.name,
                billingIntervalCycleCount: phaseInput.billingIntervalCycleCount,
                rateOverride: value.overrideEnabled ? phaseInput.rateOverride : null,
              },
            },
          })
        }
      } else if (params.mode === 'create') {
        await createContractRatePhase({
          variables: {
            input: { contractAppliedRateCardId: params.contractAppliedRateCardId, ...phaseInput },
          },
        })
      } else {
        await updateContractRatePhase({
          variables: {
            input: {
              contractAppliedRateCardId: params.contractAppliedRateCardId,
              code: params.phase.code,
              ...(value.code !== params.phase.code ? { newCode: value.code } : {}),
              name: phaseInput.name,
              billingIntervalCycleCount: phaseInput.billingIntervalCycleCount,
              rateOverride: value.overrideEnabled ? phaseInput.rateOverride : null,
            },
          },
        })
      }

      drawer.close()
    },
  })

  const openDrawer = (params: RatePhaseDrawerProps): void => {
    currentParams.current = params
    schemaContext.current = {
      isLastPosition: params.isLastPosition,
      billingTiming: params.rateCard.billingTiming,
      hasPricingUnit: !!params.rateCard.appliedPricingUnitCode,
      rateModelConfiguration: params.rateCard.rateModelConfiguration,
    }

    const seed =
      params.mode === 'edit'
        ? mapRatePhaseFragmentToFormValues(
            params.phase,
            params.rateCard.billingTiming,
            params.rateCard.currency,
          )
        : undefined

    form.reset({ ...RATE_PHASE_FORM_DEFAULTS, ...seed }, { keepDefaultValues: true })

    void drawer.open({
      title: translate(
        params.mode === 'edit' ? 'text_1791485670326gf0h0n6l1w7' : 'text_17914856703265og9agmiry1',
      ),
      form: { id: RATE_PHASE_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      shouldPromptOnClose: () => form.state.isDirty,
      onClose: () => form.reset(),
      children: (
        <RatePhaseDrawerContent
          form={form}
          isLastPosition={params.isLastPosition}
          rateCard={params.rateCard}
        />
      ),
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest="rate-phase-drawer-save">
            {translate('text_1791485670326duemfhw3cbg')}
          </form.SubmitButton>
        </form.AppForm>
      ),
    })
  }

  return { openDrawer }
}
