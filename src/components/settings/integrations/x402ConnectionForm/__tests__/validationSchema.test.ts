import { REQUIRED_ERROR, x402DefaultValues, x402ValidationSchema } from '../validationSchema'

const editionValues = {
  ...x402DefaultValues,
  isEdition: true,
  name: 'Coinbase',
  code: 'coinbase',
  evmPayoutAddress: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
  allowedOrigins: 'https://example.com',
}

describe('x402ValidationSchema', () => {
  describe('GIVEN no environment and no network', () => {
    it('THEN requires the environment', () => {
      const result = x402ValidationSchema.safeParse(editionValues)

      expect(result.error?.issues).toContainEqual(
        expect.objectContaining({ path: ['environment'], message: REQUIRED_ERROR }),
      )
    })
  })

  describe('GIVEN a saved connection on a network the catalog does not know', () => {
    it('THEN accepts it without an environment', () => {
      const result = x402ValidationSchema.safeParse({
        ...editionValues,
        networks: [{ value: 'eip155:10', label: 'eip155:10' }],
      })

      expect(result.success).toBe(true)
    })

    it('THEN still requires the payout address of its family', () => {
      const result = x402ValidationSchema.safeParse({
        ...editionValues,
        evmPayoutAddress: '',
        networks: [{ value: 'eip155:10', label: 'eip155:10' }],
      })

      expect(result.error?.issues).toContainEqual(
        expect.objectContaining({ path: ['evmPayoutAddress'] }),
      )
    })
  })
})
