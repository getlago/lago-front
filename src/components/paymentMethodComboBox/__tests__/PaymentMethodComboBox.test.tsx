import { act, screen, waitFor } from '@testing-library/react'
import { FormikProps, useFormik } from 'formik'

import { ComboBox } from '~/components/form'
import { BillingTimeEnum, PaymentMethodsDocument, PaymentMethodTypeEnum } from '~/generated/graphql'
import { createMockPaymentMethodsQueryResponse } from '~/hooks/customer/__tests__/factories/PaymentMethod.factory'
import { SubscriptionFormInput } from '~/pages/subscriptions/types'
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
  initialPaymentMethod?: SubscriptionFormInput['paymentMethod']
  children: (formikProps: FormikProps<SubscriptionFormInput>) => React.ReactNode
}) => {
  const formikProps = useFormik<SubscriptionFormInput>({
    initialValues: {
      planId: '',
      name: '',
      externalId: '',
      subscriptionAt: '',
      endingAt: undefined,
      billingTime: BillingTimeEnum.Calendar,
      paymentMethod: initialPaymentMethod,
    },
    onSubmit: () => {},
  })

  return <>{children(formikProps)}</>
}

describe('PaymentMethodComboBox', () => {
  describe('WHEN handling disabled state', () => {
    it('THEN disables ComboBox when externalDisabled prop is true', async () => {
      await act(() =>
        render(
          <TestWrapper>
            {(formikProps) => (
              <PaymentMethodComboBox
                externalCustomerId={EXTERNAL_CUSTOMER_ID}
                label="Payment Method"
                disabled={true}
                formikProps={formikProps}
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
    it('THEN sets value to paymentMethodId when paymentMethodId from formikProps is present', async () => {
      const paymentMethodId = 'pm_123'

      await act(() =>
        render(
          <TestWrapper
            initialPaymentMethod={{
              paymentMethodId,
              paymentMethodType: PaymentMethodTypeEnum.Provider,
            }}
          >
            {(formikProps) => (
              <PaymentMethodComboBox
                externalCustomerId={EXTERNAL_CUSTOMER_ID}
                label="Payment Method"
                formikProps={formikProps}
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

    it('THEN sets value to "manual" when paymentMethodType is Manual without paymentMethodId from formikProps', async () => {
      const mockPaymentMethodsResponse = createMockPaymentMethodsQueryResponse()
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      let formikPropsRef: FormikProps<SubscriptionFormInput> | null = null

      await act(() =>
        render(
          <TestWrapper
            initialPaymentMethod={{
              paymentMethodType: PaymentMethodTypeEnum.Manual,
            }}
          >
            {(formikProps) => {
              formikPropsRef = formikProps

              return (
                <PaymentMethodComboBox
                  externalCustomerId={EXTERNAL_CUSTOMER_ID}
                  label="Payment Method"
                  formikProps={formikProps}
                />
              )
            }}
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
            {(formikProps) => (
              <PaymentMethodComboBox
                externalCustomerId={EXTERNAL_CUSTOMER_ID}
                label="Payment Method"
                formikProps={formikProps}
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
