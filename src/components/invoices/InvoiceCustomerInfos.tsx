import { gql } from '@apollo/client'
import { memo } from 'react'
import { generatePath, Link } from 'react-router-dom'
import styled from 'styled-components'

import { Typography } from '~/components/designSystem'
import { CountryCodes } from '~/core/constants/countryCodes'
import { CUSTOMER_DETAILS_ROUTE } from '~/core/router'
import { formatDateToTZ } from '~/core/timezone'
import { InvoiceForInvoiceInfosFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import { ConditionalWrapper } from '../ConditionalWrapper'

gql`
  fragment InvoiceForInvoiceInfos on Invoice {
    number
    issuingDate
    paymentDueDate
    customer {
      id
      name
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

  return (
    <Wrapper>
      <div>
        {customer?.name && (
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
                    id: customer.id,
                  })}
                >
                  {children}
                </Link>
              )}
            >
              <Typography variant="body" color="grey700" forceBreak>
                {customer?.name}
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
              {customer?.email}
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
                "LLL. dd, yyyy U'T'CZ"
              )}
            </Typography>
          </InfoLine>
        )}
        {invoice?.paymentDueDate && (
          <InfoLine>
            <Typography variant="caption" color="grey600" noWrap>
              {translate('text_634687079be251fdb4383413')}
            </Typography>
            <Typography variant="body" color="grey700">
              {formatDateToTZ(
                invoice?.paymentDueDate,
                customer?.applicableTimezone,
                "LLL. dd, yyyy U'T'CZ"
              )}
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
  display: flex;

  > * {
    flex: 1;
  }

  > div:first-child > div > *:last-child {
    padding-right: ${theme.spacing(8)};
  }

  ${theme.breakpoints.down('md')} {
    flex-direction: column;
  }
`

const InfoLine = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: ${theme.spacing(2)};

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
