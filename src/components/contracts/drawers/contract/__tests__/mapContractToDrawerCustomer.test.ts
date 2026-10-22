import { TimezoneEnum } from '~/generated/graphql'

import { contractForDrawerFixture } from './fixtures'

import { mapContractToDrawerCustomer } from '../mapContractToDrawerCustomer'

describe('mapContractToDrawerCustomer', () => {
  it('seeds the drawer customer from the contract customer', () => {
    expect(mapContractToDrawerCustomer(contractForDrawerFixture)).toEqual({
      id: 'customer-1',
      externalId: 'external-customer-1',
      displayName: 'Acme',
      applicableTimezone: TimezoneEnum.TzUtc,
      billingEntityId: 'billing-entity-1',
    })
  })
})
