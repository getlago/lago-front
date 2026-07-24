import { act, cleanup, waitFor } from '@testing-library/react'

import { FormDialogProps } from '~/components/dialogs/FormDialog'
import { CountryCode, LagoApiError } from '~/generated/graphql'
import { render } from '~/test-utils'

import { useAddLagoTaxManagementDialog } from '../AddLagoTaxManagementDialog'

const mockNavigate = jest.fn()
const mockAddToast = jest.fn()
const mockUpdate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(() => mockNavigate),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (...args: unknown[]) => mockAddToast(...args),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/useIntegrations', () => ({
  useIntegrations: () => ({
    hasTaxProvider: false,
    loading: false,
  }),
}))

let capturedOpenArgs: FormDialogProps | null = null

jest.mock('~/components/dialogs/FormDialog', () => ({
  ...jest.requireActual('~/components/dialogs/FormDialog'),
  useFormDialog: () => ({
    open: (args: FormDialogProps) => {
      capturedOpenArgs = args
      return Promise.resolve({ reason: 'close' as const })
    },
    close: jest.fn(),
  }),
}))

const mockBillingEntitiesCollection = [
  {
    id: 'be-1',
    code: 'billing-entity-1',
    name: 'EU Billing Entity',
    country: CountryCode.Fr,
    euTaxManagement: true,
  },
  {
    id: 'be-2',
    code: 'billing-entity-2',
    name: 'UK Billing Entity',
    country: CountryCode.Gb,
    euTaxManagement: false,
  },
]

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetBillingEntitiesQuery: jest.fn(() => ({
    data: {
      billingEntities: {
        collection: mockBillingEntitiesCollection,
      },
    },
    loading: false,
  })),
  useUpdateBillingEntityMutation: jest.fn(() => [mockUpdate]),
}))

const HarnessComponent = ({ isUpdate = true }: { isUpdate?: boolean }) => {
  const { openAddLagoTaxManagementDialog } = useAddLagoTaxManagementDialog()

  return (
    <button
      type="button"
      data-test="open-add-lago-tax-management-dialog"
      onClick={() => openAddLagoTaxManagementDialog({ isUpdate })}
    >
      open
    </button>
  )
}

describe('AddLagoTaxManagementDialog', () => {
  beforeEach(() => {
    capturedOpenArgs = null
    jest.clearAllMocks()
  })

  afterEach(cleanup)

  const openAndSubmit = async (isUpdate = true) => {
    const result: { current: null | ReturnType<typeof render> } = { current: null }

    await act(async () => {
      result.current = render(<HarnessComponent isUpdate={isUpdate} />)
    })

    const trigger = result.current?.getByTestId('open-add-lago-tax-management-dialog')

    if (!trigger) throw new Error('trigger button not found')

    await act(async () => {
      trigger.click()
    })

    if (!capturedOpenArgs) throw new Error('open() was not called')

    await act(async () => {
      // handleSubmit throws to keep the dialog open on mutation errors; swallow that
      // here since the assertions target the side effects that ran before the throw.
      try {
        await capturedOpenArgs?.form.submit()
      } catch {
        /* expected on error paths */
      }
    })
  }

  describe('GIVEN the mutation is configured', () => {
    describe('WHEN useUpdateBillingEntityMutation is called', () => {
      it('THEN should pass silentErrorCodes with UnprocessableEntity', async () => {
        const { useUpdateBillingEntityMutation } = jest.requireMock('~/generated/graphql')

        await act(async () => {
          render(<HarnessComponent isUpdate={true} />)
        })

        expect(useUpdateBillingEntityMutation).toHaveBeenCalledWith(
          expect.objectContaining({
            context: {
              silentErrorCodes: [LagoApiError.UnprocessableEntity],
            },
          }),
        )
      })
    })
  })

  describe('GIVEN the form is submitted and a non-EU eligibility error is returned', () => {
    const nonEuError = {
      errors: [
        {
          message: 'Unprocessable entity',
          extensions: {
            code: 'unprocessable_entity',
            details: { euTaxManagement: ['billing_entity_must_be_in_eu'] },
          },
        },
      ],
    }

    describe('WHEN the submit button is clicked', () => {
      it('THEN should show a danger toast with the EU-specific message', async () => {
        mockUpdate.mockResolvedValue(nonEuError)

        await openAndSubmit()

        await waitFor(() => {
          expect(mockAddToast).toHaveBeenCalledWith(
            expect.objectContaining({
              severity: 'danger',
              message: 'text_1740672955723utwsgy8vzy2',
            }),
          )
        })
      })

      it('THEN should NOT navigate away', async () => {
        mockUpdate.mockResolvedValue(nonEuError)

        await openAndSubmit()

        await waitFor(() => {
          expect(mockAddToast).toHaveBeenCalled()
        })

        expect(mockNavigate).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the form is submitted and a generic error is returned', () => {
    const genericError = {
      errors: [
        {
          message: 'Internal server error',
          extensions: { code: 'internal_error' },
        },
      ],
    }

    describe('WHEN the submit button is clicked', () => {
      it('THEN should NOT show the EU-specific danger toast', async () => {
        mockUpdate.mockResolvedValue(genericError)

        await openAndSubmit()

        await waitFor(() => {
          expect(mockUpdate).toHaveBeenCalled()
        })

        expect(mockAddToast).not.toHaveBeenCalled()
      })

      it('THEN should NOT navigate away', async () => {
        mockUpdate.mockResolvedValue(genericError)

        await openAndSubmit()

        await waitFor(() => {
          expect(mockUpdate).toHaveBeenCalled()
        })

        expect(mockNavigate).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the form is submitted and mutations succeed', () => {
    describe('WHEN the submit button is clicked', () => {
      it('THEN should navigate to the tax management integration route', async () => {
        mockUpdate.mockResolvedValue({
          data: { updateBillingEntity: { id: 'be-1' } },
        })

        await openAndSubmit()

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalled()
        })
      })

      it('THEN should show a success toast', async () => {
        mockUpdate.mockResolvedValue({
          data: { updateBillingEntity: { id: 'be-1' } },
        })

        await openAndSubmit()

        await waitFor(() => {
          expect(mockAddToast).toHaveBeenCalledWith(
            expect.objectContaining({
              severity: 'success',
            }),
          )
        })
      })
    })
  })
})
