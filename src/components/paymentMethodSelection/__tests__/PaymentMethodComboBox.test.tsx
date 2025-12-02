import { ComboBox } from '~/components/form'
import { PaymentMethodTypeEnum } from '~/generated/graphql'
import { createMockPaymentMethod } from '~/hooks/customer/__tests__/factories/PaymentMethod.factory'
import { PaymentMethodList } from '~/hooks/customer/usePaymentMethodsList'
import { render } from '~/test-utils'

import { PaymentMethodComboBox } from '../PaymentMethodComboBox'

jest.mock('~/components/form', () => ({
  ...jest.requireActual('~/components/form'),
  ComboBox: jest.fn(() => null),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
    locale: 'en',
  }),
}))

const mockComboBox = jest.mocked(ComboBox)
const mockSetSelectedPaymentMethod = jest.fn()

const paymentMethod1 = createMockPaymentMethod({
  id: 'pm_001',
  isDefault: true,
  details: {
    __typename: 'PaymentMethodDetails',
    brand: 'visa',
    last4: '4242',
    type: 'card',
    expirationMonth: '12',
    expirationYear: '2025',
  },
})

const paymentMethod2 = createMockPaymentMethod({
  id: 'pm_002',
  isDefault: false,
  details: {
    __typename: 'PaymentMethodDetails',
    brand: 'mastercard',
    last4: '8888',
    type: 'card',
    expirationMonth: '06',
    expirationYear: '2026',
  },
})

type PrepareType = {
  paymentMethodsList?: PaymentMethodList
  selectedPaymentMethod?: {
    paymentMethodId: string
    paymentMethodType: PaymentMethodTypeEnum
  } | null
  disabled?: boolean
}

function prepare({
  paymentMethodsList = [paymentMethod1, paymentMethod2],
  selectedPaymentMethod,
  disabled = false,
}: PrepareType = {}) {
  return render(
    <PaymentMethodComboBox
      paymentMethodsList={paymentMethodsList}
      selectedPaymentMethod={selectedPaymentMethod}
      setSelectedPaymentMethod={mockSetSelectedPaymentMethod}
      disabled={disabled}
    />,
  )
}

describe('PaymentMethodComboBox', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('WHEN onChange is called with a valid payment method id', () => {
    it('THEN calls setSelectedPaymentMethod with correct paymentMethodId and paymentMethodType', () => {
      prepare()

      // Get the onChange function that was passed to ComboBox
      const comboboxCall = mockComboBox.mock.calls[0]
      const onChange = comboboxCall[0]?.onChange

      expect(onChange).toBeDefined()

      // Simulate selecting pm_001
      onChange?.('pm_001')

      expect(mockSetSelectedPaymentMethod).toHaveBeenCalledWith({
        paymentMethodId: 'pm_001',
        paymentMethodType: PaymentMethodTypeEnum.Provider,
      })
    })

    it('THEN calls setSelectedPaymentMethod with correct values for different payment method', () => {
      prepare()

      const comboboxCall = mockComboBox.mock.calls[0]
      const onChange = comboboxCall[0]?.onChange

      expect(onChange).toBeDefined()

      // Simulate selecting pm_002
      onChange?.('pm_002')

      expect(mockSetSelectedPaymentMethod).toHaveBeenCalledWith({
        paymentMethodId: 'pm_002',
        paymentMethodType: PaymentMethodTypeEnum.Provider,
      })
    })
  })
})
