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
  const hasOverdueInvoices = true
  const amount = 29707
  const invoiceCount = 4

  return (
    <>
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
          {hasOverdueInvoices && (
            <Alert type="warning">
              <Stack flexDirection="row" gap={4} alignItems="center">
                <Stack flexDirection="column" gap={1}>
                  <Typography variant="bodyHl" color="textSecondary">
                    {translate(
                      'text_6670a7222702d70114cc7955',
                      {
                        count: invoiceCount,
                        amount: intlFormatNumber(0, {
                          currencyDisplay: 'symbol',
                          currency: userCurrency,
                        }),
                      },
                      invoiceCount,
                    )}
                  </Typography>
                  <Typography variant="caption">
                    {translate('text_6670a2a7ae3562006c4ee3db')}
                  </Typography>
                </Stack>
              </Stack>
            </Alert>
          )}
          <Stack flexDirection="row" gap={4}>
            <OverviewCard
              title={translate('text_6553885df387fd0097fd7385')}
              tooltipContent={translate('text_65564e8e4af2340050d431bf')}
              content={intlFormatNumber(amount, {
                currencyDisplay: 'symbol',
                currency: userCurrency,
              })}
              caption={translate(
                'text_6670a7222702d70114cc795c',
                { count: invoiceCount },
                invoiceCount,
              )}
            />
            <OverviewCard
              title={translate('text_6670a7222702d70114cc795a')}
              tooltipContent={translate('text_6670a2a7ae3562006c4ee3e7')}
              content={intlFormatNumber(amount, {
                currencyDisplay: 'symbol',
                currency: userCurrency,
              })}
              caption={translate(
                'text_6670a7222702d70114cc795c',
                { count: invoiceCount },
                invoiceCount,
              )}
              isAccentContent={hasOverdueInvoices}
            />
          </Stack>
        </Stack>
      </section>

      <CustomerSubscriptionsList customerTimezone={customerTimezone} />
    </>
  )
}
