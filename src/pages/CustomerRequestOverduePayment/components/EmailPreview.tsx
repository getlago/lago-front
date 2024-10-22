import { FC } from 'react'

import { Avatar, Skeleton, Typography } from '~/components/designSystem'
import {
  DunningEmail,
  DunningEmailProps,
  DunningEmailSkeleton,
} from '~/components/emails/DunningEmail'
import { useContextualLocale } from '~/hooks/core/useContextualLocale'
import Logo from '~/public/images/logo/lago-logo-grey.svg'
import { Card } from '~/styles/designSystem'

interface EmailPreviewProps extends DunningEmailProps {
  isLoading: boolean
}

export const EmailPreview: FC<EmailPreviewProps> = ({
  isLoading,
  locale,
  customer,
  organization,
  overdueAmount,
  currency,
  invoices,
}) => {
  const { translateWithContextualLocal: translate } = useContextualLocale(locale)

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-150 flex-col gap-8">
        <div className="flex flex-1 items-center justify-center gap-3">
          <Skeleton variant="connectorAvatar" size="medium" color="dark" />
          <Skeleton variant="text" width={120} height={12} color="dark" />
        </div>
        <Card $childSpacing={4}>
          <DunningEmailSkeleton />
        </Card>
        <div className="flex justify-center">
          <Skeleton variant="text" width={120} height={12} color="dark" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-150 flex-col gap-8">
      <div className="flex flex-1 items-center justify-center gap-3">
        {organization?.logoUrl ? (
          <Avatar size="medium" variant="connector">
            <img src={organization?.logoUrl ?? ''} alt={organization?.name} />
          </Avatar>
        ) : (
          <Avatar
            variant="company"
            identifier={organization?.name || ''}
            size="medium"
            initials={(organization?.name ?? '')[0]}
          />
        )}
        <Typography className="font-email text-xl font-bold" color="textSecondary">
          {organization?.name}
        </Typography>
      </div>
      <Card $childSpacing={8}>
        <DunningEmail
          locale={locale}
          invoices={invoices}
          currency={currency}
          overdueAmount={overdueAmount}
          customer={customer}
          organization={organization}
        />
      </Card>
      <div className="mx-auto flex flex-row items-center gap-1">
        <Typography className="font-email text-xs font-normal" color="grey500">
          {translate('text_6419c64eace749372fc72b03')}
        </Typography>
        <Logo height="12px" />
      </div>
    </div>
  )
}
