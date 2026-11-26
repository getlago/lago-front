import { mapFromFormToApi } from '../mappers'
import { X402FormValues } from '../validationSchema'

const EVM_ADDRESS = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'
const SVM_ADDRESS = '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV'

const formValues = (overrides: Partial<X402FormValues> = {}): X402FormValues => ({
  isEdition: false,
  name: 'Coinbase',
  code: 'coinbase',
  cdpApiKeyId: '',
  cdpApiKeySecret: '',
  environment: 'testnet',
  networks: [],
  evmPayoutAddress: EVM_ADDRESS,
  svmPayoutAddress: SVM_ADDRESS,
  allowedOrigins: 'https://example.com',
  autoCreateCustomers: true,
  ...overrides,
})

describe('mapFromFormToApi', () => {
  describe('GIVEN an EVM address left over from a deselected network', () => {
    it('THEN sends only the address of the selected family', () => {
      const input = mapFromFormToApi(
        formValues({ networks: [{ value: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1' }] }),
      )

      expect(input.payoutAddresses).toEqual({ evm: null, svm: SVM_ADDRESS })
    })
  })

  describe('GIVEN networks of both families', () => {
    it('THEN sends both addresses', () => {
      const input = mapFromFormToApi(
        formValues({
          networks: [
            { value: 'eip155:84532' },
            { value: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1' },
          ],
        }),
      )

      expect(input.payoutAddresses).toEqual({ evm: EVM_ADDRESS, svm: SVM_ADDRESS })
    })
  })

  describe('GIVEN a saved network the catalog does not know', () => {
    it('THEN keeps the address of the family its namespace names', () => {
      const input = mapFromFormToApi(formValues({ networks: [{ value: 'eip155:10' }] }))

      expect(input.networks).toEqual(['eip155:10'])
      expect(input.payoutAddresses).toEqual({ evm: EVM_ADDRESS, svm: null })
    })
  })
})
