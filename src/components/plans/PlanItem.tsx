import { memo, useRef } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'
import { generatePath } from 'react-router-dom'

import {
  theme,
  BaseListItem,
  ListItemLink,
  MenuPopper,
  PopperOpener,
  ItemContainer,
} from '~/styles'
import {
  Typography,
  Avatar,
  Icon,
  Skeleton,
  Button,
  ButtonLink,
  Tooltip,
  Popper,
} from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { PlanItemFragment, DeletePlanDialogFragmentDoc } from '~/generated/graphql'
import { UPDATE_PLAN_ROUTE } from '~/core/router'
import { ListKeyNavigationItemProps } from '~/hooks/ui/useListKeyNavigation'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { DeletePlanDialog, DeletePlanDialogRef } from './DeletePlanDialog'

gql`
  fragment PlanItem on Plan {
    id
    name
    code
    chargeCount
    customerCount
    createdAt
    canBeDeleted
    ...DeletePlanDialog
  }

  ${DeletePlanDialogFragmentDoc}
`

interface PlanItemProps {
  plan: PlanItemFragment
  navigationProps?: ListKeyNavigationItemProps
}

export const PlanItem = memo(({ plan, navigationProps }: PlanItemProps) => {
  const deleteDialogRef = useRef<DeletePlanDialogRef>(null)
  const { id, name, code, customerCount, chargeCount, createdAt, canBeDeleted } = plan
  const { translate } = useInternationalization()
  const { formatTimeOrgaTZ } = useOrganizationInfos()

  return (
    <ItemContainer>
      <ListItemLink
        tabIndex={0}
        to={generatePath(UPDATE_PLAN_ROUTE, { id })}
        data-test={name}
        {...navigationProps}
      >
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
          <MediumCell>{formatTimeOrgaTZ(createdAt)}</MediumCell>
        </PlanInfosSection>
        <ButtonMock />
      </ListItemLink>
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
            <ButtonLink
              type="button"
              buttonProps={{
                startIcon: 'pen',
                variant: 'quaternary',
                align: 'left',
                fullWidth: true,
              }}
              to={generatePath(UPDATE_PLAN_ROUTE, { id })}
            >
              {translate('text_625fd39a15394c0117e7d792')}
            </ButtonLink>
            <Tooltip
              disableHoverListener={canBeDeleted}
              title={translate('text_625fd39a15394c0117e7d7aa')}
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
                {translate('text_625fd39a15394c0117e7d794')}
              </Button>
            </Tooltip>
          </MenuPopper>
        )}
      </Popper>
      <DeletePlanDialog ref={deleteDialogRef} plan={plan} />
    </ItemContainer>
  )
})

export const PlanItemSkeleton = () => {
  return (
    <BaseListItem>
      <Skeleton variant="connectorAvatar" size="medium" marginRight={theme.spacing(3)} />
      <Skeleton variant="text" height={12} width={240} marginRight="auto" />
      <Skeleton variant="text" height={12} width={240} />
    </BaseListItem>
  )
}

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
  margin-right: ${theme.spacing(6)};

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
