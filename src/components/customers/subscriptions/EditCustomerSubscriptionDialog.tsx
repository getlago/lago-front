import { forwardRef, useRef, useState, useImperativeHandle } from 'react'
import { useFormik } from 'formik'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { Dialog, Button, DialogRef } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { TextInputField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import { useUpdateCustomerSubscriptionMutation, UpdateSubscriptionInput } from '~/generated/graphql'
import { theme } from '~/styles'

gql`
  mutation updateCustomerSubscription($input: UpdateSubscriptionInput!) {
    updateSubscription(input: $input) {
      id
      name
    }
  }
`

export interface EditCustomerSubscriptionDialogRef {
  openDialog: (subscriptionInfos: { id: string; name?: string | null }) => unknown
  closeDialog: () => unknown
}

export const EditCustomerSubscriptionDialog = forwardRef<EditCustomerSubscriptionDialogRef>(
  (_, ref) => {
    const dialogRef = useRef<DialogRef>(null)
    const [update] = useUpdateCustomerSubscriptionMutation({
      onCompleted({ updateSubscription }) {
        if (!!updateSubscription) {
          addToast({
            severity: 'success',
            translateKey: 'text_62e38a4631937146a6d6d5dd',
          })
        }
      },
    })
    const [subscription, setSubscription] = useState<
      { id: string; name?: string | null } | undefined
    >(undefined)
    const { translate } = useInternationalization()
    const formikProps = useFormik<Pick<UpdateSubscriptionInput, 'name'>>({
      initialValues: {
        name: subscription?.name || '',
      },
      validateOnMount: true,
      enableReinitialize: true,
      onSubmit: async (values) => {
        await update({
          variables: {
            input: {
              id: subscription?.id as string,
              ...values,
            },
          },
        })
      },
    })

    useImperativeHandle(ref, () => ({
      openDialog: (infos) => {
        setSubscription(infos)
        dialogRef.current?.openDialog()
      },
      closeDialog: () => dialogRef.current?.closeDialog(),
    }))

    return (
      <Dialog
        ref={dialogRef}
        title={translate('text_62d7f6178ec94cd09370e2f1')}
        description={translate('text_62d7f6178ec94cd09370e311')}
        actions={({ closeDialog }) => (
          <>
            <Button
              variant="quaternary"
              onClick={() => {
                closeDialog()
                formikProps.resetForm()
              }}
            >
              {translate('text_62d7f6178ec94cd09370e34d')}
            </Button>
            <Button
              disabled={!formikProps.isValid || !formikProps.dirty}
              onClick={async () => {
                await formikProps.submitForm()
                closeDialog()
              }}
            >
              {translate('text_62d7f6178ec94cd09370e353')}
            </Button>
          </>
        )}
      >
        <Content>
          <TextInputField
            name="name"
            label={translate('text_62d7f6178ec94cd09370e32d')}
            placeholder={translate('text_62d7f6178ec94cd09370e393')}
            formikProps={formikProps}
          />
        </Content>
      </Dialog>
    )
  }
)

EditCustomerSubscriptionDialog.displayName = 'EditCustomerSubscriptionDialog'

const Content = styled.div`
  margin-bottom: ${theme.spacing(8)};
`
