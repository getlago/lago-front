import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { useFormik } from 'formik'
import { DateTime } from 'luxon'
import { forwardRef, RefObject, useState } from 'react'
import styled from 'styled-components'
import { date, object, string } from 'yup'

import { Alert, Button, Dialog, DialogRef, Typography } from '~/components/designSystem'
import {
  AmountInputField,
  ComboBoxField,
  DatePickerField,
  TextInput,
  TextInputField,
} from '~/components/form'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { getCurrencyPrecision } from '~/core/serializers/serializeAmount'
import {
  CreateCustomerWalletInput,
  CurrencyEnum,
  CustomerDetailsFragment,
  CustomerDetailsFragmentDoc,
  CustomerWalletFragmentDoc,
  GetCustomerWalletListDocument,
  GetCustomerWalletListQuery,
  LagoApiError,
  useCreateCustomerWalletMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { theme } from '~/styles'

gql`
  mutation createCustomerWallet($input: CreateCustomerWalletInput!) {
    createCustomerWallet(input: $input) {
      id
      ...CustomerWallet
      customer {
        id
        hasActiveWallet
      }
    }
  }

  ${CustomerWalletFragmentDoc}
`

export interface AddWalletToCustomerDialogRef extends DialogRef {}

interface AddWalletToCustomerDialogProps {
  customerId: string
  userCurrency?: CurrencyEnum
}

export const AddWalletToCustomerDialog = forwardRef<DialogRef, AddWalletToCustomerDialogProps>(
  ({ customerId, userCurrency }: AddWalletToCustomerDialogProps, ref) => {
    const { translate } = useInternationalization()
    const { organization } = useOrganizationInfos()
    const [currencyError, setCurrencyError] = useState(false)
    const currencyPrecision = getCurrencyPrecision(
      userCurrency || organization?.defaultCurrency || CurrencyEnum.Usd
    )
    const [createWallet] = useCreateCustomerWalletMutation({
      context: {
        silentErrorCodes: [LagoApiError.UnprocessableEntity],
      },
      update(cache, { data }) {
        if (!data?.createCustomerWallet || !data?.createCustomerWallet) return

        const walletsData: GetCustomerWalletListQuery | null = cache.readQuery({
          query: GetCustomerWalletListDocument,
          variables: { customerId },
        })

        cache.writeQuery({
          query: GetCustomerWalletListDocument,
          variables: { customerId },
          data: {
            wallets: {
              metadata: walletsData?.wallets?.metadata,
              collection: [data?.createCustomerWallet, ...(walletsData?.wallets?.collection || [])],
            },
          },
        })

        const cachedCustomerId = `Customer:${data.createCustomerWallet?.customer?.id}`

        const previousData: CustomerDetailsFragment | null = cache.readFragment({
          id: cachedCustomerId,
          fragment: CustomerDetailsFragmentDoc,
          fragmentName: 'CustomerDetails',
        })

        cache.writeFragment({
          id: cachedCustomerId,
          fragment: CustomerDetailsFragmentDoc,
          fragmentName: 'CustomerDetails',
          data: {
            ...previousData,
            hasActiveWallet: data.createCustomerWallet?.customer?.hasActiveWallet,
          },
        })
      },
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
        expirationAt: undefined,
        grantedCredits: '',
        name: '',
        paidCredits: '',
        currency: userCurrency || organization?.defaultCurrency || CurrencyEnum.Usd,
        rateAmount: `1${
          currencyPrecision === 3 ? '.000' : currencyPrecision === 4 ? '.0000' : '.00'
        }`,
      },
      validationSchema: object().shape({
        expirationAt: date().min(
          DateTime.now().plus({ days: -1 }),
          translate('text_630ccd87b251590eaa5f9831', {
            date: DateTime.now().plus({ days: -1 }).toFormat('LLL. dd, yyyy').toLocaleString(),
          })
        ),
        name: string(),
        paidCredits: string().test({
          test: function (paidCredits) {
            const { grantedCredits } = this?.parent

            return !isNaN(Number(paidCredits)) || !isNaN(Number(grantedCredits))
          },
        }),
        grantedCredits: string().test({
          test: function (grantedCredits) {
            const { paidCredits } = this?.parent

            return !isNaN(Number(grantedCredits)) || !isNaN(Number(paidCredits))
          },
        }),
        rateAmount: string().required(''),
      }),
      validateOnMount: true,
      enableReinitialize: true,
      onSubmit: async ({ grantedCredits, paidCredits, rateAmount, ...values }, formikBag) => {
        const { errors } = await createWallet({
          variables: {
            input: {
              customerId,
              rateAmount: String(rateAmount),
              grantedCredits: grantedCredits === '' ? '0' : String(grantedCredits),
              paidCredits: paidCredits === '' ? '0' : String(paidCredits),
              ...values,
            },
          },
        })

        if (!hasDefinedGQLError('CurrenciesDoesNotMatch', errors)) {
          ;(ref as unknown as RefObject<DialogRef>)?.current?.closeDialog()
          formikBag.resetForm()
          setCurrencyError(false)
        } else {
          setCurrencyError(true)
        }
      },
    })

    return (
      <Dialog
        ref={ref}
        title={translate('text_62d18855b22699e5cf55f871')}
        description={translate('text_62d18855b22699e5cf55f873')}
        onClickAway={() => {
          formikProps.resetForm()
          formikProps.validateForm()
          setCurrencyError(false)
        }}
        actions={({ closeDialog }) => (
          <>
            <Button
              variant="quaternary"
              onClick={() => {
                closeDialog()
                formikProps.resetForm()
                formikProps.validateForm()
              }}
            >
              {translate('text_62d18855b22699e5cf55f89d')}
            </Button>
            <Button
              disabled={!formikProps.isValid}
              onClick={async () => {
                await formikProps.submitForm()
              }}
            >
              {translate(
                'text_62d18855b22699e5cf55f89f',
                undefined,
                Number(formikProps.values.paidCredits || 0) +
                  Number(formikProps.values.grantedCredits || 0)
              )}
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
            <LineAmount>
              <AmountInputField
                name="rateAmount"
                currency={formikProps.values.currency}
                beforeChangeFormatter={['positiveNumber']}
                label={translate('text_62d18855b22699e5cf55f87d')}
                formikProps={formikProps}
              />
              <ComboBoxField
                name="currency"
                data={Object.values(CurrencyEnum).map((currencyType) => ({
                  value: currencyType,
                }))}
                disableClearable
                formikProps={formikProps}
                PopperProps={{ displayInDialog: true }}
              />
            </LineAmount>
          </InlineFields>

          <AmountInputField
            name="paidCredits"
            currency={formikProps.values.currency}
            beforeChangeFormatter={['positiveNumber']}
            label={translate('text_62d18855b22699e5cf55f885')}
            formikProps={formikProps}
            silentError={true}
            helperText={translate('text_62d18855b22699e5cf55f88b', {
              paidCredits: intlFormatNumber(
                isNaN(Number(formikProps.values.paidCredits))
                  ? 0
                  : Number(formikProps.values.paidCredits) * Number(formikProps.values.rateAmount),
                {
                  currencyDisplay: 'symbol',
                  currency: formikProps?.values?.currency || CurrencyEnum.Usd,
                }
              ),
            })}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {translate('text_62d18855b22699e5cf55f889')}
                </InputAdornment>
              ),
            }}
          />

          <AmountInputField
            name="grantedCredits"
            currency={formikProps.values.currency}
            beforeChangeFormatter={['positiveNumber']}
            label={translate('text_62d18855b22699e5cf55f88d')}
            formikProps={formikProps}
            silentError={true}
            helperText={translate('text_62d18855b22699e5cf55f893', {
              grantedCredits: intlFormatNumber(
                isNaN(Number(formikProps.values.grantedCredits))
                  ? 0
                  : Number(formikProps.values.grantedCredits) *
                      Number(formikProps.values.rateAmount),
                {
                  currencyDisplay: 'symbol',
                  currency: formikProps?.values?.currency || CurrencyEnum.Usd,
                }
              ),
            })}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {translate('text_62d18855b22699e5cf55f891')}
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
                      Number(formikProps.values.grantedCredits || 0) * 100
                  ) / 100,
              })}
            </Typography>
            <Typography color="textSecondary">
              {translate('text_630df52b4f665b2452363ae4')}
            </Typography>
          </Alert>

          <DatePickerField
            disablePast
            name="expirationAt"
            placement="top-end"
            label={translate('text_62d18855b22699e5cf55f897')}
            placeholder={translate('text_62d18855b22699e5cf55f899')}
            helperText={translate('text_62d18855b22699e5cf55f89b')}
            formikProps={formikProps}
          />
        </Content>

        {currencyError && (
          <StyledAlert type="danger">{translate('text_632c88c97af78294bc02eb29')}</StyledAlert>
        )}
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

const LineAmount = styled.div`
  display: flex;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
    flex: 1;
  }

  > *:last-child {
    max-width: 120px;
    margin-top: 24px;
  }
`

const StyledAlert = styled(Alert)`
  margin-bottom: ${theme.spacing(8)};
`

AddWalletToCustomerDialog.displayName = 'AddWalletToCustomerDialog'
