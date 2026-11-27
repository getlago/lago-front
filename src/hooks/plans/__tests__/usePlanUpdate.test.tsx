import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook, waitFor } from '@testing-library/react'
import { GraphQLError } from 'graphql'
import { ReactNode } from 'react'

import { addToast } from '~/core/apolloClient'
import { LagoApiError, UpdatePlanDocument, UpdatePlanInput } from '~/generated/graphql'

import { usePlanUpdate } from '../usePlanUpdate'

jest.mock('~/core/apolloClient', () => {
  const actual = jest.requireActual('~/core/apolloClient')

  return { ...actual, addToast: jest.fn() }
})

const mockMutationOptions = jest.fn()

jest.mock('~/generated/graphql', () => {
  const actual = jest.requireActual('~/generated/graphql')

  return {
    ...actual,
    useUpdatePlanMutation: (options: unknown) => {
      mockMutationOptions(options)

      return actual.useUpdatePlanMutation(options)
    },
  }
})

const wrapper = (mocks: MockedResponse[]) =>
  function MockedWrapper({ children }: { children: ReactNode }) {
    return (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
        defaultOptions={{ mutate: { errorPolicy: 'all' } }}
      >
        {children}
      </MockedProvider>
    )
  }

const PLAN_ID = 'plan_1'

const mutationInput = { id: PLAN_ID, name: 'X' } as unknown as UpdatePlanInput

const updateMock: MockedResponse = {
  request: {
    query: UpdatePlanDocument,
    variables: { input: mutationInput },
  },
  result: {
    data: { updatePlan: { __typename: 'Plan', id: PLAN_ID, name: 'X' } },
  },
}

describe('usePlanUpdate', () => {
  beforeEach(() => {
    ;(addToast as jest.Mock).mockClear()
  })

  it('fires the success toast and onSuccess callback when the mutation completes', async () => {
    const onSuccess = jest.fn()
    const { result } = renderHook(() => usePlanUpdate({ onSuccess }), {
      wrapper: wrapper([updateMock]),
    })

    await act(async () => {
      await result.current.update({ variables: { input: mutationInput } })
    })

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith({
        severity: 'success',
        translateKey: 'text_625fd165963a7b00c8f598a0',
      })
    })

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ id: PLAN_ID }))
  })

  describe('GIVEN the hook is mounted', () => {
    describe('WHEN inspecting the mutation options', () => {
      it('THEN should silence the plan-sold refusal next to unprocessable entities', () => {
        renderHook(() => usePlanUpdate(), { wrapper: wrapper([]) })

        expect(mockMutationOptions).toHaveBeenCalledWith(
          expect.objectContaining({
            context: {
              silentErrorCodes: [
                LagoApiError.UnprocessableEntity,
                LagoApiError.PlanSoldByAgentStorefront,
              ],
            },
          }),
        )
      })
    })
  })

  describe.each([
    ['an Agentic Storefront sells the plan', LagoApiError.PlanSoldByAgentStorefront, 1],
    ['another error', LagoApiError.UnprocessableEntity, 0],
  ])('GIVEN the API refuses because of %s', (_, code, expectedToasts) => {
    describe('WHEN updating the plan', () => {
      it(`THEN should add ${expectedToasts} danger toast(s) of its own and return the errors`, async () => {
        const errorMock: MockedResponse = {
          request: { query: UpdatePlanDocument, variables: { input: mutationInput } },
          result: { errors: [new GraphQLError('Refused', { extensions: { code } })] },
        }

        const { result } = renderHook(() => usePlanUpdate(), {
          wrapper: wrapper([errorMock]),
        })

        let response: Awaited<ReturnType<typeof result.current.update>> | undefined

        await act(async () => {
          response = await result.current.update({ variables: { input: mutationInput } })
        })

        expect(response?.errors).toHaveLength(1)
        expect((addToast as jest.Mock).mock.calls).toEqual(
          Array(expectedToasts).fill([expect.objectContaining({ severity: 'danger' })]),
        )
      })
    })
  })
})
