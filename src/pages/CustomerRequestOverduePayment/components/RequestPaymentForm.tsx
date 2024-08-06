import { Stack } from '@mui/material'
import { FormikProps } from 'formik'
import { FC } from 'react'
import styled from 'styled-components'

import { Table, Typography } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { OverviewCard } from '~/components/OverviewCard'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

export interface CustomerRequestOverduePaymentForm {
  emails: string
}

interface RequestPaymentFormProps {
  formikProps: FormikProps<CustomerRequestOverduePaymentForm>
}

export const RequestPaymentForm: FC<RequestPaymentFormProps> = ({ formikProps }) => {
  const { translate } = useInternationalization()

  const amount = '$730.00'

  return (
    <Stack flexDirection="column" gap={10}>
      <SectionHeader>
        <Typography variant="headline" color="textSecondary">
          {translate('TODO: You’re about to request a payment of {{amount}}', {
            amount,
          })}
        </Typography>
        <Typography>
          {translate(
            'TODO: Once the request is validated, Lago will initiate a payment intent with the connected payment provider service (if applicable). If the payment fails, we will send an email to your customer requesting payment of the overdue balance.',
          )}
        </Typography>
      </SectionHeader>

      <TextInputField
        name="emails"
        formikProps={formikProps}
        placeholder={translate('TODO: Enter email address')}
        label={translate('TODO: Send this payment request by email')}
        description={translate(
          'TODO: To send this email to multiple recipients, define multiple email addresses separated by commas. (e.g. billing@acme.com, accounting@acme.com)',
        )}
      />
      <OverviewCard
        title={translate('TODO: Total overdue')}
        content={amount}
        caption={translate('TODO: for {{count}} invoices', {
          count: 5,
        })}
        isAccentContent
      />
      <Table
        name="overdue-invoices"
        containerSize={{
          default: 0,
        }}
        data={[
          {
            id: '1',
            invoiceNumber: 'INV-0001',
            date: 'Jul. 13, 2022',
            totalAmountCents: '$30.00',
          },
          {
            id: '2',
            invoiceNumber: 'INV-0002',
            date: 'Jul. 13, 2022',
            totalAmountCents: '$200.00',
          },
        ]}
        isLoading={false}
        columns={[
          {
            key: 'invoiceNumber',
            title: translate('TODO: Invoice number'),
            maxSpace: true,
            content: ({ invoiceNumber }) => (
              <Typography variant="body" noWrap>
                {invoiceNumber}
              </Typography>
            ),
          },
          {
            key: 'totalAmountCents',
            title: translate('TODO: Amount'),
            textAlign: 'right',
            content: ({ totalAmountCents }) => (
              <Typography variant="bodyHl" color="textSecondary" noWrap>
                {totalAmountCents}
              </Typography>
            ),
          },
          {
            key: 'date',
            title: translate('TODO: Issuing date'),
            content: ({ date }) => (
              <Typography variant="body" noWrap>
                {date}
              </Typography>
            ),
          },
        ]}
      />
    </Stack>
  )
}

const SectionHeader = styled.header`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(3)};
  }
`
