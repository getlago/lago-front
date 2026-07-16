import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { z } from 'zod'

import { Typography } from '~/components/designSystem/Typography'
import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast } from '~/core/apolloClient'
import {
  BillingEntity,
  useApplyBillingEntityInvoiceCustomSectionMutation,
  useGetOrganizationSettingsInvoiceSectionsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

gql`
  mutation applyBillingEntityInvoiceCustomSection($input: UpdateBillingEntityInput!) {
    updateBillingEntity(input: $input) {
      id
    }
  }
`

export const APPLY_INVOICE_CUSTOM_SECTION_FORM_ID = 'apply-invoice-custom-section-form'

const applyInvoiceCustomSectionValidationSchema = z.object({
  invoiceCustomSectionId: z.string().min(1),
})

export const useApplyInvoiceCustomSectionDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()
  const billingEntityRef = useRef<BillingEntity | null>(null)
  const successRef = useRef(false)

  const { data, loading } = useGetOrganizationSettingsInvoiceSectionsQuery()

  const [applyBillingEntityInvoiceCustomSection] =
    useApplyBillingEntityInvoiceCustomSectionMutation({
      onCompleted(_data) {
        if (_data?.updateBillingEntity) {
          successRef.current = true
          addToast({
            message: translate('text_17490267676054m9hrn2vs3h'),
            severity: 'success',
          })
        }
      },
      refetchQueries: ['getBillingEntity'],
    })

  const form = useAppForm({
    defaultValues: {
      invoiceCustomSectionId: '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: applyInvoiceCustomSectionValidationSchema,
    },
    onSubmit: async ({ value }) => {
      const billingEntity = billingEntityRef.current

      if (!billingEntity) return

      await applyBillingEntityInvoiceCustomSection({
        variables: {
          input: {
            id: billingEntity.id,
            invoiceCustomSectionIds: [
              ...(billingEntity.selectedInvoiceCustomSections?.map((s) => s.id) || []),
              value.invoiceCustomSectionId,
            ],
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

  const openApplyInvoiceCustomSectionDialog = (billingEntity: BillingEntity) => {
    billingEntityRef.current = billingEntity
    form.reset()

    const invoiceCustomSections =
      data?.invoiceCustomSections?.collection
        ?.filter(
          (item) => !billingEntity.selectedInvoiceCustomSections?.find((s) => s.id === item.id),
        )
        .map((item) => ({
          value: item.id,
          label: item.name,
          description: item.code,
        })) || []

    formDialog
      .open({
        title: translate('text_17490246341928gnllhmzx4w'),
        description: <Typography>{translate('text_1749024634192qi2o0ycntua')}</Typography>,
        closeOnError: false,
        onEntered: focusFirstInput,
        children: (
          <div className="p-8">
            <form.AppField name="invoiceCustomSectionId">
              {(field) => (
                <field.ComboBoxField
                  label={translate('text_1749026767605u5u8ww3dhov')}
                  loading={loading}
                  data={invoiceCustomSections}
                  placeholder={translate('text_1749026767603ihrnxpf72wu')}
                  PopperProps={{ displayInDialog: true }}
                  emptyText={translate('text_17490267676058ycg9lekpiq')}
                />
              )}
            </form.AppField>
          </div>
        ),
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>{translate('text_1749026767605z63gakijt0o')}</form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: APPLY_INVOICE_CUSTOM_SECTION_FORM_ID,
          submit: handleSubmit,
        },
      })
      .then((response) => {
        if (response.reason === 'close') {
          form.reset()
          billingEntityRef.current = null
        }
      })
  }

  return { openApplyInvoiceCustomSectionDialog }
}
