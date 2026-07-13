import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { addToast } from '~/core/apolloClient'
import {
  ProductItemForDrawerFragment,
  ProductItemTypeEnum,
  UpdateProductItemDocument,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import { useProductItemDrawer } from '../useProductItemDrawer'

type CapturedDrawerArgs = {
  title?: ReactNode
  children?: ReactNode
  mainAction?: ReactNode
  secondaryAction?: ReactNode
  form?: { id: string; submit: () => void | Promise<void> }
  closeOnSubmitSuccess?: boolean
  shouldPromptOnClose?: () => boolean
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

const productItemFixture: ProductItemForDrawerFragment = {
  id: 'pitem-1',
  name: 'Seats',
  code: 'seats',
  description: 'Per seat billing',
  invoiceDisplayName: 'Seat charge',
  itemType: ProductItemTypeEnum.Fixed,
  attachedToPlanOrSubscription: false,
  product: { id: 'prod-1', name: 'Object storage', code: 'object_storage' },
  billableMetric: null,
}

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

const renderDrawerBody = () => {
  if (!lastDrawerArgs?.children) {
    throw new Error('Drawer was not opened')
  }
  return render(
    <MockedProvider mocks={[]} addTypename={false}>
      {lastDrawerArgs.children}
    </MockedProvider>,
  )
}

describe('useProductItemDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    lastDrawerArgs = null
  })

  describe('GIVEN create mode (no product item argument)', () => {
    it('opens with the create title, form id, create-more control and create label', () => {
      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer())

      expect(mockOpen).toHaveBeenCalledTimes(1)
      expect(lastDrawerArgs?.title).toBe('text_1783622030703m9jlurg4jsn')
      expect(lastDrawerArgs?.form?.id).toBe('product-item-drawer-form')
      expect(lastDrawerArgs?.closeOnSubmitSuccess).toBe(false)
      expect(lastDrawerArgs?.secondaryAction).toBeDefined()

      render(<>{lastDrawerArgs?.mainAction}</>)

      expect(screen.getByRole('button', { name: 'text_1783980718113c63agwciyi5' })).toHaveAttribute(
        'type',
        'submit',
      )
    })
  })

  describe('GIVEN edit mode (a product item argument)', () => {
    it('opens with the edit title, no create-more control and the save label', () => {
      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer({ productItem: productItemFixture }))

      expect(lastDrawerArgs?.title).toBe('text_1783980718113x99ykq6zvpi')
      expect(lastDrawerArgs?.secondaryAction).toBeUndefined()

      render(<>{lastDrawerArgs?.mainAction}</>)

      expect(screen.getByRole('button', { name: 'text_17295436903260tlyb1gp1i7' })).toHaveAttribute(
        'type',
        'submit',
      )
    })

    it('prefills the form with the product item values', async () => {
      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer({ productItem: productItemFixture }))
      renderDrawerBody()

      await waitFor(() => expect(screen.getByDisplayValue('Seats')).toBeInTheDocument())
      expect(screen.getByDisplayValue('seats')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Per seat billing')).toBeInTheDocument()
    })

    it('locks the code input when the item is attached to a plan or subscription', async () => {
      const { result } = renderDrawerHook()

      act(() =>
        result.current.openDrawer({
          productItem: { ...productItemFixture, attachedToPlanOrSubscription: true },
        }),
      )
      renderDrawerBody()

      await waitFor(() => expect(screen.getByDisplayValue('seats')).toBeDisabled())
    })

    it('updates the item, closes and toasts without navigating or sending create-only fields', async () => {
      const updateVars = jest.fn()
      const { result } = renderDrawerHook([
        {
          request: { query: UpdateProductItemDocument },
          variableMatcher: (vars) => {
            updateVars(vars)
            return vars?.input?.id === 'pitem-1'
          },
          result: {
            data: {
              updateProductItem: { ...productItemFixture, name: 'Seats EU' },
            },
          },
        },
      ])

      act(() => result.current.openDrawer({ productItem: productItemFixture }))
      renderDrawerBody()

      const nameInput = await screen.findByDisplayValue('Seats')

      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, 'Seats EU')

      await act(async () => {
        await lastDrawerArgs?.form?.submit()
      })

      await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))

      const [{ input }] = updateVars.mock.calls[updateVars.mock.calls.length - 1]

      expect(input).toMatchObject({ id: 'pitem-1', name: 'Seats EU', code: 'seats' })
      // itemType / product / billable metric are create-only and must not be sent.
      expect(input).not.toHaveProperty('itemType')
      expect(input).not.toHaveProperty('productId')
      expect(input).not.toHaveProperty('billableMetricId')
      expect(addToast).toHaveBeenCalledWith({
        severity: 'success',
        message: 'text_1783980718114jtotg0hluib',
      })
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })
})
