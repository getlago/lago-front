import { gql } from '@apollo/client'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components'

import {
  Avatar,
  Button,
  ButtonLink,
  Chip,
  Icon,
  Popper,
  Skeleton,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import {
  AddEditDeleteSuccessRedirectUrlDialog,
  AddEditDeleteSuccessRedirectUrlDialogRef,
} from '~/components/settings/integrations/AddEditDeleteSuccessRedirectUrlDialog'
import { envGlobalVar } from '~/core/apolloClient'
import { addToast } from '~/core/apolloClient'
import { INTEGRATIONS_ROUTE } from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  GocardlessForCreateAndEditSuccessRedirectUrlFragmentDoc,
  useAddGocardlessPaymentProviderMutation,
  useGocardlessIntegrationsSettingQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import GoCardless from '~/public/images/gocardless-large.svg'
import {
  HEADER_TABLE_HEIGHT,
  MenuPopper,
  NAV_HEIGHT,
  PageHeader,
  PopperOpener,
  theme,
} from '~/styles'

gql`
  query gocardlessIntegrationsSetting {
    organization {
      id
      gocardlessPaymentProvider {
        id
        hasAccessToken
        webhookSecret
        successRedirectUrl
        ...gocardlessForCreateAndEditSuccessRedirectUrl
      }
    }
  }

  mutation addGocardlessPaymentProvider($input: AddGocardlessPaymentProviderInput!) {
    addGocardlessPaymentProvider(input: $input) {
      id
      hasAccessToken
      webhookSecret
      successRedirectUrl
    }
  }

  ${GocardlessForCreateAndEditSuccessRedirectUrlFragmentDoc}
`

const GocardlessIntegration = () => {
  const { translate } = useInternationalization()
  const { data, loading } = useGocardlessIntegrationsSettingQuery()
  const query = new URLSearchParams(useLocation().search)
  const code = query.get('code')
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
  const [isConnectionEstablished, setIsConnectionEstablished] = useState(false)
  const [webhookSecretKey, setWebhookSecretKey] = useState('')
  const gocardlessPaymentProvider = data?.organization?.gocardlessPaymentProvider
  const { lagoOauthProxyUrl } = envGlobalVar()
  const [addPaymentProvider] = useAddGocardlessPaymentProviderMutation({
    onCompleted({ addGocardlessPaymentProvider }) {
      if (addGocardlessPaymentProvider?.id && addGocardlessPaymentProvider?.webhookSecret) {
        setIsConnectionEstablished(true)
        setWebhookSecretKey(addGocardlessPaymentProvider?.webhookSecret)
        addToast({
          message: translate('text_634ea0ecc6147de10ddb6645'),
          severity: 'success',
        })
      }
    },
  })

  useEffect(() => {
    if (code) {
      addPaymentProvider({
        variables: {
          input: {
            accessCode: code,
          },
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (gocardlessPaymentProvider && gocardlessPaymentProvider.webhookSecret) {
      setIsConnectionEstablished(true)
      setWebhookSecretKey(gocardlessPaymentProvider.webhookSecret)
    }
  }, [gocardlessPaymentProvider])

  return (
    <div>
      <PageHeader $withSide>
        <HeaderBlock>
          <ButtonLink
            to={INTEGRATIONS_ROUTE}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" height={12} width={120} />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {translate('text_634ea0ecc6147de10ddb6629')}
            </Typography>
          )}
        </HeaderBlock>
      </PageHeader>
      <MainInfos>
        {loading ? (
          <>
            <Skeleton variant="connectorAvatar" size="large" marginRight="16px" />
            <div>
              <Skeleton variant="text" width={200} height={12} marginBottom="22px" />
              <Skeleton variant="text" width={128} height={12} />
            </div>
          </>
        ) : (
          <>
            <StyledAvatar variant="connector" size="large">
              <GoCardless />
            </StyledAvatar>
            <div>
              <Line>
                <Typography variant="headline">
                  {translate('text_634ea0ecc6147de10ddb6648')}
                </Typography>
                {isConnectionEstablished && (
                  <Chip label={translate('text_634ea0ecc6147de10ddb662d')} />
                )}
              </Line>
              <Typography>{translate('text_634ea0ecc6147de10ddb6643')}</Typography>
            </div>
          </>
        )}
      </MainInfos>

      <ContentWrapper>
        <MainHeader>
          <Head>
            <Title variant="subhead">{translate('text_634ea0ecc6147de10ddb663d')}</Title>
            <Button
              disabled={!isConnectionEstablished}
              variant="quaternary"
              onClick={() => window.open(`${lagoOauthProxyUrl}/gocardless/auth`, '_blank')}
            >
              {translate('text_635bd8acb686f18909a57c87')}
            </Button>
          </Head>
          {isConnectionEstablished && (
            <Subtitle>{translate('text_634ea0ecc6147de10ddb6641')}</Subtitle>
          )}
        </MainHeader>

        <section>
          <Title variant="subhead">{translate('text_637f813d31381b1ed90ab315')}</Title>
          <SecretKeyItem>
            {loading ? (
              <>
                <Skeleton variant="connectorAvatar" size="big" marginRight="16px" />
                <Skeleton variant="text" width={240} height={12} />
              </>
            ) : (
              isConnectionEstablished && (
                <>
                  <Avatar variant="connector" size="big">
                    <Icon color="dark" name="key" />
                  </Avatar>
                  <SecretKey variant="body" color="grey700" noWrap>
                    {webhookSecretKey}
                  </SecretKey>
                  <Tooltip title={translate('text_6360ddae753a8b3e11c80c66')} placement="top-end">
                    <Button
                      startIcon="duplicate"
                      variant="quaternary"
                      onClick={() => {
                        copyToClipboard(webhookSecretKey)
                        addToast({
                          severity: 'info',
                          translateKey: 'text_6360ddae753a8b3e11c80c6c',
                        })
                      }}
                    >
                      {translate('text_637f813d31381b1ed90ab322')}
                    </Button>
                  </Tooltip>
                </>
              )
            )}
          </SecretKeyItem>
          {!loading && <Info variant="caption">{translate('text_635bd8acb686f18909a57c93')}</Info>}
        </section>

        <section>
          <InlineTitle>
            <Typography variant="subhead">{translate('text_65367cb78324b77fcb6af21c')}</Typography>
            <Button
              variant="quaternary"
              disabled={!!gocardlessPaymentProvider?.successRedirectUrl}
              onClick={() => {
                successRedirectUrlDialogRef.current?.openDialog({
                  mode: 'Add',
                  type: 'GoCardless',
                  provider: gocardlessPaymentProvider,
                })
              }}
            >
              {translate('text_65367cb78324b77fcb6af20e')}
            </Button>
          </InlineTitle>

          {loading ? (
            <HeaderBlock>
              <Skeleton variant="connectorAvatar" size="big" marginRight="16px" />
              <Skeleton variant="text" width={240} height={12} />
            </HeaderBlock>
          ) : (
            <>
              {!gocardlessPaymentProvider?.successRedirectUrl ? (
                <Typography variant="caption" color="grey600">
                  {translate('text_65367cb78324b77fcb6af226', {
                    connectionName: translate('text_634ea0ecc6147de10ddb6625'),
                  })}
                </Typography>
              ) : (
                <SuccessPaumentRedirectUrlItem>
                  <SuccessPaumentRedirectUrlItemLeft>
                    <Avatar variant="connector" size="big">
                      <Icon name="globe" color="dark" />
                    </Avatar>
                    <div>
                      <Typography variant="caption" color="grey600">
                        {translate('text_65367cb78324b77fcb6af1c6')}
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {gocardlessPaymentProvider?.successRedirectUrl}
                      </Typography>
                    </div>
                  </SuccessPaumentRedirectUrlItemLeft>
                  <LocalPopper
                    PopperProps={{ placement: 'bottom-end' }}
                    opener={({ isOpen }) => (
                      <PopperOpener>
                        <Tooltip
                          placement="top-end"
                          disableHoverListener={isOpen}
                          title={translate('text_629728388c4d2300e2d3810d')}
                        >
                          <Button icon="dots-horizontal" variant="quaternary" />
                        </Tooltip>
                      </PopperOpener>
                    )}
                  >
                    {({ closePopper }) => (
                      <MenuPopper>
                        <Button
                          startIcon="pen"
                          variant="quaternary"
                          fullWidth
                          align="left"
                          onClick={() => {
                            successRedirectUrlDialogRef.current?.openDialog({
                              mode: 'Edit',
                              type: 'GoCardless',
                              provider: gocardlessPaymentProvider,
                            })
                            closePopper()
                          }}
                        >
                          {translate('text_65367cb78324b77fcb6af24d')}
                        </Button>
                        <Button
                          startIcon="trash"
                          variant="quaternary"
                          align="left"
                          fullWidth
                          onClick={() => {
                            successRedirectUrlDialogRef.current?.openDialog({
                              mode: 'Delete',
                              type: 'GoCardless',
                              provider: gocardlessPaymentProvider,
                            })
                            closePopper()
                          }}
                        >
                          {translate('text_65367cb78324b77fcb6af243')}
                        </Button>
                      </MenuPopper>
                    )}
                  </LocalPopper>
                </SuccessPaumentRedirectUrlItem>
              )}
            </>
          )}
        </section>
      </ContentWrapper>

      <AddEditDeleteSuccessRedirectUrlDialog ref={successRedirectUrlDialogRef} />
    </div>
  )
}

const HeaderBlock = styled.div`
  display: flex;
  align-items: center;

  > *:first-child  {
    margin-right: ${theme.spacing(3)};
  }
`

const MainInfos = styled.div`
  display: flex;
  align-items: center;
  padding: ${theme.spacing(8)} ${theme.spacing(12)};
`

const ContentWrapper = styled.div`
  max-width: ${theme.spacing(168)};
  margin: 0 ${theme.spacing(12)};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(8)};
`

const MainHeader = styled.section`
  box-shadow: ${theme.shadows[7]};
  padding-bottom: ${theme.spacing(8)};
`

const Title = styled(Typography)`
  height: ${NAV_HEIGHT}px;
  width: 100%;
  display: flex;
  align-items: center;
`

const Head = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const Subtitle = styled(Typography)`
  height: ${HEADER_TABLE_HEIGHT}px;
  width: 100%;
  display: flex;
  align-items: center;
`

const SecretKeyItem = styled.div`
  height: ${NAV_HEIGHT}px;
  max-width: ${theme.spacing(168)};
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const SecretKey = styled(Typography)`
  margin-right: auto;
`

const Info = styled(Typography)`
  height: ${HEADER_TABLE_HEIGHT}px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
`

const StyledAvatar = styled(Avatar)`
  margin-right: ${theme.spacing(4)};
`

const Line = styled.div`
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(2)};
  }
`

const InlineTitle = styled.div`
  position: relative;
  height: ${NAV_HEIGHT}px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const LocalPopper = styled(Popper)`
  position: relative;
  height: 100%;
  > *:first-child {
    right: 0;
    top: 16px;
  }
`

const SuccessPaumentRedirectUrlItem = styled.div`
  height: ${NAV_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const SuccessPaumentRedirectUrlItemLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};
`

export default GocardlessIntegration
