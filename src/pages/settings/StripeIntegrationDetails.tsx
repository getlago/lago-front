import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
import { INTEGRATIONS_ROUTE, STRIPE_INTEGRATION_ROUTE } from '~/core/router'
import {
  AddStripeProviderDialogFragmentDoc,
  DeleteStripeIntegrationDialogFragmentDoc,
  ProviderTypeEnum,
  StripeForCreateAndEditSuccessRedirectUrlFragmentDoc,
  StripeIntegrationDetailsFragment,
  useGetStripeIntegrationsDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import Stripe from '~/public/images/stripe.svg'
import { MenuPopper, NAV_HEIGHT, PageHeader, PopperOpener, theme } from '~/styles'

const PROVIDER_CONNECTION_LIMIT = 2

gql`
  fragment StripeIntegrationDetails on StripeProvider {
    id
    code
    name
    secretKey
    successRedirectUrl
  }

  query getStripeIntegrationsDetails($id: ID!, $limit: Int, $type: ProviderTypeEnum) {
    paymentProvider(id: $id) {
      ... on StripeProvider {
        id
        ...StripeIntegrationDetails
        ...DeleteStripeIntegrationDialog
        ...AddStripeProviderDialog
        ...StripeForCreateAndEditSuccessRedirectUrl
      }
    }

    paymentProviders(limit: $limit, type: $type) {
      collection {
        ... on StripeProvider {
          id
        }
      }
    }
  }

  ${DeleteStripeIntegrationDialogFragmentDoc}
  ${AddStripeProviderDialogFragmentDoc}
  ${StripeForCreateAndEditSuccessRedirectUrlFragmentDoc}
`

const StripeIntegrationDetails = () => {
  const navigate = useNavigate()
  const { integrationId } = useParams()
  const { hasPermissions } = usePermissions()
  const addDialogRef = useRef<AddStripeDialogRef>(null)
  const deleteDialogRef = useRef<DeleteStripeIntegrationDialogRef>(null)
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
  const { translate } = useInternationalization()
  const { data, loading } = useGetStripeIntegrationsDetailsQuery({
    variables: {
      id: integrationId as string,
      limit: PROVIDER_CONNECTION_LIMIT,
      type: ProviderTypeEnum.Stripe,
    },
    skip: !integrationId,
  })
  const stripePaymentProvider = data?.paymentProvider as StripeIntegrationDetailsFragment
  const deleteDialogCallback = () => {
    if (data?.paymentProviders?.collection.length === PROVIDER_CONNECTION_LIMIT) {
      navigate(STRIPE_INTEGRATION_ROUTE)
    } else {
      navigate(INTEGRATIONS_ROUTE)
    }
  }

  const canEditIntegration = hasPermissions(['organizationIntegrationsUpdate'])
  const canDeleteIntegration = hasPermissions(['organizationIntegrationsDelete'])

  return (
    <>
      <PageHeader $withSide>
        <HeaderBlock>
          <ButtonLink
            to={STRIPE_INTEGRATION_ROUTE}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" height={12} width={120} />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {stripePaymentProvider?.name}
            </Typography>
          )}
        </HeaderBlock>
        {(canEditIntegration || canDeleteIntegration) && (
          <Popper
            PopperProps={{ placement: 'bottom-end' }}
            opener={
              <Button endIcon="chevron-down">{translate('text_626162c62f790600f850b6fe')}</Button>
            }
          >
            {({ closePopper }) => (
              <MenuPopper>
                {canEditIntegration && (
                  <Button
                    variant="quaternary"
                    fullWidth
                    align="left"
                    onClick={() => {
                      addDialogRef.current?.openDialog({
                        provider: stripePaymentProvider,
                        deleteModalRef: deleteDialogRef,
                        deleteDialogCallback,
                      })
                      closePopper()
                    }}
                  >
                    {translate('text_65845f35d7d69c3ab4793dac')}
                  </Button>
                )}

                {canDeleteIntegration && (
                  <Button
                    variant="quaternary"
                    align="left"
                    fullWidth
                    onClick={() => {
                      deleteDialogRef.current?.openDialog({
                        provider: stripePaymentProvider,
                        callback: deleteDialogCallback,
                      })
                      closePopper()
                    }}
                  >
                    {translate('text_65845f35d7d69c3ab4793dad')}
                  </Button>
                )}
              </MenuPopper>
            )}
          </Popper>
        )}
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
                <Typography variant="headline">{stripePaymentProvider?.name}</Typography>
                <Chip label={translate('text_62b1edddbf5f461ab971270d')} />
              </Line>
              <Typography>
                {translate('text_62b1edddbf5f461ab9712707')}&nbsp;•&nbsp;
                {translate('text_62b1edddbf5f461ab971271f')}
              </Typography>
            </div>
          </>
        )}
      </MainInfos>

      <ContentWrapper>
        <section>
          <InlineTitle>
            <Title variant="subhead">{translate('text_657078c28394d6b1ae1b9725')}</Title>

            {canEditIntegration && (
              <Button
                variant="quaternary"
                disabled={loading}
                onClick={() => {
                  addDialogRef.current?.openDialog({
                    provider: stripePaymentProvider,
                    deleteModalRef: deleteDialogRef,
                    deleteDialogCallback,
                  })
                }}
              >
                {translate('text_62b1edddbf5f461ab9712787')}
              </Button>
            )}
          </InlineTitle>

          <LineItem>
            {loading ? (
              <>
                <Skeleton variant="connectorAvatar" size="big" marginRight="16px" />
                <Skeleton variant="text" width={240} height={12} />
              </>
            ) : (
              <>
                <Avatar variant="connector" size="big">
                  <Icon color="dark" name="text" />
                </Avatar>
                <Stack>
                  <Typography variant="caption" color="grey600">
                    {translate('text_626162c62f790600f850b76a')}
                  </Typography>
                  <Typography color="textSecondary">{stripePaymentProvider?.name}</Typography>
                </Stack>
              </>
            )}
          </LineItem>
          <LineItem>
            {loading ? (
              <>
                <Skeleton variant="connectorAvatar" size="big" marginRight="16px" />
                <Skeleton variant="text" width={240} height={12} />
              </>
            ) : (
              <>
                <Avatar variant="connector" size="big">
                  <Icon color="dark" name="id" />
                </Avatar>
                <Stack>
                  <Typography variant="caption" color="grey600">
                    {translate('text_62876e85e32e0300e1803127')}
                  </Typography>
                  <Typography color="textSecondary">{stripePaymentProvider?.code}</Typography>
                </Stack>
              </>
            )}
          </LineItem>
          <LineItem>
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
                <Stack>
                  <Typography variant="caption" color="grey600">
                    {translate('text_62b1edddbf5f461ab9712748')}
                  </Typography>
                  <Typography color="textSecondary">{stripePaymentProvider?.secretKey}</Typography>
                </Stack>
              </>
            )}
          </LineItem>
          <LineItemCaption variant="caption" color="grey600">
            {translate('text_637f813d31381b1ed90ab30e')}
          </LineItemCaption>
        </section>

        <section>
          <InlineTitle>
            <Typography variant="subhead">{translate('text_65367cb78324b77fcb6af21c')}</Typography>

            {canEditIntegration && (
              <Button
                variant="quaternary"
                disabled={!!stripePaymentProvider?.successRedirectUrl || loading}
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
            )}
          </InlineTitle>

          {loading ? (
            <LineItem>
              <Skeleton variant="connectorAvatar" size="big" marginRight="16px" />
              <Skeleton variant="text" width={240} height={12} />
            </LineItem>
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

                  {(canEditIntegration || canDeleteIntegration) && (
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
                          {canEditIntegration && (
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
                          )}

                          {canDeleteIntegration && (
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
                          )}
                        </MenuPopper>
                      )}
                    </LocalPopper>
                  )}
                </SuccessPaumentRedirectUrlItem>
              )}
            </>
          )}
        </section>
      </ContentWrapper>

      <AddStripeDialog ref={addDialogRef} />
      <DeleteStripeIntegrationDialog ref={deleteDialogRef} />
      <AddEditDeleteSuccessRedirectUrlDialog ref={successRedirectUrlDialogRef} />
    </>
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

  ${theme.breakpoints.down('md')} {
    padding: ${theme.spacing(8)} ${theme.spacing(4)};
  }
`

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(8)};
  padding: 0 ${theme.spacing(12)};
  box-sizing: border-box;
  max-width: ${theme.spacing(168)};

  ${theme.breakpoints.down('md')} {
    padding: 0 ${theme.spacing(4)};
  }
`

const Title = styled(Typography)`
  height: ${NAV_HEIGHT}px;
  width: 100%;
  display: flex;
  align-items: center;
`

const LineItem = styled.div`
  height: ${NAV_HEIGHT}px;
  max-width: ${theme.spacing(168)};
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const LineItemCaption = styled(Typography)`
  margin-top: ${theme.spacing(3)};
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

export default StripeIntegrationDetails
