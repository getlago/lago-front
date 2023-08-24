import { useState, useRef } from 'react'
import styled from 'styled-components'
import { useParams } from 'react-router-dom'

import { theme, PageHeader, NAV_HEIGHT, MenuPopper } from '~/styles'
import {
  Typography,
  Button,
  Skeleton,
  Avatar,
  Icon,
  Popper,
  Tooltip,
} from '~/components/designSystem'
import { Switch } from '~/components/form'
import { EmailSettingsEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { EMAILS_SETTINGS_ROUTE, EMAILS_SCENARIO_CONFIG_ROUTE } from '~/core/router'
import Logo from '~/public/images/logo/lago-logo-grey.svg'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useEmailConfig } from '~/hooks/useEmailConfig'
import { LocaleEnum } from '~/core/translations'
import { useContextualLocale } from '~/hooks/core/useContextualLocale'
import {
  UpdateOrganizationLogoDialog,
  UpdateOrganizationLogoDialogRef,
} from '~/components/settings/emails/UpdateOrganizationLogoDialog'

export enum DisplayEnum {
  desktop = 'desktop',
  mobile = 'mobile',
}

const mapLanguageKey = (language: LocaleEnum) => {
  switch (language) {
    case LocaleEnum.fr:
      return 'text_640a0b75228ef90063296ea4'
    case LocaleEnum.nb:
      return 'text_640a0b75228ef90063296eb5'
    case LocaleEnum.de:
      return 'text_6437d8583c62bc00c393d923'
    case LocaleEnum.it:
      return 'text_64e4ce3b2fa8940053c8a583'
    default:
      return 'text_6407684eaf41130074c4b2f7'
  }
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
  const updateLogoDialogRef = useRef<UpdateOrganizationLogoDialogRef>(null)
  const [invoiceLanguage, setInvoiceLanguage] = useState<LocaleEnum>(LocaleEnum.en)
  const [display, setDisplay] = useState<DisplayEnum>(DisplayEnum.desktop)
  const { translate } = useInternationalization()
  const { type } = useParams<{ type: EmailSettingsEnum }>()
  const { goBack } = useLocationHistory()
  const translationsKey = mapTranslationsKey(type)
  const { isPremium } = useCurrentUser()
  const { loading, emailSettings, logoUrl, name, updateEmailSettings } = useEmailConfig()
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
            <Popper
              PopperProps={{ placement: 'bottom-end' }}
              opener={
                <Button variant="quaternary" endIcon="chevron-down">
                  {translate(mapLanguageKey(invoiceLanguage))}
                </Button>
              }
            >
              {({ closePopper }) => (
                <MenuPopper>
                  <Button
                    align="left"
                    variant={invoiceLanguage === LocaleEnum.en ? 'secondary' : 'quaternary'}
                    onClick={() => {
                      closePopper()
                      setInvoiceLanguage(LocaleEnum.en)
                    }}
                  >
                    {translate(mapLanguageKey(LocaleEnum.en))}
                  </Button>
                  <Button
                    align="left"
                    variant={invoiceLanguage === LocaleEnum.fr ? 'secondary' : 'quaternary'}
                    onClick={() => {
                      closePopper()
                      setInvoiceLanguage(LocaleEnum.fr)
                    }}
                  >
                    {translate(mapLanguageKey(LocaleEnum.fr))}
                  </Button>
                  <Button
                    align="left"
                    variant={invoiceLanguage === LocaleEnum.de ? 'secondary' : 'quaternary'}
                    onClick={() => {
                      closePopper()
                      setInvoiceLanguage(LocaleEnum.de)
                    }}
                  >
                    {translate(mapLanguageKey(LocaleEnum.de))}
                  </Button>
                  <Button
                    align="left"
                    variant={invoiceLanguage === LocaleEnum.it ? 'secondary' : 'quaternary'}
                    onClick={() => {
                      closePopper()
                      setInvoiceLanguage(LocaleEnum.it)
                    }}
                  >
                    {translate(mapLanguageKey(LocaleEnum.it))}
                  </Button>
                  <Button
                    align="left"
                    variant={invoiceLanguage === LocaleEnum.nb ? 'secondary' : 'quaternary'}
                    onClick={() => {
                      closePopper()
                      setInvoiceLanguage(LocaleEnum.nb)
                    }}
                  >
                    {translate(mapLanguageKey(LocaleEnum.nb))}
                  </Button>
                </MenuPopper>
              )}
            </Popper>
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
          {loading ? (
            <Loading>
              <Skeleton color="dark" variant="text" width={360} marginBottom={22} />
              <InvoiceHead>
                <Skeleton
                  color="dark"
                  variant="circular"
                  width={40}
                  height={40}
                  marginRight={theme.spacing(4)}
                />
                <div>
                  <Skeleton
                    color="dark"
                    variant="text"
                    width={240}
                    marginBottom={theme.spacing(2)}
                  />
                  <Skeleton color="dark" variant="text" width={120} />
                </div>
              </InvoiceHead>
              <InvoiceLogo>
                <Skeleton
                  color="dark"
                  variant="connectorAvatar"
                  size="medium"
                  marginRight={theme.spacing(3)}
                />
                <Skeleton color="dark" variant="text" width={120} />
              </InvoiceLogo>
              <InvoiceContentLoader>
                <Skeleton color="dark" variant="text" width={120} marginBottom={theme.spacing(5)} />
                <Skeleton color="dark" variant="text" width={160} marginBottom={theme.spacing(5)} />
                <Skeleton color="dark" variant="text" width={120} marginBottom={30} />
                <Skeleton color="dark" variant="text" width="100%" height={1} marginBottom={30} />
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
              </InvoiceContentLoader>
              <InvoiceFooter>
                <Skeleton color="dark" variant="text" width={220} />
              </InvoiceFooter>
            </Loading>
          ) : (
            <InvoicePreviewContent>
              <InvoiceTitle variant="bodyHl" color="grey700">
                {translateWithContextualLocal(translationsKey.subject, { organization: name })}
              </InvoiceTitle>
              <InvoiceHead>
                <EmptyAvatar />
                <div>
                  <div>
                    <Typography variant="captionHl" color="grey700" component="span">
                      {name}
                    </Typography>
                    <FromEmail>{translate('text_64188b3d9735d5007d712260')}</FromEmail>
                  </div>
                  <ToEmail>{translateWithContextualLocal('text_64188b3d9735d5007d712262')}</ToEmail>
                </div>
              </InvoiceHead>
              <div>
                <Company>
                  {!!logoUrl ? (
                    <Avatar size="medium" variant="connector">
                      <img src={logoUrl} alt="company-logo" />
                    </Avatar>
                  ) : (
                    <Tooltip title={translate('text_6411e0aa915fd500a4d92cfb')} placement="top">
                      <Button
                        icon="plus"
                        size="small"
                        variant="secondary"
                        onClick={() => {
                          updateLogoDialogRef?.current?.openDialog()
                        }}
                      />
                    </Tooltip>
                  )}
                  <Typography variant="subhead">{name}</Typography>
                </Company>
                <TemplateContent>
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
                            translationsKey.credit_note_number as string
                          )}
                        </Typography>
                        <Typography variant="caption" color="grey700">
                          {translateWithContextualLocal(
                            translationsKey.credit_note_number_value as string
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
                </TemplateContent>
                <Footer>
                  <Typography variant="note" color="grey500">
                    {translateWithContextualLocal('text_64188b3d9735d5007d712278')}
                  </Typography>
                  <Logo height="12px" />
                </Footer>
              </div>
            </InvoicePreviewContent>
          )}
        </PreviewContent>
      </PreviewContainer>
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
      <UpdateOrganizationLogoDialog ref={updateLogoDialogRef} />
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

const Loading = styled.div`
  flex: 1;
  > *:first-child {
    margin-top: ${theme.spacing(1)};
  }
`

const InvoiceHead = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: ${theme.spacing(12)};

  > * {
    width: 100%;
  }
`

const InvoiceLogo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${theme.spacing(8)};
`

const InvoiceFooter = styled.div`
  display: flex;
  justify-content: center;
  padding-bottom: ${theme.spacing(20)};
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

const InvoiceTitle = styled(Typography)`
  margin-bottom: ${theme.spacing(4)};
  flex: 1;
`

const EmptyAvatar = styled.div`
  height: 40px;
  min-height: 40px;
  min-width: 40px;
  width: 40px;
  border-radius: 50%;
  background-color: ${theme.palette.grey[300]};
  margin-right: ${theme.spacing(4)};
`

const InvoicePreviewContent = styled.div`
  display: flex;
  flex-direction: column;
`

const InvoiceContentLoader = styled.div`
  background-color: ${theme.palette.common.white};
  padding: ${theme.spacing(8)};
  border-radius: 12px;
  border: ${theme.palette.grey[300]};
  margin-bottom: ${theme.spacing(8)};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
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

const Company = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;

  > *:not(:last-child) {
    margin-right: ${theme.spacing(3)};
  }
`

const TemplateContent = styled.div`
  background-color: ${theme.palette.common.white};
  padding: ${theme.spacing(8)};
  border-radius: 12px;
  border: ${theme.palette.grey[300]};
  margin-bottom: ${theme.spacing(8)};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
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

const Footer = styled.div`
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  letter-spacing: 0em;
  color: ${theme.palette.grey[500]};
  margin-bottom: ${theme.spacing(20)};
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    margin: 0 4px;
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

const FromEmail = styled.span`
  margin-left: ${theme.spacing(1)};
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  letter-spacing: 0em;
  text-align: left;
  color: ${theme.palette.grey[600]};
`

const ToEmail = styled.span`
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  letter-spacing: 0em;
  text-align: left;
  color: ${theme.palette.grey[600]};
`

const TitleText = styled(Typography)`
  margin-bottom: ${theme.spacing(1)};
`
