import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { DateTime } from 'luxon'
import { forwardRef } from 'react'
import styled from 'styled-components'
import { date, object, string } from 'yup'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { DatePickerField, TextInputField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import {
  UpdateCustomerWalletInput,
  useUpdateCustomerWalletMutation,
  WalletForUpdateFragment,
  WalletForUpdateFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

gql`
  mutation updateCustomerWallet($input: UpdateCustomerWalletInput!) {
    updateCustomerWallet(input: $input) {
      ...WalletForUpdate
    }
  }

  fragment WalletForUpdate on Wallet {
    id
    name
    expirationAt
  }

  ${WalletForUpdateFragmentDoc}
`

export interface UpdateCustomerWalletDialogRef extends DialogRef {}

interface UpdateCustomerWalletDialogProps {
  wallet: WalletForUpdateFragment
}

export const UpdateCustomerWalletDialog = forwardRef<DialogRef, UpdateCustomerWalletDialogProps>(
  ({ wallet }: UpdateCustomerWalletDialogProps, ref) => {
    const { translate } = useInternationalization()
    const [updateWallet] = useUpdateCustomerWalletMutation({
      onCompleted(res) {
        if (res?.updateCustomerWallet) {
          addToast({
            severity: 'success',
            translateKey: 'text_62e24a0b20d9ff721d3f8f68',
          })
        }
      },
    })

    const formikProps = useFormik<Omit<UpdateCustomerWalletInput, 'id'>>({
      initialValues: {
        name: wallet.name || '',
        expirationAt: wallet.expirationAt || undefined,
      },
      enableReinitialize: true,
      validateOnMount: true,
      validationSchema: object().shape({
        name: string(),
        expirationAt: date().min(
          DateTime.now().plus({ days: -1 }),
          translate('text_630ccd87b251590eaa5f9831', {
            date: DateTime.now().plus({ days: -1 }).toFormat('LLL. dd, yyyy').toLocaleString(),
          })
        ),
      }),
      onSubmit: async (values, formikBag) => {
        await updateWallet({
          variables: {
            input: {
              id: wallet.id,
              ...values,
            },
          },
        })

        formikBag.resetForm()
      },
    })

    return (
      <Dialog
        ref={ref}
        title={translate('text_62d9430e8b9fe36851cddd09')}
        description={translate('text_62d9430e8b9fe36851cddd0d')}
        onClickAway={() => {
          formikProps.resetForm()
        }}
        actions={({ closeDialog }) => (
          <>
            <Button
              variant="quaternary"
              onClick={() => {
                closeDialog()
                formikProps.resetForm()
              }}
            >
              {translate('text_62d9430e8b9fe36851cddd25')}
            </Button>
            <Button
              disabled={!formikProps.isValid || !formikProps.dirty}
              onClick={async () => {
                await formikProps.submitForm()
                closeDialog()
                formikProps.resetForm()
              }}
            >
              {translate('text_62d9430e8b9fe36851cddd29')}
            </Button>
          </>
        )}
      >
        <Content>
          <TextInputField
            name="name"
            label={translate('text_62d9430e8b9fe36851cddd11')}
            placeholder={translate('text_62d9430e8b9fe36851cddd15')}
            formikProps={formikProps}
          />
          <DatePickerField
            disablePast
            name="expirationAt"
            placement="left-start"
            label={translate('text_62d94fc982c82f068d3753c7')}
            placeholder={translate('text_62d94fc982c82f068d3753c9')}
            helperText={translate('text_62d94fc982c82f068d3753cb')}
            formikProps={formikProps}
          />
        </Content>
      </Dialog>
    )
  }
)

const Content = styled.div`
  > * {
    margin-bottom: ${theme.spacing(6)};
  }

  &:last-child {
    margin-bottom: ${theme.spacing(8)};
  }
`

UpdateCustomerWalletDialog.displayName = 'UpdateCustomerWalletDialog'
