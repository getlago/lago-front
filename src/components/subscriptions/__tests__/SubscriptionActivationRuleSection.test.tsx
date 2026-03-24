import { screen, waitFor } from '@testing-library/react'
import { FormikProps } from 'formik'

import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { StatusTypeEnum } from '~/generated/graphql'
import { ActivationRuleFormEnum, SubscriptionFormInput } from '~/pages/subscriptions/types'
import { render } from '~/test-utils'

import {
  ACTIVATION_RULE_RADIO_GROUP_TEST_ID,
  SubscriptionActivationRuleSection,
} from '../SubscriptionActivationRuleSection'

const mockSetFieldValue = jest.fn()

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockUseDisplayedPaymentMethod = jest.fn()

jest.mock('~/components/paymentMethodSelection/useDisplayedPaymentMethod', () => ({
  useDisplayedPaymentMethod: (...args: unknown[]) => mockUseDisplayedPaymentMethod(...args),
}))

jest.mock('~/hooks/customer/usePaymentMethodsList', () => ({
  usePaymentMethodsList: () => ({ data: [] }),
}))

const createFormikProps = (
  overrides: Partial<SubscriptionFormInput> = {},
): FormikProps<SubscriptionFormInput> =>
  ({
    values: {
      activationRuleType: ActivationRuleFormEnum.Immediately,
      activationRuleTimeoutHours: '24',
      paymentMethod: {},
      ...overrides,
    },
    setFieldValue: mockSetFieldValue,
    handleBlur: jest.fn(),
    errors: {},
    touched: {},
  }) as unknown as FormikProps<SubscriptionFormInput>

type RenderProps = {
  formikProps?: FormikProps<SubscriptionFormInput>
  formType?: keyof typeof FORM_TYPE_ENUM
  subscriptionStatus?: StatusTypeEnum | null
  isManual?: boolean
}

const renderComponent = ({
  formikProps,
  formType = FORM_TYPE_ENUM.creation,
  subscriptionStatus,
  isManual = false,
}: RenderProps = {}) => {
  mockUseDisplayedPaymentMethod.mockReturnValue({
    paymentMethod: null,
    isManual,
    isInherited: false,
  })

  return render(
    <SubscriptionActivationRuleSection
      formikProps={formikProps ?? createFormikProps()}
      customerExternalId="customer-123"
      formType={formType}
      subscriptionStatus={subscriptionStatus}
    />,
  )
}

const getRadioInputs = () => {
  const container = screen.getByTestId(ACTIVATION_RULE_RADIO_GROUP_TEST_ID)

  return container.querySelectorAll('input[type="radio"]')
}

describe('SubscriptionActivationRuleSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the component is rendered in creation mode', () => {
    describe('WHEN in default state', () => {
      it('THEN should display the radio group with two options', () => {
        renderComponent()

        expect(screen.getByTestId(ACTIVATION_RULE_RADIO_GROUP_TEST_ID)).toBeInTheDocument()

        const radioInputs = getRadioInputs()

        expect(radioInputs).toHaveLength(2)
      })

      it('THEN should not display the timeout input', () => {
        renderComponent()

        expect(screen.queryByPlaceholderText('24')).not.toBeInTheDocument()
      })
    })

    describe('WHEN activation rule type is OnPayment', () => {
      it('THEN should display the timeout input', () => {
        renderComponent({
          formikProps: createFormikProps({
            activationRuleType: ActivationRuleFormEnum.OnPayment,
          }),
        })

        expect(screen.getByPlaceholderText('24')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the payment method is manual', () => {
    describe('WHEN the component renders', () => {
      it('THEN should reset activation rule type to Immediately', async () => {
        renderComponent({ isManual: true })

        await waitFor(() => {
          expect(mockSetFieldValue).toHaveBeenCalledWith(
            'activationRuleType',
            ActivationRuleFormEnum.Immediately,
          )
        })
      })

      it('THEN should disable the radio inputs', () => {
        renderComponent({ isManual: true })

        const radioInputs = getRadioInputs()

        radioInputs.forEach((input) => {
          expect(input).toBeDisabled()
        })
      })
    })
  })

  describe('GIVEN the payment method is not manual', () => {
    describe('WHEN the component renders', () => {
      it('THEN should not reset activation rule type', () => {
        renderComponent({ isManual: false })

        expect(mockSetFieldValue).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the form is in edition mode', () => {
    describe('WHEN subscription status is Pending', () => {
      it('THEN should enable the radio inputs', () => {
        renderComponent({
          formType: FORM_TYPE_ENUM.edition,
          subscriptionStatus: StatusTypeEnum.Pending,
        })

        const radioInputs = getRadioInputs()

        radioInputs.forEach((input) => {
          expect(input).not.toBeDisabled()
        })
      })
    })

    describe('WHEN subscription status is Active', () => {
      it('THEN should disable the radio inputs', () => {
        renderComponent({
          formType: FORM_TYPE_ENUM.edition,
          subscriptionStatus: StatusTypeEnum.Active,
        })

        const radioInputs = getRadioInputs()

        radioInputs.forEach((input) => {
          expect(input).toBeDisabled()
        })
      })
    })
  })

  describe('GIVEN the form is in upgradeDowngrade mode', () => {
    describe('WHEN the component renders', () => {
      it('THEN should enable the radio inputs', () => {
        renderComponent({
          formType: FORM_TYPE_ENUM.upgradeDowngrade,
        })

        const radioInputs = getRadioInputs()

        radioInputs.forEach((input) => {
          expect(input).not.toBeDisabled()
        })
      })
    })
  })
})
