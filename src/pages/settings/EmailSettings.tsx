import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

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
import { PageBannerHeaderWithBurgerMenu } from '~/components/layouts/Pages'
import {
  SettingsListItem,
  SettingsListItemHeader,
  SettingsListItemLoadingSkeleton,
  SettingsListWrapper,
  SettingsPaddedContainer,
  SettingsPageHeaderContainer,
} from '~/components/layouts/Settings'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { EMAILS_SCENARIO_CONFIG_ROUTE } from '~/core/router'
import { EmailSettingsEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useEmailConfig } from '~/hooks/useEmailConfig'
import { usePermissions } from '~/hooks/usePermissions'

const EmailScernarioTitleLookup = {
  [EmailSettingsEnum.InvoiceFinalized]: 'text_6408b5ae7f629d008bc8af7d',
  [EmailSettingsEnum.CreditNoteCreated]: 'text_6408b5ae7f629d008bc8af86',
}

const EmailScernarioSubtitleLookup = {
  [EmailSettingsEnum.InvoiceFinalized]: 'text_6408b5ae7f629d008bc8af7e',
  [EmailSettingsEnum.CreditNoteCreated]: 'text_6408b5ae7f629d008bc8af87',
}

// NOTE: ids are present for display purpose, for table row keys
const EMAIL_SCENARIOS = [
  {
    id: 'scenario-1',
    setting: EmailSettingsEnum.InvoiceFinalized,
  },
  {
    id: 'scenario-2',
    setting: EmailSettingsEnum.CreditNoteCreated,
  },
]

const EmailSettings = () => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const { loading, emailSettings, updateEmailSettings } = useEmailConfig()
  const { hasPermissions } = usePermissions()
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)

  return (
    <>
      <PageBannerHeaderWithBurgerMenu>
        <Typography variant="bodyHl" color="grey700">
          {translate('text_6407684eaf41130074c4b2a1')}
        </Typography>
      </PageBannerHeaderWithBurgerMenu>

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
                  onRowAction={({ setting }) => {
                    navigate(
                      generatePath(EMAILS_SCENARIO_CONFIG_ROUTE, {
                        type: setting,
                      }),
                    )
                  }}
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
                              {translate(EmailScernarioTitleLookup[setting])}
                            </Typography>
                            <Typography variant="caption" noWrap>
                              {translate(EmailScernarioSubtitleLookup[setting])}
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
                                    checked={emailSettings.includes(setting)}
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
                          onClick={() => {
                            navigate(
                              generatePath(EMAILS_SCENARIO_CONFIG_ROUTE, {
                                type: setting,
                              }),
                            )
                          }}
                        />
                      </Tooltip>
                    )
                  }}
                />
              </SettingsListItem>
            </>
          )}
        </SettingsListWrapper>

        {/* {loading ? (
          [0, 1, 2].map((key) => (
            <EmailSettingItemSkeleton key={`email-setttings-item-skeleton-${key}`} />
          ))
        ) : (
          <>
            <EmailSettingItem
              title={translate('text_6408b5ae7f629d008bc8af7d')}
              subtitle={translate('text_6408b5ae7f629d008bc8af7e')}
              active={emailSettings.includes(EmailSettingsEnum.InvoiceFinalized)}
              to={generatePath(EMAILS_SCENARIO_CONFIG_ROUTE, {
                type: EmailSettingsEnum.InvoiceFinalized,
              })}
              onChangeConfig={async (value) => {
                await updateEmailSettings(EmailSettingsEnum.InvoiceFinalized, value)
              }}
            />
            <EmailSettingItem
              title={translate('text_6408b5ae7f629d008bc8af86')}
              subtitle={translate('text_6408b5ae7f629d008bc8af87')}
              active={emailSettings.includes(EmailSettingsEnum.CreditNoteCreated)}
              to={generatePath(EMAILS_SCENARIO_CONFIG_ROUTE, {
                type: EmailSettingsEnum.CreditNoteCreated,
              })}
              onChangeConfig={async (value) => {
                await updateEmailSettings(EmailSettingsEnum.CreditNoteCreated, value)
              }}
            />
          </>
        )} */}
      </SettingsPaddedContainer>

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </>
  )
}

export default EmailSettings
