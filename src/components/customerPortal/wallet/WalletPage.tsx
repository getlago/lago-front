import { gql } from '@apollo/client'
import InputAdornment from '@mui/material/InputAdornment/InputAdornment'
import { useFormik } from 'formik'
import { number, object } from 'yup'

import PageTitle from '~/components/customerPortal/common/PageTitle'
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
  } = useGetPortalWalletsQuery()

  const [topUpPortalWallet, { loading: loadingTopUpPortalWallet, error: errorTopUpPortalWallet }] =
    useTopUpPortalWalletMutation({
      onCompleted(res) {
        if (res) {
          addToast({
            severity: 'success',
            translateKey: 'TODO: Success',
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
    return <div>Error</div>
  }

  return (
    <div>
      <PageTitle title={translate('TODO: Wallet')} goHome={goHome} />

      {customerWalletLoading && <div>Loading..</div>}

      {!customerWalletLoading && (
        <div className="mt-10">
          <AmountInputField
            name="amount"
            helperText={translate('text_17279456600803f8on7ku8jo', {
              credits: intlFormatNumber(
                Number(formikProps?.values?.amount || 0) * Number(wallet?.rateAmount || 0),
                {
                  currencyDisplay: 'symbol',
                  currency: wallet?.currency,
                },
              ),
            })}
            label={translate('TODO: Credits to purchase')}
            currency={CurrencyEnum.Usd}
            formikProps={formikProps}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">{translate('TODO: credits')}</InputAdornment>
              ),
            }}
          />

          {errorTopUpPortalWallet && (
            <Alert className="mt-8" type="danger" data-test="error-alert">
              <span>{translate('TODO: Something went wrong, please try again')}</span>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button
              className="mt-8"
              disabled={!formikProps?.values?.amount || loadingTopUpPortalWallet}
              loading={loadingTopUpPortalWallet}
              size="large"
              onClick={formikProps.submitForm}
            >
              {translate('TODO: Top up credits')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default WalletPage
