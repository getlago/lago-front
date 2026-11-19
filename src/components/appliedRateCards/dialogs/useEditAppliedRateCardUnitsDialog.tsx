import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { z } from 'zod'

import { AppliedRateCardUnitsField } from '~/components/appliedRateCards/AppliedRateCardUnitsField'
import { AppliedRateCardContext } from '~/components/appliedRateCards/types'
import { dialogFormProps } from '~/components/dialogs/dialogFormProps'
import { useFormDialog } from '~/components/dialogs/FormDialog'
import { addToast } from '~/core/apolloClient'
import {
  useUpdateContractAppliedRateCardMutation,
  useUpdatePlanAppliedRateCardMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

gql`
  mutation updatePlanAppliedRateCard($input: UpdatePlanAppliedRateCardInput!) {
    updatePlanAppliedRateCard(input: $input) {
      id
      units
    }
  }

  mutation updateContractAppliedRateCard($input: UpdateContractAppliedRateCardInput!) {
    updateContractAppliedRateCard(input: $input) {
      id
      units
    }
  }
`

export const EDIT_APPLIED_RATE_CARD_UNITS_FORM_ID = 'edit-applied-rate-card-units-form'
export const EDIT_APPLIED_RATE_CARD_UNITS_INPUT_TEST_ID = 'edit-applied-rate-card-units-input'
export const EDIT_APPLIED_RATE_CARD_UNITS_SAVE_TEST_ID = 'edit-applied-rate-card-units-save'

const editAppliedRateCardUnitsSchema = z.object({
  units: z.string().trim().min(1, { message: 'text_1771342994699klxu2paz7g8' }),
})

type EditAppliedRateCardUnitsDialogProps = {
  context: AppliedRateCardContext
  appliedRateCardId: string
  units: number | null | undefined
}

export const useEditAppliedRateCardUnitsDialog = (): {
  openEditAppliedRateCardUnitsDialog: (props: EditAppliedRateCardUnitsDialogProps) => void
} => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()
  const propsRef = useRef<EditAppliedRateCardUnitsDialogProps | null>(null)
  const [updatePlanAppliedRateCard] = useUpdatePlanAppliedRateCardMutation()
  const [updateContractAppliedRateCard] = useUpdateContractAppliedRateCardMutation()

  const updateUnits = async (
    props: EditAppliedRateCardUnitsDialogProps,
    units: number,
  ): Promise<string | undefined> => {
    const input = { id: props.appliedRateCardId, units }

    if (props.context === 'plan') {
      const { data } = await updatePlanAppliedRateCard({ variables: { input } })

      return data?.updatePlanAppliedRateCard?.id
    }

    const { data } = await updateContractAppliedRateCard({ variables: { input } })

    return data?.updateContractAppliedRateCard?.id
  }

  const form = useAppForm({
    defaultValues: { units: '' },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: editAppliedRateCardUnitsSchema },
    onSubmit: async ({ value }) => {
      const props = propsRef.current

      if (!props) return

      // The dialog closes on a resolved submit, so a failure has to reject: a GraphQL error
      // resolves and is already toasted by `errorLink`, a network error rejects untoasted.
      const updatedId = await updateUnits(props, Number(value.units.trim())).catch(
        (error: Error) => {
          addToast({ severity: 'danger', translateKey: 'text_62b31e1f6a5b8b1b745ece48' })
          throw error
        },
      )

      if (!updatedId) throw new Error('updateAppliedRateCardUnits failed')

      addToast({ severity: 'success', message: translate('text_1795069172484bkbt387tkf4') })
    },
  })

  const openEditAppliedRateCardUnitsDialog = (props: EditAppliedRateCardUnitsDialogProps): void => {
    propsRef.current = props
    form.reset()
    form.setFieldValue('units', props.units?.toString() ?? '')

    void formDialog.open({
      title: translate('text_17950691724841bhd45g69u8'),
      description: translate('text_1795069172484rfkxpyqkd6y'),
      cancelOrCloseText: 'cancel',
      closeOnError: false,
      children: (
        <div className="p-8">
          <AppliedRateCardUnitsField
            form={form}
            fields={{ units: 'units' }}
            dataTest={EDIT_APPLIED_RATE_CARD_UNITS_INPUT_TEST_ID}
          />
        </div>
      ),
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest={EDIT_APPLIED_RATE_CARD_UNITS_SAVE_TEST_ID}>
            {translate('text_17295436903260tlyb1gp1i7')}
          </form.SubmitButton>
        </form.AppForm>
      ),
      form: dialogFormProps(EDIT_APPLIED_RATE_CARD_UNITS_FORM_ID, form),
    })
  }

  return { openEditAppliedRateCardUnitsDialog }
}
