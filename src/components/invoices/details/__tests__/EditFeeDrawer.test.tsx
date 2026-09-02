import { ApolloError } from '@apollo/client'
import { act, screen } from '@testing-library/react'
import { createRef } from 'react'

import { TExtendedRemainingFee } from '~/core/formats/formatInvoiceItemsMap'
import { CurrencyEnum, LagoApiError } from '~/generated/graphql'
import { render } from '~/test-utils'

import { EditFeeDrawer, EditFeeDrawerRef } from '../EditFeeDrawer'
import { EDIT_FEE_DRAWER_SUBMIT_BUTTON_TEST_ID } from '../invoiceDetailsTestIds'

const GENERIC_ERROR_KEY = 'text_622f7a3dc32ce100c46a5154'
const STALE_FEE_ERROR_KEY = 'text_1788330185449ifi9d6haua6'

type MutationConfig = {
  context?: { silentErrorCodes?: unknown[] }
  onError?: (error: ApolloError) => void
}

// EditFeeDrawer reaches `~/components/drawers/useDrawer` through the invoice table it renders,
// and jest cannot parse the `import.meta` in its drawerStack module.
jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
}))

const mockCreateFee = jest.fn()
let mockMutationConfig: MutationConfig | undefined

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useCreateAdjustedFeeMutation: (config: MutationConfig) => {
    mockMutationConfig = config
    return [mockCreateFee]
  },
  useGetInvoiceDetailsForCreateFeeDrawerQuery: () => ({
    loading: false,
    data: undefined,
    refetch: jest.fn(),
  }),
}))

const mockAddToast = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (...args: unknown[]) => mockAddToast(...args),
}))

const mockRefetchQueries = jest.fn()

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useApolloClient: () => ({ refetchQueries: mockRefetchQueries }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const buildFee = (overrides: Partial<TExtendedRemainingFee> = {}): TExtendedRemainingFee =>
  ({
    id: 'fee-1',
    currency: CurrencyEnum.Usd,
    itemName: 'Premium plan',
    units: 1,
    ...overrides,
  }) as TExtendedRemainingFee

const buildError = (code: LagoApiError, details?: Record<string, string[]>): ApolloError =>
  ({
    graphQLErrors: [{ message: 'error', extensions: details ? { code, details } : { code } }],
  }) as unknown as ApolloError

// The MUI Drawer keeps its children mounted for the length of its close transition, so both
// the "closed" and the "still open" assertions have to look after that window, not before it.
const settleDrawerTransition = async (): Promise<void> => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 400))
  })
}

const renderEditDrawer = (): void => {
  const ref = createRef<EditFeeDrawerRef>()

  render(<EditFeeDrawer ref={ref} />)

  act(() => {
    ref.current?.openDrawer({ mode: 'edit', invoiceId: 'invoice-1', fee: buildFee() })
  })
}

describe('EditFeeDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMutationConfig = undefined
  })

  describe('GIVEN the drawer is open in edit mode', () => {
    describe('WHEN the createAdjustedFee mutation is configured', () => {
      it('THEN should silence not_found so the global error link stops toasting it generically', () => {
        renderEditDrawer()

        expect(mockMutationConfig?.context?.silentErrorCodes).toContain(LagoApiError.NotFound)
      })
    })

    describe('WHEN the mutation fails because the fee no longer exists', () => {
      // Draft fees are recreated with new ids when the draft is refreshed server-side, so a row
      // rendered before that refresh submits a feeId the API 404s on. Before this was handled the
      // user got the generic "an error occurred" toast and a drawer stuck on the stale id.
      const failWithStaleFee = (): void => {
        renderEditDrawer()

        act(() => {
          mockMutationConfig?.onError?.(buildError(LagoApiError.NotFound, { fee: ['not_found'] }))
        })
      }

      it('THEN should show the dedicated stale-fee toast rather than the generic one', () => {
        failWithStaleFee()

        expect(mockAddToast).toHaveBeenCalledWith({
          severity: 'danger',
          translateKey: STALE_FEE_ERROR_KEY,
        })
      })

      it('THEN should close the drawer instead of leaving it on the stale fee', async () => {
        failWithStaleFee()

        await settleDrawerTransition()

        expect(screen.queryByTestId(EDIT_FEE_DRAWER_SUBMIT_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN should refetch the invoice so the rows carry the new fee ids', () => {
        failWithStaleFee()

        expect(mockRefetchQueries).toHaveBeenCalledWith({
          include: ['getInvoiceDetails', 'getInvoiceFees'],
        })
      })
    })

    describe('WHEN the mutation fails with a not_found pointing at another resource', () => {
      const failWithOtherNotFound = (): void => {
        renderEditDrawer()

        act(() => {
          mockMutationConfig?.onError?.(
            buildError(LagoApiError.NotFound, { charge: ['not_found'] }),
          )
        })
      }

      it('THEN should fall back to the generic toast, since not_found is silenced here', () => {
        failWithOtherNotFound()

        expect(mockAddToast).toHaveBeenCalledWith({
          severity: 'danger',
          translateKey: GENERIC_ERROR_KEY,
        })
      })

      it('THEN should keep the drawer open so the user can retry', async () => {
        failWithOtherNotFound()

        await settleDrawerTransition()

        expect(screen.getByTestId(EDIT_FEE_DRAWER_SUBMIT_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should not refetch the invoice', () => {
        failWithOtherNotFound()

        expect(mockRefetchQueries).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the mutation fails with a code the global error link still handles', () => {
      // Only not_found is silenced, so the link still toasts and reports these itself. Toasting
      // here too would queue a second identical toast and lean on addToast's translateKey dedupe.
      it.each([
        ['a validation error', LagoApiError.UnprocessableEntity, undefined],
        [
          'a validation error carrying details',
          LagoApiError.UnprocessableEntity,
          { units: ['value_is_out_of_range'] },
        ],
      ])('THEN should leave the toast to the error link on %s', (_, code, details) => {
        renderEditDrawer()

        act(() => {
          mockMutationConfig?.onError?.(buildError(code, details))
        })

        expect(mockAddToast).not.toHaveBeenCalled()
      })

      it('THEN should keep the drawer open and not refetch', async () => {
        renderEditDrawer()

        act(() => {
          mockMutationConfig?.onError?.(buildError(LagoApiError.UnprocessableEntity))
        })

        await settleDrawerTransition()

        expect(screen.getByTestId(EDIT_FEE_DRAWER_SUBMIT_BUTTON_TEST_ID)).toBeInTheDocument()
        expect(mockRefetchQueries).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the drawer is open in add mode', () => {
    describe('WHEN the mutation fails with a bare not_found', () => {
      // No feeId is submitted in add mode, so a not_found can never be the stale-fee case —
      // claiming "this fee no longer exists" there would be plainly wrong.
      it('THEN should fall back to the generic toast', () => {
        const ref = createRef<EditFeeDrawerRef>()

        render(<EditFeeDrawer ref={ref} />)

        act(() => {
          ref.current?.openDrawer({
            mode: 'add',
            invoiceId: 'invoice-1',
            invoiceSubscriptionId: 'sub-1',
          })
        })

        act(() => {
          mockMutationConfig?.onError?.(buildError(LagoApiError.NotFound))
        })

        expect(mockAddToast).toHaveBeenCalledWith({
          severity: 'danger',
          translateKey: GENERIC_ERROR_KEY,
        })
      })
    })
  })
})
