import { contractSchema } from '../schema'

const validValues = {
  externalCustomerId: 'customer-external-id',
  planCode: 'enterprise',
  isPlanRequired: true,
  name: '',
  consolidateInvoice: true,
  startedAt: '2099-01-01T00:00:00.000Z',
  endedAt: '2099-02-01T00:00:00.000Z',
  billingAnchorDate: '2099-01-01T00:00:00.000Z',
}

describe('contractSchema', () => {
  it('accepts a valid contract', () => {
    expect(contractSchema.safeParse(validValues).success).toBe(true)
  })

  it('requires a customer, plan, start date and billing anchor date', () => {
    const result = contractSchema.safeParse({
      ...validValues,
      externalCustomerId: '',
      planCode: '',
      startedAt: '',
      billingAnchorDate: '',
    })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues.map(({ path }) => path[0])).toEqual([
      'externalCustomerId',
      'planCode',
      'startedAt',
      'billingAnchorDate',
    ])
  })

  it('rejects an end date before the start date', () => {
    const result = contractSchema.safeParse({
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
    const result = contractSchema.safeParse({
      ...validValues,
      purchaseOrderNumber: 'a'.repeat(256),
    })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['purchaseOrderNumber'] })]),
    )
  })

  // A contract created through the API without a plan could otherwise never be saved again.
  it('accepts a missing plan when the plan is not required', () => {
    expect(
      contractSchema.safeParse({ ...validValues, isPlanRequired: false, planCode: '' }).success,
    ).toBe(true)
    expect(contractSchema.safeParse({ ...validValues, planCode: '' }).success).toBe(false)
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
      contractSchema.safeParse({ ...pastDates, initialEndedAt: '2021-01-01T00:00:00.000Z' })
        .success,
    ).toBe(true)
    expect(contractSchema.safeParse(pastDates).success).toBe(false)
  })

  it('still rejects an unchanged end date that is not after the start date', () => {
    expect(
      contractSchema.safeParse({
        ...validValues,
        startedAt: '2099-03-01T00:00:00.000Z',
        endedAt: '2099-02-01T00:00:00.000Z',
        initialEndedAt: '2099-02-01T00:00:00.000Z',
      }).success,
    ).toBe(false)
  })
})
