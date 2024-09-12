import { gql } from '@apollo/client'
import { Box, Stack } from '@mui/material'
import { DateTime } from 'luxon'
import { memo } from 'react'
import { generatePath, Link } from 'react-router-dom'
import styled from 'styled-components'

import { computeCustomerName } from '~/components/customers/utils'
import { Icon, Status, StatusType, Typography } from '~/components/designSystem'
import { CountryCodes } from '~/core/constants/countryCodes'
import { invoiceStatusMapping, paymentStatusMapping } from '~/core/constants/statusInvoiceMapping'
import { CUSTOMER_DETAILS_ROUTE } from '~/core/router'
import { formatDateToTZ } from '~/core/timezone'
import { InvoiceForInvoiceInfosFragment, InvoiceStatusTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import { ConditionalWrapper } from '../ConditionalWrapper'

gql`
  fragment InvoiceForInvoiceInfos on Invoice {
    number
    issuingDate
    paymentDueDate
    paymentOverdue
    status
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
      firstname
      lastname
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
    }
  }
`

interface InvoiceCustomerInfosProps {
  invoice?: InvoiceForInvoiceInfosFragment | null
}

export const InvoiceCustomerInfos = memo(({ invoice }: InvoiceCustomerInfosProps) => {
  const { customer } = invoice || {}
  const { translate } = useInternationalization()

  const customerName = computeCustomerName(customer)

  return (
    <Wrapper>
      <div>
        {customer && customerName && (
          <InfoLine>
            <Typography variant="caption" color="grey600" noWrap>
              {translate('text_634687079be251fdb43833cb')}
            </Typography>
            <ConditionalWrapper
              condition={!!customer.deletedAt}
              validWrapper={(children) => <>{children}</>}
              invalidWrapper={(children) => (
                <Link
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
            <Typography variant="body" color="grey700">
              {customer?.email.split(',').join(', ')}
            </Typography>
          </InfoLine>
        )}
        {(customer?.addressLine1 ||
          customer?.addressLine2 ||
          customer?.state ||
          customer?.country ||
          customer?.city ||
          customer?.zipcode) && (
          <InfoLine>
            <Typography variant="caption" color="grey600" noWrap>
              {translate('text_634687079be251fdb43833ef')}
            </Typography>
            <div>
              {customer?.addressLine1 && (
                <Typography variant="body" color="grey700">
                  {customer?.addressLine1}
                </Typography>
              )}
              {customer?.addressLine2 && (
                <Typography variant="body" color="grey700">
                  {customer?.addressLine2}
                </Typography>
              )}
              {(customer?.zipcode || customer?.city || customer?.state) && (
                <Typography variant="body" color="grey700">
                  {customer?.zipcode} {customer?.city} {customer?.state}
                </Typography>
              )}
              {customer?.country && (
                <Typography variant="body" color="grey700">
                  {CountryCodes[customer?.country]}
                </Typography>
              )}
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
              {formatDateToTZ(
                invoice?.issuingDate,
                customer?.applicableTimezone,
                "LLL. dd, yyyy U'T'CZ",
              )}
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
                {formatDateToTZ(
                  invoice?.paymentDueDate,
                  customer?.applicableTimezone,
                  "LLL. dd, yyyy U'T'CZ",
                )}
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
    </Wrapper>
  )
})

InvoiceCustomerInfos.displayName = 'InvoiceCustomerInfos'

const Wrapper = styled.section`
  padding: ${theme.spacing(6)} 0;
  box-shadow: ${theme.shadows[7]};
  display: grid;
  grid-template-columns: 1fr 1fr;

  > div:not(:last-child) {
    padding-right: ${theme.spacing(8)};
  }

  ${theme.breakpoints.down('md')} {
    grid-template-columns: 1fr;
    gap: initial;
  }
`

const InfoLine = styled.div`
  display: flex;
  align-items: baseline;
  margin-bottom: ${theme.spacing(2)};
  gap: ${theme.spacing(2)};

  > div:first-child {
    min-width: 140px;
    margin-top: ${theme.spacing(1)};
  }

  > div:last-child {
    width: 100%;
  }

  > a {
    color: ${theme.palette.primary[600]};

    > * {
      color: inherit;
    }
  }
`
