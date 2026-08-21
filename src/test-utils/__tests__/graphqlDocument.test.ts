import { parse } from 'graphql'

import { getOperationVariableTypeName } from '~/test-utils/graphqlDocument'

const document = parse(`
  query getThings($amountFrom: BigInt, $limit: Int, $ids: [ID!], $name: String!) {
    things(amountFrom: $amountFrom, limit: $limit, ids: $ids, name: $name) {
      id
    }
  }
`)

describe('getOperationVariableTypeName', () => {
  describe('GIVEN a variable declared as a named type', () => {
    it('THEN should return the declared type name', () => {
      expect(getOperationVariableTypeName(document, 'amountFrom')).toBe('BigInt')
      expect(getOperationVariableTypeName(document, 'limit')).toBe('Int')
    })
  })

  describe('GIVEN a variable that is not a plain named type', () => {
    it('THEN should return undefined for a list type', () => {
      expect(getOperationVariableTypeName(document, 'ids')).toBeUndefined()
    })

    it('THEN should return undefined for a non-null type', () => {
      expect(getOperationVariableTypeName(document, 'name')).toBeUndefined()
    })
  })

  describe('GIVEN the operation does not declare the variable', () => {
    it('THEN should return undefined', () => {
      expect(getOperationVariableTypeName(document, 'unknown')).toBeUndefined()
    })
  })

  describe('GIVEN the document holds fragments alongside the operation', () => {
    it('THEN should still read the operation variables', () => {
      // Codegen appends fragment definitions to the query documents, so the
      // operation is not always the first definition.
      const withFragment = parse(`
        fragment ThingItem on Thing {
          id
        }

        query getThings($amountFrom: BigInt) {
          things(amountFrom: $amountFrom) {
            ...ThingItem
          }
        }
      `)

      expect(getOperationVariableTypeName(withFragment, 'amountFrom')).toBe('BigInt')
    })
  })

  describe('GIVEN a document with no operation', () => {
    it('THEN should return undefined', () => {
      const fragmentOnly = parse(`
        fragment ThingItem on Thing {
          id
        }
      `)

      expect(getOperationVariableTypeName(fragmentOnly, 'amountFrom')).toBeUndefined()
    })
  })
})
