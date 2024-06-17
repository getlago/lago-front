import { Stack } from '@mui/material'
import { FC } from 'react'

import { CustomerSubscriptionsList } from '~/components/customers/subscriptions/CustomerSubscriptionsList'
import { Alert, Button, Typography } from '~/components/designSystem'
import { OverviewCard } from '~/components/OverviewCard'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum, TimezoneEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { SectionHeader } from '~/styles/customer'

interface CustomerOverviewProps {
  customerTimezone?: TimezoneEnum
  userCurrency?: CurrencyEnum
}

export const CustomerOverview: FC<CustomerOverviewProps> = ({ customerTimezone, userCurrency }) => {
  const { translate } = useInternationalization()

  // TODO: Replace with real data
  const hasOverdueInvoices = false
  const amount = 29707

  return (
    <>
      <section>
        <SectionHeader variant="subhead" $hideBottomShadow>
          {translate('TODO: Billing overview')}

          <Button
            data-test="add-subscription"
            variant="quaternary"
            onClick={() => location.reload()}
          >
            {translate('TODO: Refresh')}
          </Button>
        </SectionHeader>
        <Stack gap={4}>
          {hasOverdueInvoices && (
            <Alert type="warning">
              <Stack flexDirection="row" gap={4} alignItems="center">
                <Stack flexDirection="column" gap={1}>
                  <Typography variant="bodyHl" color="textSecondary">
                    {translate(
                      'TODO: {{overdueInvoiceCount}} invoices totaling {{overdueAmount}} are overdue. ',
                      { overdueInvoiceCount: 5, overdueAmount: 0 },
                    )}
                  </Typography>
                  <Typography variant="caption">
                    {translate('TODO: Request payment to settle the overdue amount.')}
                  </Typography>
                </Stack>
              </Stack>
            </Alert>
          )}
          <Stack flexDirection="row" gap={4}>
            <OverviewCard
              title={translate('TODO: Gross revenue')}
              tooltipContent={translate(
                'TODO: Total monthly income, covering all financial aspects including taxes, discounts like credit notes, coupons, and credits, for an accurate financial overview.',
              )}
              content={intlFormatNumber(amount, {
                currencyDisplay: 'symbol',
                currency: userCurrency,
              })}
              caption={translate('TODO: for {{count}} invoices', { count: 5 })}
            />
            <OverviewCard
              title={translate('TODO: Total overdue')}
              tooltipContent={translate(
                'TODO: Total from past due invoices. This is the amount this customer owes you.',
              )}
              content={intlFormatNumber(amount, {
                currencyDisplay: 'symbol',
                currency: userCurrency,
              })}
              caption={translate('TODO: for {{count}} invoices', { count: 5 })}
              isAccentContent={hasOverdueInvoices}
            />
          </Stack>
        </Stack>
      </section>

      <CustomerSubscriptionsList customerTimezone={customerTimezone} />
    </>
  )
}
