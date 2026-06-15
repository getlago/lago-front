import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CurrencyEnum, OrderTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { type AddOnItem, pricingDrawerDefaultValues } from '../constants'
import PricingDrawerContent from '../PricingDrawerContent'

const mockUsePlansQuery = jest.fn()
const mockUseGetAddOnsForPricingSectionQuery = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  usePlansQuery: (...args: unknown[]) => mockUsePlansQuery(...args),
  useGetAddOnsForPricingSectionQuery: (...args: unknown[]) =>
    mockUseGetAddOnsForPricingSectionQuery(...args),
}))

// drawerStack.ts uses import.meta.hot — mock the entire useDrawer module instead
jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

// Helper to render with a form wrapper
const renderWithForm = ({
  quoteType,
  currency = CurrencyEnum.Usd,
  initialValues,
}: {
  quoteType: OrderTypeEnum
  currency?: CurrencyEnum
  initialValues?: { planId?: string; addOnItems?: AddOnItem[] }
}) => {
  // We use a wrapper component that creates the form via useAppForm
  // and passes it to PricingDrawerContent
  const { useAppForm: useAppFormHook } = jest.requireActual('~/hooks/forms/useAppform')

  const Wrapper = () => {
    const form = useAppFormHook({
      defaultValues: {
        ...pricingDrawerDefaultValues,
        planId: initialValues?.planId ?? '',
        addOnItems: initialValues?.addOnItems ?? [],
      },
    })

    return <PricingDrawerContent form={form} quoteType={quoteType} currency={currency} />
  }

  return render(<Wrapper />)
}

describe('PricingDrawerContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockUsePlansQuery.mockReturnValue({
      data: undefined,
      loading: false,
    })

    mockUseGetAddOnsForPricingSectionQuery.mockReturnValue({
      data: undefined,
      loading: false,
    })
  })

  describe('GIVEN the quote type is SubscriptionCreation', () => {
    describe('WHEN plans data is loaded', () => {
      it('THEN should render a plan combobox', () => {
        mockUsePlansQuery.mockReturnValue({
          data: {
            plans: {
              collection: [
                { id: 'plan-1', name: 'Basic', code: 'basic' },
                { id: 'plan-2', name: 'Pro', code: 'pro' },
              ],
            },
          },
          loading: false,
        })

        renderWithForm({ quoteType: OrderTypeEnum.SubscriptionCreation })

        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the quote type is SubscriptionAmendment', () => {
    describe('WHEN plans data is loaded', () => {
      it('THEN should render a plan combobox', () => {
        mockUsePlansQuery.mockReturnValue({
          data: {
            plans: {
              collection: [{ id: 'plan-1', name: 'Starter', code: 'starter' }],
            },
          },
          loading: false,
        })

        renderWithForm({ quoteType: OrderTypeEnum.SubscriptionAmendment })

        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the quote type is OneOff', () => {
    describe('WHEN add-ons data is loaded', () => {
      it('THEN should render an add-on button', () => {
        mockUseGetAddOnsForPricingSectionQuery.mockReturnValue({
          data: {
            addOns: {
              collection: [
                { id: 'addon-1', name: 'Setup Fee', code: 'setup_fee' },
                { id: 'addon-2', name: 'Support', code: 'support' },
              ],
            },
          },
          loading: false,
        })

        renderWithForm({ quoteType: OrderTypeEnum.OneOff })

        expect(screen.getByTestId('add-add-on-button')).toBeInTheDocument()
      })
    })

    describe('WHEN an add-on is provided via initial values', () => {
      it('THEN should render the add-on item card with units and unit price fields', () => {
        mockUseGetAddOnsForPricingSectionQuery.mockReturnValue({
          data: { addOns: { collection: [] } },
          loading: false,
        })

        renderWithForm({
          quoteType: OrderTypeEnum.OneOff,
          initialValues: {
            addOnItems: [
              {
                localId: 'local-1',
                addOnId: 'addon-1',
                name: 'Setup Fee',
                invoiceDisplayName: '',
                code: 'setup_fee',
                description: '',
                units: '1',
                unitAmountCents: '50',
                totalAmount: '',
                fromDatetime: '2026-05-28T00:00:00.000+02:00',
                toDatetime: '2026-05-28T23:59:59.999+02:00',
              },
            ],
          },
        })

        expect(screen.getByTestId('add-on-item-0')).toBeInTheDocument()
        expect(screen.getByText('Setup Fee')).toBeInTheDocument()
      })
    })

    describe('WHEN the remove button is clicked via popper menu', () => {
      it('THEN should remove the add-on item', async () => {
        mockUseGetAddOnsForPricingSectionQuery.mockReturnValue({
          data: { addOns: { collection: [] } },
          loading: false,
        })

        renderWithForm({
          quoteType: OrderTypeEnum.OneOff,
          initialValues: {
            addOnItems: [
              {
                localId: 'local-1',
                addOnId: 'addon-1',
                name: 'Setup Fee',
                invoiceDisplayName: '',
                code: 'setup_fee',
                description: '',
                units: '1',
                unitAmountCents: '50',
                totalAmount: '',
                fromDatetime: '2026-05-28T00:00:00.000+02:00',
                toDatetime: '2026-05-28T23:59:59.999+02:00',
              },
            ],
          },
        })

        expect(screen.getByTestId('add-on-item-0')).toBeInTheDocument()

        // Open the popper menu
        await userEvent.click(screen.getByTestId('add-on-actions-0'))
        // Click the delete button
        await userEvent.click(screen.getByText('text_63aa085d28b8510cd46443ff'))

        expect(screen.queryByTestId('add-on-item-0')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the query configuration', () => {
    it('THEN should fetch plans with correct options for subscription creation', () => {
      mockUsePlansQuery.mockReturnValue({
        data: { plans: { collection: [] } },
        loading: false,
      })

      renderWithForm({ quoteType: OrderTypeEnum.SubscriptionCreation })

      expect(mockUsePlansQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { limit: 100 },
          fetchPolicy: 'network-only',
          nextFetchPolicy: 'network-only',
        }),
      )
    })

    it('THEN should not call plans query for one-off quote type', () => {
      mockUseGetAddOnsForPricingSectionQuery.mockReturnValue({
        data: { addOns: { collection: [] } },
        loading: false,
      })

      renderWithForm({ quoteType: OrderTypeEnum.OneOff })

      expect(mockUsePlansQuery).not.toHaveBeenCalled()
    })

    it('THEN should fetch add-ons with correct options for one-off quote type', () => {
      mockUseGetAddOnsForPricingSectionQuery.mockReturnValue({
        data: { addOns: { collection: [] } },
        loading: false,
      })

      renderWithForm({ quoteType: OrderTypeEnum.OneOff })

      expect(mockUseGetAddOnsForPricingSectionQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { limit: 100 },
          fetchPolicy: 'network-only',
          nextFetchPolicy: 'network-only',
        }),
      )
    })

    it('THEN should not call add-ons query for subscription creation quote type', () => {
      mockUsePlansQuery.mockReturnValue({
        data: { plans: { collection: [] } },
        loading: false,
      })

      renderWithForm({ quoteType: OrderTypeEnum.SubscriptionCreation })

      expect(mockUseGetAddOnsForPricingSectionQuery).not.toHaveBeenCalled()
    })
  })
})
