import { gql } from '@apollo/client'
import { memo, RefObject, useRef } from 'react'
import { generatePath } from 'react-router-dom'
import styled from 'styled-components'

import { AddCustomerDrawerRef } from '~/components/customers/AddCustomerDrawer'
import {
  DeleteCustomerDialog,
  DeleteCustomerDialogRef,
} from '~/components/customers/DeleteCustomerDialog'
import { Avatar, Button, Popper, Skeleton, Tooltip, Typography } from '~/components/designSystem'
import { CUSTOMER_DETAILS_ROUTE } from '~/core/router'
import { AddCustomerDrawerFragmentDoc, CustomerItemFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import {
  BaseListItem,
  ItemContainer,
  ListItemLink,
  MenuPopper,
  PopperOpener,
  theme,
} from '~/styles'

gql`
  fragment CustomerItem on Customer {
    id
    name
    externalId
    createdAt
    activeSubscriptionsCount
    ...AddCustomerDrawer
  }

  ${AddCustomerDrawerFragmentDoc}
`

interface CustomerItemProps {
  customer: CustomerItemFragment
  rowId: string
  editDialogRef: RefObject<AddCustomerDrawerRef>
}

export const CustomerItem = memo(({ rowId, customer, editDialogRef }: CustomerItemProps) => {
  const deleteDialogRef = useRef<DeleteCustomerDialogRef>(null)
  const { id, name, externalId, createdAt, activeSubscriptionsCount } = customer
  const { translate } = useInternationalization()
  const { formatTimeOrgaTZ } = useOrganizationInfos()

  return (
    <ItemContainer>
      <Item
        id={rowId}
        to={generatePath(CUSTOMER_DETAILS_ROUTE, { id })}
        tabIndex={0}
        data-test={name}
      >
        <CustomerNameSection>
          <ListAvatar
            variant="user"
            identifier={name as string}
            initials={!name ? '-' : name.split(' ').reduce((acc, n) => (acc = acc + n[0]), '')}
          />
          <NameBlock>
            <Typography color="textSecondary" variant="bodyHl" noWrap>
              {name || translate('text_62f272a7a60b4d7fadad911a')}
            </Typography>
            <Typography variant="caption" noWrap>
              {externalId}
            </Typography>
          </NameBlock>
        </CustomerNameSection>
        <PlanInfosSection>
          <Typography align="right">{activeSubscriptionsCount}</Typography>
          <SmallCell align="right">{formatTimeOrgaTZ(createdAt)}</SmallCell>
        </PlanInfosSection>
        <ButtonMock />
      </Item>
      <Popper
        PopperProps={{ placement: 'bottom-end' }}
        opener={({ isOpen }) => (
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
          <PopperOpener>
            <Tooltip
              placement="top-end"
              disableHoverListener={isOpen}
              title={translate('text_626162c62f790600f850b7b6')}
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
              onClick={() => {
                editDialogRef?.current?.openDrawer(customer)
                closePopper()
              }}
            >
              {translate('text_6261640f28a49700f1290df3')}
            </Button>
            <Button
              startIcon="trash"
              variant="quaternary"
              align="left"
              onClick={() => {
                deleteDialogRef.current?.openDialog()
                closePopper()
              }}
            >
              {translate('text_6261640f28a49700f1290df5')}
            </Button>
          </MenuPopper>
        )}
      </Popper>

      <DeleteCustomerDialog ref={deleteDialogRef} customer={customer} />
    </ItemContainer>
  )
})

CustomerItem.displayName = 'CustomerItem'

export const CustomerItemSkeleton = () => {
  return (
    <BaseListItem>
      <Skeleton variant="connectorAvatar" size="medium" marginRight={theme.spacing(3)} />
      <Skeleton variant="text" height={12} width={240} marginRight="auto" />
      <Skeleton variant="text" height={12} width={240} />
    </BaseListItem>
  )
}

const Item = styled(ListItemLink)`
  > *:not(:last-child) {
    margin-right: ${theme.spacing(6)};
  }
`

const SmallCell = styled(Typography)<{ $alignLeft?: boolean }>`
  width: 112px;
`

const ListAvatar = styled(Avatar)`
  margin-right: ${theme.spacing(3)};
`

const CustomerNameSection = styled.div`
  min-width: 0;
  margin-right: auto;
  display: flex;
  align-items: center;
  flex: 1;
`

const NameBlock = styled.div`
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

const ButtonMock = styled.div`
  width: 40px;
`
