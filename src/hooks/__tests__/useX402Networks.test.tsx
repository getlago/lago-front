import { renderHook, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'

import { X402_TEST_CATALOG } from '~/components/settings/integrations/__tests__/x402NetworksFixture'
import { GetX402NetworksDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { useX402Networks } from '../useX402Networks'

const networksMock: TestMocksType = [
  {
    request: { query: GetX402NetworksDocument },
    result: {
      data: {
        x402Networks: X402_TEST_CATALOG.map((network) => ({
          __typename: 'X402Network',
          ...network,
        })),
      },
    },
  },
]

const wrapper = ({ children }: { children: ReactNode }) => (
  <AllTheProviders mocks={networksMock} forceTypenames>
    {children}
  </AllTheProviders>
)

describe('useX402Networks', () => {
  describe('GIVEN the API answers', () => {
    it('THEN returns its networks', async () => {
      const { result } = renderHook(() => useX402Networks(), { wrapper })

      await waitFor(() => {
        expect(result.current.networks.map(({ id }) => id)).toEqual(
          X402_TEST_CATALOG.map(({ id }) => id),
        )
      })
    })
  })

  describe('GIVEN the query is skipped', () => {
    it('THEN returns no network', () => {
      const { result } = renderHook(() => useX402Networks({ skip: true }), { wrapper })

      expect(result.current).toEqual({ networks: [], loading: false })
    })
  })
})
