import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphQLError } from 'graphql'
import { ReactElement, ReactNode } from 'react'

import { CREATE_MORE_SWITCH_TEST_ID } from '~/components/drawers/createMore/CreateMoreControl'
import { addToast } from '~/core/apolloClient'
import {
  CreateProductItemFilterDocument,
  ProductItemFilterForDrawerFragment,
  UpdateProductItemFilterDocument,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import { useProductItemFilterDrawer } from '../useProductItemFilterDrawer'

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

// Replace the drawer body with a control that seeds the form fields directly, so
// the create/update flow (mutation input serialization, create-more, duplicate
// code) is exercised without driving the real comboboxes.
jest.mock('../ProductItemFilterDrawerContent', () => ({
  ProductItemFilterDrawerContent: ({
    form,
  }: {
    form: {
      setFieldValue: (name: string, value: unknown) => void
      state: {
        values: {
          name?: string
          code?: string
          productItemId?: string
          values?: Array<{ billableMetricFilterId: string; value: string }>
        }
      }
    }
  }) => (
    <>
      <button
        data-test="seed-filter"
        onClick={() => {
          form.setFieldValue('name', 'Storage EU')
          form.setFieldValue('code', 'storage_eu')
          form.setFieldValue('productItemId', 'pi-1')
          form.setFieldValue('values', [{ billableMetricFilterId: 'bmf-1', value: 'card' }])
        }}
      >
        seed
      </button>
      <span data-test="name-value">{form.state.values.name ?? ''}</span>
      <span data-test="code-value">{form.state.values.code ?? ''}</span>
      <span data-test="product-item-id-value">{form.state.values.productItemId ?? ''}</span>
      <span data-test="values-count">{form.state.values.values?.length ?? 0}</span>
    </>
  ),
}))

const productItemFilterFixture: ProductItemFilterForDrawerFragment = {
  id: 'pif-1',
  name: 'Storage EU',
  code: 'storage_eu',
  description: 'EU storage filter',
  invoiceDisplayName: 'EU storage',
  attachedToPlanOrSubscription: false,
  productItem: { id: 'pi-1', name: 'Storage', code: 'storage' },
  values: [
    {
      id: 'v-1',
      value: 'card',
      billableMetricFilter: { id: 'bmf-1', key: 'payment_method', values: ['card', 'cash'] },
    },
  ],
}

const createProductItemFilterMock = (
  overrides: Partial<MockedResponse['result']> = {},
): MockedResponse => ({
  request: { query: CreateProductItemFilterDocument },
  variableMatcher: (vars) =>
    vars?.input?.name === 'Storage EU' &&
    vars?.input?.code === 'storage_eu' &&
    vars?.input?.productItemId === 'pi-1' &&
    vars?.input?.values?.[0]?.billableMetricFilterId === 'bmf-1' &&
    vars?.input?.values?.[0]?.value === 'card',
  result: {
    data: { createProductItemFilter: { ...productItemFilterFixture } },
    ...overrides,
  },
})

const duplicateCodeError = new GraphQLError('Value already exists', {
  extensions: { code: 'value_already_exist', details: { code: ['value_already_exist'] } },
})

const renderDrawerHook = (mocks: MockedResponse[] = []) =>
  renderHook(() => useProductItemFilterDrawer(), {
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

const seedAndSubmit = async () => {
  renderDrawerBody()
  await userEvent.click(screen.getByTestId('seed-filter'))
  await act(async () => {
    await lastDrawerArgs?.form?.submit()
  })
}

describe('useProductItemFilterDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    lastDrawerArgs = null
  })

  describe('GIVEN create mode (no product item filter argument)', () => {
    it('opens with the create title, form id, create-more control and create label', () => {
      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer())

      expect(mockOpen).toHaveBeenCalledTimes(1)
      expect(lastDrawerArgs?.title).toBe('text_17836220307039rf790f045t')
      expect(lastDrawerArgs?.form?.id).toBe('product-item-filter-drawer-form')
      expect(lastDrawerArgs?.closeOnSubmitSuccess).toBe(false)
      expect(lastDrawerArgs?.secondaryAction).toBeDefined()

      render(<>{lastDrawerArgs?.mainAction}</>)

      expect(screen.getByRole('button', { name: 'text_1742230191029lznwj3y41nb' })).toHaveAttribute(
        'type',
        'submit',
      )
    })

    it('resets the form to defaults on open', () => {
      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer())
      renderDrawerBody()

      expect(screen.getByTestId('name-value')).toHaveTextContent('')
      expect(screen.getByTestId('code-value')).toHaveTextContent('')
      expect(screen.getByTestId('product-item-id-value')).toHaveTextContent('')
      expect(screen.getByTestId('values-count')).toHaveTextContent('0')
    })

    it('creates the filter, closes, navigates to details and toasts', async () => {
      const { result } = renderDrawerHook([createProductItemFilterMock()])

      act(() => result.current.openDrawer())
      await seedAndSubmit()

      await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))
      expect(mockNavigate).toHaveBeenCalledWith(
        '/product-catalog/product-item-filters/pif-1/overview',
      )
      expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
    })

    it('keeps the drawer open and re-seeds when create more is on', async () => {
      const { result } = renderDrawerHook([createProductItemFilterMock()])

      act(() => result.current.openDrawer())

      render(<>{lastDrawerArgs?.secondaryAction}</>)
      await userEvent.click(screen.getByTestId(CREATE_MORE_SWITCH_TEST_ID))

      await seedAndSubmit()

      await waitFor(() => expect(addToast).toHaveBeenCalled())
      expect(mockClose).not.toHaveBeenCalled()
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('keeps the drawer open on a duplicate code without toasting', async () => {
      const { result } = renderDrawerHook([
        createProductItemFilterMock({ data: null, errors: [duplicateCodeError] }),
      ])

      act(() => result.current.openDrawer())
      await seedAndSubmit()

      await waitFor(() => expect(result.current).toBeDefined())
      expect(mockClose).not.toHaveBeenCalled()
      expect(mockNavigate).not.toHaveBeenCalled()
      expect(addToast).not.toHaveBeenCalled()
    })

    it('seeds the values editor with the prefilled product item filters (attachToProductItem)', () => {
      const { result } = renderDrawerHook()

      const billableMetricFilters = [{ id: 'bmf-9', key: 'region', values: ['eu', 'us'] }]

      act(() =>
        result.current.openDrawer({
          attachToProductItem: {
            id: 'pi-9',
            name: 'Storage',
            code: 'storage',
            billableMetricFilters,
          },
        }),
      )

      const contentProps = (lastDrawerArgs?.children as ReactElement)?.props

      expect(contentProps?.productItemSeed).toEqual({ value: 'pi-9', label: 'Storage' })
      expect(contentProps?.seededFilters).toEqual(billableMetricFilters)
    })
  })

  describe('GIVEN edit mode (a product item filter argument)', () => {
    it('opens with the edit title, no create-more control and the save label', () => {
      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer({ productItemFilter: productItemFilterFixture }))

      expect(lastDrawerArgs?.title).toBe('text_1784579021079qarjon667xy')
      expect(lastDrawerArgs?.secondaryAction).toBeUndefined()

      render(<>{lastDrawerArgs?.mainAction}</>)

      expect(screen.getByRole('button', { name: 'text_17295436903260tlyb1gp1i7' })).toHaveAttribute(
        'type',
        'submit',
      )
    })

    it('seeds the form from the product item filter', () => {
      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer({ productItemFilter: productItemFilterFixture }))
      renderDrawerBody()

      expect(screen.getByTestId('name-value')).toHaveTextContent('Storage EU')
      expect(screen.getByTestId('code-value')).toHaveTextContent('storage_eu')
      expect(screen.getByTestId('product-item-id-value')).toHaveTextContent('pi-1')
      expect(screen.getByTestId('values-count')).toHaveTextContent('1')
    })

    it('updates the filter without productItemId, closes and toasts without navigating', async () => {
      const updateVars = jest.fn()
      const { result } = renderDrawerHook([
        {
          request: { query: UpdateProductItemFilterDocument },
          variableMatcher: (vars) => {
            updateVars(vars)
            return vars?.input?.id === 'pif-1'
          },
          result: {
            data: {
              updateProductItemFilter: { ...productItemFilterFixture, name: 'Storage EU 2' },
            },
          },
        },
      ])

      act(() => result.current.openDrawer({ productItemFilter: productItemFilterFixture }))
      await act(async () => {
        await lastDrawerArgs?.form?.submit()
      })

      await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))

      const [{ input }] = updateVars.mock.calls[updateVars.mock.calls.length - 1]

      expect(input).toMatchObject({
        id: 'pif-1',
        name: 'Storage EU',
        code: 'storage_eu',
        values: [{ billableMetricFilterId: 'bmf-1', value: 'card' }],
      })
      // productItemId is create-only and must not be sent on update.
      expect(input).not.toHaveProperty('productItemId')
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })
})
