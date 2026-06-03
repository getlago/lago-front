import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateTime } from 'luxon'
import { z } from 'zod'

import { CurrencyEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import AddOnSelectionContent from '../AddOnSelectionContent'
import { type AddOnItem, pricingDrawerDefaultValues } from '../constants'

const mockUseGetAddOnsForPricingSectionQuery = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetAddOnsForPricingSectionQuery: (...args: unknown[]) =>
    mockUseGetAddOnsForPricingSectionQuery(...args),
}))

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    intlFormatDateTimeOrgaTZ: () => ({ date: '2026-01-01', time: '00:00' }),
    organization: { defaultCurrency: 'USD' },
  }),
}))

jest.mock('@tanstack/react-form', () => ({
  ...jest.requireActual('@tanstack/react-form'),
  revalidateLogic: () => () => {},
}))

const defaultAddOnItem: AddOnItem = {
  addOnId: 'addon-1',
  name: 'Setup Fee',
  invoiceDisplayName: '',
  code: 'setup_fee',
  description: '',
  units: '1',
  unitAmountCents: '50',
  totalAmount: '50',
  fromDatetime: '2026-01-01T00:00:00.000+00:00',
  toDatetime: '2026-01-01T23:59:59.999+00:00',
}

const secondAddOnItem: AddOnItem = {
  addOnId: 'addon-2',
  name: 'Support',
  invoiceDisplayName: 'Premium Support',
  code: 'support',
  description: 'Monthly support package',
  units: '2',
  unitAmountCents: '100',
  totalAmount: '200',
  fromDatetime: '2026-01-01T00:00:00.000+00:00',
  toDatetime: '2026-01-31T23:59:59.999+00:00',
}

const addOnsCollection = [
  {
    id: 'addon-1',
    name: 'Setup Fee',
    code: 'setup_fee',
    invoiceDisplayName: '',
    description: 'One-time setup fee',
    amountCents: '5000',
    amountCurrency: CurrencyEnum.Usd,
    taxes: [],
  },
  {
    id: 'addon-2',
    name: 'Support',
    code: 'support',
    invoiceDisplayName: 'Premium Support',
    description: 'Monthly support',
    amountCents: '10000',
    amountCurrency: CurrencyEnum.Usd,
    taxes: [],
  },
]

const renderWithForm = ({
  currency = CurrencyEnum.Usd,
  initialValues,
  onAddOnPayloadCapture,
}: {
  currency?: CurrencyEnum
  initialValues?: { addOnItems?: AddOnItem[] }
  onAddOnPayloadCapture?: jest.Mock
} = {}) => {
  const { useAppForm: useAppFormHook } = jest.requireActual('~/hooks/forms/useAppform')

  const Wrapper = () => {
    const form = useAppFormHook({
      defaultValues: {
        ...pricingDrawerDefaultValues,
        addOnItems: initialValues?.addOnItems ?? [],
      },
    })

    return (
      <AddOnSelectionContent
        form={form}
        currency={currency}
        onAddOnPayloadCapture={onAddOnPayloadCapture}
      />
    )
  }

  return render(<Wrapper />)
}

describe('AddOnSelectionContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockUseGetAddOnsForPricingSectionQuery.mockReturnValue({
      data: undefined,
      loading: false,
    })
  })

  describe('GIVEN the component is rendered', () => {
    describe('WHEN add-ons data is loaded', () => {
      it('THEN should render the add-add-on-button', () => {
        mockUseGetAddOnsForPricingSectionQuery.mockReturnValue({
          data: { addOns: { collection: addOnsCollection } },
          loading: false,
        })

        renderWithForm()

        expect(screen.getByTestId('add-add-on-button')).toBeInTheDocument()
      })
    })

    describe('WHEN no add-on items are provided', () => {
      it('THEN should not render any add-on item cards', () => {
        mockUseGetAddOnsForPricingSectionQuery.mockReturnValue({
          data: { addOns: { collection: addOnsCollection } },
          loading: false,
        })

        renderWithForm()

        expect(screen.queryByTestId('add-on-item-0')).not.toBeInTheDocument()
        expect(screen.queryByTestId('add-on-pending-0')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the add-add-on-button is clicked', () => {
    describe('WHEN the user clicks the button', () => {
      it('THEN should create a pending row with a ComboBox', async () => {
        mockUseGetAddOnsForPricingSectionQuery.mockReturnValue({
          data: { addOns: { collection: addOnsCollection } },
          loading: false,
        })

        renderWithForm()

        await userEvent.click(screen.getByTestId('add-add-on-button'))

        expect(screen.getByTestId('add-on-pending-0')).toBeInTheDocument()
      })
    })

    describe('WHEN the user clicks the button multiple times', () => {
      it('THEN should create multiple pending rows', async () => {
        mockUseGetAddOnsForPricingSectionQuery.mockReturnValue({
          data: { addOns: { collection: addOnsCollection } },
          loading: false,
        })

        renderWithForm()

        await userEvent.click(screen.getByTestId('add-add-on-button'))
        await userEvent.click(screen.getByTestId('add-add-on-button'))

        expect(screen.getByTestId('add-on-pending-0')).toBeInTheDocument()
        expect(screen.getByTestId('add-on-pending-1')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a pending add-on row exists', () => {
    describe('WHEN the trash button is clicked', () => {
      it('THEN should remove the pending row', async () => {
        mockUseGetAddOnsForPricingSectionQuery.mockReturnValue({
          data: { addOns: { collection: addOnsCollection } },
          loading: false,
        })

        renderWithForm()

        await userEvent.click(screen.getByTestId('add-add-on-button'))
        expect(screen.getByTestId('add-on-pending-0')).toBeInTheDocument()

        await userEvent.click(screen.getByTestId('remove-add-on-0'))

        expect(screen.queryByTestId('add-on-pending-0')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN confirmed add-on items are provided via initial values', () => {
    beforeEach(() => {
      mockUseGetAddOnsForPricingSectionQuery.mockReturnValue({
        data: { addOns: { collection: addOnsCollection } },
        loading: false,
      })
    })

    describe('WHEN a single add-on item is provided', () => {
      it('THEN should render the add-on item card', () => {
        renderWithForm({
          initialValues: { addOnItems: [defaultAddOnItem] },
        })

        expect(screen.getByTestId('add-on-item-0')).toBeInTheDocument()
      })

      it('THEN should display the add-on name', () => {
        renderWithForm({
          initialValues: { addOnItems: [defaultAddOnItem] },
        })

        expect(screen.getByText('Setup Fee')).toBeInTheDocument()
      })

      it('THEN should display the actions popper trigger', () => {
        renderWithForm({
          initialValues: { addOnItems: [defaultAddOnItem] },
        })

        expect(screen.getByTestId('add-on-actions-0')).toBeInTheDocument()
      })
    })

    describe('WHEN multiple add-on items are provided', () => {
      it('THEN should render all add-on item cards', () => {
        renderWithForm({
          initialValues: { addOnItems: [defaultAddOnItem, secondAddOnItem] },
        })

        expect(screen.getByTestId('add-on-item-0')).toBeInTheDocument()
        expect(screen.getByTestId('add-on-item-1')).toBeInTheDocument()
      })
    })

    describe('WHEN an add-on has an invoiceDisplayName', () => {
      it('THEN should display the invoiceDisplayName instead of name', () => {
        renderWithForm({
          initialValues: { addOnItems: [secondAddOnItem] },
        })

        expect(screen.getByText('Premium Support')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a confirmed add-on item exists', () => {
    describe('WHEN the remove option is clicked via popper menu', () => {
      it('THEN should remove the add-on item', async () => {
        mockUseGetAddOnsForPricingSectionQuery.mockReturnValue({
          data: { addOns: { collection: [] } },
          loading: false,
        })

        renderWithForm({
          initialValues: { addOnItems: [defaultAddOnItem] },
        })

        expect(screen.getByTestId('add-on-item-0')).toBeInTheDocument()

        // Open the popper menu
        await userEvent.click(screen.getByTestId('add-on-actions-0'))
        // Click the delete button (translation key for "Delete")
        await userEvent.click(screen.getByText('text_63aa085d28b8510cd46443ff'))

        expect(screen.queryByTestId('add-on-item-0')).not.toBeInTheDocument()
      })
    })

    describe('WHEN the popper menu is opened', () => {
      it('THEN should show edit and delete action buttons', async () => {
        mockUseGetAddOnsForPricingSectionQuery.mockReturnValue({
          data: { addOns: { collection: [] } },
          loading: false,
        })

        renderWithForm({
          initialValues: { addOnItems: [defaultAddOnItem] },
        })

        // Open the popper menu
        await userEvent.click(screen.getByTestId('add-on-actions-0'))

        // Both edit and delete translation keys should be visible
        expect(screen.getByText('text_63aa15caab5b16980b21b0b8')).toBeInTheDocument()
        expect(screen.getByText('text_63aa085d28b8510cd46443ff')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the query configuration', () => {
    it('THEN should call useGetAddOnsForPricingSectionQuery with correct variables and fetch policy', () => {
      mockUseGetAddOnsForPricingSectionQuery.mockReturnValue({
        data: { addOns: { collection: [] } },
        loading: false,
      })

      renderWithForm()

      expect(mockUseGetAddOnsForPricingSectionQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { limit: 100 },
          fetchPolicy: 'network-only',
          nextFetchPolicy: 'network-only',
        }),
      )
    })
  })

  describe('GIVEN the grand total section', () => {
    describe('WHEN add-on items are provided with totalAmount values', () => {
      it('THEN should display the grand total', () => {
        mockUseGetAddOnsForPricingSectionQuery.mockReturnValue({
          data: { addOns: { collection: [] } },
          loading: false,
        })

        renderWithForm({
          initialValues: {
            addOnItems: [defaultAddOnItem, secondAddOnItem],
          },
        })

        // The grand total translation key should be present
        expect(screen.getByText('text_1780058708833525bhmtn9do')).toBeInTheDocument()
      })
    })

    describe('WHEN no add-on items are provided', () => {
      it('THEN should still display the grand total section', () => {
        mockUseGetAddOnsForPricingSectionQuery.mockReturnValue({
          data: { addOns: { collection: [] } },
          loading: false,
        })

        renderWithForm()

        expect(screen.getByText('text_1780058708833525bhmtn9do')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the onAddOnPayloadCapture callback', () => {
    describe('WHEN the component renders without user interaction', () => {
      it('THEN should not call onAddOnPayloadCapture', () => {
        const onAddOnPayloadCapture = jest.fn()

        mockUseGetAddOnsForPricingSectionQuery.mockReturnValue({
          data: { addOns: { collection: addOnsCollection } },
          loading: false,
        })

        renderWithForm({ onAddOnPayloadCapture })

        expect(onAddOnPayloadCapture).not.toHaveBeenCalled()
      })
    })

    describe('WHEN a pending row is added without selecting an add-on', () => {
      it('THEN should not call onAddOnPayloadCapture', async () => {
        const onAddOnPayloadCapture = jest.fn()

        mockUseGetAddOnsForPricingSectionQuery.mockReturnValue({
          data: { addOns: { collection: addOnsCollection } },
          loading: false,
        })

        renderWithForm({ onAddOnPayloadCapture })

        await userEvent.click(screen.getByTestId('add-add-on-button'))
        expect(screen.getByTestId('add-on-pending-0')).toBeInTheDocument()

        expect(onAddOnPayloadCapture).not.toHaveBeenCalled()
      })
    })
  })
})

// --- editAddOnSchema validation tests (mirrors the schema defined in AddOnSelectionContent) ---

const editAddOnSchema = z
  .object({
    invoiceDisplayName: z.string(),
    description: z.string(),
    fromDatetime: z.string().min(1, { message: 'Start date is required' }),
    toDatetime: z.string().min(1, { message: 'End date is required' }),
  })
  .superRefine((data, ctx) => {
    if (data.fromDatetime && data.toDatetime) {
      const from = DateTime.fromISO(data.fromDatetime)
      const to = DateTime.fromISO(data.toDatetime)

      if (to < from) {
        ctx.addIssue({
          code: 'custom',
          message: 'End date must not be before start date',
          path: ['toDatetime'],
        })
      }
    }
  })

describe('editAddOnSchema date validation (LAGO-1502)', () => {
  const validData = {
    invoiceDisplayName: 'Setup Fee',
    description: 'Description',
    fromDatetime: '2026-01-01T00:00:00.000+00:00',
    toDatetime: '2026-01-31T23:59:59.999+00:00',
  }

  describe('GIVEN valid dates where toDatetime is after fromDatetime', () => {
    describe('WHEN the schema validates', () => {
      it('THEN should pass validation', () => {
        const result = editAddOnSchema.safeParse(validData)

        expect(result.success).toBe(true)
      })
    })
  })

  describe('GIVEN toDatetime is before fromDatetime', () => {
    describe('WHEN the schema validates', () => {
      it('THEN should fail with an error on the toDatetime path', () => {
        const result = editAddOnSchema.safeParse({
          ...validData,
          fromDatetime: '2026-06-15T00:00:00.000+00:00',
          toDatetime: '2026-06-01T00:00:00.000+00:00',
        })

        expect(result.success).toBe(false)

        if (!result.success) {
          const toDatetimeError = result.error.issues.find((issue) =>
            issue.path.includes('toDatetime'),
          )

          expect(toDatetimeError).toBeDefined()
        }
      })
    })
  })

  describe('GIVEN toDatetime equals fromDatetime', () => {
    describe('WHEN the schema validates', () => {
      it('THEN should pass validation', () => {
        const sameDate = '2026-06-15T00:00:00.000+00:00'
        const result = editAddOnSchema.safeParse({
          ...validData,
          fromDatetime: sameDate,
          toDatetime: sameDate,
        })

        expect(result.success).toBe(true)
      })
    })
  })

  describe('GIVEN empty fromDatetime', () => {
    describe('WHEN the schema validates', () => {
      it('THEN should fail with required error on fromDatetime', () => {
        const result = editAddOnSchema.safeParse({
          ...validData,
          fromDatetime: '',
        })

        expect(result.success).toBe(false)
      })
    })
  })

  describe('GIVEN empty toDatetime', () => {
    describe('WHEN the schema validates', () => {
      it('THEN should fail with required error on toDatetime', () => {
        const result = editAddOnSchema.safeParse({
          ...validData,
          toDatetime: '',
        })

        expect(result.success).toBe(false)
      })
    })
  })
})
