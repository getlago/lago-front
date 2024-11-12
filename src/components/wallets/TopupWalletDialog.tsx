import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { useFormik } from 'formik'
import { forwardRef } from 'react'
import styled from 'styled-components'
import { boolean, object, string } from 'yup'

import { Alert, Button, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { AmountInputField, SwitchField, TextInput } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  CreateCustomerWalletTransactionInput,
  useCreateCustomerWalletTransactionMutation,
  WalletForTopupFragment,
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

  fragment WalletForTopup on Wallet {
    id
    currency
    rateAmount
    invoiceRequiresSuccessfulPayment
  }
`

export interface TopupWalletDialogRef extends DialogRef {}

interface TopupWalletDialogProps {
  wallet: WalletForTopupFragment
}

export const TopupWalletDialog = forwardRef<DialogRef, TopupWalletDialogProps>(
  ({ wallet }: TopupWalletDialogProps, ref) => {
    const { translate } = useInternationalization()
    const [createWallet] = useCreateCustomerWalletTransactionMutation({
      onCompleted(res) {
        if (res?.createCustomerWalletTransaction) {
          addToast({
            severity: 'success',
            translateKey: 'text_62e79671d23ae6ff149dea26',
          })
        }
      },
    })

    const formikProps = useFormik<Omit<CreateCustomerWalletTransactionInput, 'walletId'>>({
      initialValues: {
        grantedCredits: '',
        invoiceRequiresSuccessfulPayment: wallet.invoiceRequiresSuccessfulPayment,
        paidCredits: '',
      },
      validationSchema: object().shape({
        paidCredits: string().test({
          test: function (paidCredits) {
            const { grantedCredits } = this?.parent || {}

            return !isNaN(Number(paidCredits)) || !isNaN(Number(grantedCredits))
          },
        }),
        invoiceRequiresSuccessfulPayment: boolean(),
        grantedCredits: string().test({
          test: function (grantedCredits) {
            const { paidCredits } = this?.parent || {}

            return !isNaN(Number(grantedCredits)) || !isNaN(Number(paidCredits))
          },
        }),
      }),
      validateOnMount: true,
      onSubmit: async ({ grantedCredits, paidCredits, invoiceRequiresSuccessfulPayment }) => {
        await createWallet({
          variables: {
            input: {
              walletId: wallet.id,
              grantedCredits: grantedCredits === '' ? '0' : String(grantedCredits),
              paidCredits: paidCredits === '' ? '0' : String(paidCredits),
              invoiceRequiresSuccessfulPayment,
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
        title={translate('text_62e79671d23ae6ff149de924')}
        description={translate('text_62e79671d23ae6ff149de928')}
        onClose={() => {
          formikProps.resetForm()
          formikProps.validateForm()
        }}
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
            >
              {translate(
                'text_62e79671d23ae6ff149de96c',
                undefined,
                Number(formikProps.values.paidCredits || 0) +
                  Number(formikProps.values.grantedCredits || 0),
              )}
            </Button>
          </>
        )}
      >
        <Content>
          <InlineFields>
            <TextInput value="1" label={translate('text_62e79671d23ae6ff149de92c')} disabled />
            <TextInput value="=" disabled />
            <TextInput
              label={translate('text_62e79671d23ae6ff149de934')}
              placeholder={translate('text_62d18855b22699e5cf55f87f')}
              value={wallet.rateAmount}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {getCurrencySymbol(wallet.currency)}
                  </InputAdornment>
                ),
              }}
              disabled
            />
          </InlineFields>

          <AmountInputField
            name="paidCredits"
            currency={wallet.currency}
            beforeChangeFormatter={['positiveNumber']}
            label={translate('text_62e79671d23ae6ff149de944')}
            formikProps={formikProps}
            silentError={true}
            helperText={translate('text_62d18855b22699e5cf55f88b', {
              paidCredits: intlFormatNumber(
                isNaN(Number(formikProps.values.paidCredits))
                  ? 0
                  : Number(formikProps.values.paidCredits) * Number(wallet.rateAmount),

                {
                  currencyDisplay: 'symbol',
                  currency: wallet.currency,
                },
              ),
            })}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {translate('text_62e79671d23ae6ff149de94c')}
                </InputAdornment>
              ),
            }}
          />

          {formikProps.values.paidCredits && (
            <SwitchField
              name="invoiceRequiresSuccessfulPayment"
              formikProps={formikProps}
              label={translate('text_66a8aed1c3e07b277ec3990d')}
              subLabel={translate('text_66a8aed1c3e07b277ec3990f')}
            />
          )}

          <AmountInputField
            name="grantedCredits"
            currency={wallet.currency}
            beforeChangeFormatter={['positiveNumber']}
            label={translate('text_62e79671d23ae6ff149de954')}
            formikProps={formikProps}
            silentError={true}
            helperText={translate('text_62d18855b22699e5cf55f893', {
              grantedCredits: intlFormatNumber(
                isNaN(Number(formikProps.values.grantedCredits))
                  ? 0
                  : Number(formikProps.values.grantedCredits) * Number(wallet.rateAmount),
                {
                  currencyDisplay: 'symbol',
                  currency: wallet.currency,
                },
              ),
            })}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {translate('text_62e79671d23ae6ff149de95c')}
                </InputAdornment>
              ),
            }}
          />

          <Alert type="info">
            <Typography color="textSecondary">
              {translate('text_630df52b4f665b2452363ae2', {
                totalCreditCount:
                  Math.round(
                    Number(formikProps.values.paidCredits || 0) * 100 +
                      Number(formikProps.values.grantedCredits || 0) * 100,
                  ) / 100,
              })}
            </Typography>
          </Alert>
        </Content>
      </Dialog>
    )
  },
)

const Content = styled.div`
  > * {
    margin-bottom: ${theme.spacing(6)};
  }

  &:last-child {
    margin-bottom: ${theme.spacing(8)};
  }
`

const InlineFields = styled.div`
  display: flex;
  align-items: end;

  > *:not(:last-child) {
    margin-right: ${theme.spacing(3)};
  }

  > div:nth-child(1) {
    width: 120px;
  }

  > div:nth-child(2) {
    width: 48px;

    input {
      text-align: center;
    }
  }

  > div:nth-child(3) {
    flex: 1;
  }
`

TopupWalletDialog.displayName = 'TopupWalletDialog'
