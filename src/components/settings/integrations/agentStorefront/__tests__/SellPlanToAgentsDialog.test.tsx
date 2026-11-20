import { AnyFormApi } from '@tanstack/react-form'
import { act, cleanup, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactElement, ReactNode } from 'react'

import { FormDialogProps } from '~/components/dialogs/FormDialog'
import { addToast, onNetworkError } from '~/core/apolloClient'
import { CurrencyEnum, LagoApiError } from '~/generated/graphql'
import { AllTheProviders, render } from '~/test-utils'

import { useSellPlanToAgentsDialog } from '../SellPlanToAgentsDialog'
import { SoldPlan } from '../utils'

const mockFormDialogOpen = jest.fn()
const mockSellPlan = jest.fn()
const mockEditPlan = jest.fn()
const mockGetPlans = jest.fn()

jest.mock('~/components/dialogs/FormDialog', () => ({
  useFormDialog: () => ({ open: mockFormDialogOpen, close: jest.fn() }),
}))

jest.mock('~/components/form/ComboBox/ComboBoxVirtualizedList', () => ({
  GROUP_ITEM_KEY: 'combobox-group-by',
  ComboBoxVirtualizedList: ({ elements }: { elements: ReactNode[] }) => <>{elements}</>,
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({ organization: { defaultCurrency: 'USD' } }),
}))

jest.mock('../useSoldPlans', () => ({
  useSoldPlans: () => ({
    sellPlan: mockSellPlan,
    editPlan: mockEditPlan,
    stopSellingPlan: jest.fn(),
  }),
}))

const PLANS_DATA = {
  plans: {
    collection: [
      { __typename: 'Plan', id: 'p1', name: 'Count', code: 'count', amountCurrency: 'USD' },
      { __typename: 'Plan', id: 'p2', name: 'Tokens', code: 'tokens', amountCurrency: 'JPY' },
      { __typename: 'Plan', id: 'p3', name: 'Sold', code: 'sold', amountCurrency: 'USD' },
    ],
  },
}

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetPlansForAgentStorefrontLazyQuery: () => [
    mockGetPlans,
    { data: PLANS_DATA, loading: false },
  ],
}))

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <AllTheProviders>{children}</AllTheProviders>
)

const MUTATION_SUCCESS = {
  reason: 'mutation',
  result: { data: { updateAgentStorefrontIntegration: { id: 'sf_1' } } },
}

const buildMutationError = (details: Record<string, string[]>): unknown => ({
  reason: 'mutation',
  result: {
    data: { updateAgentStorefrontIntegration: null },
    errors: [
      {
        message: 'Unprocessable Entity',
        extensions: { code: LagoApiError.UnprocessableEntity, details },
      },
    ],
  },
})

const SOLD_PLAN: SoldPlan & { plan: NonNullable<SoldPlan['plan']> } = {
  __typename: 'AgentStorefrontPlan',
  planCode: 'count',
  minimumTopupCents: 500,
  maximumTopupCents: 10000,
  freeCreditsCents: null,
  plan: {
    __typename: 'Plan',
    id: 'p1',
    name: 'Count',
    code: 'count',
    invoiceDisplayName: null,
    amountCurrency: CurrencyEnum.Usd,
  },
}

const openSellDialog = (soldPlanCodes: string[] = ['sold']): FormDialogProps => {
  const { result } = renderHook(() => useSellPlanToAgentsDialog('sf_1'), { wrapper })

  act(() => {
    result.current.openSellPlanDialog(soldPlanCodes)
  })

  return mockFormDialogOpen.mock.calls[0][0]
}

const openEditDialog = (): FormDialogProps => {
  const { result } = renderHook(() => useSellPlanToAgentsDialog('sf_1'), { wrapper })

  act(() => {
    result.current.openEditPlanDialog(SOLD_PLAN)
  })

  return mockFormDialogOpen.mock.calls[0][0]
}

const renderDialog = (payload: FormDialogProps): AnyFormApi => {
  render(
    <>
      {payload.children}
      {payload.mainAction}
    </>,
  )

  return (payload.children as ReactElement<{ form: AnyFormApi }>).props.form
}

const fill = (
  form: AnyFormApi,
  values: { planCode?: string; minimumTopup?: string; maximumTopup?: string },
): void => {
  act(() => {
    Object.entries(values).forEach(([name, value]) => form.setFieldValue(name, value))
  })
}

const submit = async (payload: FormDialogProps): Promise<PromiseSettledResult<unknown>> => {
  let outcome: PromiseSettledResult<unknown> = { status: 'fulfilled', value: undefined }

  await act(async () => {
    ;[outcome] = await Promise.allSettled([payload.form.submit()])
  })

  return outcome
}

describe('useSellPlanToAgentsDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFormDialogOpen.mockResolvedValue({ reason: 'close' })
    mockSellPlan.mockResolvedValue(MUTATION_SUCCESS)
    mockEditPlan.mockResolvedValue(MUTATION_SUCCESS)
  })

  afterEach(cleanup)

  describe('GIVEN the sell dialog is opened', () => {
    describe('WHEN inspecting the open payload', () => {
      it('THEN should keep the dialog open on errors and toast only network failures', () => {
        const payload = openSellDialog()

        expect(payload).toEqual(
          expect.objectContaining({ closeOnError: false, onError: onNetworkError }),
        )
      })
    })

    describe('WHEN opening the plan picker', () => {
      it('THEN should list only the plans not sold yet', async () => {
        const user = userEvent.setup()

        renderDialog(openSellDialog(['sold']))

        await user.click(screen.getByRole('combobox'))

        expect(await screen.findByText('Count · count')).toBeInTheDocument()
        expect(screen.getByText('Tokens · tokens')).toBeInTheDocument()
        expect(screen.queryByText('Sold · sold')).not.toBeInTheDocument()
      })
    })

    describe('WHEN a USD plan is sold with empty free credits', () => {
      it('THEN should send the amounts in cents and null free credits, then toast success', async () => {
        const payload = openSellDialog()
        const form = renderDialog(payload)

        fill(form, { planCode: 'count', minimumTopup: '10', maximumTopup: '50' })

        const outcome = await submit(payload)

        expect(outcome.status).toBe('fulfilled')
        expect(mockSellPlan).toHaveBeenCalledWith('count', {
          minimumTopupCents: 1000,
          maximumTopupCents: 5000,
          freeCreditsCents: null,
        })
        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
        expect(payload.form.didSubmitSucceed?.()).toBe(true)
      })
    })

    describe('WHEN a JPY plan is picked', () => {
      it('THEN should convert the amounts with the plan currency', async () => {
        const user = userEvent.setup()
        const payload = openSellDialog()
        const form = renderDialog(payload)

        await user.click(screen.getByRole('combobox'))
        await user.click(await screen.findByText('Tokens · tokens'))

        expect(form.state.values.amountCurrency).toBe(CurrencyEnum.Jpy)

        fill(form, { minimumTopup: '1000', maximumTopup: '5000' })

        await submit(payload)

        expect(mockSellPlan).toHaveBeenCalledWith(
          'tokens',
          expect.objectContaining({ minimumTopupCents: 1000, maximumTopupCents: 5000 }),
        )
      })
    })

    describe.each([
      ['no plan is picked', { minimumTopup: '10', maximumTopup: '50' }, 'planCode'],
      [
        'the minimum is zero',
        { planCode: 'count', minimumTopup: '0', maximumTopup: '50' },
        'minimumTopup',
      ],
      [
        'the maximum equals the minimum',
        { planCode: 'count', minimumTopup: '50', maximumTopup: '50' },
        'maximumTopup',
      ],
    ])('WHEN %s', (_, values, erroredField) => {
      it(`THEN should flag ${erroredField} and not sell the plan`, async () => {
        const payload = openSellDialog()
        const form = renderDialog(payload)

        fill(form, values)

        await submit(payload)

        expect(mockSellPlan).not.toHaveBeenCalled()
        expect(payload.form.didSubmitSucceed?.()).toBe(false)
        expect(form.getFieldMeta(erroredField)?.errors.length).toBeGreaterThan(0)
      })
    })

    describe('WHEN the API refuses a plan that is not usage-only', () => {
      it('THEN should set the error on the plan field and keep the dialog open', async () => {
        mockSellPlan.mockResolvedValue(
          buildMutationError({ plans: [LagoApiError.PlanNotUsageOnly] }),
        )

        const payload = openSellDialog()
        const form = renderDialog(payload)

        fill(form, { planCode: 'count', minimumTopup: '10', maximumTopup: '50' })

        const outcome = await submit(payload)

        expect(outcome.status).toBe('rejected')
        expect(addToast).not.toHaveBeenCalled()
        expect(form.getFieldMeta('planCode')?.errors.length).toBeGreaterThan(0)
      })
    })

    describe('WHEN another sold plan no longer resolves', () => {
      it('THEN should toast the stale plan instead of blaming the picked one', async () => {
        mockSellPlan.mockResolvedValue(buildMutationError({ plans: [LagoApiError.PlanNotFound] }))

        const payload = openSellDialog()
        const form = renderDialog(payload)

        fill(form, { planCode: 'count', minimumTopup: '10', maximumTopup: '50' })

        const outcome = await submit(payload)

        expect(outcome.status).toBe('rejected')
        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
        expect(form.getFieldMeta('planCode')?.errors ?? []).toHaveLength(0)
      })
    })

    describe('WHEN the API returns an error the dialog does not map', () => {
      it('THEN should keep the dialog open without a field error or a toast of its own', async () => {
        mockSellPlan.mockResolvedValue(buildMutationError({ plans: [LagoApiError.ValueIsInvalid] }))

        const payload = openSellDialog()
        const form = renderDialog(payload)

        fill(form, { planCode: 'count', minimumTopup: '10', maximumTopup: '50' })

        const outcome = await submit(payload)

        expect(outcome.status).toBe('rejected')
        expect(addToast).not.toHaveBeenCalled()
        expect(form.getFieldMeta('planCode')?.errors ?? []).toHaveLength(0)
      })
    })

    describe('WHEN the hook hits a guardrail', () => {
      it('THEN should toast the generic error and keep the dialog open', async () => {
        mockSellPlan.mockResolvedValue({ reason: 'guardrail' })

        const payload = openSellDialog()
        const form = renderDialog(payload)

        fill(form, { planCode: 'count', minimumTopup: '10', maximumTopup: '50' })

        const outcome = await submit(payload)

        expect(outcome.status).toBe('rejected')
        expect(addToast).toHaveBeenCalledTimes(1)
        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
      })
    })

    describe('WHEN the request fails on the network', () => {
      it('THEN should reject with that error and leave the toast to onError', async () => {
        const networkError = new Error('Network error')

        mockSellPlan.mockRejectedValue(networkError)

        const payload = openSellDialog()
        const form = renderDialog(payload)

        fill(form, { planCode: 'count', minimumTopup: '10', maximumTopup: '50' })

        const outcome = await submit(payload)

        expect(outcome).toEqual({ status: 'rejected', reason: networkError })
        expect(addToast).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a sold plan is edited', () => {
    describe('WHEN the dialog opens', () => {
      it('THEN should prefill the amounts and lock the plan field', () => {
        const form = renderDialog(openEditDialog())

        expect(form.state.values).toEqual({
          planCode: 'count',
          amountCurrency: CurrencyEnum.Usd,
          minimumTopup: 5,
          maximumTopup: 100,
          freeCredits: undefined,
        })
        expect(screen.getByRole('combobox')).toBeDisabled()
        expect(mockGetPlans).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the edit is saved', () => {
      it('THEN should edit the same plan code and toast success', async () => {
        const payload = openEditDialog()
        const form = renderDialog(payload)

        fill(form, { maximumTopup: '200' })

        const outcome = await submit(payload)

        expect(outcome.status).toBe('fulfilled')
        expect(mockSellPlan).not.toHaveBeenCalled()
        expect(mockEditPlan).toHaveBeenCalledWith('count', {
          minimumTopupCents: 500,
          maximumTopupCents: 20000,
          freeCreditsCents: null,
        })
        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
      })
    })
  })
})
