import { Avatar, Icon } from 'lago-design-system'
import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { Button, Skeleton, Tooltip, Typography } from '~/components/designSystem'
import { Switch } from '~/components/form'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { LanguageSettingsButton } from '~/components/settings/LanguageSettingsButton'
import { PreviewEmailLayout } from '~/components/settings/PreviewEmailLayout'
import { envGlobalVar } from '~/core/apolloClient'
import { BILLING_ENTITY_EMAIL_SCENARIOS_ROUTE } from '~/core/router'
import { LocaleEnum } from '~/core/translations'
import {
  BillingEntity,
  BillingEntityEmailSettingsEnum,
  useGetBillingEntityQuery,
} from '~/generated/graphql'
import { useContextualLocale } from '~/hooks/core/useContextualLocale'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useEmailConfig } from '~/hooks/useEmailConfig'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import { BillingEntityTab } from '~/pages/settings/BillingEntity/BillingEntity'
import BillingEntityHeader from '~/pages/settings/BillingEntity/components/BillingEntityHeader'
import { EMAIL_SCENARIOS } from '~/pages/settings/BillingEntity/sections/BillingEntityEmailScenarios'
import { tw } from '~/styles/utils'

const { disablePdfGeneration } = envGlobalVar()

enum DisplayEnum {
  desktop = 'desktop',
  mobile = 'mobile',
}

const mapTranslationsKey = (type?: BillingEntityEmailSettingsEnum) => {
  switch (type) {
    case BillingEntityEmailSettingsEnum.InvoiceFinalized:
      return {
        header: 'text_6407684eaf41130074c4b2f0',
        title: 'text_6407684eaf41130074c4b2f3',
        substitle: 'text_6407684eaf41130074c4b2f4',
        subject: 'text_64188b3d9735d5007d71225c',
        invoice_from: 'text_64188b3d9735d5007d712266',
        amount: 'text_64188b3d9735d5007d712249',
        total: 'text_64188b3d9735d5007d71226a',
        invoice_number: 'text_64188b3d9735d5007d71226c',
        invoice_number_value: 'text_64188b3d9735d5007d71226e',
        issue_date: 'text_64188b3d9735d5007d712270',
        issue_date_value: 'text_64188b3d9735d5007d712272',
      }
    case BillingEntityEmailSettingsEnum.PaymentReceiptCreated:
      return {
        header: 'text_1741334140002zdl3cl599ib',
        title: 'text_1741334140002zdl3cl599ib',
        substitle: 'text_1741334140002wx0sbk2bd13',
        subject: 'text_17413343926218dbogzsvk4w',
        invoice_from: 'text_1741334392621wr13yk143fc',
        amount: 'text_17413343926218vamtw2ybko',
        total: 'text_1741334392621yu0957trt4n',
        receipt_number: 'text_17416040051091zpga3ugijs',
        receipt_number_value: 'text_1741604005109q6qlr3qcc1u',
        payment_date: 'text_1741604005109kywirovj4yo',
        payment_date_value: 'text_17416040051098005r277i71',
        amount_paid: 'text_1741604005109aspaz4chd7y',
        amount_paid_value: 'text_1741604005109w5ns73xmam9',
        payment_method: 'text_17440371192353kif37ol194',
        payment_method_value: 'text_1744037119235rz9n0rfhwcp',
      }
    default:
      return {
        header: 'text_1741334140002zdl3cl599ib',
        title: 'text_6408d642d50da800533e43d8',
        substitle: 'text_6408d64fb486aa006163f043',
        subject: 'text_64188b3d9735d5007d712271',
        invoice_from: 'text_64188b3d9735d5007d71227b',
        amount: 'text_64188b3d9735d5007d71227d',
        total: 'text_64188b3d9735d5007d71227e',
        credit_note_number: 'text_64188b3d9735d5007d71227f',
        credit_note_number_value: 'text_64188b3d9735d5007d712280',
        invoice_number: 'text_64188b3d9735d5007d712281',
        invoice_number_value: 'text_64188b3d9735d5007d712282',
        issue_date: 'text_64188b3d9735d5007d712283',
        issue_date_value: 'text_64188b3d9735d5007d712284',
      }
  }
}

const BillingEntityEmailScenariosConfig = () => {
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)

  const [invoiceLanguage, setInvoiceLanguage] = useState<LocaleEnum>(LocaleEnum.en)
  const [display, setDisplay] = useState<DisplayEnum>(DisplayEnum.desktop)
  const { translate } = useInternationalization()
  const { type } = useParams<{ type: BillingEntityEmailSettingsEnum }>()
  const translationsKey = mapTranslationsKey(type)
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const { translateWithContextualLocal } = useContextualLocale(invoiceLanguage)
  const { billingEntityCode } = useParams()
  const { hasOrganizationPremiumAddon } = useOrganizationInfos()

  const scenario = EMAIL_SCENARIOS.find((_scenario) => _scenario.setting === type)

  const hasAccess = scenario?.integration
    ? hasOrganizationPremiumAddon(scenario?.integration)
    : isPremium

  const { data: billingEntityData } = useGetBillingEntityQuery({
    variables: {
      code: billingEntityCode as string,
    },
    skip: !billingEntityCode,
  })

  const billingEntity = billingEntityData?.billingEntity

  const { loading, emailSettings, updateEmailSettings } = useEmailConfig({
    billingEntity: billingEntity as BillingEntity,
  })

  const name = billingEntity?.name

  return (
    <>
      <BillingEntityHeader
        billingEntity={billingEntity as BillingEntity}
        customBackPath={BILLING_ENTITY_EMAIL_SCENARIOS_ROUTE}
        tab={BillingEntityTab.EMAIL_SCENARIOS_CONFIG}
        customLabel={translate(translationsKey.title)}
        action={
          <>
            {hasPermissions(['billingEntitiesEmailsUpdate']) && (
              <div className="flex flex-row items-center gap-3">
                <Typography variant="caption">
                  {translate('text_6408b5ae7f629d008bc8af7c')}
                </Typography>
                <Switch
                  name={`switch-config-${type}`}
                  checked={type && emailSettings?.includes(type)}
                  onChange={async (value, e) => {
                    e.preventDefault()
                    e.stopPropagation()

                    if (hasAccess) {
                      await updateEmailSettings(type as BillingEntityEmailSettingsEnum, value)
                    } else {
                      premiumWarningDialogRef.current?.openDialog()
                    }
                  }}
                />
                {!hasAccess && <Icon name="sparkles" />}
              </div>
            )}
          </>
        }
      />

      <div className="min-height-minus-nav flex flex-col overflow-auto">
        <div className="flex flex-row items-center gap-4 px-4 py-8 md:px-12">
          {loading && (
            <>
              <Skeleton variant="connectorAvatar" size="large" />
              <div>
                <Skeleton variant="text" className="mb-5 w-60" />
                <Skeleton variant="text" className="w-30" />
              </div>
            </>
          )}

          {!loading && (
            <>
              <Avatar variant="connector" size="large">
                <Icon name="mail" size="large" />
              </Avatar>
              <div>
                <Typography className="mb-1" variant="headline">
                  {translate(translationsKey.title)}
                </Typography>
                <Typography>{translate(translationsKey.substitle)}</Typography>
              </div>
            </>
          )}
        </div>

        <Typography className="flex h-18 min-h-18 items-center justify-between px-4 first:not-last:mr-3 md:px-12">
          <Typography variant="subhead1" color="grey700" noWrap>
            {translate('text_6407684eaf41130074c4b2f8')}
          </Typography>

          {!loading && (
            <div className="flex items-center gap-3">
              <Typography variant="caption">
                {translate('text_6407684eaf41130074c4b2f9')}
              </Typography>

              <LanguageSettingsButton language={invoiceLanguage} onChange={setInvoiceLanguage} />

              <div className="h-10 w-px bg-grey-300" />
              <Typography variant="caption">
                {translate('text_6407684eaf41130074c4b2fa')}
              </Typography>
              <Tooltip title={translate('text_6407684eaf41130074c4b2f6')} placement="top-end">
                <Button
                  variant={display === DisplayEnum.desktop ? 'secondary' : 'quaternary'}
                  icon="laptop"
                  onClick={() => setDisplay(DisplayEnum.desktop)}
                />
              </Tooltip>
              <Tooltip title={translate('text_6407684eaf41130074c4b2f5')} placement="top-end">
                <Button
                  variant={display === DisplayEnum.mobile ? 'secondary' : 'quaternary'}
                  icon="smartphone"
                  onClick={() => setDisplay(DisplayEnum.mobile)}
                />
              </Tooltip>
            </div>
          )}
        </Typography>

        <div className="flex w-full flex-1 justify-center bg-grey-100">
          <div
            className={tw(
              'px-4 pb-0 pt-12',
              display === DisplayEnum.desktop ? 'w-150 max-w-150' : 'w-90 max-w-90',
            )}
          >
            <PreviewEmailLayout
              isLoading={loading}
              language={invoiceLanguage}
              logoUrl={billingEntity?.logoUrl}
              emailObject={translateWithContextualLocal(translationsKey.subject, {
                organization: name,
              })}
            >
              <div className="flex flex-col items-center justify-center">
                {loading ? (
                  <>
                    <Skeleton color="dark" variant="text" className="mb-5 w-30" />
                    <Skeleton color="dark" variant="text" className="mb-5 w-40" />
                    <Skeleton color="dark" variant="text" className="mb-7 w-30" />
                    <Skeleton color="dark" variant="text" className="mb-7" />
                    <div className="flex w-full justify-between">
                      <Skeleton color="dark" variant="text" className="mb-4 w-30" />
                      <Skeleton color="dark" variant="text" className="mb-4 w-40" />
                    </div>
                    <div className="flex w-full justify-between">
                      <Skeleton color="dark" variant="text" className="mb-4 w-30" />
                      <Skeleton color="dark" variant="text" className="mb-4 w-40" />
                    </div>
                  </>
                ) : (
                  <>
                    <Typography variant="caption">
                      {translateWithContextualLocal(translationsKey.invoice_from, {
                        organization: name,
                      })}
                    </Typography>
                    <Typography variant="headline">
                      {translateWithContextualLocal(translationsKey.amount)}
                    </Typography>
                    <Typography variant="caption">
                      {translateWithContextualLocal(translationsKey.total)}
                    </Typography>
                    <div className="my-6 h-px w-full bg-grey-300" />
                    <div className="flex w-full flex-col gap-1">
                      {type === BillingEntityEmailSettingsEnum.CreditNoteCreated && (
                        <div className="flex w-full items-center justify-between">
                          <Typography variant="caption">
                            {translateWithContextualLocal(
                              translationsKey.credit_note_number as string,
                            )}
                          </Typography>
                          <Typography variant="caption" color="grey700">
                            {translateWithContextualLocal(
                              translationsKey.credit_note_number_value as string,
                            )}
                          </Typography>
                        </div>
                      )}
                      {type === BillingEntityEmailSettingsEnum.PaymentReceiptCreated && (
                        <>
                          {[
                            [translationsKey.receipt_number, translationsKey.receipt_number_value],
                            [translationsKey.payment_date, translationsKey.payment_date_value],
                            [translationsKey.payment_method, translationsKey.payment_method_value],
                            [translationsKey.amount_paid, translationsKey.amount_paid_value],
                          ].map(([label, value]) => (
                            <div className="flex w-full items-center justify-between" key={label}>
                              <Typography variant="caption">
                                {translateWithContextualLocal(label as string)}
                              </Typography>
                              <Typography variant="caption" color="grey700">
                                {translateWithContextualLocal(value as string)}
                              </Typography>
                            </div>
                          ))}

                          <div className="mt-6 flex w-full items-center justify-between">
                            <Typography variant="caption" color="grey700">
                              {translateWithContextualLocal('text_6419c64eace749372fc72b3c')}
                            </Typography>
                            <Typography variant="caption" color="grey700">
                              {translateWithContextualLocal('text_6419c64eace749372fc72b3e')}
                            </Typography>
                          </div>

                          {['INV-001-001', 'INV-001-002', 'INV-001-003', 'INV-001-004'].map(
                            (invoice) => (
                              <div
                                className="flex w-full items-center justify-between"
                                key={invoice}
                              >
                                <Typography variant="caption">{invoice}</Typography>
                                <Typography variant="caption" color="grey700">
                                  $730,00
                                </Typography>
                              </div>
                            ),
                          )}
                        </>
                      )}

                      {translationsKey.invoice_number && translationsKey.invoice_number_value && (
                        <div className="flex w-full items-center justify-between">
                          <Typography variant="caption">
                            {translateWithContextualLocal(translationsKey.invoice_number)}
                          </Typography>
                          <Typography variant="caption" color="grey700">
                            {translateWithContextualLocal(translationsKey.invoice_number_value)}
                          </Typography>
                        </div>
                      )}

                      {translationsKey.issue_date && translationsKey.issue_date_value && (
                        <div className="flex w-full items-center justify-between">
                          <Typography variant="caption">
                            {translateWithContextualLocal(translationsKey.issue_date)}
                          </Typography>
                          <Typography variant="caption" color="grey700">
                            {translateWithContextualLocal(translationsKey.issue_date_value)}
                          </Typography>
                        </div>
                      )}
                    </div>

                    {!disablePdfGeneration && (
                      <>
                        <div className="my-6 h-px w-full bg-grey-300" />

                        {type === BillingEntityEmailSettingsEnum.PaymentReceiptCreated ? (
                          <div className="flex flex-row items-center gap-6">
                            <div className="flex items-center gap-2">
                              <Icon name="arrow-bottom" color="primary" />
                              <Typography variant="caption" color="grey700">
                                {translateWithContextualLocal('text_17413343926225ug14ak60xv')}
                              </Typography>
                            </div>

                            <div className="flex items-center gap-2">
                              <Icon name="arrow-bottom" color="primary" />
                              <Typography variant="caption" color="grey700">
                                {translateWithContextualLocal('text_1741334392622fl3ozwejrul')}
                              </Typography>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row items-center gap-2">
                            <Icon name="arrow-bottom" color="primary" />
                            <Typography variant="caption" color="grey700">
                              {translateWithContextualLocal('text_64188b3d9735d5007d712274')}
                            </Typography>
                          </div>
                        )}
                      </>
                    )}

                    <div className="my-6 h-px w-full bg-grey-300" />
                    <Typography className="text-center" variant="caption">
                      <span className="mr-1">
                        {translateWithContextualLocal('text_64188b3d9735d5007d712276')}
                      </span>
                      <span className="text-blue-600">billing@user_email.com</span>
                    </Typography>
                  </>
                )}
              </div>
            </PreviewEmailLayout>
          </div>
        </div>

        <PremiumWarningDialog ref={premiumWarningDialogRef} />
      </div>
    </>
  )
}

export default BillingEntityEmailScenariosConfig
