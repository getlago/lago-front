import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { forwardRef } from 'react'
import styled from 'styled-components'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { ComboBoxField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import {
  EditCustomerFinalizeZeroAmountInvoiceForDialogFragment,
  EditOrganizationFinalizeZeroAmountInvoiceForDialogFragment,
  FinalizeZeroAmountInvoiceEnum,
  useUpdateCustomerFinalizeZeroAmountInvoiceMutation,
  useUpdateOrganizationFinalizeZeroAmountInvoiceMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

gql`
  fragment EditCustomerFinalizeZeroAmountInvoiceForDialog on Customer {
    id
    externalId
    name
    finalizeZeroAmountInvoice
  }

  fragment EditOrganizationFinalizeZeroAmountInvoiceForDialog on CurrentOrganization {
    id
    finalizeZeroAmountInvoice
  }

  mutation updateCustomerFinalizeZeroAmountInvoice($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
      ...EditCustomerFinalizeZeroAmountInvoiceForDialog
    }
  }

  mutation updateOrganizationFinalizeZeroAmountInvoice($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      id
      ...EditOrganizationFinalizeZeroAmountInvoiceForDialog
    }
  }
`

type EditFinalizeZeroAmountInvoiceDialogProps = {
  entity?:
    | EditCustomerFinalizeZeroAmountInvoiceForDialogFragment
    | EditOrganizationFinalizeZeroAmountInvoiceForDialogFragment
    | null
  finalizeZeroAmountInvoice?: FinalizeZeroAmountInvoiceEnum | boolean | null
}

export interface EditFinalizeZeroAmountInvoiceDialogRef extends DialogRef {}

export const EditFinalizeZeroAmountInvoiceDialog = forwardRef<
  EditFinalizeZeroAmountInvoiceDialogRef,
  EditFinalizeZeroAmountInvoiceDialogProps
>(({ entity, finalizeZeroAmountInvoice }: EditFinalizeZeroAmountInvoiceDialogProps, dialogRef) => {
  const { translate } = useInternationalization()

  const [updateCustomerFinalizeZeroAmountInvoice] =
    useUpdateCustomerFinalizeZeroAmountInvoiceMutation({
      onCompleted(res) {
        if (res?.updateCustomer) {
          addToast({
            severity: 'success',
            translateKey: translate('text_1725549671288cyc585wdz35'),
          })
        }
      },
    })

  const [updateOrganizationFinalizeZeroAmountInvoice] =
    useUpdateOrganizationFinalizeZeroAmountInvoiceMutation({
      onCompleted(res) {
        if (res?.updateOrganization) {
          addToast({
            severity: 'success',
            translateKey: translate('text_17255496712882bspi9zp0ii'),
          })
        }
      },
    })

  const isCustomer = entity?.__typename === 'Customer'

  const initialValue = isCustomer
    ? finalizeZeroAmountInvoice === FinalizeZeroAmountInvoiceEnum.Inherit
      ? ''
      : finalizeZeroAmountInvoice
    : finalizeZeroAmountInvoice?.toString()

  const formikProps = useFormik({
    initialValues: {
      finalizeZeroAmountInvoice: initialValue,
    },
    validationSchema: object().shape({
      finalizeZeroAmountInvoice: string().required(),
    }),
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (!values.finalizeZeroAmountInvoice) {
        return
      }

      if (isCustomer) {
        return await updateCustomerFinalizeZeroAmountInvoice({
          variables: {
            input: {
              id: entity?.id || '',
              externalId: entity.externalId,
              name: entity?.name || '',
              finalizeZeroAmountInvoice:
                values?.finalizeZeroAmountInvoice as FinalizeZeroAmountInvoiceEnum,
            },
          },
        })
      }

      return await updateOrganizationFinalizeZeroAmountInvoice({
        variables: {
          input: {
            finalizeZeroAmountInvoice: values.finalizeZeroAmountInvoice === 'true',
          },
        },
      })
    },
  })

  const comboBoxData = isCustomer
    ? [
        { value: 'finalize', label: translate('text_1725549671287ancbf00edxx') },
        { value: 'skip', label: translate('text_1725549671288zkq9sr0y46l') },
      ]
    : [
        { value: 'true', label: translate('text_1725549671287ancbf00edxx') },
        { value: 'false', label: translate('text_1725549671288zkq9sr0y46l') },
      ]

  return (
    <Dialog
      ref={dialogRef}
      title={translate('text_17255383402002zmj6x02fx8')}
      description={translate('text_1725538340200495slgen6ji')}
      onClose={() => {
        formikProps.resetForm()
      }}
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
              formikProps.resetForm()
            }}
          >
            {finalizeZeroAmountInvoice === FinalizeZeroAmountInvoiceEnum.Inherit
              ? translate('text_1725550747818f6v0c35vzdk')
              : translate('text_1725549671288w2pu90s5rhq')}
          </Button>
        </>
      )}
    >
      <ContentWrapper>
        <ComboBoxField
          disableClearable
          name="finalizeZeroAmountInvoice"
          placeholder={translate('text_1725550661207stz6kovtzkp')}
          label={translate('text_1725549671288gcrvgdn7rml')}
          data={comboBoxData}
          PopperProps={{ displayInDialog: true }}
          formikProps={formikProps}
        />
      </ContentWrapper>
    </Dialog>
  )
})

const ContentWrapper = styled.div`
  display: flex;
  gap: ${theme.spacing(3)};
  margin-bottom: ${theme.spacing(8)};

  > * {
    flex: 1;
  }

  ${theme.breakpoints.down('md')} {
    flex-direction: column;
  }
`

EditFinalizeZeroAmountInvoiceDialog.displayName = 'forwardRef'
