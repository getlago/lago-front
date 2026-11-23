import { EventsStoreEnum, FeatureFlagEnum } from '~/generated/graphql'

import { isUsageGovernanceEnabled } from '../usageGovernance'

const hasOnly =
  (...flags: FeatureFlagEnum[]) =>
  (flag: FeatureFlagEnum): boolean =>
    flags.includes(flag)

describe('isUsageGovernanceEnabled', () => {
  it.each([
    [
      'the flag on a ClickHouse store',
      [FeatureFlagEnum.AccountTree],
      EventsStoreEnum.Clickhouse,
      true,
    ],
    [
      'the flag on a Postgres store',
      [FeatureFlagEnum.AccountTree],
      EventsStoreEnum.Postgres,
      false,
    ],
    [
      'no flag on a ClickHouse store',
      [FeatureFlagEnum.OrderForms],
      EventsStoreEnum.Clickhouse,
      false,
    ],
    ['the flag without organization infos', [FeatureFlagEnum.AccountTree], undefined, false],
  ])('THEN should handle %s', (_, flags, eventsStore, expected) => {
    expect(
      isUsageGovernanceEnabled({
        organization: eventsStore ? { eventsStore } : undefined,
        hasFeatureFlag: hasOnly(...flags),
      }),
    ).toBe(expected)
  })
})
