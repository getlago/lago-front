import { memo, RefObject } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'
import { generatePath } from 'react-router-dom'

import { theme, MenuPopper, ItemContainer, ListItemLink, PopperOpener } from '~/styles'
import {
  Typography,
  Avatar,
  Icon,
  Skeleton,
  Button,
  ButtonLink,
  Tooltip,
  Popper,
} from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { DeleteTaxRateFragmentDoc, TaxRateItemFragment } from '~/generated/graphql'
import { UPDATE_TAX_RATE_ROUTE } from '~/core/router'
import { ListKeyNavigationItemProps } from '~/hooks/ui/useListKeyNavigation'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'

import { DeleteTaxRateDialogRef } from './DeleteTaxRateDialog'

gql`
  fragment TaxRateItem on TaxRate {
    id
    code
    name
    value

    ...DeleteTaxRate
  }

  ${DeleteTaxRateFragmentDoc}
`

interface TaxRateItemProps {
  deleteDialogRef: RefObject<DeleteTaxRateDialogRef>
  navigationProps?: ListKeyNavigationItemProps
  taxRate: TaxRateItemFragment
}

export const TaxRateItem = memo(({ deleteDialogRef, taxRate }: TaxRateItemProps) => {
  const { translate } = useInternationalization()
  const { id, name, code, value } = taxRate

  return (
    <ItemContainer>
      <LocalListItemLink
        tabIndex={0}
        to={generatePath(UPDATE_TAX_RATE_ROUTE, { id })}
        data-test={name}
      >
        <LeftSection>
          <Avatar size="big" variant="connector">
            <Icon size="medium" name="percentage" color="dark" />
          </Avatar>
          <div>
            <Typography color="textSecondary" variant="bodyHl" noWrap>
              {name}
            </Typography>
            <Typography variant="caption" noWrap>
              {code}
            </Typography>
          </div>
        </LeftSection>
        <RightSection>
          <Typography variant="body" color="grey700">
            {intlFormatNumber((value || 0) / 100, {
              minimumFractionDigits: 2,
              style: 'percent',
            })}
          </Typography>
          <ButtonMock />
        </RightSection>
      </LocalListItemLink>
      <Popper
        PopperProps={{ placement: 'bottom-end' }}
        opener={({ isOpen }) => (
          <LocalPopperOpener>
            <Tooltip
              placement="top-end"
              disableHoverListener={isOpen}
              title={translate('text_645bb193927b375079d28b76')}
            >
              <Button icon="dots-horizontal" variant="quaternary" />
            </Tooltip>
          </LocalPopperOpener>
        )}
      >
        {({ closePopper }) => (
          <MenuPopper>
            <ButtonLink
              type="button"
              buttonProps={{
                startIcon: 'pen',
                variant: 'quaternary',
                align: 'left',
                fullWidth: true,
              }}
              to={generatePath(UPDATE_TAX_RATE_ROUTE, { id })}
            >
              {translate('text_645bb193927b375079d28b7c')}
            </ButtonLink>

            <Button
              startIcon="trash"
              variant="quaternary"
              align="left"
              onClick={() => {
                deleteDialogRef.current?.openDialog(taxRate)
                closePopper()
              }}
            >
              {translate('text_645bb193927b375079d28b82')}
            </Button>
          </MenuPopper>
        )}
      </Popper>
    </ItemContainer>
  )
})

export const TaxRateItemSkeleton = () => {
  return (
    <SkeletonWrapper>
      <Skeleton variant="connectorAvatar" size="big" marginRight={theme.spacing(3)} />
      <Skeleton variant="text" height={12} width={240} marginRight="auto" />
      <Skeleton variant="text" height={12} width={240} />
    </SkeletonWrapper>
  )
}

const LocalListItemLink = styled(ListItemLink)`
  padding: 0;
`

const LocalPopperOpener = styled(PopperOpener)`
  right: 0;
`

const SkeletonWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: ${theme.spacing(3)};
`

const LeftSection = styled.div`
  display: flex;
  column-gap: ${theme.spacing(3)};
  align-items: center;
  flex: 1;
`

const RightSection = styled.div`
  display: flex;
  column-gap: ${theme.spacing(3)};
  align-items: center;
  flex: 1;
  justify-content: flex-end;
`

const ButtonMock = styled.div`
  width: 40px;
  min-width: 40px;
`

TaxRateItem.displayName = 'TaxRateItem'
