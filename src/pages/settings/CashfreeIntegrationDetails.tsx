import { gql } from '@apollo/client'
import { Icon } from 'lago-design-system'
import { useMemo, useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import {
  Alert,
  Button,
  ButtonLink,
  Popper,
  Skeleton,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import {
  AddCashfreeDialog,
  AddCashfreeDialogRef,
} from '~/components/settings/integrations/AddCashfreeDialog'
import {
  DeleteCashfreeIntegrationDialog,
  DeleteCashfreeIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteCashfreeIntegrationDialog'
import { addToast, envGlobalVar } from '~/core/apolloClient'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { CASHFREE_INTEGRATION_ROUTE, INTEGRATIONS_ROUTE } from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  AddCashfreeProviderDialogFragmentDoc,
  CashfreeIntegrationDetailsFragment,
  DeleteCashfreeIntegrationDialogFragmentDoc,
  ProviderTypeEnum,
  useGetCashfreeIntegrationsDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import Cashfree from '~/public/images/cashfree.svg'
import { MenuPopper, PageHeader } from '~/styles'

const PROVIDER_CONNECTION_LIMIT = 2

gql`
  fragment CashfreeIntegrationDetails on CashfreeProvider {
    id
    code
    name
    clientId
    clientSecret
    successRedirectUrl
  }

  query getCashfreeIntegrationsDetails($id: ID!, $limit: Int, $type: ProviderTypeEnum) {
    paymentProvider(id: $id) {
      ... on CashfreeProvider {
        id
        ...CashfreeIntegrationDetails
        ...DeleteCashfreeIntegrationDialog
        ...AddCashfreeProviderDialog
      }
    }

    paymentProviders(limit: $limit, type: $type) {
      collection {
        ... on CashfreeProvider {
          id
        }
      }
    }
  }

  ${DeleteCashfreeIntegrationDialogFragmentDoc}
  ${AddCashfreeProviderDialogFragmentDoc}
`

const CashfreeIntegrationDetails = () => {
  const navigate = useNavigate()
  const { integrationId } = useParams()
  const { hasPermissions } = usePermissions()
  const addDialogRef = useRef<AddCashfreeDialogRef>(null)
  const deleteDialogRef = useRef<DeleteCashfreeIntegrationDialogRef>(null)
  const { apiUrl } = envGlobalVar()
  const { organization } = useOrganizationInfos()
  const currentOrganizationId = organization?.id || ''
  const { translate } = useInternationalization()
  const { data, loading } = useGetCashfreeIntegrationsDetailsQuery({
    variables: {
      id: integrationId as string,
      limit: PROVIDER_CONNECTION_LIMIT,
      type: ProviderTypeEnum.Cashfree,
    },
    skip: !integrationId,
  })
  const cashfreePaymentProvider = data?.paymentProvider as CashfreeIntegrationDetailsFragment
  const deleteDialogCallback = () => {
    if ((data?.paymentProviders?.collection.length || 0) >= PROVIDER_CONNECTION_LIMIT) {
      navigate(
        generatePath(CASHFREE_INTEGRATION_ROUTE, {
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
      `${apiUrl}/webhooks/cashfree/${currentOrganizationId}?code=${cashfreePaymentProvider?.code}`,
    [apiUrl, currentOrganizationId, cashfreePaymentProvider?.code],
  )

  return (
    <div>
      <PageHeader.Wrapper withSide>
        <PageHeader.Group>
          <ButtonLink
            to={generatePath(CASHFREE_INTEGRATION_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Community,
            })}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" className="w-30" />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {cashfreePaymentProvider?.name}
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
                  <>
                    <Button
                      variant="quaternary"
                      fullWidth
                      align="left"
                      onClick={() => {
                        addDialogRef.current?.openDialog({
                          provider: cashfreePaymentProvider,
                          deleteModalRef: deleteDialogRef,
                          deleteDialogCallback,
                        })
                        closePopper()
                      }}
                    >
                      {translate('text_65845f35d7d69c3ab4793dac')}
                    </Button>
                  </>
                )}

                {canDeleteIntegration && (
                  <Button
                    variant="quaternary"
                    align="left"
                    fullWidth
                    onClick={() => {
                      deleteDialogRef.current?.openDialog({
                        provider: cashfreePaymentProvider,
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
        integrationLogo={<Cashfree />}
        integrationName={cashfreePaymentProvider?.name}
        integrationChip={translate('text_634ea0ecc6147de10ddb662d')}
        integrationDescription={`${translate('text_1727619878796wmgcntkfycn')} • ${translate('text_62b1edddbf5f461ab971271f')}`}
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
                variant="inline"
                align="left"
                onClick={() => {
                  addDialogRef.current?.openDialog({
                    provider: cashfreePaymentProvider,
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
                value={cashfreePaymentProvider.name}
              />
              <IntegrationsPage.DetailsItem
                icon="id"
                label={translate('text_62876e85e32e0300e1803127')}
                value={cashfreePaymentProvider.code}
              />
              <IntegrationsPage.DetailsItem
                icon="id"
                label={translate('text_1727620558031ftsky1vpr55')}
                value={cashfreePaymentProvider.clientId ?? undefined}
              />
              <IntegrationsPage.DetailsItem
                icon="key"
                label={translate('text_1727620574228qfyoqtsdih7')}
                value={cashfreePaymentProvider.clientSecret ?? undefined}
              />
              <IntegrationsPage.DetailsItem
                icon="link"
                label={translate('text_65367cb78324b77fcb6af21c')}
                value={cashfreePaymentProvider.successRedirectUrl || '-'}
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
                html={translate('text_1727623232636ys8hnp8a3su')}
              />
            </>
          )}
        </section>
      </div>

      <AddCashfreeDialog ref={addDialogRef} />
      <DeleteCashfreeIntegrationDialog ref={deleteDialogRef} />
    </div>
  )
}

export default CashfreeIntegrationDetails
