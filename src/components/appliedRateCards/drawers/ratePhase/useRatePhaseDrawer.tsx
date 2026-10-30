import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'

import { RATE_PHASE_REFETCH_QUERIES } from '~/components/appliedRateCards/appliedRateCardContextConfig'
import { hasRateOverride } from '~/components/appliedRateCards/overrideDiff'
import { CreateMoreResetBoundary } from '~/components/drawers/createMore/CreateMoreResetBoundary'
import { useCreateMore } from '~/components/drawers/createMore/useCreateMore'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import {
  PhaseInput,
  PropertiesForRateCardRateFragmentDoc,
  RateCardBillingTimingEnum,
  useCreateContractRatePhaseMutation,
  useCreateRatePhaseMutation,
  useUpdateContractRatePhaseMutation,
  useUpdateRatePhaseMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import { mapFromApiToForm, mapFromFormToApi } from './mappers'
import { RatePhaseFormFields } from './RatePhaseFormFields'
import {
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
  getLiveSequenceLock,
  insertPhaseReference,
} from './ratePhaseSeeds'
import { scrollToFirstRatePhaseError } from './scrollToFirstRatePhaseError'
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

export const useRatePhaseDrawer = (): { openDrawer: (params: RatePhaseDrawerProps) => void } => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()
  const { createMoreControl, isCreateMoreEnabled, resetCreateMore, resetSignal, notifyReset } =
    useCreateMore()
  const [createRatePhase] = useCreateRatePhaseMutation({
    refetchQueries: RATE_PHASE_REFETCH_QUERIES.plan,
  })
  const [updateRatePhase] = useUpdateRatePhaseMutation({
    refetchQueries: RATE_PHASE_REFETCH_QUERIES.plan,
  })
  const [createContractRatePhase] = useCreateContractRatePhaseMutation({
    refetchQueries: RATE_PHASE_REFETCH_QUERIES.contract,
  })
  const [updateContractRatePhase] = useUpdateContractRatePhaseMutation({
    refetchQueries: RATE_PHASE_REFETCH_QUERIES.contract,
  })
  const currentParams = useRef<RatePhaseDrawerProps | null>(null)
  const otherPhases = useRef<RatePhaseReference[]>([])
  const schemaContext = useRef<RatePhaseFormSchemaContext>({
    otherPhases: [],
    billingTiming: RateCardBillingTimingEnum.Arrears,
    hasPricingUnit: false,
    rateModelConfiguration: undefined,
    sequenceLock: 'none',
  })

  // `errorPolicy: 'all'` resolves a rejected mutation instead of throwing: check the payload.
  const savePhase = async (
    params: RatePhaseDrawerProps,
    value: RatePhaseFormValues,
    phaseInput: PhaseInput,
  ): Promise<boolean> => {
    if (params.mode === 'create') {
      if (params.context === 'plan') {
        const { data } = await createRatePhase({
          variables: {
            input: { planAppliedRateCardId: params.planAppliedRateCardId, ...phaseInput },
          },
        })

        return !!data?.createRatePhase
      }

      const { data } = await createContractRatePhase({
        variables: {
          input: { contractAppliedRateCardId: params.contractAppliedRateCardId, ...phaseInput },
        },
      })

      return !!data?.createContractRatePhase
    }

    const phaseUpdate = {
      code: params.phase.code,
      ...(value.code !== params.phase.code ? { newCode: value.code } : {}),
      name: phaseInput.name,
      position: phaseInput.position,
      billingIntervalCycleCount: phaseInput.billingIntervalCycleCount,
      rateOverride: value.overrideEnabled ? phaseInput.rateOverride : null,
    }

    if (params.context === 'plan') {
      const { data } = await updateRatePhase({
        variables: {
          input: { planAppliedRateCardId: params.planAppliedRateCardId, ...phaseUpdate },
        },
      })

      return !!data?.updateRatePhase
    }

    const { data } = await updateContractRatePhase({
      variables: {
        input: { contractAppliedRateCardId: params.contractAppliedRateCardId, ...phaseUpdate },
      },
    })

    return !!data?.updateContractRatePhase
  }

  const form = useAppForm({
    defaultValues: RATE_PHASE_FORM_DEFAULTS,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: buildRatePhaseFormSchema(() => schemaContext.current) },
    onSubmitInvalid: ({ formApi }) => {
      scrollToFirstRatePhaseError(RATE_PHASE_FORM_ID, formApi.state.errorMap.onDynamic || {})
    },
    onSubmit: async ({ value }) => {
      const params = currentParams.current

      if (!params) return

      const phase = { ...value, overrideEnabled: hasRateOverride(value, params.rateCard) }
      const position = getInsertIndex(phase, otherPhases.current) + 1
      const phaseInput = mapFromFormToApi({ ...phase, position }, params.rateCard.currency)
      const isSaved = await savePhase(params, phase, phaseInput)

      if (!isSaved) return

      if (params.mode === 'edit' || !isCreateMoreEnabled()) {
        drawer.close()
        return
      }

      otherPhases.current = insertPhaseReference(otherPhases.current, value)
      schemaContext.current = buildRatePhaseSchemaContext(
        otherPhases.current,
        params.rateCard,
        getLiveSequenceLock(otherPhases.current),
      )
      form.reset(buildCreatePhaseSeed(otherPhases.current, params.rateCard), {
        keepDefaultValues: true,
      })
      notifyReset()
    },
  })

  const openDrawer = (params: RatePhaseDrawerProps): void => {
    currentParams.current = params
    otherPhases.current = params.otherPhases
    resetCreateMore()

    const seed: RatePhaseFormValues =
      params.mode === 'edit'
        ? {
            ...mapFromApiToForm(params.phase, params.rateCard),
            ...getPositionDefaults(params.otherPhases, params.phase.position - 1),
          }
        : buildCreatePhaseSeed(params.otherPhases, params.rateCard)

    schemaContext.current = buildRatePhaseSchemaContext(
      params.otherPhases,
      params.rateCard,
      getLiveSequenceLock(params.otherPhases, params.mode === 'edit' ? seed : undefined),
    )
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
            isEdition={params.mode === 'edit'}
            getOtherPhases={() => otherPhases.current}
            getSequenceLock={() => schemaContext.current.sequenceLock}
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
