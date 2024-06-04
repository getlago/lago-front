import { gql } from '@apollo/client'
import { DateTime } from 'luxon'
import { useRef } from 'react'
import styled from 'styled-components'

import {
  Avatar,
  Button,
  Icon,
  ShowMoreText,
  Skeleton,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import {
  AddOrganizationVatRateDialog,
  AddOrganizationVatRateDialogRef,
} from '~/components/settings/AddOrganizationVatRateDialog'
import {
  DeleteOrganizationVatRateDialog,
  DeleteOrganizationVatRateDialogRef,
} from '~/components/settings/DeleteOrganizationVatRateDialog'
import {
  EditDefaultCurrencyDialog,
  EditDefaultCurrencyDialogRef,
} from '~/components/settings/EditDefaultCurrencyDialog'
import {
  EditNetPaymentTermDialog,
  EditNetPaymentTermDialogRef,
} from '~/components/settings/EditNetPaymentTermDialog'
import {
  EditOrganizationDocumentLocaleDialog,
  EditOrganizationDocumentLocaleDialogRef,
} from '~/components/settings/EditOrganizationDocumentLocaleDialog'
import {
  EditOrganizationGracePeriodDialog,
  EditOrganizationGracePeriodDialogRef,
} from '~/components/settings/EditOrganizationGracePeriodDialog'
import {
  EditOrganizationInvoiceNumberingDialog,
  EditOrganizationInvoiceNumberingDialogRef,
} from '~/components/settings/EditOrganizationInvoiceNumberingDialog'
import {
  EditOrganizationInvoiceTemplateDialog,
  EditOrganizationInvoiceTemplateDialogRef,
} from '~/components/settings/EditOrganizationInvoiceTemplateDialog'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { DocumentLocales } from '~/core/translations/documentLocales'
import {
  DeleteOrganizationVatRateFragmentDoc,
  DocumentNumberingEnum,
  EditOrganizationDefaultCurrencyForDialogFragmentDoc,
  EditOrganizationInvoiceNumberingDialogFragmentDoc,
  EditOrganizationInvoiceTemplateDialogFragmentDoc,
  EditOrganizationNetPaymentTermForDialogFragmentDoc,
  useGetOrganizationSettingsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'
import ErrorImage from '~/public/images/maneki/error.svg'
import { NAV_HEIGHT, theme } from '~/styles'
import { SettingsHeaderNameWrapper, SettingsPageContentWrapper } from '~/styles/settingsPage'

const MAX_FOOTER_LENGTH_DISPLAY_LIMIT = 200

const InvoiceNumberingTypeLabelTranslationKey = {
  [DocumentNumberingEnum.PerCustomer]: 'text_6566f920a1d6c35693d6cdca',
  [DocumentNumberingEnum.PerOrganization]: 'text_6566f920a1d6c35693d6cd26',
}

const InvoiceNumberingTypeDescriptionTranslationKey = {
  [DocumentNumberingEnum.PerCustomer]: 'text_6566f920a1d6c35693d6cdd2',
  [DocumentNumberingEnum.PerOrganization]: 'text_6566f920a1d6c35693d6cd2e',
}

export const getInvoiceNumberPreview = (
  documentNumbering: DocumentNumberingEnum,
  documentNumberPrefix: string,
) => {
  const date = DateTime.now().toFormat('yyyyMM')

  const numberEndging = {
    [DocumentNumberingEnum.PerCustomer]: '001-001',
    [DocumentNumberingEnum.PerOrganization]: `${date}-001`,
  }

  return `${documentNumberPrefix}-${numberEndging[documentNumbering]}`
}

gql`
  query getOrganizationSettings($appliedToOrganization: Boolean = true) {
    organization {
      id
      netPaymentTerm
      defaultCurrency
      documentNumbering
      documentNumberPrefix
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
  }

  ${DeleteOrganizationVatRateFragmentDoc}
  ${EditOrganizationInvoiceTemplateDialogFragmentDoc}
  ${EditOrganizationNetPaymentTermForDialogFragmentDoc}
  ${EditOrganizationDefaultCurrencyForDialogFragmentDoc}
  ${EditOrganizationInvoiceNumberingDialogFragmentDoc}
`

const InvoiceSettings = () => {
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const editVATDialogRef = useRef<AddOrganizationVatRateDialogRef>(null)
  const deleteVATDialogRef = useRef<DeleteOrganizationVatRateDialogRef>(null)
  const editInvoiceTemplateDialogRef = useRef<EditOrganizationInvoiceTemplateDialogRef>(null)
  const editInvoiceNumberingDialogRef = useRef<EditOrganizationInvoiceNumberingDialogRef>(null)
  const editGracePeriodDialogRef = useRef<EditOrganizationGracePeriodDialogRef>(null)
  const editDefaultCurrencyDialogRef = useRef<EditDefaultCurrencyDialogRef>(null)
  const editDocumentLanguageDialogRef = useRef<EditOrganizationDocumentLocaleDialogRef>(null)
  const editNetPaymentTermDialogRef = useRef<EditNetPaymentTermDialogRef>(null)
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const { data, error, loading } = useGetOrganizationSettingsQuery()
  const organization = data?.organization
  const appliedTaxRates = data?.taxes?.collection || undefined
  const invoiceFooter = organization?.billingConfiguration?.invoiceFooter || ''
  const invoiceGracePeriod = organization?.billingConfiguration?.invoiceGracePeriod || 0
  const documentLocale = organization?.billingConfiguration?.documentLocale || DocumentLocales.en
  const canEditInvoiceSettings = hasPermissions(['organizationInvoicesUpdate'])

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
      <SettingsHeaderNameWrapper>
        <Typography variant="bodyHl" color="grey700">
          {translate('text_62bb10ad2a10bd182d00202d')}
        </Typography>
      </SettingsHeaderNameWrapper>

      <SettingsPageContentWrapper>
        <Title variant="headline">{translate('text_62ab2d0396dd6b0361614d24')}</Title>
        <Subtitle>{translate('text_637f819eff19cd55a56d55e2')}</Subtitle>

        {/* Default currency */}
        <InlineSectionTitle>
          <Typography variant="subhead" color="grey700">
            {translate('text_6543ca0fdebf76a18e15929c')}
          </Typography>
          <Button
            variant="quaternary"
            disabled={loading || !canEditInvoiceSettings}
            onClick={() => editDefaultCurrencyDialogRef?.current?.openDialog({ organization })}
          >
            {translate('text_637f819eff19cd55a56d55e4')}
          </Button>
        </InlineSectionTitle>
        <InfoBlock $loading={loading}>
          {loading ? (
            <>
              <Skeleton variant="text" width={320} height={12} />
              <Skeleton variant="text" width={160} height={12} />
            </>
          ) : (
            <>
              <Typography variant="body" color="grey700">
                {organization?.defaultCurrency}
              </Typography>
              <Typography variant="caption" color="grey600">
                {translate('text_6543ca0fdebf76a18e1592ee', {
                  currency: organization?.defaultCurrency,
                })}
              </Typography>
            </>
          )}
        </InfoBlock>

        {/* Document language */}
        <InlineSectionTitle>
          <Typography variant="subhead" color="grey700">
            {translate('text_63e51ef4985f0ebd75c212fd')}
          </Typography>
          <Button
            variant="quaternary"
            disabled={loading || !canEditInvoiceSettings}
            onClick={editDocumentLanguageDialogRef?.current?.openDialog}
          >
            {translate('text_63e51ef4985f0ebd75c212fc')}
          </Button>
        </InlineSectionTitle>
        <InfoBlock $loading={loading}>
          {loading ? (
            <>
              <Skeleton variant="text" width={320} height={12} />
              <Skeleton variant="text" width={160} height={12} />
            </>
          ) : (
            <>
              <Typography variant="body" color="grey700">
                {DocumentLocales[documentLocale]}
              </Typography>
              <Typography variant="caption" color="grey600">
                {translate('text_63e51ef4985f0ebd75c212ff', {
                  locale: DocumentLocales[documentLocale],
                })}
              </Typography>
            </>
          )}
        </InfoBlock>

        {/* Grace period */}
        <InlineSectionTitle>
          <Typography variant="subhead" color="grey700">
            {translate('text_638dc196fb209d551f3d8141')}
          </Typography>
          <Button
            variant="quaternary"
            endIcon={isPremium ? undefined : 'sparkles'}
            disabled={loading || !canEditInvoiceSettings}
            onClick={() => {
              isPremium
                ? editGracePeriodDialogRef?.current?.openDialog()
                : premiumWarningDialogRef.current?.openDialog()
            }}
          >
            {translate('text_637f819eff19cd55a56d55e4')}
          </Button>
        </InlineSectionTitle>
        <InfoBlock $loading={loading}>
          {loading ? (
            <>
              <Skeleton variant="text" width={320} height={12} />
              <Skeleton variant="text" width={160} height={12} />
            </>
          ) : (
            <>
              <Typography variant="body" color="grey700">
                {translate(
                  'text_638dc196fb209d551f3d81a2',
                  { gracePeriod: invoiceGracePeriod },
                  invoiceGracePeriod,
                )}
              </Typography>
              <Typography variant="caption" color="grey600">
                {translate('text_638dc196fb209d551f3d81a6')}
              </Typography>
            </>
          )}
        </InfoBlock>

        {/* Invoice default footer */}
        <InlineSectionTitle>
          <Typography variant="subhead" color="grey700">
            {translate('text_637f819eff19cd55a56d55f6')}
          </Typography>
          <Button
            variant="quaternary"
            disabled={loading || !canEditInvoiceSettings}
            onClick={editInvoiceTemplateDialogRef?.current?.openDialog}
          >
            {translate('text_6380d7e60f081e5b777c4b24')}
          </Button>
        </InlineSectionTitle>
        <InfoBlock $loading={loading}>
          {loading ? (
            <>
              <Skeleton variant="text" width={320} height={12} />
              <Skeleton variant="text" width={160} height={12} />
            </>
          ) : !invoiceFooter ? (
            <>
              <Typography variant="body" color="grey700">
                {translate('text_637f819eff19cd55a56d55f8')}
              </Typography>
              <Typography variant="caption" color="grey600">
                {translate('text_637f819eff19cd55a56d55fa')}
              </Typography>
            </>
          ) : (
            <ShowMoreText
              variant="body"
              color="grey700"
              text={invoiceFooter}
              limit={MAX_FOOTER_LENGTH_DISPLAY_LIMIT}
            />
          )}
        </InfoBlock>

        {/* Invoice numbering */}
        <InlineSectionTitle>
          <Typography variant="subhead" color="grey700">
            {translate('text_6566f920a1d6c35693d6cd16')}
          </Typography>
          <Button
            variant="quaternary"
            disabled={loading || !canEditInvoiceSettings}
            onClick={editInvoiceNumberingDialogRef?.current?.openDialog}
          >
            {translate('text_6380d7e60f081e5b777c4b24')}
          </Button>
        </InlineSectionTitle>
        <InfoBlock $loading={loading}>
          {loading ? (
            <>
              <Skeleton variant="text" width={320} height={12} />
              <Skeleton variant="text" width={160} height={12} />
            </>
          ) : (
            <>
              <InlineFlexBaseline>
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
              </InlineFlexBaseline>
              <Typography variant="caption" color="grey600">
                {translate(
                  InvoiceNumberingTypeDescriptionTranslationKey[
                    organization?.documentNumbering as DocumentNumberingEnum
                  ],
                )}
              </Typography>
            </>
          )}
        </InfoBlock>

        {/* Net payment term */}
        <InlineSectionTitle>
          <Typography variant="subhead" color="grey700">
            {translate('text_64c7a89b6c67eb6c98898167')}
          </Typography>
          <Button
            variant="quaternary"
            disabled={loading || !canEditInvoiceSettings}
            onClick={() => editNetPaymentTermDialogRef?.current?.openDialog(organization)}
          >
            {translate('text_637f819eff19cd55a56d55e4')}
          </Button>
        </InlineSectionTitle>
        <InfoBlock $loading={loading}>
          {loading ? (
            <>
              <Skeleton variant="text" width={320} height={12} />
              <Skeleton variant="text" width={160} height={12} />
            </>
          ) : (
            <>
              <Typography variant="body" color="grey700">
                {organization?.netPaymentTerm === 0
                  ? translate('text_64c7a89b6c67eb6c98898125')
                  : translate(
                      'text_64c7a89b6c67eb6c9889815f',
                      {
                        days: organization?.netPaymentTerm,
                      },
                      organization?.netPaymentTerm,
                    )}
              </Typography>
              <Typography variant="caption" color="grey600">
                {translate('text_64c7a89b6c67eb6c98898182')}
              </Typography>
            </>
          )}
        </InfoBlock>

        {/* Tax */}
        {hasPermissions(['organizationTaxesView']) && (
          <>
            <InlineSectionTitle>
              <Typography variant="subhead" color="grey700">
                {translate('text_637f819eff19cd55a56d55e6')}
              </Typography>

              {hasPermissions(['organizationTaxesUpdate']) && (
                <Button
                  variant="quaternary"
                  disabled={loading || !canEditInvoiceSettings}
                  onClick={editVATDialogRef?.current?.openDialog}
                  data-test="add-tax-button"
                >
                  {translate('text_645bb193927b375079d28ad2')}
                </Button>
              )}
            </InlineSectionTitle>
            <InfoBlock $loading={loading}>
              {loading ? (
                <>
                  <Skeleton variant="text" width={320} height={12} />
                  <Skeleton variant="text" width={160} height={12} />
                </>
              ) : (
                <>
                  <Typography variant="body" color="grey700">
                    {!!appliedTaxRates?.length ? (
                      <>
                        {appliedTaxRates?.map((taxRate) => (
                          <TaxRateItem
                            key={`tax-rate-item-${taxRate.id}`}
                            data-test={`applied-tax-${taxRate.code}`}
                          >
                            <LeftSection>
                              <Avatar size="big" variant="connector">
                                <Icon size="medium" name="percentage" color="dark" />
                              </Avatar>
                              <div>
                                <Typography color="textSecondary" variant="bodyHl" noWrap>
                                  {taxRate.name}
                                </Typography>
                                <Typography variant="caption" noWrap>
                                  {taxRate.code}
                                </Typography>
                              </div>
                            </LeftSection>
                            <RightSection>
                              <Typography variant="body" color="grey700">
                                {intlFormatNumber((taxRate.rate || 0) / 100, {
                                  minimumFractionDigits: 2,
                                  style: 'percent',
                                })}
                              </Typography>
                              {hasPermissions(['organizationTaxesUpdate']) && (
                                <Tooltip
                                  placement="top-end"
                                  title={translate('text_64639cfe2e46e9007d11b49d')}
                                >
                                  <Button
                                    icon="trash"
                                    variant="quaternary"
                                    disabled={loading}
                                    onClick={() => {
                                      deleteVATDialogRef.current?.openDialog(taxRate)
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </RightSection>
                          </TaxRateItem>
                        ))}
                        <TopMargedTypography variant="caption" color="grey600">
                          {translate('text_64639bf298650700512731a3')}
                        </TopMargedTypography>
                      </>
                    ) : (
                      <Typography variant="caption" color="grey600" data-test="empty-taxes">
                        {translate('text_64639bad55d65900f4dd896f')}
                      </Typography>
                    )}
                  </Typography>
                </>
              )}
            </InfoBlock>
          </>
        )}

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
        <EditDefaultCurrencyDialog ref={editDefaultCurrencyDialogRef} />
        <PremiumWarningDialog ref={premiumWarningDialogRef} />
      </SettingsPageContentWrapper>
    </>
  )
}

const Title = styled(Typography)`
  margin-bottom: ${theme.spacing(2)};
`

const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
`

const InlineSectionTitle = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const InfoBlock = styled.div<{ $loading?: boolean }>`
  padding-top: ${({ $loading }) => ($loading ? theme.spacing(1) : 0)};
  padding-bottom: ${({ $loading }) => ($loading ? theme.spacing(9) : theme.spacing(8))};
  margin-bottom: ${theme.spacing(8)};
  box-shadow: ${theme.shadows[7]};

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

  &:last-child {
    margin-bottom: ${theme.spacing(3)};
  }
`

const TopMargedTypography = styled(Typography)`
  margin-top: ${theme.spacing(3)};
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

const InlineFlexBaseline = styled.div`
  display: flex;
  align-items: baseline;
  column-gap: ${theme.spacing(1)};
`

export default InvoiceSettings
