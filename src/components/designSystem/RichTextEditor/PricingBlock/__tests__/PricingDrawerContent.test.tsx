import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CurrencyEnum, OrderTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import PricingDrawerContent from '../PricingDrawerContent'

const mockUsePlansQuery = jest.fn()
const mockUseGetAddOnsForFixedChargesSectionQuery = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  usePlansQuery: (...args: unknown[]) => mockUsePlansQuery(...args),
  useGetAddOnsForFixedChargesSectionQuery: (...args: unknown[]) =>
    mockUseGetAddOnsForFixedChargesSectionQuery(...args),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockOnChangeSelection = jest.fn()

const defaultProps = {
  currency: CurrencyEnum.Usd,
  onChangeSelection: mockOnChangeSelection,
}

describe('PricingDrawerContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockUsePlansQuery.mockReturnValue({
      data: undefined,
      loading: false,
    })

    mockUseGetAddOnsForFixedChargesSectionQuery.mockReturnValue({
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

        render(
          <PricingDrawerContent {...defaultProps} quoteType={OrderTypeEnum.SubscriptionCreation} />,
        )

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

        render(
          <PricingDrawerContent
            {...defaultProps}
            quoteType={OrderTypeEnum.SubscriptionAmendment}
          />,
        )

        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the quote type is OneOff', () => {
    describe('WHEN add-ons data is loaded', () => {
      it('THEN should render an add-on combobox', () => {
        mockUseGetAddOnsForFixedChargesSectionQuery.mockReturnValue({
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

        render(<PricingDrawerContent {...defaultProps} quoteType={OrderTypeEnum.OneOff} />)

        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })

    describe('WHEN an add-on is selected via initialAddOnItems', () => {
      it('THEN should render the add-on item card with units and unit price fields', () => {
        mockUseGetAddOnsForFixedChargesSectionQuery.mockReturnValue({
          data: { addOns: { collection: [] } },
          loading: false,
        })

        render(
          <PricingDrawerContent
            {...defaultProps}
            quoteType={OrderTypeEnum.OneOff}
            initialAddOnItems={[
              {
                addOnId: 'addon-1',
                name: 'Setup Fee',
                code: 'setup_fee',
                units: '1',
                unitAmountCents: '50',
              },
            ]}
          />,
        )

        expect(screen.getByTestId('add-on-item-0')).toBeInTheDocument()
        expect(screen.getByText('Setup Fee')).toBeInTheDocument()
        expect(screen.getByText('setup_fee')).toBeInTheDocument()
      })
    })

    describe('WHEN the remove button is clicked', () => {
      it('THEN should remove the add-on item', async () => {
        mockUseGetAddOnsForFixedChargesSectionQuery.mockReturnValue({
          data: { addOns: { collection: [] } },
          loading: false,
        })

        render(
          <PricingDrawerContent
            {...defaultProps}
            quoteType={OrderTypeEnum.OneOff}
            initialAddOnItems={[
              {
                addOnId: 'addon-1',
                name: 'Setup Fee',
                code: 'setup_fee',
                units: '1',
                unitAmountCents: '50',
              },
            ]}
          />,
        )

        expect(screen.getByTestId('add-on-item-0')).toBeInTheDocument()

        await act(async () => {
          await userEvent.click(screen.getByTestId('remove-add-on-0'))
        })

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

      render(
        <PricingDrawerContent {...defaultProps} quoteType={OrderTypeEnum.SubscriptionCreation} />,
      )

      expect(mockUsePlansQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { limit: 100 },
          fetchPolicy: 'network-only',
          nextFetchPolicy: 'network-only',
          skip: false,
        }),
      )
    })

    it('THEN should skip plans query for one-off quote type', () => {
      mockUseGetAddOnsForFixedChargesSectionQuery.mockReturnValue({
        data: { addOns: { collection: [] } },
        loading: false,
      })

      render(<PricingDrawerContent {...defaultProps} quoteType={OrderTypeEnum.OneOff} />)

      expect(mockUsePlansQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: true,
        }),
      )
    })

    it('THEN should fetch add-ons with correct options for one-off quote type', () => {
      mockUseGetAddOnsForFixedChargesSectionQuery.mockReturnValue({
        data: { addOns: { collection: [] } },
        loading: false,
      })

      render(<PricingDrawerContent {...defaultProps} quoteType={OrderTypeEnum.OneOff} />)

      expect(mockUseGetAddOnsForFixedChargesSectionQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { limit: 100 },
          fetchPolicy: 'network-only',
          nextFetchPolicy: 'network-only',
          skip: false,
        }),
      )
    })

    it('THEN should skip add-ons query for subscription creation quote type', () => {
      mockUsePlansQuery.mockReturnValue({
        data: { plans: { collection: [] } },
        loading: false,
      })

      render(
        <PricingDrawerContent {...defaultProps} quoteType={OrderTypeEnum.SubscriptionCreation} />,
      )

      expect(mockUseGetAddOnsForFixedChargesSectionQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: true,
        }),
      )
    })
  })
})
