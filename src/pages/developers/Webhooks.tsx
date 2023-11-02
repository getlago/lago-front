import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, Link } from 'react-router-dom'
import styled from 'styled-components'

import {
  Avatar,
  Button,
  Icon,
  Popper,
  Skeleton,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import {
  CreateWebhookDialog,
  CreateWebhookDialogRef,
} from '~/components/developers/CreateWebhookDialog'
import {
  DeleteWebhookDialog,
  DeleteWebhookDialogRef,
} from '~/components/developers/DeleteWebhookDialog'
import { WEBHOOK_LOGS_ROUTE } from '~/core/router'
import {
  useGetWebhookListQuery,
  WebhookEndpointSignatureAlgoEnum,
  WebhookForCreateAndEditFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  ItemContainer,
  ListClickableItemCss,
  MenuPopper,
  NAV_HEIGHT,
  PopperOpener,
  theme,
} from '~/styles'

const WEBHOOK_COUNT_LIMIT = 5

gql`
  query getWebhookList($limit: Int) {
    webhookEndpoints(limit: $limit) {
      collection {
        id
        webhookUrl
        signatureAlgo
        ...WebhookForCreateAndEdit
      }
    }
  }

  ${WebhookForCreateAndEditFragmentDoc}
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
      <Subtitle>{translate('text_64d23b49d481ab00681c229b')}</Subtitle>
      <Head>
        <Typography variant="subhead" color="grey700">
          {translate('text_6271200984178801ba8bdf40')}
        </Typography>
        <Button
          disabled={webhooks.length >= WEBHOOK_COUNT_LIMIT}
          variant="quaternary"
          onClick={() => createDialogRef?.current?.openDialog()}
        >
          {translate('text_6271200984178801ba8bdf1a')}
        </Button>
      </Head>

      {!webhooks.length && !loading ? (
        <EmptyText variant="caption" color="grey600">
          {translate('text_63e27c56dfe64b846474ef0c')}
        </EmptyText>
      ) : loading ? (
        <LoadingBlock>
          <Skeleton variant="text" width={160} height={12} />
        </LoadingBlock>
      ) : (
        <>
          {webhooks.map((webhook) => {
            const { id, signatureAlgo, webhookUrl } = webhook

            return (
              <ItemContainer key={`webhook-item-${id}`}>
                <WebhookItem tabIndex={0} to={generatePath(WEBHOOK_LOGS_ROUTE, { webhookId: id })}>
                  <LeftBlock>
                    <Avatar variant="connector">
                      <Icon color="dark" name="globe" />
                    </Avatar>
                    <LeftBlockColumn>
                      <Typography variant="bodyHl" color="grey700" noWrap>
                        {webhookUrl}
                      </Typography>
                      <Typography variant="caption" color="grey600" noWrap>
                        {signatureAlgo === WebhookEndpointSignatureAlgoEnum.Jwt
                          ? translate('text_64d23b49d481ab00681c229f')
                          : translate('text_64d23b49d481ab00681c22a1')}
                      </Typography>
                    </LeftBlockColumn>
                    <ButtonMock />
                  </LeftBlock>
                </WebhookItem>
                <Popper
                  PopperProps={{ placement: 'bottom-end' }}
                  opener={({ isOpen }) => (
                    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
                    <PopperWrapper>
                      <Tooltip
                        placement="top-end"
                        disableHoverListener={isOpen}
                        title={translate('text_6256de3bba111e00b3bfa51b')}
                      >
                        <Button disabled={loading} icon="dots-horizontal" variant="quaternary" />
                      </Tooltip>
                    </PopperWrapper>
                  )}
                >
                  {({ closePopper }) => (
                    <MenuPopper>
                      <Button
                        disabled={loading}
                        startIcon="pen"
                        variant="quaternary"
                        align="left"
                        onClick={() => {
                          createDialogRef?.current?.openDialog(webhook)
                          closePopper()
                        }}
                      >
                        {translate('text_63aa15caab5b16980b21b0b8')}
                      </Button>
                      <Button
                        disabled={loading}
                        startIcon="trash"
                        variant="quaternary"
                        align="left"
                        onClick={() => {
                          deleleDialogRef.current?.openDialog(id)
                          closePopper()
                        }}
                      >
                        {translate('text_63aa15caab5b16980b21b0ba')}
                      </Button>
                    </MenuPopper>
                  )}
                </Popper>
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

const LeftBlockColumn = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
`

const PopperWrapper = styled(PopperOpener)`
  right: 0;
`

const ButtonMock = styled.div`
  width: 40px;
  min-width: 40px;
`

export default Webhooks
