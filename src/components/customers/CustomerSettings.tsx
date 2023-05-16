import { useRef } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'

import { SideSection } from '~/styles/customer'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  Button,
  Typography,
  Popper,
  Skeleton,
  Avatar,
  Icon,
  Tooltip,
} from '~/components/designSystem'
import { theme, NAV_HEIGHT, MenuPopper } from '~/styles'
import {
  DeleteCustomerDocumentLocaleFragmentDoc,
  DeleteCustomerGracePeriodFragmentDoc,
  EditCustomerDocumentLocaleFragmentDoc,
  EditCustomerInvoiceGracePeriodFragmentDoc,
  EditCustomerVatRateFragmentDoc,
  useGetCustomerSettingsQuery,
} from '~/generated/graphql'
import { INVOICE_SETTINGS_ROUTE } from '~/core/router'
import {
  EditCustomerVatRateDialog,
  EditCustomerVatRateDialogRef,
} from '~/components/customers/EditCustomerVatRateDialog'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import ErrorImage from '~/public/images/maneki/error.svg'
import { DocumentLocales } from '~/core/translations/documentLocales'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'

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
import {
  EditCustomerDocumentLocaleDialog,
  EditCustomerDocumentLocaleDialogRef,
} from './EditCustomerDocumentLocaleDialog'
import { DeleteCustomerDocumentLocaleDialog } from './DeleteCustomerDocumentLocaleDialog'

import { GenericPlaceholder } from '../GenericPlaceholder'

gql`
  fragment CustomerAppliedTaxRatesForSettings on Customer {
    id
    appliedTaxes {
      id
      tax {
        id
        name
        code
        rate
      }
    }
  }

  query getCustomerSettings($id: ID!) {
    customer(id: $id) {
      id
      invoiceGracePeriod
      billingConfiguration {
        id
        documentLocale
      }

      ...CustomerAppliedTaxRatesForSettings

      ...EditCustomerVatRate
      ...EditCustomerDocumentLocale
      ...EditCustomerInvoiceGracePeriod
      ...DeleteCustomerGracePeriod
      ...DeleteCustomerDocumentLocale
    }

    organization {
      id
      billingConfiguration {
        id
        invoiceGracePeriod
        documentLocale
      }
    }
  }

  ${EditCustomerVatRateFragmentDoc}
  ${EditCustomerInvoiceGracePeriodFragmentDoc}
  ${EditCustomerDocumentLocaleFragmentDoc}
  ${DeleteCustomerGracePeriodFragmentDoc}
  ${DeleteCustomerDocumentLocaleFragmentDoc}
`

interface CustomerSettingsProps {
  customerId: string
}

export const CustomerSettings = ({ customerId }: CustomerSettingsProps) => {
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const { data, loading, error } = useGetCustomerSettingsQuery({
    variables: { id: customerId as string },
    skip: !customerId,
  })
  const customer = data?.customer
  const organization = data?.organization
  const editVATDialogRef = useRef<EditCustomerVatRateDialogRef>(null)
  const deleteVatRateDialogRef = useRef<DeleteCustomerVatRateDialogRef>(null)
  const editInvoiceGracePeriodDialogRef = useRef<EditCustomerInvoiceGracePeriodDialogRef>(null)
  const deleteGracePeriodDialogRef = useRef<DeleteCustomerGracePeriodeDialogRef>(null)
  const editCustomerDocumentLocale = useRef<EditCustomerDocumentLocaleDialogRef>(null)
  const deleteCustomerDocumentLocale = useRef<DeleteCustomerGracePeriodeDialogRef>(null)
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)

  {
    !!error && !loading && (
      <GenericPlaceholder
        title={translate('text_62c3f3fca8a1625624e83379')}
        subtitle={translate('text_62c3f3fca8a1625624e8337e')}
        buttonTitle={translate('text_62c3f3fca8a1625624e83382')}
        buttonVariant="primary"
        buttonAction={() => location.reload()}
        image={<ErrorImage width="136" height="104" />}
      />
    )
  }

  return (
    <SideSection>
      <InlineSectionTitle>
        <Typography variant="subhead" color="grey700">
          {translate('text_637f819eff19cd55a56d55e6')}
        </Typography>
        <Button
          variant="quaternary"
          disabled={loading}
          onClick={() => editVATDialogRef?.current?.openDialog()}
          data-test="add-vat-rate-button"
        >
          {translate('text_62728ff857d47b013204cab3')}
        </Button>
      </InlineSectionTitle>

      <InfoBlock $loading={loading} $hasSeparator={!customer?.appliedTaxes?.length}>
        {loading ? (
          <>
            <Skeleton variant="text" width={320} height={12} marginBottom={theme.spacing(4)} />
            <Skeleton variant="text" width={160} height={12} />
          </>
        ) : (
          <>
            {!customer?.appliedTaxes?.length ? (
              <Typography variant="caption" color="grey600">
                {translate('text_64639f5e63a5cc0076779db7')}
              </Typography>
            ) : (
              <>
                {customer.appliedTaxes?.map(({ id, tax }) => (
                  <TaxRateItem key={`tax-rate-item-${tax.id}`}>
                    <LeftSection>
                      <Avatar size="big" variant="connector">
                        <Icon size="medium" name="percentage" color="dark" />
                      </Avatar>
                      <div>
                        <Typography color="textSecondary" variant="bodyHl" noWrap>
                          {tax.name}
                        </Typography>
                        <Typography variant="caption" noWrap>
                          {tax.code}
                        </Typography>
                      </div>
                    </LeftSection>
                    <RightSection>
                      <Typography variant="body" color="grey700">
                        {intlFormatNumber((tax.rate || 0) / 100, {
                          minimumFractionDigits: 2,
                          style: 'percent',
                        })}
                      </Typography>
                      <Tooltip
                        placement="top-end"
                        title={translate('text_64639cfe2e46e9007d11b49d')}
                      >
                        <Button
                          icon="trash"
                          variant="quaternary"
                          onClick={() => {
                            deleteVatRateDialogRef.current?.openDialog(id, tax)
                          }}
                        />
                      </Tooltip>
                    </RightSection>
                  </TaxRateItem>
                ))}
              </>
            )}
          </>
        )}
      </InfoBlock>

      <InlineSectionTitle>
        <Typography variant="subhead" color="grey700">
          {translate('text_638dff9779fb99299bee912e')}
        </Typography>
        {typeof customer?.invoiceGracePeriod !== 'number' ? (
          <Button
            disabled={loading}
            variant="quaternary"
            endIcon={isPremium ? undefined : 'sparkles'}
            onClick={() =>
              isPremium
                ? editInvoiceGracePeriodDialogRef?.current?.openDialog()
                : premiumWarningDialogRef.current?.openDialog()
            }
          >
            {translate('text_638dff9779fb99299bee912a')}
          </Button>
        ) : (
          <Popper
            PopperProps={{ placement: 'bottom-end' }}
            opener={<Button disabled={loading} icon="dots-horizontal" variant="quaternary" />}
          >
            {({ closePopper }) => (
              <MenuPopper>
                <Button
                  disabled={loading}
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
                  disabled={loading}
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

      <InfoBlock $hasSeparator $loading={loading}>
        {loading ? (
          <>
            <Skeleton variant="text" width={320} height={12} marginBottom={theme.spacing(4)} />
            <Skeleton variant="text" width={160} height={12} />
          </>
        ) : (
          <>
            <Typography variant="body" color="grey700">
              {typeof customer?.invoiceGracePeriod === 'number'
                ? translate(
                    'text_638dff9779fb99299bee9132',
                    {
                      invoiceGracePeriod: customer?.invoiceGracePeriod,
                    },
                    customer?.invoiceGracePeriod
                  )
                : translate(
                    'text_63aa085d28b8510cd464440d',
                    {
                      invoiceGracePeriod:
                        organization?.billingConfiguration?.invoiceGracePeriod || 0,
                    },
                    organization?.billingConfiguration?.invoiceGracePeriod || 0
                  )}
            </Typography>
            <Typography
              variant="caption"
              color="grey600"
              html={
                typeof customer?.invoiceGracePeriod !== 'number'
                  ? translate('text_638e13576861f3be8a3d4492', { link: INVOICE_SETTINGS_ROUTE })
                  : translate('text_638dff9779fb99299bee9136')
              }
            />
          </>
        )}
      </InfoBlock>

      <InlineSectionTitle>
        <Typography variant="subhead" color="grey700">
          {translate('text_63ea0f84f400488553caa765')}
        </Typography>
        {typeof customer?.billingConfiguration?.documentLocale !== 'string' ? (
          <Button
            disabled={loading}
            variant="quaternary"
            endIcon={isPremium ? undefined : 'sparkles'}
            onClick={() =>
              isPremium
                ? editCustomerDocumentLocale?.current?.openDialog()
                : premiumWarningDialogRef.current?.openDialog()
            }
          >
            {translate('text_63ea0f84f400488553caa761')}
          </Button>
        ) : (
          <Popper
            PopperProps={{ placement: 'bottom-end' }}
            opener={<Button disabled={loading} icon="dots-horizontal" variant="quaternary" />}
          >
            {({ closePopper }) => (
              <MenuPopper>
                <Button
                  disabled={loading}
                  startIcon="pen"
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    editCustomerDocumentLocale.current?.openDialog()
                    closePopper()
                  }}
                >
                  {translate('text_63ea0f84f400488553caa785')}
                </Button>
                <Button
                  disabled={loading}
                  startIcon="trash"
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    deleteCustomerDocumentLocale.current?.openDialog()
                    closePopper()
                  }}
                >
                  {translate('text_63ea0f84f400488553caa786')}
                </Button>
              </MenuPopper>
            )}
          </Popper>
        )}
      </InlineSectionTitle>

      <InfoBlock $hasSeparator $loading={loading}>
        {loading ? (
          <>
            <Skeleton variant="text" width={320} height={12} marginBottom={theme.spacing(4)} />
            <Skeleton variant="text" width={160} height={12} />
          </>
        ) : (
          <>
            <Typography variant="body" color="grey700">
              {typeof customer?.billingConfiguration?.documentLocale === 'string'
                ? DocumentLocales[customer.billingConfiguration.documentLocale]
                : translate('text_63ea0f84f400488553caa773', {
                    locale:
                      DocumentLocales[
                        organization?.billingConfiguration?.documentLocale || DocumentLocales['en']
                      ],
                  })}
            </Typography>
            <Typography
              variant="caption"
              color="grey600"
              html={
                typeof customer?.billingConfiguration?.documentLocale === 'string'
                  ? translate('text_63ea0f84f400488553caa781')
                  : translate('text_63ea0f84f400488553caa778', { link: INVOICE_SETTINGS_ROUTE })
              }
            />
          </>
        )}
      </InfoBlock>

      {!!customer && (
        <>
          <EditCustomerVatRateDialog
            ref={editVATDialogRef}
            customer={customer}
            appliedTaxRatesTaxesIds={customer.appliedTaxes?.map((t) => t.tax.id)}
          />
          <DeleteCustomerVatRateDialog ref={deleteVatRateDialogRef} />

          <EditCustomerInvoiceGracePeriodDialog
            ref={editInvoiceGracePeriodDialogRef}
            invoiceGracePeriod={customer?.invoiceGracePeriod}
          />
          <EditCustomerDocumentLocaleDialog ref={editCustomerDocumentLocale} customer={customer} />
          <DeleteCustomerGracePeriodeDialog ref={deleteGracePeriodDialogRef} customer={customer} />
          <DeleteCustomerDocumentLocaleDialog
            ref={deleteCustomerDocumentLocale}
            customer={customer}
          />
        </>
      )}
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </SideSection>
  )
}

const InlineSectionTitle = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const InfoBlock = styled.div<{ $loading?: boolean; $hasSeparator?: boolean }>`
  padding-top: ${({ $loading }) => ($loading ? theme.spacing(1) : 0)};
  padding-bottom: ${({ $loading, $hasSeparator }) =>
    $loading ? theme.spacing(9) : $hasSeparator ? theme.spacing(8) : 0};
  box-shadow: ${({ $hasSeparator }) => ($hasSeparator ? theme.shadows[7] : 'none')};

  > *:not(:last-child) {
    margin-bottom: ${({ $loading }) => ($loading ? theme.spacing(4) : theme.spacing(1))};
  }
`

const TaxRateItem = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: ${theme.shadows[7]};
`

const LeftSection = styled.div`
  display: flex;
  column-gap: ${theme.spacing(3)};
  align-items: center;
  flex: 1;
`

const RightSection = styled.div`
  display: flex;
  column-gap: ${theme.spacing(3)};
  align-items: center;
  flex: 1;
  justify-content: flex-end;
`
