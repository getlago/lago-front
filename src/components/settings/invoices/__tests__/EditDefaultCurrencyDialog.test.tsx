import { act, cleanup, screen, waitFor } from '@testing-library/react'
import { createRef } from 'react'

import {
  EDIT_DEFAULT_CURRENCY_DIALOG_CURRENCY_FIELD_TEST_ID,
  EDIT_DEFAULT_CURRENCY_DIALOG_SUBMIT_BUTTON_TEST_ID,
  EditDefaultCurrencyDialog,
  EditDefaultCurrencyDialogRef,
} from '~/components/settings/invoices/EditDefaultCurrencyDialog'
import { addToast } from '~/core/apolloClient'
import { CurrencyEnum, EditBillingEntityDefaultCurrencyForDialogFragment } from '~/generated/graphql'
import { render } from '~/test-utils'

// Capture the onSubmit callback from useAppForm
let capturedOnSubmit:
  | ((args: { value: { defaultCurrency: CurrencyEnum } }) => void | Promise<void>)
  | undefined

const mockUpdateBillingEntity = jest.fn()

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/generated/graphql', () => {
  const actual = jest.requireActual('~/generated/graphql')

  return {
    ...actual,
    useUpdateBillingEntityDefaultCurrencyMutation: (options?: {
      onCompleted?: (data: unknown) => void
    }) => [
      async (variables: unknown) => {
        const result = await mockUpdateBillingEntity(variables)

        if (result?.data) {
          options?.onCompleted?.(result.data)
        }

        return result
      },
    ],
  }
})

// Mock ComboBoxField used via field.ComboBoxField inside AppField children
const MockComboBoxField = ({ dataTest }: { dataTest?: string }) => (
  <div data-test={dataTest} />
)

jest.mock('~/hooks/forms/useAppform', () => {
  const actual = jest.requireActual('~/hooks/forms/useAppform')

  return {
    ...actual,
    useAppForm: jest.fn(
      ({
        onSubmit,
        defaultValues,
      }: {
        onSubmit?: (args: { value: { defaultCurrency: CurrencyEnum } }) => void | Promise<void>
        defaultValues: { defaultCurrency: CurrencyEnum }
      }) => {
        capturedOnSubmit = onSubmit

        const mockStore = {
          subscribe: jest.fn(() => jest.fn()),
          getState: jest.fn(() => ({
            isDirty: false,
            canSubmit: true,
            values: defaultValues,
          })),
        }

        const mockField = {
          name: 'defaultCurrency',
          state: { value: defaultValues.defaultCurrency, meta: { errors: [], errorMap: {} } },
          handleChange: jest.fn(),
          store: {
            subscribe: jest.fn(() => jest.fn()),
            getState: jest.fn(() => ({
              meta: { errors: [], errorMap: {} },
            })),
          },
          ComboBoxField: MockComboBoxField,
        }

        return {
          store: mockStore,
          state: { values: defaultValues, isDirty: false, canSubmit: true },
          reset: jest.fn(),
          handleSubmit: jest.fn(() => onSubmit?.({ value: defaultValues })),
          setFieldValue: jest.fn(),
          AppField: ({
            children,
            name,
          }: {
            children: (field: unknown) => React.ReactNode
            name: string
          }) => (
            <div data-field-name={name}>
              {children({ ...mockField, name })}
            </div>
          ),
          AppForm: ({ children }: { children: React.ReactNode }) => <>{children}</>,
          SubmitButton: ({ children }: { children: React.ReactNode }) => (
            <button type="submit">{children}</button>
          ),
          Subscribe: ({
            children,
            selector,
          }: {
            children: (value: unknown) => React.ReactNode
            selector: (state: { isDirty: boolean; canSubmit: boolean }) => unknown
          }) => {
            const value = selector({ isDirty: false, canSubmit: true })

            return <>{children(value)}</>
          },
        }
      },
    ),
  }
})

// Mock useStore to return reactive values
jest.mock('@tanstack/react-form', () => ({
  ...jest.requireActual('@tanstack/react-form'),
  useStore: jest.fn((store, selector) => {
    const state = store.getState()

    return selector(state)
  }),
  revalidateLogic: jest.fn(() => ({})),
}))

const mockBillingEntity: EditBillingEntityDefaultCurrencyForDialogFragment = {
  __typename: 'BillingEntity',
  id: 'billing-entity-1',
  defaultCurrency: CurrencyEnum.Eur,
}

async function openDialog(billingEntity = mockBillingEntity) {
  const ref = createRef<EditDefaultCurrencyDialogRef>()

  await act(() => render(<EditDefaultCurrencyDialog ref={ref} />))

  await act(() => {
    ref.current?.openDialog({ billingEntity })
  })

  await waitFor(() => {
    expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
  })

  return { ref }
}

describe('EditDefaultCurrencyDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
    capturedOnSubmit = undefined
  })

  describe('GIVEN the dialog is opened', () => {
    describe('WHEN rendered', () => {
      it('THEN should display the currency combobox field', async () => {
        await openDialog()

        expect(
          screen.getByTestId(EDIT_DEFAULT_CURRENCY_DIALOG_CURRENCY_FIELD_TEST_ID),
        ).toBeInTheDocument()
      })

      it('THEN should display the save button', async () => {
        await openDialog()

        expect(
          screen.getByTestId(EDIT_DEFAULT_CURRENCY_DIALOG_SUBMIT_BUTTON_TEST_ID),
        ).toBeInTheDocument()
      })
    })

    describe('WHEN user submits with a different currency', () => {
      it('THEN should call the mutation with the correct billing entity id and currency', async () => {
        await openDialog()

        await act(async () => {
          await capturedOnSubmit?.({ value: { defaultCurrency: CurrencyEnum.Usd } })
        })

        await waitFor(() => {
          expect(mockUpdateBillingEntity).toHaveBeenCalledWith({
            variables: {
              input: {
                id: 'billing-entity-1',
                defaultCurrency: CurrencyEnum.Usd,
              },
            },
          })
        })
      })

      it('THEN should show a success toast when the mutation succeeds', async () => {
        mockUpdateBillingEntity.mockResolvedValue({
          data: {
            updateBillingEntity: {
              id: 'billing-entity-1',
              defaultCurrency: CurrencyEnum.Usd,
              __typename: 'BillingEntity',
            },
          },
        })

        await openDialog()

        await act(async () => {
          await capturedOnSubmit?.({ value: { defaultCurrency: CurrencyEnum.Usd } })
        })

        await waitFor(() => {
          expect(addToast).toHaveBeenCalledWith(
            expect.objectContaining({ severity: 'success' }),
          )
        })
      })
    })
  })

  describe('GIVEN the dialog is opened with a specific billing entity', () => {
    describe('WHEN the onSubmit is triggered', () => {
      it('THEN should use the billing entity id from localData', async () => {
        const customBillingEntity = {
          ...mockBillingEntity,
          id: 'custom-billing-entity-id',
          defaultCurrency: CurrencyEnum.Gbp,
        }

        await openDialog(customBillingEntity)

        await act(async () => {
          await capturedOnSubmit?.({ value: { defaultCurrency: CurrencyEnum.Usd } })
        })

        await waitFor(() => {
          expect(mockUpdateBillingEntity).toHaveBeenCalledWith({
            variables: {
              input: {
                id: 'custom-billing-entity-id',
                defaultCurrency: CurrencyEnum.Usd,
              },
            },
          })
        })
      })
    })
  })
})
