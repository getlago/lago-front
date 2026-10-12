import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'

import { CreateMoreResetBoundary } from '~/components/drawers/createMore/CreateMoreResetBoundary'
import { useCreateMore } from '~/components/drawers/createMore/useCreateMore'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
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
import { getRatePropertiesShape } from '~/pages/catalog/drawers/rateCardRate/getRatePropertiesShape'

import { RatePhaseFormFields } from './RatePhaseFormFields'
import {
  buildPhaseInput,
  buildRatePhaseFormSchema,
  getInsertIndex,
  getPositionDefaults,
  RATE_PHASE_FORM_DEFAULTS,
  RatePhaseFormSchemaContext,
  RatePhaseFormValues,
  RatePhaseReference,
} from './ratePhaseFormSchema'
import {
  buildCreatePhaseSeed,
  buildRatePhaseSchemaContext,
  getActiveRateFieldValues,
  insertPhaseReference,
} from './ratePhaseSeeds'
import { RateCardForRatePhaseFields, RatePhaseDrawerProps } from './types'

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

// `minAmountCents` renders on `arrears` only: a value saved before the card switched to
// `advance` is dropped, or it would fail validation on a field the form no longer shows.
const mapRatePhaseFragmentToFormValues = (
  phase: RatePhaseForDrawerFragment,
  rateCard: RateCardForRatePhaseFields,
): RatePhaseFormValues => {
  const override = phase.rateOverride
  const duration: Pick<RatePhaseFormValues, 'durationType' | 'durationCycleCount'> =
    phase.billingIntervalCycleCount
      ? { durationType: 'finite', durationCycleCount: String(phase.billingIntervalCycleCount) }
      : { durationType: 'forever', durationCycleCount: '' }

  const base: RatePhaseFormValues = {
    ...RATE_PHASE_FORM_DEFAULTS,
    ...getActiveRateFieldValues(rateCard),
    ...duration,
    code: phase.code,
    name: phase.name || '',
  }

  if (!override) return base

  return {
    ...base,
    overrideEnabled: true,
    rateModel: override.rateModel,
    properties: getRatePropertiesShape(override.rateProperties),
    billingIntervalCount: override.billingIntervalCount
      ? String(override.billingIntervalCount)
      : base.billingIntervalCount,
    billingIntervalUnit: override.billingIntervalUnit ?? base.billingIntervalUnit,
    minAmountCents:
      rateCard.billingTiming === RateCardBillingTimingEnum.Arrears &&
      Number(override.minAmountCents)
        ? String(deserializeAmount(override.minAmountCents, rateCard.currency))
        : RATE_PHASE_FORM_DEFAULTS.minAmountCents,
    conversionRate: override.pricingUnitConversionRate
      ? String(override.pricingUnitConversionRate)
      : RATE_PHASE_FORM_DEFAULTS.conversionRate,
  }
}

export const useRatePhaseDrawer = (): { openDrawer: (params: RatePhaseDrawerProps) => void } => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()
  const { createMoreControl, isCreateMoreEnabled, resetCreateMore, resetSignal, notifyReset } =
    useCreateMore()
  const [createRatePhase] = useCreateRatePhaseMutation()
  const [updateRatePhase] = useUpdateRatePhaseMutation()
  const [createContractRatePhase] = useCreateContractRatePhaseMutation()
  const [updateContractRatePhase] = useUpdateContractRatePhaseMutation()
  const currentParams = useRef<RatePhaseDrawerProps | null>(null)
  const otherPhases = useRef<RatePhaseReference[]>([])
  const schemaContext = useRef<RatePhaseFormSchemaContext>({
    otherPhases: [],
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

      const position = getInsertIndex(value, otherPhases.current) + 1
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
                position,
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
              position,
              billingIntervalCycleCount: phaseInput.billingIntervalCycleCount,
              rateOverride: value.overrideEnabled ? phaseInput.rateOverride : null,
            },
          },
        })
      }

      if (params.mode === 'edit' || !isCreateMoreEnabled()) {
        drawer.close()
        return
      }

      otherPhases.current = insertPhaseReference(otherPhases.current, value)
      schemaContext.current = buildRatePhaseSchemaContext(otherPhases.current, params.rateCard)
      form.reset(buildCreatePhaseSeed(otherPhases.current, params.rateCard), {
        keepDefaultValues: true,
      })
      notifyReset()
    },
  })

  const openDrawer = (params: RatePhaseDrawerProps): void => {
    currentParams.current = params
    otherPhases.current = params.otherPhases
    schemaContext.current = buildRatePhaseSchemaContext(params.otherPhases, params.rateCard)
    resetCreateMore()

    const seed: RatePhaseFormValues =
      params.mode === 'edit'
        ? {
            ...mapRatePhaseFragmentToFormValues(params.phase, params.rateCard),
            ...getPositionDefaults(params.otherPhases, params.phase.position - 1),
          }
        : buildCreatePhaseSeed(params.otherPhases, params.rateCard)

    form.reset(seed, { keepDefaultValues: true })

    const title = translate(
      params.mode === 'edit' ? 'text_1791485670326gf0h0n6l1w7' : 'text_17914856703265og9agmiry1',
    )

    void drawer.open({
      title,
      form: { id: RATE_PHASE_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      onEntered: focusFirstInput,
      shouldPromptOnClose: () => form.state.isDirty,
      onClose: () => form.reset(),
      secondaryAction: params.mode === 'create' ? createMoreControl : undefined,
      children: (
        <CreateMoreResetBoundary resetSignal={resetSignal}>
          <RatePhaseFormFields
            form={form}
            title={title}
            getOtherPhases={() => otherPhases.current}
            rateCard={params.rateCard}
          />
        </CreateMoreResetBoundary>
      ),
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest="rate-phase-drawer-save">
            {translate(
              params.mode === 'edit'
                ? 'text_17295436903260tlyb1gp1i7'
                : 'text_1791485670326duemfhw3cbg',
            )}
          </form.SubmitButton>
        </form.AppForm>
      ),
    })
  }

  return { openDrawer }
}
