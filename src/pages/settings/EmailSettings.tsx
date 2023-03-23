import styled from 'styled-components'
import { generatePath } from 'react-router-dom'

import { NAV_HEIGHT, theme } from '~/styles'
import { Typography } from '~/components/designSystem'
import { EmailSettingsEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  EmailSettingItemSkeleton,
  EmailSettingItem,
} from '~/components/settings/emails/EmailSettingItem'
import { EMAILS_SCENARIO_CONFIG_ROUTE } from '~/core/router'
import { useEmailConfig } from '~/hooks/useEmailConfig'

const EmailSettings = () => {
  const { translate } = useInternationalization()
  const { loading, emailSettings, updateEmailSettings } = useEmailConfig()

  return (
    <Page>
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
    </Page>
  )
}

export default EmailSettings

const Page = styled.div`
  padding: ${theme.spacing(8)} ${theme.spacing(12)};
`

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
