import { gql } from '@apollo/client'
import { Icon } from 'lago-design-system'
import { debounce } from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import CreditNotesTable from '~/components/creditNote/CreditNotesTable'
import { Avatar } from '~/components/designSystem/Avatar'
import { Filters } from '~/components/designSystem/Filters'
import { formatFiltersForCustomerCreditNotesQuery } from '~/components/designSystem/Filters/utils'
import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { Typography } from '~/components/designSystem/Typography'
import { PageSectionTitle } from '~/components/layouts/Section'
import { SearchInput } from '~/components/SearchInput'
import { CUSTOMER_CREDIT_NOTES_FILTER_PREFIX } from '~/core/constants/filters'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CreditNotesForTableFragmentDoc,
  CurrencyEnum,
  CustomerCreditNotesBalance,
  TimezoneEnum,
  useGetCustomerCreditNotesLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCustomerFilterDefaults } from '~/hooks/useCustomerFilterDefaults'
import { DEBOUNCE_SEARCH_MS } from '~/hooks/useDebouncedSearch'
import ErrorImage from '~/public/images/maneki/error.svg'

gql`
  query getCustomerCreditNotes(
    $customerId: ID!
    $page: Int
    $limit: Int
    $searchTerm: String
    $currency: CurrencyEnum
    $billingEntityIds: [ID!]
  ) {
    creditNotes(
      customerId: $customerId
      page: $page
      limit: $limit
      searchTerm: $searchTerm
      currency: $currency
      billingEntityIds: $billingEntityIds
    ) {
      ...CreditNotesForTable
    }
  }

  ${CreditNotesForTableFragmentDoc}
`

interface CustomerCreditNotesListProps {
  customerId: string
  creditNotesCreditsAvailableCount?: number
  creditNotesBalances?: Pick<CustomerCreditNotesBalance, 'currency' | 'amountCents'>[]
  userCurrency?: CurrencyEnum
  customerTimezone?: TimezoneEnum
}

export const CustomerCreditNotesList = ({
  customerId,
  creditNotesCreditsAvailableCount,
  creditNotesBalances,
  userCurrency,
  customerTimezone,
}: CustomerCreditNotesListProps) => {
  const { translate } = useInternationalization()
  const filtersProps = useCustomerFilterDefaults({
    customerCurrency: userCurrency,
    filtersNamePrefix: CUSTOMER_CREDIT_NOTES_FILTER_PREFIX,
    include: ['currency', 'entity'],
  })
  const [searchParams] = useSearchParams()

  const { currency, billingEntityId } = formatFiltersForCustomerCreditNotesQuery(searchParams)

  const [getCreditNotes, { data, loading, error, fetchMore, variables }] =
    useGetCustomerCreditNotesLazyQuery({
      variables: { customerId, limit: 20 },
    })

  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined)

  useEffect(() => {
    getCreditNotes({
      variables: {
        customerId,
        limit: 20,
        searchTerm,
        currency,
        billingEntityIds: billingEntityId ? [billingEntityId] : undefined,
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, searchTerm, currency, billingEntityId])

  const debouncedSetSearchTerm = useMemo(
    () => debounce((value: string) => setSearchTerm(value || undefined), DEBOUNCE_SEARCH_MS),
    [],
  )

  useEffect(() => {
    return () => {
      debouncedSetSearchTerm.cancel()
    }
  }, [debouncedSetSearchTerm])

  const creditNotes = data?.creditNotes?.collection

  const displayCurrency = (currency as CurrencyEnum | undefined) ?? userCurrency ?? CurrencyEnum.Usd

  // Always pick a single-currency bucket from `creditNotesBalances`:
  // - active currency filter → bucket for that currency
  // - otherwise → bucket for the customer's currency
  // Never falls back to `creditNotesBalanceAmountCents` (legacy scalar that
  // sums cross-currency without conversion — wrong when the customer has CN
  // in more than one currency). Customers with no CN in the target currency
  // see `0`, which is accurate.
  const displayBalanceAmountCents = useMemo(() => {
    const bucket = creditNotesBalances?.find((b) => b.currency === displayCurrency)

    return bucket?.amountCents ?? 0
  }, [displayCurrency, creditNotesBalances])

  return (
    <div>
      <PageSectionTitle
        title={translate('text_1779269934897no61nlpm9qz')}
        subtitle={translate('text_1737895765672pwk47419syk')}
      />

      <div className="mb-4 flex items-center gap-3">
        <SearchInput
          onChange={debouncedSetSearchTerm}
          placeholder={translate('text_63c6edd80c57d0dfaae3898e')}
        />
        {filtersProps && (
          <Filters.Provider {...filtersProps}>
            <Filters.Component />
          </Filters.Provider>
        )}
      </div>

      <div className="mb-4 flex h-18 items-center justify-between rounded-xl border border-grey-400 px-4 py-3">
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
          {intlFormatNumber(deserializeAmount(displayBalanceAmountCents, displayCurrency) || 0, {
            currencyDisplay: 'symbol',
            currency: displayCurrency,
          })}
        </Typography>
      </div>

      {!!error && !loading ? (
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
          creditNotes={creditNotes}
          fetchMore={fetchMore}
          isLoading={loading}
          metadata={data?.creditNotes?.metadata}
          customerTimezone={customerTimezone}
          error={error}
          variables={variables}
        />
      )}
    </div>
  )
}
