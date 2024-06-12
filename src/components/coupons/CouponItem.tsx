import { gql } from '@apollo/client'
import { RefObject } from 'react'
import { generatePath } from 'react-router-dom'
import styled from 'styled-components'

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
import {
  BaseListItem,
  ItemContainer,
  ListItemLink,
  MenuPopper,
  PopperOpener,
  theme,
} from '~/styles'

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
        <CouponNameSection>
          <ListAvatar size="big" variant="connector">
            <Icon name="coupon" color="dark" />
          </ListAvatar>
          <NameBlock>
            <Typography color="textSecondary" variant="bodyHl" noWrap>
              {name}
            </Typography>
            <CouponCaption coupon={coupon} variant="caption" />
          </NameBlock>
        </CouponNameSection>
        <CouponInfosSection $shouldShowItemActions={shouldShowItemActions}>
          <SmallCell>{customersCount}</SmallCell>
          <MediumCell>
            {!expirationAt
              ? translate('text_62876a50ea3bba00b56d2c2c')
              : formatTimeOrgaTZ(expirationAt)}
          </MediumCell>
          <MediumCell>{<Status {...formattedStatus} />}</MediumCell>
        </CouponInfosSection>
        {shouldShowItemActions && <ButtonMock />}
      </ConditionalWrapper>

      {shouldShowItemActions && (
        <Popper
          PopperProps={{ placement: 'bottom-end' }}
          opener={({ isOpen }) => (
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
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
      <Skeleton variant="connectorAvatar" size="big" marginRight={theme.spacing(3)} />
      <Skeleton variant="text" height={12} width={240} marginRight="auto" />
      <Skeleton variant="text" height={12} width={160} />
    </BaseListItem>
  )
}

const CouponNameSection = styled.div`
  margin-right: auto;
  display: flex;
  align-items: center;
  min-width: 0;
`

const ListAvatar = styled(Avatar)`
  margin-right: ${theme.spacing(3)};
`

const NameBlock = styled.div`
  min-width: 0;
`

const CouponInfosSection = styled.div<{ $shouldShowItemActions: boolean }>`
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
  width: 112px;
`

const SmallCell = styled(Typography)`
  text-align: right;
  width: 96px;
`

const ButtonMock = styled.div`
  width: 40px;
`
