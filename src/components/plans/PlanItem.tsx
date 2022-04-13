import { memo } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'
import { DateTime } from 'luxon'

import { theme, BaseListItem, ListItem } from '~/styles'
import { Typography, Avatar, Icon, Skeleton } from '~/components/designSystem'
import { PlanItemFragment } from '~/generated/graphql'

gql`
  fragment PlanItem on Plan {
    id
    name
    code
    chargeCount
    customerCount
    createdAt
  }
`

interface PlanItemProps {
  plan: PlanItemFragment
  rowId: string
}

export const PlanItem = memo(({ plan, rowId }: PlanItemProps) => {
  const { name, code, customerCount, chargeCount, createdAt } = plan

  return (
    <ListItem id={rowId} tabIndex={0}>
      <PlanNameSection>
        <ListAvatar variant="connector">
          <Icon name="board" color="dark" />
        </ListAvatar>
        <NameBlock>
          <Typography color="textSecondary" variant="bodyHl" noWrap>
            {name}
          </Typography>
          <Typography variant="caption" noWrap>
            {code}
          </Typography>
        </NameBlock>
      </PlanNameSection>
      <PlanInfosSection>
        <MediumCell>{customerCount}</MediumCell>
        <SmallCell>{chargeCount}</SmallCell>
        <MediumCell>{DateTime.fromISO(createdAt).toFormat('yyyy/LL/dd')}</MediumCell>
      </PlanInfosSection>
    </ListItem>
  )
})

export const PlanItemSkeleton = () => {
  return (
    <SkeletonItem>
      <Skeleton variant="connectorAvatar" size="medium" />
      <Skeleton variant="text" height={12} width={240} />
      <Skeleton variant="text" height={12} width={240} />
    </SkeletonItem>
  )
}

const SkeletonItem = styled(BaseListItem)`
  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
  > *:not(:first-child):not(:last-child) {
    margin-right: auto;
  }
`

const ListAvatar = styled(Avatar)`
  margin-right: ${theme.spacing(3)};
`

const NameBlock = styled.div`
  min-width: 0;
`

const PlanNameSection = styled.div`
  margin-right: auto;
  display: flex;
  align-items: center;
  min-width: 0;
`

const PlanInfosSection = styled.div`
  display: flex;
  > *:not(:last-child) {
    margin-right: ${theme.spacing(6)};

    ${theme.breakpoints.down('md')} {
      display: none;
    }
  }
`

const MediumCell = styled(Typography)`
  text-align: right;
  width: 112px;
`

const SmallCell = styled(Typography)`
  text-align: right;
  width: 80px;
`

PlanItem.displayName = 'PlanItem'
