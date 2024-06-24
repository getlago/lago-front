import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { FC } from 'react'

import { Alert, Button, Typography } from '~/components/designSystem'
import { OverviewCard } from '~/components/OverviewCard'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  useGetCustomerPortalInvoicesCollectionQuery,
  useGetCustomerPortalOverdueBalancesQuery,
  useGetCustomerPortalUserCurrencyQuery,
} from '~/generated/graphql'
import { SectionHeader } from '~/styles/customer'

gql`
  query getCustomerPortalInvoicesCollection {
    customerPortalInvoiceCollections {
      collection {
        amountCents
        invoicesCount
        currency
      }
    }
  }

  query getCustomerPortalOverdueBalances {
    customerPortalOverdueBalances {
      collection {
        amountCents
        currency
        lagoInvoiceIds
      }
    }
  }

  query getCustomerPortalUserCurrency {
    customerPortalUser {
      currency
    }
  }
`

interface PortalOverviewProps {
  translate: Function
}

interface CalculatedData {
  amount: number
  count: number
  currency?: CurrencyEnum
}

export const PortalOverview: FC<PortalOverviewProps> = ({ translate }) => {
  const { data: userCurrencyData } = useGetCustomerPortalUserCurrencyQuery()
  const { data: overdueData, loading: overdueLoading } = useGetCustomerPortalOverdueBalancesQuery()
  const { data: invoicesData, loading: invoicesLoading } =
    useGetCustomerPortalInvoicesCollectionQuery()

  const customerCurrency = userCurrencyData?.customerPortalUser?.currency ?? CurrencyEnum.Usd

  const overdue = (
    overdueData?.customerPortalOverdueBalances?.collection || []
  ).reduce<CalculatedData>(
    (acc, item) => {
      return {
        amount: acc.amount + deserializeAmount(item.amountCents, item.currency),
        count: acc.count + item.lagoInvoiceIds.length,
        currency: item.currency,
      }
    },
    { amount: 0, count: 0, currency: customerCurrency },
  )

  const invoices = (
    invoicesData?.customerPortalInvoiceCollections?.collection || []
  ).reduce<CalculatedData>(
    (acc, item) => {
      return {
        amount: acc.amount + deserializeAmount(item.amountCents, item.currency ?? customerCurrency),
        count: acc.count + Number(item.invoicesCount),
        currency: item.currency ?? acc.currency,
      }
    },
    { amount: 0, count: 0, currency: customerCurrency },
  )

  return (
    <section>
      <SectionHeader variant="subhead" $hideBottomShadow>
        {translate('text_6670a7222702d70114cc7954')}

        <Button data-test="add-subscription" variant="quaternary" onClick={() => location.reload()}>
          {translate('text_6670a7222702d70114cc7953')}
        </Button>
      </SectionHeader>
      <Stack gap={4}>
        {!overdueLoading && overdue.count > 0 && (
          <Alert type="warning">
            <Stack flexDirection="row" gap={4} alignItems="center">
              <Stack flexDirection="column" gap={1}>
                <Typography variant="bodyHl" color="textSecondary">
                  {translate(
                    'text_6670a7222702d70114cc7955',
                    {
                      count: overdue.count,
                      amount: intlFormatNumber(overdue.amount, { currency: overdue.currency }),
                    },
                    overdue.count,
                  )}
                </Typography>
                <Typography variant="caption">
                  {translate('text_6670a7222702d70114cc7956')}
                </Typography>
              </Stack>
            </Stack>
          </Alert>
        )}
        <Stack flexDirection="row" gap={4}>
          <OverviewCard
            isLoading={invoicesLoading}
            title={translate('text_6670a7222702d70114cc7957')}
            content={intlFormatNumber(invoices.amount, { currency: invoices.currency })}
            caption={translate(
              'text_6670a7222702d70114cc795c',
              { count: invoices.count },
              invoices.count,
            )}
          />
          <OverviewCard
            isLoading={overdueLoading}
            title={translate('text_6670a7222702d70114cc795a')}
            tooltipContent={translate('text_6670a757999f8a007789bb5d')}
            content={intlFormatNumber(overdue.amount, { currency: overdue.currency })}
            caption={translate(
              'text_6670a7222702d70114cc795c',
              { count: overdue.count },
              overdue.count,
            )}
            isAccentContent={overdue.count > 0}
          />
        </Stack>
      </Stack>
    </section>
  )
}
