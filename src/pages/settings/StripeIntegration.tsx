import { useRef } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { theme, PageHeader, NAV_HEIGHT, MenuPopper } from '~/styles'
import { INTEGRATIONS_ROUTE } from '~/core/router'
import {
  Typography,
  Button,
  ButtonLink,
  Skeleton,
  Avatar,
  Chip,
  Icon,
  Popper,
} from '~/components/designSystem'
import { useStripeIntegrationsSettingQuery } from '~/generated/graphql'
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

gql`
  fragment StripeIntegration on StripeProvider {
    id
    secretKey
    createCustomers
  }

  query stripeIntegrationsSetting {
    organization {
      id
      stripePaymentProvider {
        ...StripeIntegration
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
  const { translate } = useInternationalization()
  const { data, loading } = useStripeIntegrationsSettingQuery()
  const stripePaymentProvider = data?.organization?.stripePaymentProvider

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

      <Settings>
        <Title variant="subhead">{translate('text_62b1edddbf5f461ab971273f')}</Title>
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
        <Typography variant="caption" color="grey600">
          {translate('text_637f813d31381b1ed90ab30e')}
        </Typography>
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
  display: flex;
  align-items: center;
`

const ApiKeyItem = styled.div`
  height: ${NAV_HEIGHT}px;
  max-width: ${theme.spacing(168)};
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;
  margin-bottom: ${theme.spacing(3)};

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
