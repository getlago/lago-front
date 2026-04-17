import { screen, waitFor } from '@testing-library/react'

import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { subscriptionFormDefaultValues } from '~/formValidation/subscriptionFormSchema'
import { StatusTypeEnum } from '~/generated/graphql'
import { ActivationRuleFormEnum } from '~/pages/subscriptions/types'
import { render } from '~/test-utils'

import {
  ACTIVATION_RULE_RADIO_GROUP_TEST_ID,
  SubscriptionActivationRuleSection,
} from '../SubscriptionActivationRuleSection'

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

// --- TanStack form harness ---

type FormValues = typeof subscriptionFormDefaultValues

const mockSetFieldValue = jest.fn()

let currentValues: FormValues = { ...subscriptionFormDefaultValues }

jest.mock('@tanstack/react-form', () => ({
  useStore: jest.fn((store: { getState: () => { values: FormValues } }, selector) => {
    return selector(store.getState())
  }),
}))

jest.mock('~/hooks/forms/useAppform', () => ({
  withForm:
    ({
      render: Render,
    }: {
      defaultValues: FormValues
      props: Record<string, unknown>
      render: React.FC<{ form: unknown; [key: string]: unknown }>
    }) =>
    (props: { form: unknown; [key: string]: unknown }) => <Render {...props} />,
}))

const createFakeForm = () => ({
  store: {
    getState: () => ({ values: currentValues }),
  },
  setFieldValue: (key: keyof FormValues, value: unknown) => {
    mockSetFieldValue(key, value)
    currentValues = { ...currentValues, [key]: value as never }
  },
  AppField: ({
    name,
    children,
  }: {
    name: keyof FormValues
    children: (field: {
      RadioGroupField: (p: {
        label: string
        disabled?: boolean
        options: Array<{ value: string; label: string; sublabel?: string }>
      }) => React.ReactNode
      TextInputField: (p: { placeholder?: string; disabled?: boolean }) => React.ReactNode
    }) => React.ReactNode
  }) => {
    const field = {
      RadioGroupField: ({
        disabled,
        options,
      }: {
        label: string
        disabled?: boolean
        options: Array<{ value: string; label: string; sublabel?: string }>
      }) => (
        <div>
          {options.map((opt) => (
            <input
              key={opt.value}
              type="radio"
              name={name as string}
              value={opt.value}
              disabled={disabled}
              defaultChecked={currentValues[name] === opt.value}
            />
          ))}
        </div>
      ),
      TextInputField: ({ placeholder, disabled }: { placeholder?: string; disabled?: boolean }) => (
        <input type="text" placeholder={placeholder} disabled={disabled} />
      ),
    }

    return <>{children(field as never)}</>
  },
})

type RenderProps = {
  values?: Partial<FormValues>
  formType?: keyof typeof FORM_TYPE_ENUM
  subscriptionStatus?: StatusTypeEnum | null
  isManual?: boolean
}

const renderComponent = ({
  values,
  formType = FORM_TYPE_ENUM.creation,
  subscriptionStatus,
  isManual = false,
}: RenderProps = {}) => {
  currentValues = { ...subscriptionFormDefaultValues, ...(values ?? {}) }

  mockUseDisplayedPaymentMethod.mockReturnValue({
    paymentMethod: null,
    isManual,
    isInherited: false,
  })

  return render(
    <SubscriptionActivationRuleSection
      form={createFakeForm() as never}
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
    currentValues = { ...subscriptionFormDefaultValues }
  })

  describe('GIVEN the component is rendered in creation mode', () => {
    describe('WHEN in default state', () => {
      it('THEN should display the radio group with two options', () => {
        renderComponent()

        expect(screen.getByTestId(ACTIVATION_RULE_RADIO_GROUP_TEST_ID)).toBeInTheDocument()
        expect(getRadioInputs()).toHaveLength(2)
      })

      it('THEN should not display the timeout input', () => {
        renderComponent()

        expect(screen.queryByPlaceholderText('24')).not.toBeInTheDocument()
      })
    })

    describe('WHEN activation rule type is OnPayment', () => {
      it('THEN should display the timeout input', () => {
        renderComponent({
          values: { activationRuleType: ActivationRuleFormEnum.OnPayment },
        })

        expect(screen.getByPlaceholderText('24')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the payment method is manual', () => {
    describe('WHEN the component renders', () => {
      it('THEN should reset activation rule type to Immediately', async () => {
        renderComponent({
          values: { activationRuleType: ActivationRuleFormEnum.OnPayment },
          isManual: true,
        })

        await waitFor(() => {
          expect(mockSetFieldValue).toHaveBeenCalledWith(
            'activationRuleType',
            ActivationRuleFormEnum.Immediately,
          )
        })
      })

      it('THEN should disable the radio inputs', () => {
        renderComponent({ isManual: true })

        getRadioInputs().forEach((input) => {
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

        getRadioInputs().forEach((input) => {
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

        getRadioInputs().forEach((input) => {
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

        getRadioInputs().forEach((input) => {
          expect(input).not.toBeDisabled()
        })
      })
    })
  })
})
