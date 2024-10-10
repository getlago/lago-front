import { gql } from '@apollo/client'
import InputAdornment from '@mui/material/InputAdornment/InputAdornment'
import { useFormik } from 'formik'
import { number, object } from 'yup'

import PageTitle from '~/components/customerPortal/common/PageTitle'
import SectionError from '~/components/customerPortal/common/SectionError'
import { LoaderWalletPage } from '~/components/customerPortal/common/SectionLoading'
import { Alert, Button } from '~/components/designSystem'
import { AmountInputField } from '~/components/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  CurrencyEnum,
  useGetPortalWalletsQuery,
  useTopUpPortalWalletMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation TopUpPortalWallet($input: CreateCustomerPortalWalletTransactionInput!) {
    createCustomerPortalWalletTransaction(input: $input) {
      collection {
        id
      }
    }
  }
`

type WalletPageProps = {
  goHome: () => void
  onSuccess?: () => void
}

const WalletPage = ({ goHome, onSuccess }: WalletPageProps) => {
  const { translate } = useInternationalization()

  const {
    data: customerWalletData,
    loading: customerWalletLoading,
    error: customerWalletError,
    refetch: customerWalletRefetch,
  } = useGetPortalWalletsQuery()

  const [topUpPortalWallet, { loading: loadingTopUpPortalWallet, error: errorTopUpPortalWallet }] =
    useTopUpPortalWalletMutation({
      onCompleted(res) {
        if (res) {
          formikProps.resetForm()

          onSuccess?.()
        }
      },
    })

  const wallet = customerWalletData?.customerPortalWallets?.collection?.[0]

  const formikProps = useFormik({
    initialValues: {
      amount: undefined,
    },
    validationSchema: object().shape({
      amount: number().required(''),
    }),
    onSubmit: async ({ amount }) => {
      if (!wallet?.id) return

      topUpPortalWallet({
        variables: {
          input: {
            walletId: wallet?.id,
            paidCredits: amount,
          },
        },
      })
    },
  })

  const submitButtonDisabled =
    !formikProps?.values?.amount || loadingTopUpPortalWallet || formikProps?.values?.amount <= 0

  const isLoading = customerWalletLoading
  const isError = !isLoading && customerWalletError

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

      {isLoading && <LoaderWalletPage />}

      {!isLoading && (
        <div>
          <AmountInputField
            name="amount"
            displayErrorText={false}
            beforeChangeFormatter={['positiveNumber']}
            helperText={translate('text_17279456600803f8on7ku8jo', {
              credits: intlFormatNumber(
                Number(formikProps?.values?.amount || 0) * Number(wallet?.rateAmount || 0),
                {
                  currencyDisplay: 'symbol',
                  currency: wallet?.currency,
                },
              ),
            })}
            label={translate('text_1728377307160d96z1skvnw3')}
            currency={CurrencyEnum.Usd}
            formikProps={formikProps}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {translate('text_1728377307160iloscj20uc1')}
                </InputAdornment>
              ),
            }}
          />

          {errorTopUpPortalWallet && (
            <Alert className="mt-8" type="danger" data-test="error-alert">
              <span>{translate('text_1728377307160tb09yisgxk9')}</span>
            </Alert>
          )}

          <div className="mt-8 flex justify-end">
            <Button
              disabled={submitButtonDisabled}
              loading={loadingTopUpPortalWallet}
              size="medium"
              onClick={formikProps.submitForm}
            >
              {translate('text_1728377307160e831fr4ydtn')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default WalletPage
