import { contractSettingsSchema } from '../schema'

const validValues = {
  externalId: 'external-contract-1',
  name: '',
  startedAt: '2099-01-01T00:00:00.000Z',
  endedAt: '2099-02-01T00:00:00.000Z',
  billingAnchorDate: '2099-01-01T00:00:00.000Z',
}

describe('contractSettingsSchema', () => {
  it('accepts valid contract settings', () => {
    expect(contractSettingsSchema.safeParse(validValues).success).toBe(true)
  })

  it('requires a start date and billing anchor date', () => {
    const result = contractSettingsSchema.safeParse({
      ...validValues,
      startedAt: '',
      billingAnchorDate: '',
    })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues.map(({ path }) => path[0])).toEqual([
      'startedAt',
      'billingAnchorDate',
    ])
  })

  it('rejects an end date before the start date', () => {
    const result = contractSettingsSchema.safeParse({
      ...validValues,
      endedAt: '2098-12-31T00:00:00.000Z',
    })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['endedAt'] })]),
    )
  })

  it('rejects a purchase order number longer than 255 characters', () => {
    const result = contractSettingsSchema.safeParse({
      ...validValues,
      purchaseOrderNumber: 'a'.repeat(256),
    })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['purchaseOrderNumber'] })]),
    )
  })

  // `Contracts::UpdateService` accepts the stored end date resent unchanged, even once it has passed.
  it('accepts a past end date left unchanged, but not one newly entered', () => {
    const pastDates = {
      ...validValues,
      startedAt: '2020-01-01T00:00:00.000Z',
      endedAt: '2021-01-01T00:00:00.000Z',
      billingAnchorDate: '2020-01-01T00:00:00.000Z',
    }

    expect(
      contractSettingsSchema.safeParse({ ...pastDates, initialEndedAt: '2021-01-01T00:00:00.000Z' })
        .success,
    ).toBe(true)
    expect(contractSettingsSchema.safeParse(pastDates).success).toBe(false)
  })
})
