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
  Tooltip,
  Popper,
  ButtonLink,
} from '~/components/designSystem'
import { UPDATE_ADD_ON_ROUTE } from '~/core/router'
import { ListKeyNavigationItemProps } from '~/hooks/ui/useListKeyNavigation'
import { AddOnItemFragment } from '~/generated/graphql'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { DeleteAddOnDialog, DeleteAddOnDialogRef } from '~/components/addOns/DeleteAddOnDialog'

gql`
  fragment AddOnItem on AddOn {
    id
    name
    amountCurrency
    amountCents
    customerCount
    createdAt
    canBeDeleted
  }
`

interface AddOnItemProps {
  addOn: AddOnItemFragment
  navigationProps?: ListKeyNavigationItemProps
}

export const AddOnItem = ({ addOn, navigationProps }: AddOnItemProps) => {
  const { id, name, amountCurrency, amountCents, customerCount, createdAt, canBeDeleted } = addOn
  const deleteDialogRef = useRef<DeleteAddOnDialogRef>(null)
  const { translate } = useInternationalization()

  return (
    <ItemContainer>
      <ListItemLink
        to={generatePath(UPDATE_ADD_ON_ROUTE, { id })}
        tabIndex={0}
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
                amountWithCurrency: intlFormatNumber(amountCents || 0, {
                  currencyDisplay: 'symbol',
                  currency: amountCurrency,
                }),
              })}
            </Typography>
          </NameBlock>
        </AddOnNameSection>
        <CouponInfosSection>
          <SmallCell>{customerCount}</SmallCell>
          <MediumCell>{DateTime.fromISO(createdAt).toFormat('LLL. dd, yyyy')}</MediumCell>
        </CouponInfosSection>
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
              title={translate('text_629728388c4d2300e2d3810d')}
            >
              <Button icon="dots-horizontal" variant="quaternary" />
            </Tooltip>
          </PopperOpener>
        )}
      >
        {({ closePopper }) => (
          <MenuPopper>
            <ButtonLink
              to={generatePath(UPDATE_ADD_ON_ROUTE, { id })}
              type="button"
              buttonProps={{
                variant: 'quaternary',
                startIcon: 'pen',
                align: 'left',
                fullWidth: true,
              }}
            >
              {translate('text_629728388c4d2300e2d3816a')}
            </ButtonLink>
            <Tooltip
              disableHoverListener={canBeDeleted}
              title={translate('text_629791022a75b60089e98ea7')}
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
                {translate('text_629728388c4d2300e2d38182')}
              </Button>
            </Tooltip>
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
