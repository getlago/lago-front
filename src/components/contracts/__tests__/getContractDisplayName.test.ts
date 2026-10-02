import { getContractDisplayName } from '../getContractDisplayName'

describe('getContractDisplayName', () => {
  it('uses the contract name when it is defined', () => {
    expect(
      getContractDisplayName({
        name: 'Enterprise agreement',
        externalId: 'contract-1',
        plan: { name: 'Enterprise plan' },
      }),
    ).toBe('Enterprise agreement')
  })

  it('uses the plan name when the contract name is absent', () => {
    expect(
      getContractDisplayName({
        name: null,
        externalId: 'contract-1',
        plan: { name: 'Enterprise plan' },
      }),
    ).toBe('Enterprise plan')
  })

  it('uses the external ID when neither the name nor the plan is set', () => {
    expect(
      getContractDisplayName({
        name: null,
        externalId: 'contract-1',
        plan: null,
      }),
    ).toBe('contract-1')
  })
})
