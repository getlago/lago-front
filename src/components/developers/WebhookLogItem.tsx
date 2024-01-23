import { gql } from '@apollo/client'
import styled, { css } from 'styled-components'

import { Avatar, Icon, Skeleton, Typography } from '~/components/designSystem'
import { WebhookLogItemFragment, WebhookStatusEnum } from '~/generated/graphql'
import { ListKeyNavigationItemProps } from '~/hooks/ui/useListKeyNavigation'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { BaseListItem, ItemContainer, ListItem, theme } from '~/styles'

gql`
  fragment WebhookLogItem on Webhook {
    id
    status
    updatedAt
    webhookType
  }
`

interface WebhookLogItemProps {
  log: WebhookLogItemFragment
  navigationProps?: ListKeyNavigationItemProps
  selected: boolean
  onClick: () => void
}

export const WebhookLogItem = ({
  log,
  navigationProps,
  selected,
  onClick,
}: WebhookLogItemProps) => {
  const { id, status, webhookType, updatedAt } = log
  const { formatTimeOrgaTZ } = useOrganizationInfos()
  const hasError = status === WebhookStatusEnum.Failed

  return (
    <ItemContainer>
      <Item tabIndex={0} onClick={onClick} {...navigationProps} $active={selected}>
        <NameSection>
          <ListAvatar
            size="big"
            variant="connector"
            $isFailed={status === WebhookStatusEnum.Failed}
          >
            <Icon
              name={hasError ? 'close-circle-unfilled' : 'checkmark'}
              color={hasError ? 'error' : 'dark'}
            />
          </ListAvatar>
          <NameBlock>
            <Typography color="textSecondary" variant="bodyHl" noWrap>
              {webhookType}
            </Typography>
            <Typography variant="caption" noWrap>
              {id}
            </Typography>
          </NameBlock>
        </NameSection>
        <Typography>{formatTimeOrgaTZ(updatedAt, 'HH:mm:ss')}</Typography>
      </Item>
    </ItemContainer>
  )
}

export const WebhookLogItemSkeleton = () => {
  return (
    <SkeletonItem>
      <Skeleton variant="connectorAvatar" size="big" marginRight={theme.spacing(3)} />
      <Skeleton variant="text" height={12} width={264} marginRight="auto" />
      <Skeleton variant="text" height={12} width={80} />
    </SkeletonItem>
  )
}

const SkeletonItem = styled(BaseListItem)`
  > *:last-child {
    margin-left: ${theme.spacing(3)};
  }
`

const NameSection = styled.div`
  margin-right: auto;
  display: flex;
  align-items: center;
  min-width: 0;
`

const ListAvatar = styled(Avatar)<{ $isFailed?: boolean }>`
  margin-right: ${theme.spacing(3)};
  ${({ $isFailed }) =>
    $isFailed &&
    css`
      background-color: ${theme.palette.error[100]};
    `}
`

const NameBlock = styled.div`
  min-width: 0;
`

const Item = styled(ListItem)<{ $active: boolean }>`
  ${({ $active }) =>
    $active &&
    css`
      background-color: ${theme.palette.grey[200]};
    `}
`
