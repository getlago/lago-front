import { useRef } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'

import { SideSection } from '~/styles/customer'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Button, Typography, Popper } from '~/components/designSystem'
import { theme, NAV_HEIGHT, MenuPopper } from '~/styles'
import {
  EditCustomerVatRateFragmentDoc,
  CustomerVatRateFragment,
  CustomerInvoiceGracePeriodFragment,
  useGetOrganizationSettingsForCustomerQuery,
} from '~/generated/graphql'
import { INVOICE_SETTINGS_ROUTE } from '~/core/router'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  EditCustomerVatRateDialog,
  EditCustomerVatRateDialogRef,
} from '~/components/customers/EditCustomerVatRateDialog'

import {
  EditCustomerInvoiceGracePeriodDialog,
  EditCustomerInvoiceGracePeriodDialogRef,
} from './EditCustomerInvoiceGracePeriodDialog'
import {
  DeleteCustomerVatRateDialog,
  DeleteCustomerVatRateDialogRef,
} from './DeleteCustomerVatRateDialog'
import {
  DeleteCustomerGracePeriodeDialog,
  DeleteCustomerGracePeriodeDialogRef,
} from './DeleteCustomerGracePeriodeDialog'

gql`
  fragment CustomerVatRate on CustomerDetails {
    id
    vatRate
    ...EditCustomerVatRate
  }

  fragment CustomerInvoiceGracePeriod on CustomerDetails {
    id
    invoiceGracePeriod
  }

  query getOrganizationSettingsForCustomer {
    organization {
      id
      vatRate
      invoiceGracePeriod
    }
  }

  ${EditCustomerVatRateFragmentDoc}
`

interface CustomerSettingsProps {
  customer: CustomerVatRateFragment & CustomerInvoiceGracePeriodFragment
}

export const CustomerSettings = ({ customer }: CustomerSettingsProps) => {
  const { translate } = useInternationalization()
  const { data } = useGetOrganizationSettingsForCustomerQuery()
  const currentOrganization = data?.organization

  const editDialogRef = useRef<EditCustomerVatRateDialogRef>(null)
  const deleteVatRateDialogRef = useRef<DeleteCustomerVatRateDialogRef>(null)
  const editInvoiceGracePeriodDialogRef = useRef<EditCustomerInvoiceGracePeriodDialogRef>(null)
  const deleteGracePeriodDialogRef = useRef<DeleteCustomerGracePeriodeDialogRef>(null)

  return (
    <SideSection>
      <InlineSectionTitle>
        <Typography variant="subhead" color="grey700">
          {translate('text_637f819eff19cd55a56d55e6')}
        </Typography>
        {typeof customer?.vatRate !== 'number' ? (
          <Button
            variant="quaternary"
            size="large"
            onClick={() => editDialogRef?.current?.openDialog()}
          >
            {translate('text_62728ff857d47b013204cab3')}
          </Button>
        ) : (
          <Popper
            PopperProps={{ placement: 'bottom-end' }}
            opener={<Button icon="dots-horizontal" variant="quaternary" />}
          >
            {({ closePopper }) => (
              <MenuPopper>
                <Button
                  startIcon="pen"
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    editDialogRef.current?.openDialog()
                    closePopper()
                  }}
                >
                  {translate('text_63aa085d28b8510cd46443f7')}
                </Button>
                <Button
                  startIcon="trash"
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    deleteVatRateDialogRef.current?.openDialog()
                    closePopper()
                  }}
                >
                  {translate('text_63aa085d28b8510cd46443ff')}
                </Button>
              </MenuPopper>
            )}
          </Popper>
        )}
      </InlineSectionTitle>

      <InfoBlock>
        <Typography variant="body" color="grey700">
          {typeof customer?.vatRate !== 'number'
            ? translate('text_63aa085d28b8510cd46443ed', {
                rate: intlFormatNumber((currentOrganization?.vatRate || 0) / 100, {
                  minimumFractionDigits: 2,
                  style: 'percent',
                }),
              })
            : intlFormatNumber((customer?.vatRate || 0) / 100, {
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
                  link: INVOICE_SETTINGS_ROUTE,
                })
              : translate('text_638dff9779fb99299bee9146')
          }
        />
      </InfoBlock>

      <InlineSectionTitle>
        <Typography variant="subhead" color="grey700">
          {translate('text_638dff9779fb99299bee912e')}
        </Typography>
        {typeof customer.invoiceGracePeriod !== 'number' ? (
          <Button
            variant="quaternary"
            size="large"
            disabled // TODO - change when pricing is set
            onClick={() => editInvoiceGracePeriodDialogRef?.current?.openDialog()}
          >
            {translate('text_638dff9779fb99299bee912a')}
          </Button>
        ) : (
          <Popper
            PopperProps={{ placement: 'bottom-end' }}
            opener={<Button icon="dots-horizontal" variant="quaternary" />}
          >
            {({ closePopper }) => (
              <MenuPopper>
                <Button
                  startIcon="pen"
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    editInvoiceGracePeriodDialogRef.current?.openDialog()
                    closePopper()
                  }}
                >
                  {translate('text_63aa15caab5b16980b21b0b8')}
                </Button>
                <Button
                  startIcon="trash"
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    deleteGracePeriodDialogRef.current?.openDialog()
                    closePopper()
                  }}
                >
                  {translate('text_63aa15caab5b16980b21b0ba')}
                </Button>
              </MenuPopper>
            )}
          </Popper>
        )}
      </InlineSectionTitle>

      <InfoBlock>
        <Typography variant="body" color="grey700">
          {typeof customer.invoiceGracePeriod === 'number'
            ? translate(
                'text_638dff9779fb99299bee9132',
                {
                  invoiceGracePeriod: customer.invoiceGracePeriod,
                },
                customer.invoiceGracePeriod
              )
            : translate(
                'text_63aa085d28b8510cd464440d',
                {
                  invoiceGracePeriod: currentOrganization?.invoiceGracePeriod || 0,
                },
                currentOrganization?.invoiceGracePeriod || 0
              )}
        </Typography>
        <Typography
          variant="caption"
          color="grey600"
          html={
            !customer.invoiceGracePeriod
              ? translate('text_638e13576861f3be8a3d4492', { link: INVOICE_SETTINGS_ROUTE })
              : translate('text_638dff9779fb99299bee9136')
          }
        />
      </InfoBlock>

      <EditCustomerVatRateDialog ref={editDialogRef} customer={customer} />
      <DeleteCustomerVatRateDialog ref={deleteVatRateDialogRef} customer={customer} />

      <EditCustomerInvoiceGracePeriodDialog
        ref={editInvoiceGracePeriodDialogRef}
        invoiceGracePeriod={customer.invoiceGracePeriod || 0}
      />
      <DeleteCustomerGracePeriodeDialog ref={deleteGracePeriodDialogRef} customer={customer} />
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
