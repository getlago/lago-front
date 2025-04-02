import { useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import {
  Avatar,
  Button,
  Icon,
  Table,
  TableColumn,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { Switch } from '~/components/form'
import {
  SettingsListItem,
  SettingsListItemHeader,
  SettingsListItemLoadingSkeleton,
  SettingsListWrapper,
  SettingsPaddedContainer,
  SettingsPageHeaderContainer,
} from '~/components/layouts/Settings'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { BILLING_ENTITY_EMAIL_SCENARIOS_CONFIG_ROUTE } from '~/core/router'
import { BillingEntity, EmailSettingsEnum, useGetBillingEntityQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useEmailConfig } from '~/hooks/useEmailConfig'
import { usePermissions } from '~/hooks/usePermissions'
import { BillingEntityTab } from '~/pages/settings/BillingEntity/BillingEntity'
import BillingEntityHeader from '~/pages/settings/BillingEntity/components/BillingEntityHeader'

const EmailScenarioTitleLookup: Record<EmailSettingsEnum, string> = {
  [EmailSettingsEnum.InvoiceFinalized]: 'text_6408b5ae7f629d008bc8af7d',
  [EmailSettingsEnum.CreditNoteCreated]: 'text_6408b5ae7f629d008bc8af86',
  [EmailSettingsEnum.PaymentReceiptCreated]: '',
}

const EmailScenarioSubtitleLookup: Record<EmailSettingsEnum, string> = {
  [EmailSettingsEnum.InvoiceFinalized]: 'text_6408b5ae7f629d008bc8af7e',
  [EmailSettingsEnum.CreditNoteCreated]: 'text_6408b5ae7f629d008bc8af87',
  [EmailSettingsEnum.PaymentReceiptCreated]: '',
}

const EMAIL_SCENARIOS: Array<{ id: string; setting: EmailSettingsEnum }> = [
  {
    id: 'scenario-1',
    setting: EmailSettingsEnum.InvoiceFinalized,
  },
  {
    id: 'scenario-2',
    setting: EmailSettingsEnum.CreditNoteCreated,
  },
]

const BillingEntityEmailScenarios = () => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const { billingEntityCode } = useParams()

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

  const generateConfigRoute = (setting: EmailSettingsEnum) =>
    generatePath(BILLING_ENTITY_EMAIL_SCENARIOS_CONFIG_ROUTE, {
      billingEntityCode: billingEntityCode as string,
      type: setting,
    })

  const goToConfigRoute = (setting: EmailSettingsEnum) => {
    if (billingEntityCode) {
      navigate(generateConfigRoute(setting))
    }
  }

  return (
    <>
      <BillingEntityHeader
        billingEntity={billingEntity as BillingEntity}
        tab={BillingEntityTab.EMAIL_SCENARIOS}
        loading={loading}
      />

      <SettingsPaddedContainer>
        <SettingsPageHeaderContainer>
          <Typography variant="headline">{translate('text_6408b5ae7f629d008bc8af79')}</Typography>
          <Typography>{translate('text_6408b5ae7f629d008bc8af7b')}</Typography>
        </SettingsPageHeaderContainer>

        <SettingsListWrapper>
          {!!loading ? (
            <SettingsListItemLoadingSkeleton count={2} />
          ) : (
            <>
              <SettingsListItem>
                <SettingsListItemHeader
                  label={translate('text_6408b5ae7f629d008bc8af7c')}
                  sublabel={translate('text_1728050339810z0fp6orhtgp')}
                />

                <Table
                  name="email-settings-scenarios"
                  containerSize={{ default: 0 }}
                  rowSize={72}
                  data={EMAIL_SCENARIOS}
                  onRowActionLink={({ setting }) => generateConfigRoute(setting)}
                  columns={[
                    {
                      key: 'id',
                      title: translate('text_1728052663405tgkf89zijqf'),
                      maxSpace: true,
                      content: ({ setting }) => (
                        <div className="flex flex-1 items-center gap-3">
                          <Avatar size="big" variant="connector">
                            <Icon name="mail" color="dark" />
                          </Avatar>
                          <div>
                            <Typography color="grey700" variant="body" noWrap>
                              {translate(EmailScenarioTitleLookup[setting])}
                            </Typography>
                            <Typography variant="caption" noWrap>
                              {translate(EmailScenarioSubtitleLookup[setting])}
                            </Typography>
                          </div>
                        </div>
                      ),
                    },
                    ...(hasPermissions(['organizationEmailsUpdate'])
                      ? [
                          {
                            key: 'setting',
                            textAlign: 'right',
                            title: translate('text_63ac86d797f728a87b2f9fa7'),
                            content: ({ setting }) => {
                              const uniqName = `email-setting-item-${Math.round(Math.random() * 1000)}`

                              return (
                                <div>
                                  <Switch
                                    name={uniqName}
                                    checked={emailSettings?.includes(setting)}
                                    onChange={async (value) => {
                                      if (isPremium) {
                                        await updateEmailSettings(setting, value)
                                      } else {
                                        premiumWarningDialogRef.current?.openDialog()
                                      }
                                    }}
                                  />
                                  {!isPremium && <Icon name="sparkles" />}
                                </div>
                              )
                            },
                          } as TableColumn<{
                            id: string
                            setting: EmailSettingsEnum
                          }>,
                        ]
                      : []),
                  ]}
                  actionColumn={({ setting }) => {
                    return (
                      <Tooltip
                        placement="top-end"
                        title={translate('text_1728287936427nxgl4vcemin')}
                      >
                        <Button
                          icon="chevron-right"
                          variant="quaternary"
                          disabled={loading}
                          onClick={() => goToConfigRoute(setting)}
                        />
                      </Tooltip>
                    )
                  }}
                />
              </SettingsListItem>
            </>
          )}
        </SettingsListWrapper>
      </SettingsPaddedContainer>

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </>
  )
}

export default BillingEntityEmailScenarios
