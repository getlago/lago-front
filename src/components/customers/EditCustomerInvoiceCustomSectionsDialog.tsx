import { gql } from '@apollo/client'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { useEffect, useMemo, useRef } from 'react'
import { z } from 'zod'

import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast } from '~/core/apolloClient'
import {
  CustomerAppliedInvoiceCustomSectionsFragmentDoc,
  UpdateCustomerInput,
  useEditCustomerInvoiceCustomSectionMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm, withForm } from '~/hooks/forms/useAppform'
import { useCustomerInvoiceCustomSections } from '~/hooks/useCustomerInvoiceCustomSections'
import { useInvoiceCustomSectionsLazy } from '~/hooks/useInvoiceCustomSections'

export const EDIT_CUSTOMER_INVOICE_CUSTOM_SECTIONS_FORM_ID =
  'edit-customer-invoice-custom-sections-form'

gql`
  mutation editCustomerInvoiceCustomSection($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
      ...CustomerAppliedInvoiceCustomSections
    }

    ${CustomerAppliedInvoiceCustomSectionsFragmentDoc}
  }
`

export enum BehaviorType {
  FALLBACK = 'fallback',
  CUSTOM_SECTIONS = 'customSections',
  DEACTIVATE = 'deactivate',
}

type FormValues = {
  behavior: BehaviorType
  configurableInvoiceCustomSectionIds: string[]
}

const initialValues: FormValues = {
  behavior: BehaviorType.FALLBACK,
  configurableInvoiceCustomSectionIds: [],
}

const validationSchema = z
  .object({
    behavior: z.enum(BehaviorType),
    configurableInvoiceCustomSectionIds: z.array(z.string()),
  })
  .refine(
    (data) =>
      data.behavior !== BehaviorType.CUSTOM_SECTIONS ||
      data.configurableInvoiceCustomSectionIds.length > 0,
    { path: ['configurableInvoiceCustomSectionIds'], message: '' },
  )

const DialogContent = withForm({
  defaultValues: initialValues,
  render: function Render({ form }) {
    const { translate } = useInternationalization()
    const { getInvoiceCustomSections, data: orgInvoiceCustomSections } =
      useInvoiceCustomSectionsLazy()

    useEffect(() => {
      getInvoiceCustomSections()
    }, [getInvoiceCustomSections])

    const options = useMemo(
      () =>
        (orgInvoiceCustomSections ?? []).map((section) => ({
          labelNode: section.name,
          label: section.name,
          description: section.code,
          value: section.id,
        })),
      [orgInvoiceCustomSections],
    )

    const behavior = useStore(form.store, (state) => state.values.behavior)

    return (
      <div className="p-8 not-last-child:mb-4">
        <form.AppField name="behavior">
          {(field) => (
            <field.RadioField
              value={BehaviorType.FALLBACK}
              label={translate('text_17352239389166kugn45zj95')}
              labelVariant="body"
            />
          )}
        </form.AppField>
        <form.AppField name="behavior">
          {(field) => (
            <field.RadioField
              value={BehaviorType.CUSTOM_SECTIONS}
              label={translate('text_1735223938916ed8ef8phwaz')}
              labelVariant="body"
            />
          )}
        </form.AppField>
        {behavior === BehaviorType.CUSTOM_SECTIONS && (
          <form.AppField name="configurableInvoiceCustomSectionIds">
            {(field) => (
              <field.MultipleComboBoxField
                hideTags={false}
                forcePopupIcon
                data={options}
                placeholder={translate('text_1735223938916qvvv12r7je0')}
                PopperProps={{ displayInDialog: true }}
                emptyText={translate('text_173642092241713ws50zg9v4')}
              />
            )}
          </form.AppField>
        )}
        <form.AppField name="behavior">
          {(field) => (
            <field.RadioField
              value={BehaviorType.DEACTIVATE}
              label={translate('text_1735223938916dhd7cyzokib')}
              labelVariant="body"
            />
          )}
        </form.AppField>
      </div>
    )
  },
})

export const useEditCustomerInvoiceCustomSectionsDialog = (customerId: string) => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()
  const successRef = useRef(false)

  const { data: customerData, customer } = useCustomerInvoiceCustomSections(customerId)

  const [editCustomerInvoiceCustomSection] = useEditCustomerInvoiceCustomSectionMutation({
    refetchQueries: ['getCustomerSettings'],
    onCompleted: (res) => {
      if (!res.updateCustomer) return
      successRef.current = true
      addToast({
        severity: 'success',
        message: translate('text_17352280436833uy9uxzbqn7'),
      })
    },
  })

  const form = useAppForm({
    defaultValues: initialValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: validationSchema },
    onSubmit: async ({ value }) => {
      if (!customer) return

      let formattedValues: UpdateCustomerInput = {
        id: customer.id,
        externalId: customer.externalId,
      }

      switch (value.behavior) {
        case BehaviorType.FALLBACK:
          formattedValues = {
            ...formattedValues,
            skipInvoiceCustomSections: false,
            configurableInvoiceCustomSectionIds: [],
          }
          break
        case BehaviorType.CUSTOM_SECTIONS:
          formattedValues = {
            ...formattedValues,
            skipInvoiceCustomSections: false,
            configurableInvoiceCustomSectionIds: value.configurableInvoiceCustomSectionIds,
          }
          break
        case BehaviorType.DEACTIVATE:
          formattedValues = {
            ...formattedValues,
            skipInvoiceCustomSections: true,
            configurableInvoiceCustomSectionIds: null,
          }
          break
      }

      await editCustomerInvoiceCustomSection({ variables: { input: formattedValues } })
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

  const openEditCustomerInvoiceCustomSectionsDialog = () => {
    form.reset()

    if (customerData?.hasOverwrittenInvoiceCustomSectionsSelection) {
      form.setFieldValue('behavior', BehaviorType.CUSTOM_SECTIONS)
      form.setFieldValue(
        'configurableInvoiceCustomSectionIds',
        customerData.configurableInvoiceCustomSections.map((section) => section.id),
      )
    } else if (customerData?.skipInvoiceCustomSections) {
      form.setFieldValue('behavior', BehaviorType.DEACTIVATE)
    } else {
      form.setFieldValue('behavior', BehaviorType.FALLBACK)
    }

    formDialog
      .open({
        title: translate('text_17352239389168sdqd97zo0t'),
        description: translate('text_1735223938916hla21yfwyzw'),
        closeOnError: false,
        onEntered: focusFirstInput,
        children: <DialogContent form={form} />,
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>{translate('text_1735223938916q9pq0j0z0ju')}</form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: EDIT_CUSTOMER_INVOICE_CUSTOM_SECTIONS_FORM_ID,
          submit: handleSubmit,
        },
      })
      .then((response) => {
        if (response.reason === 'close') {
          form.reset()
        }
      })
  }

  return { openEditCustomerInvoiceCustomSectionsDialog }
}
