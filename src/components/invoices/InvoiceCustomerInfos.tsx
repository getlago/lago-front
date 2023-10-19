import { gql } from '@apollo/client'
import { memo } from 'react'
import { generatePath, Link } from 'react-router-dom'
import styled from 'styled-components'

import { Status, StatusEnum, Typography } from '~/components/designSystem'
import { CountryCodes } from '~/core/constants/countryCodes'
import { CUSTOMER_DETAILS_ROUTE } from '~/core/router'
import { formatDateToTZ } from '~/core/timezone'
import {
  InvoiceForInvoiceInfosFragment,
  InvoicePaymentStatusTypeEnum,
  InvoiceStatusTypeEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import { ConditionalWrapper } from '../ConditionalWrapper'

gql`
  fragment InvoiceForInvoiceInfos on Invoice {
    number
    issuingDate
    paymentDueDate
    status
    paymentStatus
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

const mapStatusConfig = (status?: InvoiceStatusTypeEnum) => {
  switch (status) {
    case InvoiceStatusTypeEnum.Draft:
      return { label: 'text_63ac8850ff7117ad55777d31', type: StatusEnum.draft }
    case InvoiceStatusTypeEnum.Voided:
      return { label: 'text_6376641a2a9c70fff5bddcd5', type: StatusEnum.voided }
    case InvoiceStatusTypeEnum.Finalized:
      return { label: 'text_65269c2e471133226211fd74', type: StatusEnum.running }
    default:
      return {
        label: '-',
        color: theme.palette.grey[600],
      }
  }
}

const mapPaymentStatusConfig = (status?: InvoicePaymentStatusTypeEnum) => {
  switch (status) {
    case InvoicePaymentStatusTypeEnum.Failed:
      return { label: 'text_63ac8850ff7117ad55777d45', type: StatusEnum.failed }
    case InvoicePaymentStatusTypeEnum.Pending:
      return { label: 'text_63ac8850ff7117ad55777d3b', type: StatusEnum.paused }
    case InvoicePaymentStatusTypeEnum.Succeeded:
      return { label: 'text_63ac86d797f728a87b2f9fa1', type: StatusEnum.running }
    default:
      return {
        label: '-',
        color: theme.palette.grey[600],
      }
  }
}

interface InvoiceCustomerInfosProps {
  invoice?: InvoiceForInvoiceInfosFragment | null
}

export const InvoiceCustomerInfos = memo(({ invoice }: InvoiceCustomerInfosProps) => {
  const { customer } = invoice || {}
  const { translate } = useInternationalization()
  const statusConfig = mapStatusConfig(invoice?.status)
  const paymentStatusConfig = mapPaymentStatusConfig(invoice?.paymentStatus)

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
                    customerId: customer.id,
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
        <InfoLine>
          <Typography variant="caption" color="grey600" noWrap>
            {translate('text_65269b6afe1fda4ad9bf672b')}
          </Typography>
          <Typography variant="body" color="grey700">
            <Status
              type={statusConfig?.type as StatusEnum}
              label={translate(statusConfig?.label || '')}
            />
          </Typography>
        </InfoLine>
        <InfoLine>
          <Typography variant="caption" color="grey600" noWrap>
            {translate('text_63eba8c65a6c8043feee2a0f')}
          </Typography>
          <Typography variant="body" color="grey700">
            {invoice?.status === InvoiceStatusTypeEnum.Draft ||
            invoice?.status === InvoiceStatusTypeEnum.Voided ? (
              <Typography variant="body" color="grey700">
                -
              </Typography>
            ) : (
              <Status
                type={paymentStatusConfig?.type as StatusEnum}
                label={translate(paymentStatusConfig?.label || '')}
              />
            )}
          </Typography>
        </InfoLine>
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
