import styled from 'styled-components'
import { DateTime } from 'luxon'

import { theme, BaseListItem, ListItem, MenuPopper, PopperOpener, ItemContainer } from '~/styles'
import {
  Typography,
  Avatar,
  Icon,
  Skeleton,
  Button,
  Tooltip,
  Popper,
  Status,
  StatusEnum,
} from '~/components/designSystem'
import { ListKeyNavigationItemProps } from '~/hooks/ui/useListKeyNavigation'
import { CurrencyEnum, StatusTypeEnum } from '~/generated/graphql'
import { formatAmountToCurrency } from '~/core/currencyTool'
import { useI18nContext } from '~/core/I18nContext'

interface CouponItemProps {
  coupon: {
    name: string
    currency: CurrencyEnum
    amountCents: number
    expiracyDate: string
    customers?: number
    status?: StatusTypeEnum
    canBeDeleted?: boolean
  } // TODO
  navigationProps?: ListKeyNavigationItemProps
}

const mapStatus = (type?: StatusTypeEnum | undefined) => {
  // TODO check status with API
  switch (type) {
    case StatusTypeEnum.Active:
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
  const { name, currency, amountCents, expiracyDate, customers, status, canBeDeleted } = coupon
  const { translate } = useI18nContext()
  const formattedStatus = mapStatus(status)

  return (
    <ItemContainer>
      <ListItem
        tabIndex={0}
        onClick={() => {
          /** TODO */
        }}
        {...navigationProps}
      >
        <CouponNameSection>
          <ListAvatar variant="connector">
            <Icon name="board" color="dark" />
          </ListAvatar>
          <NameBlock>
            <Typography color="textSecondary" variant="bodyHl" noWrap>
              {name}
            </Typography>
            <Typography variant="caption" noWrap>
              {translate('text_62865498824cc10126ab2976', {
                amount: formatAmountToCurrency(amountCents || 0, {
                  currencyDisplay: 'code',
                  currency,
                }),
              })}
            </Typography>
          </NameBlock>
        </CouponNameSection>
        <CouponInfosSection>
          <SmallCell>{customers}</SmallCell>
          <SmallCell>{DateTime.fromISO(expiracyDate).toFormat('yyyy/LL/dd')}</SmallCell>
          <MediumCell>
            {<Status type={formattedStatus.type} label={translate(formattedStatus.label)} />}
          </MediumCell>
        </CouponInfosSection>
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
              title={translate('text_62876a50ea3bba00b56d2c76')}
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
                /** TODO */
              }}
            >
              {translate('text_62876a50ea3bba00b56d2cb6')}
            </Button>
            <Tooltip
              disableHoverListener={status !== StatusTypeEnum.Terminated}
              title={translate('text_62876a50ea3bba00b56d2ce9')}
              placement="bottom-end"
            >
              <Button
                startIcon="switch"
                variant="quaternary"
                disabled={status === StatusTypeEnum.Terminated}
                align="left"
                onClick={() => {
                  //   deleteDialogRef.current?.openDialog() todo
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
                  //   deleteDialogRef.current?.openDialog() TODO
                  closePopper()
                }}
              >
                {translate('text_62876a50ea3bba00b56d2cc2')}
              </Button>
            </Tooltip>
          </MenuPopper>
        )}
      </Popper>
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
