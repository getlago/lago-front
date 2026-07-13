import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphQLError } from 'graphql'
import { ReactNode } from 'react'

import { CREATE_MORE_SWITCH_TEST_ID } from '~/components/drawers/createMore/CreateMoreControl'
import { addToast } from '~/core/apolloClient'
import { CreateProductItemDocument, ProductItemTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { useProductItemDrawer } from '../useProductItemDrawer'

type CapturedDrawerArgs = {
  children?: ReactNode
  secondaryAction?: ReactNode
  form?: { submit: () => void | Promise<void> }
}

let lastDrawerArgs: CapturedDrawerArgs | null = null
const mockOpen = jest.fn((args: CapturedDrawerArgs) => {
  lastDrawerArgs = args
})
const mockClose = jest.fn()
const mockNavigate = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useNavigate: () => mockNavigate,
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ organizationSlug: 'acme' }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, vars?: Record<string, unknown>) =>
      vars ? [key, ...Object.values(vars)].join('|') : key,
  }),
}))

// Replace the drawer body with a control that seeds the form fields directly, so
// the create flow (mutation input serialization, create-more, duplicate code) is
// exercised without driving the real comboboxes.
jest.mock('../ProductItemDrawerContent', () => ({
  ProductItemDrawerContent: ({
    form,
  }: {
    form: {
      setFieldValue: (name: string, value: string) => void
    }
  }) => (
    <button
      data-test="seed-fixed-item"
      onClick={() => {
        form.setFieldValue('name', 'Seats')
        form.setFieldValue('code', 'seats')
        form.setFieldValue('itemType', 'fixed')
      }}
    >
      seed
    </button>
  ),
}))

const createProductItemMock = (
  overrides: Partial<MockedResponse['result']> = {},
): MockedResponse => ({
  request: { query: CreateProductItemDocument },
  variableMatcher: (vars) =>
    vars?.input?.name === 'Seats' &&
    vars?.input?.code === 'seats' &&
    vars?.input?.itemType === ProductItemTypeEnum.Fixed &&
    vars?.input?.billableMetricId === undefined &&
    vars?.input?.productId === undefined,
  result: {
    data: {
      createProductItem: {
        id: 'pitem-1',
        name: 'Seats',
        code: 'seats',
        description: null,
        invoiceDisplayName: null,
        itemType: ProductItemTypeEnum.Fixed,
        attachedToPlanOrSubscription: false,
        product: null,
        billableMetric: null,
      },
    },
    ...overrides,
  },
})

const duplicateCodeError = new GraphQLError('Value already exists', {
  extensions: { code: 'value_already_exist', details: { code: ['value_already_exist'] } },
})

const renderDrawerHook = (mocks: MockedResponse[] = []) =>
  renderHook(() => useProductItemDrawer(), {
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

const seedAndSubmit = async () => {
  render(
    <MockedProvider mocks={[]} addTypename={false}>
      {lastDrawerArgs?.children}
    </MockedProvider>,
  )
  await userEvent.click(screen.getByTestId('seed-fixed-item'))
  await act(async () => {
    await lastDrawerArgs?.form?.submit()
  })
}

describe('useProductItemDrawer create flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    lastDrawerArgs = null
  })

  it('creates a fixed item (no metric, no product), closes, navigates and toasts', async () => {
    const { result } = renderDrawerHook([createProductItemMock()])

    act(() => result.current.openDrawer())
    await seedAndSubmit()

    await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))
    expect(mockNavigate).toHaveBeenCalledWith('/product-catalog/product-items/pitem-1/overview')
    expect(addToast).toHaveBeenCalledWith({
      severity: 'success',
      message: 'text_1783980718113u0nftkjemj1',
    })
  })

  it('keeps the drawer open and links the item in the toast when create more is on', async () => {
    const { result } = renderDrawerHook([createProductItemMock()])

    act(() => result.current.openDrawer())

    render(<>{lastDrawerArgs?.secondaryAction}</>)
    await userEvent.click(screen.getByTestId(CREATE_MORE_SWITCH_TEST_ID))

    await seedAndSubmit()

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        severity: 'success',
        message:
          'text_1783980718114wpjktwhgw5c|Seats|/acme/product-catalog/product-items/pitem-1/overview',
      }),
    )
    expect(mockClose).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('keeps the drawer open on a duplicate code without toasting', async () => {
    const { result } = renderDrawerHook([
      createProductItemMock({ data: null, errors: [duplicateCodeError] }),
    ])

    act(() => result.current.openDrawer())
    await seedAndSubmit()

    await waitFor(() => expect(result.current).toBeDefined())
    expect(mockClose).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(addToast).not.toHaveBeenCalled()
  })
})
