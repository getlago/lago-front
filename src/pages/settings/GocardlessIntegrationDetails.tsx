import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import {
  Avatar,
  Button,
  ButtonLink,
  Icon,
  Popper,
  Skeleton,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import {
  AddEditDeleteSuccessRedirectUrlDialog,
  AddEditDeleteSuccessRedirectUrlDialogRef,
} from '~/components/settings/integrations/AddEditDeleteSuccessRedirectUrlDialog'
import {
  AddGocardlessDialog,
  AddGocardlessDialogRef,
} from '~/components/settings/integrations/AddGocardlessDialog'
import {
  DeleteGocardlessIntegrationDialog,
  DeleteGocardlessIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteGocardlessIntegrationDialog'
import { addToast, envGlobalVar } from '~/core/apolloClient'
import { buildGocardlessAuthUrl } from '~/core/constants/externalUrls'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { GOCARDLESS_INTEGRATION_ROUTE, INTEGRATIONS_ROUTE } from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  AddGocardlessProviderDialogFragmentDoc,
  DeleteGocardlessIntegrationDialogFragmentDoc,
  GocardlessIntegrationDetailsFragment,
  ProviderTypeEnum,
  useGetGocardlessIntegrationsDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import GoCardless from '~/public/images/gocardless-large.svg'
import { MenuPopper, NAV_HEIGHT, PageHeader, PopperOpener, theme } from '~/styles'

const PROVIDER_CONNECTION_LIMIT = 2

gql`
  fragment GocardlessIntegrationDetails on GocardlessProvider {
    id
    code
    name
    successRedirectUrl
    webhookSecret
  }

  query getGocardlessIntegrationsDetails($id: ID!, $limit: Int, $type: ProviderTypeEnum) {
    paymentProvider(id: $id) {
      ... on GocardlessProvider {
        id
        ...GocardlessIntegrationDetails
        ...DeleteGocardlessIntegrationDialog
        ...AddGocardlessProviderDialog
      }
    }

    paymentProviders(limit: $limit, type: $type) {
      collection {
        ... on GocardlessProvider {
          id
        }
      }
    }
  }

  ${DeleteGocardlessIntegrationDialogFragmentDoc}
  ${AddGocardlessProviderDialogFragmentDoc}
`

const GocardlessIntegrationDetails = () => {
  const navigate = useNavigate()
  const { integrationId } = useParams()
  const { lagoOauthProxyUrl } = envGlobalVar()
  const { hasPermissions } = usePermissions()
  const addDialogRef = useRef<AddGocardlessDialogRef>(null)
  const deleteDialogRef = useRef<DeleteGocardlessIntegrationDialogRef>(null)
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
  const { translate } = useInternationalization()
  const { data, loading } = useGetGocardlessIntegrationsDetailsQuery({
    variables: {
      id: integrationId as string,
      limit: PROVIDER_CONNECTION_LIMIT,
      type: ProviderTypeEnum.Gocardless,
    },
    skip: !integrationId,
  })
  const gocardlessPaymentProvider = data?.paymentProvider as GocardlessIntegrationDetailsFragment
  const isConnectionEstablished = !!gocardlessPaymentProvider?.webhookSecret
  const deleteDialogCallback = () => {
    if ((data?.paymentProviders?.collection.length || 0) >= PROVIDER_CONNECTION_LIMIT) {
      navigate(
        generatePath(GOCARDLESS_INTEGRATION_ROUTE, {
          integrationGroup: IntegrationsTabsOptionsEnum.Lago,
        }),
      )
    } else {
      navigate(
        generatePath(INTEGRATIONS_ROUTE, { integrationGroup: IntegrationsTabsOptionsEnum.Lago }),
      )
    }
  }

  const canEditIntegration = hasPermissions(['organizationIntegrationsUpdate'])
  const canDeleteIntegration = hasPermissions(['organizationIntegrationsDelete'])

  return (
    <div>
      <PageHeader.Wrapper withSide>
        <PageHeader.Group>
          <ButtonLink
            to={generatePath(GOCARDLESS_INTEGRATION_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            })}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" className="w-30" />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {gocardlessPaymentProvider?.name}
            </Typography>
          )}
        </PageHeader.Group>
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
                  <>
                    <Button
                      variant="quaternary"
                      fullWidth
                      align="left"
                      onClick={() => {
                        addDialogRef.current?.openDialog({
                          provider: gocardlessPaymentProvider,
                          deleteModalRef: deleteDialogRef,
                          deleteDialogCallback,
                        })
                        closePopper()
                      }}
                    >
                      {translate('text_65845f35d7d69c3ab4793dac')}
                    </Button>
                    <Button
                      variant="quaternary"
                      fullWidth
                      align="left"
                      onClick={() => {
                        setTimeout(() => {
                          const myWindow = window.open('', '_blank')

                          if (myWindow?.location?.href) {
                            myWindow.location.href = buildGocardlessAuthUrl(
                              lagoOauthProxyUrl,
                              gocardlessPaymentProvider.name,
                              gocardlessPaymentProvider.code,
                            )
                            closePopper()
                            return myWindow?.focus()
                          }

                          myWindow?.close()
                          addToast({
                            severity: 'danger',
                            translateKey: 'text_62b31e1f6a5b8b1b745ece48',
                          })
                        }, 0)
                      }}
                    >
                      {translate('text_658567dffff71e31ea5f0d33')}
                    </Button>
                  </>
                )}

                {canDeleteIntegration && (
                  <Button
                    variant="quaternary"
                    align="left"
                    fullWidth
                    onClick={() => {
                      deleteDialogRef.current?.openDialog({
                        provider: gocardlessPaymentProvider,
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
      </PageHeader.Wrapper>

      <IntegrationsPage.Header
        isLoading={loading}
        integrationLogo={<GoCardless />}
        integrationName={gocardlessPaymentProvider?.name}
        integrationChip={
          isConnectionEstablished ? translate('text_634ea0ecc6147de10ddb662d') : undefined
        }
        integrationDescription={`${translate('text_634ea0ecc6147de10ddb6648')} • ${translate('text_62b1edddbf5f461ab971271f')}`}
      />

      <ContentWrapper>
        <section>
          <InlineTitle>
            <Typography className="flex h-18 w-full items-center" variant="subhead">
              {translate('text_637f813d31381b1ed90ab315')}
            </Typography>

            {canEditIntegration && (
              <Button
                variant="quaternary"
                align="left"
                onClick={() => {
                  addDialogRef.current?.openDialog({
                    provider: gocardlessPaymentProvider,
                    deleteModalRef: deleteDialogRef,
                    deleteDialogCallback,
                  })
                }}
              >
                {translate('text_62b1edddbf5f461ab9712787')}
              </Button>
            )}
          </InlineTitle>
          {loading ? (
            <>
              {[0, 1, 2].map((i) => (
                <Item key={`item-skeleton-${i}`} direction="row" alignItems="center">
                  <Skeleton variant="connectorAvatar" size="big" className="mr-4" />
                  <Skeleton variant="text" className="w-60" />
                </Item>
              ))}
              <div style={{ height: 20 }} />
              <Skeleton variant="text" className="mb-4 w-60" />
            </>
          ) : (
            <>
              {isConnectionEstablished && (
                <>
                  <Item direction="row" alignItems="center" spacing={3}>
                    <Avatar variant="connector" size="big">
                      <Icon color="dark" name="text" />
                    </Avatar>
                    <Stack direction="column">
                      <Typography variant="caption" color="grey600">
                        {translate('text_626162c62f790600f850b76a')}
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {gocardlessPaymentProvider.name}
                      </Typography>
                    </Stack>
                  </Item>

                  <Item direction="row" alignItems="center" spacing={3}>
                    <Avatar variant="connector" size="big">
                      <Icon color="dark" name="id" />
                    </Avatar>
                    <Stack direction="column">
                      <Typography variant="caption" color="grey600">
                        {translate('text_62876e85e32e0300e1803127')}{' '}
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {gocardlessPaymentProvider.code}
                      </Typography>
                    </Stack>
                  </Item>

                  <Item direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={3}>
                      <Avatar variant="connector" size="big">
                        <Icon color="dark" name="key" />
                      </Avatar>
                      <Stack direction="column">
                        <Typography variant="caption" color="grey600">
                          {translate('text_658567dffff71e31ea5f0d3e')}
                        </Typography>
                        <Typography variant="body" color="grey700">
                          {gocardlessPaymentProvider.webhookSecret}
                        </Typography>
                      </Stack>
                    </Stack>
                    <Tooltip title={translate('text_6360ddae753a8b3e11c80c66')} placement="top-end">
                      <Button
                        variant="quaternary"
                        onClick={() => {
                          copyToClipboard(gocardlessPaymentProvider?.webhookSecret as string)
                          addToast({
                            severity: 'info',
                            translateKey: 'text_6360ddae753a8b3e11c80c6c',
                          })
                        }}
                      >
                        <Icon name="duplicate" />
                      </Button>
                    </Tooltip>
                  </Item>
                </>
              )}
            </>
          )}
          {!loading && (
            <Typography className="mt-3" variant="caption">
              {translate('text_635bd8acb686f18909a57c93')}
            </Typography>
          )}
        </section>

        <section>
          <InlineTitle>
            <Typography variant="subhead">{translate('text_65367cb78324b77fcb6af21c')}</Typography>

            {canEditIntegration && (
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
            )}
          </InlineTitle>

          {loading ? (
            <div className="flex items-center gap-3">
              <Skeleton variant="connectorAvatar" size="big" className="mr-4" />
              <Skeleton variant="text" className="w-60" />
            </div>
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
                  {(canEditIntegration || canDeleteIntegration) && (
                    <Popper
                      className="relative h-full"
                      PopperProps={{ placement: 'bottom-end' }}
                      opener={({ isOpen }) => (
                        <PopperOpener className="right-0 top-4">
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
                                  type: 'GoCardless',
                                  provider: gocardlessPaymentProvider,
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
                                  type: 'GoCardless',
                                  provider: gocardlessPaymentProvider,
                                })
                                closePopper()
                              }}
                            >
                              {translate('text_65367cb78324b77fcb6af243')}
                            </Button>
                          )}
                        </MenuPopper>
                      )}
                    </Popper>
                  )}
                </SuccessPaumentRedirectUrlItem>
              )}
            </>
          )}
        </section>
      </ContentWrapper>
      <AddGocardlessDialog ref={addDialogRef} />
      <DeleteGocardlessIntegrationDialog ref={deleteDialogRef} />
      <AddEditDeleteSuccessRedirectUrlDialog ref={successRedirectUrlDialogRef} />
    </div>
  )
}

const ContentWrapper = styled.div`
  max-width: ${theme.spacing(168)};
  padding: 0 ${theme.spacing(12)};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(8)};

  ${theme.breakpoints.down('md')} {
    padding: 0 ${theme.spacing(4)};
  }
`

const Item = styled(Stack)`
  height: ${NAV_HEIGHT}px;
  max-width: ${theme.spacing(168)};
  box-shadow: ${theme.shadows[7]};
`

const InlineTitle = styled.div`
  position: relative;
  height: ${NAV_HEIGHT}px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
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

export default GocardlessIntegrationDetails
