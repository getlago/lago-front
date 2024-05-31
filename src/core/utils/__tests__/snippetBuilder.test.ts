import { SnippetBuilder } from '~/core/utils/snippetBuilder'

const builder = new SnippetBuilder()

describe('SnippetBuilder', () => {
  describe('addProperty', () => {
    it('should return property when key and value are defined with default options', () => {
      const result = builder.addProperty('name', 'John Doe')

      expect(result).toBe('"name": "John Doe"')
    })

    it('should return property when showIfEmpty is true but value is an empty string', () => {
      const result = builder.addProperty('name', '', { showIfEmpty: true })

      expect(result).toBe('"name": ""')
    })

    it('should return property when showIfEmpty is true but value is undefined', () => {
      const result = builder.addProperty('name', undefined, { showIfEmpty: true })

      expect(result).toBe('"name": ""')
    })

    it('should return "__empty__" when value is an empty string', () => {
      const result = builder.addProperty('name', '')

      expect(result).toBe('__empty__')
    })

    it('should return "__empty__" when value is undefined', () => {
      const result = builder.addProperty('name', undefined)

      expect(result).toBe('__empty__')
    })

    it('should return property when key and value are defined with number value', () => {
      const result = builder.addProperty('rate_amount', 100)

      expect(result).toBe('"rate_amount": 100')
    })
  })

  describe('build', () => {
    it('should remove empty lines without changing indentation and add commas', () => {
      const snippet = `\
  # Edit a wallet on a customer
  curl --location --request PUT "/api/v1/wallets/:lago_id" \\
  --header "Content-Type: application/json" \\
  --data-raw '{
    "wallet": {
      __empty__
      "id": "b7ab2926-1de8-4428-9bcd-779314ac129b"
      "name": "John Doe"
      "rate_amount": "100"
      __empty__
      "currency": "USD"
      "external_customer_id": "__EXTERNAL_CUSTOMER_ID__",
      "expiration_at": "2022-12-31"
    }
  }'
  `
      const result = builder.build(snippet)

      expect(result).toBe(`\
  # Edit a wallet on a customer
  curl --location --request PUT "/api/v1/wallets/:lago_id" \\
  --header "Content-Type: application/json" \\
  --data-raw '{
    "wallet": {
      "id": "b7ab2926-1de8-4428-9bcd-779314ac129b",
      "name": "John Doe",
      "rate_amount": "100",
      "currency": "USD",
      "external_customer_id": "__EXTERNAL_CUSTOMER_ID__",
      "expiration_at": "2022-12-31"
    }
  }'
  `)
    })
  })

  it('should not add commas when json object only have one item', () => {
    const snippet = `\
  # Edit a wallet on a customer
  curl --location --request PUT "/api/v1/wallets/:lago_id" \\
  --header "Content-Type: application/json" \\
  --data-raw '{
    "wallet": {
      "id": "b7ab2926-1de8-4428-9bcd-779314ac129b"
    }
  }'
  `
    const result = builder.build(snippet)

    expect(result).toBe(snippet)
  })
})
