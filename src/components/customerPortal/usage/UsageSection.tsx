import { gql } from '@apollo/client'

import SectionContainer from '~/components/customerPortal/common/SectionContainer'
import SectionLoading from '~/components/customerPortal/common/SectionLoading'
import SectionTitle from '~/components/customerPortal/common/SectionTitle'
import UsageSubscriptionItem from '~/components/customerPortal/usage/UsageSubscriptionItem'
import { SubscriptionForPortalUsageFragmentDoc, useGetPortalUsageQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  query getPortalUsage {
    customerPortalSubscriptions {
      collection {
        id
        ...SubscriptionForPortalUsage
      }
    }
  }

  ${SubscriptionForPortalUsageFragmentDoc}
`

type PortalUsageSectionProps = {
  viewSubscription: (id: string) => void
}

const UsageSection = ({ viewSubscription }: PortalUsageSectionProps) => {
  const { data, loading } = useGetPortalUsageQuery()

  const { translate } = useInternationalization()

  const subscription = data?.customerPortalSubscriptions?.collection

  const applicableTimezone =
    data?.customerPortalSubscriptions?.collection?.[0]?.customer?.applicableTimezone

  return (
    <SectionContainer>
      <SectionTitle title={translate('TODO: Plans')} />

      {loading && <SectionLoading />}

      {!loading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {subscription?.map((item) => (
            <UsageSubscriptionItem
              subscription={item}
              applicableTimezone={applicableTimezone}
              key={item.id}
            >
              <button
                className="p-0 text-base font-normal text-blue-600"
                onClick={() => viewSubscription(item.id)}
              >
                {translate('TODO: View usage')}
              </button>
            </UsageSubscriptionItem>
          ))}
        </div>
      )}
    </SectionContainer>
  )
}

export default UsageSection
