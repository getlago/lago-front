import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import {
  Avatar,
  Button,
  Chip,
  Icon,
  ShowMoreText,
  Table,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { PageBannerHeaderWithBurgerMenu } from '~/components/layouts/CenteredPage'
import {
  SettingsListItem,
  SettingsListItemHeader,
  SettingsListItemLoadingSkeleton,
  SettingsListWrapper,
  SettingsPaddedContainer,
  SettingsPageHeaderContainer,
} from '~/components/layouts/Settings'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import {
  AddOrganizationVatRateDialog,
  AddOrganizationVatRateDialogRef,
} from '~/components/settings/invoices/AddOrganizationVatRateDialog'
import {
  DefaultCustomSectionDialog,
  DefaultCustomSectionDialogRef,
} from '~/components/settings/invoices/DefaultCustomSectionDialog'
import {
  DeleteCustomSectionDialog,
  DeleteCustomSectionDialogRef,
} from '~/components/settings/invoices/DeleteCustomSectionDialog'
import {
  DeleteOrganizationVatRateDialog,
  DeleteOrganizationVatRateDialogRef,
} from '~/components/settings/invoices/DeleteOrganizationVatRateDialog'
import {
  EditDefaultCurrencyDialog,
  EditDefaultCurrencyDialogRef,
} from '~/components/settings/invoices/EditDefaultCurrencyDialog'
import {
  EditFinalizeZeroAmountInvoiceDialog,
  EditFinalizeZeroAmountInvoiceDialogRef,
} from '~/components/settings/invoices/EditFinalizeZeroAmountInvoiceDialog'
import {
  EditNetPaymentTermDialog,
  EditNetPaymentTermDialogRef,
} from '~/components/settings/invoices/EditNetPaymentTermDialog'
import {
  EditOrganizationDocumentLocaleDialog,
  EditOrganizationDocumentLocaleDialogRef,
} from '~/components/settings/invoices/EditOrganizationDocumentLocaleDialog'
import {
  EditOrganizationGracePeriodDialog,
  EditOrganizationGracePeriodDialogRef,
} from '~/components/settings/invoices/EditOrganizationGracePeriodDialog'
import {
  EditOrganizationInvoiceNumberingDialog,
  EditOrganizationInvoiceNumberingDialogRef,
} from '~/components/settings/invoices/EditOrganizationInvoiceNumberingDialog'
import {
  EditOrganizationInvoiceTemplateDialog,
  EditOrganizationInvoiceTemplateDialogRef,
} from '~/components/settings/invoices/EditOrganizationInvoiceTemplateDialog'
import { addToast } from '~/core/apolloClient'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CREATE_INVOICE_CUSTOM_SECTION, EDIT_INVOICE_CUSTOM_SECTION } from '~/core/router'
import { DocumentLocales } from '~/core/translations/documentLocales'
import { getInvoiceNumberPreview } from '~/core/utils/invoiceNumberPreview'
import {
  DeleteCustomSectionFragmentDoc,
  DeleteOrganizationVatRateFragmentDoc,
  DocumentNumberingEnum,
  EditOrganizationDefaultCurrencyForDialogFragmentDoc,
  EditOrganizationInvoiceNumberingDialogFragmentDoc,
  EditOrganizationInvoiceTemplateDialogFragmentDoc,
  EditOrganizationNetPaymentTermForDialogFragmentDoc,
  useGetOrganizationSettingsQuery,
  useUpdateInvoiceCustomSectionMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'
import ErrorImage from '~/public/images/maneki/error.svg'
import { tw } from '~/styles/utils'

const MAX_FOOTER_LENGTH_DISPLAY_LIMIT = 200

const InvoiceNumberingTypeLabelTranslationKey = {
  [DocumentNumberingEnum.PerCustomer]: 'text_6566f920a1d6c35693d6cdca',
  [DocumentNumberingEnum.PerOrganization]: 'text_6566f920a1d6c35693d6cd26',
}

gql`
  query getOrganizationSettings($appliedToOrganization: Boolean = true) {
    organization {
      id
      netPaymentTerm
      defaultCurrency
      documentNumbering
      documentNumberPrefix
      finalizeZeroAmountInvoice
      billingConfiguration {
        id
        invoiceGracePeriod
        invoiceFooter
        documentLocale
      }
      ...EditOrganizationInvoiceTemplateDialog
      ...EditOrganizationNetPaymentTermForDialog
      ...EditOrganizationDefaultCurrencyForDialog
      ...EditOrganizationInvoiceNumberingDialog
    }

    taxes(appliedToOrganization: $appliedToOrganization) {
      collection {
        id
        name
        code
        rate

        ...DeleteOrganizationVatRate
      }
    }

    invoiceCustomSections {
      collection {
        id
        name
        code
        selected

        ...DeleteCustomSection
      }
    }
  }

  mutation updateInvoiceCustomSectionSelection($input: UpdateInvoiceCustomSectionInput!) {
    updateInvoiceCustomSection(input: $input) {
      id
      selected
    }
  }

  ${DeleteOrganizationVatRateFragmentDoc}
  ${DeleteCustomSectionFragmentDoc}
  ${EditOrganizationInvoiceTemplateDialogFragmentDoc}
  ${EditOrganizationNetPaymentTermForDialogFragmentDoc}
  ${EditOrganizationDefaultCurrencyForDialogFragmentDoc}
  ${EditOrganizationInvoiceNumberingDialogFragmentDoc}
`

const InvoiceSettings = () => {
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const navigate = useNavigate()
  const editVATDialogRef = useRef<AddOrganizationVatRateDialogRef>(null)
  const deleteVATDialogRef = useRef<DeleteOrganizationVatRateDialogRef>(null)
  const editInvoiceTemplateDialogRef = useRef<EditOrganizationInvoiceTemplateDialogRef>(null)
  const editInvoiceNumberingDialogRef = useRef<EditOrganizationInvoiceNumberingDialogRef>(null)
  const editGracePeriodDialogRef = useRef<EditOrganizationGracePeriodDialogRef>(null)
  const editDefaultCurrencyDialogRef = useRef<EditDefaultCurrencyDialogRef>(null)
  const editDocumentLanguageDialogRef = useRef<EditOrganizationDocumentLocaleDialogRef>(null)
  const editNetPaymentTermDialogRef = useRef<EditNetPaymentTermDialogRef>(null)
  const editFinalizeZeroAmountInvoiceDialogRef =
    useRef<EditFinalizeZeroAmountInvoiceDialogRef>(null)
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const defaultCustomSectionDialogRef = useRef<DefaultCustomSectionDialogRef>(null)
  const deleteCustomSectionDialogRef = useRef<DeleteCustomSectionDialogRef>(null)

  const { data, error, loading } = useGetOrganizationSettingsQuery()
  const organization = data?.organization
  const appliedTaxRates = data?.taxes?.collection || undefined
  const invoiceFooter = organization?.billingConfiguration?.invoiceFooter || ''
  const invoiceGracePeriod = organization?.billingConfiguration?.invoiceGracePeriod || 0
  const documentLocale = organization?.billingConfiguration?.documentLocale || DocumentLocales.en
  const canEditInvoiceSettings = hasPermissions(['organizationInvoicesUpdate'])

  const hasCustomSections = !!data?.invoiceCustomSections?.collection?.length

  const [updateCustomSection] = useUpdateInvoiceCustomSectionMutation({
    refetchQueries: ['getOrganizationSettings'],
    onCompleted: ({ updateInvoiceCustomSection }) => {
      if (!updateInvoiceCustomSection) {
        return
      }

      if (updateInvoiceCustomSection.selected) {
        addToast({
          severity: 'success',
          message: translate('text_1733849149914btq7cvs7ljb'),
        })
      } else {
        addToast({
          severity: 'success',
          message: translate('text_17338491499140e4tci0yhhe'),
        })
      }
    },
  })

  if (!!error && !loading) {
    return (
      <GenericPlaceholder
        title={translate('text_629728388c4d2300e2d380d5')}
        subtitle={translate('text_629728388c4d2300e2d380eb')}
        buttonTitle={translate('text_629728388c4d2300e2d38110')}
        buttonVariant="primary"
        buttonAction={() => location.reload()}
        image={<ErrorImage width="136" height="104" />}
      />
    )
  }

  return (
    <>
      <PageBannerHeaderWithBurgerMenu>
        <Typography variant="bodyHl" color="grey700">
          {translate('text_62bb10ad2a10bd182d00202d')}
        </Typography>
      </PageBannerHeaderWithBurgerMenu>

      <SettingsPaddedContainer>
        <SettingsPageHeaderContainer>
          <Typography variant="headline">{translate('text_62ab2d0396dd6b0361614d24')}</Typography>
          <Typography>{translate('text_637f819eff19cd55a56d55e2')}</Typography>
        </SettingsPageHeaderContainer>

        <SettingsListWrapper>
          {!!loading ? (
            <SettingsListItemLoadingSkeleton count={6} />
          ) : (
            <>
              {/* Default currency */}
              <SettingsListItem>
                <SettingsListItemHeader
                  label={translate('text_6543ca0fdebf76a18e15929c')}
                  sublabel={translate('text_17280313005777h5bvs7okol')}
                  action={
                    <Button
                      variant="quaternary"
                      disabled={!canEditInvoiceSettings}
                      onClick={() =>
                        editDefaultCurrencyDialogRef?.current?.openDialog({ organization })
                      }
                    >
                      {translate('text_637f819eff19cd55a56d55e4')}
                    </Button>
                  }
                />

                <Typography variant="body" color="grey700">
                  {organization?.defaultCurrency}
                </Typography>
              </SettingsListItem>

              {/* Document language */}
              <SettingsListItem>
                <SettingsListItemHeader
                  label={translate('text_63e51ef4985f0ebd75c212fd')}
                  sublabel={translate('text_1728031300577ipb2cxnths3')}
                  action={
                    <Button
                      variant="quaternary"
                      disabled={!canEditInvoiceSettings}
                      onClick={editDocumentLanguageDialogRef?.current?.openDialog}
                    >
                      {translate('text_63e51ef4985f0ebd75c212fc')}
                    </Button>
                  }
                />

                <Typography variant="body" color="grey700">
                  {DocumentLocales[documentLocale]}
                </Typography>
              </SettingsListItem>

              {/* Finalize empty invoice setting */}
              <SettingsListItem>
                <SettingsListItemHeader
                  label={translate('text_1725549671287r9tnu5cuoeu')}
                  sublabel={translate('text_1725538340200495slgen6ji')}
                  action={
                    <Button
                      variant="quaternary"
                      disabled={!canEditInvoiceSettings}
                      onClick={() => editFinalizeZeroAmountInvoiceDialogRef?.current?.openDialog()}
                    >
                      {translate('text_637f819eff19cd55a56d55e4')}
                    </Button>
                  }
                />

                <Typography variant="body" color="grey700">
                  {organization?.finalizeZeroAmountInvoice
                    ? translate('text_1725549671287ancbf00edxx')
                    : translate('text_1725549671288zkq9sr0y46l')}
                </Typography>
              </SettingsListItem>

              {/* Grace period */}
              <SettingsListItem>
                <SettingsListItemHeader
                  label={translate('text_638dc196fb209d551f3d8141')}
                  sublabel={translate('text_1728031300577ozl3dbfygr7')}
                  action={
                    <Button
                      variant="quaternary"
                      endIcon={isPremium ? undefined : 'sparkles'}
                      disabled={!canEditInvoiceSettings}
                      onClick={() => {
                        isPremium
                          ? editGracePeriodDialogRef?.current?.openDialog()
                          : premiumWarningDialogRef.current?.openDialog()
                      }}
                    >
                      {translate('text_637f819eff19cd55a56d55e4')}
                    </Button>
                  }
                />

                <Typography variant="body" color="grey700">
                  {translate(
                    'text_638dc196fb209d551f3d81a2',
                    { gracePeriod: invoiceGracePeriod },
                    invoiceGracePeriod,
                  )}
                </Typography>
              </SettingsListItem>

              {/* Custom section */}
              <SettingsListItem className={tw({ 'shadow-inherit': hasCustomSections })}>
                <SettingsListItemHeader
                  label={translate('text_1732553358445168zt8fopyf')}
                  sublabel={translate('text_1732553358445p7rg0i0dzws')}
                  action={
                    <Button
                      variant="quaternary"
                      disabled={!canEditInvoiceSettings}
                      onClick={() => navigate(CREATE_INVOICE_CUSTOM_SECTION)}
                    >
                      {translate('text_645bb193927b375079d28ad2')}
                    </Button>
                  }
                />

                {hasCustomSections && (
                  <Table
                    name="invoice-custom-section"
                    containerSize={{ default: 0 }}
                    data={data?.invoiceCustomSections?.collection || []}
                    columns={[
                      {
                        key: 'name',
                        title: translate('text_6419c64eace749372fc72b0f'),
                        content: (section) => (
                          <Typography variant="body" color="textSecondary">
                            {section.name}
                          </Typography>
                        ),
                        maxSpace: true,
                      },
                      {
                        key: 'selected',
                        title: translate('text_63ac86d797f728a87b2f9fa7'),
                        content: (section) =>
                          section.selected && (
                            <Chip label={translate('text_65281f686a80b400c8e2f6d1')} />
                          ),
                        minWidth: 96,
                      },
                    ]}
                    actionColumnTooltip={() => translate('text_17326382475765mx3dfl4v6t')}
                    actionColumn={(section) => [
                      {
                        startIcon: 'pen',
                        title: translate('text_1732638001460kne05vskb7e'),
                        onAction: () =>
                          navigate(
                            generatePath(EDIT_INVOICE_CUSTOM_SECTION, { sectionId: section.id }),
                          ),
                      },
                      section.selected
                        ? {
                            startIcon: 'star-outlined-hidden',
                            title: translate('text_1728574726495j7n9zqj7o71'),
                            onAction: () =>
                              defaultCustomSectionDialogRef.current?.openDialog({
                                type: 'removeDefault',
                                onConfirm: () =>
                                  updateCustomSection({
                                    variables: {
                                      input: {
                                        id: section.id,
                                        selected: false,
                                      },
                                    },
                                  }),
                              }),
                          }
                        : {
                            startIcon: 'star-filled',
                            title: translate('text_1728574726495n9jdse2hnrf'),
                            onAction: () =>
                              defaultCustomSectionDialogRef.current?.openDialog({
                                type: 'setDefault',
                                onConfirm: () =>
                                  updateCustomSection({
                                    variables: {
                                      input: {
                                        id: section.id,
                                        selected: true,
                                      },
                                    },
                                  }),
                              }),
                          },
                      {
                        startIcon: 'trash',
                        title: translate('text_1732638001460kdzkctjfegi'),
                        onAction: () =>
                          deleteCustomSectionDialogRef.current?.openDialog({
                            id: section.id,
                          }),
                      },
                    ]}
                  />
                )}
              </SettingsListItem>

              {/* Invoice default footer */}
              <SettingsListItem>
                <SettingsListItemHeader
                  label={translate('text_637f819eff19cd55a56d55f6')}
                  sublabel={translate('text_1728031300577nwh7oc3hawr')}
                  action={
                    <Button
                      variant="quaternary"
                      disabled={!canEditInvoiceSettings}
                      onClick={editInvoiceTemplateDialogRef?.current?.openDialog}
                    >
                      {translate('text_6380d7e60f081e5b777c4b24')}
                    </Button>
                  }
                />

                {!invoiceFooter ? (
                  <Typography variant="body" color="grey700">
                    {translate('text_637f819eff19cd55a56d55f8')}
                  </Typography>
                ) : (
                  <ShowMoreText
                    variant="body"
                    color="grey700"
                    text={invoiceFooter}
                    limit={MAX_FOOTER_LENGTH_DISPLAY_LIMIT}
                  />
                )}
              </SettingsListItem>

              {/* Invoice numbering */}
              <SettingsListItem>
                <SettingsListItemHeader
                  label={translate('text_6566f920a1d6c35693d6cd16')}
                  sublabel={translate('text_17280313005771cdjezfas2e')}
                  action={
                    <Button
                      variant="quaternary"
                      disabled={!canEditInvoiceSettings}
                      onClick={editInvoiceNumberingDialogRef?.current?.openDialog}
                    >
                      {translate('text_6380d7e60f081e5b777c4b24')}
                    </Button>
                  }
                />

                <div className="flex items-baseline gap-1">
                  <Typography variant="body" color="grey700">
                    {getInvoiceNumberPreview(
                      organization?.documentNumbering as DocumentNumberingEnum,
                      organization?.documentNumberPrefix || '',
                    )}
                  </Typography>
                  <Typography variant="body" color="grey600">
                    {translate(
                      InvoiceNumberingTypeLabelTranslationKey[
                        organization?.documentNumbering as DocumentNumberingEnum
                      ],
                    )}
                  </Typography>
                </div>
              </SettingsListItem>

              {/* Net payment term */}
              <SettingsListItem>
                <SettingsListItemHeader
                  label={translate('text_64c7a89b6c67eb6c98898167')}
                  sublabel={translate('text_1728031300577aivplw3hqav')}
                  action={
                    <Button
                      variant="quaternary"
                      disabled={!canEditInvoiceSettings}
                      onClick={() => editNetPaymentTermDialogRef?.current?.openDialog(organization)}
                    >
                      {translate('text_637f819eff19cd55a56d55e4')}
                    </Button>
                  }
                />

                <Typography variant="body" color="grey700">
                  {translate(
                    'text_64c7a89b6c67eb6c9889815f',
                    {
                      days: organization?.netPaymentTerm,
                    },
                    organization?.netPaymentTerm,
                  )}
                </Typography>
              </SettingsListItem>

              {/* Tax */}
              {hasPermissions(['organizationTaxesView']) && (
                <SettingsListItem>
                  <SettingsListItemHeader
                    label={translate('text_637f819eff19cd55a56d55e6')}
                    sublabel={translate('text_1728031300577obxo6934yo7')}
                    action={
                      <>
                        {hasPermissions(['organizationTaxesUpdate']) && (
                          <Button
                            variant="quaternary"
                            disabled={!canEditInvoiceSettings}
                            onClick={editVATDialogRef?.current?.openDialog}
                            data-test="add-tax-button"
                          >
                            {translate('text_645bb193927b375079d28ad2')}
                          </Button>
                        )}
                      </>
                    }
                  />

                  {!!appliedTaxRates?.length && (
                    <Table
                      name="invoice-settings-taxes"
                      containerSize={{ default: 0 }}
                      rowSize={72}
                      data={appliedTaxRates}
                      columns={[
                        {
                          key: 'name',
                          title: translate('text_17280312664187sb64qzmyhy'),
                          maxSpace: true,
                          content: ({ name, code }) => (
                            <div
                              className="flex flex-1 items-center gap-3"
                              data-test={`applied-tax-${code}`}
                            >
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
                      actionColumn={(row) => {
                        return (
                          <Tooltip
                            placement="top-end"
                            title={translate('text_645bb193927b375079d28b82')}
                          >
                            <Button
                              icon="trash"
                              variant="quaternary"
                              disabled={loading}
                              onClick={() => {
                                deleteVATDialogRef.current?.openDialog(row)
                              }}
                            />
                          </Tooltip>
                        )
                      }}
                    />
                  )}
                </SettingsListItem>
              )}
            </>
          )}
        </SettingsListWrapper>
      </SettingsPaddedContainer>

      <DeleteOrganizationVatRateDialog ref={deleteVATDialogRef} />
      <AddOrganizationVatRateDialog
        ref={editVATDialogRef}
        appliedTaxRatesTaxesIds={appliedTaxRates?.map((t) => t.id)}
      />
      <EditOrganizationInvoiceTemplateDialog
        ref={editInvoiceTemplateDialogRef}
        invoiceFooter={invoiceFooter}
      />
      <EditOrganizationInvoiceNumberingDialog
        ref={editInvoiceNumberingDialogRef}
        documentNumbering={organization?.documentNumbering}
        documentNumberPrefix={organization?.documentNumberPrefix}
      />
      <EditOrganizationGracePeriodDialog
        ref={editGracePeriodDialogRef}
        invoiceGracePeriod={invoiceGracePeriod}
      />
      <EditOrganizationDocumentLocaleDialog
        ref={editDocumentLanguageDialogRef}
        documentLocale={documentLocale}
      />
      <EditNetPaymentTermDialog
        ref={editNetPaymentTermDialogRef}
        description={translate('text_64c7a89b6c67eb6c988980eb')}
      />
      <EditFinalizeZeroAmountInvoiceDialog
        ref={editFinalizeZeroAmountInvoiceDialogRef}
        entity={organization}
        finalizeZeroAmountInvoice={organization?.finalizeZeroAmountInvoice}
      />
      <EditDefaultCurrencyDialog ref={editDefaultCurrencyDialogRef} />
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
      <DefaultCustomSectionDialog ref={defaultCustomSectionDialogRef} />
      <DeleteCustomSectionDialog ref={deleteCustomSectionDialogRef} />
    </>
  )
}

export default InvoiceSettings
