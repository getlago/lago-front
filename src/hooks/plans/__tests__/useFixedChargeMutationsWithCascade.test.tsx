import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import NiceModal from '@ebay/nice-modal-react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { GraphQLError } from 'graphql'
import { ReactNode } from 'react'

import { FORM_DIALOG_NAME } from '~/components/dialogs/const'
import FormDialog from '~/components/dialogs/FormDialog'
import { LocalFixedChargeInput } from '~/components/plans/types'
import { addToast } from '~/core/apolloClient'
import { FORM_ERRORS_ENUM } from '~/core/constants/form'
import {
  CreateFixedChargeDocument,
  DestroyFixedChargeDocument,
  FixedChargeChargeModelEnum,
  FixedChargeCreateInput,
  LagoApiError,
  PropertiesInput,
  UpdateFixedChargeDocument,
} from '~/generated/graphql'

import { useFixedChargeMutationsWithCascade } from '../useFixedChargeMutationsWithCascade'

NiceModal.register(FORM_DIALOG_NAME, FormDialog)

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const mockCreateOptions = jest.fn()
const mockUpdateOptions = jest.fn()

jest.mock('~/generated/graphql', () => {
  const actual = jest.requireActual('~/generated/graphql')

  return {
    ...actual,
    useCreateFixedChargeMutation: (options: unknown) => {
      mockCreateOptions(options)

      return actual.useCreateFixedChargeMutation(options)
    },
    useUpdateFixedChargeMutation: (options: unknown) => {
      mockUpdateOptions(options)

      return actual.useUpdateFixedChargeMutation(options)
    },
  }
})

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (k: string) => k }),
}))

const PLAN_ID = 'plan_1'

const buildCharge = (overrides: Partial<LocalFixedChargeInput> = {}): LocalFixedChargeInput => ({
  id: undefined,
  addOn: {
    __typename: 'AddOn',
    id: 'addon_1',
    name: 'Onboarding',
    code: 'onboarding',
  } as LocalFixedChargeInput['addOn'],
  applyUnitsImmediately: false,
  chargeModel: FixedChargeChargeModelEnum.Standard,
  invoiceDisplayName: '',
  payInAdvance: false,
  properties: {},
  prorated: false,
  taxes: [],
  units: '1',
  ...overrides,
})

const fixedChargeResult = {
  __typename: 'FixedCharge' as const,
  id: 'fc_1',
  invoiceDisplayName: null,
  chargeModel: FixedChargeChargeModelEnum.Standard,
  units: '1',
  payInAdvance: false,
  prorated: false,
  properties: null,
  addOn: { __typename: 'AddOn' as const, id: 'addon_1', name: 'Onboarding', code: 'onboarding' },
  taxes: [],
}

const wrapper = (mocks: MockedResponse[]) =>
  function MockedWrapper({ children }: { children: ReactNode }) {
    return (
      // errorPolicy 'all' mirrors the app client: GraphQL errors resolve in
      // `result.errors` rather than throwing.
      <MockedProvider
        mocks={mocks}
        addTypename={false}
        defaultOptions={{ mutate: { errorPolicy: 'all' } }}
      >
        <NiceModal.Provider>{children}</NiceModal.Provider>
      </MockedProvider>
    )
  }

describe('useFixedChargeMutationsWithCascade', () => {
  it('createFixedCharge fires direct when hasOverriddenPlans=false', async () => {
    let called = false

    const createMock: MockedResponse = {
      request: { query: CreateFixedChargeDocument },
      variableMatcher: (vars) =>
        vars?.input?.planId === PLAN_ID &&
        vars?.input?.addOnId === 'addon_1' &&
        vars?.input?.cascadeUpdates === false,
      result: () => {
        called = true
        return { data: { createFixedCharge: { ...fixedChargeResult, id: 'fc_1' } } }
      },
    }

    const { result } = renderHook(
      () => useFixedChargeMutationsWithCascade({ planId: PLAN_ID, hasOverriddenPlans: false }),
      { wrapper: wrapper([createMock]) },
    )

    await act(async () => {
      await result.current.handleSaveCharge(buildCharge(), null)
    })

    await waitFor(() => expect(called).toBe(true))
  })

  it('updateFixedCharge fires direct when hasOverriddenPlans=false', async () => {
    let called = false

    const updateMock: MockedResponse = {
      request: { query: UpdateFixedChargeDocument },
      variableMatcher: (vars) =>
        vars?.input?.id === 'fc_99' && vars?.input?.cascadeUpdates === false,
      result: () => {
        called = true
        return {
          data: {
            updateFixedCharge: { ...fixedChargeResult, id: 'fc_99', invoiceDisplayName: 'Edited' },
          },
        }
      },
    }

    const { result } = renderHook(
      () => useFixedChargeMutationsWithCascade({ planId: PLAN_ID, hasOverriddenPlans: false }),
      { wrapper: wrapper([updateMock]) },
    )

    await act(async () => {
      await result.current.handleSaveCharge(buildCharge({ id: 'fc_99' }), 0)
    })

    await waitFor(() => expect(called).toBe(true))
  })

  it('destroyFixedCharge fires direct when hasOverriddenPlans=false', async () => {
    let called = false

    const destroyMock: MockedResponse = {
      request: { query: DestroyFixedChargeDocument },
      variableMatcher: (vars) =>
        vars?.input?.id === 'fc_42' && vars?.input?.cascadeUpdates === false,
      result: () => {
        called = true
        return { data: { destroyFixedCharge: { id: 'fc_42' } } }
      },
    }

    const { result } = renderHook(
      () => useFixedChargeMutationsWithCascade({ planId: PLAN_ID, hasOverriddenPlans: false }),
      { wrapper: wrapper([destroyMock]) },
    )

    await act(async () => {
      await result.current.handleDeleteCharge('fc_42')
    })

    await waitFor(() => expect(called).toBe(true))
  })

  it('sends the charge code and prunes usage-only properties (standard)', async () => {
    let capturedInput: FixedChargeCreateInput | undefined

    const createMock: MockedResponse = {
      request: { query: CreateFixedChargeDocument },
      variableMatcher: (vars) => {
        capturedInput = vars?.input

        return true
      },
      result: { data: { createFixedCharge: { ...fixedChargeResult } } },
    }

    const { result } = renderHook(
      () => useFixedChargeMutationsWithCascade({ planId: PLAN_ID, hasOverriddenPlans: false }),
      { wrapper: wrapper([createMock]) },
    )

    // Stale usage-only fields seeded by getPropertyShape (typed as the broad
    // PropertiesInput, mirroring the form) must not be sent to the BE.
    const propertiesWithUsageFields: PropertiesInput = {
      amount: '10',
      pricingGroupKeys: ['region'],
      packageSize: 10,
      freeUnits: 0,
    }

    await act(async () => {
      await result.current.handleSaveCharge(
        buildCharge({
          code: 'onboarding',
          chargeModel: FixedChargeChargeModelEnum.Standard,
          properties: propertiesWithUsageFields,
        }),
        null,
      )
    })

    await waitFor(() => expect(capturedInput).toBeDefined())
    expect(capturedInput?.code).toBe('onboarding')
    expect(capturedInput?.properties).toStrictEqual({ amount: '10' })
  })

  it('returns the existing-code error when the backend reports a duplicate code', async () => {
    const createMock: MockedResponse = {
      request: { query: CreateFixedChargeDocument },
      variableMatcher: () => true,
      result: {
        errors: [
          new GraphQLError('Value already exists', {
            extensions: { code: 'value_already_exist', details: { code: ['value_already_exist'] } },
          }),
        ],
      },
    }

    const { result } = renderHook(
      () => useFixedChargeMutationsWithCascade({ planId: PLAN_ID, hasOverriddenPlans: false }),
      { wrapper: wrapper([createMock]) },
    )

    let outcome: boolean | FORM_ERRORS_ENUM.existingCode | undefined

    await act(async () => {
      outcome = await result.current.handleSaveCharge(buildCharge({ code: 'dup_code' }), null)
    })

    expect(outcome).toBe(FORM_ERRORS_ENUM.existingCode)
  })

  it('returns false (keeps the drawer open) when the backend reports a non-code error', async () => {
    const createMock: MockedResponse = {
      request: { query: CreateFixedChargeDocument },
      variableMatcher: () => true,
      result: {
        errors: [new GraphQLError('Boom', { extensions: { code: 'internal_error' } })],
      },
    }

    const { result } = renderHook(
      () => useFixedChargeMutationsWithCascade({ planId: PLAN_ID, hasOverriddenPlans: false }),
      { wrapper: wrapper([createMock]) },
    )

    let outcome: boolean | FORM_ERRORS_ENUM.existingCode | undefined

    await act(async () => {
      outcome = await result.current.handleSaveCharge(buildCharge({ code: 'whatever' }), null)
    })

    expect(outcome).toBe(false)
  })

  it('opens cascade dialog when hasOverriddenPlans=true', async () => {
    const { result } = renderHook(
      () => useFixedChargeMutationsWithCascade({ planId: PLAN_ID, hasOverriddenPlans: true }),
      { wrapper: wrapper([]) },
    )

    void result.current.handleSaveCharge(buildCharge(), null)

    // Cascade dialog is rendered via NiceModal portal; its title key should appear.
    await waitFor(() => {
      expect(document.body.textContent).toContain('text_1729604107534r3hsj7i64gp')
    })
  })

  describe('GIVEN an Agentic Storefront sells the plan', () => {
    describe('WHEN the hook is mounted', () => {
      it('THEN should silence the plan-sold refusal on create and update', () => {
        renderHook(
          () => useFixedChargeMutationsWithCascade({ planId: PLAN_ID, hasOverriddenPlans: false }),
          {
            wrapper: wrapper([]),
          },
        )

        const expectedContext = expect.objectContaining({
          context: {
            silentErrorCodes: [
              LagoApiError.UnprocessableEntity,
              LagoApiError.PlanSoldByAgentStorefront,
            ],
          },
        })

        expect(mockCreateOptions).toHaveBeenCalledWith(expectedContext)
        expect(mockUpdateOptions).toHaveBeenCalledWith(expectedContext)
      })
    })

    describe('WHEN the API refuses the save', () => {
      it('THEN should show one danger toast and keep the drawer open', async () => {
        ;(addToast as jest.Mock).mockClear()

        const createMock: MockedResponse = {
          request: { query: CreateFixedChargeDocument },
          variableMatcher: () => true,
          result: {
            errors: [
              new GraphQLError('Refused', {
                extensions: { code: LagoApiError.PlanSoldByAgentStorefront },
              }),
            ],
          },
        }

        const { result } = renderHook(
          () => useFixedChargeMutationsWithCascade({ planId: PLAN_ID, hasOverriddenPlans: false }),
          {
            wrapper: wrapper([createMock]),
          },
        )

        let outcome: boolean | FORM_ERRORS_ENUM.existingCode | undefined

        await act(async () => {
          outcome = await result.current.handleSaveCharge(buildCharge(), null)
        })

        expect(outcome).toBe(false)
        expect((addToast as jest.Mock).mock.calls).toEqual([
          [expect.objectContaining({ severity: 'danger' })],
        ])
      })
    })
  })
})
