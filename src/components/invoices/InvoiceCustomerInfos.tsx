import { gql } from '@apollo/client'
import { Box, Stack } from '@mui/material'
import { Icon } from 'lago-design-system'
import { DateTime } from 'luxon'
import { memo } from 'react'
import { generatePath, Link } from 'react-router-dom'

import { ConditionalWrapper } from '~/components/ConditionalWrapper'
import { Status, StatusType, Typography } from '~/components/designSystem'
import { invoiceStatusMapping, paymentStatusMapping } from '~/core/constants/statusInvoiceMapping'
import { formatAddress } from '~/core/formats/formatAddress'
import { CUSTOMER_DETAILS_ROUTE } from '~/core/router'
import {
  CustomerAccountTypeEnum,
  InvoiceForInvoiceInfosFragment,
  InvoiceStatusTypeEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useFormatterDateHelper } from '~/hooks/helpers/useFormatterDateHelper'

gql`
  fragment InvoiceForInvoiceInfos on Invoice {
    number
    issuingDate
    paymentDueDate
    paymentOverdue
    status
    totalPaidAmountCents
    totalAmountCents
    paymentStatus
    paymentDisputeLostAt
    taxProviderVoidable
    errorDetails {
      errorCode
      errorDetails
    }
    customer {
      id
      name
      displayName
      legalNumber
      legalName
      taxIdentificationNumber
      email
      addressLine1
      addressLine2
      state
      country
      city
      zipcode
      applicableTimezone
      deletedAt
      accountType
    }
  }
`

const InfoLine = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-2 flex items-baseline gap-2 first-child:mt-1 first-child:min-w-35 last-child:w-full">
    {children}
  </div>
)

interface InvoiceCustomerInfosProps {
  invoice?: InvoiceForInvoiceInfosFragment | null
}

export const InvoiceCustomerInfos = memo(({ invoice }: InvoiceCustomerInfosProps) => {
  const { customer } = invoice || {}
  const { formattedDateWithTimezone } = useFormatterDateHelper()
  const { translate } = useInternationalization()

  const customerName = customer?.displayName
  const customerIsPartner = customer?.accountType === CustomerAccountTypeEnum.Partner

  const formattedAddress = formatAddress({
    addressLine1: customer?.addressLine1,
    addressLine2: customer?.addressLine2,
    city: customer?.city,
    country: customer?.country,
    state: customer?.state,
    zipcode: customer?.zipcode,
  })

  return (
    <section className="grid grid-cols-1 gap-0 py-6 shadow-b md:grid-cols-2">
      <div className="pr-8">
        {customer && customerName && (
          <InfoLine>
            <Typography variant="caption" color="grey600" noWrap>
              {translate(
                customerIsPartner
                  ? 'text_17385950520558ttf6sv58s0'
                  : 'text_634687079be251fdb43833cb',
              )}
            </Typography>
            <ConditionalWrapper
              condition={!!customer.deletedAt}
              validWrapper={(children) => <>{children}</>}
              invalidWrapper={(children) => (
                <Link
                  className="*:text-blue-600"
                  to={generatePath(CUSTOMER_DETAILS_ROUTE, {
                    customerId: customer.id,
                  })}
                >
                  {children}
                </Link>
              )}
            >
              <Typography variant="body" color="grey700" forceBreak>
                {customerName}
              </Typography>
            </ConditionalWrapper>
          </InfoLine>
        )}
        {customer?.legalName && (
          <InfoLine>
            <Typography variant="caption" color="grey600" noWrap>
              {translate('text_634687079be251fdb43833d7')}
            </Typography>
            <Typography variant="body" color="grey700" forceBreak>
              {customer?.legalName}
            </Typography>
          </InfoLine>
        )}
        {customer?.legalNumber && (
          <InfoLine>
            <Typography variant="caption" color="grey600" noWrap>
              {translate('text_647ddd5220412a009bfd36f4')}
            </Typography>
            <Typography variant="body" color="grey700" forceBreak>
              {customer?.legalNumber}
            </Typography>
          </InfoLine>
        )}
        {customer?.email && (
          <InfoLine>
            <Typography variant="caption" color="grey600" noWrap>
              {translate('text_634687079be251fdb43833e3')}
            </Typography>
            <Typography variant="body" color="grey700" forceBreak>
              {customer?.email.split(',').join(', ')}
            </Typography>
          </InfoLine>
        )}
        {!!formattedAddress && (
          <InfoLine>
            <Typography variant="caption" color="grey600" noWrap>
              {translate('text_634687079be251fdb43833ef')}
            </Typography>
            <div>
              <Typography variant="body" color="grey700">
                {formattedAddress}
              </Typography>
            </div>
          </InfoLine>
        )}
      </div>
      <div>
        {customer?.taxIdentificationNumber && (
          <InfoLine>
            <Typography variant="caption" color="grey600" noWrap>
              {translate('text_648053ee819b60364c675cf1')}
            </Typography>
            <Typography variant="body" color="grey700">
              {customer?.taxIdentificationNumber}
            </Typography>
          </InfoLine>
        )}
        {invoice?.number && (
          <InfoLine>
            <Typography variant="caption" color="grey600" noWrap>
              {translate('text_634687079be251fdb43833fb')}
            </Typography>
            <Typography variant="body" color="grey700">
              {invoice?.number}
            </Typography>
          </InfoLine>
        )}
        {invoice?.issuingDate && (
          <InfoLine>
            <Typography variant="caption" color="grey600" noWrap>
              {translate('text_634687079be251fdb4383407')}
            </Typography>
            <Typography variant="body" color="grey700">
              {formattedDateWithTimezone(invoice.issuingDate, customer?.applicableTimezone)}
            </Typography>
          </InfoLine>
        )}
        {invoice?.paymentDueDate && (
          <InfoLine>
            <Typography variant="caption" color="grey600" noWrap>
              {translate('text_666c5d227d073444e90be894')}
            </Typography>
            <Stack alignItems="baseline" flexDirection="row" flexWrap="wrap" columnGap={3}>
              <Typography variant="body" color="grey700">
                {formattedDateWithTimezone(invoice.paymentDueDate, customer?.applicableTimezone)}
              </Typography>
              {invoice?.paymentOverdue && <Status type={StatusType.danger} label="overdue" />}
            </Stack>
          </InfoLine>
        )}
        <InfoLine>
          <Typography variant="caption" color="grey600" noWrap>
            {translate('text_65269b6afe1fda4ad9bf672b')}
          </Typography>
          <Typography variant="body" color="grey700">
            {invoice?.status && <Status {...invoiceStatusMapping({ status: invoice.status })} />}
          </Typography>
        </InfoLine>
        <InfoLine>
          <Typography variant="caption" color="grey600" noWrap>
            {translate('text_63eba8c65a6c8043feee2a0f')}
          </Typography>
          <Typography variant="body" color="grey700">
            {invoice?.status === InvoiceStatusTypeEnum.Finalized ? (
              <Status
                {...paymentStatusMapping({
                  status: invoice.status,
                  paymentStatus: invoice.paymentStatus,
                  totalPaidAmountCents: invoice.totalPaidAmountCents,
                  totalAmountCents: invoice.totalAmountCents,
                })}
              />
            ) : (
              <Typography variant="body" color="grey700">
                -
              </Typography>
            )}
          </Typography>
        </InfoLine>
        {!!invoice?.paymentDisputeLostAt && (
          <InfoLine>
            <Typography variant="caption" color="grey600" noWrap>
              {translate('text_66141e30699a0631f0b2ed32')}
            </Typography>

            <Typography variant="body" color="textSecondary">
              <Box marginRight={1} display="inline" sx={{ verticalAlign: 'middle' }}>
                <Icon name="warning-filled" color="warning" />
              </Box>
              {translate('text_66141e30699a0631f0b2ed2c', {
                date: DateTime.fromISO(invoice?.paymentDisputeLostAt).toFormat('LLL. dd, yyyy'),
              })}
            </Typography>
          </InfoLine>
        )}
      </div>
    </section>
  )
})

InvoiceCustomerInfos.displayName = 'InvoiceCustomerInfos'
