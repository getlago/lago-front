import { gql } from '@apollo/client'
import { Icon } from 'lago-design-system'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import CreditNotesTable from '~/components/creditNote/CreditNotesTable'
import { Avatar } from '~/components/designSystem/Avatar'
import { Filters } from '~/components/designSystem/Filters'
import { AvailableFiltersEnum } from '~/components/designSystem/Filters/types'
import { formatFiltersForCustomerCreditNotesQuery } from '~/components/designSystem/Filters/utils'
import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { Typography } from '~/components/designSystem/Typography'
import { PageSectionTitle } from '~/components/layouts/Section'
import { CUSTOMER_CREDIT_NOTES_FILTER_PREFIX } from '~/core/constants/filters'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CreditNotesForTableFragmentDoc,
  CurrencyEnum,
  FeatureFlagEnum,
  TimezoneEnum,
  useGetCustomerCreditNotesLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
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
  const { hasFeatureFlag } = useOrganizationInfos()
  const hasMultiCurrency = hasFeatureFlag(FeatureFlagEnum.MultiCurrency)
  const hasMultiEntityBilling = hasFeatureFlag(FeatureFlagEnum.MultiEntityBilling)
  const availableFilters = [
    ...(hasMultiCurrency ? [AvailableFiltersEnum.currency] : []),
    ...(hasMultiEntityBilling ? [AvailableFiltersEnum.billingEntityId] : []),
  ]
  const [searchParams] = useSearchParams()

  const { currency, billingEntityId } = formatFiltersForCustomerCreditNotesQuery(searchParams)

  const [getCreditNotes, { data, loading, error, fetchMore, variables }] =
    useGetCustomerCreditNotesLazyQuery({
      variables: { customerId, limit: 20 },
    })

  useEffect(() => {
    getCreditNotes({
      variables: {
        customerId,
        limit: 20,
        currency,
        billingEntityIds: billingEntityId ? [billingEntityId] : undefined,
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, currency, billingEntityId])

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
        />

        {availableFilters.length > 0 && (
          <Filters.Provider
            filtersNamePrefix={CUSTOMER_CREDIT_NOTES_FILTER_PREFIX}
            availableFilters={availableFilters}
          >
            <div className="mb-4 flex items-center gap-2">
              <Filters.Component />
            </div>
          </Filters.Provider>
        )}

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
    </div>
  )
}
