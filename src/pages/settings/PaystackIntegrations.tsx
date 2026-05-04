import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import {
  AddPaystackDialog,
  AddPaystackDialogRef,
} from '~/components/settings/integrations/AddPaystackDialog'
import {
  DeletePaystackIntegrationDialog,
  DeletePaystackIntegrationDialogRef,
} from '~/components/settings/integrations/DeletePaystackIntegrationDialog'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { INTEGRATIONS_ROUTE, PAYSTACK_INTEGRATION_DETAILS_ROUTE } from '~/core/router'
import {
  DeletePaystackIntegrationDialogFragmentDoc,
  PaystackProvider,
  ProviderTypeEnum,
  useGetPaystackIntegrationsListQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import Paystack from '~/public/images/paystack.svg'
import { MenuPopper, PopperOpener } from '~/styles'

gql`
  fragment PaystackIntegrations on PaystackProvider {
    id
    name
    code
  }

  query getPaystackIntegrationsList($limit: Int, $type: ProviderTypeEnum) {
    paymentProviders(limit: $limit, type: $type) {
      collection {
        ... on PaystackProvider {
          id
          ...PaystackIntegrations
          ...DeletePaystackIntegrationDialog
        }
      }
    }
  }

  ${DeletePaystackIntegrationDialogFragmentDoc}
`

const PaystackIntegrations = () => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const addDialogRef = useRef<AddPaystackDialogRef>(null)
  const deleteDialogRef = useRef<DeletePaystackIntegrationDialogRef>(null)
  const { hasPermissions } = usePermissions()

  const { data, loading } = useGetPaystackIntegrationsListQuery({
    variables: { limit: 1000, type: ProviderTypeEnum.Paystack },
  })
  const connections = data?.paymentProviders?.collection?.filter(
    (provider) => provider.__typename === 'PaystackProvider',
  ) as PaystackProvider[] | undefined
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
      <MainHeader.Configure
        breadcrumb={[
          {
            label: translate('text_62b1edddbf5f461ab9712750'),
            path: generatePath(INTEGRATIONS_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Community,
            }),
          },
        ]}
        entity={{
          viewName: translate('text_1777918719746yfiw5h24icv'),
          viewNameLoading: loading,
          metadata: translate('text_62b1edddbf5f461ab971271f'),
          metadataLoading: loading,
          badges: [{ type: 'default', label: translate('text_634ea0ecc6147de10ddb662d') }],
          icon: <Paystack />,
        }}
        actions={{
          items: [
            {
              type: 'action',
              label: translate('text_65846763e6140b469140e235'),
              variant: 'primary',
              hidden: !canCreateIntegration,
              onClick: () => {
                addDialogRef.current?.openDialog()
              },
            },
          ],
          loading,
        }}
      />

      <IntegrationsPage.Container>
        <section>
          <IntegrationsPage.Headline label={translate('text_65846763e6140b469140e239')} />

          {loading &&
            [1, 2].map((i) => <IntegrationsPage.ItemSkeleton key={`item-skeleton-item-${i}`} />)}

          {!loading &&
            connections?.map((connection, index) => {
              return (
                <IntegrationsPage.ListItem
                  key={`paystack-connection-${index}`}
                  to={generatePath(PAYSTACK_INTEGRATION_DETAILS_ROUTE, {
                    integrationId: connection.id,
                    integrationGroup: IntegrationsTabsOptionsEnum.Community,
                  })}
                  label={connection.name}
                  subLabel={connection.code}
                >
                  {(canEditIntegration || canDeleteIntegration) && (
                    <Popper
                      PopperProps={{ placement: 'bottom-end' }}
                      opener={({ isOpen }) => (
                        <PopperOpener className="right-0 md:right-0">
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
                                addDialogRef.current?.openDialog({
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
                              {translate('text_65845f35d7d69c3ab4793dad')}
                            </Button>
                          )}
                        </MenuPopper>
                      )}
                    </Popper>
                  )}
                </IntegrationsPage.ListItem>
              )
            })}
        </section>
      </IntegrationsPage.Container>

      <AddPaystackDialog ref={addDialogRef} />
      <DeletePaystackIntegrationDialog ref={deleteDialogRef} />
    </>
  )
}

export default PaystackIntegrations
