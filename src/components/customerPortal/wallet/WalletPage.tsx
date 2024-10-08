import { gql } from '@apollo/client'
import InputAdornment from '@mui/material/InputAdornment/InputAdornment'
import { useFormik } from 'formik'
import { number, object } from 'yup'

import PageTitle from '~/components/customerPortal/common/PageTitle'
import SectionError from '~/components/customerPortal/common/SectionError'
import { Alert, Button } from '~/components/designSystem'
import { AmountInputField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
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
}

const WalletPage = ({ goHome }: WalletPageProps) => {
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

          addToast({
            severity: 'success',
            translateKey: 'text_17283773071607bl03l6kl4n',
          })
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

  if (customerWalletError) {
    return (
      <div>
        <PageTitle title={translate('text_1728377307159q3otzyv9tey')} goHome={goHome} />

        <SectionError refresh={customerWalletRefetch} />
      </div>
    )
  }

  const submitButtonDisabled =
    !formikProps?.values?.amount || loadingTopUpPortalWallet || formikProps?.values?.amount <= 0

  return (
    <div>
      <PageTitle title={translate('text_1728377307159q3otzyv9tey')} goHome={goHome} />

      {customerWalletLoading && <div>Loading..</div>}

      {!customerWalletLoading && (
        <div className="mt-10">
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

          <div className="flex justify-end">
            <Button
              className="mt-8"
              disabled={submitButtonDisabled}
              loading={loadingTopUpPortalWallet}
              size="large"
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
