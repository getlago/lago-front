import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { print } from 'graphql'

import { BILLING_ENTITY_FORM_PICKER_DATA_TEST } from '~/components/billingEntity/BillingEntityFormPicker'
import {
  CurrencyEnum,
  OrderTypeEnum,
  QuoteDetailItemFragment,
  StatusEnum,
  UpdateQuoteVersionDocument,
} from '~/generated/graphql'
import { BILLING_ENTITY_INHERIT_CODE } from '~/hooks/useBillingEntitiesOptions'
import { render } from '~/test-utils'

import EditQuoteAside, {
  EDIT_QUOTE_ASIDE_APPROVE_TEST_ID,
  EDIT_QUOTE_ASIDE_BILLING_ENTITY_INPUT_TEST_ID,
  EDIT_QUOTE_ASIDE_CURRENCY_COMBOBOX_TEST_ID,
  EDIT_QUOTE_ASIDE_CURRENCY_INPUT_TEST_ID,
  EDIT_QUOTE_ASIDE_CUSTOMER_INPUT_TEST_ID,
  EDIT_QUOTE_ASIDE_CUSTOMER_LINK_TEST_ID,
  EDIT_QUOTE_ASIDE_DOWNLOAD_PDF_TEST_ID,
  EDIT_QUOTE_ASIDE_QUOTE_TYPE_COMBOBOX_TEST_ID,
  EDIT_QUOTE_ASIDE_SUBSCRIPTION_INPUT_TEST_ID,
} from '../EditQuoteAside'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, params?: Record<string, unknown>) => {
      if (key === 'text_64c7a89b6c67eb6c98898125') return '0 days (at issuing date)'
      if (key === 'text_64c7a89b6c67eb6c9889815f' && params?.days)
        return `${params.days} day${Number(params.days) !== 1 ? 's' : ''}`
      if (key === 'text_17818008544903clzyy4ziu1' && params?.quoteNumberWithVersion)
        return `Quote #${params.quoteNumberWithVersion}`

      return key
    },
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
}))

const mockAddToast = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (payload: unknown) => mockAddToast(payload),
}))

const mockBillingEntitiesOptions = jest.fn()

jest.mock('~/hooks/useBillingEntitiesOptions', () => ({
  // Keep the real BILLING_ENTITY_INHERIT_CODE: the option fixtures below are keyed on it.
  ...jest.requireActual('~/hooks/useBillingEntitiesOptions'),
  useBillingEntitiesOptions: (params?: { includeInheritOption?: boolean }) =>
    mockBillingEntitiesOptions(params),
}))

const mockUpdateQuoteVersion = jest.fn()

jest.mock('~/pages/quotes/hooks/useUpdateQuote', () => ({
  useUpdateQuote: () => ({
    updateQuoteVersion: mockUpdateQuoteVersion,
    isUpdatingQuoteVersion: false,
    updateQuote: jest.fn(),
    isUpdatingQuote: false,
  }),
}))

// The currency ComboBox renders its options through a virtualized list.
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 56,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, i) => ({
        index: i,
        key: String(i),
        start: i * 56,
        size: 56,
      })),
    scrollToIndex: jest.fn(),
    measureElement: jest.fn(),
  }),
}))

const mockDownload = jest.fn().mockResolvedValue(undefined)
const mockGoToApproveQuote = jest.fn()
const mockHasPermissions = jest.fn().mockReturnValue(true)

jest.mock('~/pages/quotes/common/QuotePdfProvider', () => ({
  useDownloadQuotePdf: () => ({ download: mockDownload }),
}))

jest.mock('~/pages/quotes/hooks/useApproveQuote', () => ({
  useApproveQuote: () => ({ goToApproveQuote: mockGoToApproveQuote }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

// Shape produced by `useBillingEntitiesOptions({ includeInheritOption: true })`: the sentinel
// first (empty id/value = follow the customer), then the entities.
const BILLING_ENTITY_OPTIONS = [
  {
    id: '',
    value: BILLING_ENTITY_INHERIT_CODE,
    label: 'Use customer default',
    isDefault: false,
    euTaxManagement: false,
  },
  {
    id: 'be-1',
    value: 'default',
    label: 'Default Entity',
    isDefault: true,
    euTaxManagement: false,
  },
  { id: 'be-2', value: 'second', label: 'Second Entity', isDefault: false, euTaxManagement: false },
]

const mockQuote: QuoteDetailItemFragment = {
  __typename: 'Quote',
  id: 'quote-1',
  number: 'Q-001',
  images: {},
  orderType: OrderTypeEnum.SubscriptionCreation,
  createdAt: '2026-01-01',
  orderForms: [],
  versions: [
    {
      __typename: 'QuoteVersion',
      id: 'version-1',
      status: StatusEnum.Draft,
      version: 1,
      createdAt: '2026-01-01',
    },
  ],
  customer: {
    __typename: 'Customer',
    id: 'customer-1',
    displayName: 'Acme Corp',
    externalId: 'ext-cust-1',
    netPaymentTerm: 30,
    billingEntity: {
      __typename: 'BillingEntity',
      id: 'be-1',
      code: 'default',
      name: 'Default Entity',
      netPaymentTerm: 60,
    },
  },
  owners: [],
  subscription: null,
  currentVersion: {
    __typename: 'QuoteVersion',
    id: 'version-1',
    status: StatusEnum.Draft,
    version: 1,
    content: 'Some content',
    currency: null,
    billingEntityId: null,
    billingItems: null,
    createdAt: '2026-01-01',
    mentionVariables: {},
  },
}

describe('EditQuoteAside', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockUpdateQuoteVersion.mockResolvedValue({ data: { updateQuoteVersion: { id: 'version-1' } } })
    mockBillingEntitiesOptions.mockReturnValue({
      options: BILLING_ENTITY_OPTIONS,
      isLoading: false,
      defaultEntityCode: 'default',
      hasMultipleEntities: true,
    })
  })

  describe('GIVEN a quote is provided', () => {
    describe('WHEN the component renders', () => {
      it('THEN should render the quote type field', () => {
        render(<EditQuoteAside quote={mockQuote} />)

        expect(screen.getByTestId(EDIT_QUOTE_ASIDE_QUOTE_TYPE_COMBOBOX_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render the customer field', () => {
        render(<EditQuoteAside quote={mockQuote} />)

        expect(screen.getByTestId(EDIT_QUOTE_ASIDE_CUSTOMER_INPUT_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render the billing entity field', () => {
        render(<EditQuoteAside quote={mockQuote} />)

        expect(
          screen.getByTestId(EDIT_QUOTE_ASIDE_BILLING_ENTITY_INPUT_TEST_ID),
        ).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a quote with no subscription', () => {
    describe('WHEN the component renders', () => {
      it('THEN should NOT render the subscription field', () => {
        render(<EditQuoteAside quote={{ ...mockQuote, subscription: null }} />)

        expect(
          screen.queryByTestId(EDIT_QUOTE_ASIDE_SUBSCRIPTION_INPUT_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a quote with a subscription', () => {
    describe('WHEN the component renders', () => {
      it('THEN should render the subscription field', () => {
        const quoteWithSubscription = {
          ...mockQuote,
          subscription: {
            __typename: 'Subscription' as const,
            id: 'sub-1',
            name: 'My Subscription',
            externalId: 'ext-sub-1',
            subscriptionAt: '2026-03-15T00:00:00Z',
            plan: {
              __typename: 'Plan' as const,
              id: 'plan-1',
              name: 'Premium Plan',
            },
          },
        }

        render(<EditQuoteAside quote={quoteWithSubscription} />)

        expect(screen.getByTestId(EDIT_QUOTE_ASIDE_SUBSCRIPTION_INPUT_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN no quote is provided', () => {
    describe('WHEN the component renders', () => {
      it('THEN should not render any fields', () => {
        render(<EditQuoteAside quote={undefined} />)

        expect(
          screen.queryByTestId(EDIT_QUOTE_ASIDE_QUOTE_TYPE_COMBOBOX_TEST_ID),
        ).not.toBeInTheDocument()
        expect(
          screen.queryByTestId(EDIT_QUOTE_ASIDE_CUSTOMER_INPUT_TEST_ID),
        ).not.toBeInTheDocument()
        expect(
          screen.queryByTestId(EDIT_QUOTE_ASIDE_BILLING_ENTITY_INPUT_TEST_ID),
        ).not.toBeInTheDocument()
        expect(
          screen.queryByTestId(EDIT_QUOTE_ASIDE_SUBSCRIPTION_INPUT_TEST_ID),
        ).not.toBeInTheDocument()
        expect(
          screen.queryByTestId(EDIT_QUOTE_ASIDE_CURRENCY_INPUT_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a quote with customer currency', () => {
    describe('WHEN the component renders', () => {
      it('THEN should render the currency field', () => {
        render(<EditQuoteAside quote={mockQuote} />)

        expect(screen.getByTestId(EDIT_QUOTE_ASIDE_CURRENCY_INPUT_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the quote currency', () => {
    const renderWithCurrency = (currency: CurrencyEnum | null) =>
      render(
        <EditQuoteAside
          quote={{
            ...mockQuote,
            // The customer currency no longer feeds this field — only the version's does.
            customer: { ...mockQuote.customer, currency: CurrencyEnum.Gbp },
            currentVersion: { ...mockQuote.currentVersion, currency },
          }}
        />,
      )

    describe('WHEN the version has a currency', () => {
      it('THEN should show it in an editable combobox', () => {
        renderWithCurrency(CurrencyEnum.Eur)

        const input = screen
          .getByTestId(EDIT_QUOTE_ASIDE_CURRENCY_COMBOBOX_TEST_ID)
          .querySelector('input') as HTMLInputElement

        expect(input).toHaveValue(CurrencyEnum.Eur)
        expect(input).not.toBeDisabled()
      })
    })

    describe('WHEN the version has no currency', () => {
      it('THEN should show an empty combobox rather than the customer currency', () => {
        renderWithCurrency(null)

        const input = screen
          .getByTestId(EDIT_QUOTE_ASIDE_CURRENCY_COMBOBOX_TEST_ID)
          .querySelector('input') as HTMLInputElement

        expect(input).toHaveValue('')
        expect(input).not.toBeDisabled()
      })
    })

    describe('WHEN the user picks a different currency', () => {
      it('THEN should persist it immediately, without waiting for a debounce', async () => {
        // No inter-event delay: the full currency list is ~140 options, and
        // userEvent's default pacing makes driving the popper slow enough to
        // trip the default jest timeout when suites run in parallel.
        const user = userEvent.setup({ delay: null })
        const onSaveStart = jest.fn()

        render(
          <EditQuoteAside
            quote={{
              ...mockQuote,
              currentVersion: { ...mockQuote.currentVersion, currency: CurrencyEnum.Eur },
            }}
            onSaveStart={onSaveStart}
          />,
        )

        const input = screen
          .getByTestId(EDIT_QUOTE_ASIDE_CURRENCY_COMBOBOX_TEST_ID)
          .querySelector('input') as HTMLInputElement

        // Filter down to the single AUD option, then let the Autocomplete select
        // it via the keyboard. Clicking a popper node instead means holding an
        // element reference across re-renders, which is what made this flake.
        await user.clear(input)
        await user.type(input, CurrencyEnum.Aud)

        await waitFor(() => {
          expect(screen.getAllByRole('option')).toHaveLength(1)
        })

        await user.keyboard('{ArrowDown}{Enter}')

        await waitFor(() => {
          expect(mockUpdateQuoteVersion).toHaveBeenCalledWith(
            { id: 'version-1', currency: CurrencyEnum.Aud },
            false,
          )
        })
        expect(onSaveStart).toHaveBeenCalled()
      })
    })

    describe('WHEN the version currency changes outside the form', () => {
      it('THEN should sync the field without issuing another save', async () => {
        const { rerender } = renderWithCurrency(null)

        rerender(
          <EditQuoteAside
            quote={{
              ...mockQuote,
              customer: { ...mockQuote.customer, currency: CurrencyEnum.Gbp },
              currentVersion: { ...mockQuote.currentVersion, currency: CurrencyEnum.Jpy },
            }}
          />,
        )

        await waitFor(() => {
          const input = screen
            .getByTestId(EDIT_QUOTE_ASIDE_CURRENCY_COMBOBOX_TEST_ID)
            .querySelector('input') as HTMLInputElement

          expect(input).toHaveValue(CurrencyEnum.Jpy)
        })

        expect(mockUpdateQuoteVersion).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a quote with a subscription that has a plan', () => {
    describe('WHEN the component renders', () => {
      it('THEN should display the subscription label as "planName - externalId"', () => {
        const quoteWithSubscription = {
          ...mockQuote,
          subscription: {
            __typename: 'Subscription' as const,
            id: 'sub-1',
            name: 'My Subscription',
            externalId: 'ext-sub-1',
            subscriptionAt: '2026-03-15T00:00:00Z',
            plan: {
              __typename: 'Plan' as const,
              id: 'plan-1',
              name: 'Premium Plan',
            },
          },
        }

        render(<EditQuoteAside quote={quoteWithSubscription} />)

        expect(screen.getByDisplayValue('Premium Plan - ext-sub-1')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the footer actions', () => {
    describe('WHEN the component renders', () => {
      it('THEN should render the Download PDF button', () => {
        render(<EditQuoteAside quote={mockQuote} />)

        expect(screen.getByTestId(EDIT_QUOTE_ASIDE_DOWNLOAD_PDF_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should still render the Download PDF button without the quotesApprove permission', () => {
        mockHasPermissions.mockReturnValue(false)
        render(<EditQuoteAside quote={mockQuote} />)

        expect(screen.getByTestId(EDIT_QUOTE_ASIDE_DOWNLOAD_PDF_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render the Approve button when the user has the quotesApprove permission', () => {
        mockHasPermissions.mockReturnValue(true)
        render(<EditQuoteAside quote={mockQuote} />)

        expect(screen.getByTestId(EDIT_QUOTE_ASIDE_APPROVE_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should NOT render the Approve button without the quotesApprove permission', () => {
        mockHasPermissions.mockReturnValue(false)
        render(<EditQuoteAside quote={mockQuote} />)

        expect(screen.queryByTestId(EDIT_QUOTE_ASIDE_APPROVE_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the Download PDF button is clicked', () => {
      it('THEN should trigger a PDF download', () => {
        render(<EditQuoteAside quote={mockQuote} />)

        fireEvent.click(screen.getByTestId(EDIT_QUOTE_ASIDE_DOWNLOAD_PDF_TEST_ID))

        expect(mockDownload).toHaveBeenCalledTimes(1)
      })

      it('THEN should build the PDF header from the quote number and version', () => {
        render(<EditQuoteAside quote={mockQuote} />)

        fireEvent.click(screen.getByTestId(EDIT_QUOTE_ASIDE_DOWNLOAD_PDF_TEST_ID))

        expect(mockDownload).toHaveBeenCalledWith(
          expect.objectContaining({
            header: expect.objectContaining({
              documentNumber: 'Q-001',
              rows: ['Quote #Q-001 - v1'],
            }),
          }),
        )
      })
    })

    describe('WHEN the Approve button is clicked', () => {
      it('THEN should navigate to the approve quote page', () => {
        render(<EditQuoteAside quote={mockQuote} />)

        fireEvent.click(screen.getByTestId(EDIT_QUOTE_ASIDE_APPROVE_TEST_ID))

        expect(mockGoToApproveQuote).toHaveBeenCalledWith('quote-1', 'version-1')
      })
    })

    describe('WHEN the quote is saving', () => {
      it('THEN should disable both action buttons and show loading spinners', () => {
        render(<EditQuoteAside quote={mockQuote} isSaving />)

        expect(screen.getByTestId(EDIT_QUOTE_ASIDE_DOWNLOAD_PDF_TEST_ID)).toBeDisabled()
        expect(screen.getByTestId(EDIT_QUOTE_ASIDE_APPROVE_TEST_ID)).toBeDisabled()
        expect(screen.getAllByTestId(/processing/)).toHaveLength(2)
      })

      it('THEN should not trigger a PDF download while saving', () => {
        render(<EditQuoteAside quote={mockQuote} isSaving />)

        fireEvent.click(screen.getByTestId(EDIT_QUOTE_ASIDE_DOWNLOAD_PDF_TEST_ID))

        expect(mockDownload).not.toHaveBeenCalled()
      })

      it('THEN should not navigate to approve while saving', () => {
        render(<EditQuoteAside quote={mockQuote} isSaving />)

        fireEvent.click(screen.getByTestId(EDIT_QUOTE_ASIDE_APPROVE_TEST_ID))

        expect(mockGoToApproveQuote).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the quote is NOT saving', () => {
      it('THEN should not show any loading spinners', () => {
        render(<EditQuoteAside quote={mockQuote} />)

        expect(screen.queryAllByTestId(/processing/)).toHaveLength(0)
      })
    })
  })
  describe('GIVEN the customer row', () => {
    describe('WHEN the component renders', () => {
      it('THEN should link to the customer detail page', () => {
        render(<EditQuoteAside quote={mockQuote} />)

        expect(screen.getByTestId(EDIT_QUOTE_ASIDE_CUSTOMER_LINK_TEST_ID)).toHaveAttribute(
          'href',
          expect.stringContaining('/customer/customer-1'),
        )
      })

      it('THEN should display the customer name inside the link', () => {
        render(<EditQuoteAside quote={mockQuote} />)

        expect(screen.getByTestId(EDIT_QUOTE_ASIDE_CUSTOMER_LINK_TEST_ID)).toHaveTextContent(
          'Acme Corp',
        )
      })
    })
  })

  describe('GIVEN the billing entity row', () => {
    describe('WHEN the organization has several entities on a non-amendment quote', () => {
      it('THEN should render the picker', () => {
        render(<EditQuoteAside quote={mockQuote} />)

        expect(screen.getByTestId(BILLING_ENTITY_FORM_PICKER_DATA_TEST)).toBeInTheDocument()
      })

      it('THEN should request the inherit option', () => {
        render(<EditQuoteAside quote={mockQuote} />)

        expect(mockBillingEntitiesOptions).toHaveBeenCalledWith({ includeInheritOption: true })
      })
    })

    describe('WHEN the organization has a single entity', () => {
      it('THEN should hide the row rather than show a one-option picker', () => {
        mockBillingEntitiesOptions.mockReturnValue({
          options: [BILLING_ENTITY_OPTIONS[0], BILLING_ENTITY_OPTIONS[1]],
          isLoading: false,
          defaultEntityCode: 'default',
          hasMultipleEntities: false,
        })

        render(<EditQuoteAside quote={mockQuote} />)

        expect(
          screen.queryByTestId(EDIT_QUOTE_ASIDE_BILLING_ENTITY_INPUT_TEST_ID),
        ).not.toBeInTheDocument()
        expect(screen.queryByTestId(BILLING_ENTITY_FORM_PICKER_DATA_TEST)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the quote is a subscription amendment', () => {
      it('THEN should hide the row, because the backend rejects an entity there', () => {
        render(
          <EditQuoteAside
            quote={{ ...mockQuote, orderType: OrderTypeEnum.SubscriptionAmendment }}
          />,
        )

        expect(
          screen.queryByTestId(EDIT_QUOTE_ASIDE_BILLING_ENTITY_INPUT_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN the version pins an entity', () => {
      it('THEN should preselect it', () => {
        render(
          <EditQuoteAside
            quote={{
              ...mockQuote,
              currentVersion: { ...mockQuote.currentVersion, billingEntityId: 'be-2' },
            }}
          />,
        )

        const input = screen
          .getByTestId(BILLING_ENTITY_FORM_PICKER_DATA_TEST)
          .querySelector('input') as HTMLInputElement

        expect(input).toHaveValue('Second Entity')
      })
    })

    describe('WHEN the version pins no entity', () => {
      it('THEN should preselect the inherit option rather than the customer entity', () => {
        render(<EditQuoteAside quote={mockQuote} />)

        const input = screen
          .getByTestId(BILLING_ENTITY_FORM_PICKER_DATA_TEST)
          .querySelector('input') as HTMLInputElement

        // Shows the inherit LABEL, not an empty box: an empty ComboBox value reads as
        // "no selection" and `clearOnBlur` wiped it, so the choice never stuck.
        expect(input).toHaveValue('Use customer default')
        expect(mockUpdateQuoteVersion).not.toHaveBeenCalled()
      })

      it('THEN should keep the inherit option displayed after the field loses focus', async () => {
        const user = userEvent.setup({ delay: null })

        render(<EditQuoteAside quote={mockQuote} />)

        const input = screen
          .getByTestId(BILLING_ENTITY_FORM_PICKER_DATA_TEST)
          .querySelector('input') as HTMLInputElement

        await user.click(input)
        await user.tab()

        expect(input).toHaveValue('Use customer default')
        expect(mockUpdateQuoteVersion).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the user picks an entity', () => {
      it('THEN should persist its id immediately', async () => {
        const user = userEvent.setup({ delay: null })
        const onSaveStart = jest.fn()

        render(<EditQuoteAside quote={mockQuote} onSaveStart={onSaveStart} />)

        const input = screen
          .getByTestId(BILLING_ENTITY_FORM_PICKER_DATA_TEST)
          .querySelector('input') as HTMLInputElement

        await user.clear(input)
        await user.type(input, 'second')

        await waitFor(() => {
          expect(screen.getAllByRole('option')).toHaveLength(1)
        })

        await user.keyboard('{ArrowDown}{Enter}')

        await waitFor(() => {
          expect(mockUpdateQuoteVersion).toHaveBeenCalledWith(
            { id: 'version-1', billingEntityId: 'be-2' },
            false,
          )
        })
        expect(onSaveStart).toHaveBeenCalled()
      })
    })

    describe('WHEN the user switches back to the inherit option', () => {
      const renderWithPinnedEntity = () =>
        render(
          <EditQuoteAside
            quote={{
              ...mockQuote,
              currentVersion: { ...mockQuote.currentVersion, billingEntityId: 'be-2' },
            }}
          />,
        )

      const getPickerInput = (): HTMLInputElement =>
        screen
          .getByTestId(BILLING_ENTITY_FORM_PICKER_DATA_TEST)
          .querySelector('input') as HTMLInputElement

      it('THEN should send null when the field is cleared', async () => {
        const user = userEvent.setup({ delay: null })

        renderWithPinnedEntity()

        // Clearing IS "go back to the customer's entity": both resolve to the inherit option.
        await user.clear(getPickerInput())

        await waitFor(() => {
          expect(mockUpdateQuoteVersion).toHaveBeenCalledWith(
            { id: 'version-1', billingEntityId: null },
            false,
          )
        })
      })

      // Driving the popper by keyboard, like the currency case: holding a node reference across
      // re-renders is what made these flake. The inherit option is first in the list.
      const pickInheritFromList = async (
        user: ReturnType<typeof userEvent.setup>,
      ): Promise<void> => {
        await user.click(getPickerInput())
        await user.keyboard('{ArrowDown}')

        await waitFor(() => {
          expect(screen.getAllByRole('option').length).toBeGreaterThan(1)
        })

        await user.keyboard('{Enter}')
      }

      it('THEN should send null when the inherit option is picked from the list', async () => {
        const user = userEvent.setup({ delay: null })

        renderWithPinnedEntity()

        await pickInheritFromList(user)

        await waitFor(() => {
          expect(mockUpdateQuoteVersion).toHaveBeenCalledWith(
            { id: 'version-1', billingEntityId: null },
            false,
          )
        })
      })

      it('THEN should keep showing the inherit option once it is saved', async () => {
        const user = userEvent.setup({ delay: null })

        renderWithPinnedEntity()

        await pickInheritFromList(user)

        await waitFor(() => {
          expect(mockUpdateQuoteVersion).toHaveBeenCalled()
        })

        await user.tab()

        expect(getPickerInput()).toHaveValue('Use customer default')
      })
    })

    describe('WHEN the version entity changes outside the form', () => {
      it('THEN should sync the field without issuing another save', async () => {
        const { rerender } = render(<EditQuoteAside quote={mockQuote} />)

        rerender(
          <EditQuoteAside
            quote={{
              ...mockQuote,
              currentVersion: { ...mockQuote.currentVersion, billingEntityId: 'be-2' },
            }}
          />,
        )

        await waitFor(() => {
          const input = screen
            .getByTestId(BILLING_ENTITY_FORM_PICKER_DATA_TEST)
            .querySelector('input') as HTMLInputElement

          expect(input).toHaveValue('Second Entity')
        })

        expect(mockUpdateQuoteVersion).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a subscription amendment quote', () => {
    const amendmentQuote = { ...mockQuote, orderType: OrderTypeEnum.SubscriptionAmendment }

    // The amended subscription already invoices in its plan's currency and the quote took it at
    // creation, so the API refuses any change (`currency: not_supported_for_order_type`).
    describe('WHEN the aside renders', () => {
      it('THEN should still show the currency, read-only', () => {
        render(<EditQuoteAside quote={amendmentQuote} />)

        const input = screen
          .getByTestId(EDIT_QUOTE_ASIDE_CURRENCY_COMBOBOX_TEST_ID)
          .querySelector('input') as HTMLInputElement

        expect(screen.getByTestId(EDIT_QUOTE_ASIDE_CURRENCY_INPUT_TEST_ID)).toBeInTheDocument()
        expect(input).toBeDisabled()
      })

      it('THEN should leave it editable on every other order type', () => {
        render(<EditQuoteAside quote={mockQuote} />)

        const input = screen
          .getByTestId(EDIT_QUOTE_ASIDE_CURRENCY_COMBOBOX_TEST_ID)
          .querySelector('input') as HTMLInputElement

        expect(input).not.toBeDisabled()
      })
    })

    describe('WHEN the field is driven programmatically', () => {
      it('THEN should still refuse to persist a currency', async () => {
        const { rerender } = render(<EditQuoteAside quote={amendmentQuote} />)

        // The resync effect writes the field whenever the version currency changes; on an
        // amendment that must never turn into a mutation.
        rerender(
          <EditQuoteAside
            quote={{
              ...amendmentQuote,
              currentVersion: { ...amendmentQuote.currentVersion, currency: CurrencyEnum.Jpy },
            }}
          />,
        )

        await waitFor(() => {
          const input = screen
            .getByTestId(EDIT_QUOTE_ASIDE_CURRENCY_COMBOBOX_TEST_ID)
            .querySelector('input') as HTMLInputElement

          expect(input).toHaveValue(CurrencyEnum.Jpy)
        })

        expect(mockUpdateQuoteVersion).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the document renders mention variables', () => {
    // The content stores variable ids, so the preview reads `quoteVersion.mentionVariables`. A
    // draft recomputes them live from the version's billing entity and currency, so selecting the
    // field back refreshes the normalized QuoteVersion instead of leaving the previous entity's
    // values on screen (LAGO-1839).
    // `useUpdateQuote` is mocked in this suite, so the cases below cannot observe the cache — the
    // refresh itself is covered in `hooks/__tests__/useUpdateQuoteCache.test.tsx`. This guards the
    // half that lives in the mutation the aside calls: without the field in the selection set,
    // Apollo has nothing to write back and the preview keeps the previous entity's values.
    it('THEN should select mentionVariables back from the version mutation', () => {
      expect(print(UpdateQuoteVersionDocument)).toContain('mentionVariables')
    })

    const respondWith = (mentionVariables: Record<string, string>) =>
      mockUpdateQuoteVersion.mockResolvedValue({
        data: { updateQuoteVersion: { id: 'version-1', mentionVariables } },
      })

    it('THEN should return the new entity values when the billing entity changes', async () => {
      const user = userEvent.setup({ delay: null })

      respondWith({ billing_entity_name: 'Second Entity' })

      render(<EditQuoteAside quote={mockQuote} />)

      const input = screen
        .getByTestId(BILLING_ENTITY_FORM_PICKER_DATA_TEST)
        .querySelector('input') as HTMLInputElement

      await user.clear(input)
      await user.type(input, 'second')

      await waitFor(() => {
        expect(screen.getAllByRole('option')).toHaveLength(1)
      })

      await user.keyboard('{ArrowDown}{Enter}')

      await waitFor(() => {
        expect(mockUpdateQuoteVersion).toHaveBeenCalled()
      })

      const result = await mockUpdateQuoteVersion.mock.results.at(-1)?.value

      expect(result.data.updateQuoteVersion.mentionVariables).toEqual({
        billing_entity_name: 'Second Entity',
      })
    })

    it('THEN should return the new quote_currency when the currency changes', async () => {
      const user = userEvent.setup({ delay: null })

      respondWith({ quote_currency: CurrencyEnum.Aud })

      render(
        <EditQuoteAside
          quote={{
            ...mockQuote,
            currentVersion: { ...mockQuote.currentVersion, currency: CurrencyEnum.Eur },
          }}
        />,
      )

      const input = screen
        .getByTestId(EDIT_QUOTE_ASIDE_CURRENCY_COMBOBOX_TEST_ID)
        .querySelector('input') as HTMLInputElement

      await user.clear(input)
      await user.type(input, CurrencyEnum.Aud)

      await waitFor(() => {
        expect(screen.getAllByRole('option')).toHaveLength(1)
      })

      await user.keyboard('{ArrowDown}{Enter}')

      await waitFor(() => {
        expect(mockUpdateQuoteVersion).toHaveBeenCalled()
      })

      const result = await mockUpdateQuoteVersion.mock.results.at(-1)?.value

      expect(result.data.updateQuoteVersion.mentionVariables).toEqual({
        quote_currency: CurrencyEnum.Aud,
      })
    })
  })

  describe('GIVEN the API rejects a version update with a field-scoped 422', () => {
    describe('WHEN the entity is rejected', () => {
      it('THEN should surface the mapped reason and report the failure for retry', async () => {
        const user = userEvent.setup({ delay: null })
        const onSaveError = jest.fn()

        mockUpdateQuoteVersion.mockResolvedValue({
          data: null,
          errors: [
            {
              message: 'Unprocessable Entity',
              extensions: {
                status: 422,
                code: 'unprocessable_entity',
                details: { billingEntityId: ['billing_entity_not_found'] },
              },
            },
          ],
        })

        render(<EditQuoteAside quote={mockQuote} onSaveError={onSaveError} />)

        const input = screen
          .getByTestId(BILLING_ENTITY_FORM_PICKER_DATA_TEST)
          .querySelector('input') as HTMLInputElement

        await user.clear(input)
        await user.type(input, 'second')

        await waitFor(() => {
          expect(screen.getAllByRole('option')).toHaveLength(1)
        })

        await user.keyboard('{ArrowDown}{Enter}')

        await waitFor(() => {
          expect(mockAddToast).toHaveBeenCalledWith(
            expect.objectContaining({ severity: 'danger', message: expect.any(String) }),
          )
        })
        expect(onSaveError).toHaveBeenCalledWith(
          expect.objectContaining({ billingEntityId: 'be-2' }),
        )
      })

      it('THEN should put the picker back, rather than showing a pin the quote does not carry', async () => {
        const user = userEvent.setup({ delay: null })

        mockUpdateQuoteVersion.mockResolvedValue({
          data: null,
          errors: [
            {
              message: 'Unprocessable Entity',
              extensions: {
                status: 422,
                code: 'unprocessable_entity',
                details: { billingEntityId: ['billing_entity_not_found'] },
              },
            },
          ],
        })

        render(<EditQuoteAside quote={mockQuote} />)

        const input = screen
          .getByTestId(BILLING_ENTITY_FORM_PICKER_DATA_TEST)
          .querySelector('input') as HTMLInputElement

        await user.clear(input)
        await user.type(input, 'second')

        await waitFor(() => {
          expect(screen.getAllByRole('option')).toHaveLength(1)
        })

        await user.keyboard('{ArrowDown}{Enter}')

        await waitFor(() => {
          expect(mockUpdateQuoteVersion).toHaveBeenCalledTimes(1)
        })

        // Back to the inherit option the version actually carries...
        await waitFor(() => {
          expect(
            (
              screen
                .getByTestId(BILLING_ENTITY_FORM_PICKER_DATA_TEST)
                .querySelector('input') as HTMLInputElement
            ).value,
          ).toBe('Use customer default')
        })

        // ...and the restore must not fire a second mutation of its own.
        expect(mockUpdateQuoteVersion).toHaveBeenCalledTimes(1)
      })

      it('THEN should let the user retry the same entity after the rejection', async () => {
        const user = userEvent.setup({ delay: null })

        mockUpdateQuoteVersion.mockResolvedValueOnce({
          data: null,
          errors: [
            {
              message: 'Unprocessable Entity',
              extensions: {
                status: 422,
                code: 'unprocessable_entity',
                details: { billingEntityId: ['billing_entity_not_found'] },
              },
            },
          ],
        })

        render(<EditQuoteAside quote={mockQuote} />)

        const pickSecondEntity = async (): Promise<void> => {
          const input = screen
            .getByTestId(BILLING_ENTITY_FORM_PICKER_DATA_TEST)
            .querySelector('input') as HTMLInputElement

          await user.clear(input)
          await user.type(input, 'second')

          await waitFor(() => {
            expect(screen.getAllByRole('option')).toHaveLength(1)
          })

          await user.keyboard('{ArrowDown}{Enter}')
        }

        await pickSecondEntity()

        await waitFor(() => {
          expect(mockUpdateQuoteVersion).toHaveBeenCalledTimes(1)
        })

        // The guard was rolled back with the field, so the same pick is not a silent no-op.
        await pickSecondEntity()

        await waitFor(() => {
          expect(mockUpdateQuoteVersion).toHaveBeenCalledTimes(2)
        })
        expect(mockUpdateQuoteVersion).toHaveBeenLastCalledWith(
          { id: 'version-1', billingEntityId: 'be-2' },
          false,
        )
      })
    })
  })
})
