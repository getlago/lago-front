import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useMemo, useRef } from 'react'
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
import { addToast, envGlobalVar, getItemFromLS, ORGANIZATION_LS_KEY_ID } from '~/core/apolloClient'
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
import { MenuPopper, NAV_HEIGHT, PageHeader, PopperOpener, theme } from '~/styles'

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
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
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
      navigate(CASHFREE_INTEGRATION_ROUTE)
    } else {
      navigate(INTEGRATIONS_ROUTE)
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
      <PageHeader $withSide>
        <HeaderBlock>
          <ButtonLink
            to={CASHFREE_INTEGRATION_ROUTE}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" height={12} width={120} />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {cashfreePaymentProvider?.name}
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
      </PageHeader>
      <MainInfos>
        {loading ? (
          <>
            <Skeleton variant="connectorAvatar" size="large" marginRight="16px" />
            <div>
              <Skeleton variant="text" width={200} height={12} marginBottom="22px" />
              <Skeleton variant="text" width={128} height={12} />
            </div>
          </>
        ) : (
          <>
            <StyledAvatar variant="connector" size="large">
              <Cashfree />
            </StyledAvatar>
            <div>
              <Line>
                <Typography variant="headline">{cashfreePaymentProvider?.name}</Typography>
                <Chip label={translate('text_634ea0ecc6147de10ddb662d')} />
              </Line>
              <Typography>
                {translate('text_1727619878796wmgcntkfycn')}&nbsp;•&nbsp;
                {translate('text_62b1edddbf5f461ab971271f')}
              </Typography>
            </div>
          </>
        )}
      </MainInfos>

      <ContentWrapper>
        <section>
          <InlineTitle>
            <Title variant="subhead">{translate('text_664c732c264d7eed1c74fdc5')}</Title>

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
          </InlineTitle>
          {loading ? (
            <>
              {[0, 1, 2].map((i) => (
                <Item key={`item-skeleton-${i}`} direction="row" alignItems="center">
                  <Skeleton variant="connectorAvatar" size="big" marginRight="16px" />
                  <Skeleton variant="text" width={240} height={12} />
                </Item>
              ))}
              <div style={{ height: 20 }} />
              <Skeleton variant="text" width={240} height={12} marginBottom={16} />
            </>
          ) : (
            <>
              <Item direction="row" alignItems="center" spacing={3}>
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
              </Item>

              <Item direction="row" alignItems="center" spacing={3}>
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
              </Item>

              <Item direction="row" alignItems="center" justifyContent="space-between">
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
              </Item>

              <Item direction="row" alignItems="center" justifyContent="space-between">
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
              </Item>

              <Item direction="row" alignItems="center" justifyContent="space-between">
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
              </Item>
            </>
          )}
          {!loading && <Info variant="caption" html={translate('text_1727623232636ys8hnp8a3su')} />}
        </section>

        <section>
          <InlineTitle>
            <Typography variant="subhead">{translate('text_65367cb78324b77fcb6af21c')}</Typography>

            {canEditIntegration && (
              <Button
                variant="quaternary"
                disabled={!!cashfreePaymentProvider?.successRedirectUrl}
                onClick={() => {
                  successRedirectUrlDialogRef.current?.openDialog({
                    mode: 'Add',
                    type: 'Cashfree',
                    provider: cashfreePaymentProvider,
                  })
                }}
              >
                {translate('text_65367cb78324b77fcb6af20e')}
              </Button>
            )}
          </InlineTitle>

          {loading ? (
            <HeaderBlock>
              <Skeleton variant="connectorAvatar" size="big" marginRight="16px" />
              <Skeleton variant="text" width={240} height={12} />
            </HeaderBlock>
          ) : (
            <>
              {!cashfreePaymentProvider?.successRedirectUrl ? (
                <Typography variant="caption" color="grey600">
                  {translate('text_65367cb78324b77fcb6af226', {
                    connectionName: translate('text_1727619878796wmgcntkfycn'),
                  })}
                </Typography>
              ) : (
                <SuccessPaumentRedirectUrlItem>
                  <SuccessPaumentRedirectUrlItemLeft>
                    <Avatar variant="connector" size="big">
                      <Icon name="globe" color="dark" />
                    </Avatar>
                    <div>
                      <Typography variant="caption" color="grey600">
                        {translate('text_65367cb78324b77fcb6af1c6')}
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {cashfreePaymentProvider?.successRedirectUrl}
                      </Typography>
                    </div>
                  </SuccessPaumentRedirectUrlItemLeft>
                  {(canEditIntegration || canDeleteIntegration) && (
                    <LocalPopper
                      PopperProps={{ placement: 'bottom-end' }}
                      opener={({ isOpen }) => (
                        <PopperOpener>
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
                                  type: 'Cashfree',
                                  provider: cashfreePaymentProvider,
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
                                  type: 'Cashfree',
                                  provider: cashfreePaymentProvider,
                                })
                                closePopper()
                              }}
                            >
                              {translate('text_65367cb78324b77fcb6af243')}
                            </Button>
                          )}
                        </MenuPopper>
                      )}
                    </LocalPopper>
                  )}
                </SuccessPaumentRedirectUrlItem>
              )}
            </>
          )}
        </section>
      </ContentWrapper>

      <AddCashfreeDialog ref={addDialogRef} />
      <DeleteCashfreeIntegrationDialog ref={deleteDialogRef} />
      <AddEditDeleteSuccessRedirectUrlDialog ref={successRedirectUrlDialogRef} />
    </div>
  )
}

const HeaderBlock = styled.div`
  display: flex;
  align-items: center;

  > *:first-child  {
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

const ContentWrapper = styled.div`
  max-width: ${theme.spacing(168)};
  padding: 0 ${theme.spacing(12)};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(8)};

  ${theme.breakpoints.down('md')} {
    padding: 0 ${theme.spacing(4)};
  }
`

const Title = styled(Typography)`
  height: ${NAV_HEIGHT}px;
  width: 100%;
  display: flex;
  align-items: center;
`

const Item = styled(Stack)`
  height: ${NAV_HEIGHT}px;
  max-width: ${theme.spacing(168)};
  box-shadow: ${theme.shadows[7]};
`

const Info = styled(Typography)`
  margin-top: ${theme.spacing(3)};
`

const StyledAvatar = styled(Avatar)`
  margin-right: ${theme.spacing(4)};
`

const Line = styled.div`
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(2)};
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

const LocalPopper = styled(Popper)`
  position: relative;
  height: 100%;
  > *:first-child {
    right: 0;
    top: 16px;
  }
`

const SuccessPaumentRedirectUrlItem = styled.div`
  height: ${NAV_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const SuccessPaumentRedirectUrlItemLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};
`

export default CashfreeIntegrationDetails
