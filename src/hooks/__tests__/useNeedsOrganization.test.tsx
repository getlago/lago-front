import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook, RenderHookResult, waitFor } from '@testing-library/react'
import { GraphQLError } from 'graphql'
import { ReactNode } from 'react'

import { envGlobalVar } from '~/core/apolloClient/reactiveVars'
import {
  GetCurrentUserNeedsOrganizationDocument,
  GetCurrentUserNeedsOrganizationQuery,
} from '~/generated/graphql'

import { useNeedsOrganization } from '../useNeedsOrganization'

const ORIGINAL_ENV = envGlobalVar()

const buildData = (needsOrganization: boolean): GetCurrentUserNeedsOrganizationQuery => ({
  currentUser: { id: 'user-1', needsOrganization },
})

const buildMock = (
  answer: Pick<MockedResponse<GetCurrentUserNeedsOrganizationQuery>, 'result' | 'error'>,
): MockedResponse<GetCurrentUserNeedsOrganizationQuery> => ({
  request: { query: GetCurrentUserNeedsOrganizationDocument },
  ...answer,
})

const renderNeedsOrganization = (
  mocks: MockedResponse<GetCurrentUserNeedsOrganizationQuery>[],
): RenderHookResult<ReturnType<typeof useNeedsOrganization>, unknown> =>
  renderHook(() => useNeedsOrganization(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    ),
  })

const setSelfServeEnabled = (selfServeEnabled: boolean): void => {
  envGlobalVar({ ...ORIGINAL_ENV, selfServeEnabled })
}

const flush = async (): Promise<void> => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

describe('useNeedsOrganization', () => {
  afterEach(() => {
    envGlobalVar(ORIGINAL_ENV)
  })

  describe('GIVEN the self-serve flag is off', () => {
    describe('WHEN the hook runs for a user who would need an organization', () => {
      it('THEN should skip the query and report no organization needed', async () => {
        const mockResult = jest.fn(() => ({ data: buildData(true) }))

        setSelfServeEnabled(false)
        const { result } = renderNeedsOrganization([buildMock({ result: mockResult })])

        await flush()

        expect(mockResult).not.toHaveBeenCalled()
        expect(result.current).toEqual({
          needsOrganization: false,
          loading: false,
          hasError: false,
          retry: expect.any(Function),
        })
      })
    })
  })

  describe('GIVEN the self-serve flag is on', () => {
    beforeEach(() => {
      setSelfServeEnabled(true)
    })

    describe('WHEN the query is in flight', () => {
      it('THEN should report loading without needing an organization yet', () => {
        const { result } = renderNeedsOrganization([
          buildMock({ result: { data: buildData(true) } }),
        ])

        expect(result.current).toEqual({
          needsOrganization: false,
          loading: true,
          hasError: false,
          retry: expect.any(Function),
        })
      })
    })

    describe.each([
      ['needs', true],
      ['does not need', false],
    ])('WHEN the user %s an organization', (_, needsOrganization) => {
      it(`THEN should return needsOrganization ${needsOrganization}`, async () => {
        const { result } = renderNeedsOrganization([
          buildMock({ result: { data: buildData(needsOrganization) } }),
        ])

        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current).toEqual({
          needsOrganization,
          loading: false,
          hasError: false,
          retry: expect.any(Function),
        })
      })
    })

    describe.each([
      ['a network error', { error: new Error('Failed to fetch') }],
      ['a GraphQL error', { result: { errors: [new GraphQLError('Internal error')] } }],
    ])('WHEN the query fails with %s', (_, answer) => {
      it('THEN should report the error without needing an organization', async () => {
        const { result } = renderNeedsOrganization([buildMock(answer)])

        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current).toEqual({
          needsOrganization: false,
          loading: false,
          hasError: true,
          retry: expect.any(Function),
        })
      })
    })

    describe('WHEN the caller skips the check', () => {
      it('THEN should send no request and report nothing to wait for', async () => {
        const mockResult = jest.fn(() => ({ data: buildData(true) }))
        const { result } = renderHook(() => useNeedsOrganization({ skip: true }), {
          wrapper: ({ children }: { children: ReactNode }) => (
            <MockedProvider mocks={[buildMock({ result: mockResult })]} addTypename={false}>
              {children}
            </MockedProvider>
          ),
        })

        await flush()

        expect(mockResult).not.toHaveBeenCalled()
        expect(result.current).toEqual({
          needsOrganization: false,
          loading: false,
          hasError: false,
          retry: expect.any(Function),
        })
      })

      it('THEN should report loading from the render that stops skipping until the answer', async () => {
        const { result, rerender } = renderHook(
          ({ skip }: { skip: boolean }) => useNeedsOrganization({ skip }),
          {
            initialProps: { skip: true },
            wrapper: ({ children }: { children: ReactNode }) => (
              <MockedProvider
                mocks={[buildMock({ result: { data: buildData(true) } })]}
                addTypename={false}
              >
                {children}
              </MockedProvider>
            ),
          },
        )

        rerender({ skip: false })

        expect(result.current.loading).toBe(true)

        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.needsOrganization).toBe(true)
      })
    })

    describe('WHEN retrying after the query failed', () => {
      it('THEN should report loading while the retry is in flight', async () => {
        const { result } = renderNeedsOrganization([
          buildMock({ error: new Error('Failed to fetch') }),
          { ...buildMock({ result: { data: buildData(true) } }), delay: 200 },
        ])

        await waitFor(() => expect(result.current.hasError).toBe(true))

        const retry = result.current.retry()

        await waitFor(() => expect(result.current.loading).toBe(true))
        await act(async () => {
          await retry
        })

        expect(result.current.loading).toBe(false)
        expect(result.current.needsOrganization).toBe(true)
      })

      it('THEN should query again and report the new answer', async () => {
        const { result } = renderNeedsOrganization([
          buildMock({ error: new Error('Failed to fetch') }),
          buildMock({ result: { data: buildData(true) } }),
        ])

        await waitFor(() => expect(result.current.hasError).toBe(true))
        await act(async () => {
          await result.current.retry()
        })

        expect(result.current.hasError).toBe(false)
        expect(result.current.needsOrganization).toBe(true)
      })

      it('THEN should keep reporting the error when the retry fails too, without throwing', async () => {
        const { result } = renderNeedsOrganization([
          buildMock({ error: new Error('Failed to fetch') }),
          buildMock({ error: new Error('Failed to fetch') }),
        ])

        await waitFor(() => expect(result.current.hasError).toBe(true))
        await act(async () => {
          await expect(result.current.retry()).resolves.toBeUndefined()
        })

        expect(result.current.hasError).toBe(true)
      })
    })
  })
})
