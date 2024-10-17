import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { FC, useEffect } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
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
import {
  serializeEmails,
  validateEmails,
} from '~/pages/CustomerRequestOverduePayment/validateEmails'
import { NAV_HEIGHT, PageHeader, theme } from '~/styles'

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

const FOOTER_HEIGHT = 80

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
      emails: string()
        .required('')
        .test('valid-emails', 'text_66b258f62100490d0eb5ca8b', (value) => validateEmails(value)),
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
            email: serializeEmails(values.emails),
            lagoInvoiceIds: invoices?.collection?.map((invoice) => invoice.id),
          },
        },
      })
    },
  })

  const defaultCurrency = customer?.currency || organization?.defaultCurrency || CurrencyEnum.Usd
  const invoicesCollection = invoices?.collection ?? []
  const totalAmount = invoicesCollection.reduce(
    (acc, { totalAmountCents, currency }) =>
      acc + deserializeAmount(totalAmountCents, currency || defaultCurrency),
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
      <PageHeader>
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
      </PageHeader>

      <Main>
        <LeftSection>
          {!hasDunningIntegration && <FreemiumAlert />}
          <Wrapper>
            <RequestPaymentForm
              invoicesLoading={loading}
              formikProps={formikProps}
              overdueAmount={totalAmount}
              currency={defaultCurrency}
              invoices={invoicesCollection}
              lastSentDate={paymentRequests?.collection?.[0]}
            />
          </Wrapper>
        </LeftSection>
        <RightSection>
          <Wrapper>
            <EmailPreview
              isLoading={loading}
              locale={LocaleEnum[documentLocale]}
              customer={customer ?? undefined}
              organization={organization ?? undefined}
              overdueAmount={totalAmount}
              currency={defaultCurrency}
              invoices={invoicesCollection}
            />
          </Wrapper>
        </RightSection>
      </Main>

      <PageFooter>
        <PageFooterWrapper>
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
        </PageFooterWrapper>
      </PageFooter>
    </>
  )
}

export default CustomerRequestOverduePayment

const Main = styled.main`
  height: calc(100vh - ${NAV_HEIGHT}px - ${FOOTER_HEIGHT}px);
  overflow-y: auto;

  ${theme.breakpoints.up('lg')} {
    height: calc(100vh - ${NAV_HEIGHT}px);
    display: flex;
    overflow-y: unset;
  }
`

const Section = styled.section`
  ${theme.breakpoints.up('lg')} {
    flex: 1 1 50%;
    overflow-y: auto;
  }
`

const LeftSection = styled(Section)`
  background-color: ${theme.palette.background.paper};

  ${theme.breakpoints.up('lg')} {
    height: calc(100vh - ${NAV_HEIGHT}px - ${FOOTER_HEIGHT}px);
  }
`

const RightSection = styled(Section)`
  background-color: ${theme.palette.grey[100]};
  box-shadow: ${theme.shadows[8]};
`

const Wrapper = styled.div`
  padding: ${theme.spacing(12)} ${theme.spacing(4)};

  ${theme.breakpoints.up('lg')} {
    padding: ${theme.spacing(12)};
  }
`

const PageFooter = styled.footer`
  position: fixed;
  bottom: 0;
  width: 100%;
  background-color: ${theme.palette.background.paper};
  box-shadow: ${theme.shadows[5]};
  height: ${FOOTER_HEIGHT}px;
  z-index: ${theme.zIndex.appBar};

  ${theme.breakpoints.up('lg')} {
    width: 50%;
  }
`

const PageFooterWrapper = styled.div`
  height: 100%;
  display: flex;
  gap: ${theme.spacing(3)};
  align-items: center;
  justify-content: flex-end;
  box-sizing: initial;

  padding: 0 ${theme.spacing(4)};

  ${theme.breakpoints.up('lg')} {
    max-width: 584px;
    padding: 0 ${theme.spacing(12)};
  }
`
