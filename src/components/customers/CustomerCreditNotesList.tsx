import { gql } from '@apollo/client'
import styled from 'styled-components'

import CreditNotesList from '~/components/customers/creditNotes/CreditNotesList'
import { Avatar, Icon, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_CREDIT_NOTE_DETAILS_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CreditNotesForListFragmentDoc,
  CurrencyEnum,
  TimezoneEnum,
  useGetCustomerCreditNotesLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import ErrorImage from '~/public/images/maneki/error.svg'
import { NAV_HEIGHT, theme } from '~/styles'
import { SectionHeader, SideSection } from '~/styles/customer'

import { SearchInput } from '../SearchInput'

gql`
  query getCustomerCreditNotes($customerId: ID!, $page: Int, $limit: Int, $searchTerm: String) {
    creditNotes(customerId: $customerId, page: $page, limit: $limit, searchTerm: $searchTerm) {
      ...CreditNotesForList
    }
  }

  ${CreditNotesForListFragmentDoc}
`

interface CustomerCreditNotesListProps {
  customerId: string
  creditNotesCreditsAvailableCount?: number
  creditNotesBalanceAmountCents?: string
  userCurrency?: CurrencyEnum
  customerTimezone?: TimezoneEnum
}

export const CustomerCreditNotesList = ({
  customerId,
  creditNotesCreditsAvailableCount,
  creditNotesBalanceAmountCents,
  userCurrency,
  customerTimezone,
}: CustomerCreditNotesListProps) => {
  const { translate } = useInternationalization()
  const [getCreditNotes, { data, loading, error, fetchMore, variables }] =
    useGetCustomerCreditNotesLazyQuery({
      variables: { customerId, limit: 20 },
    })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getCreditNotes, loading)
  const creditNotes = data?.creditNotes?.collection

  return (
    <SideSection>
      <SectionHeader variant="subhead" color="grey700" $hideBottomShadow>
        {translate('text_63725b30957fd5b26b308dd7')}
      </SectionHeader>
      <TotalCreditAmountWrapper>
        <TotalCreditAmountLeftWrapper>
          <Avatar size="big" variant="connector">
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
          {intlFormatNumber(
            deserializeAmount(
              creditNotesBalanceAmountCents || 0,
              userCurrency || CurrencyEnum.Usd,
            ) || 0,
            {
              currencyDisplay: 'symbol',
              currency: userCurrency,
            },
          )}
        </Typography>
      </TotalCreditAmountWrapper>

      <HeaderWithSearch>
        <Typography variant="subhead" color="grey700">
          {translate('text_63725b30957fd5b26b308ddf')}
        </Typography>
        <SearchInput
          onChange={debouncedSearch}
          placeholder={translate('text_63c6edd80c57d0dfaae3898e')}
        />
      </HeaderWithSearch>
      {!!error && !isLoading ? (
        <GenericPlaceholder
          title={translate('text_636d023ce11a9d038819b579')}
          subtitle={translate('text_636d023ce11a9d038819b57b')}
          buttonTitle={translate('text_636d023ce11a9d038819b57d')}
          buttonVariant="primary"
          buttonAction={() => location.reload()}
          image={<ErrorImage width="136" height="104" />}
        />
      ) : (
        <CreditNotesList
          creditNotes={creditNotes}
          fetchMore={fetchMore}
          itemClickRedirection={CUSTOMER_CREDIT_NOTE_DETAILS_ROUTE}
          loading={isLoading}
          hasSearchQuery={!!variables?.searchTerm}
          metadata={data?.creditNotes?.metadata}
          customerTimezone={customerTimezone}
        />
      )}
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

const HeaderWithSearch = styled.div`
  height: ${NAV_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;
  justify-content: space-between;
`
