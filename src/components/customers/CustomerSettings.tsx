import { useRef } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'

import { SideSection } from '~/styles/customer'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Button, Typography } from '~/components/designSystem'
import { theme, NAV_HEIGHT } from '~/styles'
import {
  EditCustomerVatRateFragmentDoc,
  CustomerVatRateFragment,
  CustomerInvoiceGracePeriodFragment,
} from '~/generated/graphql'
import { VAT_RATE_ROUTE } from '~/core/router'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  EditCustomerVatRateDialog,
  EditCustomerVatRateDialogRef,
} from '~/components/customers/EditCustomerVatRateDialog'
import { useCurrentUserInfosVar } from '~/core/apolloClient'

import {
  EditCustomerInvoiceGracePeriodDialog,
  EditCustomerInvoiceGracePeriodDialogRef,
} from './EditCustomerInvoiceGracePeriodDialog'

gql`
  fragment VatRateOrganization on Organization {
    id
    vatRate
    invoiceGracePeriod
  }

  fragment CustomerVatRate on CustomerDetails {
    id
    vatRate
    ...EditCustomerVatRate
  }

  fragment CustomerInvoiceGracePeriod on CustomerDetails {
    id
    invoiceGracePeriod
  }

  ${EditCustomerVatRateFragmentDoc}
`

interface CustomerSettingsProps {
  customer: CustomerVatRateFragment & CustomerInvoiceGracePeriodFragment
}

export const CustomerSettings = ({ customer }: CustomerSettingsProps) => {
  const { translate } = useInternationalization()
  const { currentOrganization } = useCurrentUserInfosVar()

  const editDialogRef = useRef<EditCustomerVatRateDialogRef>(null)
  const editInvoiceGracePeriodDialogRef = useRef<EditCustomerInvoiceGracePeriodDialogRef>(null)

  return (
    <SideSection>
      <InlineSectionTitle>
        <Typography variant="subhead" color="grey700">
          {translate('text_637f819eff19cd55a56d55e6')}
        </Typography>
        <Button
          variant="quaternary"
          size="large"
          onClick={() => editDialogRef?.current?.openDialog()}
        >
          {translate('text_62728ff857d47b013204cab3')}
        </Button>
      </InlineSectionTitle>

      <InfoBlock>
        <Typography variant="body" color="grey700">
          {intlFormatNumber((customer?.vatRate || 0) / 100, {
            minimumFractionDigits: 2,
            style: 'percent',
          })}
        </Typography>
        <Typography
          variant="caption"
          color="grey600"
          html={
            !customer?.vatRate
              ? translate('text_638e13576861f3be8a3d448a', {
                  link: VAT_RATE_ROUTE,
                })
              : translate('text_638dff9779fb99299bee9146')
          }
        />
      </InfoBlock>

      <InlineSectionTitle>
        <Typography variant="subhead" color="grey700">
          {translate('text_638dff9779fb99299bee912e')}
        </Typography>
        <Button
          variant="quaternary"
          size="large"
          onClick={() => editInvoiceGracePeriodDialogRef?.current?.openDialog()}
        >
          {translate('text_638dff9779fb99299bee912a')}
        </Button>
      </InlineSectionTitle>

      <InfoBlock>
        <Typography variant="body" color="grey700">
          {translate(
            'text_638dff9779fb99299bee9132',
            {
              invoiceGracePeriod:
                customer.invoiceGracePeriod || currentOrganization?.invoiceGracePeriod || 0,
            },
            customer.invoiceGracePeriod || currentOrganization?.invoiceGracePeriod || 0
          )}
        </Typography>
        <Typography
          variant="caption"
          color="grey600"
          html={
            !customer.invoiceGracePeriod
              ? translate('text_638e13576861f3be8a3d4492', { link: VAT_RATE_ROUTE })
              : translate('text_638dff9779fb99299bee9136')
          }
        />
      </InfoBlock>

      <EditCustomerVatRateDialog ref={editDialogRef} customer={customer} />
      <EditCustomerInvoiceGracePeriodDialog
        ref={editInvoiceGracePeriodDialogRef}
        invoiceGracePeriod={customer.invoiceGracePeriod}
      />
    </SideSection>
  )
}

const InlineSectionTitle = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const InfoBlock = styled.div<{ $loading?: boolean }>`
  padding-top: ${({ $loading }) => ($loading ? theme.spacing(1) : 0)};
  padding-bottom: ${({ $loading }) => ($loading ? theme.spacing(9) : theme.spacing(8))};
  box-shadow: ${theme.shadows[7]};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(1)};
  }
`
