import { renderHook, waitFor } from '@testing-library/react'

import { GetBillingEntitiesDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'
import { buildBillingEntity as buildEntity } from '~/test-utils/fixtures/billingEntity'

import {
  BILLING_ENTITY_INHERIT_CODE,
  useBillingEntitiesOptions,
} from '../useBillingEntitiesOptions'

const billingEntitiesMock = (entities: ReturnType<typeof buildEntity>[]): TestMocksType => [
  {
    request: { query: GetBillingEntitiesDocument },
    result: {
      data: {
        billingEntities: {
          __typename: 'BillingEntityCollection',
          collection: entities,
        },
      },
    },
  },
]

const createWrapper = (mocks: TestMocksType) => {
  return ({ children }: { children: React.ReactNode }) => AllTheProviders({ children, mocks })
}

describe('useBillingEntitiesOptions', () => {
  describe('GIVEN the org has multiple billing entities', () => {
    const mocks = billingEntitiesMock([
      buildEntity({ id: '1', code: 'us', name: 'Acme US', isDefault: true }),
      buildEntity({ id: '2', code: 'eu', name: 'Acme EU', isDefault: false }),
    ])

    it('THEN returns options with the default entity sorted first', async () => {
      const { result } = renderHook(() => useBillingEntitiesOptions(), {
        wrapper: createWrapper(mocks),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.options).toHaveLength(2)
      expect(result.current.options[0].value).toBe('us')
      expect(result.current.options[0].isDefault).toBe(true)
      expect(result.current.options[0].label).toContain('Acme US')
      expect(result.current.options[1].value).toBe('eu')
      expect(result.current.defaultEntityCode).toBe('us')
      expect(result.current.hasMultipleEntities).toBe(true)
    })

    it('THEN prepends an inherit sentinel option when includeInheritOption is true', async () => {
      const { result } = renderHook(
        () =>
          useBillingEntitiesOptions({
            includeInheritOption: true,
            inheritLabel: 'Use customer default',
          }),
        { wrapper: createWrapper(mocks) },
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.options).toHaveLength(3)
      expect(result.current.options[0]).toEqual({
        id: '',
        value: BILLING_ENTITY_INHERIT_CODE,
        label: 'Use customer default',
        isDefault: false,
        euTaxManagement: false,
      })
      expect(result.current.options[1].value).toBe('us')
    })

    it('THEN gives the sentinel a non-empty ComboBox value so it can be held as a selection', async () => {
      const { result } = renderHook(
        () => useBillingEntitiesOptions({ includeInheritOption: true }),
        {
          wrapper: createWrapper(mocks),
        },
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(BILLING_ENTITY_INHERIT_CODE).not.toBe('')
      expect(result.current.options[0].value).toBe(BILLING_ENTITY_INHERIT_CODE)
      expect(result.current.options[0].id).toBe('')
      expect(result.current.options.slice(1).map((option) => option.value)).not.toContain(
        BILLING_ENTITY_INHERIT_CODE,
      )
    })
  })

  describe('GIVEN the org has a single billing entity', () => {
    const mocks = billingEntitiesMock([
      buildEntity({ id: '1', code: 'only', name: 'Only entity', isDefault: true }),
    ])

    it('THEN reports hasMultipleEntities = false', async () => {
      const { result } = renderHook(() => useBillingEntitiesOptions(), {
        wrapper: createWrapper(mocks),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasMultipleEntities).toBe(false)
      expect(result.current.options).toHaveLength(1)
    })
  })

  describe('GIVEN skip is true', () => {
    it('THEN does NOT fetch and returns an empty list', () => {
      const { result } = renderHook(() => useBillingEntitiesOptions({ skip: true }), {
        wrapper: createWrapper([]),
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.options).toEqual([])
      expect(result.current.defaultEntityCode).toBeUndefined()
      expect(result.current.hasMultipleEntities).toBe(false)
    })
  })
})
