import { gql } from '@apollo/client'
import { RefObject } from 'react'
import { generatePath } from 'react-router-dom'

import { ConditionalWrapper } from '~/components/ConditionalWrapper'
import { CouponCaption } from '~/components/coupons/CouponCaption'
import { DeleteCouponDialogRef } from '~/components/coupons/DeleteCouponDialog'
import { TerminateCouponDialogRef } from '~/components/coupons/TerminateCouponDialog'
import {
  Avatar,
  Button,
  ButtonLink,
  Icon,
  Popper,
  Skeleton,
  Status,
  StatusProps,
  StatusType,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { COUPON_DETAILS_ROUTE, UPDATE_COUPON_ROUTE } from '~/core/router'
import { CouponItemFragment, CouponStatusEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { ListKeyNavigationItemProps } from '~/hooks/ui/useListKeyNavigation'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { BaseListItem, ItemContainer, ListItemLink, MenuPopper, PopperOpener } from '~/styles'
import { tw } from '~/styles/utils'

gql`
  fragment CouponItem on Coupon {
    id
    name
    customersCount
    status
    amountCurrency
    amountCents
    appliedCouponsCount
    expiration
    expirationAt
    couponType
    percentageRate
    frequency
    frequencyDuration
  }
`

interface CouponItemProps {
  coupon: CouponItemFragment
  deleteDialogRef: RefObject<DeleteCouponDialogRef>
  terminateDialogRef: RefObject<TerminateCouponDialogRef>
  shouldShowItemActions: boolean
  navigationProps?: ListKeyNavigationItemProps
}

const mapStatus = (type?: CouponStatusEnum | undefined): StatusProps => {
  switch (type) {
    case CouponStatusEnum.Active:
      return {
        type: StatusType.success,
        label: 'active',
      }
    default:
      return {
        type: StatusType.danger,
        label: 'terminated',
      }
  }
}

export const CouponItem = ({
  coupon,
  deleteDialogRef,
  navigationProps,
  shouldShowItemActions,
  terminateDialogRef,
}: CouponItemProps) => {
  const { id: couponId, name, customersCount, status, appliedCouponsCount, expirationAt } = coupon
  const { translate } = useInternationalization()
  const formattedStatus = mapStatus(status)
  const { formatTimeOrgaTZ } = useOrganizationInfos()

  return (
    <ItemContainer data-test={name}>
      <ConditionalWrapper
        condition={status === CouponStatusEnum.Terminated}
        validWrapper={(children) => <BaseListItem>{children}</BaseListItem>}
        invalidWrapper={(children) => (
          <ListItemLink
            tabIndex={0}
            to={generatePath(COUPON_DETAILS_ROUTE, { couponId })}
            {...navigationProps}
          >
            {children}
          </ListItemLink>
        )}
      >
        <div className="mr-auto flex min-w-0 items-center">
          <Avatar className="mr-3" size="big" variant="connector">
            <Icon name="coupon" color="dark" />
          </Avatar>
          <div className="min-w-0">
            <Typography color="textSecondary" variant="bodyHl" noWrap>
              {name}
            </Typography>
            <CouponCaption coupon={coupon} variant="caption" />
          </div>
        </div>
        <div
          className={tw('mr-0 flex', {
            'mr-6': shouldShowItemActions,
          })}
        >
          <div className="mr-6 hidden w-24 text-right md:block">{customersCount}</div>
          <div className="mr-6 hidden w-28 md:block">
            {!expirationAt
              ? translate('text_62876a50ea3bba00b56d2c2c')
              : formatTimeOrgaTZ(expirationAt)}
          </div>
          <div className="hidden w-26 md:block">{<Status {...formattedStatus} />}</div>
        </div>
        {shouldShowItemActions && <div className="w-10" />}
      </ConditionalWrapper>
      {shouldShowItemActions && (
        <Popper
          PopperProps={{ placement: 'bottom-end' }}
          opener={({ isOpen }) => (
            <PopperOpener>
              <Tooltip
                placement="top-end"
                disableHoverListener={isOpen}
                title={translate('text_62876a50ea3bba00b56d2c76')}
              >
                <Button icon="dots-horizontal" variant="quaternary" />
              </Tooltip>
            </PopperOpener>
          )}
        >
          {({ closePopper }) => (
            <MenuPopper>
              <Tooltip
                disableHoverListener={status !== CouponStatusEnum.Terminated}
                title={translate('text_62878d88ea3bba00b56d3412')}
                placement="bottom-end"
              >
                <ButtonLink
                  type="button"
                  buttonProps={{
                    startIcon: 'pen',
                    variant: 'quaternary',
                    align: 'left',
                    fullWidth: true,
                  }}
                  disabled={status === CouponStatusEnum.Terminated}
                  to={generatePath(UPDATE_COUPON_ROUTE, { couponId })}
                >
                  {translate('text_62876a50ea3bba00b56d2cb6')}
                </ButtonLink>
              </Tooltip>
              <Tooltip
                disableHoverListener={status !== CouponStatusEnum.Terminated}
                title={translate('text_62878d88ea3bba00b56d33cf')}
                placement="bottom-end"
              >
                <Button
                  startIcon="switch"
                  variant="quaternary"
                  disabled={status === CouponStatusEnum.Terminated}
                  fullWidth
                  align="left"
                  onClick={() => {
                    terminateDialogRef.current?.openDialog(coupon)
                    closePopper()
                  }}
                >
                  {translate('text_62876a50ea3bba00b56d2cbc')}
                </Button>
              </Tooltip>
              <Tooltip
                disableHoverListener={!appliedCouponsCount}
                title={translate('text_62876a50ea3bba00b56d2cee')}
                placement="bottom-end"
              >
                <Button
                  startIcon="trash"
                  variant="quaternary"
                  disabled={!!appliedCouponsCount}
                  align="left"
                  fullWidth
                  onClick={() => {
                    deleteDialogRef.current?.openDialog({ coupon })
                    closePopper()
                  }}
                >
                  {translate('text_62876a50ea3bba00b56d2cc2')}
                </Button>
              </Tooltip>
            </MenuPopper>
          )}
        </Popper>
      )}
    </ItemContainer>
  )
}

export const CouponItemSkeleton = () => {
  return (
    <BaseListItem>
      <Skeleton className="mr-3" variant="connectorAvatar" size="big" />
      <Skeleton className="w-60" variant="text" />
      <div className="mr-17 flex w-full justify-end gap-7">
        <Skeleton className="w-25" variant="text" />
        <Skeleton className="w-25" variant="text" />
        <Skeleton className="w-25" variant="text" />
      </div>
    </BaseListItem>
  )
}
