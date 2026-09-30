import { contractForDrawerFixture } from '~/components/contracts/drawers/contract/__tests__/fixtures'
import { TimezoneEnum } from '~/generated/graphql'

import { mapContractToContractSettingsFormValues } from '../mapContractToContractSettingsFormValues'

describe('mapContractToContractSettingsFormValues', () => {
  it('maps every stored value onto the form shape', () => {
    expect(mapContractToContractSettingsFormValues(contractForDrawerFixture)).toEqual({
      externalId: 'external-contract-1',
      name: 'Enterprise agreement',
      startedAt: '2026-01-01T00:00:00Z',
      endedAt: '2099-12-31T00:00:00Z',
      initialEndedAt: '2099-12-31T00:00:00Z',
      billingAnchorDate: '2026-01-15T00:00:00.000Z',
      purchaseOrderNumber: 'PO-42',
    })
  })

  it('maps absent optional values to the empty form shapes', () => {
    const values = mapContractToContractSettingsFormValues({
      ...contractForDrawerFixture,
      name: null,
      endedAt: null,
      purchaseOrderNumber: null,
    })

    expect(values).toEqual(
      expect.objectContaining({
        name: '',
        endedAt: undefined,
        purchaseOrderNumber: undefined,
      }),
    )
  })

  // A UTC-parsed fallback would resend Jan 1 and trip `contract_locked` on an active contract.
  it('falls back to the start calendar day in the customer timezone when no anchor is stored', () => {
    const values = mapContractToContractSettingsFormValues({
      ...contractForDrawerFixture,
      startedAt: '2026-01-01T03:00:00Z',
      billingAnchorDate: null,
      customer: {
        ...contractForDrawerFixture.customer,
        applicableTimezone: TimezoneEnum.TzAmericaNewYork,
      },
    })

    expect(values.billingAnchorDate).toBe('2025-12-31T00:00:00.000Z')
  })
})
