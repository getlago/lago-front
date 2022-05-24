import { useRef } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'

import { SectionHeader, SideSection } from '~/styles/customer'
import { useI18nContext } from '~/core/I18nContext'
import { Button, Typography, Avatar, Icon, Popper, Tooltip } from '~/components/designSystem'
import { useCurrentUserInfosVar } from '~/core/apolloClient'
import { theme, NAV_HEIGHT, HEADER_TABLE_HEIGHT, MenuPopper } from '~/styles'
import {
  EditCustomerVatRateFragmentDoc,
  CustomerVatRateFragment,
  DeleteCustomerVatRateFragmentDoc,
} from '~/generated/graphql'
import { VAT_RATE_ROUTE } from '~/core/router'
import {
  EditCustomerVatRateDialog,
  EditCustomerVatRateDialogRef,
} from '~/components/customers/EditCustomerVatRateDialog'
import {
  DeleteCustomerVatRateDialog,
  DeleteCustomerVatRateDialogRef,
} from '~/components/customers/DeleteCustomerVatRateDialog'

gql`
  fragment VatRateOrganization on Organization {
    id
    vatRate
  }

  fragment CustomerVatRate on CustomerDetails {
    id
    vatRate
    ...EditCustomerVatRate
    ...DeleteCustomerVatRate
  }

  ${EditCustomerVatRateFragmentDoc}
  ${DeleteCustomerVatRateFragmentDoc}
`

interface CustomerVatRateProps {
  customer: CustomerVatRateFragment
}

export const CustomerVatRate = ({ customer }: CustomerVatRateProps) => {
  const { translate } = useI18nContext()
  const { currentOrganization } = useCurrentUserInfosVar()
  const hasNoVatRate = typeof customer?.vatRate !== 'number'
  const editDialogRef = useRef<EditCustomerVatRateDialogRef>(null)
  const deleteDialogRef = useRef<DeleteCustomerVatRateDialogRef>(null)

  return (
    <SideSection>
      <Header $hasNoData={hasNoVatRate} variant="subhead">
        {translate('text_62728ff857d47b013204cac1')}
        <Button
          variant="quaternary"
          disabled={!hasNoVatRate}
          onClick={() => editDialogRef?.current?.openDialog()}
        >
          {translate('text_62728ff857d47b013204cab3')}
        </Button>
      </Header>
      {hasNoVatRate ? (
        <Typography
          color="disabled"
          html={translate('text_62728ff857d47b013204cadd', {
            link: VAT_RATE_ROUTE,
            orgTaxRate: currentOrganization?.vatRate,
          })}
        />
      ) : (
        <>
          <ListHead>
            <Typography variant="bodyHl" color="disabled">
              {translate('text_62728ff857d47b013204c7c4')}
            </Typography>
          </ListHead>
          <ItemContainer>
            <VatRateItem onClick={() => editDialogRef?.current?.openDialog()}>
              <LeftBlock>
                <Avatar variant="connector">
                  <Icon color="dark" name="percentage" />
                </Avatar>
                <div>
                  <Typography variant="bodyHl" color="textSecondary" noWrap>
                    {translate('text_62728ff857d47b013204cb25', { taxRate: customer?.vatRate })}
                  </Typography>
                  <Typography variant="caption">
                    {translate('text_62728ff857d47b013204cb3f')}
                  </Typography>
                </div>
              </LeftBlock>
              <ButtonMock />
            </VatRateItem>
            <Popper
              PopperProps={{ placement: 'bottom-end' }}
              opener={({ isOpen }) => (
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
                <PopperOpener>
                  <div>
                    <Tooltip
                      placement="top-end"
                      disableHoverListener={isOpen}
                      title={translate('text_62728ff857d47b013204cc4e')}
                    >
                      <Button icon="dots-horizontal" variant="quaternary" />
                    </Tooltip>
                  </div>
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
                      editDialogRef?.current?.openDialog()
                      closePopper()
                    }}
                  >
                    {translate('text_62728ff857d47b013204cc35')}
                  </Button>
                  <Button
                    startIcon="trash"
                    variant="quaternary"
                    align="left"
                    onClick={() => {
                      deleteDialogRef.current?.openDialog()
                      closePopper()
                    }}
                  >
                    {translate('text_62728ff857d47b013204cc43')}
                  </Button>
                </MenuPopper>
              )}
            </Popper>
          </ItemContainer>
          <Info
            variant="caption"
            html={translate('text_62728ff857d47b013204cb59', {
              link: VAT_RATE_ROUTE,
              organisactionTaxRate: currentOrganization?.vatRate,
            })}
          />
        </>
      )}
      <EditCustomerVatRateDialog ref={editDialogRef} customer={customer} />
      <DeleteCustomerVatRateDialog ref={deleteDialogRef} customer={customer} />
    </SideSection>
  )
}

const Header = styled(SectionHeader)<{ $hasNoData?: boolean }>`
  && {
    margin-bottom: ${({ $hasNoData }) => ($hasNoData ? theme.spacing(6) : 0)};
  }
`

const LeftBlock = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  margin-right: ${theme.spacing(4)};

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const VatRateItem = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
  cursor: pointer;

  &:hover {
    background-color: ${theme.palette.grey[100]};
  }
`

const ItemContainer = styled.div`
  position: relative;
`

const ListHead = styled.div`
  display: flex;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
  height: ${HEADER_TABLE_HEIGHT}px;
`

const PopperOpener = styled.div`
  position: absolute;
  right: 0;
  top: ${NAV_HEIGHT / 2 - 20}px;
  z-index: 1;
`

const ButtonMock = styled.div`
  width: 40px;
`

const Info = styled(Typography)`
  height: ${HEADER_TABLE_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  justify-content: flex-end;
  align-items: center;
  white-space: pre;
`
