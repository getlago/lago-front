import { gql } from '@apollo/client'
import { memo, RefObject, useRef } from 'react'
import { generatePath } from 'react-router-dom'
import styled from 'styled-components'

import { AddCustomerDrawerRef } from '~/components/customers/addDrawer/AddCustomerDrawer'
import {
  DeleteCustomerDialog,
  DeleteCustomerDialogRef,
} from '~/components/customers/DeleteCustomerDialog'
import { computeCustomerInitials } from '~/components/customers/utils'
import { Avatar, Button, Popper, Skeleton, Tooltip, Typography } from '~/components/designSystem'
import { CUSTOMER_DETAILS_ROUTE } from '~/core/router'
import { AddCustomerDrawerFragmentDoc, CustomerItemFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
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

gql`
  fragment CustomerItem on Customer {
    id
    name
    displayName
    firstname
    lastname
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
  const { translate } = useInternationalization()
  const { formatTimeOrgaTZ } = useOrganizationInfos()
  const { hasPermissions } = usePermissions()
  const deleteDialogRef = useRef<DeleteCustomerDialogRef>(null)
  const { id: customerId, externalId, createdAt, activeSubscriptionsCount } = customer
  const canEditAndDeleteCustomer = hasPermissions(['customersUpdate', 'customersDelete'])
  const customerName = customer?.displayName
  const customerInitials = computeCustomerInitials(customer)

  return (
    <ItemContainer>
      <Item
        id={rowId}
        to={generatePath(CUSTOMER_DETAILS_ROUTE, { customerId })}
        tabIndex={0}
        data-test={customerName}
      >
        <CustomerNameSection>
          <Avatar
            className="mr-3"
            variant="user"
            size="big"
            identifier={customerName as string}
            initials={customerInitials}
          />
          <NameBlock>
            <Typography color="textSecondary" variant="bodyHl" noWrap>
              {customerName || translate('text_62f272a7a60b4d7fadad911a')}
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
        {canEditAndDeleteCustomer && <ButtonMock />}
      </Item>
      {canEditAndDeleteCustomer && (
        <Popper
          PopperProps={{ placement: 'bottom-end' }}
          opener={({ isOpen }) => (
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
              {hasPermissions(['customersUpdate']) && (
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
              )}
              {hasPermissions(['customersDelete']) && (
                <Button
                  startIcon="trash"
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    deleteDialogRef.current?.openDialog({ customer })
                    closePopper()
                  }}
                >
                  {translate('text_6261640f28a49700f1290df5')}
                </Button>
              )}
            </MenuPopper>
          )}
        </Popper>
      )}
      <DeleteCustomerDialog ref={deleteDialogRef} />
    </ItemContainer>
  )
})

CustomerItem.displayName = 'CustomerItem'

export const CustomerItemSkeleton = () => {
  return (
    <BaseListItem>
      <Skeleton variant="connectorAvatar" size="big" className="mr-3" />
      <Skeleton variant="text" className="mr-auto w-60" />
      <Skeleton variant="text" className="w-60" />
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
