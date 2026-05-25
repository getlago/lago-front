import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { OrderFormStatusEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import VoidOrderForm, {
  VOID_ORDER_FORM_ALERT_TEST_ID,
  VOID_ORDER_FORM_CANCEL_BUTTON_TEST_ID,
  VOID_ORDER_FORM_CLOSE_BUTTON_TEST_ID,
  VOID_ORDER_FORM_VOID_BUTTON_TEST_ID,
} from '../VoidOrderForm'

const mockGoBack = jest.fn()

jest.mock('~/hooks/core/useLocationHistory', () => ({
  useLocationHistory: () => ({
    goBack: mockGoBack,
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, vars?: Record<string, unknown>) => {
      if (vars) return `${key}:${JSON.stringify(vars)}`
      return key
    },
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    intlFormatDateTimeOrgaTZ: (date: string) => ({
      date: new Date(date).toLocaleDateString('en-US'),
    }),
  }),
}))

const mockUseGetOrderFormForVoidQuery = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetOrderFormForVoidQuery: (...args: unknown[]) => mockUseGetOrderFormForVoidQuery(...args),
}))

const mockOrderForm = {
  id: 'order-form-123',
  number: 'OF-2026-0001',
  status: OrderFormStatusEnum.Generated,
  createdAt: '2026-04-09T10:00:00Z',
  customer: {
    id: 'customer-001',
    name: 'Acme Corp',
  },
}

describe('VoidOrderForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

    useParamsMock.mockReturnValue({ orderFormId: 'order-form-123' })

    mockUseGetOrderFormForVoidQuery.mockReturnValue({
      data: { orderForm: mockOrderForm },
      loading: false,
      error: undefined,
    })
  })

  describe('GIVEN the page is rendered with an order form', () => {
    describe('WHEN in default state', () => {
      it('THEN should display the warning alert', () => {
        render(<VoidOrderForm />)

        expect(screen.getByTestId(VOID_ORDER_FORM_ALERT_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should display the void button', () => {
        render(<VoidOrderForm />)

        expect(screen.getByTestId(VOID_ORDER_FORM_VOID_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should display the cancel button', () => {
        render(<VoidOrderForm />)

        expect(screen.getByTestId(VOID_ORDER_FORM_CANCEL_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should display the close button', () => {
        render(<VoidOrderForm />)

        expect(screen.getByTestId(VOID_ORDER_FORM_CLOSE_BUTTON_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the close action', () => {
    describe('WHEN the close button is clicked', () => {
      it('THEN should call goBack with order forms list fallback', async () => {
        const user = userEvent.setup()

        render(<VoidOrderForm />)

        await user.click(screen.getByTestId(VOID_ORDER_FORM_CLOSE_BUTTON_TEST_ID))

        expect(mockGoBack).toHaveBeenCalledWith('/quotes/order-forms')
      })
    })

    describe('WHEN the cancel button is clicked', () => {
      it('THEN should call goBack with order forms list fallback', async () => {
        const user = userEvent.setup()

        render(<VoidOrderForm />)

        await user.click(screen.getByTestId(VOID_ORDER_FORM_CANCEL_BUTTON_TEST_ID))

        expect(mockGoBack).toHaveBeenCalledWith('/quotes/order-forms')
      })
    })
  })

  describe('GIVEN the page is loading', () => {
    describe('WHEN data is being fetched', () => {
      it('THEN should not display the alert', () => {
        mockUseGetOrderFormForVoidQuery.mockReturnValue({
          data: undefined,
          loading: true,
          error: undefined,
        })

        render(<VoidOrderForm />)

        expect(screen.queryByTestId(VOID_ORDER_FORM_ALERT_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN an error occurred', () => {
    describe('WHEN the error is displayed', () => {
      it('THEN should not show the void form', () => {
        mockUseGetOrderFormForVoidQuery.mockReturnValue({
          data: undefined,
          loading: false,
          error: new Error('Something went wrong'),
        })

        render(<VoidOrderForm />)

        expect(screen.queryByTestId(VOID_ORDER_FORM_VOID_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })
})
