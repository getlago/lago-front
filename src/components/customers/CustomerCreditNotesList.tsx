import { useRef } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'

import {
  CreditNotesForListFragmentDoc,
  CurrencyEnum,
  useGetCustomerCreditNotesQuery,
} from '~/generated/graphql'
import { Avatar, Icon, Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { NAV_HEIGHT, theme } from '~/styles'
import { SectionHeader, SideSection } from '~/styles/customer'
import { intlFormatNumber } from '~/core/intlFormatNumber'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import ErrorImage from '~/public/images/maneki/error.svg'
import { CUSTOMER_CREDIT_NOTE_DETAILS_ROUTE } from '~/core/router'
import CreditNotesList from '~/components/customers/creditNotes/CreditNotesList'

import { VoidCreditNoteDialog, VoidCreditNoteDialogRef } from './creditNotes/VoidCreditNoteDialog'

gql`
  query getCustomerCreditNotes($customerId: ID!, $page: Int, $limit: Int) {
    customerCreditNotes(customerId: $customerId, page: $page, limit: $limit) {
      ...CreditNotesForList
    }
  }

  ${CreditNotesForListFragmentDoc}
`

interface CustomerCreditNotesListProps {
  customerId: string
  creditNotesCreditsAvailableCount?: number
  creditNotesBalanceAmountCents?: number
  userCurrency?: CurrencyEnum
}

export const CustomerCreditNotesList = ({
  customerId,
  creditNotesCreditsAvailableCount,
  creditNotesBalanceAmountCents,
  userCurrency,
}: CustomerCreditNotesListProps) => {
  const { translate } = useInternationalization()
  const voidCreditNoteDialogRef = useRef<VoidCreditNoteDialogRef>(null)
  const { data, loading, error, fetchMore } = useGetCustomerCreditNotesQuery({
    variables: { customerId, limit: 20 },
    skip: !customerId,
  })
  const creditNotes = data?.customerCreditNotes?.collection

  return (
    <SideSection>
      <SectionHeader variant="subhead" color="grey700" $hideBottomShadow>
        {translate('text_63725b30957fd5b26b308dd7')}
      </SectionHeader>
      <TotalCreditAmountWrapper>
        <TotalCreditAmountLeftWrapper>
          <Avatar variant="connector">
            <Icon name="wallet" color="dark" />
          </Avatar>
          <div>
            <Typography variant="bodyHl" color="grey700">
              {translate('text_63725b30957fd5b26b308dd9')}
            </Typography>
            <Typography variant="caption" color="grey600">
              {translate('text_63725b30957fd5b26b308ddb', {
                count: creditNotesCreditsAvailableCount,
              })}
            </Typography>
          </div>
        </TotalCreditAmountLeftWrapper>
        <Typography variant="body" color="grey700">
          {intlFormatNumber(creditNotesBalanceAmountCents || 0, {
            currencyDisplay: 'symbol',
            currency: userCurrency,
          })}
        </Typography>
      </TotalCreditAmountWrapper>

      <SectionHeader variant="subhead" color="grey700">
        {translate('text_63725b30957fd5b26b308ddf')}
      </SectionHeader>
      {!!error && !loading ? (
        <GenericPlaceholder
          title={translate('text_636d023ce11a9d038819b579')}
          subtitle={translate('text_636d023ce11a9d038819b57b')}
          buttonTitle={translate('text_636d023ce11a9d038819b57d')}
          buttonVariant="primary"
          buttonAction={() => location.reload()}
          image={<ErrorImage width="136" height="104" />}
        />
      ) : !!creditNotes && !!creditNotes?.length ? (
        <CreditNotesList
          creditNotes={creditNotes}
          fetchMore={fetchMore}
          itemClickRedirection={CUSTOMER_CREDIT_NOTE_DETAILS_ROUTE}
          loading={loading}
          metadata={data?.customerCreditNotes?.metadata}
        />
      ) : undefined}
      <VoidCreditNoteDialog ref={voidCreditNoteDialogRef} />
    </SideSection>
  )
}

const TotalCreditAmountWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: ${NAV_HEIGHT}px;
  padding: ${theme.spacing(3)} ${theme.spacing(4)};
  margin-bottom: ${theme.spacing(8)};
  box-sizing: border-box;
  border: 1px solid ${theme.palette.grey[400]};
  border-radius: 12px;
`

const TotalCreditAmountLeftWrapper = styled.div`
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`
