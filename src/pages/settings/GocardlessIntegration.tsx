import styled from 'styled-components'
import { useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { gql } from '@apollo/client'

import { theme, PageHeader, NAV_HEIGHT, HEADER_TABLE_HEIGHT } from '~/styles'
import { INTEGRATIONS_ROUTE, GOCARDLESS_INTEGRATION_ROUTE } from '~/core/router'
import {
  Typography,
  ButtonLink,
  Skeleton,
  Avatar,
  Chip,
  NavigationTab,
  Button,
  Icon,
  Tooltip,
} from '~/components/designSystem'
import {
  useGocardlessIntegrationsSettingQuery,
  useAddGocardlessPaymentProviderMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import GoCardless from '~/public/images/gocardless-large.svg'
import { addToast } from '~/core/apolloClient'

gql`
  query gocardlessIntegrationsSetting {
    currentUser {
      id
      organizations {
        id
        gocardlessPaymentProvider {
          id
          hasAccessToken
          webhookSecret
        }
      }
    }
  }

  mutation addGocardlessPaymentProvider($input: AddGocardlessPaymentProviderInput!) {
    addGocardlessPaymentProvider(input: $input) {
      id
      hasAccessToken
      webhookSecret
    }
  }
`

const GocardlessIntegration = () => {
  const { translate } = useInternationalization()
  const { data, loading } = useGocardlessIntegrationsSettingQuery()
  const query = new URLSearchParams(useLocation().search)
  const code = query.get('code')
  const [isConnectionEstablished, setIsConnectionEstablished] = useState(false)
  const [webhookSecretKey, setWebhookSecretKey] = useState('')
  const tabsOptions = [
    {
      title: translate('text_634ea0ecc6147de10ddb6635'),
      link: GOCARDLESS_INTEGRATION_ROUTE,
    },
  ]
  const gocardlessPaymentProvider = (data?.currentUser?.organizations || [])[0]
    ?.gocardlessPaymentProvider
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
      <NavigationTab tabs={tabsOptions} />
      <Settings>
        <Head>
          <Title variant="subhead">{translate('text_634ea0ecc6147de10ddb663d')}</Title>
          <Button
            disabled={!isConnectionEstablished}
            variant="quaternary"
            onClick={() => window.open('https://proxy.lago.dev/gocardless/auth', '_blank')}
          >
            {translate('text_635bd8acb686f18909a57c87')}
          </Button>
        </Head>
        {isConnectionEstablished && (
          <Subtitle>{translate('text_634ea0ecc6147de10ddb6641')}</Subtitle>
        )}
      </Settings>
      <Settings>
        <Title variant="subhead">{translate('text_635bd8acb686f18909a57c89')}</Title>
        <SubtitleSecretKey variant="bodyHl" color="disabled">
          {translate('text_635bd8acb686f18909a57c8d')}
        </SubtitleSecretKey>
        <SecretKeyItem>
          {loading ? (
            <>
              <Skeleton variant="connectorAvatar" size="medium" marginRight="16px" />
              <Skeleton variant="text" width={240} height={12} />
            </>
          ) : (
            isConnectionEstablished && (
              <>
                <Avatar variant="connector" size="medium">
                  <Icon color="dark" name="key" />
                </Avatar>
                <SecretKey color="textSecondary">{webhookSecretKey}</SecretKey>
                <Tooltip title={translate('text_6360ddae753a8b3e11c80c66')} placement="top-end">
                  <Button
                    variant="quaternary"
                    onClick={() => {
                      navigator.clipboard.writeText(webhookSecretKey)
                      addToast({
                        severity: 'info',
                        translateKey: 'text_6360ddae753a8b3e11c80c6c',
                      })
                    }}
                  >
                    <Icon color="dark" name="duplicate" />
                  </Button>
                </Tooltip>
              </>
            )
          )}
        </SecretKeyItem>
        {!loading && <Info variant="caption">{translate('text_635bd8acb686f18909a57c93')}</Info>}
      </Settings>
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

const Settings = styled.div`
  padding: 0 ${theme.spacing(12)};
  margin-bottom: ${theme.spacing(12)};
`

const Title = styled(Typography)`
  height: ${NAV_HEIGHT}px;
  width: 100%;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;
`

const Head = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
  margin-bottom: ${theme.spacing(4)};
`

const Subtitle = styled(Typography)`
  height: ${HEADER_TABLE_HEIGHT}px;
  width: 100%;
  display: flex;
  align-items: center;
`

const SubtitleSecretKey = styled(Typography)`
  height: ${HEADER_TABLE_HEIGHT}px;
  width: 100%;
  display: flex;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
`

const SecretKeyItem = styled.div`
  height: ${NAV_HEIGHT}px;
  width: 100%;
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
  box-shadow: ${theme.shadows[7]};
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

export default GocardlessIntegration
