import { memo } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'
import { DateTime } from 'luxon'
import { generatePath, Link } from 'react-router-dom'

import { Typography } from '~/components/designSystem'
import { CountryCode, Customer, Invoice } from '~/generated/graphql'
import { CUSTOMER_DETAILS_ROUTE } from '~/core/router'
import CountryCodes from '~/public/countryCode.json'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

gql`
  fragment InvoiceForInvoiceInfos on Invoice {
    number
    issuingDate
    customer {
      id
      name
      legalName
      email
      addressLine1
      addressLine2
      state
      country
      city
      zipcode
    }
  }
`

interface InvoiceCustomerInfosProps {
  customer: Customer
  invoice: Invoice
}

export const InvoiceCustomerInfos = memo(({ customer, invoice }: InvoiceCustomerInfosProps) => {
  const { translate } = useInternationalization()

  return (
    <Wrapper>
      <div>
        {customer?.name && (
          <InfoLine>
            <Typography variant="caption" color="grey600" noWrap>
              {translate('text_634687079be251fdb43833cb')}
            </Typography>
            <Link
              to={generatePath(CUSTOMER_DETAILS_ROUTE, {
                id: customer.id,
              })}
            >
              <Typography variant="body" color="grey700">
                {customer?.name}
              </Typography>
            </Link>
          </InfoLine>
        )}
        {customer?.legalName && (
          <InfoLine>
            <Typography variant="caption" color="grey600" noWrap>
              {translate('text_634687079be251fdb43833d7')}
            </Typography>
            <Typography variant="body" color="grey700">
              {customer?.legalName}
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
                  {CountryCodes[customer?.country as CountryCode]}
                </Typography>
              )}
            </div>
          </InfoLine>
        )}
      </div>
      <div>
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
          <>
            <InfoLine>
              <Typography variant="caption" color="grey600" noWrap>
                {translate('text_634687079be251fdb4383407')}
              </Typography>
              <Typography variant="body" color="grey700">
                {DateTime.fromISO(invoice?.issuingDate).toFormat('LLL. dd, yyyy')}
              </Typography>
            </InfoLine>
            <InfoLine>
              <Typography variant="caption" color="grey600" noWrap>
                {translate('text_634687079be251fdb4383413')}
              </Typography>
              <Typography variant="body" color="grey700">
                {DateTime.fromISO(invoice?.issuingDate).toFormat('LLL. dd, yyyy')}
              </Typography>
            </InfoLine>
          </>
        )}
      </div>
    </Wrapper>
  )
})

InvoiceCustomerInfos.displayName = 'InvoiceCustomerInfos'

const Wrapper = styled.section`
  margin-bottom: ${theme.spacing(6)};
  display: flex;
  > * {
    flex: 1;

    &:not(:last-child) {
      margin-right: ${theme.spacing(8)};
    }
  }

  ${theme.breakpoints.down('md')} {
    flex-direction: column;
  }
`

const InfoLine = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: ${theme.spacing(4)};

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
