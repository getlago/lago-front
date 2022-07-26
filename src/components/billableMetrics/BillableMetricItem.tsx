import { memo, useRef } from 'react'
import { DateTime } from 'luxon'
import { gql } from '@apollo/client'
import styled from 'styled-components'
import { generatePath, useNavigate } from 'react-router-dom'

import {
  BillableMetricItemFragment,
  DeleteBillableMetricDialogFragmentDoc,
} from '~/generated/graphql'
import {
  Typography,
  Avatar,
  Icon,
  Skeleton,
  Popper,
  Button,
  Tooltip,
} from '~/components/designSystem'
import { theme, BaseListItem, ListItem, MenuPopper, PopperOpener, ItemContainer } from '~/styles'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { UPDATE_BILLABLE_METRIC_ROUTE } from '~/core/router'
import { ListKeyNavigationItemProps } from '~/hooks/ui/useListKeyNavigation'

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
    ...DeleteBillableMetricDialog
  }

  ${DeleteBillableMetricDialogFragmentDoc}
`

interface BillableMetricItemProps {
  billableMetric: BillableMetricItemFragment
  navigationProps?: ListKeyNavigationItemProps
}

export const BillableMetricItem = memo(
  ({ billableMetric, navigationProps }: BillableMetricItemProps) => {
    const { id, name, code, createdAt, canBeDeleted } = billableMetric
    const deleteDialogRef = useRef<DeleteBillableMetricDialogRef>(null)
    const { translate } = useInternationalization()
    const navigate = useNavigate()

    return (
      <ItemContainer>
        <ListItem
          tabIndex={0}
          onClick={() => navigate(generatePath(UPDATE_BILLABLE_METRIC_ROUTE, { id }))}
          {...navigationProps}
        >
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
          <CellSmall align="right">
            {DateTime.fromISO(createdAt).toFormat('LLL. dd, yyyy')}
          </CellSmall>
          <ButtonMock />
        </ListItem>
        <Popper
          PopperProps={{ placement: 'bottom-end' }}
          opener={({ isOpen }) => (
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
            <PopperOpener>
              <Tooltip
                placement="top-end"
                disableHoverListener={isOpen}
                title={translate('text_6256de3bba111e00b3bfa51b')}
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
                align="left"
                onClick={() => navigate(generatePath(UPDATE_BILLABLE_METRIC_ROUTE, { id }))}
              >
                {translate('text_6256de3bba111e00b3bfa531')}
              </Button>
              <Tooltip
                disableHoverListener={canBeDeleted}
                title={translate('text_6259912c9fcd1d00e914a93d')}
                placement="bottom-end"
              >
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
              </Tooltip>
            </MenuPopper>
          )}
        </Popper>
        <DeleteBillableMetricDialog ref={deleteDialogRef} billableMetric={billableMetric} />
      </ItemContainer>
    )
  }
)

export const BillableMetricItemSkeleton = () => {
  return (
    <BaseListItem>
      <Skeleton variant="connectorAvatar" size="medium" marginRight={theme.spacing(3)} />
      <Skeleton variant="text" height={12} width={240} marginRight="auto" />
      <Skeleton variant="text" height={12} width={240} />
    </BaseListItem>
  )
}

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

const ButtonMock = styled.div`
  width: 40px;
`

BillableMetricItem.displayName = 'BillableMetricItem'
