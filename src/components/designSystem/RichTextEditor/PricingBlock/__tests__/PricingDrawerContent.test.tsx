import { screen } from '@testing-library/react'

import { OrderTypeEnum } from '~/generated/graphql'
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

const COMBO_BOX_FIELD_TEST_ID = 'combo-box-field'
const MULTIPLE_COMBO_BOX_FIELD_TEST_ID = 'multiple-combo-box-field'

jest.mock('~/hooks/forms/useAppform', () => ({
  withForm: ({
    render: Render,
  }: {
    defaultValues: unknown
    props: unknown
    render: React.FC<{ form: unknown; quoteType: OrderTypeEnum }>
  }) => Render,
}))

const mockForm = {
  AppField: ({
    children,
    name,
  }: {
    name: string
    children: (field: {
      ComboBoxField: React.FC<Record<string, unknown>>
      MultipleComboBoxField: React.FC<Record<string, unknown>>
    }) => React.ReactNode
  }) => {
    return (
      <>
        {children({
          ComboBoxField: (props: Record<string, unknown>) => (
            <div
              data-test={COMBO_BOX_FIELD_TEST_ID}
              data-loading={String(props.loading)}
              data-name={name}
            >
              {(props.data as Array<{ value: string; label: string }>)?.map((item) => (
                <div key={item.value}>{item.label}</div>
              ))}
            </div>
          ),
          MultipleComboBoxField: (props: Record<string, unknown>) => (
            <div
              data-test={MULTIPLE_COMBO_BOX_FIELD_TEST_ID}
              data-loading={String(props.loading)}
              data-name={name}
            >
              {(props.data as Array<{ value: string; label: string }>)?.map((item) => (
                <div key={item.value}>{item.label}</div>
              ))}
            </div>
          ),
        })}
      </>
    )
  },
} as unknown as Parameters<typeof PricingDrawerContent>[0]['form']

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
      it('THEN should display the combo box with plan options', () => {
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
          <PricingDrawerContent
            form={mockForm}
            quoteType={OrderTypeEnum.SubscriptionCreation}
          />,
        )

        const comboBox = screen.getByTestId(COMBO_BOX_FIELD_TEST_ID)

        expect(comboBox).toBeInTheDocument()
        expect(comboBox).toHaveTextContent('Basic (basic)')
        expect(comboBox).toHaveTextContent('Pro (pro)')
      })
    })

    describe('WHEN plans data is loading', () => {
      it('THEN should pass loading state to the combo box', () => {
        mockUsePlansQuery.mockReturnValue({
          data: undefined,
          loading: true,
        })

        render(
          <PricingDrawerContent
            form={mockForm}
            quoteType={OrderTypeEnum.SubscriptionCreation}
          />,
        )

        const comboBox = screen.getByTestId(COMBO_BOX_FIELD_TEST_ID)

        expect(comboBox).toHaveAttribute('data-loading', 'true')
      })
    })

    describe('WHEN plans data is empty', () => {
      it('THEN should render combo box with no options', () => {
        mockUsePlansQuery.mockReturnValue({
          data: { plans: { collection: [] } },
          loading: false,
        })

        render(
          <PricingDrawerContent
            form={mockForm}
            quoteType={OrderTypeEnum.SubscriptionCreation}
          />,
        )

        const comboBox = screen.getByTestId(COMBO_BOX_FIELD_TEST_ID)

        expect(comboBox).toBeInTheDocument()
        expect(comboBox.children).toHaveLength(0)
      })
    })
  })

  describe('GIVEN the quote type is SubscriptionAmendment', () => {
    describe('WHEN plans data is loaded', () => {
      it('THEN should also display the combo box with plan options', () => {
        mockUsePlansQuery.mockReturnValue({
          data: {
            plans: {
              collection: [
                { id: 'plan-1', name: 'Starter', code: 'starter' },
              ],
            },
          },
          loading: false,
        })

        render(
          <PricingDrawerContent
            form={mockForm}
            quoteType={OrderTypeEnum.SubscriptionAmendment}
          />,
        )

        const comboBox = screen.getByTestId(COMBO_BOX_FIELD_TEST_ID)

        expect(comboBox).toBeInTheDocument()
        expect(comboBox).toHaveTextContent('Starter (starter)')
      })
    })
  })

  describe('GIVEN the quote type is OneOff', () => {
    describe('WHEN add-ons data is loaded', () => {
      it('THEN should display the multiple combo box with add-on options', () => {
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

        render(
          <PricingDrawerContent form={mockForm} quoteType={OrderTypeEnum.OneOff} />,
        )

        const multiComboBox = screen.getByTestId(MULTIPLE_COMBO_BOX_FIELD_TEST_ID)

        expect(multiComboBox).toBeInTheDocument()
        expect(multiComboBox).toHaveTextContent('Setup Fee (setup_fee)')
        expect(multiComboBox).toHaveTextContent('Support (support)')
      })
    })

    describe('WHEN add-ons data is loading', () => {
      it('THEN should pass loading state to the multiple combo box', () => {
        mockUseGetAddOnsForFixedChargesSectionQuery.mockReturnValue({
          data: undefined,
          loading: true,
        })

        render(
          <PricingDrawerContent form={mockForm} quoteType={OrderTypeEnum.OneOff} />,
        )

        const multiComboBox = screen.getByTestId(MULTIPLE_COMBO_BOX_FIELD_TEST_ID)

        expect(multiComboBox).toHaveAttribute('data-loading', 'true')
      })
    })

    describe('WHEN add-ons data is empty', () => {
      it('THEN should render multiple combo box with no options', () => {
        mockUseGetAddOnsForFixedChargesSectionQuery.mockReturnValue({
          data: { addOns: { collection: [] } },
          loading: false,
        })

        render(
          <PricingDrawerContent form={mockForm} quoteType={OrderTypeEnum.OneOff} />,
        )

        const multiComboBox = screen.getByTestId(MULTIPLE_COMBO_BOX_FIELD_TEST_ID)

        expect(multiComboBox).toBeInTheDocument()
        expect(multiComboBox.children).toHaveLength(0)
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
        <PricingDrawerContent
          form={mockForm}
          quoteType={OrderTypeEnum.SubscriptionCreation}
        />,
      )

      expect(mockUsePlansQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { limit: 100 },
          fetchPolicy: 'network-only',
          nextFetchPolicy: 'network-only',
          notifyOnNetworkStatusChange: true,
          skip: false,
        }),
      )
    })

    it('THEN should skip plans query for one-off quote type', () => {
      mockUseGetAddOnsForFixedChargesSectionQuery.mockReturnValue({
        data: { addOns: { collection: [] } },
        loading: false,
      })

      render(
        <PricingDrawerContent form={mockForm} quoteType={OrderTypeEnum.OneOff} />,
      )

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

      render(
        <PricingDrawerContent form={mockForm} quoteType={OrderTypeEnum.OneOff} />,
      )

      expect(mockUseGetAddOnsForFixedChargesSectionQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { limit: 100 },
          fetchPolicy: 'network-only',
          nextFetchPolicy: 'network-only',
          notifyOnNetworkStatusChange: true,
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
        <PricingDrawerContent
          form={mockForm}
          quoteType={OrderTypeEnum.SubscriptionCreation}
        />,
      )

      expect(mockUseGetAddOnsForFixedChargesSectionQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: true,
        }),
      )
    })
  })
})
