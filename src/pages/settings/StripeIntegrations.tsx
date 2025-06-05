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
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { INTEGRATIONS_ROUTE, STRIPE_INTEGRATION_DETAILS_ROUTE } from '~/core/router'
import {
  AddStripeProviderDialogFragmentDoc,
  DeleteStripeIntegrationDialogFragmentDoc,
  ProviderTypeEnum,
  StripeForCreateAndEditSuccessRedirectUrlFragmentDoc,
  StripeProvider,
  useGetStripeIntegrationsListQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import Stripe from '~/public/images/stripe.svg'
import { MenuPopper, PageHeader, PopperOpener } from '~/styles'

gql`
  fragment StripeIntegrations on StripeProvider {
    id
    name
    code
  }

  query getStripeIntegrationsList($limit: Int, $type: ProviderTypeEnum) {
    paymentProviders(limit: $limit, type: $type) {
      collection {
        ... on StripeProvider {
          id
          ...StripeIntegrations
          ...AddStripeProviderDialog
          ...DeleteStripeIntegrationDialog
        }
      }
    }
  }

  ${StripeForCreateAndEditSuccessRedirectUrlFragmentDoc}
  ${DeleteStripeIntegrationDialogFragmentDoc}
  ${AddStripeProviderDialogFragmentDoc}
`

const StripeIntegrations = () => {
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()
  const addStripeDialogRef = useRef<AddStripeDialogRef>(null)
  const deleteDialogRef = useRef<DeleteStripeIntegrationDialogRef>(null)
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
  const { translate } = useInternationalization()
  const { data, loading } = useGetStripeIntegrationsListQuery({
    variables: { limit: 1000, type: ProviderTypeEnum.Stripe },
  })
  const connections = data?.paymentProviders?.collection as StripeProvider[] | undefined
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
              {translate('text_62b1edddbf5f461ab971277d')}
            </Typography>
          )}
        </PageHeader.Group>

        {canCreateIntegration && (
          <Button
            variant="primary"
            onClick={() => {
              addStripeDialogRef.current?.openDialog()
            }}
          >
            {translate('text_65846763e6140b469140e235')}
          </Button>
        )}
      </PageHeader.Wrapper>

      <IntegrationsPage.Header
        isLoading={loading}
        integrationLogo={<Stripe />}
        integrationName={translate('text_62b1edddbf5f461ab971277d')}
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
                  key={`stripe-connection-${index}`}
                  to={generatePath(STRIPE_INTEGRATION_DETAILS_ROUTE, {
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
                                addStripeDialogRef.current?.openDialog({
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

      <AddStripeDialog ref={addStripeDialogRef} />
      <DeleteStripeIntegrationDialog ref={deleteDialogRef} />
      <AddEditDeleteSuccessRedirectUrlDialog ref={successRedirectUrlDialogRef} />
    </>
  )
}

export default StripeIntegrations
