import { gql } from '@apollo/client'
import { Avatar, Icon } from 'lago-design-system'

import CreditNotesTable from '~/components/creditNote/CreditNotesTable'
import { Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { PageSectionTitle } from '~/components/layouts/Section'
import { SearchInput } from '~/components/SearchInput'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CreditNotesForTableFragmentDoc,
  CurrencyEnum,
  TimezoneEnum,
  useGetCustomerCreditNotesLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import ErrorImage from '~/public/images/maneki/error.svg'

gql`
  query getCustomerCreditNotes($customerId: ID!, $page: Int, $limit: Int, $searchTerm: String) {
    creditNotes(customerId: $customerId, page: $page, limit: $limit, searchTerm: $searchTerm) {
      ...CreditNotesForTable
    }
  }

  ${CreditNotesForTableFragmentDoc}
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
    <div className="flex flex-col gap-12">
      <div>
        <PageSectionTitle
          title={translate('text_63725b30957fd5b26b308dd7')}
          subtitle={translate('text_1737895765672pwk47419syk')}
        />

        <div className="flex h-18 items-center justify-between rounded-xl border border-grey-400 px-4 py-3">
          <div className="flex items-center">
            <Avatar className="mr-3" size="big" variant="connector">
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
          </div>
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
        </div>
      </div>

      <div>
        <PageSectionTitle
          title={translate('text_63725b30957fd5b26b308ddf')}
          subtitle={translate('text_1737895837105yr0kl7kkyuz')}
          customAction={
            <SearchInput
              onChange={debouncedSearch}
              placeholder={translate('text_63c6edd80c57d0dfaae3898e')}
            />
          }
        />

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
          <CreditNotesTable
            filtersContainerClassName="px-0 md:px-0"
            creditNotes={creditNotes}
            fetchMore={fetchMore}
            isLoading={isLoading}
            metadata={data?.creditNotes?.metadata}
            customerTimezone={customerTimezone}
            error={error}
            variables={variables}
            showFilters={false}
          />
        )}
      </div>
    </div>
  )
}
