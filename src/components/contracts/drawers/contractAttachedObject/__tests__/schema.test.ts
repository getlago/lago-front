import { contractAttachedObjectSchema } from '../schema'

describe('contractAttachedObjectSchema', () => {
  it('accepts a valid value', () => {
    expect(
      contractAttachedObjectSchema.safeParse({
        externalCustomerId: 'customer-external-id',
        billingEntityId: 'billing-entity-1',
        planCode: 'enterprise',
        isPlanRequired: true,
      }).success,
    ).toBe(true)
  })

  it('requires a plan when the contract already has one', () => {
    const result = contractAttachedObjectSchema.safeParse({
      externalCustomerId: 'customer-external-id',
      planCode: '',
      isPlanRequired: true,
    })

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['planCode'] })]),
    )
  })

  // A contract created through the API without a plan could otherwise never be saved again.
  it('accepts a missing plan when the plan is not required', () => {
    expect(
      contractAttachedObjectSchema.safeParse({
        externalCustomerId: 'customer-external-id',
        planCode: '',
        isPlanRequired: false,
      }).success,
    ).toBe(true)
  })
})
