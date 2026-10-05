import { contractForDrawerFixture } from '~/components/contracts/drawers/contract/__tests__/fixtures'

import { buildContractAttachedObjectInput } from '../buildContractAttachedObjectInput'
import { ContractAttachedObjectFormValues } from '../constants'

const values: ContractAttachedObjectFormValues = {
  externalCustomerId: 'external-customer-1',
  billingEntityId: 'billing-entity-1',
  planCode: 'enterprise',
  isPlanRequired: true,
}

describe('buildContractAttachedObjectInput', () => {
  it('builds the update input keyed on the contract external id', () => {
    expect(buildContractAttachedObjectInput(values, contractForDrawerFixture)).toEqual({
      externalId: 'external-contract-1',
      planCode: 'enterprise',
      billingEntityId: 'billing-entity-1',
    })
  })

  it('omits a missing plan instead of sending an empty code', () => {
    expect(
      buildContractAttachedObjectInput({ ...values, planCode: '' }, contractForDrawerFixture)
        .planCode,
    ).toBeUndefined()
  })

  describe('on a contract that inherits its billing entity', () => {
    const inheritingContract = { ...contractForDrawerFixture, billingEntityId: null }
    // Mirrors mapContractToAttachedObjectFormValues: an inherited billing entity seeds
    // from the customer's own.
    const untouchedValues: ContractAttachedObjectFormValues = {
      ...values,
      billingEntityId: 'billing-entity-1',
    }

    // Resending the seeded fallback would pin it as an explicit override on a no-op save.
    it('omits the untouched inherited value', () => {
      expect(
        buildContractAttachedObjectInput(untouchedValues, inheritingContract).billingEntityId,
      ).toBeUndefined()
    })

    it('sends the value the user changed', () => {
      expect(
        buildContractAttachedObjectInput(
          { ...untouchedValues, billingEntityId: 'billing-entity-3' },
          inheritingContract,
        ).billingEntityId,
      ).toBe('billing-entity-3')
    })
  })
})
