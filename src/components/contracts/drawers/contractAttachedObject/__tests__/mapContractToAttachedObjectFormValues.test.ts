import { contractForDrawerFixture } from '~/components/contracts/drawers/contract/__tests__/fixtures'

import { mapContractToAttachedObjectFormValues } from '../mapContractToAttachedObjectFormValues'

describe('mapContractToAttachedObjectFormValues', () => {
  it('maps the stored value onto the form shape', () => {
    expect(mapContractToAttachedObjectFormValues(contractForDrawerFixture)).toEqual({
      externalCustomerId: 'external-customer-1',
      billingEntityId: 'billing-entity-2',
      planCode: 'enterprise',
      isPlanRequired: true,
    })
  })

  it('falls back to the customer billing entity and an empty plan when absent', () => {
    expect(
      mapContractToAttachedObjectFormValues({
        ...contractForDrawerFixture,
        billingEntityId: null,
        plan: null,
      }),
    ).toEqual(
      expect.objectContaining({
        billingEntityId: 'billing-entity-1',
        planCode: '',
        isPlanRequired: false,
      }),
    )
  })
})
