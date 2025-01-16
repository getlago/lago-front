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
  AddCashfreeDialog,
  AddCashfreeDialogRef,
} from '~/components/settings/integrations/AddCashfreeDialog'
import {
  AddEditDeleteSuccessRedirectUrlDialog,
  AddEditDeleteSuccessRedirectUrlDialogRef,
} from '~/components/settings/integrations/AddEditDeleteSuccessRedirectUrlDialog'
import {
  DeleteCashfreeIntegrationDialog,
  DeleteCashfreeIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteCashfreeIntegrationDialog'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { CASHFREE_INTEGRATION_DETAILS_ROUTE, INTEGRATIONS_ROUTE } from '~/core/router'
import {
  AddCashfreeProviderDialogFragmentDoc,
  CashfreeForCreateAndEditSuccessRedirectUrlFragmentDoc,
  CashfreeProvider,
  DeleteCashfreeIntegrationDialogFragmentDoc,
  ProviderTypeEnum,
  useGetCashfreeIntegrationsListQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import Cashfree from '~/public/images/cashfree.svg'
import { ListItemLink, MenuPopper, PageHeader, PopperOpener } from '~/styles'

gql`
  fragment CashfreeIntegrations on CashfreeProvider {
    id
    name
    code
  }

  query getCashfreeIntegrationsList($limit: Int, $type: ProviderTypeEnum) {
    paymentProviders(limit: $limit, type: $type) {
      collection {
        ... on CashfreeProvider {
          id
          ...CashfreeIntegrations
          ...AddCashfreeProviderDialog
          ...DeleteCashfreeIntegrationDialog
        }
      }
    }
  }
  ${CashfreeForCreateAndEditSuccessRedirectUrlFragmentDoc}
  ${DeleteCashfreeIntegrationDialogFragmentDoc}
  ${AddCashfreeProviderDialogFragmentDoc}
`

const CashfreeIntegrations = () => {
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()
  const addCashfreeDialogRef = useRef<AddCashfreeDialogRef>(null)
  const deleteDialogRef = useRef<DeleteCashfreeIntegrationDialogRef>(null)
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
  const { translate } = useInternationalization()
  const { data, loading } = useGetCashfreeIntegrationsListQuery({
    variables: { limit: 1000, type: ProviderTypeEnum.Cashfree },
  })
  const connections = data?.paymentProviders?.collection as CashfreeProvider[] | undefined
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
      <PageHeader withSide>
        <div className="flex items-center">
          <ButtonLink
            to={generatePath(INTEGRATIONS_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Community,
            })}
            className="mr-3"
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton className="w-30" variant="text" />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {translate('text_1727619878796wmgcntkfycn')}
            </Typography>
          )}
        </div>

        {canCreateIntegration && (
          <Button
            variant="primary"
            onClick={() => {
              addCashfreeDialogRef.current?.openDialog()
            }}
          >
            {translate('text_65846763e6140b469140e235')}
          </Button>
        )}
      </PageHeader>
      <div className="flex items-center px-4 py-8 md:px-12">
        {loading ? (
          <>
            <Skeleton className="mr-4" variant="connectorAvatar" size="large" />
            <div>
              <Skeleton className="mb-5 w-50" variant="text" />
              <Skeleton className="w-32" variant="text" />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <Avatar variant="connector-full" size="large">
                <Cashfree />
              </Avatar>
              <div>
                <div className="flex items-center">
                  <Typography className="mr-2" variant="headline">
                    {translate('text_1727619878796wmgcntkfycn')}
                  </Typography>
                  <Chip label={translate('text_62b1edddbf5f461ab971270d')} />
                </div>
                <Typography>{translate('text_62b1edddbf5f461ab971271f')}</Typography>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex max-w-[672px] flex-col gap-8 px-4 py-0 md:px-12">
        <section>
          <Typography className="h-18 w-full" variant="subhead">
            {translate('text_65846763e6140b469140e239')}
          </Typography>

          <>
            {loading ? (
              <>
                {[1, 2].map((i) => (
                  <div key={`item-skeleton-item-${i}`} className="flex h-18 items-center shadow-b">
                    <Skeleton className="mr-4" variant="connectorAvatar" size="big" />
                    <Skeleton className="w-60" variant="text" />
                  </div>
                ))}
              </>
            ) : (
              <>
                {connections?.map((connection, index) => {
                  return (
                    <div key={`gocardless-connection-${index}`} className="relative">
                      <ListItemLink
                        className="p-0" // p-0 used to reset the default padding of ListItemLink
                        tabIndex={0}
                        to={generatePath(CASHFREE_INTEGRATION_DETAILS_ROUTE, {
                          integrationId: connection.id,
                          integrationGroup: IntegrationsTabsOptionsEnum.Community,
                        })}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar variant="connector" size="big">
                            <Icon name="plug" color="dark" />
                          </Avatar>
                          <div>
                            <Typography
                              className="line-break-anywhere"
                              variant="body"
                              color="grey700"
                            >
                              {connection.name}
                            </Typography>
                            <Typography variant="caption" color="grey600">
                              {connection.code}
                            </Typography>
                          </div>
                          <div className="w-10 min-w-10" />
                        </div>
                      </ListItemLink>
                      {(canEditIntegration || canDeleteIntegration) && (
                        <Popper
                          PopperProps={{ placement: 'bottom-end' }}
                          opener={({ isOpen }) => (
                            // right-0 used to align the popper to the right
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
                                    addCashfreeDialogRef.current?.openDialog({
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
                    </div>
                  )
                })}
              </>
            )}
          </>
        </section>
      </div>

      <AddCashfreeDialog ref={addCashfreeDialogRef} />
      <DeleteCashfreeIntegrationDialog ref={deleteDialogRef} />
      <AddEditDeleteSuccessRedirectUrlDialog ref={successRedirectUrlDialogRef} />
    </>
  )
}

export default CashfreeIntegrations
