import { useRef } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'
import { Link, generatePath } from 'react-router-dom'

import { Typography, Button, Skeleton, Avatar, Icon, Tooltip } from '~/components/designSystem'
import { WEBHOOK_LOGS_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme, NAV_HEIGHT, ItemContainer, ListClickableItemCss } from '~/styles'
import { useGetWebhookListQuery } from '~/generated/graphql'
import {
  DeleteWebhookDialog,
  DeleteWebhookDialogRef,
} from '~/components/developers/DeleteWebhookDialog'
import {
  CreateWebhookDialog,
  CreateWebhookDialogRef,
} from '~/components/developers/CreateWebhookDialog'

const WEBHOOK_COUNT_LIMIT = 5

gql`
  query getWebhookList($limit: Int) {
    webhookEndpoints(limit: $limit) {
      collection {
        id
        webhookUrl
      }
    }
  }
`

const Webhooks = () => {
  const { translate } = useInternationalization()
  const createDialogRef = useRef<CreateWebhookDialogRef>(null)
  const deleleDialogRef = useRef<DeleteWebhookDialogRef>(null)
  const { data, loading } = useGetWebhookListQuery({
    variables: { limit: WEBHOOK_COUNT_LIMIT },
  })
  const webhooks = data?.webhookEndpoints.collection || []

  return (
    <Page>
      <Title variant="headline">{translate('text_6271200984178801ba8bdef2')}</Title>
      <Subtitle>{translate('text_6491b293bc3bab0092461aea')}</Subtitle>
      <Head>
        <Typography variant="subhead" color="grey700">
          {translate('text_6271200984178801ba8bdf40')}
        </Typography>
        <Button
          disabled={webhooks.length >= WEBHOOK_COUNT_LIMIT}
          variant="quaternary"
          onClick={createDialogRef?.current?.openDialog}
        >
          {translate('text_6271200984178801ba8bdf1a')}
        </Button>
      </Head>

      {!webhooks.length && !loading ? (
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
        <>
          {webhooks.map((webhook) => {
            const { id, webhookUrl } = webhook

            return (
              <ItemContainer key={`webhook-item-${id}`}>
                <WebhookItem tabIndex={0} to={generatePath(WEBHOOK_LOGS_ROUTE, { webhookId: id })}>
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
                <MenuButton title={translate('text_63aa15caab5b16980b21b0ba')} placement="top-end">
                  <Button
                    icon="trash"
                    variant="quaternary"
                    align="left"
                    onClick={() => {
                      deleleDialogRef.current?.openDialog(id)
                    }}
                  />
                </MenuButton>
              </ItemContainer>
            )
          })}
        </>
      )}
      <CreateWebhookDialog ref={createDialogRef} />
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

const MenuButton = styled(Tooltip)`
  position: absolute;
  top: ${theme.spacing(4)};
  right: 0;
`

const ButtonMock = styled.div`
  width: 40px;
  min-width: 40px;
`

export default Webhooks
