import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { Avatar, Button, Icon, Skeleton, Tooltip, Typography } from '~/components/designSystem'
import { Switch } from '~/components/form'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { LanguageSettingsButton } from '~/components/settings/LanguageSettingsButton'
import { PreviewEmailLayout } from '~/components/settings/PreviewEmailLayout'
import { EMAILS_SCENARIO_CONFIG_ROUTE, EMAILS_SETTINGS_ROUTE } from '~/core/router'
import { LocaleEnum } from '~/core/translations'
import { EmailSettingsEnum } from '~/generated/graphql'
import { useContextualLocale } from '~/hooks/core/useContextualLocale'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useEmailConfig } from '~/hooks/useEmailConfig'
import { usePermissions } from '~/hooks/usePermissions'
import { PageHeader } from '~/styles'
import { tw } from '~/styles/utils'

enum DisplayEnum {
  desktop = 'desktop',
  mobile = 'mobile',
}

const mapTranslationsKey = (type?: EmailSettingsEnum) => {
  switch (type) {
    case EmailSettingsEnum.InvoiceFinalized:
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
    default:
      return {
        header: 'text_6408d63cb486aa006163f042',
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

const EmailScenarioConfig = () => {
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)

  const [invoiceLanguage, setInvoiceLanguage] = useState<LocaleEnum>(LocaleEnum.en)
  const [display, setDisplay] = useState<DisplayEnum>(DisplayEnum.desktop)
  const { translate } = useInternationalization()
  const { type } = useParams<{ type: EmailSettingsEnum }>()
  const { goBack } = useLocationHistory()
  const translationsKey = mapTranslationsKey(type)
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const { loading, emailSettings, name, updateEmailSettings } = useEmailConfig()
  const { translateWithContextualLocal } = useContextualLocale(invoiceLanguage)

  return (
    <div className="flex h-screen flex-col overflow-auto">
      <PageHeader.Wrapper withSide>
        <PageHeader.Group>
          <Button
            icon="arrow-left"
            variant="quaternary"
            onClick={() =>
              goBack(EMAILS_SETTINGS_ROUTE, {
                exclude: [EMAILS_SCENARIO_CONFIG_ROUTE],
              })
            }
          />
          <Typography color="grey700" noWrap>
            {translate(translationsKey.header)}
          </Typography>
        </PageHeader.Group>

        {hasPermissions(['organizationEmailsUpdate']) && (
          <div className="flex flex-row items-center gap-3">
            <Typography variant="caption">{translate('text_6408b5ae7f629d008bc8af7c')}</Typography>
            <Switch
              name={`switch-config-${type}`}
              checked={emailSettings.includes(type as EmailSettingsEnum)}
              onChange={async (value, e) => {
                e.preventDefault()
                e.stopPropagation()

                if (isPremium) {
                  await updateEmailSettings(type as EmailSettingsEnum, value)
                } else {
                  premiumWarningDialogRef.current?.openDialog()
                }
              }}
            />
            {!isPremium && <Icon name="sparkles" />}
          </div>
        )}
      </PageHeader.Wrapper>
      <div className="flex flex-row items-center gap-4 px-4 py-8 md:px-12">
        {loading ? (
          <>
            <Skeleton variant="connectorAvatar" size="large" />
            <div>
              <Skeleton variant="text" className="mb-5 w-60" />
              <Skeleton variant="text" className="w-30" />
            </div>
          </>
        ) : (
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
        <Typography variant="subhead" color="grey700" noWrap>
          {translate('text_6407684eaf41130074c4b2f8')}
        </Typography>
        {!loading && (
          <div className="flex items-center gap-3">
            <Typography variant="caption">{translate('text_6407684eaf41130074c4b2f9')}</Typography>

            <LanguageSettingsButton language={invoiceLanguage} onChange={setInvoiceLanguage} />

            <div className="h-10 w-px bg-grey-300" />
            <Typography variant="caption">{translate('text_6407684eaf41130074c4b2fa')}</Typography>
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
                    {type === EmailSettingsEnum.CreditNoteCreated && (
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
                    <div className="flex w-full items-center justify-between">
                      <Typography variant="caption">
                        {translateWithContextualLocal(translationsKey.invoice_number)}
                      </Typography>
                      <Typography variant="caption" color="grey700">
                        {translateWithContextualLocal(translationsKey.invoice_number_value)}
                      </Typography>
                    </div>
                    <div className="flex w-full items-center justify-between">
                      <Typography variant="caption">
                        {translateWithContextualLocal(translationsKey.issue_date)}
                      </Typography>
                      <Typography variant="caption" color="grey700">
                        {translateWithContextualLocal(translationsKey.issue_date_value)}
                      </Typography>
                    </div>
                  </div>
                  <div className="my-6 h-px w-full bg-grey-300" />
                  <div className="flex flex-row items-center gap-2">
                    <Icon name="arrow-bottom" color="primary" />

                    <Typography variant="caption" color="grey700">
                      {translateWithContextualLocal('text_64188b3d9735d5007d712274')}
                    </Typography>
                  </div>
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
  )
}

export default EmailScenarioConfig
