import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

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
  AddMoneyhashDialog,
  AddMoneyhashDialogRef,
} from '~/components/settings/integrations/AddMoneyhashDialog'
import {
  DeleteMoneyhashIntegrationDialog,
  DeleteMoneyhashIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteMoneyhashIntegrationDialog'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { INTEGRATIONS_ROUTE, MONEYHASH_INTEGRATION_DETAILS_ROUTE } from '~/core/router'
import {
  AddMoneyhashProviderDialogFragmentDoc,
  DeleteMoneyhashIntegrationDialogFragmentDoc,
  MoneyhashForCreateAndEditSuccessRedirectUrlFragmentDoc,
  MoneyhashProvider,
  ProviderTypeEnum,
  useGetMoneyhashIntegrationsListQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import Moneyhash from '~/public/images/moneyhash.svg'
import { ItemContainer, ListItemLink, MenuPopper, PageHeader, PopperOpener } from '~/styles'

gql`
  fragment MoneyhashIntegrations on MoneyhashProvider {
    id
    name
    code
  }
  query getMoneyhashIntegrationsList($limit: Int, $type: ProviderTypeEnum) {
    paymentProviders(limit: $limit, type: $type) {
      collection {
        ... on MoneyhashProvider {
          id
          ...MoneyhashIntegrations
          ...AddMoneyhashProviderDialog
          ...DeleteMoneyhashIntegrationDialog
        }
      }
    }
  }
  ${MoneyhashForCreateAndEditSuccessRedirectUrlFragmentDoc}
  ${DeleteMoneyhashIntegrationDialogFragmentDoc}
  ${AddMoneyhashProviderDialogFragmentDoc}
`

const MoneyhashIntegrations = () => {
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()
  const addMoneyhashDialogRef = useRef<AddMoneyhashDialogRef>(null)
  const deleteDialogRef = useRef<DeleteMoneyhashIntegrationDialogRef>(null)
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
  const { translate } = useInternationalization()
  const { data, loading } = useGetMoneyhashIntegrationsListQuery({
    variables: { limit: 1000, type: ProviderTypeEnum.Moneyhash },
  })
  const connections = data?.paymentProviders?.collection as MoneyhashProvider[] | undefined
  const deleteDialogCallback =
    connections && connections.length === 1
      ? () =>
          navigate(
            generatePath(INTEGRATIONS_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Community,
            }),
          )
      : undefined
  const canCreateIntegration = hasPermissions(['organizationIntegrationsCreate'])
  const canEditIntegration = hasPermissions(['organizationIntegrationsUpdate'])
  const canDeleteIntegration = hasPermissions(['organizationIntegrationsDelete'])

  return (
    <>
      <PageHeader.Wrapper withSide>
        <PageHeader.Group>
          <ButtonLink
            to={generatePath(INTEGRATIONS_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Community,
            })}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" className="w-30" />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {translate('text_1733427981129n3wxjui0bex')}
            </Typography>
          )}
        </PageHeader.Group>

        {canCreateIntegration && (
          <Button
            variant="primary"
            onClick={() => {
              addMoneyhashDialogRef.current?.openDialog()
            }}
          >
            {translate('text_65846763e6140b469140e235')}
          </Button>
        )}
      </PageHeader.Wrapper>
      <div className="flex items-center px-4 py-8 md:px-12">
        {loading ? (
          <>
            <Skeleton variant="connectorAvatar" size="large" className="mr-4" />
            <div>
              <Skeleton variant="text" className="mb-5 w-50" />
              <Skeleton variant="text" className="w-34" />
            </div>
          </>
        ) : (
          <>
            <Avatar className="mr-4" variant="connector-full" size="large">
              <Moneyhash />
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <Typography variant="headline">
                  {translate('text_1733427981129n3wxjui0bex')}
                </Typography>
                <Chip label={translate('text_62b1edddbf5f461ab971270d')} />
              </div>
              <Typography>{translate('text_62b1edddbf5f461ab971271f')}</Typography>
            </div>
          </>
        )}
      </div>
      <div className="flex max-w-168 flex-col gap-8 px-4 md:px-12">
        <section>
          <div className="flex h-nav w-full items-center">
            <Typography variant="subhead">{translate('text_65846763e6140b469140e239')}</Typography>
          </div>

          <>
            {loading ? (
              <>
                {[1, 2].map((i) => (
                  <div
                    className="flex h-nav items-center gap-3 shadow-b"
                    key={`item-skeleton-item-${i}`}
                  >
                    <Skeleton variant="connectorAvatar" size="big" className="mr-4" />
                    <Skeleton variant="text" className="w-60" />
                  </div>
                ))}
              </>
            ) : (
              <>
                {connections?.map((connection, index) => {
                  return (
                    <ItemContainer key={`moneyhash-connection-${index}`}>
                      <ListItemLink
                        className="p-0"
                        tabIndex={0}
                        to={generatePath(MONEYHASH_INTEGRATION_DETAILS_ROUTE, {
                          integrationId: connection.id,
                          integrationGroup: IntegrationsTabsOptionsEnum.Community,
                        })}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar variant="connector" size="big">
                            <Icon name="plug" color="dark" />
                          </Avatar>
                          <div>
                            <Typography variant="body" color="grey700">
                              {connection.name}
                            </Typography>
                            <Typography variant="caption" color="grey600">
                              {connection.code}
                            </Typography>
                          </div>
                        </div>
                      </ListItemLink>
                      {(canEditIntegration || canDeleteIntegration) && (
                        <Popper
                          PopperProps={{ placement: 'bottom-end' }}
                          opener={({ isOpen }) => (
                            <PopperOpener className="right-0">
                              <Tooltip
                                placement="top-end"
                                disableHoverListener={isOpen}
                                title={translate('text_626162c62f790600f850b7b6')}
                              >
                                <Button
                                  icon="dots-horizontal"
                                  variant="quaternary"
                                  data-test="plan-item-options"
                                />
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
                                  align="left"
                                  onClick={() => {
                                    addMoneyhashDialogRef.current?.openDialog({
                                      provider: connection,
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
                                  startIcon="trash"
                                  variant="quaternary"
                                  align="left"
                                  onClick={() => {
                                    deleteDialogRef.current?.openDialog({
                                      provider: connection,
                                      callback: deleteDialogCallback,
                                    })
                                    closePopper()
                                  }}
                                >
                                  {translate('text_645d071272418a14c1c76a81')}
                                </Button>
                              )}
                            </MenuPopper>
                          )}
                        </Popper>
                      )}
                    </ItemContainer>
                  )
                })}
              </>
            )}
          </>
        </section>
      </div>
      <AddMoneyhashDialog ref={addMoneyhashDialogRef} />
      <DeleteMoneyhashIntegrationDialog ref={deleteDialogRef} />
      <AddEditDeleteSuccessRedirectUrlDialog ref={successRedirectUrlDialogRef} />
    </>
  )
}

export default MoneyhashIntegrations
