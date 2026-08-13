import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { z } from 'zod'

import { Typography } from '~/components/designSystem/Typography'
import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast } from '~/core/apolloClient'
import { documentLocalesDataForComboBox } from '~/core/translations/documentLocales'
import { LagoApiError, useUpdateDocumentLocaleBillingEntityMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

gql`
  mutation updateDocumentLocaleBillingEntity($input: UpdateBillingEntityInput!) {
    updateBillingEntity(input: $input) {
      id
      billingConfiguration {
        id
        documentLocale
      }
    }
  }
`

const editBillingEntityDocumentLocaleValidationSchema = z.object({
  // The combobox emits `undefined` when cleared, so cover both the missing
  // (invalid_type) and empty-string cases with the same "required" message.
  documentLocale: z
    .string({ message: 'text_624ea7c29103fd010732ab7d' })
    .min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
})

type OpenEditBillingEntityDocumentLocaleDialogProps = {
  id: string
  documentLocale: string
}

export const EDIT_BILLING_ENTITY_DOCUMENT_LOCALE_FORM_ID =
  'edit-billing-entity-document-locale-form'

export const useEditBillingEntityDocumentLocaleDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()
  const dataRef = useRef<OpenEditBillingEntityDocumentLocaleDialogProps | null>(null)
  const successRef = useRef(false)

  const [updateDocumentLocale] = useUpdateDocumentLocaleBillingEntityMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted(res) {
      if (res?.updateBillingEntity) {
        successRef.current = true
        addToast({
          severity: 'success',
          translateKey: 'text_63e51ef4985f0ebd75c21349',
        })
      }
    },
    refetchQueries: ['getBillingEntitySettings'],
  })

  const form = useAppForm({
    defaultValues: {
      documentLocale: '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: editBillingEntityDocumentLocaleValidationSchema,
    },
    onSubmit: async ({ value }) => {
      await updateDocumentLocale({
        variables: {
          input: {
            id: dataRef.current?.id as string,
            billingConfiguration: {
              documentLocale: value.documentLocale,
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

  const openEditBillingEntityDocumentLocaleDialog = (
    props: OpenEditBillingEntityDocumentLocaleDialogProps,
  ) => {
    dataRef.current = props
    form.reset()
    form.setFieldValue('documentLocale', props.documentLocale)

    formDialog
      .open({
        title: translate('text_63e51ef4985f0ebd75c2130e'),
        description: translate('text_63e51ef4985f0ebd75c2130f'),
        closeOnError: false,
        onEntered: focusFirstInput,
        children: (
          <div className="p-8">
            <form.AppField name="documentLocale">
              {(field) => (
                <field.ComboBoxField
                  disableClearable
                  label={translate('text_63e51ef4985f0ebd75c21310')}
                  helperText={
                    <Typography
                      variant="caption"
                      html={translate('text_63e51ef4985f0ebd75c21312')}
                    />
                  }
                  data={documentLocalesDataForComboBox}
                  PopperProps={{ displayInDialog: true }}
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
          id: EDIT_BILLING_ENTITY_DOCUMENT_LOCALE_FORM_ID,
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

  return { openEditBillingEntityDocumentLocaleDialog }
}
