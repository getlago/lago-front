import { X402NetworkEnvironmentEnum, X402NetworkFamilyEnum } from '~/generated/graphql'

import { X402_TEST_CATALOG } from './x402NetworksFixture'

import {
  getX402Environment,
  getX402Families,
  getX402Family,
  getX402NetworkName,
  isValidAllowedOrigin,
  parseAllowedOrigins,
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
      expect(getX402Environment(['eip155:84532'], X402_TEST_CATALOG)).toBe(
        X402NetworkEnvironmentEnum.Testnet,
      )
    })

    it('GIVEN mainnet networks THEN returns mainnet', () => {
      expect(
        getX402Environment(['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'], X402_TEST_CATALOG),
      ).toBe(X402NetworkEnvironmentEnum.Mainnet)
    })

    it('GIVEN no known network THEN returns undefined', () => {
      expect(getX402Environment(['eip155:1'], X402_TEST_CATALOG)).toBeUndefined()
    })
  })

  describe('getX402NetworkName', () => {
    it('GIVEN a network of the catalog THEN returns its name', () => {
      expect(getX402NetworkName('eip155:84532', X402_TEST_CATALOG)).toBe('Base Sepolia')
    })

    it('GIVEN a network the catalog does not list THEN returns its id', () => {
      expect(getX402NetworkName('eip155:10', X402_TEST_CATALOG)).toBe('eip155:10')
    })
  })

  describe('getX402Families', () => {
    it('GIVEN both chain families THEN returns each family once', () => {
      expect(
        getX402Families(['eip155:8453', 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', 'eip155:8453']),
      ).toEqual([X402NetworkFamilyEnum.Evm, X402NetworkFamilyEnum.Svm])
    })
  })

  describe('getX402Family', () => {
    it.each([
      ['eip155:84532', X402NetworkFamilyEnum.Evm],
      ['eip155:10', X402NetworkFamilyEnum.Evm],
      ['solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z', X402NetworkFamilyEnum.Svm],
      ['cosmos:cosmoshub-4', undefined],
    ])('GIVEN %s THEN returns %s', (network, family) => {
      expect(getX402Family(network)).toBe(family)
    })
  })
})
