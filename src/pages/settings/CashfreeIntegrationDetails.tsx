import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useMemo, useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import {
  Alert,
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
  DeleteCashfreeIntegrationDialog,
  DeleteCashfreeIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteCashfreeIntegrationDialog'
import { addToast, envGlobalVar, getItemFromLS, ORGANIZATION_LS_KEY_ID } from '~/core/apolloClient'
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
  const currentOrganizationId = getItemFromLS(ORGANIZATION_LS_KEY_ID)
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
            <Avatar className="mr-4" variant="connector-full" size="large">
              <Cashfree />
            </Avatar>
            <div>
              <div className="mb-1 flex items-center">
                <Typography className="mr-2" variant="headline">
                  {cashfreePaymentProvider?.name}
                </Typography>
                <Chip label={translate('text_634ea0ecc6147de10ddb662d')} />
              </div>
              <Typography>
                {translate('text_1727619878796wmgcntkfycn')}&nbsp;•&nbsp;
                {translate('text_62b1edddbf5f461ab971271f')}
              </Typography>
            </div>
          </>
        )}
      </div>

      <div className="mb-12 flex max-w-[672px] flex-col gap-8 px-4 py-0 md:px-12">
        <Alert type="warning">{translate('text_1733303404277q80b216p5zr')}</Alert>

        <section>
          <div className="flex h-18 w-full items-center justify-between">
            <Typography className="flex h-18 w-full items-center" variant="subhead">
              {translate('text_664c732c264d7eed1c74fdc5')}
            </Typography>

            {canEditIntegration && (
              <Button
                variant="quaternary"
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
          {loading ? (
            <>
              {[0, 1, 2].map((i) => (
                <div
                  key={`item-skeleton-${i}`}
                  className="flex min-h-18 w-full flex-row items-center gap-3 py-2 shadow-b"
                >
                  <Skeleton className="mr-4" variant="connectorAvatar" size="big" />
                  <Skeleton className="w-60" variant="text" />
                </div>
              ))}
              <div style={{ height: 20 }} />
              <Skeleton className="mb-4 w-60" variant="text" />
            </>
          ) : (
            <>
              <div className="flex min-h-18 w-full flex-row items-center gap-3 py-2 shadow-b">
                <Avatar variant="connector" size="big">
                  <Icon color="dark" name="text" />
                </Avatar>
                <Stack direction="column">
                  <Typography variant="caption" color="grey600">
                    {translate('text_626162c62f790600f850b76a')}
                  </Typography>
                  <Typography variant="body" color="grey700">
                    {cashfreePaymentProvider.name}
                  </Typography>
                </Stack>
              </div>

              <div className="flex min-h-18 w-full flex-row items-center gap-3 py-2 shadow-b">
                <Avatar variant="connector" size="big">
                  <Icon color="dark" name="id" />
                </Avatar>
                <Stack direction="column">
                  <Typography variant="caption" color="grey600">
                    {translate('text_62876e85e32e0300e1803127')}{' '}
                  </Typography>
                  <Typography variant="body" color="grey700">
                    {cashfreePaymentProvider.code}
                  </Typography>
                </Stack>
              </div>

              <div className="flex min-h-18 w-full flex-row items-center justify-between gap-3 py-2 shadow-b">
                <Stack direction="row" alignItems="center" spacing={3}>
                  <Avatar variant="connector" size="big">
                    <Icon color="dark" name="id" />
                  </Avatar>
                  <Stack direction="column">
                    <Typography variant="caption" color="grey600">
                      {translate('text_1727620558031ftsky1vpr55')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      {cashfreePaymentProvider.clientId}
                    </Typography>
                  </Stack>
                </Stack>
              </div>

              <div className="flex min-h-18 w-full flex-row items-center justify-between gap-3 py-2 shadow-b">
                <Stack direction="row" alignItems="center" spacing={3}>
                  <Avatar variant="connector" size="big">
                    <Icon color="dark" name="key" />
                  </Avatar>
                  <Stack direction="column">
                    <Typography variant="caption" color="grey600">
                      {translate('text_1727620574228qfyoqtsdih7')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      {cashfreePaymentProvider.clientSecret}
                    </Typography>
                  </Stack>
                </Stack>
              </div>

              <div className="flex min-h-18 w-full flex-row items-center justify-between gap-3 py-2 shadow-b">
                <Stack direction="row" alignItems="center" spacing={3}>
                  <Avatar variant="connector" size="big">
                    <Icon color="dark" name="link" />
                  </Avatar>
                  <Stack direction="column">
                    <Typography variant="caption" color="grey600">
                      {translate('text_65367cb78324b77fcb6af21c')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      {cashfreePaymentProvider.successRedirectUrl || '-'}
                    </Typography>
                  </Stack>
                </Stack>
              </div>

              <div className="flex min-h-18 w-full flex-row items-center justify-between gap-3 py-2 shadow-b">
                <Stack direction="row" alignItems="center" spacing={3}>
                  <Avatar variant="connector" size="big">
                    <Icon color="dark" name="link" />
                  </Avatar>
                  <Stack direction="column">
                    <Typography variant="caption" color="grey600">
                      {translate('text_6271200984178801ba8bdf22')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      {webhookUrl}
                    </Typography>
                  </Stack>
                </Stack>
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
              </div>
            </>
          )}
          {!loading && (
            <Typography
              className="mt-3"
              variant="caption"
              html={translate('text_1727623232636ys8hnp8a3su')}
            />
          )}
        </section>
      </div>

      <AddCashfreeDialog ref={addDialogRef} />
      <DeleteCashfreeIntegrationDialog ref={deleteDialogRef} />
    </div>
  )
}

export default CashfreeIntegrationDetails
