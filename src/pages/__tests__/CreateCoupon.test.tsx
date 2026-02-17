import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  CouponExpiration,
  CouponFrequency,
  CouponTypeEnum,
  CurrencyEnum,
} from '~/generated/graphql'
// Import after mocks
import { useCreateEditCoupon } from '~/hooks/useCreateEditCoupon'
import { render } from '~/test-utils'

import CreateCoupon, {
  COUPON_AMOUNT_INPUT_TEST_ID,
  COUPON_CODE_INPUT_TEST_ID,
  COUPON_DESCRIPTION_INPUT_TEST_ID,
  COUPON_NAME_INPUT_TEST_ID,
  COUPONS_FORM_ID,
} from '../CreateCoupon'

const mockNavigate = jest.fn()
const mockOnSave = jest.fn()

// Must use "mock" prefix for variables referenced in jest.mock
const mockDefaultUseCreateEditCoupon = {
  isEdition: false,
  loading: false,
  coupon: undefined,
  errorCode: undefined,
  onSave: mockOnSave,
}

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    organization: {
      id: 'org-1',
      defaultCurrency: 'USD',
      timezone: 'UTC',
    },
  }),
}))

jest.mock('~/hooks/useCreateEditCoupon', () => ({
  useCreateEditCoupon: jest.fn(() => mockDefaultUseCreateEditCoupon),
}))

// Mock the dialog components
jest.mock('~/components/coupons/AddPlanToCouponDialog', () => ({
  AddPlanToCouponDialog: jest.fn(() => null),
}))

jest.mock('~/components/coupons/AddBillableMetricToCouponDialog', () => ({
  AddBillableMetricToCouponDialog: jest.fn(() => null),
}))

jest.mock('~/components/coupons/CouponCodeSnippet', () => ({
  CouponCodeSnippet: jest.fn(() => <div data-test="coupon-code-snippet">Code Snippet</div>),
}))

jest.mock('~/components/designSystem/WarningDialog', () => ({
  WarningDialog: jest.fn(() => null),
}))

const mockedUseCreateEditCoupon = useCreateEditCoupon as jest.Mock

describe('CreateCoupon', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseCreateEditCoupon.mockReturnValue(mockDefaultUseCreateEditCoupon)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN the component is rendered in create mode', () => {
    describe('WHEN the page loads', () => {
      it('THEN should display the form', () => {
        render(<CreateCoupon />)

        const form = document.getElementById(COUPONS_FORM_ID)

        expect(form).toBeInTheDocument()
      })

      it('THEN should display the code snippet component', () => {
        render(<CreateCoupon />)

        expect(screen.getByTestId('coupon-code-snippet')).toBeInTheDocument()
      })

      it('THEN should display the name input field', () => {
        render(<CreateCoupon />)

        const nameInputContainer = screen.getByTestId(COUPON_NAME_INPUT_TEST_ID)
        const nameInput = nameInputContainer.querySelector('input')

        expect(nameInput).toBeInTheDocument()
      })

      it('THEN should display the code input field', () => {
        render(<CreateCoupon />)

        const codeInputContainer = screen.getByTestId(COUPON_CODE_INPUT_TEST_ID)
        const codeInput = codeInputContainer.querySelector('input')

        expect(codeInput).toBeInTheDocument()
      })

      it('THEN should display the submit button', () => {
        render(<CreateCoupon />)

        expect(screen.getByTestId('submit')).toBeInTheDocument()
      })
    })

    describe('WHEN the page is loading', () => {
      it('THEN should not display form fields', () => {
        mockedUseCreateEditCoupon.mockReturnValue({
          ...mockDefaultUseCreateEditCoupon,
          loading: true,
        })

        render(<CreateCoupon />)

        // When loading, form input fields should not be displayed
        expect(screen.queryByTestId(COUPON_NAME_INPUT_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the component is rendered in edit mode', () => {
    const mockCoupon = {
      id: 'coupon-1',
      name: 'Test Coupon',
      code: 'TEST_COUPON',
      description: 'A test coupon',
      couponType: CouponTypeEnum.FixedAmount,
      amountCents: 1000,
      amountCurrency: CurrencyEnum.Usd,
      percentageRate: undefined,
      frequency: CouponFrequency.Once,
      frequencyDuration: undefined,
      reusable: true,
      expiration: CouponExpiration.NoExpiration,
      expirationAt: undefined,
      appliedCouponsCount: 0,
      plans: [],
      billableMetrics: [],
    }

    describe('WHEN editing an existing coupon', () => {
      it('THEN should populate the name field with coupon name', () => {
        mockedUseCreateEditCoupon.mockReturnValue({
          ...mockDefaultUseCreateEditCoupon,
          isEdition: true,
          coupon: mockCoupon,
        })

        render(<CreateCoupon />)

        const nameInputContainer = screen.getByTestId(COUPON_NAME_INPUT_TEST_ID)
        const nameInput = nameInputContainer.querySelector('input') as HTMLInputElement

        expect(nameInput).toHaveValue('Test Coupon')
      })

      it('THEN should populate the code field with coupon code', () => {
        mockedUseCreateEditCoupon.mockReturnValue({
          ...mockDefaultUseCreateEditCoupon,
          isEdition: true,
          coupon: mockCoupon,
        })

        render(<CreateCoupon />)

        const codeInputContainer = screen.getByTestId(COUPON_CODE_INPUT_TEST_ID)
        const codeInput = codeInputContainer.querySelector('input') as HTMLInputElement

        expect(codeInput).toHaveValue('TEST_COUPON')
      })
    })

    describe('WHEN coupon has been applied', () => {
      it('THEN should disable the code field', () => {
        mockedUseCreateEditCoupon.mockReturnValue({
          ...mockDefaultUseCreateEditCoupon,
          isEdition: true,
          coupon: {
            ...mockCoupon,
            appliedCouponsCount: 5,
          },
        })

        render(<CreateCoupon />)

        const codeInputContainer = screen.getByTestId(COUPON_CODE_INPUT_TEST_ID)
        const codeInput = codeInputContainer.querySelector('input')

        expect(codeInput).toBeDisabled()
      })
    })
  })

  describe('GIVEN form interactions', () => {
    describe('WHEN user clicks the add description button', () => {
      it('THEN should show the description textarea', async () => {
        const user = userEvent.setup()

        render(<CreateCoupon />)

        // Initially, description textarea should not be visible
        expect(screen.queryByTestId(COUPON_DESCRIPTION_INPUT_TEST_ID)).not.toBeInTheDocument()

        // Click the add description button
        const addDescriptionButton = screen.getByTestId('show-description')

        await user.click(addDescriptionButton)

        // Now description textarea should be visible
        await waitFor(() => {
          const descriptionContainer = screen.getByTestId(COUPON_DESCRIPTION_INPUT_TEST_ID)
          const descriptionTextarea = descriptionContainer.querySelector('textarea')

          expect(descriptionTextarea).toBeInTheDocument()
        })
      })
    })
  })

  describe('GIVEN coupon type selection', () => {
    describe('WHEN FixedAmount is selected by default', () => {
      it('THEN should display amount input field', () => {
        render(<CreateCoupon />)

        const amountInputContainer = screen.getByTestId(COUPON_AMOUNT_INPUT_TEST_ID)
        const amountInput = amountInputContainer.querySelector('input')

        expect(amountInput).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the settings section', () => {
    describe('WHEN the settings section is displayed', () => {
      it('THEN should show the reusable checkbox', () => {
        render(<CreateCoupon />)

        expect(screen.getByTestId('checkbox-isReusable')).toBeInTheDocument()
      })

      it('THEN should show the expiration checkbox', () => {
        render(<CreateCoupon />)

        expect(screen.getByTestId('checkbox-hasLimit')).toBeInTheDocument()
      })

      it('THEN should show the plan/billable metric limit checkbox', () => {
        render(<CreateCoupon />)

        expect(screen.getByTestId('checkbox-hasPlanOrBillableMetricLimit')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the submit button', () => {
    describe('WHEN in create mode', () => {
      it('THEN should display the submit button', () => {
        render(<CreateCoupon />)

        expect(screen.getByTestId('submit')).toBeInTheDocument()
      })
    })

    describe('WHEN in edit mode', () => {
      it('THEN should display the submit button', () => {
        mockedUseCreateEditCoupon.mockReturnValue({
          ...mockDefaultUseCreateEditCoupon,
          isEdition: true,
          coupon: {
            id: 'coupon-1',
            name: 'Test',
            code: 'TEST',
            couponType: CouponTypeEnum.FixedAmount,
            amountCents: 1000,
            amountCurrency: CurrencyEnum.Usd,
            frequency: CouponFrequency.Once,
            reusable: true,
            expiration: CouponExpiration.NoExpiration,
            appliedCouponsCount: 0,
            plans: [],
            billableMetrics: [],
          },
        })

        render(<CreateCoupon />)

        expect(screen.getByTestId('submit')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN COUPONS_FORM_ID export', () => {
    describe('WHEN importing the constant', () => {
      it('THEN should have the correct value', () => {
        expect(COUPONS_FORM_ID).toBe('coupon-form')
      })
    })
  })

  describe('GIVEN form submission', () => {
    describe('WHEN user fills required fields and submits the form', () => {
      it('THEN should call onSave with correct form data', async () => {
        const user = userEvent.setup()

        render(<CreateCoupon />)

        // Fill in the name field
        const nameInputContainer = screen.getByTestId(COUPON_NAME_INPUT_TEST_ID)
        const nameInput = nameInputContainer.querySelector('input') as HTMLInputElement

        await user.type(nameInput, 'My Test Coupon')

        // Fill in the code field (auto-generated from name, but let's set it explicitly)
        const codeInputContainer = screen.getByTestId(COUPON_CODE_INPUT_TEST_ID)
        const codeInput = codeInputContainer.querySelector('input') as HTMLInputElement

        await user.clear(codeInput)
        await user.type(codeInput, 'MY_TEST_COUPON')

        // Fill in the amount field
        const amountInputContainer = screen.getByTestId(COUPON_AMOUNT_INPUT_TEST_ID)
        const amountInput = amountInputContainer.querySelector('input') as HTMLInputElement

        await user.type(amountInput, '50')

        // Submit the form
        const submitButton = screen.getByTestId('submit')

        await user.click(submitButton)

        // Verify onSave was called with the correct data
        await waitFor(() => {
          expect(mockOnSave).toHaveBeenCalledTimes(1)
          expect(mockOnSave).toHaveBeenCalledWith(
            expect.objectContaining({
              name: 'My Test Coupon',
              code: 'MY_TEST_COUPON',
              amountCents: '50',
              couponType: CouponTypeEnum.FixedAmount,
              frequency: CouponFrequency.Once,
              expiration: CouponExpiration.NoExpiration,
              reusable: true,
            }),
          )
        })
      })
    })
  })
})
