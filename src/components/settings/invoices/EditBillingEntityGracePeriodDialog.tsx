import { gql } from '@apollo/client'
import InputAdornment from '@mui/material/InputAdornment'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { z } from 'zod'

import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast } from '~/core/apolloClient'
import { useUpdateBillingEntityGracePeriodMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

gql`
  mutation updateBillingEntityGracePeriod($input: UpdateBillingEntityInput!) {
    updateBillingEntity(input: $input) {
      id
      billingConfiguration {
        id
        invoiceGracePeriod
      }
    }
  }
`

const editBillingEntityGracePeriodValidationSchema = z.object({
  invoiceGracePeriod: z.union([
    z.number().max(365, { message: 'text_63bed78ae69de9cad5c348e4' }),
    z.literal(''),
  ]),
})

export const EDIT_BILLING_ENTITY_GRACE_PERIOD_FORM_ID = 'edit-billing-entity-grace-period-form'

type EditBillingEntityGracePeriodDialogData = {
  id: string
  invoiceGracePeriod: number
}

export const useEditBillingEntityGracePeriodDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()
  const dataRef = useRef<EditBillingEntityGracePeriodDialogData | null>(null)
  const successRef = useRef(false)

  const [updateBillingEntityGracePeriod] = useUpdateBillingEntityGracePeriodMutation({
    onCompleted(res) {
      if (res?.updateBillingEntity) {
        successRef.current = true
        addToast({
          severity: 'success',
          translateKey: 'text_638dc196fb209d551f3d81ba',
        })
      }
    },
    refetchQueries: ['getBillingEntitySettings'],
  })

  const form = useAppForm({
    defaultValues: {
      invoiceGracePeriod: '' as number | '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: editBillingEntityGracePeriodValidationSchema,
    },
    onSubmit: async ({ value }) => {
      await updateBillingEntityGracePeriod({
        variables: {
          input: {
            id: dataRef.current?.id as string,
            billingConfiguration: {
              invoiceGracePeriod: Number(value.invoiceGracePeriod) || 0,
            },
          },
        },
      })
    },
  })

  const handleSubmit = async (): Promise<DialogResult> => {
    successRef.current = false
    await form.handleSubmit()

    if (!successRef.current) {
      throw new Error('Submit failed')
    }

    return { reason: 'success' }
  }

  const openEditBillingEntityGracePeriodDialog = (data: EditBillingEntityGracePeriodDialogData) => {
    dataRef.current = data
    form.reset()
    form.setFieldValue('invoiceGracePeriod', (data.invoiceGracePeriod ?? '') as number | '')

    formDialog
      .open({
        title: translate('text_638dc196fb209d551f3d8139'),
        description: translate('text_638dc196fb209d551f3d813b'),
        closeOnError: false,
        onEntered: focusFirstInput,
        children: (
          <div className="p-8">
            <form.AppField name="invoiceGracePeriod">
              {(field) => (
                <field.TextInputField
                  beforeChangeFormatter={['positiveNumber', 'int']}
                  label={translate('text_638dc196fb209d551f3d819d')}
                  placeholder={translate('text_638dc196fb209d551f3d8147')}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {translate('text_638dc196fb209d551f3d814d')}
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            </form.AppField>
          </div>
        ),
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>{translate('text_17432414198706rdwf76ek3u')}</form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: EDIT_BILLING_ENTITY_GRACE_PERIOD_FORM_ID,
          submit: handleSubmit,
        },
      })
      .then((response) => {
        if (response.reason === 'close') {
          form.reset()
          dataRef.current = null
        }
      })
  }

  return { openEditBillingEntityGracePeriodDialog }
}
