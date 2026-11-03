import {
  EventsStoreEnum,
  FeatureFlagEnum,
  MainOrganizationInfosFragment,
} from '~/generated/graphql'

// `UsageAttributions::QueryService#available?`: governance data only exists on the ClickHouse
// events store, so the `account_tree` flag alone must not unlock any governance UI.
export const isUsageGovernanceEnabled = ({
  organization,
  hasFeatureFlag,
}: {
  organization?: Pick<MainOrganizationInfosFragment, 'eventsStore'>
  hasFeatureFlag: (flag: FeatureFlagEnum) => boolean
}): boolean =>
  hasFeatureFlag(FeatureFlagEnum.AccountTree) &&
  organization?.eventsStore === EventsStoreEnum.Clickhouse
