import { useRef } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'
import { Link } from 'react-router-dom'

import {
  Typography,
  Button,
  Skeleton,
  Popper,
  Tooltip,
  Avatar,
  Icon,
  ButtonLink,
} from '~/components/designSystem'
import { WEBHOOK_LOGS_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme, NAV_HEIGHT, MenuPopper, ItemContainer, ListClickableItemCss } from '~/styles'
import { useGetWehbookSettingQuery } from '~/generated/graphql'
import { EditWebhookDialog, EditWebhookDialogRef } from '~/components/developers/EditWebhookDialog'
import {
  DeleteWebhookDialog,
  DeleteWebhookDialogRef,
} from '~/components/developers/DeleteWebhookDialog'

gql`
  query getWehbookSetting {
    organization {
      id
      webhookUrl
    }
  }
`

const Webhook = () => {
  const { translate } = useInternationalization()
  const editDialogRef = useRef<EditWebhookDialogRef>(null)
  const deleleDialogRef = useRef<DeleteWebhookDialogRef>(null)
  const { data, loading } = useGetWehbookSettingQuery()
  const { webhookUrl } = data?.organization || {}

  return (
    <Page>
      <Title variant="headline">{translate('text_6271200984178801ba8bdef2')}</Title>
      <Subtitle>{translate('text_6271200984178801ba8bdf06')}</Subtitle>
      <Head>
        <Typography variant="subhead" color="grey700">
          {translate('text_6271200984178801ba8bdf40')}
        </Typography>
        <Button
          disabled={!!webhookUrl}
          variant="quaternary"
          onClick={editDialogRef?.current?.openDialog}
        >
          {translate('text_6271200984178801ba8bdf1a')}
        </Button>
      </Head>

      {!webhookUrl && !loading ? (
        <EmptyText
          variant="caption"
          color="grey600"
          html={translate('text_63e27c56dfe64b846474ef0c', {
            link: WEBHOOK_LOGS_ROUTE,
          })}
        />
      ) : loading ? (
        <LoadingBlock>
          <Skeleton variant="text" width={160} height={12} />
        </LoadingBlock>
      ) : (
        <ItemContainer>
          <WebhookItem tabIndex={0} to={WEBHOOK_LOGS_ROUTE}>
            <LeftBlock>
              <Avatar variant="connector">
                <Icon color="dark" name="globe" />
              </Avatar>
              <Typography variant="body" color="grey700" noWrap>
                {webhookUrl}
              </Typography>
            </LeftBlock>
            <ButtonMock />
          </WebhookItem>
          <MenuButton>
            <Popper
              PopperProps={{ placement: 'bottom-end' }}
              opener={({ isOpen }) => (
                <div>
                  <Tooltip
                    placement="top-end"
                    disableHoverListener={isOpen}
                    title={translate('text_6271200984178801ba8bdf8f')}
                  >
                    <Button icon="dots-horizontal" variant="quaternary" />
                  </Tooltip>
                </div>
              )}
            >
              {({ closePopper }) => (
                <MenuPopper>
                  <ButtonLink
                    type="button"
                    buttonProps={{
                      startIcon: 'content-left-align',
                      variant: 'quaternary',
                      align: 'left',
                      fullWidth: true,
                    }}
                    to={WEBHOOK_LOGS_ROUTE}
                  >
                    {translate('text_63e292b311ed46040ff2e7e3')}
                  </ButtonLink>
                  <Button
                    startIcon="pen"
                    variant="quaternary"
                    align="left"
                    onClick={() => {
                      editDialogRef.current?.openDialog()
                      closePopper()
                    }}
                  >
                    {translate('text_638906e7b4f1a919cb61d0f2')}
                  </Button>
                  <Button
                    startIcon="trash"
                    variant="quaternary"
                    align="left"
                    onClick={() => {
                      deleleDialogRef.current?.openDialog()
                      closePopper()
                    }}
                  >
                    {translate('text_63aa085d28b8510cd46443ff')}
                  </Button>
                </MenuPopper>
              )}
            </Popper>
          </MenuButton>
        </ItemContainer>
      )}
      <EditWebhookDialog ref={editDialogRef} webhook={webhookUrl} />
      <DeleteWebhookDialog ref={deleleDialogRef} />
    </Page>
  )
}

const Page = styled.div`
  padding: ${theme.spacing(8)} ${theme.spacing(12)};
  max-width: ${theme.spacing(168)};
`

const Title = styled(Typography)`
  margin-bottom: ${theme.spacing(2)};
`

const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
`

const Head = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const EmptyText = styled(Typography)`
  padding-bottom: ${theme.spacing(8)};
  box-shadow: ${theme.shadows[7]};
`

const WebhookItem = styled(Link)`
  ${ListClickableItemCss}
  height: ${NAV_HEIGHT}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
`

const LoadingBlock = styled.div`
  box-shadow: ${theme.shadows[7]};
  height: ${theme.spacing(12)};
`

const LeftBlock = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  margin-right: ${theme.spacing(4)};

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const MenuButton = styled.div`
  position: absolute;
  top: ${theme.spacing(4)};
  right: 0;
`

const ButtonMock = styled.div`
  width: 40px;
  min-width: 40px;
`

export default Webhook
