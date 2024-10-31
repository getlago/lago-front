import { gql } from '@apollo/client'
import { memo, RefObject } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

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
import { updateDuplicatePlanVar } from '~/core/apolloClient/reactiveVars/duplicatePlanVar'
import { CREATE_PLAN_ROUTE, PLAN_DETAILS_ROUTE, UPDATE_PLAN_ROUTE } from '~/core/router'
import { DeletePlanDialogFragmentDoc, PlanItemFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { ListKeyNavigationItemProps } from '~/hooks/ui/useListKeyNavigation'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { PlanDetailsTabsOptionsEnum } from '~/pages/PlanDetails'
import {
  BaseListItem,
  ItemContainer,
  ListItemLink,
  MenuPopper,
  PopperOpener,
  theme,
} from '~/styles'

import { DeletePlanDialogRef } from './DeletePlanDialog'

gql`
  fragment PlanItem on Plan {
    id
    name
    code
    chargesCount
    activeSubscriptionsCount
    createdAt
    ...DeletePlanDialog
  }

  ${DeletePlanDialogFragmentDoc}
`

interface PlanItemProps {
  deleteDialogRef: RefObject<DeletePlanDialogRef>
  navigationProps?: ListKeyNavigationItemProps
  plan: PlanItemFragment
  shouldShowItemActions: boolean
}

export const PlanItem = memo(
  ({ deleteDialogRef, navigationProps, plan, shouldShowItemActions }: PlanItemProps) => {
    const { id, name, code, activeSubscriptionsCount, chargesCount, createdAt } = plan
    const navigate = useNavigate()
    const { translate } = useInternationalization()
    const { formatTimeOrgaTZ } = useOrganizationInfos()

    return (
      <ItemContainer data-test={`${name}-wrapper`}>
        <ListItemLink
          tabIndex={0}
          to={generatePath(PLAN_DETAILS_ROUTE, {
            planId: id,
            tab: PlanDetailsTabsOptionsEnum.overview,
          })}
          data-test={name}
          {...navigationProps}
        >
          <PlanNameSection>
            <Avatar className="mr-3" size="big" variant="connector">
              <Icon name="board" color="dark" />
            </Avatar>
            <NameBlock>
              <Typography color="textSecondary" variant="bodyHl" noWrap>
                {name}
              </Typography>
              <Typography variant="caption" noWrap>
                {code}
              </Typography>
            </NameBlock>
          </PlanNameSection>
          <PlanInfosSection $shouldShowItemActions={shouldShowItemActions}>
            <MediumCell>{activeSubscriptionsCount}</MediumCell>
            <SmallCell>{chargesCount}</SmallCell>
            <MediumCell>{formatTimeOrgaTZ(createdAt)}</MediumCell>
          </PlanInfosSection>
          {shouldShowItemActions && <ButtonMock />}
        </ListItemLink>
        {shouldShowItemActions && (
          <Popper
            PopperProps={{ placement: 'bottom-end' }}
            opener={({ isOpen }) => (
              <PopperOpener>
                <Tooltip
                  placement="top-end"
                  disableHoverListener={isOpen}
                  title={translate('text_64fa1756d7ccc300a03a09f4')}
                >
                  <Button
                    icon="dots-horizontal"
                    variant="quaternary"
                    data-test="plan-item-options"
                  />
                </Tooltip>
              </PopperOpener>
            )}
          >
            {({ closePopper }) => (
              <MenuPopper>
                <ButtonLink
                  title="update-plan"
                  type="button"
                  buttonProps={{
                    startIcon: 'pen',
                    variant: 'quaternary',
                    align: 'left',
                    fullWidth: true,
                  }}
                  to={generatePath(UPDATE_PLAN_ROUTE, { planId: id })}
                >
                  {translate('text_625fd39a15394c0117e7d792')}
                </ButtonLink>

                <Button
                  startIcon="duplicate"
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    updateDuplicatePlanVar({
                      type: 'duplicate',
                      parentId: id,
                    })
                    navigate(CREATE_PLAN_ROUTE)
                  }}
                >
                  {translate('text_64fa170e02f348164797a6af')}
                </Button>

                <Button
                  startIcon="trash"
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    deleteDialogRef.current?.openDialog({ plan })
                    closePopper()
                  }}
                >
                  {translate('text_625fd39a15394c0117e7d794')}
                </Button>
              </MenuPopper>
            )}
          </Popper>
        )}
      </ItemContainer>
    )
  },
)

export const PlanItemSkeleton = () => {
  return (
    <BaseListItem>
      <Skeleton variant="connectorAvatar" size="big" marginRight={theme.spacing(3)} />
      <Skeleton variant="text" width={240} marginRight="auto" />
      <Skeleton variant="text" width={240} />
    </BaseListItem>
  )
}

const NameBlock = styled.div`
  min-width: 0;
`

const PlanNameSection = styled.div`
  margin-right: auto;
  display: flex;
  align-items: center;
  min-width: 0;
`

const PlanInfosSection = styled.div<{ $shouldShowItemActions?: boolean }>`
  display: flex;
  margin-right: ${({ $shouldShowItemActions }) => ($shouldShowItemActions ? theme.spacing(6) : 0)};

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

const ButtonMock = styled.div`
  width: 40px;
  min-width: 40px;
`

PlanItem.displayName = 'PlanItem'
