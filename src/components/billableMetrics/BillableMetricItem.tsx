import { memo } from 'react'
import { DateTime } from 'luxon'
import { gql } from '@apollo/client'
import styled from 'styled-components'

import { BillableMetricItemFragment } from '~/generated/graphql'
import { Typography, Avatar, Icon, Skeleton } from '~/components/designSystem'
import { theme, BaseListItem, ListItem } from '~/styles'

gql`
  fragment BillableMetricItem on BillableMetric {
    id
    name
    code
    createdAt
  }
`

interface BillableMetricItemProps {
  rowId: string
  billableMetric: BillableMetricItemFragment
}

export const BillableMetricItem = memo(({ rowId, billableMetric }: BillableMetricItemProps) => {
  const { name, code, createdAt } = billableMetric

  return (
    <ListItem id={rowId} tabIndex={0}>
      <BillableMetricName>
        <Avatar variant="connector">
          <Icon name="pulse" color="dark" />
        </Avatar>
        <NameBlock>
          <Typography color="textSecondary" variant="bodyHl" noWrap>
            {name}
          </Typography>
          <Typography variant="caption" noWrap>
            {code}
          </Typography>
        </NameBlock>
      </BillableMetricName>
      <CellSmall align="right">{DateTime.fromISO(createdAt).toFormat('yyyy/LL/dd')}</CellSmall>
    </ListItem>
  )
})

export const BillableMetricItemSkeleton = () => {
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

const NameBlock = styled.div`
  min-width: 0;
  margin-right: ${theme.spacing(6)};
`

const CellSmall = styled(Typography)`
  width: 112px;
`

const BillableMetricName = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

BillableMetricItem.displayName = 'BillableMetricItem'
