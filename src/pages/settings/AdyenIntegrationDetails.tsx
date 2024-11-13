import { gql } from '@apollo/client'
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
  AddAdyenDialog,
  AddAdyenDialogRef,
} from '~/components/settings/integrations/AddAdyenDialog'
import {
  AddEditDeleteSuccessRedirectUrlDialog,
  AddEditDeleteSuccessRedirectUrlDialogRef,
} from '~/components/settings/integrations/AddEditDeleteSuccessRedirectUrlDialog'
import {
  DeleteAdyenIntegrationDialog,
  DeleteAdyenIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteAdyenIntegrationDialog'
import { ADYEN_INTEGRATION_ROUTE, INTEGRATIONS_ROUTE } from '~/core/router'
import {
  AddAdyenProviderDialogFragmentDoc,
  AdyenForCreateAndEditSuccessRedirectUrlFragmentDoc,
  AdyenIntegrationDetailsFragment,
  DeleteAdyenIntegrationDialogFragmentDoc,
  ProviderTypeEnum,
  useGetAdyenIntegrationsDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import Adyen from '~/public/images/adyen.svg'
import { MenuPopper, NAV_HEIGHT, PageHeader, PopperOpener, theme } from '~/styles'

const PROVIDER_CONNECTION_LIMIT = 2

gql`
  fragment AdyenIntegrationDetails on AdyenProvider {
    id
    apiKey
    code
    hmacKey
    livePrefix
    merchantAccount
    successRedirectUrl
    name
  }

  query getAdyenIntegrationsDetails($id: ID!, $limit: Int, $type: ProviderTypeEnum) {
    paymentProvider(id: $id) {
      ... on AdyenProvider {
        id
        ...AdyenIntegrationDetails
        ...DeleteAdyenIntegrationDialog
        ...AddAdyenProviderDialog
        ...AdyenForCreateAndEditSuccessRedirectUrl
      }
    }

    paymentProviders(limit: $limit, type: $type) {
      collection {
        ... on AdyenProvider {
          id
        }
      }
    }
  }

  ${AdyenForCreateAndEditSuccessRedirectUrlFragmentDoc}
  ${DeleteAdyenIntegrationDialogFragmentDoc}
  ${AddAdyenProviderDialogFragmentDoc}
`

const AdyenIntegrationDetails = () => {
  const navigate = useNavigate()
  const { integrationId } = useParams()
  const addAdyenDialogRef = useRef<AddAdyenDialogRef>(null)
  const deleteDialogRef = useRef<DeleteAdyenIntegrationDialogRef>(null)
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { data, loading } = useGetAdyenIntegrationsDetailsQuery({
    variables: {
      id: integrationId as string,
      limit: PROVIDER_CONNECTION_LIMIT,
      type: ProviderTypeEnum.Adyen,
    },
    skip: !integrationId,
  })
  const adyenPaymentProvider = data?.paymentProvider as AdyenIntegrationDetailsFragment
  const deleteDialogCallback = () => {
    if ((data?.paymentProviders?.collection.length || 0) >= PROVIDER_CONNECTION_LIMIT) {
      navigate(ADYEN_INTEGRATION_ROUTE)
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
            to={ADYEN_INTEGRATION_ROUTE}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" width={120} />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {adyenPaymentProvider?.name}
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
                    fullWidth
                    variant="quaternary"
                    align="left"
                    onClick={() => {
                      addAdyenDialogRef.current?.openDialog({
                        provider: adyenPaymentProvider,
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
                        provider: adyenPaymentProvider,
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
              <Skeleton variant="text" width={200} marginBottom="22px" />
              <Skeleton variant="text" width={128} />
            </div>
          </>
        ) : (
          <>
            <Avatar className="mr-4" variant="connector-full" size="large">
              <Adyen />
            </Avatar>
            <div>
              <Line>
                <Typography variant="headline">{adyenPaymentProvider?.name}</Typography>
                <Chip label={translate('text_62b1edddbf5f461ab971270d')} />
              </Line>
              <Typography>
                {translate('text_645d071272418a14c1c76a6d')}&nbsp;•&nbsp;
                {translate('text_62b1edddbf5f461ab971271f')}
              </Typography>
            </div>
          </>
        )}
      </MainInfos>
      <Settings>
        <section>
          <InlineTitle>
            <Typography variant="subhead">{translate('text_645d071272418a14c1c76a9a')}</Typography>

            {canEditIntegration && (
              <Button
                variant="quaternary"
                disabled={loading}
                onClick={() => {
                  addAdyenDialogRef.current?.openDialog({
                    provider: adyenPaymentProvider,
                    deleteModalRef: deleteDialogRef,
                    deleteDialogCallback,
                  })
                }}
              >
                {translate('text_62b1edddbf5f461ab9712787')}
              </Button>
            )}
          </InlineTitle>

          <>
            {loading ? (
              <>
                {[0, 1, 2].map((i) => (
                  <ApiKeyItem key={`item-skeleton-item-${i}`}>
                    <Skeleton variant="connectorAvatar" size="big" marginRight="16px" />
                    <Skeleton variant="text" width={240} />
                  </ApiKeyItem>
                ))}
              </>
            ) : (
              <>
                <ApiKeyItem>
                  <Avatar variant="connector" size="big">
                    <Icon name="text" color="dark" />
                  </Avatar>
                  <div>
                    <Typography variant="caption" color="grey600">
                      {translate('text_626162c62f790600f850b76a')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      {adyenPaymentProvider?.name}
                    </Typography>
                  </div>
                </ApiKeyItem>
                <ApiKeyItem>
                  <Avatar variant="connector" size="big">
                    <Icon name="id" color="dark" />
                  </Avatar>
                  <div>
                    <Typography variant="caption" color="grey600">
                      {translate('text_62876e85e32e0300e1803127')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      {adyenPaymentProvider?.code}
                    </Typography>
                  </div>
                </ApiKeyItem>
                <ApiKeyItem>
                  <Avatar variant="connector" size="big">
                    <Icon name="key" color="dark" />
                  </Avatar>
                  <div>
                    <Typography variant="caption" color="grey600">
                      {translate('text_645d071272418a14c1c76aa4')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      {adyenPaymentProvider?.apiKey}
                    </Typography>
                  </div>
                </ApiKeyItem>
                <ApiKeyItem>
                  <Avatar variant="connector" size="big">
                    <Icon name="bank" color="dark" />
                  </Avatar>
                  <div>
                    <Typography variant="caption" color="grey600">
                      {translate('text_645d071272418a14c1c76ab8')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      {adyenPaymentProvider?.merchantAccount}
                    </Typography>
                  </div>
                </ApiKeyItem>
                {!!adyenPaymentProvider?.livePrefix && (
                  <ApiKeyItem>
                    <Avatar variant="connector" size="big">
                      <Icon name="info-circle" color="dark" />
                    </Avatar>
                    <div>
                      <Typography variant="caption" color="grey600">
                        {translate('text_645d071272418a14c1c76acc')}
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {adyenPaymentProvider?.livePrefix}
                      </Typography>
                    </div>
                  </ApiKeyItem>
                )}
                {!!adyenPaymentProvider?.hmacKey && (
                  <ApiKeyItem>
                    <Avatar variant="connector" size="big">
                      <Icon name="info-circle" color="dark" />
                    </Avatar>
                    <div>
                      <Typography variant="caption" color="grey600">
                        {translate('text_645d071272418a14c1c76ae0')}
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {adyenPaymentProvider?.hmacKey}
                      </Typography>
                    </div>
                  </ApiKeyItem>
                )}
              </>
            )}
          </>
        </section>

        <section>
          <InlineTitle>
            <Typography variant="subhead">{translate('text_65367cb78324b77fcb6af21c')}</Typography>
            {canEditIntegration && (
              <Button
                variant="quaternary"
                disabled={!!adyenPaymentProvider?.successRedirectUrl}
                onClick={() => {
                  successRedirectUrlDialogRef.current?.openDialog({
                    mode: 'Add',
                    type: 'Adyen',
                    provider: adyenPaymentProvider,
                  })
                }}
              >
                {translate('text_65367cb78324b77fcb6af20e')}
              </Button>
            )}
          </InlineTitle>

          {loading ? (
            <HeaderBlock>
              <Skeleton variant="connectorAvatar" size="big" marginRight="16px" />
              <Skeleton variant="text" width={240} />
            </HeaderBlock>
          ) : (
            <>
              {!adyenPaymentProvider?.successRedirectUrl ? (
                <Typography variant="caption" color="grey600">
                  {translate('text_65367cb78324b77fcb6af226', {
                    connectionName: translate('text_645d071272418a14c1c76a6d'),
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
                        {adyenPaymentProvider?.successRedirectUrl}
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
                                  type: 'Adyen',
                                  provider: adyenPaymentProvider,
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
                                  type: 'Adyen',
                                  provider: adyenPaymentProvider,
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
      </Settings>
      <AddAdyenDialog ref={addAdyenDialogRef} />
      <DeleteAdyenIntegrationDialog ref={deleteDialogRef} />
      <AddEditDeleteSuccessRedirectUrlDialog ref={successRedirectUrlDialogRef} />
    </>
  )
}

const HeaderBlock = styled.div`
  display: flex;
  align-items: center;

  > *:first-child {
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

const Settings = styled.div`
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

const ApiKeyItem = styled.div`
  height: ${NAV_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const Line = styled.div`
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(2)};
  }
`

export default AdyenIntegrationDetails
