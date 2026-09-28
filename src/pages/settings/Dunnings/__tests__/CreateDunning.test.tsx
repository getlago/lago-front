import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { FORM_ERRORS_ENUM } from '~/core/constants/form'
import { EXISTING_CODE_ERROR_MESSAGE } from '~/core/form/existingCodeError'
import { CurrencyEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import CreateDunning, {
  CREATE_DUNNING_ADD_THRESHOLD_TEST_ID,
  CREATE_DUNNING_CLOSE_BUTTON_TEST_ID,
  CREATE_DUNNING_DELETE_BCC_EMAILS_TEST_ID,
  CREATE_DUNNING_DELETE_DESCRIPTION_TEST_ID,
  CREATE_DUNNING_DELETE_THRESHOLD_TEST_ID,
  CREATE_DUNNING_SHOW_BCC_EMAILS_TEST_ID,
  CREATE_DUNNING_SHOW_DESCRIPTION_TEST_ID,
  CREATE_DUNNING_SUBMIT_BUTTON_TEST_ID,
} from '../CreateDunning'

// jsdom never lays out the popper's scroll container, so options render only with this.
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: (config: { count: number; estimateSize: (index: number) => number }) => ({
    getVirtualItems: () =>
      Array.from({ length: config.count }, (_, index) => ({
        index,
        key: index,
        size: config.estimateSize(index),
        start: index * config.estimateSize(index),
      })),
    getTotalSize: () => config.count * config.estimateSize(0),
    scrollToIndex: jest.fn(),
    measureElement: jest.fn(),
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockDialogOpen = jest.fn()

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockDialogOpen }),
}))

const mockOpenDefaultCampaignDialog = jest.fn()

jest.mock('~/components/settings/dunnings/DefaultCampaignDialog', () => ({
  useDefaultCampaignDialog: () => ({
    openDefaultCampaignDialog: mockOpenDefaultCampaignDialog,
  }),
}))

jest.mock('~/components/settings/dunnings/PreviewCampaignEmailDrawer', () => ({
  PreviewCampaignEmailDrawer: () => <div data-test="preview-campaign-email-drawer" />,
}))

jest.mock('~/styles/mainObjectsForm', () => ({
  FormLoadingSkeleton: ({ id }: { id: string }) => (
    <div data-test={`form-loading-skeleton-${id}`} />
  ),
}))

const mockUseOrganizationInfos = jest.fn()

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => mockUseOrganizationInfos(),
}))

const mockOnSave = jest.fn()
const mockOnClose = jest.fn()
const mockUseCreateEditDunningCampaign = jest.fn()

jest.mock('~/hooks/useCreateEditDunningCampaign', () => ({
  useCreateEditDunningCampaign: () => mockUseCreateEditDunningCampaign(),
}))

const existingCampaign = {
  name: 'Existing campaign',
  code: 'existing_campaign',
  description: 'Existing description',
  thresholds: [{ amountCents: '150000', currency: CurrencyEnum.Usd }],
  daysBetweenAttempts: 4,
  maxAttempts: 6,
  appliedToOrganization: false,
  bccEmails: ['a@b.com'],
}

const mockHook = (overrides: Record<string, unknown> = {}) => {
  mockUseCreateEditDunningCampaign.mockReturnValue({
    isEdition: false,
    errorCode: undefined,
    loading: false,
    onClose: mockOnClose,
    onSave: mockOnSave,
    campaign: undefined,
    hasPaymentProviderExcludingGoCardless: true,
    ...overrides,
  })
}

const getInput = (name: string) =>
  document.querySelector(`input[name="${name}"]`) as HTMLInputElement

const getTextarea = (name: string) =>
  document.querySelector(`textarea[name="${name}"]`) as HTMLTextAreaElement

const fillRequiredFields = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(getInput('name'), 'Overdue reminder')
  await user.type(getInput('thresholds[0].amountCents'), '100')
  await user.type(getInput('daysBetweenAttempts'), '2')
  await user.type(getInput('maxAttempts'), '3')
}

describe('CreateDunning', () => {
  beforeAll(() => {
    // jsdom does not implement scrollIntoView (used by scrollToFirstInputError on invalid submit)
    Element.prototype.scrollIntoView = jest.fn()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnSave.mockResolvedValue(undefined)
    mockUseOrganizationInfos.mockReturnValue({ organization: { defaultCurrency: 'EUR' } })
    mockHook()
  })

  describe('GIVEN the campaign is being fetched', () => {
    describe('WHEN the form renders', () => {
      it('THEN should display the loading skeleton', () => {
        mockHook({ loading: true })
        render(<CreateDunning />)

        expect(screen.getByTestId('form-loading-skeleton-create-dunning')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the creation form', () => {
    describe('WHEN it renders', () => {
      it.each([
        ['name', 'name'],
        ['code', 'code'],
        ['first threshold currency', 'thresholds[0].currency'],
        ['first threshold amount', 'thresholds[0].amountCents'],
        ['days between attempts', 'daysBetweenAttempts'],
        ['max attempts', 'maxAttempts'],
      ])('THEN should display the %s input', (_label, name) => {
        render(<CreateDunning />)

        expect(getInput(name)).toBeInTheDocument()
      })

      it('THEN should seed the first threshold with the organization currency', () => {
        render(<CreateDunning />)

        expect(getInput('thresholds[0].currency')).toHaveValue(CurrencyEnum.Eur)
      })

      it.each([
        ['description', 'description'],
        ['BCC emails', 'bccEmails'],
      ])('THEN should hide the optional %s field', (_label, name) => {
        render(<CreateDunning />)

        expect(document.querySelector(`[name="${name}"]`)).not.toBeInTheDocument()
      })

      it('THEN should not offer to delete the only threshold', () => {
        render(<CreateDunning />)

        expect(
          screen.queryByTestId(`${CREATE_DUNNING_DELETE_THRESHOLD_TEST_ID}-0`),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN typing a name', () => {
      it('THEN should derive the code from it', async () => {
        const user = userEvent.setup()

        render(<CreateDunning />)

        await user.type(getInput('name'), 'Overdue reminder')

        expect(getInput('code')).toHaveValue('overdue_reminder')
      })
    })

    describe('WHEN revealing the optional description', () => {
      it('THEN should display the description field', async () => {
        const user = userEvent.setup()

        render(<CreateDunning />)

        await user.click(screen.getByTestId(CREATE_DUNNING_SHOW_DESCRIPTION_TEST_ID))

        expect(getTextarea('description')).toBeInTheDocument()
      })
    })

    describe('WHEN revealing the optional BCC emails', () => {
      it('THEN should display the BCC emails field', async () => {
        const user = userEvent.setup()

        render(<CreateDunning />)

        await user.click(screen.getByTestId(CREATE_DUNNING_SHOW_BCC_EMAILS_TEST_ID))

        expect(getInput('bccEmails')).toBeInTheDocument()
      })
    })

    describe('WHEN selecting a currency on an added threshold', () => {
      it('THEN should save both rows with the selected currency', async () => {
        const user = userEvent.setup()

        render(<CreateDunning />)

        await fillRequiredFields(user)
        await user.click(screen.getByTestId(CREATE_DUNNING_ADD_THRESHOLD_TEST_ID))

        const currencyInput = getInput('thresholds[1].currency')

        await user.click(currencyInput)
        await user.type(currencyInput, CurrencyEnum.Cad)
        const optionWrapper = await screen.findByTestId(`combobox-item-${CurrencyEnum.Cad}`)

        await user.click(within(optionWrapper).getByTestId(CurrencyEnum.Cad))

        await user.type(getInput('thresholds[1].amountCents'), '200')
        await user.click(screen.getByTestId(CREATE_DUNNING_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(mockOnSave).toHaveBeenCalledWith(
            expect.objectContaining({
              thresholds: [
                { currency: CurrencyEnum.Eur, amountCents: '100' },
                { currency: CurrencyEnum.Cad, amountCents: '200' },
              ],
            }),
          )
        })
      })
    })

    describe('WHEN adding a threshold', () => {
      it('THEN should display a second row with an empty currency', async () => {
        const user = userEvent.setup()

        render(<CreateDunning />)

        await user.click(screen.getByTestId(CREATE_DUNNING_ADD_THRESHOLD_TEST_ID))

        expect(getInput('thresholds[1].currency')).toHaveValue('')
      })

      it('THEN should remove it again on delete', async () => {
        const user = userEvent.setup()

        render(<CreateDunning />)

        await user.click(screen.getByTestId(CREATE_DUNNING_ADD_THRESHOLD_TEST_ID))
        await user.click(screen.getByTestId(`${CREATE_DUNNING_DELETE_THRESHOLD_TEST_ID}-1`))

        expect(getInput('thresholds[1].currency')).not.toBeInTheDocument()
      })
    })

    describe('WHEN submitting a valid form', () => {
      it('THEN should save the campaign with the entered values', async () => {
        const user = userEvent.setup()

        render(<CreateDunning />)

        await fillRequiredFields(user)
        await user.click(screen.getByTestId(CREATE_DUNNING_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(mockOnSave).toHaveBeenCalledWith({
            name: 'Overdue reminder',
            code: 'overdue_reminder',
            description: '',
            thresholds: [{ currency: CurrencyEnum.Eur, amountCents: '100' }],
            daysBetweenAttempts: '2',
            maxAttempts: '3',
            bccEmails: '',
            appliedToOrganization: false,
          })
        })
      })

      it('THEN should not ask to confirm the default campaign', async () => {
        const user = userEvent.setup()

        render(<CreateDunning />)

        await fillRequiredFields(user)
        await user.click(screen.getByTestId(CREATE_DUNNING_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => expect(mockOnSave).toHaveBeenCalled())
        expect(mockOpenDefaultCampaignDialog).not.toHaveBeenCalled()
      })

      it('THEN should include the revealed optional fields', async () => {
        const user = userEvent.setup()

        render(<CreateDunning />)

        await fillRequiredFields(user)
        await user.click(screen.getByTestId(CREATE_DUNNING_SHOW_DESCRIPTION_TEST_ID))
        await user.type(getTextarea('description'), 'Some description')
        await user.click(screen.getByTestId(CREATE_DUNNING_SHOW_BCC_EMAILS_TEST_ID))
        await user.type(getInput('bccEmails'), 'a@b.com')
        await user.click(screen.getByTestId(CREATE_DUNNING_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(mockOnSave).toHaveBeenCalledWith(
            expect.objectContaining({
              description: 'Some description',
              bccEmails: 'a@b.com',
            }),
          )
        })
      })
    })

    describe('WHEN submitting an incomplete form', () => {
      it('THEN should not save the campaign', async () => {
        const user = userEvent.setup()

        render(<CreateDunning />)

        await user.type(getInput('name'), 'Overdue reminder')
        await user.click(screen.getByTestId(CREATE_DUNNING_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(getInput('daysBetweenAttempts')).toHaveAttribute('aria-invalid', 'true')
        })
        expect(mockOnSave).not.toHaveBeenCalled()
      })
    })

    describe('WHEN a BCC address is malformed', () => {
      it('THEN should not save the campaign', async () => {
        const user = userEvent.setup()

        render(<CreateDunning />)

        await fillRequiredFields(user)
        await user.click(screen.getByTestId(CREATE_DUNNING_SHOW_BCC_EMAILS_TEST_ID))
        await user.type(getInput('bccEmails'), 'not-an-email')
        await user.click(screen.getByTestId(CREATE_DUNNING_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(getInput('bccEmails')).toHaveAttribute('aria-invalid', 'true')
        })
        expect(mockOnSave).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN an existing campaign', () => {
    beforeEach(() => {
      mockHook({ isEdition: true, campaign: existingCampaign })
    })

    describe('WHEN the form renders', () => {
      it.each([
        ['name', 'name', 'Existing campaign'],
        ['code', 'code', 'existing_campaign'],
        ['days between attempts', 'daysBetweenAttempts', '4'],
        ['max attempts', 'maxAttempts', '6'],
        ['BCC emails', 'bccEmails', 'a@b.com'],
      ])('THEN should seed the %s input', (_label, name, expected) => {
        render(<CreateDunning />)

        expect(getInput(name)).toHaveValue(expected)
      })

      it('THEN should seed the description', () => {
        render(<CreateDunning />)

        expect(getTextarea('description')).toHaveValue('Existing description')
      })

      it('THEN should deserialize the threshold amount', () => {
        render(<CreateDunning />)

        expect(getInput('thresholds[0].amountCents')).toHaveValue('1500')
      })

      it('THEN should keep the campaign currency rather than the organization default', () => {
        render(<CreateDunning />)

        expect(getInput('thresholds[0].currency')).toHaveValue(CurrencyEnum.Usd)
      })
    })

    describe('WHEN the organization currency resolves after the form is loaded', () => {
      it('THEN should keep what the user already typed', async () => {
        const user = userEvent.setup()

        mockUseOrganizationInfos.mockReturnValue({ organization: undefined })

        const { rerender } = render(<CreateDunning />)

        await user.clear(getInput('name'))
        await user.type(getInput('name'), 'Renamed campaign')

        mockUseOrganizationInfos.mockReturnValue({ organization: { defaultCurrency: 'EUR' } })
        rerender(<CreateDunning />)

        expect(getInput('name')).toHaveValue('Renamed campaign')
      })
    })

    describe('WHEN typing a new name', () => {
      it('THEN should leave the existing code untouched', async () => {
        const user = userEvent.setup()

        render(<CreateDunning />)

        await user.clear(getInput('name'))
        await user.type(getInput('name'), 'Renamed campaign')

        expect(getInput('code')).toHaveValue('existing_campaign')
      })
    })

    describe('WHEN removing the optional fields', () => {
      it('THEN should clear the description', async () => {
        const user = userEvent.setup()

        render(<CreateDunning />)

        await user.click(screen.getByTestId(CREATE_DUNNING_DELETE_DESCRIPTION_TEST_ID))
        await user.click(screen.getByTestId(CREATE_DUNNING_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({ description: '' }))
        })
      })

      it('THEN should clear the BCC emails', async () => {
        const user = userEvent.setup()

        render(<CreateDunning />)

        await user.click(screen.getByTestId(CREATE_DUNNING_DELETE_BCC_EMAILS_TEST_ID))
        await user.click(screen.getByTestId(CREATE_DUNNING_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({ bccEmails: '' }))
        })
      })
    })
  })

  describe('GIVEN the backend rejected the code as already taken', () => {
    describe('WHEN the form renders', () => {
      it('THEN should surface the error under the code input', async () => {
        mockHook({ errorCode: FORM_ERRORS_ENUM.existingCode })
        render(<CreateDunning />)

        await waitFor(() => {
          expect(getInput('code')).toHaveAttribute('aria-invalid', 'true')
        })
        // `code` is the only field in error here, so the lone `text-field-error` is its own.
        expect(screen.getByTestId('text-field-error')).toHaveTextContent(
          EXISTING_CODE_ERROR_MESSAGE,
        )
      })
    })
  })

  describe('GIVEN a pristine form', () => {
    describe('WHEN closing it', () => {
      it('THEN should leave without confirmation', async () => {
        const user = userEvent.setup()

        render(<CreateDunning />)

        await user.click(screen.getByTestId(CREATE_DUNNING_CLOSE_BUTTON_TEST_ID))

        expect(mockDialogOpen).not.toHaveBeenCalled()
        expect(mockOnClose).toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a dirty form', () => {
    describe('WHEN closing it', () => {
      it('THEN should ask the user to confirm', async () => {
        const user = userEvent.setup()

        render(<CreateDunning />)

        await user.type(getInput('name'), 'Overdue reminder')
        await user.click(screen.getByTestId(CREATE_DUNNING_CLOSE_BUTTON_TEST_ID))

        expect(mockOnClose).not.toHaveBeenCalled()
        expect(mockDialogOpen).toHaveBeenCalledWith(
          expect.objectContaining({ colorVariant: 'danger' }),
        )
      })
    })
  })
})
