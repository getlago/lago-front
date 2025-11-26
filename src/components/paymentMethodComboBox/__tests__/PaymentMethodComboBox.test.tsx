import { act, screen, waitFor } from '@testing-library/react'

import { ComboBox } from '~/components/form'
import { SelectedPaymentMethod } from '~/components/paymentMethodComboBox/types'
import { PaymentMethodsDocument, PaymentMethodTypeEnum } from '~/generated/graphql'
import { createMockPaymentMethodsQueryResponse } from '~/hooks/customer/__tests__/factories/PaymentMethod.factory'
import { render } from '~/test-utils'

import { PaymentMethodComboBox } from '../PaymentMethodComboBox'

jest.mock('~/components/form', () => ({
  ...jest.requireActual('~/components/form'),
  ComboBox: jest.fn((props) => {
    const { ComboBox: ActualComboBox } = jest.requireActual('~/components/form')

    return <ActualComboBox {...props} />
  }),
}))

const mockComboBox = jest.mocked(ComboBox)

const EXTERNAL_CUSTOMER_ID = 'customer_ext_123'

const TestWrapper = ({
  initialPaymentMethod,
  children,
}: {
  initialPaymentMethod?: SelectedPaymentMethod
  children: (props: {
    selectedPaymentMethod: SelectedPaymentMethod
    setSelectedPaymentMethod: (value: SelectedPaymentMethod) => void
  }) => React.ReactNode
}) => {
  let currentPaymentMethod: SelectedPaymentMethod = initialPaymentMethod

  const setSelectedPaymentMethod = jest.fn((value: SelectedPaymentMethod) => {
    currentPaymentMethod = value
  })

  return (
    <>
      {children({
        selectedPaymentMethod: currentPaymentMethod,
        setSelectedPaymentMethod,
      })}
    </>
  )
}

describe('PaymentMethodComboBox', () => {
  describe('WHEN handling disabled state', () => {
    it('THEN disables ComboBox when externalDisabled prop is true', async () => {
      await act(() =>
        render(
          <TestWrapper>
            {({ selectedPaymentMethod, setSelectedPaymentMethod }) => (
              <PaymentMethodComboBox
                externalCustomerId={EXTERNAL_CUSTOMER_ID}
                title="Payment Method"
                description="Select a payment method"
                disabled={true}
                selectedPaymentMethod={selectedPaymentMethod}
                setSelectedPaymentMethod={setSelectedPaymentMethod}
              />
            )}
          </TestWrapper>,
        ),
      )

      await waitFor(() => {
        const combobox = screen.getByRole('combobox')

        expect(combobox).toBeDisabled()
      })
    })
  })

  describe('WHEN handling combobox value', () => {
    it('THEN sets value to paymentMethodId when paymentMethodId from selectedPaymentMethod is present', async () => {
      const paymentMethodId = 'pm_123'

      await act(() =>
        render(
          <TestWrapper
            initialPaymentMethod={{
              paymentMethodId,
              paymentMethodType: PaymentMethodTypeEnum.Provider,
            }}
          >
            {({ selectedPaymentMethod, setSelectedPaymentMethod }) => (
              <PaymentMethodComboBox
                externalCustomerId={EXTERNAL_CUSTOMER_ID}
                title="Payment Method"
                description="Select a payment method"
                selectedPaymentMethod={selectedPaymentMethod}
                setSelectedPaymentMethod={setSelectedPaymentMethod}
              />
            )}
          </TestWrapper>,
        ),
      )

      await waitFor(() => {
        const combobox = screen.getByRole('combobox')

        expect(combobox).toHaveValue(paymentMethodId)
      })
    })

    it('THEN sets value to "manual" when paymentMethodType is Manual without paymentMethodId from selectedPaymentMethod', async () => {
      const mockPaymentMethodsResponse = createMockPaymentMethodsQueryResponse()

      await act(() =>
        render(
          <TestWrapper
            initialPaymentMethod={{
              paymentMethodType: PaymentMethodTypeEnum.Manual,
            }}
          >
            {({ selectedPaymentMethod, setSelectedPaymentMethod }) => (
              <PaymentMethodComboBox
                externalCustomerId={EXTERNAL_CUSTOMER_ID}
                title="Payment Method"
                description="Select a payment method"
                selectedPaymentMethod={selectedPaymentMethod}
                setSelectedPaymentMethod={setSelectedPaymentMethod}
              />
            )}
          </TestWrapper>,
          {
            mocks: [
              {
                request: {
                  query: PaymentMethodsDocument,
                  variables: { externalCustomerId: EXTERNAL_CUSTOMER_ID },
                },
                result: {
                  data: mockPaymentMethodsResponse,
                },
              },
            ],
          },
        ),
      )

      expect(mockComboBox).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 'manual',
        }),
        expect.any(Object),
      )
    })

    it('THEN sets value to empty string when paymentMethod is undefined', async () => {
      await act(() =>
        render(
          <TestWrapper>
            {({ selectedPaymentMethod, setSelectedPaymentMethod }) => (
              <PaymentMethodComboBox
                externalCustomerId={EXTERNAL_CUSTOMER_ID}
                title="Payment Method"
                description="Select a payment method"
                selectedPaymentMethod={selectedPaymentMethod}
                setSelectedPaymentMethod={setSelectedPaymentMethod}
              />
            )}
          </TestWrapper>,
        ),
      )

      await waitFor(() => {
        const combobox = screen.getByRole('combobox')

        expect(combobox).toHaveValue('')
      })
    })
  })
})
