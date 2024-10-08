import { gql } from '@apollo/client'
import { useRef } from 'react'

import {
  DeleteCustomerFinalizeZeroAmountInvoiceDialog,
  DeleteCustomerFinalizeZeroAmountInvoiceDialogRef,
} from '~/components/customers/DeleteCustomerFinalizeZeroAmountInvoiceDialog'
import {
  EditCustomerVatRateDialog,
  EditCustomerVatRateDialogRef,
} from '~/components/customers/EditCustomerVatRateDialog'
import { Avatar, Button, Icon, Popper, Table, Tooltip, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import {
  EditFinalizeZeroAmountInvoiceDialog,
  EditFinalizeZeroAmountInvoiceDialogRef,
} from '~/components/settings/EditFinalizeZeroAmountInvoiceDialog'
import {
  EditNetPaymentTermDialog,
  EditNetPaymentTermDialogRef,
} from '~/components/settings/EditNetPaymentTermDialog'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { DocumentLocales } from '~/core/translations/documentLocales'
import {
  CustomerForDeleteVatRateDialogFragmentDoc,
  DeleteCustomerDocumentLocaleFragmentDoc,
  DeleteCustomerGracePeriodFragmentDoc,
  DeleteCustomerNetPaymentTermFragmentDoc,
  EditCustomerDocumentLocaleFragmentDoc,
  EditCustomerInvoiceGracePeriodFragmentDoc,
  EditCustomerVatRateFragmentDoc,
  FinalizeZeroAmountInvoiceEnum,
  useGetCustomerSettingsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'
import ErrorImage from '~/public/images/maneki/error.svg'
import { MenuPopper } from '~/styles'

import {
  DeleteCustomerDocumentLocaleDialog,
  DeleteCustomerDocumentLocaleDialogRef,
} from './DeleteCustomerDocumentLocaleDialog'
import {
  DeleteCustomerGracePeriodeDialog,
  DeleteCustomerGracePeriodeDialogRef,
} from './DeleteCustomerGracePeriodeDialog'
import {
  DeleteOrganizationNetPaymentTermDialog,
  DeleteOrganizationNetPaymentTermDialogRef,
} from './DeleteCustomerNetPaymentTermDialog'
import {
  DeleteCustomerVatRateDialog,
  DeleteCustomerVatRateDialogRef,
} from './DeleteCustomerVatRateDialog'
import {
  EditCustomerDocumentLocaleDialog,
  EditCustomerDocumentLocaleDialogRef,
} from './EditCustomerDocumentLocaleDialog'
import {
  EditCustomerInvoiceGracePeriodDialog,
  EditCustomerInvoiceGracePeriodDialogRef,
} from './EditCustomerInvoiceGracePeriodDialog'

import {
  SettingsListItem,
  SettingsListItemHeader,
  SettingsListItemLoadingSkeleton,
  SettingsListWrapper,
  SettingsPaddedContainer,
} from '../layouts/Settings'

gql`
  fragment CustomerAppliedTaxRatesForSettings on Customer {
    id
    taxes {
      id
      name
      code
      rate
      autoGenerated
    }
  }

  query getCustomerSettings($id: ID!) {
    customer(id: $id) {
      id
      invoiceGracePeriod
      netPaymentTerm
      finalizeZeroAmountInvoice

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
      ...CustomerForDeleteVatRateDialog
      ...DeleteCustomerNetPaymentTerm
    }

    organization {
      id
      netPaymentTerm
      finalizeZeroAmountInvoice
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
  ${CustomerForDeleteVatRateDialogFragmentDoc}
  ${DeleteCustomerNetPaymentTermFragmentDoc}
`

interface CustomerSettingsProps {
  customerId: string
}

export const CustomerSettings = ({ customerId }: CustomerSettingsProps) => {
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()
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
  const deleteCustomerDocumentLocale = useRef<DeleteCustomerDocumentLocaleDialogRef>(null)
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const editNetPaymentTermDialogRef = useRef<EditNetPaymentTermDialogRef>(null)
  const deleteOrganizationNetPaymentTermDialogRef =
    useRef<DeleteOrganizationNetPaymentTermDialogRef>(null)
  const editFinalizeZeroAmountInvoiceDialogRef =
    useRef<EditFinalizeZeroAmountInvoiceDialogRef>(null)
  const deleteCustomerFinalizeZeroAmountInvoiceDialogRef =
    useRef<DeleteCustomerFinalizeZeroAmountInvoiceDialogRef>(null)

  if (!!error && !loading) {
    return (
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
    <>
      <SettingsPaddedContainer className="max-w-full px-0 md:px-0">
        <SettingsListWrapper>
          {!!loading ? (
            <SettingsListItemLoadingSkeleton count={2} />
          ) : (
            <>
              {/* Document language */}
              <SettingsListItem>
                <SettingsListItemHeader
                  label={translate('text_63e51ef4985f0ebd75c212fd')}
                  sublabel={translate('text_1728031300577ipb2cxnths3')}
                  action={
                    hasPermissions(['customerSettingsUpdateLang']) ? (
                      <>
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
                            {translate('text_645bb193927b375079d28ad2')}
                          </Button>
                        ) : (
                          <Popper
                            PopperProps={{ placement: 'bottom-end' }}
                            opener={
                              <Button
                                disabled={loading}
                                icon="dots-horizontal"
                                variant="quaternary"
                              />
                            }
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
                      </>
                    ) : undefined
                  }
                />

                <Typography variant="body" color="grey700">
                  {!!customer?.billingConfiguration?.documentLocale
                    ? DocumentLocales[customer?.billingConfiguration?.documentLocale]
                    : translate('text_1728374331992d2alok9y3kr', {
                        value: DocumentLocales['en'],
                      })}
                </Typography>
              </SettingsListItem>
            </>
          )}

          {/* Finalize empty invoice setting */}
          <SettingsListItem>
            <SettingsListItemHeader
              label={translate('text_1725549671287r9tnu5cuoeu')}
              sublabel={translate('text_1725538340200495slgen6ji')}
              action={
                customer?.finalizeZeroAmountInvoice === FinalizeZeroAmountInvoiceEnum.Inherit ? (
                  <Button
                    disabled={loading}
                    variant="quaternary"
                    onClick={() => editFinalizeZeroAmountInvoiceDialogRef?.current?.openDialog()}
                  >
                    {translate('text_645bb193927b375079d28ad2')}
                  </Button>
                ) : (
                  <Popper
                    PopperProps={{ placement: 'bottom-end' }}
                    opener={
                      <Button disabled={loading} icon="dots-horizontal" variant="quaternary" />
                    }
                  >
                    {({ closePopper }) => (
                      <MenuPopper>
                        <Button
                          disabled={loading}
                          startIcon="pen"
                          variant="quaternary"
                          align="left"
                          onClick={() => {
                            editFinalizeZeroAmountInvoiceDialogRef?.current?.openDialog()
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
                            deleteCustomerFinalizeZeroAmountInvoiceDialogRef?.current?.openDialog()
                            closePopper()
                          }}
                        >
                          {translate('text_63aa15caab5b16980b21b0ba')}
                        </Button>
                      </MenuPopper>
                    )}
                  </Popper>
                )
              }
            />

            <Typography variant="body" color="grey700">
              {customer?.finalizeZeroAmountInvoice === FinalizeZeroAmountInvoiceEnum.Inherit ? (
                <>
                  {organization?.finalizeZeroAmountInvoice
                    ? translate('text_1725549671287ancbf00edxx')
                    : translate('text_1725549671288zkq9sr0y46l')}
                  {` ${translate('text_17255500892009uqfqttms4w')}`}
                </>
              ) : (
                <>
                  {customer?.finalizeZeroAmountInvoice === FinalizeZeroAmountInvoiceEnum.Finalize
                    ? translate('text_1725549671287ancbf00edxx')
                    : translate('text_1725549671288zkq9sr0y46l')}
                </>
              )}
            </Typography>
          </SettingsListItem>

          {/* Grace period */}
          <SettingsListItem>
            <SettingsListItemHeader
              label={translate('text_638dc196fb209d551f3d8141')}
              sublabel={translate('text_1728031300577ozl3dbfygr7')}
              action={
                hasPermissions(['customerSettingsUpdateGracePeriod']) ? (
                  <>
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
                        {translate('text_645bb193927b375079d28ad2')}
                      </Button>
                    ) : (
                      <Popper
                        PopperProps={{ placement: 'bottom-end' }}
                        opener={
                          <Button disabled={loading} icon="dots-horizontal" variant="quaternary" />
                        }
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
                  </>
                ) : undefined
              }
            />

            <Typography variant="body" color="grey700">
              {typeof customer?.invoiceGracePeriod === 'number'
                ? translate(
                    'text_638dff9779fb99299bee9132',
                    {
                      invoiceGracePeriod: customer?.invoiceGracePeriod,
                    },
                    customer?.invoiceGracePeriod,
                  )
                : translate(
                    'text_63aa085d28b8510cd464440d',
                    {
                      invoiceGracePeriod:
                        organization?.billingConfiguration?.invoiceGracePeriod || 0,
                    },
                    organization?.billingConfiguration?.invoiceGracePeriod || 0,
                  )}
            </Typography>
          </SettingsListItem>

          {/* Net payment term */}
          <SettingsListItem>
            <SettingsListItemHeader
              label={translate('text_64c7a89b6c67eb6c98898167')}
              sublabel={translate('text_1728031300577aivplw3hqav')}
              action={
                hasPermissions(['customerSettingsUpdatePaymentTerms']) ? (
                  <>
                    {typeof customer?.netPaymentTerm !== 'number' ? (
                      <Button
                        disabled={loading}
                        variant="quaternary"
                        onClick={() => editNetPaymentTermDialogRef?.current?.openDialog(customer)}
                      >
                        {translate('text_645bb193927b375079d28ad2')}
                      </Button>
                    ) : (
                      <Popper
                        PopperProps={{ placement: 'bottom-end' }}
                        opener={
                          <Button disabled={loading} icon="dots-horizontal" variant="quaternary" />
                        }
                      >
                        {({ closePopper }) => (
                          <MenuPopper>
                            <Button
                              disabled={loading}
                              startIcon="pen"
                              variant="quaternary"
                              align="left"
                              onClick={() => {
                                editNetPaymentTermDialogRef?.current?.openDialog(customer)
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
                                deleteOrganizationNetPaymentTermDialogRef?.current?.openDialog()
                                closePopper()
                              }}
                            >
                              {translate('text_63aa15caab5b16980b21b0ba')}
                            </Button>
                          </MenuPopper>
                        )}
                      </Popper>
                    )}
                  </>
                ) : undefined
              }
            />

            <Typography variant="body" color="grey700">
              {typeof customer?.netPaymentTerm !== 'number'
                ? translate(
                    'text_64c7a89b6c67eb6c98898241',
                    {
                      days: organization?.netPaymentTerm,
                    },
                    organization?.netPaymentTerm,
                  )
                : customer?.netPaymentTerm === 0
                  ? translate('text_64c7a89b6c67eb6c98898125')
                  : translate(
                      'text_64c7a89b6c67eb6c9889815f',
                      {
                        days: customer?.netPaymentTerm,
                      },
                      customer?.netPaymentTerm,
                    )}
            </Typography>
          </SettingsListItem>

          {/* Tax */}
          <SettingsListItem>
            <SettingsListItemHeader
              label={translate('text_637f819eff19cd55a56d55e6')}
              sublabel={translate('text_1728031300577obxo6934yo7')}
              action={
                hasPermissions(['customerSettingsUpdateTaxRates']) ? (
                  <Button
                    variant="quaternary"
                    disabled={loading}
                    onClick={() => editVATDialogRef?.current?.openDialog()}
                    data-test="add-vat-rate-button"
                  >
                    {translate('text_62728ff857d47b013204cab3')}
                  </Button>
                ) : undefined
              }
            />

            {!customer?.taxes?.length ? (
              <Typography variant="body" color="grey700">
                {translate('text_64639f5e63a5cc0076779db7')}
              </Typography>
            ) : (
              <Table
                name="invoice-settings-taxes"
                containerSize={{ default: 0 }}
                rowSize={72}
                data={customer?.taxes}
                columns={[
                  {
                    key: 'name',
                    title: translate('text_17280312664187sb64qzmyhy'),
                    maxSpace: true,
                    content: ({ name, code }) => (
                      <div className="flex flex-1 items-center gap-3">
                        <Avatar size="big" variant="connector">
                          <Icon size="medium" name="percentage" color="dark" />
                        </Avatar>
                        <div>
                          <Typography color="textSecondary" variant="bodyHl" noWrap>
                            {name}
                          </Typography>
                          <Typography variant="caption" noWrap>
                            {code}
                          </Typography>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'rate',
                    textAlign: 'right',
                    title: translate('text_64de472463e2da6b31737de0'),
                    content: ({ rate }) => (
                      <Typography variant="body" color="grey700">
                        {intlFormatNumber((rate || 0) / 100, {
                          style: 'percent',
                        })}
                      </Typography>
                    ),
                  },
                ]}
                actionColumn={
                  hasPermissions(['customerSettingsUpdateTaxRates'])
                    ? (row) => {
                        return (
                          <Tooltip
                            placement="top-end"
                            title={translate('text_64639cfe2e46e9007d11b49d')}
                          >
                            <Button
                              icon="trash"
                              variant="quaternary"
                              disabled={row.autoGenerated}
                              onClick={() => {
                                deleteVatRateDialogRef.current?.openDialog(row)
                              }}
                            />
                          </Tooltip>
                        )
                      }
                    : undefined
                }
              />
            )}
          </SettingsListItem>
        </SettingsListWrapper>
      </SettingsPaddedContainer>

      {!!customer && (
        <>
          <EditCustomerVatRateDialog
            ref={editVATDialogRef}
            customer={customer}
            appliedTaxRatesTaxesIds={customer.taxes?.map((t) => t.id)}
          />
          <DeleteCustomerVatRateDialog ref={deleteVatRateDialogRef} customer={customer} />

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
          <EditNetPaymentTermDialog
            ref={editNetPaymentTermDialogRef}
            description={translate('text_64c7a89b6c67eb6c988980eb')}
          />
          <DeleteOrganizationNetPaymentTermDialog
            ref={deleteOrganizationNetPaymentTermDialogRef}
            customer={customer}
          />
          <EditFinalizeZeroAmountInvoiceDialog
            ref={editFinalizeZeroAmountInvoiceDialogRef}
            entity={customer}
            finalizeZeroAmountInvoice={customer?.finalizeZeroAmountInvoice}
          />
          <DeleteCustomerFinalizeZeroAmountInvoiceDialog
            ref={deleteCustomerFinalizeZeroAmountInvoiceDialogRef}
            customer={customer}
          />
        </>
      )}
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </>
  )
}
