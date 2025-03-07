import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { useFormik } from 'formik'
import { useCallback, useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import { boolean, object, string } from 'yup'

import { Alert, Button, Typography } from '~/components/designSystem'
import { AmountInputField, SwitchField, TextInput } from '~/components/form'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { CustomerDetailsTabsOptions } from '~/core/constants/tabsOptions'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_DETAILS_TAB_ROUTE } from '~/core/router'
import { getCurrencyPrecision } from '~/core/serializers/serializeAmount'
import {
  CreateCustomerWalletTransactionInput,
  CurrencyEnum,
  useCreateCustomerWalletTransactionMutation,
  useGetWalletForTopUpQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

gql`
  query getWalletForTopUp($walletId: ID!) {
    wallet(id: $walletId) {
      id
      ...WalletForTopUp
    }
  }

  mutation createCustomerWalletTransaction($input: CreateCustomerWalletTransactionInput!) {
    createCustomerWalletTransaction(input: $input) {
      collection {
        id
      }
    }
  }

  fragment WalletForTopUp on Wallet {
    id
    currency
    rateAmount
    invoiceRequiresSuccessfulPayment
  }
`

const CreateWalletTopUp = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { organization: { defaultCurrency } = {} } = useOrganizationInfos()
  const { customerId = '', walletId = '' } = useParams()
  const warningDialogRef = useRef<WarningDialogRef>(null)

  const { data: { wallet } = {}, loading } = useGetWalletForTopUpQuery({
    variables: {
      walletId,
    },
  })

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

  const currencyPrecision = getCurrencyPrecision(
    wallet?.currency ?? defaultCurrency ?? CurrencyEnum.Usd,
  )
  const formikProps = useFormik<Omit<CreateCustomerWalletTransactionInput, 'walletId'>>({
    initialValues: {
      grantedCredits: '',
      invoiceRequiresSuccessfulPayment: wallet?.invoiceRequiresSuccessfulPayment,
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
      if (!wallet) return

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

      navigateToCustomerWalletTab()
    },
  })

  const navigateToCustomerWalletTab = useCallback(
    () =>
      navigate(
        generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
          customerId: customerId,
          tab: CustomerDetailsTabsOptions.wallet,
        }),
      ),
    [customerId, navigate],
  )

  const onAbort = useCallback(() => {
    formikProps.dirty ? warningDialogRef.current?.openDialog() : navigateToCustomerWalletTab()
  }, [formikProps.dirty, navigateToCustomerWalletTab])

  const setCurrencyPrecision = useCallback(
    (value: number) => {
      let precision

      if (currencyPrecision === 3) {
        precision = '.000'
      } else if (currencyPrecision === 4) {
        precision = '.0000'
      } else {
        precision = '.00'
      }

      return `${value}${precision}`
    },
    [currencyPrecision],
  )

  return (
    <>
      <CenteredPage.Wrapper>
        <CenteredPage.Header>
          <Typography variant="bodyHl" color="textSecondary" noWrap>
            {translate('text_62e161ceb87c201025388ada')}
          </Typography>
          <Button
            variant="quaternary"
            icon="close"
            onClick={onAbort}
            data-test="close-create-topup-button"
          />
        </CenteredPage.Header>

        {loading && !wallet && (
          <CenteredPage.Container>
            <FormLoadingSkeleton id="create-wallet" />
          </CenteredPage.Container>
        )}

        {!loading && wallet && (
          <CenteredPage.Container>
            <CenteredPage.PageTitle
              title={translate('text_62e79671d23ae6ff149de924')}
              description={translate('text_1741103892833sy9e4va0pvb')}
            />

            <section className="flex flex-col gap-6 pb-12 shadow-b">
              <div className="flex flex-col gap-1">
                <Typography variant="subhead">
                  {translate('text_6560809c38fb9de88d8a5090')}
                </Typography>
                <Typography variant="caption">
                  {translate('text_17411038928332xzx1hb4wjx')}
                </Typography>
              </div>

              <div className="grid grid-cols-[48px_48px_1fr] items-end gap-3">
                <TextInput
                  value="1"
                  label={translate('text_62e79671d23ae6ff149de92c')}
                  disabled
                  className="[&_input]:text-center"
                />
                <TextInput value="=" disabled className="[&_input]:text-center" />
                <TextInput
                  label={translate('text_62e79671d23ae6ff149de934')}
                  placeholder={translate('text_62d18855b22699e5cf55f87f')}
                  value={setCurrencyPrecision(wallet.rateAmount)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">{wallet.currency}</InputAdornment>
                    ),
                  }}
                  disabled
                />
              </div>
            </section>

            <section className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <Typography variant="subhead">
                  {translate('text_6657be42151661006d2f3b89')}
                </Typography>
                <Typography variant="caption">
                  {translate('text_1741103892833plsi99wvuop')}
                </Typography>
              </div>

              <AmountInputField
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
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
                label={translate('text_62d18855b22699e5cf55f88d')}
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
                  {translate('text_17411038928333ksu96fbmam', {
                    totalCreditCount:
                      Math.round(
                        Number(formikProps.values.paidCredits || 0) * 100 +
                          Number(formikProps.values.grantedCredits || 0) * 100,
                      ) / 100,
                  })}
                </Typography>
              </Alert>
            </section>
          </CenteredPage.Container>
        )}
      </CenteredPage.Wrapper>

      <CenteredPage.StickyFooter>
        <Button size="large" variant="quaternary" onClick={onAbort}>
          {translate('text_62e79671d23ae6ff149de968')}
        </Button>
        <Button
          size="large"
          variant="primary"
          disabled={!formikProps.isValid || !formikProps.dirty}
          onClick={() => formikProps.handleSubmit()}
          data-test="submit-wallet"
        >
          {translate('text_1741103892833yi7redcuhoc')}
        </Button>
      </CenteredPage.StickyFooter>

      <WarningDialog
        ref={warningDialogRef}
        title={translate('text_665deda4babaf700d603ea13')}
        description={translate('text_665dedd557dc3c00c62eb83d')}
        continueText={translate('text_645388d5bdbd7b00abffa033')}
        onContinue={() => navigateToCustomerWalletTab()}
      />
    </>
  )
}

export default CreateWalletTopUp
