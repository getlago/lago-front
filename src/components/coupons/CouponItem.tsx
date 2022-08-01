import { useRef } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'
import { DateTime } from 'luxon'
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
  Status,
  StatusEnum,
} from '~/components/designSystem'
import { UPDATE_COUPON_ROUTE } from '~/core/router'
import { ListKeyNavigationItemProps } from '~/hooks/ui/useListKeyNavigation'
import { CouponStatusEnum, CouponItemFragment } from '~/generated/graphql'
import { intlFormatNumber } from '~/core/intlFormatNumber'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { DeleteCouponDialog, DeleteCouponDialogRef } from '~/components/coupons/DeleteCouponDialog'
import { ConditionalWrapper } from '~/components/ConditionalWrapper'
import {
  TerminateCouponDialog,
  TerminateCouponDialogRef,
} from '~/components/coupons/TerminateCouponDialog'

gql`
  fragment CouponItem on Coupon {
    id
    name
    customerCount
    status
    amountCurrency
    amountCents
    canBeDeleted
    expirationDate
  }
`

interface CouponItemProps {
  coupon: CouponItemFragment
  navigationProps?: ListKeyNavigationItemProps
}

const mapStatus = (type?: CouponStatusEnum | undefined) => {
  switch (type) {
    case CouponStatusEnum.Active:
      return {
        type: StatusEnum.running,
        label: 'text_62865498824cc10126ab297c',
      }
    default:
      return {
        type: StatusEnum.error,
        label: 'text_62865498824cc10126ab2986',
      }
  }
}

export const CouponItem = ({ coupon, navigationProps }: CouponItemProps) => {
  const {
    id,
    name,
    amountCurrency,
    amountCents,
    customerCount,
    status,
    canBeDeleted,
    expirationDate,
  } = coupon
  const deleteDialogRef = useRef<DeleteCouponDialogRef>(null)
  const terminateDialogRef = useRef<TerminateCouponDialogRef>(null)
  const { translate } = useInternationalization()
  const formattedStatus = mapStatus(status)

  return (
    <ItemContainer>
      <ConditionalWrapper
        condition={status === CouponStatusEnum.Terminated}
        validWrapper={(children) => <BaseListItem>{children}</BaseListItem>}
        invalidWrapper={(children) => (
          <ListItemLink
            tabIndex={0}
            to={generatePath(UPDATE_COUPON_ROUTE, { id })}
            {...navigationProps}
          >
            {children}
          </ListItemLink>
        )}
      >
        <CouponNameSection>
          <ListAvatar variant="connector">
            <Icon name="coupon" color="dark" />
          </ListAvatar>
          <NameBlock>
            <Typography color="textSecondary" variant="bodyHl" noWrap>
              {name}
            </Typography>
            <Typography variant="caption" noWrap>
              {translate('text_62865498824cc10126ab2976', {
                amount: intlFormatNumber(amountCents || 0, {
                  currencyDisplay: 'code',
                  currency: amountCurrency,
                }),
              })}
            </Typography>
          </NameBlock>
        </CouponNameSection>
        <CouponInfosSection>
          <SmallCell>{customerCount}</SmallCell>
          <SmallCell>
            {!expirationDate
              ? translate('text_62876a50ea3bba00b56d2c2c')
              : DateTime.fromISO(expirationDate).toFormat('LLL. dd, yyyy')}
          </SmallCell>
          <MediumCell>
            {<Status type={formattedStatus.type} label={translate(formattedStatus.label)} />}
          </MediumCell>
        </CouponInfosSection>
        <ButtonMock />
      </ConditionalWrapper>
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
                to={generatePath(UPDATE_COUPON_ROUTE, { id })}
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
                  terminateDialogRef.current?.openDialog()
                  closePopper()
                }}
              >
                {translate('text_62876a50ea3bba00b56d2cbc')}
              </Button>
            </Tooltip>
            <Tooltip
              disableHoverListener={canBeDeleted}
              title={translate('text_62876a50ea3bba00b56d2cee')}
              placement="bottom-end"
            >
              <Button
                startIcon="trash"
                variant="quaternary"
                disabled={!canBeDeleted}
                align="left"
                fullWidth
                onClick={() => {
                  deleteDialogRef.current?.openDialog()
                  closePopper()
                }}
              >
                {translate('text_62876a50ea3bba00b56d2cc2')}
              </Button>
            </Tooltip>
          </MenuPopper>
        )}
      </Popper>
      <DeleteCouponDialog ref={deleteDialogRef} coupon={coupon} />
      <TerminateCouponDialog ref={terminateDialogRef} coupon={coupon} />
    </ItemContainer>
  )
}

export const CouponItemSkeleton = () => {
  return (
    <BaseListItem>
      <Skeleton variant="connectorAvatar" size="medium" marginRight={theme.spacing(3)} />
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

const CouponInfosSection = styled.div`
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
  width: 112px;
`

const SmallCell = styled(Typography)`
  text-align: right;
  width: 96px;
`

const ButtonMock = styled.div`
  width: 40px;
`
