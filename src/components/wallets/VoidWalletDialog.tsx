import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { useFormik } from 'formik'
import { forwardRef } from 'react'
import styled from 'styled-components'
import { number, object } from 'yup'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { AmountInputField } from '~/components/form'
import { WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  useCreateCustomerWalletTransactionMutation,
  WalletForVoidTransactionFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

gql`
  mutation createCustomerWalletTransaction($input: CreateCustomerWalletTransactionInput!) {
    createCustomerWalletTransaction(input: $input) {
      collection {
        id
      }
    }
  }

  fragment WalletForVoidTransaction on Wallet {
    id
    currency
    rateAmount
    creditsBalance
  }
`

export interface VoidWalletDialogRef extends WarningDialogRef {}

interface VoidWalletDialogProps {
  wallet: WalletForVoidTransactionFragment
}

export const VoidWalletDialog = forwardRef<DialogRef, VoidWalletDialogProps>(
  ({ wallet }: VoidWalletDialogProps, ref) => {
    const { translate } = useInternationalization()

    const [createVoidTransaction] = useCreateCustomerWalletTransactionMutation({
      onCompleted(res) {
        if (res?.createCustomerWalletTransaction) {
          addToast({
            severity: 'success',
            translateKey: 'text_662fde6f41f3c001313057b8',
          })
        }
      },
    })

    const formikProps = useFormik({
      initialValues: {
        voidCredits: undefined,
      },
      validationSchema: object().shape({
        voidCredits: number()
          .required('')
          .max(
            wallet.creditsBalance,
            translate('text_662fc2730f9a31fe564e9dbf', { balance: wallet.creditsBalance }),
          ),
      }),
      enableReinitialize: true,
      validateOnMount: true,
      isInitialValid: false,
      onSubmit: async ({ voidCredits }) => {
        await createVoidTransaction({
          variables: {
            input: {
              walletId: wallet.id,
              voidedCredits: String(voidCredits),
            },
          },
          refetchQueries: ['getCustomerWalletList', 'getWalletTransactions'],
          notifyOnNetworkStatusChange: true,
        })
      },
    })

    return (
      <Dialog
        ref={ref}
        title={translate('text_63720bd734e1344aea75b7e9')}
        description={translate('text_662fc2730f9a31fe564e9dad')}
        onClose={() => formikProps.resetForm()}
        actions={({ closeDialog }) => (
          <>
            <Button variant="quaternary" onClick={closeDialog}>
              {translate('text_62e79671d23ae6ff149de968')}
            </Button>
            <Button
              disabled={!formikProps.isValid}
              onClick={async () => {
                await formikProps.submitForm()
                closeDialog()
              }}
              danger={formikProps.isValid && formikProps.dirty}
            >
              {translate('text_63720bd734e1344aea75b7e9')}
            </Button>
          </>
        )}
      >
        <Wrapper>
          <AmountInputField
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            name="voidCredits"
            currency={wallet.currency}
            beforeChangeFormatter={['positiveNumber']}
            label={translate('text_662fc2730f9a31fe564e9db1')}
            formikProps={formikProps}
            error={Boolean(formikProps.errors.voidCredits)}
            helperText={
              formikProps.errors.voidCredits
                ? formikProps.errors.voidCredits
                : translate('text_662fc2730f9a31fe564e9dbd', {
                    credits: intlFormatNumber(
                      !isNaN(Number(formikProps.values.voidCredits))
                        ? Number(formikProps.values.voidCredits) * Number(wallet.rateAmount)
                        : 0,
                      {
                        currencyDisplay: 'symbol',
                        currency: wallet.currency,
                      },
                    ),
                  })
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {translate('text_62e79671d23ae6ff149de94c')}
                </InputAdornment>
              ),
            }}
          />
        </Wrapper>
      </Dialog>
    )
  },
)

VoidWalletDialog.displayName = 'VoidWalletDialog'

const Wrapper = styled.div`
  margin-bottom: ${theme.spacing(8)};
`
