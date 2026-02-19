import { Icon } from 'lago-design-system'
import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { Avatar } from '~/components/designSystem/Avatar'
import { Button } from '~/components/designSystem/Button'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import EmailPreview, { DisplayEnum } from '~/components/emails/EmailPreview'
import { Switch } from '~/components/form'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { LanguageSettingsButton } from '~/components/settings/LanguageSettingsButton'
import { BILLING_ENTITY_EMAIL_SCENARIOS_ROUTE } from '~/core/router'
import { LocaleEnum } from '~/core/translations'
import {
  BillingEntity,
  BillingEntityEmailSettingsEnum,
  useGetBillingEntityQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useEmailConfig } from '~/hooks/useEmailConfig'
import { useEmailPreviewTranslationsKey } from '~/hooks/useEmailPreviewTranslationsKey'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import { BillingEntityTab } from '~/pages/settings/BillingEntity/BillingEntity'
import BillingEntityHeader from '~/pages/settings/BillingEntity/components/BillingEntityHeader'
import { EMAIL_SCENARIOS } from '~/pages/settings/BillingEntity/sections/BillingEntityEmailScenarios'

const BillingEntityEmailScenariosConfig = () => {
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)

  const [invoiceLanguage, setInvoiceLanguage] = useState<LocaleEnum>(LocaleEnum.en)
  const [display, setDisplay] = useState<DisplayEnum>(DisplayEnum.desktop)
  const { translate } = useInternationalization()
  const { type } = useParams<{ type: BillingEntityEmailSettingsEnum }>()
  const { mapTranslationsKey } = useEmailPreviewTranslationsKey()
  const translationsKey = mapTranslationsKey(type)

  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()
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

  return (
    <>
      <BillingEntityHeader
        billingEntity={billingEntity as BillingEntity}
        customBackPath={BILLING_ENTITY_EMAIL_SCENARIOS_ROUTE}
        tab={BillingEntityTab.EMAIL_SCENARIOS_CONFIG}
        customLabel={translate(translationsKey.title)}
        action={
          <>
            {hasPermissions(['billingEntitiesUpdate']) && (
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
                <Typography>{translate(translationsKey.subtitle)}</Typography>
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

        <EmailPreview
          billingEntity={billingEntity}
          loading={loading}
          type={type}
          invoiceLanguage={invoiceLanguage}
        />

        <PremiumWarningDialog ref={premiumWarningDialogRef} />
      </div>
    </>
  )
}

export default BillingEntityEmailScenariosConfig
