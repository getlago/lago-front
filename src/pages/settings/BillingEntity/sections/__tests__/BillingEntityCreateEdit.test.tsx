import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ComboBoxProps } from '~/components/form/ComboBox/types'
import { FORM_ERRORS_ENUM } from '~/core/constants/form'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { render } from '~/test-utils'

import BillingEntityCreateEdit, {
  BILLING_ENTITY_CREATE_EDIT_CANCEL_BUTTON_TEST_ID,
  BILLING_ENTITY_CREATE_EDIT_CLOSE_BUTTON_TEST_ID,
  BILLING_ENTITY_CREATE_EDIT_CODE_INPUT_TEST_ID,
  BILLING_ENTITY_CREATE_EDIT_COUNTRY_INPUT_TEST_ID,
  BILLING_ENTITY_CREATE_EDIT_EINVOICING_SWITCH_TEST_ID,
  BILLING_ENTITY_CREATE_EDIT_FORM_ID,
  BILLING_ENTITY_CREATE_EDIT_NAME_INPUT_TEST_ID,
  BILLING_ENTITY_CREATE_EDIT_SUBMIT_BUTTON_TEST_ID,
} from '../BillingEntityCreateEdit'

const PHONE_PLACEHOLDER = 'Type a phone number'
const SAVE_EDITS_LABEL = 'Save edits'

const mockOnSave = jest.fn()
const mockOnClose = jest.fn()
const mockDialogOpen = jest.fn()

type HookReturn = ReturnType<typeof import('~/hooks/useCreateEditBillingEntity').default>

let mockHookReturn: HookReturn

jest.mock('~/hooks/useCreateEditBillingEntity', () => ({
  __esModule: true,
  default: jest.fn(() => mockHookReturn),
}))

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  ...jest.requireActual('~/components/dialogs/CentralizedDialog'),
  useCentralizedDialog: () => ({ open: mockDialogOpen, close: jest.fn() }),
}))

jest.mock('~/components/form/ComboBox/ComboBox', () => {
  const { ComboBox } = jest.requireActual('~/components/form/ComboBox/ComboBox')

  return { ComboBox: (props: ComboBoxProps) => <ComboBox {...props} virtualized={false} /> }
})

jest.mock('~/core/form/scrollToFirstInputError', () => ({
  scrollToFirstInputError: jest.fn(),
}))

const baseBillingEntity = (overrides = {}) =>
  ({
    id: 'test-id',
    code: 'test-entity',
    name: 'Test Entity',
    email: 'test@example.com',
    phone: '+49 30 123456',
    addressLine1: '1 Test St',
    country: 'DE',
    einvoicing: false,
    ...overrides,
  }) as unknown as HookReturn['billingEntity']

const setHook = (overrides: Partial<HookReturn> = {}) => {
  mockHookReturn = {
    loading: false,
    isEdition: false,
    billingEntity: undefined,
    errorCode: undefined,
    onClose: mockOnClose,
    onSave: mockOnSave,
    ...overrides,
  } as HookReturn
}

const renderPage = async () => {
  await act(async () => {
    render(<BillingEntityCreateEdit />)
  })
}

const inputIn = (testId: string): HTMLInputElement => {
  const container = screen.getByTestId(testId)

  return (container.querySelector('input, textarea') ?? container) as HTMLInputElement
}

const selectCountry = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  await user.type(inputIn(BILLING_ENTITY_CREATE_EDIT_COUNTRY_INPUT_TEST_ID), label)

  const options = await screen.findAllByRole('option')
  const option = options.find((item) => item.textContent === label) as HTMLElement

  await user.click(option)
}

describe('BillingEntityCreateEdit - phone field', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the phone input on the create form', async () => {
    setHook()

    await renderPage()

    expect(screen.getByPlaceholderText(PHONE_PLACEHOLDER)).toBeInTheDocument()
  })

  it('pre-fills the existing phone on the edit form', async () => {
    setHook({ isEdition: true, billingEntity: baseBillingEntity() })

    await renderPage()

    expect(screen.getByPlaceholderText(PHONE_PLACEHOLDER)).toHaveValue('+49 30 123456')
  })

  it('submits the entered phone value', async () => {
    setHook({ isEdition: true, billingEntity: baseBillingEntity({ phone: null }) })

    await renderPage()

    const phoneInput = screen.getByPlaceholderText(PHONE_PLACEHOLDER)

    await userEvent.type(phoneInput, '+33 6 11 22 33 44')
    await userEvent.click(screen.getByRole('button', { name: SAVE_EDITS_LABEL }))

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({ phone: '+33 6 11 22 33 44' }),
      )
    })
  })

  it('submits null when the phone is cleared', async () => {
    setHook({ isEdition: true, billingEntity: baseBillingEntity() })

    await renderPage()

    const phoneInput = screen.getByPlaceholderText(PHONE_PLACEHOLDER)

    await userEvent.clear(phoneInput)
    await userEvent.click(screen.getByRole('button', { name: SAVE_EDITS_LABEL }))

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({ phone: null }))
    })
  })
})

describe('BillingEntityCreateEdit - country field', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('submits null when the country is cleared', async () => {
    setHook({ isEdition: true, billingEntity: baseBillingEntity({ country: 'DE' }) })

    await renderPage()

    await userEvent.clear(inputIn(BILLING_ENTITY_CREATE_EDIT_COUNTRY_INPUT_TEST_ID))
    await userEvent.click(screen.getByRole('button', { name: SAVE_EDITS_LABEL }))

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({ country: null }))
    })
  })
})

describe('BillingEntityCreateEdit - validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN an empty create form', () => {
    describe('WHEN submitting it', () => {
      it('THEN should not call onSave', async () => {
        setHook()

        await renderPage()

        await userEvent.click(screen.getByTestId(BILLING_ENTITY_CREATE_EDIT_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => expect(mockOnSave).not.toHaveBeenCalled())
      })

      it('THEN should scroll to the first errored input', async () => {
        setHook()

        await renderPage()

        await userEvent.click(screen.getByTestId(BILLING_ENTITY_CREATE_EDIT_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() =>
          expect(scrollToFirstInputError).toHaveBeenCalledWith(
            BILLING_ENTITY_CREATE_EDIT_FORM_ID,
            expect.objectContaining({ name: expect.anything(), code: expect.anything() }),
          ),
        )
      })
    })

    describe('WHEN it has not been submitted yet', () => {
      it('THEN should keep the submit button enabled', async () => {
        setHook()

        await renderPage()

        expect(
          screen.getByTestId(BILLING_ENTITY_CREATE_EDIT_SUBMIT_BUTTON_TEST_ID),
        ).not.toBeDisabled()
      })
    })
  })

  describe('GIVEN only a name and a code', () => {
    describe('WHEN submitting', () => {
      it('THEN should call onSave with them', async () => {
        setHook()

        await renderPage()

        await userEvent.type(inputIn(BILLING_ENTITY_CREATE_EDIT_NAME_INPUT_TEST_ID), 'Acme France')
        await userEvent.click(screen.getByTestId(BILLING_ENTITY_CREATE_EDIT_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() =>
          expect(mockOnSave).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'Acme France', code: 'acme_france' }),
          ),
        )
      })
    })
  })
})

describe('BillingEntityCreateEdit - reinitialisation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN an edit form with unsaved changes', () => {
    describe('WHEN a BillingEntity field the form does not hold changes', () => {
      it('THEN should keep the unsaved changes', async () => {
        setHook({ isEdition: true, billingEntity: baseBillingEntity() })

        let rerender: (ui: React.ReactElement) => void = () => undefined

        await act(async () => {
          ;({ rerender } = render(<BillingEntityCreateEdit />))
        })

        await userEvent.type(inputIn(BILLING_ENTITY_CREATE_EDIT_NAME_INPUT_TEST_ID), ' edited')

        setHook({
          isEdition: true,
          billingEntity: baseBillingEntity({ logoUrl: 'https://example.com/new-logo.png' }),
        })

        await act(async () => {
          rerender(<BillingEntityCreateEdit />)
        })

        expect(inputIn(BILLING_ENTITY_CREATE_EDIT_NAME_INPUT_TEST_ID)).toHaveValue(
          'Test Entity edited',
        )
      })
    })

    describe('WHEN a field the form does hold changes', () => {
      it('THEN should reinitialise from the new value', async () => {
        setHook({ isEdition: true, billingEntity: baseBillingEntity() })

        let rerender: (ui: React.ReactElement) => void = () => undefined

        await act(async () => {
          ;({ rerender } = render(<BillingEntityCreateEdit />))
        })

        await userEvent.type(inputIn(BILLING_ENTITY_CREATE_EDIT_NAME_INPUT_TEST_ID), ' edited')

        setHook({ isEdition: true, billingEntity: baseBillingEntity({ name: 'Renamed Upstream' }) })

        await act(async () => {
          rerender(<BillingEntityCreateEdit />)
        })

        expect(inputIn(BILLING_ENTITY_CREATE_EDIT_NAME_INPUT_TEST_ID)).toHaveValue(
          'Renamed Upstream',
        )
      })
    })
  })
})

describe('BillingEntityCreateEdit - address section', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the form renders', () => {
    describe('WHEN looking at the address fields', () => {
      it.each([['addressLine1'], ['addressLine2'], ['zipcode'], ['city'], ['state'], ['country']])(
        'THEN should render the %s input',
        async (name) => {
          setHook()

          await renderPage()

          expect(
            document.querySelector(`#${BILLING_ENTITY_CREATE_EDIT_FORM_ID} input[name="${name}"]`),
          ).toBeInTheDocument()
        },
      )
    })
  })
})

describe('BillingEntityCreateEdit - name and code', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a create form', () => {
    describe('WHEN typing a name', () => {
      it('THEN should derive the code from it', async () => {
        setHook()

        await renderPage()

        await userEvent.type(inputIn(BILLING_ENTITY_CREATE_EDIT_NAME_INPUT_TEST_ID), 'Acme France')

        expect(inputIn(BILLING_ENTITY_CREATE_EDIT_CODE_INPUT_TEST_ID)).toHaveValue('acme_france')
      })
    })

    describe('WHEN the code has already been edited', () => {
      it('THEN should stop deriving it from the name', async () => {
        setHook()

        await renderPage()

        await userEvent.type(inputIn(BILLING_ENTITY_CREATE_EDIT_CODE_INPUT_TEST_ID), 'custom_code')
        await userEvent.tab()
        await userEvent.type(inputIn(BILLING_ENTITY_CREATE_EDIT_NAME_INPUT_TEST_ID), 'Acme France')

        expect(inputIn(BILLING_ENTITY_CREATE_EDIT_CODE_INPUT_TEST_ID)).toHaveValue('custom_code')
      })
    })
  })

  describe('GIVEN an edit form', () => {
    describe('WHEN it renders', () => {
      it('THEN should disable the code input', async () => {
        setHook({ isEdition: true, billingEntity: baseBillingEntity() })

        await renderPage()

        expect(inputIn(BILLING_ENTITY_CREATE_EDIT_CODE_INPUT_TEST_ID)).toBeDisabled()
      })
    })

    describe('WHEN typing a new name', () => {
      it('THEN should keep the existing code', async () => {
        setHook({ isEdition: true, billingEntity: baseBillingEntity() })

        await renderPage()

        await userEvent.type(inputIn(BILLING_ENTITY_CREATE_EDIT_NAME_INPUT_TEST_ID), ' Renamed')

        expect(inputIn(BILLING_ENTITY_CREATE_EDIT_CODE_INPUT_TEST_ID)).toHaveValue('test-entity')
      })
    })
  })
})

describe('BillingEntityCreateEdit - existing code server error', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the backend rejected the code as already taken', () => {
    describe('WHEN the form renders', () => {
      it('THEN should surface the error on the code field', async () => {
        setHook({ errorCode: FORM_ERRORS_ENUM.existingCode })

        await renderPage()

        expect(inputIn(BILLING_ENTITY_CREATE_EDIT_CODE_INPUT_TEST_ID)).toHaveAttribute(
          'aria-invalid',
          'true',
        )
      })

      it('THEN should scroll to the code input', async () => {
        setHook({ errorCode: FORM_ERRORS_ENUM.existingCode })

        await renderPage()

        expect(scrollToFirstInputError).toHaveBeenCalledWith(
          BILLING_ENTITY_CREATE_EDIT_FORM_ID,
          expect.objectContaining({ code: expect.anything() }),
        )
      })
    })
  })

  describe('GIVEN no server error', () => {
    describe('WHEN the form renders', () => {
      it('THEN should not surface any code error', async () => {
        setHook()

        await renderPage()

        expect(inputIn(BILLING_ENTITY_CREATE_EDIT_CODE_INPUT_TEST_ID)).toHaveAttribute(
          'aria-invalid',
          'false',
        )
      })
    })
  })
})

describe('BillingEntityCreateEdit - e-invoicing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe.each([
    { country: 'FR', seeded: false, isSwitchVisible: true, submitted: false },
    { country: 'FR', seeded: true, isSwitchVisible: true, submitted: true },
    { country: 'US', seeded: true, isSwitchVisible: false, submitted: undefined },
  ])(
    'GIVEN an entity in $country seeded with e-invoicing $seeded',
    ({ country, seeded, isSwitchVisible, submitted }) => {
      const seedEntity = () =>
        setHook({
          isEdition: true,
          billingEntity: baseBillingEntity({ country, einvoicing: seeded }),
        })

      describe('WHEN the form renders', () => {
        it(`THEN should ${isSwitchVisible ? 'display' : 'hide'} the e-invoicing switch`, async () => {
          seedEntity()

          await renderPage()

          const isVisible = !!screen.queryByTestId(
            BILLING_ENTITY_CREATE_EDIT_EINVOICING_SWITCH_TEST_ID,
          )

          expect(isVisible).toBe(isSwitchVisible)
        })
      })

      describe('WHEN submitting without touching the switch', () => {
        it(`THEN should submit e-invoicing as ${submitted}`, async () => {
          seedEntity()

          await renderPage()

          await userEvent.click(
            screen.getByTestId(BILLING_ENTITY_CREATE_EDIT_SUBMIT_BUTTON_TEST_ID),
          )

          await waitFor(() =>
            expect(mockOnSave).toHaveBeenCalledWith(
              expect.objectContaining({ einvoicing: submitted }),
            ),
          )
        })
      })
    },
  )

  describe('GIVEN a create form with no country', () => {
    describe('WHEN selecting a country where e-invoicing is mandatory', () => {
      it('THEN should reveal the e-invoicing switch', async () => {
        setHook()

        await renderPage()

        expect(
          screen.queryByTestId(BILLING_ENTITY_CREATE_EDIT_EINVOICING_SWITCH_TEST_ID),
        ).not.toBeInTheDocument()

        const user = userEvent.setup()

        await selectCountry(user, 'France')

        expect(
          screen.getByTestId(BILLING_ENTITY_CREATE_EDIT_EINVOICING_SWITCH_TEST_ID),
        ).toBeInTheDocument()
      })

      it('THEN should seed e-invoicing to false on submit', async () => {
        setHook()

        await renderPage()

        const user = userEvent.setup()

        await user.type(inputIn(BILLING_ENTITY_CREATE_EDIT_NAME_INPUT_TEST_ID), 'Acme France')
        await selectCountry(user, 'France')
        await user.click(screen.getByTestId(BILLING_ENTITY_CREATE_EDIT_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() =>
          expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({ einvoicing: false })),
        )
      })
    })

    describe('WHEN selecting a country where e-invoicing is not mandatory', () => {
      it('THEN should hide the e-invoicing switch again', async () => {
        setHook()

        await renderPage()

        const user = userEvent.setup()

        await selectCountry(user, 'France')

        expect(
          screen.getByTestId(BILLING_ENTITY_CREATE_EDIT_EINVOICING_SWITCH_TEST_ID),
        ).toBeInTheDocument()

        await user.clear(inputIn(BILLING_ENTITY_CREATE_EDIT_COUNTRY_INPUT_TEST_ID))
        await selectCountry(user, 'United States of America')

        expect(
          screen.queryByTestId(BILLING_ENTITY_CREATE_EDIT_EINVOICING_SWITCH_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })
})

describe('BillingEntityCreateEdit - leaving the form', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe.each([
    ['close button', BILLING_ENTITY_CREATE_EDIT_CLOSE_BUTTON_TEST_ID],
    ['cancel button', BILLING_ENTITY_CREATE_EDIT_CANCEL_BUTTON_TEST_ID],
  ])('WHEN clicking the %s', (_, testId) => {
    it('THEN should leave an untouched form without confirmation', async () => {
      setHook()

      await renderPage()

      await userEvent.click(screen.getByTestId(testId))

      expect(mockDialogOpen).not.toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('THEN should ask for confirmation when there are unsaved changes', async () => {
      setHook()

      await renderPage()

      await userEvent.type(inputIn(BILLING_ENTITY_CREATE_EDIT_NAME_INPUT_TEST_ID), 'Acme France')
      await userEvent.click(screen.getByTestId(testId))

      expect(mockDialogOpen).toHaveBeenCalledWith(
        expect.objectContaining({ colorVariant: 'danger' }),
      )
      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })
})
