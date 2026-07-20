import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import NiceModal from '@ebay/nice-modal-react'
import { cleanup, configure, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphQLError } from 'graphql'

import CentralizedDialog from '~/components/dialogs/CentralizedDialog'
import {
  CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID,
  CENTRALIZED_DIALOG_NAME,
} from '~/components/dialogs/const'
import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import {
  DeleteProductItemFilterDocument,
  ProductItemFilterForDeleteProductItemFilterDialogFragment,
} from '~/generated/graphql'

import { useDeleteProductItemFilterDialog } from '../useDeleteProductItemFilterDialog'

configure({ testIdAttribute: 'data-test' })

// Register the dialog against the real NiceModal name: a CentralizedDialog's
// confirm button never renders unless the modal is registered, so mocking
// useCentralizedDialog would only exercise the hook callback, not the actual
// dialog rendering + confirm wiring.
NiceModal.register(CENTRALIZED_DIALOG_NAME, CentralizedDialog)

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/core/apolloClient/evictFromCache', () => ({
  evictFromCache: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, vars?: Record<string, unknown>) =>
      vars ? [key, ...Object.values(vars)].join('|') : key,
  }),
}))

const OPEN_DIALOG_BUTTON_TEST_ID = 'open-delete-product-item-filter-dialog'

const productItemFilterFixture: ProductItemFilterForDeleteProductItemFilterDialogFragment = {
  id: 'pifilter-1',
  name: 'Region',
}

const TestComponent = ({ callback }: { callback?: () => void }) => {
  const { openDeleteProductItemFilterDialog } = useDeleteProductItemFilterDialog()

  return (
    <button
      data-test={OPEN_DIALOG_BUTTON_TEST_ID}
      onClick={() =>
        openDeleteProductItemFilterDialog({
          productItemFilter: productItemFilterFixture,
          callback,
        })
      }
    >
      open
    </button>
  )
}

const renderDialog = (mocks: MockedResponse[] = [], callback?: () => void) =>
  render(
    <MockedProvider
      mocks={mocks}
      addTypename={false}
      defaultOptions={{ mutate: { errorPolicy: 'all' } }}
    >
      <NiceModal.Provider>
        <TestComponent callback={callback} />
      </NiceModal.Provider>
    </MockedProvider>,
  )

const deleteProductItemFilterMock = (
  result: MockedResponse['result'],
  onVariables?: (vars: Record<string, unknown>) => void,
): MockedResponse => ({
  request: { query: DeleteProductItemFilterDocument },
  variableMatcher: (vars) => {
    onVariables?.(vars)
    return vars?.input?.id === 'pifilter-1'
  },
  result,
})

const openDialogAndConfirm = async () => {
  await userEvent.click(screen.getByTestId(OPEN_DIALOG_BUTTON_TEST_ID))
  await userEvent.click(await screen.findByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID))
}

describe('useDeleteProductItemFilterDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  it('opens a danger dialog naming the product item filter with a real confirm button', async () => {
    renderDialog()

    await userEvent.click(screen.getByTestId(OPEN_DIALOG_BUTTON_TEST_ID))

    const confirmButton = await screen.findByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID)

    expect(screen.getByText('text_17845809313441m5o9s4s87a|Region')).toBeInTheDocument()
    expect(screen.getByText('text_1784580931344h5s8k9g2ovw')).toBeInTheDocument()
    expect(confirmButton).toHaveClass('button-danger')
    expect(confirmButton).toHaveTextContent('text_1784580931344s54qxlevbcb')
  })

  it('destroys the filter, evicts it, runs the callback and toasts', async () => {
    const callback = jest.fn()
    const capturedVariables = jest.fn()

    renderDialog(
      [
        deleteProductItemFilterMock(
          { data: { destroyProductItemFilter: { id: 'pifilter-1' } } },
          capturedVariables,
        ),
      ],
      callback,
    )

    await openDialogAndConfirm()

    await waitFor(() => expect(callback).toHaveBeenCalledTimes(1))

    expect(capturedVariables).toHaveBeenCalledWith({ input: { id: 'pifilter-1' } })
    expect(evictFromCache).toHaveBeenCalledWith(expect.anything(), {
      id: 'pifilter-1',
      __typename: 'ProductItemFilter',
      listFieldName: 'productItemFilters',
      listQueryDocument: [],
    })
    expect(addToast).toHaveBeenCalledWith({
      message: 'text_1784581042201wnl8rlwi1nh',
      severity: 'success',
    })
  })

  it('does nothing beyond the mutation when the backend rejects the delete', async () => {
    const callback = jest.fn()

    renderDialog(
      [
        deleteProductItemFilterMock({
          data: null,
          errors: [new GraphQLError('Cannot delete', { extensions: { code: 'forbidden' } })],
        }),
      ],
      callback,
    )

    await openDialogAndConfirm()

    await waitFor(() => {
      expect(screen.queryByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID)).not.toBeInTheDocument()
    })

    expect(evictFromCache).not.toHaveBeenCalled()
    expect(callback).not.toHaveBeenCalled()
    expect(addToast).not.toHaveBeenCalled()
  })
})
