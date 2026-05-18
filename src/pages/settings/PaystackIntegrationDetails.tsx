import { gql } from '@apollo/client'
import { Icon } from 'lago-design-system'
import { useMemo, useRef } from 'react'
import { generatePath, useParams } from 'react-router-dom'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import {
  AddEditDeleteSuccessRedirectUrlDialog,
  AddEditDeleteSuccessRedirectUrlDialogRef,
} from '~/components/settings/integrations/AddEditDeleteSuccessRedirectUrlDialog'
import {
  AddPaystackDialog,
  AddPaystackDialogRef,
} from '~/components/settings/integrations/AddPaystackDialog'
import {
  DeletePaystackIntegrationDialog,
  DeletePaystackIntegrationDialogRef,
} from '~/components/settings/integrations/DeletePaystackIntegrationDialog'
import { addToast, envGlobalVar } from '~/core/apolloClient'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { INTEGRATIONS_ROUTE, PAYSTACK_INTEGRATION_ROUTE, useNavigate } from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  DeletePaystackIntegrationDialogFragmentDoc,
  PaystackForCreateAndEditSuccessRedirectUrlFragmentDoc,
  PaystackIntegrationDetailsFragment,
  ProviderTypeEnum,
  usePaystackIntegrationDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import Paystack from '~/public/images/paystack.svg'
import { MenuPopper, PopperOpener } from '~/styles'

const PROVIDER_CONNECTION_LIMIT = 2

gql`
  fragment PaystackIntegrationDetails on PaystackProvider {
    id
    name
    code
    secretKey
    successRedirectUrl
  }

  query paystackIntegrationDetails($id: ID!, $limit: Int, $type: ProviderTypeEnum) {
    paymentProvider(id: $id) {
      ... on PaystackProvider {
        id
        ...PaystackIntegrationDetails
        ...DeletePaystackIntegrationDialog
        ...PaystackForCreateAndEditSuccessRedirectUrl
      }
    }

    paymentProviders(limit: $limit, type: $type) {
      collection {
        ... on PaystackProvider {
          id
        }
      }
    }
  }

  ${DeletePaystackIntegrationDialogFragmentDoc}
  ${PaystackForCreateAndEditSuccessRedirectUrlFragmentDoc}
`

const PaystackIntegrationDetails = () => {
  const navigate = useNavigate()
  const { integrationId } = useParams()
  const { hasPermissions } = usePermissions()
  const addDialogRef = useRef<AddPaystackDialogRef>(null)
  const deleteDialogRef = useRef<DeletePaystackIntegrationDialogRef>(null)
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
  const { apiUrl } = envGlobalVar()
  const { organization } = useOrganizationInfos()
  const currentOrganizationId = organization?.id || ''
  const { translate } = useInternationalization()
  const { data, loading } = usePaystackIntegrationDetailsQuery({
    variables: {
      id: integrationId as string,
      limit: PROVIDER_CONNECTION_LIMIT,
      type: ProviderTypeEnum.Paystack,
    },
    skip: !integrationId,
  })
  const paystackPaymentProvider = data?.paymentProvider as PaystackIntegrationDetailsFragment

  const deleteDialogCallback = () => {
    if ((data?.paymentProviders?.collection.length || 0) >= PROVIDER_CONNECTION_LIMIT) {
      navigate(
        generatePath(PAYSTACK_INTEGRATION_ROUTE, {
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

  const webhookUrl = useMemo(
    () =>
      `${apiUrl}/webhooks/paystack/${currentOrganizationId}?code=${paystackPaymentProvider?.code}`,
    [apiUrl, currentOrganizationId, paystackPaymentProvider?.code],
  )

  if (!integrationId) return null

  return (
    <div>
      <MainHeader.Configure
        breadcrumb={[
          {
            label: translate('text_62b1edddbf5f461ab9712750'),
            path: generatePath(INTEGRATIONS_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Community,
            }),
          },
          {
            label: translate('text_67db6a10cb0b8031ca538909'),
            path: generatePath(PAYSTACK_INTEGRATION_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Community,
            }),
          },
        ]}
        entity={{
          viewName: paystackPaymentProvider?.name || '',
          viewNameLoading: loading,
          metadata: translate('text_1777918719746ry1nr3umglw'),
          metadataLoading: loading,
          badges: [{ type: 'default', label: translate('text_1777918719745atbfk53dngh') }],
          icon: <Paystack />,
        }}
        actions={{
          items: [
            {
              type: 'dropdown',
              label: translate('text_626162c62f790600f850b6fe'),
              items: [
                {
                  label: translate('text_65845f35d7d69c3ab4793dac'),
                  hidden: !canEditIntegration,
                  onClick: (closePopper) => {
                    addDialogRef.current?.openDialog({
                      provider: paystackPaymentProvider,
                      deleteModalRef: deleteDialogRef,
                      deleteDialogCallback,
                    })
                    closePopper()
                  },
                },
                {
                  label: translate('text_65845f35d7d69c3ab4793dad'),
                  hidden: !canDeleteIntegration,
                  onClick: (closePopper) => {
                    deleteDialogRef.current?.openDialog({
                      provider: paystackPaymentProvider,
                      callback: deleteDialogCallback,
                    })
                    closePopper()
                  },
                },
              ],
            },
          ],
          loading,
        }}
      />

      <div className="mb-12 flex max-w-[672px] flex-col gap-8 px-4 py-0 md:px-12">
        <Alert type="warning">{translate('text_1733303404277q80b216p5zr')}</Alert>

        <section>
          <div className="flex h-18 w-full items-center justify-between">
            <Typography className="flex h-18 w-full items-center" variant="subhead1">
              {translate('text_664c732c264d7eed1c74fdc5')}
            </Typography>

            {canEditIntegration && (
              <Button
                variant="quaternary"
                align="left"
                onClick={() => {
                  addDialogRef.current?.openDialog({
                    provider: paystackPaymentProvider,
                    deleteModalRef: deleteDialogRef,
                    deleteDialogCallback,
                  })
                }}
              >
                {translate('text_62b1edddbf5f461ab9712787')}
              </Button>
            )}
          </div>
          {loading && (
            <>
              {[0, 1, 2].map((i) => (
                <IntegrationsPage.ItemSkeleton key={`item-skeleton-${i}`} />
              ))}
              <div style={{ height: 24 }} />
              <Skeleton className="mb-4 w-60" variant="text" />
            </>
          )}
          {!loading && (
            <>
              <IntegrationsPage.DetailsItem
                icon="text"
                label={translate('text_626162c62f790600f850b76a')}
                value={paystackPaymentProvider.name}
              />
              <IntegrationsPage.DetailsItem
                icon="id"
                label={translate('text_62876e85e32e0300e1803127')}
                value={paystackPaymentProvider.code}
              />
              <IntegrationsPage.DetailsItem
                icon="key"
                label={translate('text_17497252876688ai900wowoc')}
                value={paystackPaymentProvider.secretKey ?? undefined}
              />
              <IntegrationsPage.DetailsItem
                icon="link"
                label={translate('text_6271200984178801ba8bdf22')}
                value={webhookUrl}
              >
                <Tooltip title={translate('text_1727623127072q52kj0u3xql')} placement="top-end">
                  <Button
                    variant="quaternary"
                    onClick={() => {
                      copyToClipboard(webhookUrl as string)
                      addToast({
                        severity: 'info',
                        translateKey: 'text_1727623090069kyp9o88hpqe',
                      })
                    }}
                  >
                    <Icon name="duplicate" />
                  </Button>
                </Tooltip>
              </IntegrationsPage.DetailsItem>

              <Typography
                className="mt-3"
                variant="caption"
                html={translate('text_1777918719746yy1e6vq8cx4')}
              />
            </>
          )}
        </section>

        <section>
          <IntegrationsPage.Headline label={translate('text_65367cb78324b77fcb6af21c')}>
            {canEditIntegration && (
              <Button
                variant="quaternary"
                disabled={!!paystackPaymentProvider?.successRedirectUrl}
                onClick={() => {
                  successRedirectUrlDialogRef.current?.openDialog({
                    mode: 'Add',
                    type: 'Paystack',
                    provider: paystackPaymentProvider,
                  })
                }}
              >
                {translate('text_65367cb78324b77fcb6af20e')}
              </Button>
            )}
          </IntegrationsPage.Headline>

          {loading && <IntegrationsPage.ItemSkeleton />}
          {!loading && !paystackPaymentProvider?.successRedirectUrl && (
            <Typography variant="caption" color="grey600">
              {translate('text_65367cb78324b77fcb6af226', {
                connectionName: translate('text_1777918719745atbfk53dngh'),
              })}
            </Typography>
          )}
          {!loading && paystackPaymentProvider?.successRedirectUrl && (
            <IntegrationsPage.DetailsItem
              icon="globe"
              label={translate('text_65367cb78324b77fcb6af1c6')}
              value={paystackPaymentProvider?.successRedirectUrl}
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
                              type: 'Paystack',
                              provider: paystackPaymentProvider,
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
                              type: 'Paystack',
                              provider: paystackPaymentProvider,
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
      </div>

      <AddPaystackDialog ref={addDialogRef} />
      <DeletePaystackIntegrationDialog ref={deleteDialogRef} />
      <AddEditDeleteSuccessRedirectUrlDialog ref={successRedirectUrlDialogRef} />
    </div>
  )
}

export default PaystackIntegrationDetails
