import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import PlanBlockDrawerContent from '../PlanBlock/PlanBlockDrawerContent'

const mockUsePlansQuery = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  usePlansQuery: (...args: unknown[]) => mockUsePlansQuery(...args),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const COMBO_BOX_FIELD_TEST_ID = 'combo-box-field'

jest.mock('~/hooks/forms/useAppform', () => ({
  withForm: ({ render: Render }: { defaultValues: unknown; render: React.FC<{ form: unknown }> }) =>
    Render,
}))

const mockForm = {
  AppField: ({
    children,
  }: {
    name: string
    children: (field: { ComboBoxField: React.FC<Record<string, unknown>> }) => React.ReactNode
  }) => {
    return (
      <>
        {children({
          ComboBoxField: (props: Record<string, unknown>) => (
            <div data-test={COMBO_BOX_FIELD_TEST_ID} data-loading={String(props.loading)}>
              {(props.data as Array<{ value: string; label: string }>)?.map((item) => (
                <div key={item.value}>{item.label}</div>
              ))}
            </div>
          ),
        })}
      </>
    )
  },
} as unknown as Parameters<typeof PlanBlockDrawerContent>[0]['form']

describe('PlanBlockDrawerContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the drawer content is rendered', () => {
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

        render(<PlanBlockDrawerContent form={mockForm} />)

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

        render(<PlanBlockDrawerContent form={mockForm} />)

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

        render(<PlanBlockDrawerContent form={mockForm} />)

        const comboBox = screen.getByTestId(COMBO_BOX_FIELD_TEST_ID)

        expect(comboBox).toBeInTheDocument()
        expect(comboBox.children).toHaveLength(0)
      })
    })

    describe('WHEN plans data is null', () => {
      it('THEN should handle gracefully with empty options', () => {
        mockUsePlansQuery.mockReturnValue({
          data: null,
          loading: false,
        })

        render(<PlanBlockDrawerContent form={mockForm} />)

        const comboBox = screen.getByTestId(COMBO_BOX_FIELD_TEST_ID)

        expect(comboBox).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the query configuration', () => {
    it('THEN should fetch plans with limit 100 and network-only policy', () => {
      mockUsePlansQuery.mockReturnValue({
        data: { plans: { collection: [] } },
        loading: false,
      })

      render(<PlanBlockDrawerContent form={mockForm} />)

      expect(mockUsePlansQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { limit: 100 },
          fetchPolicy: 'network-only',
          nextFetchPolicy: 'network-only',
          notifyOnNetworkStatusChange: true,
        }),
      )
    })
  })
})
