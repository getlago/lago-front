import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'

import { useFormDrawer } from '~/components/drawers/useDrawer'
import { RateCardBillingTimingEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import {
  buildRatePhaseFormSchema,
  getPositionDefaults,
  RATE_PHASE_FORM_DEFAULTS,
  RatePhaseFormSchemaContext,
  RatePhaseFormValues,
  RatePhaseReference,
} from './ratePhaseFormSchema'
import { RatePhaseLocalDrawerContent } from './RatePhaseLocalDrawerContent'
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
  const currentArgs = useRef<OpenRatePhaseLocalDrawerArgs | null>(null)
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
    onSubmit: ({ value }) => {
      const args = currentArgs.current

      if (!args) return

      args.onSave(value, { replaceIndex: args.replaceIndex })
      drawer.close()
    },
  })

  const openDrawer = (args: OpenRatePhaseLocalDrawerArgs): void => {
    currentArgs.current = args
    schemaContext.current = {
      otherPhases: args.otherPhases,
      billingTiming: args.rateCard.billingTiming,
      hasPricingUnit: !!args.rateCard.appliedPricingUnitCode,
      rateModelConfiguration: args.rateCard.rateModelConfiguration,
    }
    const seed: RatePhaseFormValues = args.phase
      ? {
          ...RATE_PHASE_FORM_DEFAULTS,
          ...args.phase,
          ...getPositionDefaults(args.otherPhases, args.replaceIndex),
        }
      : {
          ...RATE_PHASE_FORM_DEFAULTS,
          ...getPositionDefaults(args.otherPhases),
          durationType: args.otherPhases.length > 0 ? 'finite' : 'forever',
        }

    form.reset(seed, { keepDefaultValues: true })

    const title = translate(
      args.phase ? 'text_1791485670326gf0h0n6l1w7' : 'text_17914856703265og9agmiry1',
    )

    void drawer.open({
      title,
      form: { id: RATE_PHASE_LOCAL_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      shouldPromptOnClose: () => form.state.isDirty,
      onClose: () => form.reset(),
      children: (
        <RatePhaseLocalDrawerContent
          form={form}
          title={title}
          otherPhases={args.otherPhases}
          rateCard={args.rateCard}
        />
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
