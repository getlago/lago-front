import { gql } from '@apollo/client'
import { useRef } from 'react'
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
  AddAdyenDialog,
  AddAdyenDialogRef,
} from '~/components/settings/integrations/AddAdyenDialog'
import {
  AddEditDeleteSuccessRedirectUrlDialog,
  AddEditDeleteSuccessRedirectUrlDialogRef,
} from '~/components/settings/integrations/AddEditDeleteSuccessRedirectUrlDialog'
import {
  DeleteAdyenIntegrationDialog,
  DeleteAdyenIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteAdyenIntegrationDialog'
import { INTEGRATIONS_ROUTE } from '~/core/router'
import {
  AdyenForCreateAndEditSuccessRedirectUrlFragmentDoc,
  useAdyenIntegrationsSettingQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Adyen from '~/public/images/adyen.svg'
import { MenuPopper, NAV_HEIGHT, PageHeader, PopperOpener, theme } from '~/styles'

gql`
  fragment AdyenIntegration on AdyenProvider {
    id
    apiKey
    hmacKey
    livePrefix
    merchantAccount
  }

  query AdyenIntegrationsSetting {
    organization {
      id
      adyenPaymentProvider {
        id
        successRedirectUrl
        ...AdyenIntegration
        ...AdyenForCreateAndEditSuccessRedirectUrl
      }
    }
  }

  ${AdyenForCreateAndEditSuccessRedirectUrlFragmentDoc}
`

const AdyenIntegration = () => {
  const addAdyenDialogRef = useRef<AddAdyenDialogRef>(null)
  const deleteDialogRef = useRef<DeleteAdyenIntegrationDialogRef>(null)
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
  const { translate } = useInternationalization()
  const { data, loading } = useAdyenIntegrationsSettingQuery()
  const adyenPaymentProvider = data?.organization?.adyenPaymentProvider

  return (
    <>
      <PageHeader $withSide>
        <HeaderBlock>
          <ButtonLink
            to={INTEGRATIONS_ROUTE}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" height={12} width={120} />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {translate('text_645d071272418a14c1c76a6d')}
            </Typography>
          )}
        </HeaderBlock>
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
              <Adyen />
            </StyledAvatar>
            <div>
              <Line>
                <Typography variant="headline">
                  {translate('text_645d071272418a14c1c76a6d')}
                </Typography>
                <Chip label={translate('text_62b1edddbf5f461ab971270d')} />
              </Line>
              <Typography>{translate('text_62b1edddbf5f461ab971271f')}</Typography>
            </div>
          </>
        )}
      </MainInfos>

      <Settings>
        <section>
          <InlineTitle>
            <Typography variant="subhead">{translate('text_645d071272418a14c1c76a9a')}</Typography>
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
                      addAdyenDialogRef.current?.openDialog()
                    }}
                  >
                    {translate('text_62b1edddbf5f461ab9712787')}
                  </Button>
                  <Button
                    startIcon="trash"
                    variant="quaternary"
                    align="left"
                    fullWidth
                    onClick={() => {
                      deleteDialogRef.current?.openDialog()
                      closePopper()
                    }}
                  >
                    {translate('text_62b1edddbf5f461ab971279f')}
                  </Button>
                </MenuPopper>
              )}
            </LocalPopper>
          </InlineTitle>

          <>
            {loading ? (
              <>
                {[1, 2].map((i) => (
                  <ApiKeyItem key={`item-skeleton-item-${i}`}>
                    <Skeleton variant="connectorAvatar" size="big" marginRight="16px" />
                    <Skeleton variant="text" width={240} height={12} />
                  </ApiKeyItem>
                ))}
              </>
            ) : (
              <>
                <ApiKeyItem>
                  <Avatar variant="connector" size="big">
                    <Icon name="key" color="dark" />
                  </Avatar>
                  <div>
                    <Typography variant="caption" color="grey600">
                      {translate('text_645d071272418a14c1c76aa4')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      {adyenPaymentProvider?.apiKey}
                    </Typography>
                  </div>
                </ApiKeyItem>
                <ApiKeyItem>
                  <Avatar variant="connector" size="big">
                    <Icon name="bank" color="dark" />
                  </Avatar>
                  <div>
                    <Typography variant="caption" color="grey600">
                      {translate('text_645d071272418a14c1c76ab8')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      {adyenPaymentProvider?.merchantAccount}
                    </Typography>
                  </div>
                </ApiKeyItem>
                {!!adyenPaymentProvider?.livePrefix && (
                  <ApiKeyItem>
                    <Avatar variant="connector" size="big">
                      <Icon name="info-circle" color="dark" />
                    </Avatar>
                    <div>
                      <Typography variant="caption" color="grey600">
                        {translate('text_645d071272418a14c1c76acc')}
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {adyenPaymentProvider?.livePrefix}
                      </Typography>
                    </div>
                  </ApiKeyItem>
                )}
                {!!adyenPaymentProvider?.hmacKey && (
                  <ApiKeyItem>
                    <Avatar variant="connector" size="big">
                      <Icon name="info-circle" color="dark" />
                    </Avatar>
                    <div>
                      <Typography variant="caption" color="grey600">
                        {translate('text_645d071272418a14c1c76ae0')}
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {adyenPaymentProvider?.hmacKey}
                      </Typography>
                    </div>
                  </ApiKeyItem>
                )}
              </>
            )}
          </>
        </section>

        <section>
          <InlineTitle>
            <Typography variant="subhead">{translate('text_65367cb78324b77fcb6af21c')}</Typography>
            <Button
              variant="quaternary"
              disabled={!!adyenPaymentProvider?.successRedirectUrl}
              onClick={() => {
                successRedirectUrlDialogRef.current?.openDialog({
                  mode: 'Add',
                  type: 'Adyen',
                  provider: adyenPaymentProvider,
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
              {!adyenPaymentProvider?.successRedirectUrl ? (
                <Typography variant="caption" color="grey600">
                  {translate('text_65367cb78324b77fcb6af226', {
                    connectionName: translate('text_645d071272418a14c1c76a6d'),
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
                        {adyenPaymentProvider?.successRedirectUrl}
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
                              type: 'Adyen',
                              provider: adyenPaymentProvider,
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
                              type: 'Adyen',
                              provider: adyenPaymentProvider,
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
      </Settings>

      <AddAdyenDialog isEdition ref={addAdyenDialogRef} />
      <DeleteAdyenIntegrationDialog id={adyenPaymentProvider?.id || ''} ref={deleteDialogRef} />
      <AddEditDeleteSuccessRedirectUrlDialog ref={successRedirectUrlDialogRef} />
    </>
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
`

const Settings = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(8)};
  margin: 0 ${theme.spacing(12)};
  box-sizing: border-box;
  max-width: ${theme.spacing(168)};
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

const ApiKeyItem = styled.div`
  height: ${NAV_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
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

export default AdyenIntegration
