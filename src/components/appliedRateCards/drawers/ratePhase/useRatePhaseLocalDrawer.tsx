import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'

import { useFormDrawer } from '~/components/drawers/useDrawer'
import { RateCardBillingTimingEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import {
  buildRatePhaseFormSchema,
  RATE_PHASE_FORM_DEFAULTS,
  RatePhaseFormSchemaContext,
  RatePhaseFormValues,
} from './ratePhaseFormSchema'
import { RatePhaseLocalDrawerContent } from './RatePhaseLocalDrawerContent'
import { RateCardForRatePhaseFields } from './types'

const RATE_PHASE_LOCAL_FORM_ID = 'rate-phase-local-drawer-form'

export type OpenRatePhaseLocalDrawerArgs = {
  rateCard: RateCardForRatePhaseFields
  isLastPosition: boolean
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
    isLastPosition: true,
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
      isLastPosition: args.isLastPosition,
      billingTiming: args.rateCard.billingTiming,
      hasPricingUnit: !!args.rateCard.appliedPricingUnitCode,
      rateModelConfiguration: args.rateCard.rateModelConfiguration,
    }
    form.reset({ ...RATE_PHASE_FORM_DEFAULTS, ...args.phase }, { keepDefaultValues: true })

    void drawer.open({
      title: translate(
        args.phase ? 'text_17951541055444xojz4p5i86' : 'text_17951541055445xojz4p5i87',
      ),
      form: { id: RATE_PHASE_LOCAL_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      shouldPromptOnClose: () => form.state.isDirty,
      onClose: () => form.reset(),
      children: (
        <RatePhaseLocalDrawerContent
          form={form}
          isLastPosition={args.isLastPosition}
          rateCard={args.rateCard}
        />
      ),
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest="rate-phase-local-drawer-save">
            {translate('text_17951541055446xojz4p5i88')}
          </form.SubmitButton>
        </form.AppForm>
      ),
    })
  }

  return { openDrawer }
}
