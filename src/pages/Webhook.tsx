import { useRef } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import {
  Typography,
  Button,
  Skeleton,
  Popper,
  Tooltip,
  Avatar,
  Icon,
} from '~/components/designSystem'
import { useI18nContext } from '~/core/I18nContext'
import { theme, NAV_HEIGHT, HEADER_TABLE_HEIGHT, MenuPopper } from '~/styles'
import { useWehbookSettingQuery } from '~/generated/graphql'
import { EditWebhookDialog, EditWebhookDialogRef } from '~/components/settings/EditWebhookDialog'
import {
  DeleteWebhookDialog,
  DeleteWebhookDialogRef,
} from '~/components/settings/DeleteWebhookDialog'

gql`
  query wehbookSetting {
    currentUser {
      id
      organizations {
        id
        webhookUrl
      }
    }
  }
`

const Webhook = () => {
  const { translate } = useI18nContext()
  const editDialogRef = useRef<EditWebhookDialogRef>(null)
  const deleleDialogRef = useRef<DeleteWebhookDialogRef>(null)
  const { data, loading } = useWehbookSettingQuery()
  const webhookUrl = data?.currentUser?.organizations
    ? data?.currentUser?.organizations[0]?.webhookUrl
    : undefined

  return (
    <Page>
      <Typography variant="headline">{translate('text_6271200984178801ba8bdef2')}</Typography>
      <Subtitle>{translate('text_6271200984178801ba8bdf06')}</Subtitle>
      <Head $empty={!webhookUrl && !loading}>
        <Typography variant="subhead">{translate('text_6271200984178801ba8bdf40')}</Typography>
        <Button
          disabled={!!webhookUrl}
          variant="secondary"
          onClick={editDialogRef?.current?.openDialog}
        >
          {translate('text_6271200984178801ba8bdf1a')}
        </Button>
      </Head>

      {!webhookUrl && !loading ? (
        <EmptyBlock color="disabled">
          {translate('text_6271200984178801ba8bdf68')}
          <EventName component="span" variant="captionCode">
            {translate('text_6271200984178801ba8bdf54')}
          </EventName>
        </EmptyBlock>
      ) : (
        <>
          <ListHead>
            <Typography variant="bodyHl" color="disabled">
              {translate('text_6271200984178801ba8bdf3a')}
            </Typography>
            <Typography variant="bodyHl" color="disabled">
              {translate('text_6271200984178801ba8bdf4e')}
            </Typography>
          </ListHead>
          <WebhookItem>
            {loading ? (
              <>
                <LeftBlock>
                  <Skeleton variant="connectorAvatar" size="medium" />
                  <Skeleton variant="text" width={240} height={12} />
                </LeftBlock>
                <RightSkeleton variant="text" width={160} height={12} />
              </>
            ) : (
              <>
                <LeftBlock>
                  <Avatar variant="connector">
                    <Icon color="dark" name="globe" />
                  </Avatar>
                  <Typography variant="bodyHl" color="textSecondary" noWrap>
                    {webhookUrl}
                  </Typography>
                </LeftBlock>
                <RightBlock>
                  <EventName component="span" variant="captionCode">
                    {translate('text_6271200984178801ba8bdf54')}
                  </EventName>
                  <Popper
                    PopperProps={{ placement: 'bottom-end' }}
                    opener={({ isOpen }) => (
                      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
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
                        <Button
                          startIcon="pen"
                          variant="quaternary"
                          align="left"
                          onClick={() => {
                            editDialogRef.current?.openDialog()
                            closePopper()
                          }}
                        >
                          {translate('text_6271200984178801ba8bdf88')}
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
                          {translate('text_6271200984178801ba8bdf8e')}
                        </Button>
                      </MenuPopper>
                    )}
                  </Popper>
                </RightBlock>
              </>
            )}
          </WebhookItem>
        </>
      )}
      <EditWebhookDialog ref={editDialogRef} webhook={webhookUrl} />
      <DeleteWebhookDialog ref={deleleDialogRef} />
    </Page>
  )
}

const Page = styled.div`
  padding: ${theme.spacing(12)};

  > *:first-child {
    margin-bottom: ${theme.spacing(2)};
  }
`

const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
`

const Head = styled.div<{ $empty?: boolean }>`
  height: ${NAV_HEIGHT}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
  margin-bottom: ${({ $empty }) => ($empty ? theme.spacing(6) : 0)};
`

const ListHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
  height: ${HEADER_TABLE_HEIGHT}px;
  padding-right: ${theme.spacing(16)};
`

const WebhookItem = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
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

const RightBlock = styled.div`
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(6)};
  }
`

const EmptyBlock = styled(Typography)`
  display: inherit;

  > span {
    margin-left: ${theme.spacing(1)};
  }
`

const EventName = styled(Typography)`
  background-color: ${theme.palette.grey[100]};
  padding: 6px ${theme.spacing(2)};
  border: 1px solid ${theme.palette.grey[300]};
  height: 32px;
  width: fit-content;
  color: ${theme.palette.error[600]};
  border-radius: 8px;
  box-sizing: border-box;
`

const RightSkeleton = styled(Skeleton)`
  margin-right: ${theme.spacing(16)};
`

export default Webhook
