import { contractAttachedObjectSchema } from '../schema'

describe('contractAttachedObjectSchema', () => {
  it('accepts a valid value', () => {
    expect(
      contractAttachedObjectSchema.safeParse({
        externalCustomerId: 'customer-external-id',
        billingEntityId: 'billing-entity-1',
        planCode: 'enterprise',
      }).success,
    ).toBe(true)
  })

  it('always requires a plan', () => {
    const result = contractAttachedObjectSchema.safeParse({
      externalCustomerId: 'customer-external-id',
      planCode: '',
    })

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['planCode'] })]),
    )
  })
})
