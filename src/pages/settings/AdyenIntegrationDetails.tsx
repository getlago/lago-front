import { gql } from '@apollo/client'
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
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
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
      navigate(
        generatePath(ADYEN_INTEGRATION_ROUTE, {
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
    <>
      <PageHeader.Wrapper withSide>
        <PageHeader.Group>
          <ButtonLink
            to={generatePath(ADYEN_INTEGRATION_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            })}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" className="w-30" />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {adyenPaymentProvider?.name}
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
      </PageHeader.Wrapper>

      <IntegrationsPage.Header
        isLoading={loading}
        integrationLogo={<Adyen />}
        integrationName={adyenPaymentProvider?.name}
        integrationChip={translate('text_62b1edddbf5f461ab971270d')}
        integrationDescription={`${translate('text_645d071272418a14c1c76a6d')} • ${translate('text_62b1edddbf5f461ab971271f')}`}
      />

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

          {loading &&
            [0, 1, 2].map((i) => (
              <IntegrationsPage.ItemSkeleton key={`item-skeleton-item-${i}`} />
            ))}

          {!loading && (
            <>
              <IntegrationsPage.DetailsItem
                icon="text"
                label={translate('text_626162c62f790600f850b76a')}
                value={adyenPaymentProvider?.name}
              />
              <IntegrationsPage.DetailsItem
                icon="id"
                label={translate('text_62876e85e32e0300e1803127')}
                value={adyenPaymentProvider?.code}
              />
              <IntegrationsPage.DetailsItem
                icon="key"
                label={translate('text_645d071272418a14c1c76aa4')}
                value={adyenPaymentProvider?.apiKey ?? undefined}
              />
              <IntegrationsPage.DetailsItem
                icon="bank"
                label={translate('text_645d071272418a14c1c76ab8')}
                value={adyenPaymentProvider?.merchantAccount ?? undefined}
              />
              {!!adyenPaymentProvider?.livePrefix && (
                <IntegrationsPage.DetailsItem
                  icon="info-circle"
                  label={translate('text_645d071272418a14c1c76acc')}
                  value={adyenPaymentProvider?.livePrefix ?? undefined}
                />
              )}
              {!!adyenPaymentProvider?.hmacKey && (
                <IntegrationsPage.DetailsItem
                  icon="info-circle"
                  label={translate('text_645d071272418a14c1c76ae0')}
                  value={adyenPaymentProvider?.hmacKey ?? undefined}
                />
              )}
            </>
          )}
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

          {loading && <IntegrationsPage.ItemSkeleton />}
          {!loading && !adyenPaymentProvider?.successRedirectUrl && (
                <Typography variant="caption" color="grey600">
                  {translate('text_65367cb78324b77fcb6af226', {
                    connectionName: translate('text_645d071272418a14c1c76a6d'),
                  })}
                </Typography>
          )}
          {!loading && adyenPaymentProvider.successRedirectUrl && (
            <IntegrationsPage.DetailsItem
              icon="globe"
              label={translate('text_65367cb78324b77fcb6af1c6')}
              value={adyenPaymentProvider?.successRedirectUrl}
            >
                  {(canEditIntegration || canDeleteIntegration) && (
                    <Popper
                      className="relative h-full"
                      PopperProps={{ placement: 'bottom-end' }}
                      opener={({ isOpen }) => (
                    <PopperOpener className="-top-4 right-0">
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
                    </Popper>
                  )}
            </IntegrationsPage.DetailsItem>
          )}
        </section>
      </Settings>
      <AddAdyenDialog ref={addAdyenDialogRef} />
      <DeleteAdyenIntegrationDialog ref={deleteDialogRef} />
      <AddEditDeleteSuccessRedirectUrlDialog ref={successRedirectUrlDialogRef} />
    </>
  )
}

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

export default AdyenIntegrationDetails
