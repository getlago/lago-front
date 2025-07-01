import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { FC, useEffect } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import { object, string } from 'yup'

import { Button, Typography } from '~/components/designSystem'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_DETAILS_ROUTE, ERROR_404_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { Locale, LocaleEnum } from '~/core/translations'
import {
  CurrencyEnum,
  CustomerForDunningEmailFragmentDoc,
  CustomerForRequestOverduePaymentFormFragmentDoc,
  InvoicesForDunningEmailFragmentDoc,
  InvoicesForRequestOverduePaymentFormFragmentDoc,
  LagoApiError,
  LastPaymentRequestFragmentDoc,
  OrganizationForDunningEmailFragmentDoc,
  useCreatePaymentRequestMutation,
  useGetRequestOverduePaymentInfosQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { EmailPreview } from '~/pages/CustomerRequestOverduePayment/components/EmailPreview'
import { PageHeader } from '~/styles'

import { FreemiumAlert } from './components/FreemiumAlert'
import {
  CustomerRequestOverduePaymentForm,
  RequestPaymentForm,
} from './components/RequestPaymentForm'

gql`
  query getRequestOverduePaymentInfos($id: ID!) {
    organization {
      defaultCurrency
      ...OrganizationForDunningEmail
    }

    customer(id: $id) {
      externalId
      currency
      ...CustomerForRequestOverduePaymentForm
      ...CustomerForDunningEmail
    }

    paymentRequests {
      collection {
        ...LastPaymentRequest
      }
    }

    invoices(paymentOverdue:true, customerId: $id) {
      collection {
        ...InvoicesForDunningEmail
        ...InvoicesForRequestOverduePaymentForm
      }
    }

    ${CustomerForDunningEmailFragmentDoc}
    ${InvoicesForDunningEmailFragmentDoc}
    ${OrganizationForDunningEmailFragmentDoc}
    ${CustomerForRequestOverduePaymentFormFragmentDoc}
    ${InvoicesForRequestOverduePaymentFormFragmentDoc}
    ${LastPaymentRequestFragmentDoc}
  }

  mutation createPaymentRequest($input: PaymentRequestCreateInput!) {
    createPaymentRequest(input: $input) {
      id
    }
  }
`

const CustomerRequestOverduePayment: FC = () => {
  const { translate } = useInternationalization()
  const { customerId } = useParams()
  const navigate = useNavigate()
  const { isPremium } = useCurrentUser()

  const {
    data: { customer, organization, paymentRequests, invoices } = {},
    loading,
    error,
  } = useGetRequestOverduePaymentInfosQuery({
    variables: { id: customerId ?? '' },
  })

  const hasDunningIntegration = !!isPremium

  const [paymentRequest, paymentRequestStatus] = useCreatePaymentRequestMutation({
    refetchQueries: ['getCustomerOverdueBalances'],
    context: {
      silentErrorCodes: [LagoApiError.InvoicesNotOverdue],
    },
    onCompleted() {
      addToast({
        severity: 'success',
        translateKey: 'text_66b9e095a7dc6c6d3dabeed4',
      })

      navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { customerId: customerId ?? '' }))
    },
    onError(mutationError) {
      if (hasDefinedGQLError('InvoicesNotOverdue', mutationError)) {
        addToast({
          severity: 'danger',
          translateKey: 'text_17254494987274bsus9jsnb5',
        })
        paymentRequestStatus.client.refetchQueries({ include: ['getRequestOverduePaymentInfos'] })
      }
    },
  })

  const documentLocale =
    (customer?.billingConfiguration?.documentLocale as Locale) ||
    (organization?.billingConfiguration?.documentLocale as Locale) ||
    'en'

  const formikProps = useFormik<CustomerRequestOverduePaymentForm>({
    initialValues: {
      emails: customer?.email || '',
    },
    validationSchema: object({
      emails: string().required('').emails('text_66b258f62100490d0eb5ca8b'),
    }),
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (!hasDunningIntegration) {
        return
      }

      await paymentRequest({
        variables: {
          input: {
            externalCustomerId: customer?.externalId ?? '',
            email: values.emails.replaceAll(' ', ''),
            lagoInvoiceIds: invoices?.collection?.map((invoice) => invoice.id),
          },
        },
      })
    },
  })

  const defaultCurrency = customer?.currency || organization?.defaultCurrency || CurrencyEnum.Usd
  const invoicesCollection = invoices?.collection ?? []
  const totalAmount = invoicesCollection.reduce(
    (acc, { totalDueAmountCents, currency }) =>
      acc + deserializeAmount(totalDueAmountCents, currency || defaultCurrency),
    0,
  )
  const totalInvoices = invoicesCollection.length

  useEffect(
    () => {
      if (hasDefinedGQLError('NotFound', error, 'customer')) {
        navigate(ERROR_404_ROUTE)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [error],
  )

  useEffect(
    () => {
      if (loading === false && totalAmount <= 0) {
        navigate(ERROR_404_ROUTE)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, totalAmount],
  )

  return (
    <>
      <PageHeader.Wrapper>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate(
            'text_66b258f62100490d0eb5ca73',
            {
              amount: intlFormatNumber(totalAmount, {
                currency: defaultCurrency,
                currencyDisplay: 'narrowSymbol',
              }),
              count: totalInvoices,
            },
            totalInvoices,
          )}
        </Typography>

        <Button
          variant="quaternary"
          icon="close"
          onClick={() =>
            navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { customerId: customerId ?? '' }))
          }
        />
      </PageHeader.Wrapper>

      <main className="height-minus-nav-footer overflow-auto md:height-minus-nav md:flex md:overflow-auto">
        <section className="bg-white md:height-minus-nav-footer md:shrink md:grow md:basis-1/2 md:overflow-auto">
          {!hasDunningIntegration && <FreemiumAlert />}
          <div className="px-4 py-12 md:px-12">
            <RequestPaymentForm
              invoicesLoading={loading}
              formikProps={formikProps}
              overdueAmount={totalAmount}
              currency={defaultCurrency}
              invoices={invoicesCollection}
              lastSentDate={paymentRequests?.collection?.[0]}
            />
          </div>
        </section>
        <section className="bg-grey-100 md:shrink md:grow md:basis-1/2 md:overflow-auto md:shadow-l">
          <div className="px-4 py-12 md:px-12">
            <EmailPreview
              isLoading={loading}
              locale={LocaleEnum[documentLocale]}
              customer={customer ?? undefined}
              organization={organization ?? undefined}
              overdueAmount={totalAmount}
              currency={defaultCurrency}
              invoices={invoicesCollection}
            />
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 z-navBar h-footer w-full bg-white shadow-t md:w-1/2">
        <div className="flex h-full items-center justify-end gap-3 px-4 md:px-12">
          <Button
            variant="quaternary"
            size="large"
            onClick={() =>
              navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { customerId: customerId ?? '' }))
            }
          >
            {translate('text_6411e6b530cb47007488b027')}
          </Button>
          <Button
            variant="primary"
            size="large"
            onClick={formikProps.submitForm}
            disabled={!hasDunningIntegration || totalAmount === 0 || !formikProps.isValid}
          >
            {translate('text_66b258f62100490d0eb5caa2')}
          </Button>
        </div>
      </footer>
    </>
  )
}

export default CustomerRequestOverduePayment
