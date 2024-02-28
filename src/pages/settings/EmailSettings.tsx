import { generatePath } from 'react-router-dom'
import styled from 'styled-components'

import { Typography } from '~/components/designSystem'
import {
  EmailSettingItem,
  EmailSettingItemSkeleton,
} from '~/components/settings/emails/EmailSettingItem'
import { EMAILS_SCENARIO_CONFIG_ROUTE } from '~/core/router'
import { EmailSettingsEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useEmailConfig } from '~/hooks/useEmailConfig'
import { NAV_HEIGHT, theme } from '~/styles'
import { SettingsHeaderNameWrapper, SettingsPageContentWrapper } from '~/styles/settingsPage'

const EmailSettings = () => {
  const { translate } = useInternationalization()
  const { loading, emailSettings, updateEmailSettings } = useEmailConfig()

  return (
    <>
      <SettingsHeaderNameWrapper>
        <Typography variant="bodyHl" color="grey700">
          {translate('text_6407684eaf41130074c4b2a1')}
        </Typography>
      </SettingsHeaderNameWrapper>

      <SettingsPageContentWrapper>
        <Title variant="headline">{translate('text_6408b5ae7f629d008bc8af79')}</Title>
        <Subtitle>{translate('text_6408b5ae7f629d008bc8af7b')}</Subtitle>
        <SectionTitle variant="subhead">{translate('text_6408b5ae7f629d008bc8af7c')}</SectionTitle>
        {loading ? (
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
        )}
      </SettingsPageContentWrapper>
    </>
  )
}

export default EmailSettings

const Title = styled(Typography)`
  margin-bottom: ${theme.spacing(2)};
`

const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
`

const SectionTitle = styled(Typography)`
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
`
