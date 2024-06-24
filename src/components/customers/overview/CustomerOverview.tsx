import { gql } from '@apollo/client'
import { Skeleton, Stack } from '@mui/material'
import { DateTime } from 'luxon'
import { FC } from 'react'

import { CustomerSubscriptionsList } from '~/components/customers/subscriptions/CustomerSubscriptionsList'
import { Alert, Button, Typography } from '~/components/designSystem'
import { OverviewCard } from '~/components/OverviewCard'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  TimezoneEnum,
  useGetCustomerGrossRevenuesQuery,
  useGetCustomerOverdueBalancesQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { SectionHeader } from '~/styles/customer'

gql`
  query getCustomerGrossRevenues($externalCustomerId: String!, $currency: CurrencyEnum) {
    grossRevenues(externalCustomerId: $externalCustomerId, currency: $currency) {
      collection {
        amountCents
        currency
        invoicesCount
        month
      }
    }
  }

  query getCustomerOverdueBalances($externalCustomerId: String!, $currency: CurrencyEnum) {
    overdueBalances(externalCustomerId: $externalCustomerId, currency: $currency) {
      collection {
        amountCents
        currency
        lagoInvoiceIds
      }
    }
  }
`

const getCurrentMonthISODate = () => {
  const now = DateTime.now()

  return DateTime.local(now.year, now.month, 1).toISODate()
}

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
  const {
    data: grossData,
    error: grossError,
    loading: grossLoading,
  } = useGetCustomerGrossRevenuesQuery({
    variables: {
      externalCustomerId: externalCustomerId || '',
      currency: userCurrency,
    },
    skip: !externalCustomerId,
  })
  const {
    data: overdueData,
    error: overdueError,
    loading: overdueLoading,
  } = useGetCustomerOverdueBalancesQuery({
    variables: {
      externalCustomerId: externalCustomerId || '',
      currency: userCurrency,
    },
    skip: !externalCustomerId,
  })

  const hasAnyError = grossError || overdueError

  const grossRevenues = grossData?.grossRevenues.collection.find((revenue) => {
    return DateTime.fromISO(revenue.month).toISODate() === getCurrentMonthISODate()
  })

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
              onClick={() => location.reload()}
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
                  content={intlFormatNumber(
                    deserializeAmount(grossRevenues?.amountCents, userCurrency),
                    {
                      currencyDisplay: 'symbol',
                      currency: userCurrency,
                    },
                  )}
                  caption={translate(
                    'text_6670a7222702d70114cc795c',
                    { count: grossRevenues?.invoicesCount },
                    grossRevenues?.invoicesCount,
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
