import styled from 'styled-components'
import { gql } from '@apollo/client'

import { theme, PageHeader, NAV_HEIGHT, HEADER_TABLE_HEIGHT } from '~/styles'
import { INTEGRATIONS_ROUTE, GOCARDLESS_INTEGRATION_ROUTE } from '~/core/router'
import {
  Typography,
  ButtonLink,
  Skeleton,
  Avatar,
  Chip,
  NavigationTab, Button,
} from '~/components/designSystem'
import {
  useGocardlessIntegrationsSettingQuery,
  useUpdateStripeIntegrationMutation,
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
        }
      }
    }
  }
`

const GocardlessIntegration = () => {
  const { translate } = useInternationalization()
  const { data, loading } = useGocardlessIntegrationsSettingQuery()
  const [update] = useUpdateStripeIntegrationMutation({
    onCompleted({ addStripePaymentProvider }) {
      if (addStripePaymentProvider?.id) {
        addToast({
          message: translate('text_634ea0ecc6147de10ddb6645'),
          severity: 'success',
        })
      }
    },
  })
  const tabsOptions = [
    {
      title: translate('text_62b1edddbf5f461ab9712725'),
      link: GOCARDLESS_INTEGRATION_ROUTE,
    },
  ]

  const gocardlessPaymentProvider = (data?.currentUser?.organizations || [])[0]?.gocardlessPaymentProvider

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
                  {translate('text_634ea0ecc6147de10ddb6629')}
                </Typography>
                <Chip label={translate('text_634ea0ecc6147de10ddb662d')} />
              </Line>
              <Typography>{translate('text_634ea0ecc6147de10ddb6631')}</Typography>
            </div>
          </>
        )}
      </MainInfos>
      <NavigationTab tabs={tabsOptions} />
      <Settings>
        <Head $empty={!!gocardlessPaymentProvider && !loading}>
          <Title variant="subhead">{translate('text_634ea0ecc6147de10ddb663d')}</Title>
          <Button
            disabled={!gocardlessPaymentProvider}
            variant="secondary"
            onClick={() => window.open('https://proxy.lago.dev/gocardless/auth', '_blank') }
          >
            {translate('text_634ea0ecc6147de10ddb6639')}
          </Button>
        </Head>
        <Subtitle>{translate('text_634ea0ecc6147de10ddb6641')}</Subtitle>
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
`

const Title = styled(Typography)`
  height: ${NAV_HEIGHT}px;
  width: 100%;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;
`

const Head = styled.div<{ $empty?: boolean }>`
  height: ${NAV_HEIGHT}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
  margin-bottom: ${({ $empty }) => ($empty ? theme.spacing(4) : 0)};
`

const Subtitle = styled(Typography)`
  height: ${HEADER_TABLE_HEIGHT}px;
  width: 100%;
  display: flex;
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
