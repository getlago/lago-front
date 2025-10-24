import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { Skeleton } from 'lago-design-system'
import { DateTime } from 'luxon'
import { FC, useEffect, useMemo } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { Alert, Typography } from '~/components/designSystem'
import { PageSectionTitle } from '~/components/layouts/Section'
import { OverviewCard } from '~/components/OverviewCard'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_REQUEST_OVERDUE_PAYMENT_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { isSameDay, TimeFormat } from '~/core/timezone'
import { LocaleEnum } from '~/core/translations'
import {
  CurrencyEnum,
  useGetCustomerGrossRevenuesLazyQuery,
  useGetCustomerOverdueBalancesLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'

gql`
  query getCustomerOverdueBalances(
    $externalCustomerId: String!
    $currency: CurrencyEnum
    $expireCache: Boolean
  ) {
    paymentRequests(externalCustomerId: $externalCustomerId) {
      collection {
        createdAt
      }
    }

    overdueBalances(
      externalCustomerId: $externalCustomerId
      currency: $currency
      expireCache: $expireCache
    ) {
      collection {
        amountCents
        currency
        lagoInvoiceIds
      }
    }
  }

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
`

interface CustomerOverviewProps {
  externalCustomerId?: string
  userCurrency?: CurrencyEnum
}

export const CustomerOverview: FC<CustomerOverviewProps> = ({
  externalCustomerId,
  userCurrency,
}) => {
  const { translate } = useInternationalization()
  const { organization, intlFormatDateTimeOrgaTZ } = useOrganizationInfos()
  const { customerId } = useParams()
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()

  const currency = userCurrency ?? organization?.defaultCurrency ?? CurrencyEnum.Usd

  const [
    getCustomerOverdueBalances,
    { data: overdueBalancesData, loading: overdueBalancesLoading, error: overdueBalancesError },
  ] = useGetCustomerOverdueBalancesLazyQuery({
    variables: {
      externalCustomerId: externalCustomerId || '',
      currency,
    },
  })
  const [
    getCustomerGrossRevenues,
    { data: grossRevenuesData, loading: grossRevenuesLoading, error: grossRevenuesError },
  ] = useGetCustomerGrossRevenuesLazyQuery({
    variables: {
      externalCustomerId: externalCustomerId || '',
      currency,
    },
  })

  const refreshOverdueBalances = () =>
    getCustomerOverdueBalances({
      variables: {
        expireCache: true,
        externalCustomerId: externalCustomerId || '',
        currency,
      },
    })

  useEffect(() => {
    if (!externalCustomerId) return

    if (hasPermissions(['analyticsOverdueBalancesView'])) {
      getCustomerOverdueBalances()
    }

    if (hasPermissions(['analyticsView'])) {
      getCustomerGrossRevenues()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalCustomerId])

  const grossRevenues = (grossRevenuesData?.grossRevenues.collection || []).reduce(
    (acc, revenue) => {
      return {
        amountCents: acc.amountCents + deserializeAmount(revenue.amountCents, currency),
        invoicesCount: acc.invoicesCount + Number(revenue.invoicesCount),
      }
    },
    { amountCents: 0, invoicesCount: 0 },
  )

  const overdueBalances = overdueBalancesData?.overdueBalances.collection || []
  const overdueFormattedData = overdueBalances.reduce<{
    amountCents: number
    invoiceCount: number
  }>(
    (acc, { amountCents, lagoInvoiceIds }) => {
      return {
        amountCents: acc.amountCents + deserializeAmount(amountCents, currency),
        invoiceCount: acc.invoiceCount + lagoInvoiceIds.length,
      }
    },
    {
      amountCents: 0,
      invoiceCount: 0,
    },
  )
  const hasOverdueInvoices = overdueFormattedData.invoiceCount > 0

  const today = useMemo(() => DateTime.now().toUTC(), [])
  const lastPaymentRequestDate = useMemo(
    () => DateTime.fromISO(overdueBalancesData?.paymentRequests.collection[0]?.createdAt).toUTC(),
    [overdueBalancesData?.paymentRequests],
  )
  const hasMadePaymentRequestToday = isSameDay(lastPaymentRequestDate, today)

  return (
    <div className="flex flex-col gap-12">
      {(!overdueBalancesError || !grossRevenuesError) && (
        <section>
          <PageSectionTitle
            title={translate('text_6670a7222702d70114cc7954')}
            subtitle={translate('text_1737649151689ldyvwtq9ov1')}
          />

          <Stack gap={4}>
            {hasOverdueInvoices && !overdueBalancesError && (
              <Alert
                type="warning"
                ButtonProps={
                  !overdueBalancesLoading
                    ? {
                        label: translate('text_66b258f62100490d0eb5caa2'),
                        onClick: () =>
                          navigate(
                            generatePath(CUSTOMER_REQUEST_OVERDUE_PAYMENT_ROUTE, {
                              customerId: customerId ?? '',
                            }),
                          ),
                      }
                    : undefined
                }
              >
                {overdueBalancesLoading ? (
                  <Stack flexDirection="column" gap={1}>
                    <Skeleton variant="text" className="w-37" />
                    <Skeleton variant="text" className="w-20" />
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
                            currency,
                          }),
                        },
                        overdueFormattedData.invoiceCount,
                      )}
                    </Typography>
                    <Typography variant="caption">
                      {hasMadePaymentRequestToday
                        ? translate('text_66b4f00bd67ccc185ea75c70', {
                            relativeDay: lastPaymentRequestDate.toRelativeCalendar({
                              locale: LocaleEnum.en,
                            }),
                            time: overdueBalancesData?.paymentRequests.collection[0]?.createdAt
                              ? intlFormatDateTimeOrgaTZ(
                                  overdueBalancesData?.paymentRequests.collection[0]?.createdAt,
                                  {
                                    formatTime: TimeFormat.TIME_24_WITH_SECONDS,
                                  },
                                ).time
                              : '-',
                          })
                        : translate('text_6670a2a7ae3562006c4ee3db')}
                    </Typography>
                  </Stack>
                )}
              </Alert>
            )}
            <Stack flexDirection="row" gap={4}>
              {hasPermissions(['analyticsView']) && !grossRevenuesError && (
                <OverviewCard
                  isLoading={grossRevenuesLoading}
                  title={translate('text_6553885df387fd0097fd7385')}
                  tooltipContent={translate('text_65564e8e4af2340050d431bf')}
                  content={intlFormatNumber(grossRevenues.amountCents, {
                    currencyDisplay: 'symbol',
                    currency,
                  })}
                  caption={translate(
                    'text_6670a7222702d70114cc795c',
                    { count: grossRevenues.invoicesCount },
                    grossRevenues.invoicesCount,
                  )}
                />
              )}
              {hasPermissions(['analyticsOverdueBalancesView']) && !overdueBalancesError && (
                <OverviewCard
                  isLoading={overdueBalancesLoading}
                  title={translate('text_6670a7222702d70114cc795a')}
                  tooltipContent={translate('text_6670a2a7ae3562006c4ee3e7')}
                  content={intlFormatNumber(overdueFormattedData.amountCents, {
                    currencyDisplay: 'symbol',
                    currency,
                  })}
                  caption={translate(
                    'text_6670a7222702d70114cc795c',
                    { count: overdueFormattedData.invoiceCount },
                    overdueFormattedData.invoiceCount,
                  )}
                  isAccentContent={hasOverdueInvoices}
                  refresh={refreshOverdueBalances}
                />
              )}
            </Stack>
          </Stack>
        </section>
      )}
    </div>
  )
}
