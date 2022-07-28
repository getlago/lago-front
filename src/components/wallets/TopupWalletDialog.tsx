import { forwardRef } from 'react'
import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { object, string } from 'yup'
import styled from 'styled-components'

import { theme } from '~/styles'
import { Alert, Button, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { TextInput, TextInputField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  CreateCustomerWalletTransactionInput,
  useCreateCustomerWalletTransactionMutation,
  WalletForTopupFragment,
} from '~/generated/graphql'
import { addToast } from '~/core/apolloClient'

gql`
  mutation createCustomerWalletTransaction($input: CreateCustomerWalletTransactionInput!) {
    createCustomerWalletTransaction(input: $input) {
      id
    }
  }

  fragment WalletForTopup on Wallet {
    id
    currency
    rateAmount
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
        paidCredits: '',
      },
      validationSchema: object().shape({
        grantedCredits: string().required(''),
        paidCredits: string().required(''),
      }),
      validateOnMount: true,
      onSubmit: async (values) => {
        await createWallet({
          variables: {
            input: {
              walletId: wallet.id,
              ...values,
            },
          },
          refetchQueries: ['getCustomerWalletList'],
        })
      },
    })

    return (
      <Dialog
        ref={ref}
        title={translate('text_62e79671d23ae6ff149de924')}
        description={translate('text_62e79671d23ae6ff149de928')}
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
              {translate('text_62e79671d23ae6ff149de968')}
            </Button>
            <Button
              disabled={!formikProps.isValid}
              onClick={async () => {
                await formikProps.submitForm()
                closeDialog()
                formikProps.resetForm()
              }}
            >
              {translate('text_62e79671d23ae6ff149de96c')}
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
                endAdornment: <InputEnd color="textSecondary">{wallet.currency}</InputEnd>,
              }}
              disabled
            />
          </InlineFields>

          <TextInputField
            name="paidCredits"
            beforeChangeFormatter={['positiveNumber', 'decimal']}
            label={translate('text_62e79671d23ae6ff149de944')}
            placeholder={translate('text_62d18855b22699e5cf55f887')}
            formikProps={formikProps}
            helperText={translate('text_62d18855b22699e5cf55f88b', {
              paidCredits: Number(formikProps.values.paidCredits || 0),
            })}
            InputProps={{
              endAdornment: (
                <InputEnd variant="captionHl" color="textSecondary">
                  {translate('text_62e79671d23ae6ff149de94c')}
                </InputEnd>
              ),
            }}
          />

          <TextInputField
            name="grantedCredits"
            beforeChangeFormatter={['positiveNumber', 'decimal']}
            label={translate('text_62e79671d23ae6ff149de954')}
            placeholder={translate('text_62d18855b22699e5cf55f88f')}
            formikProps={formikProps}
            helperText={translate('text_62d18855b22699e5cf55f893', {
              grantedCredits: Number(formikProps.values.grantedCredits || 0),
            })}
            InputProps={{
              endAdornment: (
                <InputEnd variant="captionHl" color="textSecondary">
                  {translate('text_62e79671d23ae6ff149de95c')}
                </InputEnd>
              ),
            }}
          />

          <Alert type="info">
            <Typography color="textSecondary">
              {translate('text_62d18855b22699e5cf55f895', {
                totalCreditCount:
                  Number(formikProps.values.paidCredits || 0) +
                  Number(formikProps.values.grantedCredits || 0),
              })}
            </Typography>
          </Alert>
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

const InputEnd = styled(Typography)`
  margin-right: ${theme.spacing(4)};
`

TopupWalletDialog.displayName = 'TopupWalletDialog'
