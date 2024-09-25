import { gql } from '@apollo/client'
import { memo, RefObject } from 'react'
import { generatePath } from 'react-router-dom'

import {
  Avatar,
  Button,
  ButtonLink,
  Icon,
  Popper,
  Skeleton,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { UPDATE_BILLABLE_METRIC_ROUTE } from '~/core/router'
import {
  BillableMetricItemFragment,
  DeleteBillableMetricDialogFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { ListKeyNavigationItemProps } from '~/hooks/ui/useListKeyNavigation'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import {
  BaseListItem,
  ItemContainer,
  ListItemLink,
  MenuPopper,
  PopperOpener,
  theme,
} from '~/styles'

import { DeleteBillableMetricDialogRef } from './DeleteBillableMetricDialog'

gql`
  fragment BillableMetricItem on BillableMetric {
    id
    name
    code
    createdAt
  }

  ${DeleteBillableMetricDialogFragmentDoc}
`

interface BillableMetricItemProps {
  billableMetric: BillableMetricItemFragment
  deleteDialogRef: RefObject<DeleteBillableMetricDialogRef>
  navigationProps?: ListKeyNavigationItemProps
}

export const BillableMetricItem = memo(
  ({ billableMetric, deleteDialogRef, navigationProps }: BillableMetricItemProps) => {
    const { id: billableMetricId, name, code, createdAt } = billableMetric
    const { translate } = useInternationalization()
    const { formatTimeOrgaTZ } = useOrganizationInfos()
    const { hasPermissions } = usePermissions()

    return (
      <ItemContainer>
        <ListItemLink
          to={generatePath(UPDATE_BILLABLE_METRIC_ROUTE, { billableMetricId })}
          tabIndex={0}
          {...navigationProps}
        >
          <div className="flex min-w-0 flex-1 items-center">
            <Avatar className="mr-3" size="big" variant="connector">
              <Icon name="pulse" color="dark" />
            </Avatar>
            <div className="mr-6 min-w-0">
              <Typography color="textSecondary" variant="bodyHl" noWrap>
                {name}
              </Typography>
              <Typography variant="caption" noWrap>
                {code}
              </Typography>
            </div>
          </div>
          <Typography className="mr-6 w-28" align="right">
            {formatTimeOrgaTZ(createdAt)}
          </Typography>
          <div className="w-10" />
        </ListItemLink>
        {(hasPermissions(['billableMetricsUpdate']) ||
          hasPermissions(['billableMetricsDelete'])) && (
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
                {hasPermissions(['billableMetricsUpdate']) && (
                  <ButtonLink
                    type="button"
                    buttonProps={{
                      startIcon: 'pen',
                      variant: 'quaternary',
                      align: 'left',
                      fullWidth: true,
                    }}
                    to={generatePath(UPDATE_BILLABLE_METRIC_ROUTE, { billableMetricId })}
                  >
                    {translate('text_6256de3bba111e00b3bfa531')}
                  </ButtonLink>
                )}
                {hasPermissions(['billableMetricsDelete']) && (
                  <Button
                    startIcon="trash"
                    variant="quaternary"
                    align="left"
                    onClick={() => {
                      deleteDialogRef.current?.openDialog(billableMetric.id)
                      closePopper()
                    }}
                  >
                    {translate('text_6256de3bba111e00b3bfa533')}
                  </Button>
                )}
              </MenuPopper>
            )}
          </Popper>
        )}
      </ItemContainer>
    )
  },
)

export const BillableMetricItemSkeleton = () => {
  return (
    <BaseListItem>
      <Skeleton variant="connectorAvatar" size="big" marginRight={theme.spacing(3)} />
      <Skeleton variant="text" height={12} width={240} marginRight="auto" />
      <Skeleton variant="text" height={12} width={240} />
    </BaseListItem>
  )
}

BillableMetricItem.displayName = 'BillableMetricItem'
