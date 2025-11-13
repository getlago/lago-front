import { act, screen, waitFor } from '@testing-library/react'

import { PaymentMethodsDocument } from '~/generated/graphql'
import { createMockPaymentMethodsQueryResponse } from '~/hooks/customer/__tests__/factories/PaymentMethod.factory'
import { render } from '~/test-utils'

import { PaymentMethodComboBox } from '../PaymentMethodComboBox'

const EXTERNAL_CUSTOMER_ID = 'customer_ext_123'

describe('PaymentMethodComboBox', () => {
  describe('WHEN handling disabled state', () => {
    it('THEN disables ComboBox when externalDisabled prop is true', async () => {
      const mockPaymentMethodsResponse = createMockPaymentMethodsQueryResponse()

      await act(() =>
        render(
          <PaymentMethodComboBox
            externalCustomerId={EXTERNAL_CUSTOMER_ID}
            label="Payment Method"
            disabled={true}
          />,
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

      await waitFor(() => {
        const combobox = screen.getByRole('combobox')

        expect(combobox).toBeDisabled()
      })
    })
  })
})
