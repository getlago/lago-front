import { gql } from '@apollo/client'
import { useRef } from 'react'
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
import {
  AddStripeDialog,
  AddStripeDialogRef,
} from '~/components/settings/integrations/AddStripeDialog'
import {
  DeleteStripeIntegrationDialog,
  DeleteStripeIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteStripeIntegrationDialog'
import { INTEGRATIONS_ROUTE } from '~/core/router'
import { useStripeIntegrationsSettingQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Stripe from '~/public/images/stripe.svg'
import { MenuPopper, NAV_HEIGHT, PageHeader, PopperOpener, theme } from '~/styles'

gql`
  fragment StripeIntegration on StripeProvider {
    id
    secretKey
    createCustomers
    successRedirectUrl
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
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
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

      <ContentWrapper>
        <section>
          <Title variant="subhead">{translate('text_62b1edddbf5f461ab971273f')}</Title>
          <ApiKeyItem>
            {loading ? (
              <>
                <Skeleton variant="connectorAvatar" size="big" marginRight="16px" />
                <Skeleton variant="text" width={240} height={12} />
              </>
            ) : (
              <>
                <Avatar variant="connector" size="big">
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
        </section>

        <section>
          <InlineTitle>
            <Typography variant="subhead">{translate('text_65367cb78324b77fcb6af21c')}</Typography>
            <Button
              variant="quaternary"
              disabled={!!stripePaymentProvider?.successRedirectUrl}
              onClick={() => {
                successRedirectUrlDialogRef.current?.openDialog({
                  mode: 'Add',
                  type: 'Stripe',
                  provider: stripePaymentProvider,
                })
              }}
            >
              {translate('text_65367cb78324b77fcb6af20e')}
            </Button>
          </InlineTitle>

          {loading ? (
            <ApiKeyItem>
              <Skeleton variant="connectorAvatar" size="big" marginRight="16px" />
              <Skeleton variant="text" width={240} height={12} />
            </ApiKeyItem>
          ) : (
            <>
              {!stripePaymentProvider?.successRedirectUrl ? (
                <Typography variant="caption" color="grey600">
                  {translate('text_65367cb78324b77fcb6af226', {
                    connectionName: translate('text_62b1edddbf5f461ab971277d'),
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
                        {stripePaymentProvider?.successRedirectUrl}
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
                              type: 'Stripe',
                              provider: stripePaymentProvider,
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
                              type: 'Stripe',
                              provider: stripePaymentProvider,
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

      <AddStripeDialog isEdition ref={addDialogRef} />
      <DeleteStripeIntegrationDialog id={stripePaymentProvider?.id || ''} ref={deleteDialogRef} />
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
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(8)};
  margin: 0 ${theme.spacing(12)};
  box-sizing: border-box;
  max-width: ${theme.spacing(168)};
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

export default StripeIntegration
