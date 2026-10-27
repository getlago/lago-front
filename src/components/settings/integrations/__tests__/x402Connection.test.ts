import {
  getX402Environment,
  getX402Families,
  isValidAllowedOrigin,
  parseAllowedOrigins,
  X402EnvironmentEnum,
  X402FamilyEnum,
} from '../x402Connection'

describe('x402Connection', () => {
  describe('isValidAllowedOrigin', () => {
    it.each([
      'https://example.com',
      'https://api.example.com',
      'https://api.example.com:8443',
      'HTTPS://API.Example.com/',
      'http://localhost:3000',
      'http://127.0.0.1:8080',
      'http://[::1]:3000',
    ])('GIVEN %s THEN accepts it', (origin) => {
      expect(isValidAllowedOrigin(origin)).toBe(true)
    })

    it.each([
      'https://api.example.com/v1',
      'https://*.example.com',
      'api.example.com',
      'http://api.example.com',
      'https://api.example.com:70000',
      'https://user@api.example.com',
      'https://api.example.com?x=1',
    ])('GIVEN %s THEN refuses it', (origin) => {
      expect(isValidAllowedOrigin(origin)).toBe(false)
    })
  })

  describe('parseAllowedOrigins', () => {
    it('GIVEN origins separated by commas and new lines THEN returns each one once trimmed', () => {
      expect(parseAllowedOrigins(' https://a.com,\nhttps://b.com\n\n, https://c.com ')).toEqual([
        'https://a.com',
        'https://b.com',
        'https://c.com',
      ])
    })

    it('GIVEN only separators THEN returns nothing', () => {
      expect(parseAllowedOrigins(' ,\n ')).toEqual([])
    })
  })

  describe('getX402Environment', () => {
    it('GIVEN testnet networks THEN returns testnet', () => {
      expect(getX402Environment(['eip155:84532'])).toBe(X402EnvironmentEnum.Testnet)
    })

    it('GIVEN mainnet networks THEN returns mainnet', () => {
      expect(getX402Environment(['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'])).toBe(
        X402EnvironmentEnum.Mainnet,
      )
    })

    it('GIVEN no known network THEN returns undefined', () => {
      expect(getX402Environment(['eip155:1'])).toBeUndefined()
    })
  })

  describe('getX402Families', () => {
    it('GIVEN both chain families THEN returns each family once', () => {
      expect(
        getX402Families(['eip155:8453', 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', 'eip155:8453']),
      ).toEqual([X402FamilyEnum.Evm, X402FamilyEnum.Svm])
    })
  })
})
