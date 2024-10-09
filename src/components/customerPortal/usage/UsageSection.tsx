import { gql } from '@apollo/client'

import SectionContainer from '~/components/customerPortal/common/SectionContainer'
import SectionError from '~/components/customerPortal/common/SectionError'
import SectionLoading from '~/components/customerPortal/common/SectionLoading'
import SectionTitle from '~/components/customerPortal/common/SectionTitle'
import TextButton from '~/components/customerPortal/common/TextButton'
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
  const { translate } = useInternationalization()

  const {
    data: portalUsageData,
    loading: portalUsageLoading,
    error: portalUsageError,
    refetch: portalUsageRefetch,
  } = useGetPortalUsageQuery()

  const subscription = portalUsageData?.customerPortalSubscriptions?.collection

  const applicableTimezone =
    portalUsageData?.customerPortalSubscriptions?.collection?.[0]?.customer?.applicableTimezone

  const isLoading = portalUsageLoading
  const isError = portalUsageError

  const refreshSection = () => {
    portalUsageRefetch()
  }

  if (!isLoading && isError) {
    return (
      <section>
        <SectionTitle title={translate('text_1728377307160ilquuusbuwq')} />

        <SectionError refresh={refreshSection} />
      </section>
    )
  }

  if (!isLoading && !subscription?.length) {
    return null
  }

  return (
    <SectionContainer>
      <SectionTitle title={translate('text_1728377307160ilquuusbuwq')} loading={isLoading} />

      {isLoading && <SectionLoading variant="usage-section" />}

      {!isLoading && subscription?.length && (
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
          {subscription?.map((item) => (
            <UsageSubscriptionItem
              subscription={item}
              applicableTimezone={applicableTimezone}
              key={item.id}
            >
              <TextButton
                content={translate('text_17283773071604x345yf0jbz')}
                onClick={() => viewSubscription(item.id)}
              />
            </UsageSubscriptionItem>
          ))}
        </div>
      )}
    </SectionContainer>
  )
}

export default UsageSection
