import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphQLError } from 'graphql'
import { ReactNode } from 'react'

import { CREATE_MORE_SWITCH_TEST_ID } from '~/components/drawers/createMore/CreateMoreControl'
import { addToast } from '~/core/apolloClient'
import {
  CreateProductDocument,
  ProductForProductDrawerFragment,
  UpdateProductDocument,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import { useProductDrawer } from '../useProductDrawer'

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

// Vars-aware translate: keys resolve to themselves, interpolated values are
// appended so assertions can check what landed in the message.
jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, vars?: Record<string, unknown>) =>
      vars ? [key, ...Object.values(vars)].join('|') : key,
  }),
}))

const productFixture: ProductForProductDrawerFragment = {
  id: 'prod-1',
  name: 'Object storage',
  code: 'object_storage',
  description: 'Base storage product',
  invoiceDisplayName: 'Storage',
  attachedToPlanOrSubscription: false,
}

const createProductMockFactory = (
  overrides: Partial<MockedResponse['result']> = {},
): MockedResponse => ({
  request: { query: CreateProductDocument },
  variableMatcher: (vars) => vars?.input?.name === 'Storage' && vars?.input?.code === 'storage',
  result: {
    data: {
      createProduct: {
        id: 'prod-1',
        name: 'Storage',
        code: 'storage',
        description: null,
        invoiceDisplayName: null,
        attachedToPlanOrSubscription: false,
      },
    },
    ...overrides,
  },
})

const duplicateCodeError = new GraphQLError('Value already exists', {
  extensions: { code: 'value_already_exist', details: { code: ['value_already_exist'] } },
})

const renderDrawerHook = (mocks: MockedResponse[] = []) =>
  renderHook(() => useProductDrawer(), {
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

describe('useProductDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    lastDrawerArgs = null
  })

  describe('GIVEN create mode (no product argument)', () => {
    it('opens with the create title, form id, create-more control and create label', () => {
      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer())

      expect(mockOpen).toHaveBeenCalledTimes(1)
      expect(lastDrawerArgs?.title).toBe('text_1783622030703h5vhmp73muk')
      expect(lastDrawerArgs?.form?.id).toBe('product-drawer-form')
      expect(lastDrawerArgs?.closeOnSubmitSuccess).toBe(false)
      expect(lastDrawerArgs?.secondaryAction).toBeDefined()

      render(<>{lastDrawerArgs?.mainAction}</>)

      expect(screen.getByRole('button', { name: 'text_1783627031283r77bfefzbi7' })).toHaveAttribute(
        'type',
        'submit',
      )
    })

    it('creates the product then closes, navigates to its details and toasts', async () => {
      const { result } = renderDrawerHook([createProductMockFactory()])

      act(() => result.current.openDrawer())
      renderDrawerBody()

      await userEvent.type(screen.getByPlaceholderText('text_17836270312839ylvd3gjr17'), 'Storage')

      await waitFor(() => expect(screen.getByDisplayValue('storage')).toBeInTheDocument())

      await act(async () => {
        await lastDrawerArgs?.form?.submit()
      })

      await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))
      expect(mockNavigate).toHaveBeenCalledWith('/product-catalog/products/prod-1/overview')
      expect(addToast).toHaveBeenCalledWith({
        severity: 'success',
        message: 'text_1783627031283k41jtu4styo',
      })
    })

    it('keeps the drawer open, resets the form and links the product when create more is on', async () => {
      const { result } = renderDrawerHook([createProductMockFactory()])

      act(() => result.current.openDrawer())

      render(<>{lastDrawerArgs?.secondaryAction}</>)
      await userEvent.click(screen.getByTestId(CREATE_MORE_SWITCH_TEST_ID))

      renderDrawerBody()

      const nameInput = screen.getByPlaceholderText('text_17836270312839ylvd3gjr17')

      await userEvent.type(nameInput, 'Storage')
      await waitFor(() => expect(screen.getByDisplayValue('storage')).toBeInTheDocument())

      await act(async () => {
        await lastDrawerArgs?.form?.submit()
      })

      await waitFor(() =>
        expect(addToast).toHaveBeenCalledWith({
          severity: 'success',
          message:
            'text_17836270312838hlfh44gw4i|Storage|/acme/product-catalog/products/prod-1/overview',
        }),
      )
      expect(mockClose).not.toHaveBeenCalled()
      expect(mockNavigate).not.toHaveBeenCalled()

      // The form was reset for the next entry.
      await waitFor(() => expect(screen.queryByDisplayValue('Storage')).not.toBeInTheDocument())
    })

    it('escapes double quotes in the product name interpolated into the linked toast', async () => {
      const { result } = renderDrawerHook([
        {
          request: { query: CreateProductDocument },
          variableMatcher: (vars) => vars?.input?.name === 'Storage "EU"',
          result: {
            data: {
              createProduct: {
                id: 'prod-1',
                name: 'Storage "EU"',
                code: 'storage_eu',
                description: null,
                invoiceDisplayName: null,
                attachedToPlanOrSubscription: false,
              },
            },
          },
        },
      ])

      act(() => result.current.openDrawer())

      render(<>{lastDrawerArgs?.secondaryAction}</>)
      await userEvent.click(screen.getByTestId(CREATE_MORE_SWITCH_TEST_ID))

      renderDrawerBody()

      await userEvent.type(
        screen.getByPlaceholderText('text_17836270312839ylvd3gjr17'),
        'Storage "EU"',
      )

      await act(async () => {
        await lastDrawerArgs?.form?.submit()
      })

      await waitFor(() => {
        const [{ message }] = (addToast as jest.Mock).mock.calls[0]

        expect(message).toContain('Storage &quot;EU&quot;')
      })
    })

    it('surfaces a duplicate code under the code input and keeps the drawer open', async () => {
      const { result } = renderDrawerHook([
        createProductMockFactory({ data: null, errors: [duplicateCodeError] }),
      ])

      act(() => result.current.openDrawer())
      renderDrawerBody()

      await userEvent.type(screen.getByPlaceholderText('text_17836270312839ylvd3gjr17'), 'Storage')
      await waitFor(() => expect(screen.getByDisplayValue('storage')).toBeInTheDocument())

      await act(async () => {
        await lastDrawerArgs?.form?.submit()
      })

      await waitFor(() =>
        expect(screen.getByText('text_632a2d437e341dcc76817556')).toBeInTheDocument(),
      )
      expect(mockClose).not.toHaveBeenCalled()
      expect(addToast).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN edit mode (a product argument)', () => {
    it('opens with the edit title, no create-more control and the save label', () => {
      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer(productFixture))

      expect(lastDrawerArgs?.title).toBe('text_1783627031283awv8tgambrd')
      expect(lastDrawerArgs?.secondaryAction).toBeUndefined()

      render(<>{lastDrawerArgs?.mainAction}</>)

      expect(screen.getByRole('button', { name: 'text_17295436903260tlyb1gp1i7' })).toHaveAttribute(
        'type',
        'submit',
      )
    })

    it('prefills the form with the product values', async () => {
      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer(productFixture))
      renderDrawerBody()

      await waitFor(() => expect(screen.getByDisplayValue('Object storage')).toBeInTheDocument())
      expect(screen.getByDisplayValue('object_storage')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Base storage product')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Storage')).toBeInTheDocument()
    })

    it('locks the code input when the product is attached to a plan or subscription', async () => {
      const { result } = renderDrawerHook()

      act(() =>
        result.current.openDrawer({ ...productFixture, attachedToPlanOrSubscription: true }),
      )
      renderDrawerBody()

      await waitFor(() => expect(screen.getByDisplayValue('object_storage')).toBeDisabled())
    })

    it('keeps the code input editable when the product is not attached', async () => {
      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer(productFixture))
      renderDrawerBody()

      await waitFor(() => expect(screen.getByDisplayValue('object_storage')).not.toBeDisabled())
    })

    it('updates the product, closes the drawer and toasts without navigating', async () => {
      const { result } = renderDrawerHook([
        {
          request: { query: UpdateProductDocument },
          variableMatcher: (vars) =>
            vars?.input?.id === 'prod-1' &&
            vars?.input?.name === 'Object storage EU' &&
            vars?.input?.code === 'object_storage' &&
            vars?.input?.description === 'Base storage product' &&
            vars?.input?.invoiceDisplayName === 'Storage',
          result: {
            data: {
              updateProduct: { ...productFixture, name: 'Object storage EU' },
            },
          },
        },
      ])

      act(() => result.current.openDrawer(productFixture))
      renderDrawerBody()

      const nameInput = await screen.findByDisplayValue('Object storage')

      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, 'Object storage EU')

      await act(async () => {
        await lastDrawerArgs?.form?.submit()
      })

      await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))
      expect(addToast).toHaveBeenCalledWith({
        severity: 'success',
        message: 'text_1783627031283gttzuphzl2o',
      })
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('clears an emptied description by sending null instead of undefined', async () => {
      const updateVars = jest.fn()
      const { result } = renderDrawerHook([
        {
          request: { query: UpdateProductDocument },
          variableMatcher: (vars) => {
            updateVars(vars)
            return vars?.input?.id === 'prod-1'
          },
          result: {
            data: {
              updateProduct: { ...productFixture, description: null },
            },
          },
        },
      ])

      act(() => result.current.openDrawer(productFixture))
      renderDrawerBody()

      const descriptionInput = await screen.findByDisplayValue('Base storage product')

      await userEvent.clear(descriptionInput)

      await act(async () => {
        await lastDrawerArgs?.form?.submit()
      })

      await waitFor(() =>
        expect(updateVars).toHaveBeenCalledWith(
          expect.objectContaining({
            input: expect.objectContaining({ description: null }),
          }),
        ),
      )
    })
  })
})
