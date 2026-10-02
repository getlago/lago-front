import { contractForDrawerFixture } from '~/components/contracts/drawers/contract/__tests__/fixtures'

import { buildContractSettingsInput } from '../buildContractSettingsInput'
import { ContractSettingsFormValues } from '../constants'

const values: ContractSettingsFormValues = {
  externalId: 'ignored-edited-value',
  name: 'Enterprise agreement',
  startedAt: '2099-01-01T00:00:00.000Z',
  endedAt: '2099-02-01T00:00:00.000Z',
  billingAnchorDate: '2099-01-01T00:00:00.000Z',
  purchaseOrderNumber: '  PO-42  ',
}

const clearedValues: ContractSettingsFormValues = {
  ...values,
  name: '',
  purchaseOrderNumber: '   ',
  endedAt: undefined,
}

describe('buildContractSettingsInput', () => {
  it('builds the update input keyed on the contract external id, ignoring the display-only field', () => {
    const input = buildContractSettingsInput(values, contractForDrawerFixture)

    expect(input).toEqual({
      externalId: 'external-contract-1',
      name: 'Enterprise agreement',
      startedAt: '2099-01-01T00:00:00.000Z',
      endedAt: '2099-02-01T00:00:00.000Z',
      billingAnchorDate: '2099-01-01',
      purchaseOrderNumber: 'PO-42',
    })
  })

  it('sends null for every cleared optional value', () => {
    expect(buildContractSettingsInput(clearedValues, contractForDrawerFixture)).toEqual(
      expect.objectContaining({
        name: null,
        purchaseOrderNumber: null,
        endedAt: null,
      }),
    )
  })

  describe('on a contract that inherits its billing anchor', () => {
    const inheritingContract = { ...contractForDrawerFixture, billingAnchorDate: null }
    const untouchedValues: ContractSettingsFormValues = {
      ...values,
      billingAnchorDate: '2026-01-01T00:00:00.000Z',
    }

    // Resending the seeded fallback would pin it as an explicit override on a no-op save.
    it('omits the untouched inherited value', () => {
      expect(
        buildContractSettingsInput(untouchedValues, inheritingContract).billingAnchorDate,
      ).toBeUndefined()
    })

    it('sends the value the user changed', () => {
      expect(
        buildContractSettingsInput(
          { ...untouchedValues, billingAnchorDate: '2026-02-01T00:00:00.000Z' },
          inheritingContract,
        ).billingAnchorDate,
      ).toBe('2026-02-01')
    })
  })
})
