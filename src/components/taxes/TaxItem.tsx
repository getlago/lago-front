import { gql } from '@apollo/client'
import { memo, RefObject } from 'react'
import { generatePath } from 'react-router-dom'
import styled from 'styled-components'

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
import { UPDATE_TAX_ROUTE } from '~/core/router'
import { DeleteTaxFragmentDoc, TaxItemFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { ListKeyNavigationItemProps } from '~/hooks/ui/useListKeyNavigation'
import { ItemContainer, ListItemLink, MenuPopper, PopperOpener, theme } from '~/styles'

import { DeleteTaxDialogRef } from './DeleteTaxDialog'

gql`
  fragment TaxItem on Tax {
    id
    code
    name
    rate

    ...DeleteTax
  }

  ${DeleteTaxFragmentDoc}
`

interface TaxItemProps {
  deleteDialogRef: RefObject<DeleteTaxDialogRef>
  navigationProps?: ListKeyNavigationItemProps
  tax: TaxItemFragment
}

export const TaxItem = memo(({ deleteDialogRef, tax }: TaxItemProps) => {
  const { translate } = useInternationalization()
  const { id: taxId, name, code, rate } = tax

  return (
    <ItemContainer>
      <LocalListItemLink
        tabIndex={0}
        to={generatePath(UPDATE_TAX_ROUTE, { taxId })}
        data-test={code}
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
            {intlFormatNumber((rate || 0) / 100, {
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
              to={generatePath(UPDATE_TAX_ROUTE, { taxId })}
            >
              {translate('text_645bb193927b375079d28b7c')}
            </ButtonLink>

            <Button
              startIcon="trash"
              variant="quaternary"
              align="left"
              onClick={() => {
                deleteDialogRef.current?.openDialog(tax)
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

export const TaxItemSkeleton = () => {
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

TaxItem.displayName = 'TaxItem'
