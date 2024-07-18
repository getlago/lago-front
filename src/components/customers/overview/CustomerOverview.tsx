import { gql } from '@apollo/client'
import { Skeleton, Stack } from '@mui/material'
import { FC, useEffect } from 'react'

import { CustomerSubscriptionsList } from '~/components/customers/subscriptions/CustomerSubscriptionsList'
import { Alert, Button, Typography } from '~/components/designSystem'
import { OverviewCard } from '~/components/OverviewCard'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  TimezoneEnum,
  useGetCustomerGrossRevenuesLazyQuery,
  useGetCustomerOverdueBalancesLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { SectionHeader } from '~/styles/customer'

gql`
  query getCustomerGrossRevenues(
    $externalCustomerId: String!
    $currency: CurrencyEnum
    $expireCache: Boolean
  ) {
    grossRevenues(
      externalCustomerId: $externalCustomerId
      currency: $currency
      expireCache: $expireCache
    ) {
      collection {
        amountCents
        currency
        invoicesCount
        month
      }
    }
  }

  query getCustomerOverdueBalances(
    $externalCustomerId: String!
    $currency: CurrencyEnum
    $months: Int!
    $expireCache: Boolean
  ) {
    overdueBalances(
      externalCustomerId: $externalCustomerId
      currency: $currency
      months: $months
      expireCache: $expireCache
    ) {
      collection {
        amountCents
        currency
        lagoInvoiceIds
      }
    }
  }
`

interface CustomerOverviewProps {
  externalCustomerId?: string
  customerTimezone?: TimezoneEnum
  userCurrency?: CurrencyEnum
}

export const CustomerOverview: FC<CustomerOverviewProps> = ({
  externalCustomerId,
  customerTimezone,
  userCurrency = CurrencyEnum.Usd,
}) => {
  const { translate } = useInternationalization()
  const [getGrossRevenues, { data: grossData, error: grossError, loading: grossLoading }] =
    useGetCustomerGrossRevenuesLazyQuery({
      variables: {
        externalCustomerId: externalCustomerId || '',
        currency: userCurrency,
        expireCache: true,
      },
    })
  const [getOverdueBalances, { data: overdueData, error: overdueError, loading: overdueLoading }] =
    useGetCustomerOverdueBalancesLazyQuery({
      variables: {
        externalCustomerId: externalCustomerId || '',
        currency: userCurrency,
        months: 12,
        expireCache: true,
      },
    })

  useEffect(() => {
    if (!externalCustomerId) return

    getGrossRevenues()
    getOverdueBalances()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalCustomerId])

  const hasAnyError = grossError || overdueError

  const grossRevenues = (grossData?.grossRevenues.collection || []).reduce(
    (acc, revenue) => {
      return {
        amountCents: acc.amountCents + deserializeAmount(revenue.amountCents, userCurrency),
        invoicesCount: acc.invoicesCount + Number(revenue.invoicesCount),
      }
    },
    { amountCents: 0, invoicesCount: 0 },
  )

  const overdueBalances = overdueData?.overdueBalances.collection || []
  const overdueFormattedData = overdueBalances.reduce<{
    amountCents: number
    invoiceCount: number
  }>(
    (acc, { amountCents, lagoInvoiceIds }) => {
      return {
        amountCents: acc.amountCents + deserializeAmount(amountCents, userCurrency),
        invoiceCount: acc.invoiceCount + lagoInvoiceIds.length,
      }
    },
    {
      amountCents: 0,
      invoiceCount: 0,
    },
  )
  const hasOverdueInvoices = overdueFormattedData.invoiceCount > 0

  return (
    <>
      {!hasAnyError && (
        <section>
          <SectionHeader variant="subhead" $hideBottomShadow>
            {translate('text_6670a7222702d70114cc7954')}

            <Button
              data-test="add-subscription"
              variant="quaternary"
              onClick={() => {
                getGrossRevenues()
                getOverdueBalances()
              }}
            >
              {translate('text_6670a7222702d70114cc7953')}
            </Button>
          </SectionHeader>
          <Stack gap={4}>
            {hasOverdueInvoices && !overdueError && (
              <Alert type="warning">
                <Stack flexDirection="row" gap={4} alignItems="center">
                  {overdueLoading ? (
                    <Stack flexDirection="column" gap={1}>
                      <Skeleton variant="text" width={150} />
                      <Skeleton variant="text" width={80} />
                    </Stack>
                  ) : (
                    <Stack flexDirection="column" gap={1}>
                      <Typography variant="bodyHl" color="textSecondary">
                        {translate(
                          'text_6670a7222702d70114cc7955',
                          {
                            count: overdueFormattedData.invoiceCount,
                            amount: intlFormatNumber(overdueFormattedData.amountCents, {
                              currencyDisplay: 'symbol',
                              currency: userCurrency,
                            }),
                          },
                          overdueFormattedData.invoiceCount,
                        )}
                      </Typography>
                      <Typography variant="caption">
                        {translate('text_6670a2a7ae3562006c4ee3db')}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Alert>
            )}
            <Stack flexDirection="row" gap={4}>
              {!grossError && (
                <OverviewCard
                  isLoading={grossLoading}
                  title={translate('text_6553885df387fd0097fd7385')}
                  tooltipContent={translate('text_65564e8e4af2340050d431bf')}
                  content={intlFormatNumber(grossRevenues.amountCents, {
                    currencyDisplay: 'symbol',
                    currency: userCurrency,
                  })}
                  caption={translate(
                    'text_6670a7222702d70114cc795c',
                    { count: grossRevenues.invoicesCount },
                    grossRevenues.invoicesCount,
                  )}
                />
              )}
              {!overdueError && (
                <OverviewCard
                  isLoading={overdueLoading}
                  title={translate('text_6670a7222702d70114cc795a')}
                  tooltipContent={translate('text_6670a2a7ae3562006c4ee3e7')}
                  content={intlFormatNumber(overdueFormattedData.amountCents, {
                    currencyDisplay: 'symbol',
                    currency: userCurrency,
                  })}
                  caption={translate(
                    'text_6670a7222702d70114cc795c',
                    { count: overdueFormattedData.invoiceCount },
                    overdueFormattedData.invoiceCount,
                  )}
                  isAccentContent={hasOverdueInvoices}
                />
              )}
            </Stack>
          </Stack>
        </section>
      )}
      <CustomerSubscriptionsList customerTimezone={customerTimezone} />
    </>
  )
}
