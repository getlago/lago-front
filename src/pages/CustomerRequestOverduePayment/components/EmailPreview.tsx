import { gql } from '@apollo/client'
import { Box, Divider, Stack } from '@mui/material'
import { FC } from 'react'
import styled from 'styled-components'

import { Avatar, Table, Typography } from '~/components/designSystem'
import { Locale } from '~/core/translations'
import { useGetDocumentLocaleQuery } from '~/generated/graphql'
import { useContextualLocale } from '~/hooks/core/useContextualLocale'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import Logo from '~/public/images/logo/lago-logo-grey.svg'
import { Card, theme } from '~/styles'

gql`
  query getDocumentLocale {
    customerPortalOrganization {
      id
      billingConfiguration {
        id
        documentLocale
      }
    }

    customerPortalUser {
      id
      billingConfiguration {
        id
        documentLocale
      }
    }
  }
`

interface EmailPreviewProps {}

export const EmailPreview: FC<EmailPreviewProps> = () => {
  const { data: { customerPortalOrganization, customerPortalUser } = {} } =
    useGetDocumentLocaleQuery()

  const documentLocale =
    (customerPortalUser?.billingConfiguration?.documentLocale as Locale) ||
    (customerPortalOrganization?.billingConfiguration?.documentLocale as Locale) ||
    'en'

  const { translateWithContextualLocal: translate } = useContextualLocale(documentLocale)
  const { organization } = useOrganizationInfos()

  return (
    <Stack flexDirection="column" gap={8} maxWidth={600} marginX="auto">
      <Header>
        {organization?.logoUrl ? (
          <Avatar size="medium" variant="connector">
            <img src={organization?.logoUrl as string} alt={`${organization?.name}'s logo`} />
          </Avatar>
        ) : (
          <Avatar
            variant="company"
            identifier={organization?.name || ''}
            size="medium"
            initials={(organization?.name ?? 'Lago')[0]}
          />
        )}
        <CompanyName color="textSecondary">{organization?.name}</CompanyName>
      </Header>
      <Card $childSpacing={8}>
        <Stack gap={6}>
          <Text color="textSecondary">
            {translate('TODO: Hello {{customerName}}', { customerName: 'John Doe' })}
          </Text>
          <Text color="textSecondary">
            {translate(
              'TODO: This is a reminder from the {{organizationName}} finance team that some invoices are overdue.',
              {
                organizationName: organization?.name,
              },
            )}
          </Text>
          <Text color="textSecondary">
            {translate('TODO: The total amount due is {{amount}}', { amount: '$730.00' })}
          </Text>
          <Text color="textSecondary">
            {translate(
              'TODO: Our contractually agreed payment terms are {{netPaymentTerms}} days.',
              {
                netPaymentTerms: 30,
              },
            )}
          </Text>
          <Text color="textSecondary">
            {translate('TODO: If you have already made the payment, please disregard this email.')}
          </Text>
          <Text color="textSecondary">{translate('TODO: Thank you!')}</Text>
        </Stack>
        <Divider />
        <Box>
          <Caption>{translate('TODO: Amount remaining to pay')}</Caption>
          <Headline color="textSecondary">$730.00</Headline>
        </Box>
        <Table
          name="email-preview"
          containerSize={{
            default: 0,
          }}
          data={[
            {
              id: '1',
              invoiceNumber: 'INV-1234',
              totalAmount: '$365.00',
            },
            {
              id: '2',
              invoiceNumber: 'INV-1235',
              totalAmount: '$365.00',
            },
          ]}
          columns={[
            {
              key: 'invoiceNumber',
              title: <Caption noWrap>{translate('TODO: Invoice number')}</Caption>,
              maxSpace: true,
              content: (row) => (
                <Caption color="primary600" noWrap>
                  {row.invoiceNumber}
                </Caption>
              ),
            },
            {
              key: 'totalAmount',
              textAlign: 'right',
              title: <Caption noWrap>{translate('TODO: Amount')}</Caption>,
              content: (row) => (
                <Caption color="textSecondary" noWrap>
                  {row.totalAmount}
                </Caption>
              ),
            },
          ]}
        />
        <Box textAlign="center">
          <Caption>
            {translate('TODO: Questions? Contact us at {{email}}', { email: 'contact@banco.com' })}
          </Caption>
        </Box>
      </Card>
      <Stack direction="row" gap={1} marginX="auto">
        <Note color="grey500">{translate('text_6419c64eace749372fc72b03')}</Note>
        <StyledLogo />
      </Stack>
    </Stack>
  )
}

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};
  margin: auto;
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

const StyledLogo = styled(Logo)`
  width: 40px;
`
