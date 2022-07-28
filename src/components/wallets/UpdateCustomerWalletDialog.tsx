import { forwardRef } from 'react'
import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { object, string, date } from 'yup'
import styled from 'styled-components'

import { theme } from '~/styles'
import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { DatePickerField, TextInputField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  UpdateCustomerWalletInput,
  useUpdateCustomerWalletMutation,
  WalletForUpdateFragment,
  WalletForUpdateFragmentDoc,
} from '~/generated/graphql'
import { addToast } from '~/core/apolloClient'

gql`
  mutation updateCustomerWallet($input: UpdateCustomerWalletInput!) {
    updateCustomerWallet(input: $input) {
      ...WalletForUpdate
    }
  }

  fragment WalletForUpdate on Wallet {
    id
    name
    expirationDate
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
        expirationDate: wallet.expirationDate || undefined,
      },
      validationSchema: object().shape({
        name: string(),
        expirationDate: date(),
      }),
      onSubmit: async (values) => {
        await updateWallet({
          variables: {
            input: {
              id: wallet.id,
              ...values,
            },
          },
        })
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
              disabled={!formikProps.isValid}
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
            name="expirationDate"
            placement="top-end"
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
