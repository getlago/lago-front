import { useRef } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'
import { DateTime } from 'luxon'
import { useNavigate, generatePath } from 'react-router-dom'

import { theme, BaseListItem, ListItem, MenuPopper, PopperOpener, ItemContainer } from '~/styles'
import {
  Typography,
  Avatar,
  Icon,
  Skeleton,
  Button,
  Tooltip,
  Popper,
} from '~/components/designSystem'
import { UPDATE_ADD_ON_ROUTE } from '~/core/router'
import { ListKeyNavigationItemProps } from '~/hooks/ui/useListKeyNavigation'
import { AddOnItemFragment } from '~/generated/graphql'
import { formatAmountToCurrency } from '~/core/currencyTool'
import { useI18nContext } from '~/core/I18nContext'
import { DeleteAddOnDialog, DeleteAddOnDialogRef } from '~/components/addOns/DeleteAddOnDialog'

gql`
  fragment AddOnItem on AddOn {
    id
    name
    amountCurrency
    amountCents
    customerCount
    createdAt
  }
`

interface AddOnItemProps {
  addOn: AddOnItemFragment
  navigationProps?: ListKeyNavigationItemProps
}

export const AddOnItem = ({ addOn, navigationProps }: AddOnItemProps) => {
  const { id, name, amountCurrency, amountCents, customerCount, createdAt } = addOn
  const deleteDialogRef = useRef<DeleteAddOnDialogRef>(null)
  let navigate = useNavigate()
  const { translate } = useI18nContext()

  return (
    <ItemContainer>
      <ListItem
        tabIndex={0}
        onClick={() => navigate(generatePath(UPDATE_ADD_ON_ROUTE, { id }))}
        {...navigationProps}
      >
        <AddOnNameSection>
          <ListAvatar variant="connector">
            <Icon name="puzzle" color="dark" />
          </ListAvatar>
          <NameBlock>
            <Typography color="textSecondary" variant="bodyHl" noWrap>
              {name}
            </Typography>
            <Typography variant="caption" noWrap>
              {translate('text_629728388c4d2300e2d3810b', {
                amountWithCurrency: formatAmountToCurrency(amountCents || 0, {
                  currencyDisplay: 'code',
                  currency: amountCurrency,
                }),
              })}
            </Typography>
          </NameBlock>
        </AddOnNameSection>
        <CouponInfosSection>
          <SmallCell>{customerCount}</SmallCell>
          <MediumCell>{DateTime.fromISO(createdAt).toFormat('yyyy/LL/dd')}</MediumCell>
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
              title={translate('text_629728388c4d2300e2d3810d')}
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
              fullWidth
              align="left"
              onClick={() => navigate(generatePath(UPDATE_ADD_ON_ROUTE, { id }))}
            >
              {translate('text_629728388c4d2300e2d3816a')}
            </Button>
            <Button
              startIcon="trash"
              variant="quaternary"
              align="left"
              fullWidth
              onClick={() => {
                deleteDialogRef.current?.openDialog()
                closePopper()
              }}
            >
              {translate('text_629728388c4d2300e2d38182')}
            </Button>
          </MenuPopper>
        )}
      </Popper>
      <DeleteAddOnDialog ref={deleteDialogRef} addOn={addOn} />
    </ItemContainer>
  )
}

export const AddOnItemSkeleton = () => {
  return (
    <BaseListItem>
      <Skeleton variant="connectorAvatar" size="medium" marginRight={theme.spacing(3)} />
      <Skeleton variant="text" height={12} width={240} marginRight="auto" />
      <Skeleton variant="text" height={12} width={160} />
    </BaseListItem>
  )
}

const AddOnNameSection = styled.div`
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
