import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import {
  Button,
  ButtonLink,
  Popper,
  Skeleton,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import {
  AddBraintreeDialog,
  AddBraintreeDialogRef,
} from '~/components/settings/integrations/AddBraintreeDialog'
import {
  AddEditDeleteSuccessRedirectUrlDialog,
  AddEditDeleteSuccessRedirectUrlDialogRef,
} from '~/components/settings/integrations/AddEditDeleteSuccessRedirectUrlDialog'
import {
  DeleteBraintreeIntegrationDialog,
  DeleteBraintreeIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteBraintreeIntegrationDialog'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { BRAINTREE_INTEGRATION_DETAILS_ROUTE, INTEGRATIONS_ROUTE } from '~/core/router'
import {
  AddBraintreeProviderDialogFragmentDoc,
  BraintreeForCreateAndEditSuccessRedirectUrlFragmentDoc,
  BraintreeProvider,
  DeleteBraintreeIntegrationDialogFragmentDoc,
  ProviderTypeEnum,
  useGetBraintreeIntegrationsListQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import Braintree from '~/public/images/braintree.svg'
import { MenuPopper, PageHeader, PopperOpener } from '~/styles'

gql `
  fragment BraintreeIntegrations on BraintreeProvider {
    id
    name
    code
  }

  query getBraintreeIntegrationsList($limit: Int, $type: ProviderTypeEnum) {
    paymentProviders(limit: $limit, type: $type) {
      collection {
        ... on BraintreeProvider {
          id
          ...BraintreeIntegrations
          ...AddBraintreeProviderDialog
          ...DeleteBraintreeIntegrationDialog
        }
      }
    }
  }

  ${BraintreeForCreateAndEditSuccessRedirectUrlFragmentDoc}
  ${DeleteBraintreeIntegrationDialogFragmentDoc}
  ${AddBraintreeProviderDialogFragmentDoc}
`

const BraintreeIntegrations = () => {
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()
  const addBraintreeDialogRef = useRef<AddBraintreeDialogRef>(null)
    const deleteDialogRef = useRef<DeleteBraintreeIntegrationDialogRef>(null)
    const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
    const { translate } = useInternationalization()
    const { data, loading } = useGetBraintreeIntegrationsListQuery({
      variables: { limit: 1000, type: ProviderTypeEnum.Braintree },
    })
    const connections = data?.paymentProviders?.collection as BraintreeProvider[] | undefined
    const deleteDialogCallback =
      connections && connections.length === 1
        ? () =>
            navigate(
              generatePath(INTEGRATIONS_ROUTE, {
                integrationGroup: IntegrationsTabsOptionsEnum.Lago,
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
                integrationGroup: IntegrationsTabsOptionsEnum.Lago,
              })}
              type="button"
              buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
            />
            {loading ? (
              <Skeleton variant="text" className="w-30" />
            ) : (
              <Typography variant="bodyHl" color="textSecondary">
                {translate('text_645d071272418a14c1c76a6d')}
              </Typography>
            )}
          </PageHeader.Group>

          {canCreateIntegration && (
            <Button
              variant="primary"
              onClick={() => {
                addBraintreeDialogRef.current?.openDialog()
              }}
            >
              {translate('text_65846763e6140b469140e235')}
            </Button>
          )}
        </PageHeader.Wrapper>

        <IntegrationsPage.Header
          isLoading={loading}
          integrationLogo={<Braintree />}
          integrationName={translate('text_645d071272418a14c1c76a6d')}
          integrationChip={translate('text_62b1edddbf5f461ab971270d')}
          integrationDescription={translate('text_62b1edddbf5f461ab971271f')}
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
                    key={`braintree-connection-${index}`}
                    to={generatePath(BRAINTREE_INTEGRATION_DETAILS_ROUTE, {
                      integrationId: connection.id,
                      integrationGroup: IntegrationsTabsOptionsEnum.Lago,
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
                                  addBraintreeDialogRef.current?.openDialog({
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
                  </IntegrationsPage.ListItem>
                )
              })}
          </section>
        </IntegrationsPage.Container>
        <AddBraintreeDialog ref={addBraintreeDialogRef} />
        <DeleteBraintreeIntegrationDialog ref={deleteDialogRef} />
        <AddEditDeleteSuccessRedirectUrlDialog ref={successRedirectUrlDialogRef} />
      </>
    )
}

export default BraintreeIntegrations