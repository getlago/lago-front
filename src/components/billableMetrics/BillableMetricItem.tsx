import { memo, useRef } from 'react'
import { DateTime } from 'luxon'
import { gql } from '@apollo/client'
import styled from 'styled-components'

import { BillableMetricItemFragment } from '~/generated/graphql'
import {
  Typography,
  Avatar,
  Icon,
  Skeleton,
  Popper,
  Button,
  Tooltip,
} from '~/components/designSystem'
import { theme, BaseListItem, ListItem, MenuPopper } from '~/styles'
import { useI18nContext } from '~/core/I18nContext'

import {
  DeleteBillableMetricDialog,
  DeleteBillableMetricDialogRef,
} from './DeleteBillableMetricDialog'

gql`
  fragment BillableMetricItem on BillableMetric {
    id
    name
    code
    createdAt
    canBeDeleted
  }
`

interface BillableMetricItemProps {
  rowId: string
  billableMetric: BillableMetricItemFragment
}

export const BillableMetricItem = memo(({ rowId, billableMetric }: BillableMetricItemProps) => {
  const { name, code, createdAt, canBeDeleted } = billableMetric
  const deleteDialogRef = useRef<DeleteBillableMetricDialogRef>(null)
  const { translate } = useI18nContext()

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
      <Popper
        PopperProps={{ placement: 'bottom-end' }}
        opener={({ isOpen }) => (
          <div>
            <Tooltip
              placement="top-end"
              disableHoverListener={isOpen}
              title={translate('text_6256de3bba111e00b3bfa51b')}
            >
              <Button icon="dots-horizontal" variant="quaternary" />
            </Tooltip>
          </div>
        )}
      >
        {({ closePopper }) => (
          <MenuPopper>
            <Button startIcon="pen" variant="quaternary" align="left" onClick={() => {}}>
              {translate('text_6256de3bba111e00b3bfa531')}
            </Button>
            <Button
              startIcon="trash"
              variant="quaternary"
              disabled={!canBeDeleted}
              align="left"
              onClick={() => {
                deleteDialogRef.current?.openDialog()
                closePopper()
              }}
            >
              {translate('text_6256de3bba111e00b3bfa533')}
            </Button>
          </MenuPopper>
        )}
      </Popper>
      <DeleteBillableMetricDialog ref={deleteDialogRef} billableMetric={billableMetric} />
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
  margin-right: ${theme.spacing(6)};
`

const BillableMetricName = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }

  > *:last-child {
    margin-right: ${theme.spacing(6)};
  }
`

BillableMetricItem.displayName = 'BillableMetricItem'
