import { gql } from '@apollo/client'
import { Avatar, Icon } from 'lago-design-system'
import { useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { Button, ButtonLink, Chip, Popper, Skeleton, Typography } from '~/components/designSystem'
import {
  AddEditDeleteSuccessRedirectUrlDialog,
  AddEditDeleteSuccessRedirectUrlDialogRef,
} from '~/components/settings/integrations/AddEditDeleteSuccessRedirectUrlDialog'
import {
  AddMoneyhashDialog,
  AddMoneyhashDialogRef,
} from '~/components/settings/integrations/AddMoneyhashDialog'
import {
  DeleteMoneyhashIntegrationDialog,
  DeleteMoneyhashIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteMoneyhashIntegrationDialog'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { INTEGRATIONS_ROUTE, MONEYHASH_INTEGRATION_ROUTE } from '~/core/router'
import {
  AddMoneyhashProviderDialogFragmentDoc,
  DeleteMoneyhashIntegrationDialogFragmentDoc,
  MoneyhashForCreateAndEditSuccessRedirectUrlFragmentDoc,
  MoneyhashIntegrationDetailsFragment,
  ProviderTypeEnum,
  useGetMoneyhashIntegrationsDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import Moneyhash from '~/public/images/moneyhash.svg'
import { MenuPopper, PageHeader } from '~/styles'

const PROVIDER_CONNECTION_LIMIT = 2

gql`
  fragment MoneyhashIntegrationDetails on MoneyhashProvider {
    id
    apiKey
    code
    flowId
    name
  }
  query getMoneyhashIntegrationsDetails($id: ID!, $limit: Int, $type: ProviderTypeEnum) {
    paymentProvider(id: $id) {
      ... on MoneyhashProvider {
        id
        ...MoneyhashIntegrationDetails
        ...DeleteMoneyhashIntegrationDialog
        ...AddMoneyhashProviderDialog
        ...MoneyhashForCreateAndEditSuccessRedirectUrl
      }
    }
    paymentProviders(limit: $limit, type: $type) {
      collection {
        ... on MoneyhashProvider {
          id
        }
      }
    }
  }
  ${MoneyhashForCreateAndEditSuccessRedirectUrlFragmentDoc}
  ${DeleteMoneyhashIntegrationDialogFragmentDoc}
  ${AddMoneyhashProviderDialogFragmentDoc}
`

const MoneyhashIntegrationDetails = () => {
  const navigate = useNavigate()
  const { integrationId } = useParams()
  const addMoneyhashDialogRef = useRef<AddMoneyhashDialogRef>(null)
  const deleteDialogRef = useRef<DeleteMoneyhashIntegrationDialogRef>(null)
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { data, loading } = useGetMoneyhashIntegrationsDetailsQuery({
    variables: {
      id: integrationId as string,
      limit: PROVIDER_CONNECTION_LIMIT,
      type: ProviderTypeEnum.Moneyhash,
    },
    skip: !integrationId,
  })
  const moneyhashPaymentProvider = data?.paymentProvider as MoneyhashIntegrationDetailsFragment
  const deleteDialogCallback = () => {
    if ((data?.paymentProviders?.collection.length || 0) >= PROVIDER_CONNECTION_LIMIT) {
      navigate(
        generatePath(MONEYHASH_INTEGRATION_ROUTE, {
          integrationGroup: IntegrationsTabsOptionsEnum.Community,
        }),
      )
    } else {
      navigate(
        generatePath(INTEGRATIONS_ROUTE, {
          integrationGroup: IntegrationsTabsOptionsEnum.Community,
        }),
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
            to={MONEYHASH_INTEGRATION_ROUTE}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" className="w-30" />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {moneyhashPaymentProvider?.name}
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
                      addMoneyhashDialogRef.current?.openDialog({
                        provider: moneyhashPaymentProvider,
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
                        provider: moneyhashPaymentProvider,
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
      <div className="flex items-center px-4 py-8 md:px-12">
        {loading ? (
          <>
            <Skeleton className="mr-4" variant="connectorAvatar" size="large" />
            <div>
              <Skeleton className="mb-1 w-50" variant="text" />
              <Skeleton className="w-32" variant="text" />
            </div>
          </>
        ) : (
          <>
            <Avatar className="mr-4" variant="connector-full" size="large">
              <Moneyhash />
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <Typography variant="headline">{moneyhashPaymentProvider?.name}</Typography>
                <Chip label={translate('text_62b1edddbf5f461ab971270d')} />
              </div>
              <Typography>
                {translate('text_1733427981129n3wxjui0bex')}&nbsp;•&nbsp;
                {translate('text_62b1edddbf5f461ab971271f')}
              </Typography>
            </div>
          </>
        )}
      </div>
      <section className="max-w-168 px-4 md:px-12">
        <div className="relative flex h-nav items-center justify-between">
          <Typography variant="subhead1">{translate('text_645d071272418a14c1c76a9a')}</Typography>

          {canEditIntegration && (
            <Button
              variant="inline"
              disabled={loading}
              onClick={() => {
                addMoneyhashDialogRef.current?.openDialog({
                  provider: moneyhashPaymentProvider,
                  deleteModalRef: deleteDialogRef,
                  deleteDialogCallback,
                })
              }}
            >
              {translate('text_62b1edddbf5f461ab9712787')}
            </Button>
          )}
        </div>

        <>
          {loading ? (
            <>
              {[0, 1, 2].map((i) => (
                <div
                  className="flex h-nav items-center gap-3 shadow-b"
                  key={`item-skeleton-item-${i}`}
                >
                  <Skeleton variant="connectorAvatar" size="big" />
                  <Skeleton variant="text" className="w-60" />
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="flex h-nav items-center gap-3 shadow-b">
                <Avatar variant="connector" size="big">
                  <Icon name="text" color="dark" />
                </Avatar>
                <div>
                  <Typography variant="caption" color="grey600">
                    {translate('text_626162c62f790600f850b76a')}
                  </Typography>
                  <Typography variant="body" color="grey700">
                    {moneyhashPaymentProvider?.name}
                  </Typography>
                </div>
              </div>
              <div className="flex h-nav items-center gap-3 shadow-b">
                <Avatar variant="connector" size="big">
                  <Icon name="id" color="dark" />
                </Avatar>
                <div>
                  <Typography variant="caption" color="grey600">
                    {translate('text_62876e85e32e0300e1803127')}
                  </Typography>
                  <Typography variant="body" color="grey700">
                    {moneyhashPaymentProvider?.code}
                  </Typography>
                </div>
              </div>
              <div className="flex h-nav items-center gap-3 shadow-b">
                <Avatar variant="connector" size="big">
                  <Icon name="key" color="dark" />
                </Avatar>
                <div>
                  <Typography variant="caption" color="grey600">
                    {translate('text_645d071272418a14c1c76aa4')}
                  </Typography>
                  <Typography variant="body" color="grey700">
                    {moneyhashPaymentProvider?.apiKey}
                  </Typography>
                </div>
              </div>
              <div className="flex h-nav items-center gap-3 shadow-b">
                <Avatar variant="connector" size="big">
                  <Icon name="globe" color="dark" />
                </Avatar>
                <div>
                  <Typography variant="caption" color="grey600">
                    {translate('text_1737453888927uw38sepj7xy')}
                  </Typography>
                  <Typography variant="body" color="grey700">
                    {moneyhashPaymentProvider.flowId}
                  </Typography>
                </div>
              </div>
            </>
          )}
        </>
      </section>
      <AddMoneyhashDialog ref={addMoneyhashDialogRef} />
      <DeleteMoneyhashIntegrationDialog ref={deleteDialogRef} />
      <AddEditDeleteSuccessRedirectUrlDialog ref={successRedirectUrlDialogRef} />
    </>
  )
}

export default MoneyhashIntegrationDetails
