import { gql } from '@apollo/client'
import { useRef } from 'react'

import { Alert } from '~/components/designSystem/Alert'
import { Typography } from '~/components/designSystem/Typography'
import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { addToast } from '~/core/apolloClient'
import {
  CUSTOMER_PORTAL_FORM_FIELDS,
  getCustomerPortalLockedFields,
} from '~/core/constants/customerPortalEditableFields'
import {
  CustomerPortalFieldEnum,
  useUpdateOrganizationCustomerPortalEditableFieldsMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

gql`
  mutation updateOrganizationCustomerPortalEditableFields($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      id
      customerPortalLockedFields
    }
  }
`

const EDIT_CUSTOMER_PORTAL_FIELDS_FORM_ID = 'form-edit-customer-portal-fields'

export const CUSTOMER_PORTAL_FIELD_CHECKBOX_TEST_ID = 'customer-portal-field-checkbox'

type EditCustomerPortalFieldsFormValues = Record<CustomerPortalFieldEnum, boolean>

const toFormValues = (
  editableFields: CustomerPortalFieldEnum[],
): EditCustomerPortalFieldsFormValues =>
  Object.fromEntries(
    Object.values(CustomerPortalFieldEnum).map((field) => [field, editableFields.includes(field)]),
  ) as EditCustomerPortalFieldsFormValues

// Built once: a new defaultValues object on each render makes the form reset to it, unchecking the loaded fields
const DEFAULT_FORM_VALUES = toFormValues([])

type EditCustomerPortalFieldsDialogData = {
  editableFields: CustomerPortalFieldEnum[]
}

export const useEditCustomerPortalFieldsDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()

  const successRef = useRef(false)

  const [updateEditableFields] = useUpdateOrganizationCustomerPortalEditableFieldsMutation()

  const form = useAppForm({
    defaultValues: DEFAULT_FORM_VALUES,
    onSubmit: async ({ value }) => {
      const customerPortalLockedFields = getCustomerPortalLockedFields(
        Object.values(CustomerPortalFieldEnum).filter((field) => value[field]),
      )

      const { errors } = await updateEditableFields({
        variables: { input: { customerPortalLockedFields } },
      })

      successRef.current = !errors?.length
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

  const openEditCustomerPortalFieldsDialog = ({
    editableFields,
  }: EditCustomerPortalFieldsDialogData) => {
    form.reset(toFormValues(editableFields), { keepDefaultValues: true })

    void formDialog
      .open({
        title: translate('text_1792713576573311eopximw3'),
        description: translate('text_1792713576574ze7tdls8m1o'),
        children: (
          <div className="flex flex-col gap-4 px-6 pb-2 pt-6">
            <Alert type="warning">
              <Typography variant="body" color="grey700">
                {translate('text_17927135765756b1t9r9gngf')}
              </Typography>
            </Alert>

            {/* Fields with no checkbox (document locale) keep their loaded value, so saving leaves them unchanged */}
            {CUSTOMER_PORTAL_FORM_FIELDS.map(({ field, labelKey }) => (
              <form.AppField key={field} name={field}>
                {(formField) => (
                  <formField.CheckboxField
                    label={translate(labelKey)}
                    dataTest={`${CUSTOMER_PORTAL_FIELD_CHECKBOX_TEST_ID}-${field}`}
                  />
                )}
              </form.AppField>
            ))}
          </div>
        ),
        closeOnError: false,
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>{translate('text_1792713576579ugzq1jl0rrj')}</form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: EDIT_CUSTOMER_PORTAL_FIELDS_FORM_ID,
          submit: handleSubmit,
        },
      })
      .then((response) => {
        if (response.reason === 'success') {
          addToast({
            severity: 'success',
            translateKey: 'text_1792713576576juq3qxeh6z9',
          })
        }
      })
  }

  return { openEditCustomerPortalFieldsDialog }
}
