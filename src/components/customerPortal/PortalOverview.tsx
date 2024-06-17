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
  const count = 5

  return (
    <section>
      <SectionHeader variant="subhead" $hideBottomShadow>
        {translate('text_6670a7222702d70114cc7954')}

        <Button data-test="add-subscription" variant="quaternary" onClick={() => location.reload()}>
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
                      count: count,
                      amount: intlFormatNumber(amount, { currency: currency || CurrencyEnum.Usd }),
                    },
                    count,
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
            title={translate('text_6670a7222702d70114cc7957')}
            content={intlFormatNumber(amount, { currency: currency || CurrencyEnum.Usd })}
            caption={translate('text_6670a7222702d70114cc795c', { count: count }, count)}
          />
          <OverviewCard
            title={translate('text_6670a7222702d70114cc795a')}
            tooltipContent={translate('text_6670a757999f8a007789bb5d')}
            content={intlFormatNumber(amount, { currency: currency || CurrencyEnum.Usd })}
            caption={translate('text_6670a7222702d70114cc795c', { count: count }, count)}
            isAccentContent={hasOverdueInvoices}
          />
        </Stack>
      </Stack>
    </section>
  )
}
