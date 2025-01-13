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
  Typography,
} from '~/components/designSystem'
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
import { MenuPopper, NAV_HEIGHT, PageHeader, theme } from '~/styles'

const PROVIDER_CONNECTION_LIMIT = 2

gql`
  fragment MoneyhashIntegrationDetails on MoneyhashProvider {
    id
    apiKey
    code
    failedRedirectUrl
    successRedirectUrl
    pendingRedirectUrl
    webhookRedirectUrl
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
      navigate(MONEYHASH_INTEGRATION_ROUTE)
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
            to={MONEYHASH_INTEGRATION_ROUTE}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" width={120} />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {moneyhashPaymentProvider?.name}
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
              <Moneyhash />
            </Avatar>
            <div>
              <Line>
                <Typography variant="headline">{moneyhashPaymentProvider?.name}</Typography>
                <Chip label={translate('text_62b1edddbf5f461ab971270d')} />
              </Line>
              <Typography>
                {translate('text_1733427981129n3wxjui0bex')}&nbsp;•&nbsp;
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
                      {moneyhashPaymentProvider?.name}
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
                      {moneyhashPaymentProvider?.code}
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
                      {moneyhashPaymentProvider?.apiKey}
                    </Typography>
                  </div>
                </ApiKeyItem>
                <ApiKeyItem>
                  <Avatar variant="connector" size="big">
                    <Icon name="globe" color="dark" />
                  </Avatar>
                  <div>
                    <Typography variant="caption" color="grey600">
                      {translate('text_1733729620554tspzhwa5d3t')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      {moneyhashPaymentProvider?.successRedirectUrl}
                    </Typography>
                  </div>
                </ApiKeyItem>

                <ApiKeyItem>
                  <Avatar variant="connector" size="big">
                    <Icon name="globe" color="dark" />
                  </Avatar>
                  <div>
                    <Typography variant="caption" color="grey600">
                      {translate('text_1733729624253c5lsxyvwal7')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      {moneyhashPaymentProvider?.failedRedirectUrl}
                    </Typography>
                  </div>
                </ApiKeyItem>
                <ApiKeyItem>
                  <Avatar variant="connector" size="big">
                    <Icon name="globe" color="dark" />
                  </Avatar>
                  <div>
                    <Typography variant="caption" color="grey600">
                      {translate('text_17337296266252mlh212u2wb')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      {moneyhashPaymentProvider?.pendingRedirectUrl}
                    </Typography>
                  </div>
                </ApiKeyItem>
                <ApiKeyItem>
                  <Avatar variant="connector" size="big">
                    <Icon name="globe" color="dark" />
                  </Avatar>
                  <div>
                    <Typography variant="caption" color="grey600">
                      {translate('text_173372976803867ab7rn8nav')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      {moneyhashPaymentProvider?.webhookRedirectUrl}
                    </Typography>
                  </div>
                </ApiKeyItem>
              </>
            )}
          </>
        </section>
      </Settings>
      <AddMoneyhashDialog ref={addMoneyhashDialogRef} />
      <DeleteMoneyhashIntegrationDialog ref={deleteDialogRef} />
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

export default MoneyhashIntegrationDetails
