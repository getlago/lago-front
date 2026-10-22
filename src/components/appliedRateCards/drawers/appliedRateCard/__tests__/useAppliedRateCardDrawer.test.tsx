import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphQLError } from 'graphql'
import { ReactNode } from 'react'

import { CREATE_MORE_SWITCH_TEST_ID } from '~/components/drawers/createMore/CreateMoreControl'
import { addToast } from '~/core/apolloClient'
import {
  CreateContractAppliedRateCardDocument,
  CreatePlanAppliedRateCardDocument,
  CurrencyEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import { useAppliedRateCardDrawer } from '../useAppliedRateCardDrawer'
import { ALREADY_PRICED_TRANSLATION_KEY } from '../usePricedProductFilterIds'

type CapturedDrawerArgs = {
  title?: ReactNode
  children?: ReactNode
  mainAction?: ReactNode
  secondaryAction?: ReactNode
  form?: { id: string; submit: () => void | Promise<void> }
  closeOnSubmitSuccess?: boolean
}

let lastDrawerArgs: CapturedDrawerArgs | null = null
const mockOpen = jest.fn((args: CapturedDrawerArgs) => {
  lastDrawerArgs = args
})
const mockClose = jest.fn()
const mockNavigate = jest.fn()

// Mock the NiceModal-backed drawer hook so Jest never loads the drawer stack
// (drawerStack.ts uses import.meta and crashes Jest) and we can capture the
// args the hook passes to `open`.
jest.mock('~/components/drawers/useDrawer', () => ({
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useNavigate: () => mockNavigate,
}))

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: () => ({ organizationSlug: 'acme' }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, vars?: Record<string, unknown>) =>
      vars ? [key, ...Object.values(vars)].join('|') : key,
  }),
}))

// Replace the drawer body (drives the real product/rate-card cascade query, out of scope for
// this hook's own submit/create-more/navigate behavior) with a control that seeds the fields
// directly, mirroring useRateCardDrawer.create.test.tsx's own established pattern.
const mockRateCardErrorsProbeTestId = 'rate-card-errors-probe'

jest.mock('../AppliedRateCardDrawerContent', () => ({
  AppliedRateCardDrawerContent: ({
    form,
  }: {
    form: {
      setFieldValue: (name: string, value: unknown) => void
      Subscribe: (props: {
        selector: (state: {
          fieldMeta: Record<string, { errors?: unknown[] } | undefined>
        }) => string
        children: (value: string) => ReactNode
      }) => ReactNode
    }
  }) => (
    <>
      <form.Subscribe
        selector={(state) => JSON.stringify(state.fieldMeta.rateCardId?.errors ?? [])}
      >
        {(errors) => <output data-test={mockRateCardErrorsProbeTestId}>{errors}</output>}
      </form.Subscribe>
      <button
        type="button"
        onClick={() => {
          form.setFieldValue('productId', 'product-1')
          form.setFieldValue('rateCardId', 'standard-card')
        }}
      >
        seed required fields
      </button>
    </>
  ),
}))

const createPlanAppliedRateCardMock = (
  captureInput: (input: Record<string, unknown>) => void,
): MockedResponse => ({
  request: { query: CreatePlanAppliedRateCardDocument },
  variableMatcher: (vars) => {
    captureInput(vars?.input)
    return true
  },
  result: {
    data: {
      createPlanAppliedRateCard: {
        id: 'applied-rc-1',
        rateCard: { id: 'rc-1', name: 'Standard card' },
      },
    },
  },
})

const createContractAppliedRateCardMock = (
  captureInput: (input: Record<string, unknown>) => void,
): MockedResponse => ({
  request: { query: CreateContractAppliedRateCardDocument },
  variableMatcher: (vars) => {
    captureInput(vars?.input)
    return true
  },
  result: {
    data: {
      createContractAppliedRateCard: {
        id: 'applied-rc-2',
        rateCard: { id: 'rc-1', name: 'Standard card' },
      },
    },
  },
})

const alreadyPricedMock = (
  query: typeof CreatePlanAppliedRateCardDocument,
  detailCode: string,
): MockedResponse => ({
  request: { query },
  variableMatcher: () => true,
  result: {
    errors: [
      new GraphQLError('Unprocessable Entity', {
        extensions: {
          code: 'unprocessable_entity',
          status: 422,
          details: { rateCard: [detailCode] },
        },
      }),
    ],
  },
})

const renderDrawerHook = (mocks: MockedResponse[] = []) =>
  renderHook(() => useAppliedRateCardDrawer(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
        defaultOptions={{ mutate: { errorPolicy: 'all' } }}
      >
        {children}
      </MockedProvider>
    ),
  })

const renderDrawerBody = () =>
  render(
    <MockedProvider mocks={[]} addTypename={false}>
      {lastDrawerArgs?.children}
    </MockedProvider>,
  )

const submit = async () => {
  await act(async () => {
    await lastDrawerArgs?.form?.submit()
  })
}

describe('useAppliedRateCardDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    lastDrawerArgs = null
  })

  it.each([
    {
      scenario: 'plan',
      detailCode: 'product_already_priced',
      mock: alreadyPricedMock(CreatePlanAppliedRateCardDocument, 'product_already_priced'),
      props: { context: 'plan' as const, planId: 'plan-1', currency: CurrencyEnum.Usd },
    },
    {
      scenario: 'contract',
      detailCode: 'product_filter_already_priced',
      mock: alreadyPricedMock(
        CreateContractAppliedRateCardDocument,
        'product_filter_already_priced',
      ),
      props: {
        context: 'contract' as const,
        contractId: 'contract-1',
        contractExternalId: 'contract-ext-1',
        currency: CurrencyEnum.Usd,
      },
    },
  ])(
    'GIVEN the $scenario rejects the slice with $detailCode THEN the error lands on the rate card field and the drawer stays open',
    async ({ mock, props }) => {
      const { result } = renderDrawerHook([mock])

      act(() => result.current.openDrawer(props))
      renderDrawerBody()
      await userEvent.click(screen.getByRole('button', { name: 'seed required fields' }))
      await submit()

      await waitFor(() =>
        expect(screen.getByTestId(mockRateCardErrorsProbeTestId)).toHaveTextContent(
          ALREADY_PRICED_TRANSLATION_KEY[props.context],
        ),
      )
      expect(mockClose).not.toHaveBeenCalled()
      expect(addToast).not.toHaveBeenCalled()
    },
  )

  it('GIVEN context plan THEN submitting with an empty local phases array calls createPlanAppliedRateCard with no ratePhases key', async () => {
    let capturedInput: Record<string, unknown> = {}
    const { result } = renderDrawerHook([
      createPlanAppliedRateCardMock((input) => (capturedInput = input)),
    ])

    act(() =>
      result.current.openDrawer({ context: 'plan', planId: 'plan-1', currency: CurrencyEnum.Usd }),
    )
    renderDrawerBody()
    await userEvent.click(screen.getByRole('button', { name: 'seed required fields' }))
    await submit()

    await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))

    expect(capturedInput).toMatchObject({ planId: 'plan-1', rateCardCode: 'standard-card' })
    expect(capturedInput).not.toHaveProperty('ratePhases')
  })

  // Regression: the route's internal contract id was sent, and the backend looks contracts up
  // by external id.
  it('GIVEN context contract THEN submitting sends the contract external id and leaves the billing anchor to the backend', async () => {
    let capturedInput: Record<string, unknown> = {}
    const { result } = renderDrawerHook([
      createContractAppliedRateCardMock((input) => (capturedInput = input)),
    ])

    act(() =>
      result.current.openDrawer({
        context: 'contract',
        contractId: 'contract-1',
        contractExternalId: 'contract-ext-1',
        currency: CurrencyEnum.Usd,
      }),
    )
    renderDrawerBody()

    await userEvent.click(screen.getByRole('button', { name: 'seed required fields' }))
    await submit()

    await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))

    expect(capturedInput).toMatchObject({
      externalId: 'contract-ext-1',
      rateCardCode: 'standard-card',
    })
    expect(capturedInput).not.toHaveProperty('billingAnchorDate')
  })

  it('GIVEN context contract THEN no effective date field renders anywhere in the drawer', async () => {
    const { result } = renderDrawerHook()

    act(() =>
      result.current.openDrawer({
        context: 'contract',
        contractId: 'contract-1',
        contractExternalId: 'contract-ext-1',
        currency: CurrencyEnum.Usd,
      }),
    )
    renderDrawerBody()

    expect(screen.queryByText(/effective date/i)).not.toBeInTheDocument()
  })

  it('GIVEN create-more is enabled THEN on success the form resets and a toast with a link renders instead of navigating', async () => {
    let capturedInput: Record<string, unknown> = {}
    const { result } = renderDrawerHook([
      createPlanAppliedRateCardMock((input) => (capturedInput = input)),
    ])

    act(() =>
      result.current.openDrawer({ context: 'plan', planId: 'plan-1', currency: CurrencyEnum.Usd }),
    )

    render(<>{lastDrawerArgs?.secondaryAction}</>)
    await userEvent.click(screen.getByTestId(CREATE_MORE_SWITCH_TEST_ID))

    renderDrawerBody()
    await userEvent.click(screen.getByRole('button', { name: 'seed required fields' }))
    await submit()

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' })),
    )
    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining(
          'Standard card|/acme/plan-pricing/plan-1/rate-cards/applied-rc-1',
        ),
      }),
    )
    expect(capturedInput).toMatchObject({ rateCardCode: 'standard-card' })
    expect(mockClose).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it("GIVEN create-more is disabled THEN on success the drawer closes and navigates to the new applied rate card's detail route", async () => {
    const { result } = renderDrawerHook([createPlanAppliedRateCardMock(() => undefined)])

    act(() =>
      result.current.openDrawer({ context: 'plan', planId: 'plan-1', currency: CurrencyEnum.Usd }),
    )
    renderDrawerBody()
    await userEvent.click(screen.getByRole('button', { name: 'seed required fields' }))
    await submit()

    await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))

    expect(mockNavigate).toHaveBeenCalledWith('/plan-pricing/plan-1/rate-cards/applied-rc-1')
  })
})
