import { forwardRef } from 'react'
import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { object, string, date } from 'yup'
import styled from 'styled-components'

import { theme } from '~/styles'
import { Alert, Button, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { DatePickerField, TextInput, TextInputField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  CreateCustomerWalletInput,
  useCreateCustomerWalletMutation,
  CurrencyEnum,
} from '~/generated/graphql'
import { addToast } from '~/core/apolloClient'

gql`
  mutation createCustomerWallet($input: CreateCustomerWalletInput!) {
    createCustomerWallet(input: $input) {
      id
    }
  }
`

export interface AddWalletToCustomerDialogRef extends DialogRef {}

interface AddWalletToCustomerDialogProps {
  customerId: string
}

export const AddWalletToCustomerDialog = forwardRef<DialogRef, AddWalletToCustomerDialogProps>(
  ({ customerId }: AddWalletToCustomerDialogProps, ref) => {
    const { translate } = useInternationalization()
    const [createWallet] = useCreateCustomerWalletMutation({
      onCompleted(res) {
        if (res?.createCustomerWallet) {
          addToast({
            severity: 'success',
            translateKey: 'text_62d6d5739e4eee96c1afaee8',
          })
        }
      },
    })

    const formikProps = useFormik<Omit<CreateCustomerWalletInput, 'customerId'>>({
      initialValues: {
        expirationDate: undefined,
        grantedCredits: '',
        name: '',
        paidCredits: '',
        rateAmount: '1.00',
      },
      validationSchema: object().shape({
        expirationDate: date().min(new Date()),
        grantedCredits: string().required(''),
        name: string(),
        paidCredits: string().required(''),
        rateAmount: string().required(''),
      }),
      validateOnMount: true,
      onSubmit: async (values) => {
        await createWallet({
          variables: {
            input: {
              customerId,
              ...values,
            },
          },
          refetchQueries: ['getCustomer', 'getCustomerWalletList'],
        })
      },
    })

    return (
      <Dialog
        ref={ref}
        title={translate('text_62d18855b22699e5cf55f871')}
        description={translate('text_62d18855b22699e5cf55f873')}
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
              {translate('text_62d18855b22699e5cf55f89d')}
            </Button>
            <Button
              disabled={!formikProps.isValid}
              onClick={async () => {
                await formikProps.submitForm()
                closeDialog()
                formikProps.resetForm()
              }}
            >
              {translate('text_62d18855b22699e5cf55f89f')}
            </Button>
          </>
        )}
      >
        <Content>
          <TextInputField
            name="name"
            label={translate('text_62d18855b22699e5cf55f875')}
            placeholder={translate('text_62d18855b22699e5cf55f877')}
            formikProps={formikProps}
          />
          <InlineFields>
            <TextInput
              value="1"
              label={translate('text_62d18855b22699e5cf55f879')}
              disabled={true}
            />
            <TextInput value="=" disabled={true} />
            <TextInputField
              name="rateAmount"
              beforeChangeFormatter={['positiveNumber', 'decimal']}
              label={translate('text_62d18855b22699e5cf55f87d')}
              placeholder={translate('text_62d18855b22699e5cf55f87f')}
              formikProps={formikProps}
              InputProps={{
                endAdornment: <InputEnd color="textSecondary">{CurrencyEnum.Usd}</InputEnd>,
              }}
            />
          </InlineFields>

          <TextInputField
            name="paidCredits"
            beforeChangeFormatter={['positiveNumber', 'decimal']}
            label={translate('text_62d18855b22699e5cf55f885')}
            placeholder={translate('text_62d18855b22699e5cf55f887')}
            formikProps={formikProps}
            helperText={translate('text_62d18855b22699e5cf55f88b', {
              paidCredits: Number(formikProps.values.paidCredits || 0),
            })}
            InputProps={{
              endAdornment: (
                <InputEnd color="textSecondary">
                  {translate('text_62d18855b22699e5cf55f889')}
                </InputEnd>
              ),
            }}
          />

          <TextInputField
            name="grantedCredits"
            beforeChangeFormatter={['positiveNumber', 'decimal']}
            label={translate('text_62d18855b22699e5cf55f88d')}
            placeholder={translate('text_62d18855b22699e5cf55f88f')}
            formikProps={formikProps}
            helperText={translate('text_62d18855b22699e5cf55f893', {
              grantedCredits: Number(formikProps.values.grantedCredits || 0),
            })}
            InputProps={{
              endAdornment: (
                <InputEnd color="textSecondary">
                  {translate('text_62d18855b22699e5cf55f891')}
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

          <DatePickerField
            disablePast
            name="expirationDate"
            placement="top-end"
            label={translate('text_62d18855b22699e5cf55f897')}
            placeholder={translate('text_62d18855b22699e5cf55f899')}
            helperText={translate('text_62d18855b22699e5cf55f89b')}
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

AddWalletToCustomerDialog.displayName = 'AddWalletToCustomerDialog'
