import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { forwardRef } from 'react'
import { object, string } from 'yup'

import { Button, Chip, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { RadioGroupField, TextInput, TextInputField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import { getInvoiceNumberPreview } from '~/core/utils/invoiceNumberPreview'
import {
  DocumentNumberingEnum,
  useUpdateOrganizationInvoiceNumberingMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

const DynamicPrefixTranslationLookup = {
  [DocumentNumberingEnum.PerCustomer]: 'text_6566f920a1d6c35693d6cce0',
  [DocumentNumberingEnum.PerOrganization]: 'YYYYMM',
}

gql`
  fragment EditOrganizationInvoiceNumberingDialog on CurrentOrganization {
    id
    documentNumbering
    documentNumberPrefix
  }

  mutation updateOrganizationInvoiceNumbering($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      id
      ...EditOrganizationInvoiceNumberingDialog
    }
  }
`

export type EditOrganizationInvoiceNumberingDialogRef = DialogRef

interface EditOrganizationInvoiceNumberingDialogProps {
  documentNumbering?: DocumentNumberingEnum
  documentNumberPrefix?: string
}

export const EditOrganizationInvoiceNumberingDialog = forwardRef<
  DialogRef,
  EditOrganizationInvoiceNumberingDialogProps
>(
  (
    { documentNumbering, documentNumberPrefix }: EditOrganizationInvoiceNumberingDialogProps,
    ref,
  ) => {
    const { translate } = useInternationalization()
    const [updateOrganizationInvoiceNumbering] = useUpdateOrganizationInvoiceNumberingMutation({
      onCompleted(res) {
        if (res?.updateOrganization) {
          addToast({
            severity: 'success',
            translateKey: 'text_6566f920a1d6c35693d6ce0f',
          })
        }
      },
    })

    // Type is manually written here as errors type are not correctly read from UpdateOrganizationInput
    const formikProps = useFormik<EditOrganizationInvoiceNumberingDialogProps>({
      initialValues: {
        documentNumbering,
        documentNumberPrefix,
      },
      validationSchema: object().shape({
        documentNumbering: string().required(''),
        documentNumberPrefix: string().required('').max(10, 'text_6566f920a1d6c35693d6cd77'),
      }),
      enableReinitialize: true,
      validateOnMount: true,
      onSubmit: async (values) => {
        await updateOrganizationInvoiceNumbering({
          variables: {
            input: {
              ...values,
            },
          },
        })
      },
    })

    return (
      <Dialog
        ref={ref}
        title={translate('text_6566f920a1d6c35693d6cc8c')}
        description={translate('text_6566f920a1d6c35693d6cc94')}
        onClose={() => formikProps.resetForm()}
        actions={({ closeDialog }) => (
          <>
            <Button variant="quaternary" onClick={closeDialog}>
              {translate('text_62bb10ad2a10bd182d002031')}
            </Button>
            <Button
              variant="primary"
              disabled={!formikProps.isValid || !formikProps.dirty}
              onClick={async () => {
                await formikProps.submitForm()
                closeDialog()
              }}
            >
              {translate('text_6566f920a1d6c35693d6cc8c')}
            </Button>
          </>
        )}
      >
        <div className="mb-8 flex flex-col gap-8">
          <div className="flex items-center gap-3 rounded-xl border border-grey-300 p-3">
            <Chip label={translate('text_6566f920a1d6c35693d6cc9e')} />
            <Typography variant="body" color="grey700">
              {getInvoiceNumberPreview(
                formikProps.values.documentNumbering as DocumentNumberingEnum,
                formikProps.values.documentNumberPrefix || '',
              )}
            </Typography>
          </div>

          <RadioGroupField
            formikProps={formikProps}
            name="documentNumbering"
            label={translate('text_6566f920a1d6c35693d6ccae')}
            options={[
              {
                label: translate('text_6566f920a1d6c35693d6ccb8'),
                value: DocumentNumberingEnum.PerCustomer,
              },
              {
                label: translate('text_6566f920a1d6c35693d6ccc0'),
                value: DocumentNumberingEnum.PerOrganization,
              },
            ]}
          />

          <div className="grid grid-cols-[1fr_8px_1fr_8px_80px] gap-3">
            <TextInputField
              name="documentNumberPrefix"
              formikProps={formikProps}
              label={translate('text_6566f920a1d6c35693d6ccc8')}
              error={
                formikProps.errors.documentNumberPrefix
                  ? translate(formikProps.errors.documentNumberPrefix)
                  : undefined
              }
            />
            <Typography className="mt-[38px] h-fit" variant="body">
              -
            </Typography>
            <TextInput
              disabled
              label={translate('text_6566f920a1d6c35693d6ccd8')}
              value={translate(
                DynamicPrefixTranslationLookup[
                  formikProps.values.documentNumbering as DocumentNumberingEnum
                ],
              )}
            />
            <Typography className="mt-[38px] h-fit" variant="body">
              -
            </Typography>
            <TextInput disabled label={translate('text_6566f920a1d6c35693d6cce8')} value={'001'} />
          </div>
        </div>
      </Dialog>
    )
  },
)

EditOrganizationInvoiceNumberingDialog.displayName = 'forwardRef'
