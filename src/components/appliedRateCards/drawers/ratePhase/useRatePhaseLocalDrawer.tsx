import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'

import { hasRateOverride } from '~/components/appliedRateCards/overrideDiff'
import { CreateMoreResetBoundary } from '~/components/drawers/createMore/CreateMoreResetBoundary'
import { useCreateMore } from '~/components/drawers/createMore/useCreateMore'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { RateCardBillingTimingEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import { RatePhaseFormFields } from './RatePhaseFormFields'
import {
  buildRatePhaseFormSchema,
  getPositionDefaults,
  RATE_PHASE_FORM_DEFAULTS,
  RatePhaseFormSchemaContext,
  RatePhaseFormValues,
  RatePhaseReference,
} from './ratePhaseFormSchema'
import {
  buildCreatePhaseSeed,
  buildRatePhaseSchemaContext,
  insertPhaseReference,
} from './ratePhaseSeeds'
import { RateCardForRatePhaseFields } from './types'

const RATE_PHASE_LOCAL_FORM_ID = 'rate-phase-local-drawer-form'

export type OpenRatePhaseLocalDrawerArgs = {
  rateCard: RateCardForRatePhaseFields
  otherPhases: RatePhaseReference[]
  onSave: (values: RatePhaseFormValues, opts: { replaceIndex?: number }) => void
  phase?: RatePhaseFormValues
  replaceIndex?: number
}

export const useRatePhaseLocalDrawer = (): {
  openDrawer: (args: OpenRatePhaseLocalDrawerArgs) => void
} => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()
  const { createMoreControl, isCreateMoreEnabled, resetCreateMore, resetSignal, notifyReset } =
    useCreateMore()
  const currentArgs = useRef<OpenRatePhaseLocalDrawerArgs | null>(null)
  const otherPhases = useRef<RatePhaseReference[]>([])
  const schemaContext = useRef<RatePhaseFormSchemaContext>({
    otherPhases: [],
    billingTiming: RateCardBillingTimingEnum.Arrears,
    hasPricingUnit: false,
    rateModelConfiguration: undefined,
    sequenceLock: 'none',
  })

  const form = useAppForm({
    defaultValues: RATE_PHASE_FORM_DEFAULTS,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: buildRatePhaseFormSchema(() => schemaContext.current) },
    onSubmit: ({ value }) => {
      const args = currentArgs.current

      if (!args) return

      args.onSave(
        { ...value, overrideEnabled: hasRateOverride(value, args.rateCard) },
        { replaceIndex: args.replaceIndex },
      )

      if (args.phase || !isCreateMoreEnabled()) {
        drawer.close()
        return
      }

      otherPhases.current = insertPhaseReference(otherPhases.current, value)
      schemaContext.current = buildRatePhaseSchemaContext(
        otherPhases.current,
        args.rateCard,
        'none',
      )
      form.reset(buildCreatePhaseSeed(otherPhases.current, args.rateCard), {
        keepDefaultValues: true,
      })
      notifyReset()
    },
  })

  const openDrawer = (args: OpenRatePhaseLocalDrawerArgs): void => {
    currentArgs.current = args
    otherPhases.current = args.otherPhases
    schemaContext.current = buildRatePhaseSchemaContext(args.otherPhases, args.rateCard, 'none')
    resetCreateMore()

    const seed: RatePhaseFormValues = args.phase
      ? {
          ...RATE_PHASE_FORM_DEFAULTS,
          ...args.phase,
          ...getPositionDefaults(args.otherPhases, args.replaceIndex),
        }
      : buildCreatePhaseSeed(args.otherPhases, args.rateCard)

    form.reset(seed, { keepDefaultValues: true })

    const title = translate(
      args.phase ? 'text_1791485670326gf0h0n6l1w7' : 'text_17914856703265og9agmiry1',
    )

    void drawer.open({
      title,
      form: { id: RATE_PHASE_LOCAL_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      onEntered: focusFirstInput,
      shouldPromptOnClose: () => form.state.isDirty,
      onClose: () => form.reset(),
      secondaryAction: args.phase ? undefined : createMoreControl,
      children: (
        <CreateMoreResetBoundary resetSignal={resetSignal}>
          <RatePhaseFormFields
            form={form}
            title={title}
            isEdition={!!args.phase}
            getOtherPhases={() => otherPhases.current}
            getSequenceLock={() => 'none'}
            rateCard={args.rateCard}
          />
        </CreateMoreResetBoundary>
      ),
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest="rate-phase-local-drawer-save">
            {translate(
              args.phase ? 'text_17295436903260tlyb1gp1i7' : 'text_1791485670326duemfhw3cbg',
            )}
          </form.SubmitButton>
        </form.AppForm>
      ),
    })
  }

  return { openDrawer }
}
