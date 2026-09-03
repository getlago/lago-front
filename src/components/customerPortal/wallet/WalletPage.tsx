import { gql } from '@apollo/client'
import InputAdornment from '@mui/material/InputAdornment'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { useParams } from 'react-router-dom'

import useCustomerPortalNavigation from '~/components/customerPortal/common/hooks/useCustomerPortalNavigation'
import PageTitle from '~/components/customerPortal/common/PageTitle'
import SectionError from '~/components/customerPortal/common/SectionError'
import { LoaderWalletPage } from '~/components/customerPortal/common/SectionLoading'
import useCustomerPortalTranslate from '~/components/customerPortal/common/useCustomerPortalTranslate'
import { Alert } from '~/components/designSystem/Alert'
import { Typography } from '~/components/designSystem/Typography'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  useCustomerPortalWalletQuery,
  useTopUpPortalWalletMutation,
} from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { topUpAmountError } from '~/pages/wallet/form'

import { walletPageTopUpDefaultValues, walletPageTopUpValidationSchema } from './validationSchema'

gql`
  query customerPortalWallet($id: ID!) {
    customerPortalWallet(id: $id) {
      id
      currency
      name
      rateAmount
      paidTopUpMinAmountCents
      paidTopUpMaxAmountCents
    }
  }

  mutation TopUpPortalWallet($input: CreateCustomerPortalWalletTransactionInput!) {
    createCustomerPortalWalletTransaction(input: $input) {
      collection {
        id
      }
    }
  }
`

const WalletPage = () => {
  const { walletId = '' } = useParams()
  const { goHome } = useCustomerPortalNavigation()
  const { translate, documentLocale } = useCustomerPortalTranslate()

  const {
    data: customerWalletData,
    loading: customerWalletLoading,
    error: customerWalletError,
    refetch: customerWalletRefetch,
  } = useCustomerPortalWalletQuery({
    variables: {
      id: walletId,
    },
  })

  const wallet = customerWalletData?.customerPortalWallet

  const [topUpPortalWallet, { loading: loadingTopUpPortalWallet, error: errorTopUpPortalWallet }] =
    useTopUpPortalWalletMutation({
      onCompleted(res) {
        if (res) {
          form.reset()

          goHome?.()
        }
      },
    })

  const form = useAppForm({
    defaultValues: walletPageTopUpDefaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: walletPageTopUpValidationSchema,
    },
    onSubmit: async ({ value }) => {
      if (!wallet?.id) return

      await topUpPortalWallet({
        variables: {
          input: {
            walletId: wallet?.id,
            paidCredits: String(value.amount),
          },
        },
      })
    },
  })

  const amount = useStore(form.store, (state) => state.values.amount)

  const isError = !customerWalletLoading && customerWalletError

  const paidTopUpMinAmountCents = wallet?.paidTopUpMinAmountCents
    ? deserializeAmount(wallet?.paidTopUpMinAmountCents, wallet?.currency)?.toString()
    : undefined

  const paidTopUpMaxAmountCents = wallet?.paidTopUpMaxAmountCents
    ? deserializeAmount(wallet?.paidTopUpMaxAmountCents, wallet?.currency)?.toString()
    : undefined

  const paidCreditsError = topUpAmountError({
    rateAmount: wallet?.rateAmount?.toString(),
    paidCredits: amount === '' ? undefined : String(amount),
    paidTopUpMinAmountCents,
    paidTopUpMaxAmountCents,
    currency: wallet?.currency,
    translate,
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    form.handleSubmit()
  }

  if (isError) {
    return (
      <div>
        <PageTitle title={translate('text_1728498418253nyv3qmz9k5k')} goHome={goHome} />

        <SectionError refresh={() => customerWalletRefetch()} />
      </div>
    )
  }

  return (
    <div>
      <PageTitle title={translate('text_1728498418253nyv3qmz9k5k')} goHome={goHome} />

      {customerWalletLoading && <LoaderWalletPage />}

      {!customerWalletLoading && (
        <form onSubmit={handleSubmit}>
          <form.AppField name="amount">
            {(field) => (
              <field.AmountInputField
                displayErrorText={false}
                beforeChangeFormatter={['positiveNumber']}
                helperText={
                  <Typography variant="body" color="grey600" className="mt-1">
                    {translate('text_17279456600803f8on7ku8jo', {
                      credits: intlFormatNumber(
                        Number(amount || 0) * Number(wallet?.rateAmount || 0),
                        {
                          currencyDisplay: 'narrowSymbol',
                          currency: wallet?.currency,
                          locale: documentLocale,
                        },
                      ),
                    })}
                  </Typography>
                }
                label={translate('text_1728377307160d96z1skvnw3')}
                currency={wallet?.currency || CurrencyEnum.Usd}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {translate('text_1728377307160iloscj20uc1')}
                    </InputAdornment>
                  ),
                }}
                errorOverride={paidCreditsError?.label}
              />
            )}
          </form.AppField>

          {errorTopUpPortalWallet && (
            <Alert className="mt-8" type="danger" data-test="error-alert">
              <Typography>{translate('text_1728377307160tb09yisgxk9')}</Typography>
            </Alert>
          )}

          <div className="mt-8 flex justify-end">
            <form.AppForm>
              <form.SubmitButton
                disabled={loadingTopUpPortalWallet || !!paidCreditsError?.error}
                size="medium"
              >
                {translate('text_1728377307160e831fr4ydtn')}
              </form.SubmitButton>
            </form.AppForm>
          </div>
        </form>
      )}
    </div>
  )
}

export default WalletPage
