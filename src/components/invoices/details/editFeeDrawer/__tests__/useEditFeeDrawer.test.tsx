import { ApolloError } from '@apollo/client'
import { act, render } from '@testing-library/react'

import { TExtendedRemainingFee } from '~/core/formats/formatInvoiceItemsMap'
import { AdjustedFeeTypeEnum, CurrencyEnum, LagoApiError } from '~/generated/graphql'

import { EditFeeDrawerContentProps, OpenEditFeeDrawer, OpenEditFeeDrawerParams } from '../types'
import { useEditFeeDrawer } from '../useEditFeeDrawer'
import { EditFeeFormValues } from '../validationSchema'

type MutationConfig = {
  context?: { silentErrorCodes?: unknown[] }
  onError?: (error: ApolloError) => void
  onCompleted?: (data: { createAdjustedFee?: { id: string } | null }) => void
}

type ContentProps = EditFeeDrawerContentProps & {
  form: {
    setFieldValue: (name: keyof EditFeeFormValues, value: unknown) => void
    state: { isDirty: boolean }
  }
}

type OpenedDrawer = {
  form: { id: string; submit: () => Promise<void> }
  closeOnSubmitSuccess: boolean
  cancelOrCloseText: string
  shouldPromptOnClose: () => boolean
  onClose: () => void
  children: { props: ContentProps }
}

const mockOpen = jest.fn()
const mockClose = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

jest.mock('~/components/drawers/useFocusTrap', () => ({
  focusFirstInput: jest.fn(),
}))

// The body owns the invoice query and the whole invoice table; the hook only needs the props
// it hands down, so stub it and read them off the element passed to `drawer.open`.
jest.mock('../EditFeeDrawerContent', () => ({
  EditFeeDrawerContent: () => null,
}))

const mockCreateFee = jest.fn()
let mockMutationConfig: MutationConfig | undefined

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useCreateAdjustedFeeMutation: (config: MutationConfig) => {
    mockMutationConfig = config
    return [mockCreateFee]
  },
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
  useInternationalization: () => ({ translate: (key: string) => key }),
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

let openDrawer: OpenEditFeeDrawer

const HookHost = (): null => {
  openDrawer = useEditFeeDrawer().openDrawer

  return null
}

const openDrawerWith = (params: OpenEditFeeDrawerParams): OpenedDrawer => {
  render(<HookHost />)

  act(() => {
    openDrawer(params)
  })

  return mockOpen.mock.calls.at(-1)?.[0] as OpenedDrawer
}

const lastToastKey = (): string => mockAddToast.mock.calls.at(-1)?.[0]?.translateKey

const EDIT_PARAMS: OpenEditFeeDrawerParams = {
  mode: 'edit',
  invoiceId: 'invoice-1',
  fee: buildFee(),
}

describe('useEditFeeDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMutationConfig = undefined
  })

  describe('GIVEN the drawer is opened', () => {
    describe('WHEN openDrawer is called', () => {
      it('THEN should let the form own the closing so a failed mutation keeps the drawer open', () => {
        const opened = openDrawerWith(EDIT_PARAMS)

        expect(opened.closeOnSubmitSuccess).toBe(false)
      })

      it('THEN should prompt before closing only once the form is dirty', () => {
        const opened = openDrawerWith(EDIT_PARAMS)

        expect(opened.shouldPromptOnClose()).toBe(false)

        act(() => {
          opened.children.props.form.setFieldValue('invoiceDisplayName', 'Edited')
        })

        expect(opened.shouldPromptOnClose()).toBe(true)
      })

      it('THEN should hand the body the fee it was opened on', () => {
        const opened = openDrawerWith(EDIT_PARAMS)

        expect(opened.children.props.fee).toEqual(EDIT_PARAMS.mode === 'edit' && EDIT_PARAMS.fee)
      })

      it('THEN should not flag the body as regenerate mode outside that flow', () => {
        const opened = openDrawerWith(EDIT_PARAMS)

        expect(opened.children.props.isRegenerateMode).toBe(false)
      })
    })

    describe('WHEN it is reopened on another fee', () => {
      // `openDrawer` re-seeds the form: a value left over from the previous fee would be
      // submitted against the new one.
      it('THEN should reset the values seeded by the previous opening', () => {
        const first = openDrawerWith(EDIT_PARAMS)

        act(() => {
          first.children.props.form.setFieldValue('invoiceDisplayName', 'Edited')
        })

        const second = openDrawerWith({
          mode: 'edit',
          invoiceId: 'invoice-1',
          fee: buildFee({ id: 'fee-2', invoiceDisplayName: 'Other name' }),
        })

        expect(second.shouldPromptOnClose()).toBe(false)
      })
    })
  })

  describe('GIVEN the createAdjustedFee mutation is configured', () => {
    describe('WHEN the drawer mounts', () => {
      it('THEN should silence not_found so the global error link stops toasting it generically', () => {
        openDrawerWith(EDIT_PARAMS)

        expect(mockMutationConfig?.context?.silentErrorCodes).toContain(LagoApiError.NotFound)
      })
    })

    describe('WHEN the mutation completes with a created fee', () => {
      it('THEN should close the drawer', () => {
        openDrawerWith(EDIT_PARAMS)

        act(() => {
          mockMutationConfig?.onCompleted?.({ createAdjustedFee: { id: 'adjusted-fee-1' } })
        })

        expect(mockClose).toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the mutation fails because the fee no longer exists', () => {
    // Draft fees are recreated with new ids when the draft is refreshed server-side, so a row
    // rendered before that refresh submits a feeId the API 404s on. Before this was handled the
    // user got the generic "an error occurred" toast and a drawer stuck on the stale id.
    const failWithStaleFee = (): void => {
      openDrawerWith(EDIT_PARAMS)

      act(() => {
        mockMutationConfig?.onError?.(buildError(LagoApiError.NotFound, { fee: ['not_found'] }))
      })
    }

    describe('WHEN the error reaches the drawer', () => {
      it('THEN should show a danger toast dedicated to the stale fee', () => {
        failWithStaleFee()
        const staleKey = lastToastKey()

        jest.clearAllMocks()

        // Add mode cannot be the stale-fee case, so it takes the generic branch: the two keys
        // differing is what proves the dedicated copy is wired.
        openDrawerWith({ mode: 'add', invoiceId: 'invoice-1', invoiceSubscriptionId: 'sub-1' })
        act(() => {
          mockMutationConfig?.onError?.(buildError(LagoApiError.NotFound, { fee: ['not_found'] }))
        })

        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
        expect(staleKey).not.toEqual(lastToastKey())
      })

      it('THEN should close the drawer instead of leaving it on the stale fee', () => {
        failWithStaleFee()

        expect(mockClose).toHaveBeenCalled()
      })

      it('THEN should refetch the invoice so the rows carry the new fee ids', () => {
        failWithStaleFee()

        expect(mockRefetchQueries).toHaveBeenCalledWith({
          include: ['getInvoiceDetails', 'getInvoiceFees'],
        })
      })
    })
  })

  describe('GIVEN the mutation fails with a not_found pointing at another resource', () => {
    const failWithOtherNotFound = (): void => {
      openDrawerWith(EDIT_PARAMS)

      act(() => {
        mockMutationConfig?.onError?.(buildError(LagoApiError.NotFound, { charge: ['not_found'] }))
      })
    }

    describe('WHEN the error reaches the drawer', () => {
      it('THEN should fall back to a danger toast, since not_found is silenced here', () => {
        failWithOtherNotFound()

        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
      })

      it('THEN should keep the drawer open so the user can retry', () => {
        failWithOtherNotFound()

        expect(mockClose).not.toHaveBeenCalled()
      })

      it('THEN should not refetch the invoice', () => {
        failWithOtherNotFound()

        expect(mockRefetchQueries).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the mutation fails with a code the global error link still handles', () => {
    // Only not_found is silenced, so the link still toasts and reports these itself. Toasting
    // here too would queue a second identical toast and lean on addToast's translateKey dedupe.
    describe('WHEN the error reaches the drawer', () => {
      it.each([
        ['a validation error', LagoApiError.UnprocessableEntity, undefined],
        [
          'a validation error carrying details',
          LagoApiError.UnprocessableEntity,
          { units: ['value_is_out_of_range'] },
        ],
      ])('THEN should leave the toast to the error link on %s', (_, code, details) => {
        openDrawerWith(EDIT_PARAMS)

        act(() => {
          mockMutationConfig?.onError?.(buildError(code, details))
        })

        expect(mockAddToast).not.toHaveBeenCalled()
      })

      it('THEN should keep the drawer open and not refetch', () => {
        openDrawerWith(EDIT_PARAMS)

        act(() => {
          mockMutationConfig?.onError?.(buildError(LagoApiError.UnprocessableEntity))
        })

        expect(mockClose).not.toHaveBeenCalled()
        expect(mockRefetchQueries).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the drawer is opened in add mode', () => {
    describe('WHEN the mutation fails with a bare not_found', () => {
      // No feeId is submitted in add mode, so a not_found can never be the stale-fee case —
      // claiming "this fee no longer exists" there would be plainly wrong.
      it('THEN should keep the drawer open rather than treating it as a stale fee', () => {
        openDrawerWith({ mode: 'add', invoiceId: 'invoice-1', invoiceSubscriptionId: 'sub-1' })

        act(() => {
          mockMutationConfig?.onError?.(buildError(LagoApiError.NotFound, { fee: ['not_found'] }))
        })

        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
        expect(mockClose).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a valid amount adjustment is submitted in edit mode', () => {
    describe('WHEN the form is submitted', () => {
      it('THEN should send the fee id with the serialized units and unit amount', async () => {
        const opened = openDrawerWith(EDIT_PARAMS)
        const { form } = opened.children.props

        act(() => {
          form.setFieldValue('adjustmentType', AdjustedFeeTypeEnum.AdjustedAmount)
          form.setFieldValue('units', '3')
          form.setFieldValue('unitPreciseAmount', '12.5')
        })

        await act(async () => {
          await opened.form.submit()
        })

        expect(mockCreateFee).toHaveBeenCalledWith({
          variables: {
            input: expect.objectContaining({
              feeId: 'fee-1',
              invoiceId: 'invoice-1',
              subscriptionId: '',
              units: 3,
              unitPreciseAmount: '12.5',
            }),
          },
        })
      })
    })
  })

  describe('GIVEN a units adjustment is submitted in add mode', () => {
    const submitUnitsAdjustment = async (chargeFilterId?: string): Promise<void> => {
      const opened = openDrawerWith({
        mode: 'add',
        invoiceId: 'invoice-1',
        invoiceSubscriptionId: 'sub-1',
      })
      const { form } = opened.children.props

      act(() => {
        form.setFieldValue('chargeId', 'charge-1')
        form.setFieldValue('adjustmentType', AdjustedFeeTypeEnum.AdjustedUnits)
        form.setFieldValue('units', '7')

        if (chargeFilterId) form.setFieldValue('chargeFilterId', chargeFilterId)
      })

      await act(async () => {
        await opened.form.submit()
      })
    }

    describe('WHEN the form is submitted', () => {
      it('THEN should omit the unit amount and send the subscription it was opened on', async () => {
        await submitUnitsAdjustment()

        expect(mockCreateFee).toHaveBeenCalledWith({
          variables: {
            input: expect.objectContaining({
              chargeId: 'charge-1',
              subscriptionId: 'sub-1',
              units: 7,
              unitPreciseAmount: undefined,
            }),
          },
        })
      })
    })

    describe('WHEN the "all filters" option is selected', () => {
      // The API reads an explicit null as "every filter", where undefined would mean "no filter
      // picked at all".
      it('THEN should send a null charge filter', async () => {
        await submitUnitsAdjustment('__ALL_FILTER_VALUES__')

        expect(mockCreateFee).toHaveBeenCalledWith({
          variables: {
            input: expect.objectContaining({ chargeFilterId: null }),
          },
        })
      })
    })
  })

  describe('GIVEN the drawer is opened in regenerate mode', () => {
    describe('WHEN the form is submitted', () => {
      const subscription = {
        id: 'sub-1',
        plan: {
          id: 'plan-1',
          charges: [{ id: 'charge-1' }],
          fixedCharges: [{ id: 'fixed-charge-1' }],
        },
      }

      const submitRegenerate = async (): Promise<jest.Mock> => {
        const onAdd = jest.fn()
        const opened = openDrawerWith({
          mode: 'regenerate',
          invoiceId: 'invoice-1',
          invoiceSubscriptionId: 'sub-1',
          onAdd,
        })

        act(() => {
          opened.children.props.onSubscriptionLoaded(subscription as any)
          opened.children.props.form.setFieldValue('chargeId', 'charge-1')
          opened.children.props.form.setFieldValue(
            'adjustmentType',
            AdjustedFeeTypeEnum.AdjustedUnits,
          )
          opened.children.props.form.setFieldValue('units', '2')
        })

        await act(async () => {
          await opened.form.submit()
        })

        return onAdd
      }

      it('THEN should hand the locally added fee back with the charge it resolved', async () => {
        const onAdd = await submitRegenerate()

        expect(onAdd).toHaveBeenCalledWith(
          expect.objectContaining({
            chargeId: 'charge-1',
            invoiceSubscriptionId: 'sub-1',
            units: 2,
            charge: subscription.plan.charges[0],
          }),
        )
      })

      it('THEN should never call the mutation, since the invoice is only a preview', async () => {
        await submitRegenerate()

        expect(mockCreateFee).not.toHaveBeenCalled()
      })

      it('THEN should close the drawer', async () => {
        await submitRegenerate()

        expect(mockClose).toHaveBeenCalled()
      })
    })
  })
})
