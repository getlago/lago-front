import { gql } from '@apollo/client'
import { cx } from 'class-variance-authority'
import { RefObject } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

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
import { usePermissions } from '~/hooks/usePermissions'
import { BaseListItem, ItemContainer, ListItemLink, MenuPopper, PopperOpener } from '~/styles'

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
  shouldShowItemActions: boolean
  navigationProps?: ListKeyNavigationItemProps
}

export const AddOnItem = ({
  addOn,
  deleteDialogRef,
  navigationProps,
  shouldShowItemActions,
}: AddOnItemProps) => {
  const { id: addOnId, name, amountCurrency, amountCents, customersCount, createdAt } = addOn

  const { translate } = useInternationalization()
  const { formatTimeOrgaTZ } = useOrganizationInfos()
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()

  return (
    <ItemContainer>
      <ListItemLink
        to={generatePath(ADD_ON_DETAILS_ROUTE, { addOnId })}
        tabIndex={0}
        data-test={name}
        {...navigationProps}
      >
        <div className="mr-auto flex min-w-0 items-center">
          <Avatar className="mr-3" size="big" variant="connector">
            <Icon name="puzzle" color="dark" />
          </Avatar>
          <div className="min-w-0">
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
          </div>
        </div>
        <div className={cx('flex', shouldShowItemActions ? 'mr-6' : 'mr-0')}>
          <Typography className="mr-6 hidden w-24 text-right md:block">{customersCount}</Typography>
          <Typography className="w-28">{formatTimeOrgaTZ(createdAt)}</Typography>
        </div>
        {shouldShowItemActions && <div className="w-10" />}
      </ListItemLink>

      {shouldShowItemActions &&
        (hasPermissions(['addonsUpdate']) || hasPermissions(['addonsDelete'])) && (
          <Popper
            PopperProps={{ placement: 'bottom-end' }}
            opener={({ isOpen }) => (
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
                {hasPermissions(['addonsUpdate']) && (
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
                )}
                {hasPermissions(['addonsDelete']) && (
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
                )}
              </MenuPopper>
            )}
          </Popper>
        )}
    </ItemContainer>
  )
}

export const AddOnItemSkeleton = () => {
  return (
    <BaseListItem>
      <Skeleton className="mr-3" variant="connectorAvatar" size="big" />
      <Skeleton className="mr-auto w-60" variant="text" />
      <Skeleton className="w-40" variant="text" />
    </BaseListItem>
  )
}
