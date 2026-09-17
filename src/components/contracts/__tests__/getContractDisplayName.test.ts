import { getContractDisplayName } from '../getContractDisplayName'

describe('getContractDisplayName', () => {
  it('uses the contract name when it is defined', () => {
    expect(
      getContractDisplayName({
        name: 'Enterprise agreement',
        plan: { name: 'Enterprise plan' },
      }),
    ).toBe('Enterprise agreement')
  })

  it('uses the plan name when the contract name is absent', () => {
    expect(
      getContractDisplayName({
        name: null,
        plan: { name: 'Enterprise plan' },
      }),
    ).toBe('Enterprise plan')
  })
})
