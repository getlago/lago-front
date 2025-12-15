import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import {
  Button,
  ButtonLink,
  Popper,
  Skeleton,
  Tooltip,
  Typography
} from '~/components/designSystem'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import { returnFirstDefinedArrayRatesSumAsString } from '~/components/plans/utils'
import {
  AddBraintreeDialog,
  AddBraintreeDialogRef,
} from  '~/components/settings/integrations/AddBraintreeDialog'
import {
  AddEditDeleteSuccessRedirectUrlDialog,
  AddEditDeleteSuccessRedirectUrlDialogRef,
} from '~/components/settings/integrations/AddEditDeleteSuccessRedirectUrlDialog'
import {
  DeleteBraintreeIntegrationDialog,
  DeleteBraintreeIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteBraintreeIntegrationDialog'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { BRAINTREE_INTEGRATION_ROUTE, INTEGRATIONS_ROUTE } from '~/core/router'
import {
  AddBraintreeProviderDialogFragmentDoc,
  BraintreeForCreateAndEditSuccessRedirectUrlFragmentDoc,
  BraintreeIntegrationDetailsFragment,
  DeleteBraintreeIntegrationDialogFragmentDoc,
  ProviderTypeEnum,
  useGetBraintreeIntegrationsDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import Braintree from '~/public/images/braintree.svg'
import { MenuPopper, PageHeader, PopperOpener } from '~/styles'

const PROVIDER_CONNECTION_LIMIT = 2

gql `
  fragment BraintreeIntegrationDetails on BraintreeProvider {
    id
    code
    merchantId
    name
    privateKey
    publicKey
    successRedirectUrl
  }

  query getBraintreeIntegrationsDetails($id: ID!, $limit: Int, $type: ProviderTypeEnum) {
    paymentProvider(id: $id) {
      ... on BraintreeProvider {
        id
        ...BraintreeIntegrationDetails
        ...DeleteBraintreeIntegrationDialog
        ...AddBraintreeProviderDialog
        ...BraintreeForCreateAndEditSuccessRedirectUrl
      }
    }

    paymentProviders(limit: $limit, type: $type) {
      collection {
        ... on BraintreeProvider {
          id
        }
      }
    }
  }

  ${BraintreeForCreateAndEditSuccessRedirectUrlFragmentDoc}
  ${DeleteBraintreeIntegrationDialogFragmentDoc}
  ${AddBraintreeProviderDialogFragmentDoc}
`
const BraintreeIntegrationDetails = () => {
  const navigate = useNavigate()
  const { integrationId } = useParams()
  const addBraintreeDialogRef = useRef<AddBraintreeDialogRef>(null)
  const deleteDialogRef = useRef<DeleteBraintreeIntegrationDialogRef>(null)
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { data, loading } = useGetBraintreeIntegrationsDetailsQuery({
    variables: {
      id: integrationId as string,
      limit: PROVIDER_CONNECTION_LIMIT,
      type: ProviderTypeEnum.Braintree,
    },
    skip: !integrationId,
  })
  const braintreePaymentProvider = data?.paymentProvider as BraintreeIntegrationDetailsFragment
  const deleteDialogCallback = () => {
    if ((data?.paymentProviders?.collection.length || 0) >= PROVIDER_CONNECTION_LIMIT) {
      navigate(
        generatePath(BRAINTREE_INTEGRATION_ROUTE, {
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
            to={generatePath(BRAINTREE_INTEGRATION_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            })}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" className="w-30" />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {braintreePaymentProvider?.name}
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
                      addBraintreeDialogRef.current?.openDialog({
                        provider: braintreePaymentProvider,
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
                        provider: braintreePaymentProvider,
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
        integrationLogo={<Braintree />}
        integrationName={braintreePaymentProvider?.name}
        integrationChip={translate('text_62b1edddbf5f461ab971270d')}
        integrationDescription={`${translate('text_1765369124717esjsm0d93ud')} • ${translate('text_62b1edddbf5f461ab971271f')}`}
      />

      <IntegrationsPage.Container>
        <section>
          <IntegrationsPage.Headline label={translate('text_645d071272418a14c1c76a9a')}>
            {canEditIntegration && (
              <Button
                variant="inline"
                disabled={loading}
                onClick={() => {
                  addBraintreeDialogRef.current?.openDialog({
                    provider: braintreePaymentProvider,
                    deleteModalRef: deleteDialogRef,
                    deleteDialogCallback,
                  })
                }}
              >
                {translate('text_62b1edddbf5f461ab9712787')}
              </Button>
            )}
          </IntegrationsPage.Headline>

          {loading &&
            [0, 1, 2].map((i) => <IntegrationsPage.ItemSkeleton key={`item-skeleton-item-${i}`} />)}

          {!loading && (
            <>
              <IntegrationsPage.DetailsItem
                icon="text"
                label={translate('text_626162c62f790600f850b76a')}
                value={braintreePaymentProvider?.name}
              />
              <IntegrationsPage.DetailsItem
                icon="id"
                label={translate('text_62876e85e32e0300e1803127')}
                value={braintreePaymentProvider?.code}
              />
              <IntegrationsPage.DetailsItem
                icon="bank"
                label={translate('text_17653805407249fwvjsg27kq')}
                value={braintreePaymentProvider?.merchantId ?? undefined}
              />
              <IntegrationsPage.DetailsItem
                icon="key"
                label={translate('text_17653804594443xf5mmwbg22')}
                value={braintreePaymentProvider?.publicKey ?? undefined}
              />
              <IntegrationsPage.DetailsItem
                icon="key"
                label={translate('text_1765380504804b3hk15zplt2')}
                value={braintreePaymentProvider?.privateKey ?? undefined}
              />
            </>
          )}
        </section>

        <section>
          <IntegrationsPage.Headline label={translate('text_65367cb78324b77fcb6af21c')}>
            {canEditIntegration && (
              <Button
                variant="inline"
                disabled={!!braintreePaymentProvider?.successRedirectUrl}
                onClick={() => {
                  successRedirectUrlDialogRef.current?.openDialog({
                    mode: 'Add',
                    type: 'Braintree',
                    provider: braintreePaymentProvider,
                  })
                }}
              >
                {translate('text_65367cb78324b77fcb6af20e')}
              </Button>
            )}
          </IntegrationsPage.Headline>

          {loading && <IntegrationsPage.ItemSkeleton />}
          {!loading && !braintreePaymentProvider?.successRedirectUrl && (
            <Typography variant="caption" color="grey600">
              {translate('text_65367cb78324b77fcb6af226', {
                connectionName: translate('text_1765369124717esjsm0d93ud'),
              })}
            </Typography>
          )}
          {!loading && braintreePaymentProvider.successRedirectUrl && (
            <IntegrationsPage.DetailsItem
              icon="globe"
              label={translate('text_65367cb78324b77fcb6af1c6')}
              value={braintreePaymentProvider?.successRedirectUrl}
            >
              {(canEditIntegration || canDeleteIntegration) && (
                <Popper
                  className="relative h-full"
                  PopperProps={{ placement: 'bottom-end' }}
                  opener={({ isOpen }) => (
                    <PopperOpener className="-top-4 right-0 md:right-0">
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
                              provider: braintreePaymentProvider,
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
                              provider: braintreePaymentProvider,
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
      </IntegrationsPage.Container>

      <AddBraintreeDialog ref={addBraintreeDialogRef} />
      <DeleteBraintreeIntegrationDialog ref={deleteDialogRef} />
      <AddEditDeleteSuccessRedirectUrlDialog ref={successRedirectUrlDialogRef} />
    </>
  )
}

export default BraintreeIntegrationDetails