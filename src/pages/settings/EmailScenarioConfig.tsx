import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'

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
import { NAV_HEIGHT, PageHeader, theme } from '~/styles'

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
    <Container>
      <PageHeader $withSide>
        <HeaderLeft>
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
        </HeaderLeft>

        {hasPermissions(['organizationEmailsUpdate']) && (
          <HeaderRight>
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
          </HeaderRight>
        )}
      </PageHeader>
      <Title>
        {loading ? (
          <>
            <Skeleton variant="connectorAvatar" size="large" />
            <div>
              <Skeleton variant="text" width={240} marginBottom={22} />
              <Skeleton variant="text" width={120} />
            </div>
          </>
        ) : (
          <>
            <Avatar variant="connector" size="large">
              <Icon name="mail" size="large" />
            </Avatar>
            <div>
              <TitleText variant="headline">{translate(translationsKey.title)}</TitleText>
              <Typography>{translate(translationsKey.substitle)}</Typography>
            </div>
          </>
        )}
      </Title>
      <PreviewHeader>
        <Typography variant="subhead" color="grey700" noWrap>
          {translate('text_6407684eaf41130074c4b2f8')}
        </Typography>
        {!loading && (
          <Controls>
            <Typography variant="caption">{translate('text_6407684eaf41130074c4b2f9')}</Typography>

            <LanguageSettingsButton language={invoiceLanguage} onChange={setInvoiceLanguage} />

            <ControlDivider />
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
          </Controls>
        )}
      </PreviewHeader>
      <PreviewContainer>
        <PreviewContent $display={display}>
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
                  <Skeleton
                    color="dark"
                    variant="text"
                    width={120}
                    marginBottom={theme.spacing(5)}
                  />
                  <Skeleton
                    color="dark"
                    variant="text"
                    width={160}
                    marginBottom={theme.spacing(5)}
                  />
                  <Skeleton color="dark" variant="text" width={120} marginBottom={30} />
                  <Skeleton color="dark" variant="text" width="100%" marginBottom={30} />
                  <LoadingBlock>
                    <Skeleton
                      color="dark"
                      variant="text"
                      width={120}
                      marginBottom={theme.spacing(4)}
                    />
                    <Skeleton
                      color="dark"
                      variant="text"
                      width={160}
                      marginBottom={theme.spacing(4)}
                    />
                  </LoadingBlock>
                  <LoadingBlock>
                    <Skeleton
                      color="dark"
                      variant="text"
                      width={120}
                      marginBottom={theme.spacing(4)}
                    />
                    <Skeleton
                      color="dark"
                      variant="text"
                      width={160}
                      marginBottom={theme.spacing(4)}
                    />
                  </LoadingBlock>
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
                  <Divider />
                  <InfoBlock>
                    {type === EmailSettingsEnum.CreditNoteCreated && (
                      <InfoLine>
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
                      </InfoLine>
                    )}
                    <InfoLine>
                      <Typography variant="caption">
                        {translateWithContextualLocal(translationsKey.invoice_number)}
                      </Typography>
                      <Typography variant="caption" color="grey700">
                        {translateWithContextualLocal(translationsKey.invoice_number_value)}
                      </Typography>
                    </InfoLine>
                    <InfoLine>
                      <Typography variant="caption">
                        {translateWithContextualLocal(translationsKey.issue_date)}
                      </Typography>
                      <Typography variant="caption" color="grey700">
                        {translateWithContextualLocal(translationsKey.issue_date_value)}
                      </Typography>
                    </InfoLine>
                  </InfoBlock>
                  <Divider />
                  <DownloadBlock>
                    <Icon name="arrow-bottom" color="primary" />

                    <Typography variant="caption" color="grey700">
                      {translateWithContextualLocal('text_64188b3d9735d5007d712274')}
                    </Typography>
                  </DownloadBlock>
                  <Divider />
                  <ContactBlock variant="caption">
                    <span>{translateWithContextualLocal('text_64188b3d9735d5007d712276')}</span>
                    <span>billing@user_email.com</span>
                  </ContactBlock>
                </>
              )}
            </div>
          </PreviewEmailLayout>
        </PreviewContent>
      </PreviewContainer>
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </Container>
  )
}

export default EmailScenarioConfig

const Container = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: auto;
`

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const Title = styled.div`
  display: flex;
  padding: ${theme.spacing(8)} ${theme.spacing(12)};

  > *:first-child {
    margin-right: ${theme.spacing(4)};
  }

  > *:nth-child(2) {
    display: flex;
    flex-direction: column;
    flex: 1;
    justify-content: center;
  }

  ${theme.breakpoints.down('md')} {
    padding: ${theme.spacing(8)} ${theme.spacing(4)};
  }
`

const PreviewHeader = styled(Typography)`
  height: ${NAV_HEIGHT}px;
  min-height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
  padding: 0 ${theme.spacing(12)};
  justify-content: space-between;

  > *:first-child:not(:last-child) {
    margin-right: ${theme.spacing(3)};
  }

  ${theme.breakpoints.down('md')} {
    padding: 0 ${theme.spacing(4)};
  }
`

const PreviewContainer = styled.div`
  flex: 1;
  width: 100%;
  background-color: ${theme.palette.grey[100]};
  display: flex;
  justify-content: center;
`

const PreviewContent = styled.div<{ $display: DisplayEnum }>`
  max-width: ${({ $display }) => ($display === DisplayEnum.desktop ? '600px' : '360px')};
  width: ${({ $display }) => ($display === DisplayEnum.desktop ? '600px' : '360px')};
  padding: ${theme.spacing(12)} ${theme.spacing(4)} 0;
`
const LoadingBlock = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`

const Controls = styled.div`
  display: flex;
  align-items: center;

  > *:not(:last-child) {
    margin-right: ${theme.spacing(3)};
  }
`

const ControlDivider = styled.div`
  width: 1px;
  height: 40px;
  background-color: ${theme.palette.grey[300]};
`

const ContactBlock = styled(Typography)`
  text-align: center;
  > :first-child {
    margin-right: ${theme.spacing(1)};
  }
  > :last-child {
    color: ${theme.palette.primary[600]};
  }
`

const InfoBlock = styled.div`
  width: 100%;

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(1)};
  }
`

const InfoLine = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const DownloadBlock = styled.div`
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(2)};
  }
`

const Divider = styled.div`
  height: 1px;
  width: 100%;
  margin: ${theme.spacing(6)} 0;
  background-color: ${theme.palette.grey[300]};
`

const HeaderRight = styled.div`
  display: flex;
  align-items: center;

  > *:not(:last-child) {
    margin-right: ${theme.spacing(3)};
  }
`

const TitleText = styled(Typography)`
  margin-bottom: ${theme.spacing(1)};
`
