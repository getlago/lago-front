import { gql } from '@apollo/client'
import { Box, Divider, Stack } from '@mui/material'
import { FC } from 'react'
import styled from 'styled-components'

import { Avatar, Button, Skeleton, Table, Typography } from '~/components/designSystem'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { LocaleEnum } from '~/core/translations'
import {
  CurrencyEnum,
  CustomerForRequestOverduePaymentEmailFragment,
  InvoicesForRequestOverduePaymentEmailFragment,
  OrganizationForRequestOverduePaymentEmailFragment,
  ProviderTypeEnum,
} from '~/generated/graphql'
import { useContextualLocale } from '~/hooks/core/useContextualLocale'
import Logo from '~/public/images/logo/lago-logo-grey.svg'
import { Card, theme } from '~/styles'

gql`
  fragment CustomerForRequestOverduePaymentEmail on Customer {
    name
    paymentProvider
    netPaymentTerm
    billingConfiguration {
      documentLocale
    }
  }

  fragment OrganizationForRequestOverduePaymentEmail on CurrentOrganization {
    name
    logoUrl
    email
    netPaymentTerm
    billingConfiguration {
      documentLocale
    }
  }

  fragment InvoicesForRequestOverduePaymentEmail on Invoice {
    id
    number
    totalAmountCents
    currency
  }
`

interface EmailPreviewProps {
  isLoading: boolean
  documentLocale: LocaleEnum
  customer?: CustomerForRequestOverduePaymentEmailFragment
  organization?: OrganizationForRequestOverduePaymentEmailFragment
  overdueAmount: number
  currency: CurrencyEnum
  invoices: InvoicesForRequestOverduePaymentEmailFragment[]
}

export const EmailPreview: FC<EmailPreviewProps> = ({
  isLoading,
  documentLocale,
  customer,
  organization,
  overdueAmount,
  currency,
  invoices,
}) => {
  const { translateWithContextualLocal: translate } = useContextualLocale(documentLocale)

  const formattedOverdueAmount = intlFormatNumber(overdueAmount, {
    currency,
    locale: documentLocale,
    currencyDisplay: 'narrowSymbol',
  })

  if (isLoading) {
    return <EmailPreviewSkeleton />
  }

  return (
    <Stack flexDirection="column" gap={8} maxWidth={600} marginX="auto">
      <Header>
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
        <CompanyName color="textSecondary">{organization?.name}</CompanyName>
      </Header>
      <Card $childSpacing={8}>
        <Stack gap={6}>
          <Text color="textSecondary">
            {translate('text_66b378e748cda1004ff00db0', { customerName: customer?.name })}
          </Text>
          <Text color="textSecondary">
            {translate('text_66b378e748cda1004ff00db1', { organizationName: organization?.name })}
          </Text>
          <Text color="textSecondary">
            {translate('text_66b378e748cda1004ff00db2', { amount: formattedOverdueAmount })}
          </Text>
          <Text color="textSecondary">
            {translate(
              'text_66b378e748cda1004ff00db3',
              { netPaymentTerm: customer?.netPaymentTerm ?? organization?.netPaymentTerm },
              customer?.netPaymentTerm ?? organization?.netPaymentTerm,
            )}
          </Text>
          <Text color="textSecondary">{translate('text_66b378e748cda1004ff00db4')}</Text>
          <Text color="textSecondary">{translate('text_66b378e748cda1004ff00db5')}</Text>
        </Stack>
        <Divider />
        <Stack direction="column" alignItems="flex-start" gap={4}>
          <Box>
            <Caption>{translate('text_66b378e748cda1004ff00db6')}</Caption>
            <Headline color="textSecondary">{formattedOverdueAmount}</Headline>
          </Box>

          {!!customer?.paymentProvider &&
            customer.paymentProvider !== ProviderTypeEnum.Gocardless && (
              <UnclickableButton variant="primary" size="medium">
                {translate('text_66b378e748cda1004ff00db8')}
              </UnclickableButton>
            )}
        </Stack>
        <Table
          name="email-preview"
          containerSize={{ default: 0 }}
          rowSize={48}
          data={invoices}
          columns={[
            {
              key: 'number',
              title: <Caption noWrap>{translate('text_6419c64eace749372fc72b3c')}</Caption>,
              maxSpace: true,
              content: ({ number }) => (
                <Caption color="primary600" noWrap>
                  {number}
                </Caption>
              ),
            },
            {
              key: 'totalAmountCents',
              textAlign: 'right',
              title: <Caption noWrap>{translate('text_6419c64eace749372fc72b3e')}</Caption>,
              content: (row) => (
                <Caption color="textSecondary" noWrap>
                  {intlFormatNumber(
                    deserializeAmount(row.totalAmountCents, row.currency || currency),
                    {
                      currency: row.currency || currency,
                      locale: documentLocale,
                      currencyDisplay: 'narrowSymbol',
                    },
                  )}
                </Caption>
              ),
            },
          ]}
        />

        {organization?.email && (
          <Box textAlign="center">
            <Caption component="span">{translate('text_64188b3d9735d5007d712276')}</Caption>
            <Caption component="span">{` `}</Caption>
            <Caption component="span" color="primary600">
              {organization?.email}
            </Caption>
          </Box>
        )}
      </Card>
      <Stack direction="row" alignItems="center" gap={1} marginX="auto">
        <Note color="grey500">{translate('text_6419c64eace749372fc72b03')}</Note>
        <Logo height="12px" />
      </Stack>
    </Stack>
  )
}

export const EmailPreviewSkeleton = () => {
  return (
    <Stack flexDirection="column" gap={8} maxWidth={600} marginX="auto">
      <Header>
        <Skeleton variant="connectorAvatar" size="medium" color="dark" />
        <Skeleton variant="text" width={120} height={12} color="dark" />
      </Header>
      <Card $childSpacing={4}>
        <Skeleton variant="text" width={104} height={12} color="dark" />
        <Skeleton variant="text" width="100%" height={12} color="dark" />
        <Skeleton variant="text" width={160} height={12} color="dark" />
      </Card>
      <Stack direction="row" alignItems="center" width="100%" justifyContent="center">
        <Skeleton variant="text" width={120} height={12} color="dark" />
      </Stack>
    </Stack>
  )
}

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing(3)};
  width: 100%;
`

const Text = styled(Typography)`
  font-family: Helvetica, sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
`

const CompanyName = styled(Text)`
  font-size: 20px;
  font-weight: 700;
  line-height: 28px;
`

const Caption = styled(Text)`
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
`

const Headline = styled(Text)`
  font-size: 32px;
  font-weight: 700;
  line-height: 40px;
`

const Note = styled(Text)`
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
`

const UnclickableButton = styled(Button)`
  cursor: default;
  pointer-events: none;
`
