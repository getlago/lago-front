import { useRef } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router'
import { gql } from '@apollo/client'

import { theme, PageHeader, NAV_HEIGHT, HEADER_TABLE_HEIGHT, MenuPopper } from '~/styles'
import { INTEGRATIONS_ROUTE } from '~/core/router'
import {
  Typography,
  Button,
  Skeleton,
  Avatar,
  Chip,
  Icon,
  BasicTabs,
  Popper,
} from '~/components/designSystem'
import { Switch } from '~/components/form'
import {
  useStripeIntegrationsSettingQuery,
  useUpdateStripeIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Stripe from '~/public/images/stripe.svg'
import {
  AddStripeDialog,
  AddStripeDialogRef,
} from '~/components/settings/integrations/AddStripeDialog'
import {
  DeleteStripeIntegrationDialog,
  DeleteStripeIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteStripeIntegrationDialog'
import { addToast } from '~/core/apolloClient'

gql`
  fragment StripeIntegration on StripeProvider {
    id
    secretKey
    createCustomers
  }

  query stripeIntegrationsSetting {
    currentUser {
      id
      organizations {
        id
        stripePaymentProvider {
          ...StripeIntegration
        }
      }
    }
  }

  mutation updateStripeIntegration($input: AddStripePaymentProviderInput!) {
    addStripePaymentProvider(input: $input) {
      ...StripeIntegration
    }
  }
`

const StripeIntegration = () => {
  const addDialogRef = useRef<AddStripeDialogRef>(null)
  const deleteDialogRef = useRef<DeleteStripeIntegrationDialogRef>(null)
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const { data, loading } = useStripeIntegrationsSettingQuery()
  const [update] = useUpdateStripeIntegrationMutation({
    onCompleted({ addStripePaymentProvider }) {
      if (addStripePaymentProvider?.id) {
        addToast({
          message: translate('text_62b1edddbf5f461ab9712819'),
          severity: 'success',
        })
      }
    },
  })
  const tabsOptions = [
    {
      title: translate('text_62b1edddbf5f461ab9712725'),
    },
  ]

  const stripePaymentProvider = (data?.currentUser?.organizations || [])[0]?.stripePaymentProvider

  return (
    <div>
      <PageHeader $withSide>
        <HeaderBlock>
          <Button
            variant="quaternary"
            icon="arrow-left"
            onClick={() => navigate(INTEGRATIONS_ROUTE)}
          />
          {loading ? (
            <Skeleton variant="text" height={12} width={120} />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {translate('text_62b1edddbf5f461ab97126ee')}
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
              <Stripe />
            </StyledAvatar>
            <div>
              <Line>
                <Typography variant="headline">
                  {translate('text_62b1edddbf5f461ab9712707')}
                </Typography>
                <Chip label={translate('text_62b1edddbf5f461ab971270d')} />
              </Line>
              <Typography>{translate('text_62b1edddbf5f461ab971271f')}</Typography>
            </div>
          </>
        )}
      </MainInfos>
      <BasicTabs tabs={tabsOptions} value={0} onClick={() => {}} />
      <Settings>
        <Title variant="subhead">{translate('text_62b1edddbf5f461ab971273f')}</Title>
        <Subtitle variant="bodyHl" color="disabled">
          {translate('text_62b1edddbf5f461ab971275b')}
        </Subtitle>
        <ApiKeyItem>
          {loading ? (
            <>
              <Skeleton variant="connectorAvatar" size="medium" marginRight="16px" />
              <Skeleton variant="text" width={240} height={12} />
            </>
          ) : (
            <>
              <Avatar variant="connector" size="medium">
                <Icon color="dark" name="key" />
              </Avatar>
              <ApiKey color="textSecondary">{stripePaymentProvider?.secretKey}</ApiKey>
              <Popper
                PopperProps={{ placement: 'bottom-end' }}
                opener={<Button icon="dots-horizontal" variant="quaternary" />}
              >
                {({ closePopper }) => (
                  <MenuPopper>
                    <Button
                      startIcon="pen"
                      variant="quaternary"
                      fullWidth
                      align="left"
                      onClick={() => {
                        addDialogRef.current?.openDialog()
                      }}
                    >
                      {translate('text_62b1edddbf5f461ab9712787')}
                    </Button>
                    <Button
                      startIcon="trash"
                      variant="quaternary"
                      align="left"
                      fullWidth
                      onClick={() => {
                        deleteDialogRef.current?.openDialog()
                        closePopper()
                      }}
                    >
                      {translate('text_62b1edddbf5f461ab971279f')}
                    </Button>
                  </MenuPopper>
                )}
              </Popper>
            </>
          )}
        </ApiKeyItem>
        {!loading && (
          <>
            <TitleWithMargin variant="subhead">
              {translate('text_62b1edddbf5f461ab97127b4')}
            </TitleWithMargin>
            <SwitchBlock>
              <Switch
                name="createCustomers"
                checked={!stripePaymentProvider ? false : stripePaymentProvider?.createCustomers}
                onChange={async (value) =>
                  await update({ variables: { input: { createCustomers: value } } })
                }
                label={translate('text_62b1edddbf5f461ab97127c8')}
                subLabel={translate('text_62b1edddbf5f461ab97127d8')}
              />
            </SwitchBlock>
          </>
        )}
      </Settings>
      <AddStripeDialog isEdition ref={addDialogRef} />
      <DeleteStripeIntegrationDialog id={stripePaymentProvider?.id || ''} ref={deleteDialogRef} />
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

const SwitchBlock = styled.div`
  > * {
    margin-bottom: ${theme.spacing(6)};
    &:last-child {
      margin-bottom: ${theme.spacing(20)};
    }
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

const Subtitle = styled(Typography)`
  height: ${HEADER_TABLE_HEIGHT}px;
  width: 100%;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;
`

const TitleWithMargin = styled(Title)`
  margin-bottom: ${theme.spacing(6)};
`

const ApiKeyItem = styled.div`
  height: ${NAV_HEIGHT}px;
  width: 100%;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;
  margin-bottom: ${theme.spacing(12)};

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
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

const ApiKey = styled(Typography)`
  margin-right: auto;
`

export default StripeIntegration
