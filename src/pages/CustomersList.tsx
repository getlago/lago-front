import { useRef } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'

import { Typography, Button } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { useCustomersQuery, CustomerItemFragmentDoc } from '~/generated/graphql'
import { useI18nContext } from '~/core/I18nContext'
import { theme, PageHeader, ListHeader } from '~/styles'
import EmojiError from '~/public/images/exploding-head.png'
import EmojiEmpty from '~/public/images/spider-web.png'
import { AddCustomerDialog, AddCustomerDialogRef } from '~/components/customers/AddCustomerDialog'
import { CustomerItemSkeleton, CustomerItem } from '~/components/customers/CustomerItem'
import { useListKeysNavigation } from '~/hooks/ui/useListKeyNavigation'

gql`
  query customers($page: Int, $limit: Int) {
    customers(page: $page, limit: $limit) {
      collection {
        ...CustomerItem
      }
    }
  }

  ${CustomerItemFragmentDoc}
`

const CustomersList = () => {
  const addCustomerDialogRef = useRef<AddCustomerDialogRef>(null)
  const { onKeyDown } = useListKeysNavigation({
    getElmId: (i) => `customer-item-${i}`,
  })
  const { translate } = useI18nContext()
  const { data, error, loading } = useCustomersQuery()
  const list = data?.customers?.collection || []
  let index = -1

  return (
    <div role="grid" tabIndex={-1} onKeyDown={onKeyDown}>
      <Header $withSide>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_624efab67eb2570101d117a5')}
        </Typography>
        <Button onClick={() => addCustomerDialogRef.current?.openDialog()}>
          {translate('text_624efab67eb2570101d117bc')}
        </Button>
      </Header>

      {!loading && !!error ? (
        <GenericPlaceholder
          title={translate('text_624efab67eb2570101d117d0')}
          subtitle={translate('text_624efab67eb2570101d117d8')}
          buttonTitle={translate('text_624efab67eb2570101d117e0')}
          buttonVariant="primary"
          buttonAction={() => location.reload()}
          image={<img src={EmojiError} alt="error-emoji" />}
        />
      ) : !loading && (!list || !list.length) ? (
        <GenericPlaceholder
          title={translate('text_624efab67eb2570101d117a9')}
          subtitle={translate('text_624efab67eb2570101d117af')}
          buttonTitle={translate('text_624efab67eb2570101d117b9')}
          buttonVariant="primary"
          buttonAction={() => addCustomerDialogRef.current?.openDialog()}
          image={<img src={EmojiEmpty} alt="empty-emoji" />}
        />
      ) : (
        <>
          <ListHead>
            <PlanNameSection>
              <Typography color="disabled" variant="bodyHl">
                {translate('text_624efab67eb2570101d117cc')}
              </Typography>
            </PlanNameSection>
            <PlanInfosSection>
              <MediumCell color="disabled" variant="bodyHl">
                {translate('text_624efab67eb2570101d117d4')}
              </MediumCell>
              <SmallCell $alignLeft color="disabled" variant="bodyHl">
                {translate('text_624efab67eb2570101d117dc')}
              </SmallCell>
              <SmallCell color="disabled" variant="bodyHl">
                {translate('text_624efab67eb2570101d117e3')}
              </SmallCell>
            </PlanInfosSection>
          </ListHead>
          {loading
            ? [0, 1, 2].map((i) => <CustomerItemSkeleton key={`customer-item-skeleton-${i}`} />)
            : list.map((customer) => {
                index += 1

                return (
                  <CustomerItem
                    key={customer.id}
                    rowId={`customer-item-${index}`}
                    customer={customer}
                  />
                )
              })}
        </>
      )}

      <AddCustomerDialog ref={addCustomerDialogRef} />
    </div>
  )
}

const Header = styled(PageHeader)`
  > * {
    white-space: pre;

    &:first-child {
      margin-right: ${theme.spacing(4)};
    }
  }
`

const ListHead = styled(ListHeader)`
  justify-content: space-between;
`

const MediumCell = styled(Typography)`
  text-align: left;
  width: 200px;
`

const SmallCell = styled(Typography)<{ $alignLeft?: boolean }>`
  text-align: ${({ $alignLeft }) => ($alignLeft ? 'left' : 'right')};
  width: 112px;
`

const PlanNameSection = styled.div`
  margin-right: auto;
  display: flex;
  align-items: center;
`

const PlanInfosSection = styled.div`
  display: flex;
  > *:not(:last-child) {
    margin-right: ${theme.spacing(6)};

    ${theme.breakpoints.down('md')} {
      display: none;
    }
  }
`

export default CustomersList
