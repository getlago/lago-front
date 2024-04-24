import { gql } from '@apollo/client'
import { RefObject } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { DeleteAddOnDialogRef } from '~/components/addOns/DeleteAddOnDialog'
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
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { ADD_ON_DETAILS_ROUTE, ADD_ONS_ROUTE, UPDATE_ADD_ON_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { AddOnItemFragment } from '~/generated/graphql'
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
  fragment AddOnItem on AddOn {
    id
    name
    amountCurrency
    amountCents
    customersCount
    createdAt
  }
`

interface AddOnItemProps {
  addOn: AddOnItemFragment
  deleteDialogRef: RefObject<DeleteAddOnDialogRef>
  navigationProps?: ListKeyNavigationItemProps
}

export const AddOnItem = ({ addOn, deleteDialogRef, navigationProps }: AddOnItemProps) => {
  const { id: addOnId, name, amountCurrency, amountCents, customersCount, createdAt } = addOn

  const { translate } = useInternationalization()
  const { formatTimeOrgaTZ } = useOrganizationInfos()
  const navigate = useNavigate()

  return (
    <ItemContainer>
      <ListItemLink
        to={generatePath(ADD_ON_DETAILS_ROUTE, { addOnId })}
        tabIndex={0}
        data-test={name}
        {...navigationProps}
      >
        <AddOnNameSection>
          <ListAvatar size="big" variant="connector">
            <Icon name="puzzle" color="dark" />
          </ListAvatar>
          <NameBlock>
            <Typography color="textSecondary" variant="bodyHl" noWrap>
              {name}
            </Typography>
            <Typography variant="caption" noWrap>
              {translate('text_629728388c4d2300e2d3810b', {
                amountWithCurrency: intlFormatNumber(
                  deserializeAmount(amountCents, amountCurrency) || 0,
                  {
                    currencyDisplay: 'symbol',
                    currency: amountCurrency,
                  },
                ),
              })}
            </Typography>
          </NameBlock>
        </AddOnNameSection>
        <CouponInfosSection>
          <SmallCell>{customersCount}</SmallCell>
          <MediumCell>{formatTimeOrgaTZ(createdAt)}</MediumCell>
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
              to={generatePath(UPDATE_ADD_ON_ROUTE, { addOnId })}
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
            <Button
              startIcon="trash"
              variant="quaternary"
              align="left"
              fullWidth
              onClick={() => {
                deleteDialogRef.current?.openDialog({
                  addOn,
                  callback: () => {
                    navigate(ADD_ONS_ROUTE)
                  },
                })
                closePopper()
              }}
            >
              {translate('text_629728388c4d2300e2d38182')}
            </Button>
          </MenuPopper>
        )}
      </Popper>
    </ItemContainer>
  )
}

export const AddOnItemSkeleton = () => {
  return (
    <BaseListItem>
      <Skeleton variant="connectorAvatar" size="big" marginRight={theme.spacing(3)} />
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
