import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import NiceModal from '@ebay/nice-modal-react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { GraphQLError } from 'graphql'
import { ReactNode } from 'react'

import { FORM_DIALOG_NAME } from '~/components/dialogs/const'
import FormDialog from '~/components/dialogs/FormDialog'
import { LocalPricingUnitType, LocalUsageChargeInput } from '~/components/plans/types'
import { FORM_ERRORS_ENUM } from '~/core/constants/form'
import {
  ChargeCreateInput,
  ChargeModelEnum,
  ChargeUpdateInput,
  CreateChargeDocument,
  CurrencyEnum,
  DestroyChargeDocument,
  UpdateChargeDocument,
} from '~/generated/graphql'

import { useChargeMutationsWithCascade } from '../useChargeMutationsWithCascade'

NiceModal.register(FORM_DIALOG_NAME, FormDialog)

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (k: string) => k }),
}))

const PLAN_ID = 'plan_1'

const buildCharge = (overrides: Partial<LocalUsageChargeInput> = {}): LocalUsageChargeInput => ({
  id: undefined,
  billableMetric: {
    __typename: 'BillableMetric',
    id: 'bm_1',
    name: 'API calls',
    code: 'api_calls',
    aggregationType: 'count_agg',
    recurring: false,
    filters: [],
  } as never,
  appliedPricingUnit: undefined,
  chargeModel: ChargeModelEnum.Standard,
  invoiceDisplayName: '',
  invoiceable: true,
  minAmountCents: '',
  payInAdvance: false,
  prorated: false,
  properties: { amount: '10' } as never,
  filters: [],
  regroupPaidFees: null,
  taxes: [],
  ...overrides,
})

const chargeResult = {
  __typename: 'Charge' as const,
  id: 'ch_1',
  chargeModel: ChargeModelEnum.Standard,
  invoiceDisplayName: null,
  invoiceable: true,
  payInAdvance: false,
  prorated: false,
  minAmountCents: '0',
  regroupPaidFees: null,
  properties: { amount: '10' },
  filters: [],
  appliedPricingUnit: null,
  taxes: [],
  billableMetric: {
    __typename: 'BillableMetric' as const,
    id: 'bm_1',
    name: 'API calls',
    code: 'api_calls',
    recurring: false,
    filters: [],
  },
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

describe('useChargeMutationsWithCascade', () => {
  it.each([
    { currency: CurrencyEnum.Usd, payInAdvance: false, expectedMinimum: 1234 },
    { currency: CurrencyEnum.Jpy, payInAdvance: false, expectedMinimum: 12 },
    { currency: CurrencyEnum.Usd, payInAdvance: true, expectedMinimum: undefined },
  ])(
    'keeps create and update fields equal for $currency, payInAdvance=$payInAdvance',
    async ({ currency, payInAdvance, expectedMinimum }) => {
      let createInput: ChargeCreateInput | undefined
      let updateInput: ChargeUpdateInput | undefined
      const mocks: MockedResponse[] = [
        {
          request: { query: CreateChargeDocument },
          variableMatcher: (vars) => {
            createInput = vars.input
            return true
          },
          result: { data: { createCharge: chargeResult } },
        },
        {
          request: { query: UpdateChargeDocument },
          variableMatcher: (vars) => {
            updateInput = vars.input
            return true
          },
          result: { data: { updateCharge: chargeResult } },
        },
      ]
      const charge = buildCharge({
        code: 'api_custom',
        invoiceDisplayName: 'Custom usage',
        payInAdvance,
        prorated: true,
        minAmountCents: currency === CurrencyEnum.Jpy ? '12' : '12.34',
        appliedPricingUnit: {
          type: LocalPricingUnitType.Custom,
          code: 'credits',
          shortName: 'cr',
          conversionRate: '2.5',
        },
        taxes: [{ id: 'tax_1', code: 'vat', name: 'VAT', rate: 20 }],
        filters: [
          {
            values: ['{"region":"eu"}'],
            invoiceDisplayName: 'Europe',
            properties: { amount: '15' },
          },
        ],
      })
      const { result } = renderHook(
        () =>
          useChargeMutationsWithCascade({ planId: PLAN_ID, hasOverriddenPlans: false, currency }),
        { wrapper: wrapper(mocks) },
      )

      await act(async () => {
        await result.current.handleSaveCharge(charge, null)
        await result.current.handleSaveCharge({ ...charge, id: 'ch_1' }, 0)
      })

      expect(createInput).toMatchObject({ planId: PLAN_ID, billableMetricId: 'bm_1' })
      if (!createInput) throw new Error('Missing create input')

      const { planId, billableMetricId, ...fields } = createInput

      expect(planId).toBe(PLAN_ID)
      expect(billableMetricId).toBe('bm_1')
      expect(updateInput).toEqual({ id: 'ch_1', ...fields })
      expect(fields).toMatchObject({
        code: 'api_custom',
        chargeModel: ChargeModelEnum.Standard,
        invoiceDisplayName: 'Custom usage',
        invoiceable: true,
        appliedPricingUnit: { code: 'credits', conversionRate: 2.5 },
        minAmountCents: expectedMinimum,
        payInAdvance,
        prorated: true,
        cascadeUpdates: false,
        taxCodes: ['vat'],
        properties: { amount: '10' },
        filters: [
          {
            values: { region: ['eu'] },
            invoiceDisplayName: 'Europe',
            properties: { amount: '15' },
          },
        ],
      })
    },
  )

  it('createCharge fires direct when hasOverriddenPlans=false', async () => {
    let called = false
    const createMock: MockedResponse = {
      request: { query: CreateChargeDocument },
      variableMatcher: (vars) =>
        vars?.input?.planId === PLAN_ID &&
        vars?.input?.billableMetricId === 'bm_1' &&
        vars?.input?.cascadeUpdates === false,
      result: () => {
        called = true
        return { data: { createCharge: chargeResult } }
      },
    }

    const { result } = renderHook(
      () =>
        useChargeMutationsWithCascade({
          planId: PLAN_ID,
          hasOverriddenPlans: false,
          currency: CurrencyEnum.Usd,
        }),
      { wrapper: wrapper([createMock]) },
    )

    await act(async () => {
      await result.current.handleSaveCharge(buildCharge(), null)
    })

    await waitFor(() => expect(called).toBe(true))
  })

  it('updateCharge fires direct when hasOverriddenPlans=false', async () => {
    let called = false
    const updateMock: MockedResponse = {
      request: { query: UpdateChargeDocument },
      variableMatcher: (vars) =>
        vars?.input?.id === 'ch_42' && vars?.input?.cascadeUpdates === false,
      result: () => {
        called = true
        return {
          data: {
            updateCharge: { ...chargeResult, id: 'ch_42', invoiceDisplayName: 'Edited' },
          },
        }
      },
    }

    const { result } = renderHook(
      () =>
        useChargeMutationsWithCascade({
          planId: PLAN_ID,
          hasOverriddenPlans: false,
          currency: CurrencyEnum.Usd,
        }),
      { wrapper: wrapper([updateMock]) },
    )

    await act(async () => {
      await result.current.handleSaveCharge(buildCharge({ id: 'ch_42' }), 0)
    })

    await waitFor(() => expect(called).toBe(true))
  })

  it('updateCharge passes filters through in the input', async () => {
    let receivedFilters: unknown
    const updateMock: MockedResponse = {
      request: { query: UpdateChargeDocument },
      variableMatcher: (vars) => {
        receivedFilters = vars?.input?.filters
        return vars?.input?.id === 'ch_with_filters'
      },
      result: () => ({ data: { updateCharge: { ...chargeResult, id: 'ch_with_filters' } } }),
    }

    const { result } = renderHook(
      () =>
        useChargeMutationsWithCascade({
          planId: PLAN_ID,
          hasOverriddenPlans: false,
          currency: CurrencyEnum.Usd,
        }),
      { wrapper: wrapper([updateMock]) },
    )

    await act(async () => {
      await result.current.handleSaveCharge(
        buildCharge({
          id: 'ch_with_filters',
          filters: [
            {
              invoiceDisplayName: 'EU',
              properties: { amount: '15' } as never,
              values: ['{"region":"eu"}'],
            } as never,
          ],
        }),
        0,
      )
    })

    await waitFor(() => {
      expect(Array.isArray(receivedFilters)).toBe(true)
      expect((receivedFilters as { invoiceDisplayName: string }[]).length).toBe(1)
    })
  })

  it('destroyCharge fires direct when hasOverriddenPlans=false', async () => {
    let called = false
    const destroyMock: MockedResponse = {
      request: { query: DestroyChargeDocument },
      variableMatcher: (vars) =>
        vars?.input?.id === 'ch_42' && vars?.input?.cascadeUpdates === false,
      result: () => {
        called = true
        return { data: { destroyCharge: { id: 'ch_42' } } }
      },
    }

    const { result } = renderHook(
      () =>
        useChargeMutationsWithCascade({
          planId: PLAN_ID,
          hasOverriddenPlans: false,
          currency: CurrencyEnum.Usd,
        }),
      { wrapper: wrapper([destroyMock]) },
    )

    await act(async () => {
      await result.current.handleDeleteCharge('ch_42')
    })

    await waitFor(() => expect(called).toBe(true))
  })

  it('opens cascade dialog on create when hasOverriddenPlans=true', async () => {
    const { result } = renderHook(
      () =>
        useChargeMutationsWithCascade({
          planId: PLAN_ID,
          hasOverriddenPlans: true,
          currency: CurrencyEnum.Usd,
        }),
      { wrapper: wrapper([]) },
    )

    void result.current.handleSaveCharge(buildCharge(), null)

    await waitFor(() => {
      expect(document.body.textContent).toContain('text_1729604107534r3hsj7i64gp')
    })
  })

  it('opens cascade dialog on delete when hasOverriddenPlans=true', async () => {
    const { result } = renderHook(
      () =>
        useChargeMutationsWithCascade({
          planId: PLAN_ID,
          hasOverriddenPlans: true,
          currency: CurrencyEnum.Usd,
        }),
      { wrapper: wrapper([]) },
    )

    void result.current.handleDeleteCharge('ch_to_delete')

    await waitFor(() => {
      expect(document.body.textContent).toContain('text_1729604107534r3hsj7i64gp')
    })
  })

  it('sends the charge code in the create input', async () => {
    let capturedInput: ChargeCreateInput | undefined

    const createMock: MockedResponse = {
      request: { query: CreateChargeDocument },
      variableMatcher: (vars) => {
        capturedInput = vars?.input

        return true
      },
      result: { data: { createCharge: chargeResult } },
    }

    const { result } = renderHook(
      () =>
        useChargeMutationsWithCascade({
          planId: PLAN_ID,
          hasOverriddenPlans: false,
          currency: CurrencyEnum.Usd,
        }),
      { wrapper: wrapper([createMock]) },
    )

    await act(async () => {
      await result.current.handleSaveCharge(buildCharge({ code: 'api_calls' }), null)
    })

    await waitFor(() => expect(capturedInput).toBeDefined())
    expect(capturedInput?.code).toBe('api_calls')
  })

  it('returns the existing-code error when the backend reports a duplicate code', async () => {
    const createMock: MockedResponse = {
      request: { query: CreateChargeDocument },
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
      () =>
        useChargeMutationsWithCascade({
          planId: PLAN_ID,
          hasOverriddenPlans: false,
          currency: CurrencyEnum.Usd,
        }),
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
      request: { query: CreateChargeDocument },
      variableMatcher: () => true,
      result: {
        errors: [new GraphQLError('Boom', { extensions: { code: 'internal_error' } })],
      },
    }

    const { result } = renderHook(
      () =>
        useChargeMutationsWithCascade({
          planId: PLAN_ID,
          hasOverriddenPlans: false,
          currency: CurrencyEnum.Usd,
        }),
      { wrapper: wrapper([createMock]) },
    )

    let outcome: boolean | FORM_ERRORS_ENUM.existingCode | undefined

    await act(async () => {
      outcome = await result.current.handleSaveCharge(buildCharge({ code: 'whatever' }), null)
    })

    expect(outcome).toBe(false)
  })
})
