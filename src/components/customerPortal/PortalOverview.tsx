import { Stack } from '@mui/material'
import { FC } from 'react'

import { Alert, Button, Typography } from '~/components/designSystem'
import { OverviewCard } from '~/components/OverviewCard'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum } from '~/generated/graphql'
import { SectionHeader } from '~/styles/customer'

interface PortalOverviewProps {
  translate: Function
}

export const PortalOverview: FC<PortalOverviewProps> = ({ translate }) => {
  const hasOverdueInvoices = true
  const amount = 20797
  const currency = undefined

  return (
    <section>
      <SectionHeader variant="subhead" $hideBottomShadow>
        {translate('TODO: Payment overview')}

        <Button data-test="add-subscription" variant="quaternary" onClick={() => location.reload()}>
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
                    'TODO: {{overdueInvoiceCount}} invoices totaling {{overdueAmount}} are overdue.',
                    { overdueInvoiceCount: 5, overdueAmount: 0 },
                  )}
                </Typography>
                <Typography variant="caption">
                  {translate('TODO: Pay the total amount to settle the overdue balance.')}
                </Typography>
              </Stack>
            </Stack>
          </Alert>
        )}
        <Stack flexDirection="row" gap={4}>
          <OverviewCard
            title={translate('TODO: Total invoiced')}
            content={intlFormatNumber(amount, { currency: currency || CurrencyEnum.Usd })}
            caption={translate('TODO: for {{count}} invoices', { count: 5 })}
          />
          <OverviewCard
            title={translate('TODO: Total overdue')}
            tooltipContent={translate(
              'TODO: Total from past due invoices. This is the amount you owe.',
            )}
            content={intlFormatNumber(amount, { currency: currency || CurrencyEnum.Usd })}
            caption={translate('TODO: for {{count}} invoices', { count: 5 })}
            isAccentContent={hasOverdueInvoices}
          />
        </Stack>
      </Stack>
    </section>
  )
}
