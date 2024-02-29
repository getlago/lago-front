import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useRef } from 'react'
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
  AddEditDeleteSuccessRedirectUrlDialog,
  AddEditDeleteSuccessRedirectUrlDialogRef,
} from '~/components/settings/integrations/AddEditDeleteSuccessRedirectUrlDialog'
import {
  AddGocardlessDialog,
  AddGocardlessDialogRef,
} from '~/components/settings/integrations/AddGocardlessDialog'
import {
  DeleteGocardlessIntegrationDialog,
  DeleteGocardlessIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteGocardlessIntegrationDialog'
import { envGlobalVar } from '~/core/apolloClient'
import { addToast } from '~/core/apolloClient'
import { GOCARDLESS_INTEGRATION_ROUTE, INTEGRATIONS_ROUTE } from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  AddGocardlessProviderDialogFragmentDoc,
  DeleteGocardlessIntegrationDialogFragmentDoc,
  GocardlessIntegrationDetailsFragment,
  ProviderTypeEnum,
  useGetGocardlessIntegrationsDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import GoCardless from '~/public/images/gocardless-large.svg'
import { MenuPopper, NAV_HEIGHT, PageHeader, PopperOpener, theme } from '~/styles'

const PROVIDER_CONNECTION_LIMIT = 2

gql`
  fragment GocardlessIntegrationDetails on GocardlessProvider {
    id
    code
    name
    successRedirectUrl
    webhookSecret
  }

  query getGocardlessIntegrationsDetails($id: ID!, $limit: Int, $type: ProviderTypeEnum) {
    paymentProvider(id: $id) {
      ... on GocardlessProvider {
        id
        ...GocardlessIntegrationDetails
        ...DeleteGocardlessIntegrationDialog
        ...AddGocardlessProviderDialog
      }
    }

    paymentProviders(limit: $limit, type: $type) {
      collection {
        ... on GocardlessProvider {
          id
        }
      }
    }
  }

  ${DeleteGocardlessIntegrationDialogFragmentDoc}
  ${AddGocardlessProviderDialogFragmentDoc}
`

const GocardlessIntegrationDetails = () => {
  const navigate = useNavigate()
  const { integrationId } = useParams()
  const { lagoOauthProxyUrl } = envGlobalVar()
  const addDialogRef = useRef<AddGocardlessDialogRef>(null)
  const deleteDialogRef = useRef<DeleteGocardlessIntegrationDialogRef>(null)
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
  const { translate } = useInternationalization()
  const { data, loading } = useGetGocardlessIntegrationsDetailsQuery({
    variables: {
      id: integrationId as string,
      limit: PROVIDER_CONNECTION_LIMIT,
      type: ProviderTypeEnum.Gocardless,
    },
    skip: !integrationId,
  })
  const gocardlessPaymentProvider = data?.paymentProvider as GocardlessIntegrationDetailsFragment
  const isConnectionEstablished = !!gocardlessPaymentProvider?.webhookSecret
  const deleteDialogCallback = () => {
    if (data?.paymentProviders?.collection.length === PROVIDER_CONNECTION_LIMIT) {
      navigate(GOCARDLESS_INTEGRATION_ROUTE)
    } else {
      navigate(INTEGRATIONS_ROUTE)
    }
  }

  return (
    <div>
      <PageHeader $withSide>
        <HeaderBlock>
          <ButtonLink
            to={GOCARDLESS_INTEGRATION_ROUTE}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" height={12} width={120} />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {gocardlessPaymentProvider?.name}
            </Typography>
          )}
        </HeaderBlock>
        <Popper
          PopperProps={{ placement: 'bottom-end' }}
          opener={
            <Button endIcon="chevron-down">{translate('text_626162c62f790600f850b6fe')}</Button>
          }
        >
          {({ closePopper }) => (
            <MenuPopper>
              <Button
                variant="quaternary"
                fullWidth
                align="left"
                onClick={() => {
                  addDialogRef.current?.openDialog({
                    provider: gocardlessPaymentProvider,
                    deleteModalRef: deleteDialogRef,
                    deleteDialogCallback,
                  })
                  closePopper()
                }}
              >
                {translate('text_65845f35d7d69c3ab4793dac')}
              </Button>
              <Button
                variant="quaternary"
                fullWidth
                align="left"
                onClick={() => {
                  window.open(
                    `${lagoOauthProxyUrl}/gocardless/auth?lago_name=${gocardlessPaymentProvider.name}&lago_code=${gocardlessPaymentProvider.code}`,
                  )
                  closePopper()
                }}
              >
                {translate('text_658567dffff71e31ea5f0d33')}
              </Button>
              <Button
                variant="quaternary"
                align="left"
                fullWidth
                onClick={() => {
                  deleteDialogRef.current?.openDialog({
                    provider: gocardlessPaymentProvider,
                    callback: deleteDialogCallback,
                  })
                  closePopper()
                }}
              >
                {translate('text_65845f35d7d69c3ab4793dad')}
              </Button>
            </MenuPopper>
          )}
        </Popper>
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
              <GoCardless />
            </StyledAvatar>
            <div>
              <Line>
                <Typography variant="headline">{gocardlessPaymentProvider?.name}</Typography>
                {isConnectionEstablished && (
                  <Chip label={translate('text_634ea0ecc6147de10ddb662d')} />
                )}
              </Line>
              <Typography>
                {translate('text_634ea0ecc6147de10ddb6648')}&nbsp;•&nbsp;
                {translate('text_62b1edddbf5f461ab971271f')}
              </Typography>
            </div>
          </>
        )}
      </MainInfos>

      <ContentWrapper>
        <section>
          <InlineTitle>
            <Title variant="subhead">{translate('text_637f813d31381b1ed90ab315')}</Title>
            <Button
              variant="quaternary"
              align="left"
              onClick={() => {
                addDialogRef.current?.openDialog({
                  provider: gocardlessPaymentProvider,
                  deleteModalRef: deleteDialogRef,
                  deleteDialogCallback,
                })
              }}
            >
              {translate('text_62b1edddbf5f461ab9712787')}
            </Button>
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
              {isConnectionEstablished && (
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
                        {gocardlessPaymentProvider.name}
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
                        {gocardlessPaymentProvider.code}
                      </Typography>
                    </Stack>
                  </Item>

                  <Item direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={3}>
                      <Avatar variant="connector" size="big">
                        <Icon color="dark" name="key" />
                      </Avatar>
                      <Stack direction="column">
                        <Typography variant="caption" color="grey600">
                          {translate('text_658567dffff71e31ea5f0d3e')}
                        </Typography>
                        <Typography variant="body" color="grey700">
                          {gocardlessPaymentProvider.webhookSecret}
                        </Typography>
                      </Stack>
                    </Stack>
                    <Tooltip title={translate('text_6360ddae753a8b3e11c80c66')} placement="top-end">
                      <Button
                        variant="quaternary"
                        onClick={() => {
                          copyToClipboard(gocardlessPaymentProvider?.webhookSecret as string)
                          addToast({
                            severity: 'info',
                            translateKey: 'text_6360ddae753a8b3e11c80c6c',
                          })
                        }}
                      >
                        <Icon name="duplicate" />
                      </Button>
                    </Tooltip>
                  </Item>
                </>
              )}
            </>
          )}
          {!loading && <Info variant="caption">{translate('text_635bd8acb686f18909a57c93')}</Info>}
        </section>

        <section>
          <InlineTitle>
            <Typography variant="subhead">{translate('text_65367cb78324b77fcb6af21c')}</Typography>
            <Button
              variant="quaternary"
              disabled={!!gocardlessPaymentProvider?.successRedirectUrl}
              onClick={() => {
                successRedirectUrlDialogRef.current?.openDialog({
                  mode: 'Add',
                  type: 'GoCardless',
                  provider: gocardlessPaymentProvider,
                })
              }}
            >
              {translate('text_65367cb78324b77fcb6af20e')}
            </Button>
          </InlineTitle>

          {loading ? (
            <HeaderBlock>
              <Skeleton variant="connectorAvatar" size="big" marginRight="16px" />
              <Skeleton variant="text" width={240} height={12} />
            </HeaderBlock>
          ) : (
            <>
              {!gocardlessPaymentProvider?.successRedirectUrl ? (
                <Typography variant="caption" color="grey600">
                  {translate('text_65367cb78324b77fcb6af226', {
                    connectionName: translate('text_634ea0ecc6147de10ddb6625'),
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
                        {gocardlessPaymentProvider?.successRedirectUrl}
                      </Typography>
                    </div>
                  </SuccessPaumentRedirectUrlItemLeft>
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
                        <Button
                          startIcon="pen"
                          variant="quaternary"
                          fullWidth
                          align="left"
                          onClick={() => {
                            successRedirectUrlDialogRef.current?.openDialog({
                              mode: 'Edit',
                              type: 'GoCardless',
                              provider: gocardlessPaymentProvider,
                            })
                            closePopper()
                          }}
                        >
                          {translate('text_65367cb78324b77fcb6af24d')}
                        </Button>
                        <Button
                          startIcon="trash"
                          variant="quaternary"
                          align="left"
                          fullWidth
                          onClick={() => {
                            successRedirectUrlDialogRef.current?.openDialog({
                              mode: 'Delete',
                              type: 'GoCardless',
                              provider: gocardlessPaymentProvider,
                            })
                            closePopper()
                          }}
                        >
                          {translate('text_65367cb78324b77fcb6af243')}
                        </Button>
                      </MenuPopper>
                    )}
                  </LocalPopper>
                </SuccessPaumentRedirectUrlItem>
              )}
            </>
          )}
        </section>
      </ContentWrapper>

      <AddGocardlessDialog ref={addDialogRef} />
      <DeleteGocardlessIntegrationDialog ref={deleteDialogRef} />
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

export default GocardlessIntegrationDetails
