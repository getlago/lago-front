import styled, { css } from 'styled-components'
import { gql } from '@apollo/client'

import { theme, BaseListItem, ListItem, ItemContainer } from '~/styles'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { Skeleton, Icon, Typography, Avatar } from '~/components/designSystem'
import { WebhookLogItemFragment, WebhookStatusEnum } from '~/generated/graphql'
import { ListKeyNavigationItemProps } from '~/hooks/ui/useListKeyNavigation'

gql`
  fragment WebhookLogItem on Webhook {
    id
    createdAt
    webhookType
    status
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
  const { id, status, webhookType, createdAt } = log
  const { formatTimeOrgaTZ } = useOrganizationInfos()
  const hasError = status === WebhookStatusEnum.Failed

  return (
    <ItemContainer>
      <Item tabIndex={0} onClick={onClick} {...navigationProps} $active={selected}>
        <NameSection>
          <ListAvatar variant="connector" $isFailed={status === WebhookStatusEnum.Failed}>
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
        <Typography>{formatTimeOrgaTZ(createdAt, 'HH:mm:ss')}</Typography>
      </Item>
    </ItemContainer>
  )
}

export const WebhookLogItemSkeleton = () => {
  return (
    <SkeletonItem>
      <Skeleton variant="text" height={12} width={68} marginRight="12px" />
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
