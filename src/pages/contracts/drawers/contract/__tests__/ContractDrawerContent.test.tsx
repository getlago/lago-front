import { MockedResponse } from '@apollo/client/testing'
import { fireEvent, screen, waitFor } from '@testing-library/react'

import {
  GetCatalogPlansForContractDrawerDocument,
  GetCustomersForContractDrawerDocument,
  PaymentMethodTypeEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import {
  CONTRACT_DRAWER_REMOVE_EXTERNAL_ID_TEST_ID,
  CONTRACT_DRAWER_SHOW_EXTERNAL_ID_TEST_ID,
  CONTRACT_DRAWER_SHOW_NAME_TEST_ID,
  CONTRACT_FORM_DEFAULTS,
} from '../constants'
import { ContractDrawerContent } from '../ContractDrawerContent'

const mockBillingEntityPicker = jest.fn()
const mockPaymentSettingsSelector = jest.fn()

jest.mock('~/components/billingEntity/BillingEntityFormPicker', () => ({
  BillingEntityFormPicker: (props: Record<string, unknown>) => {
    mockBillingEntityPicker(props)
    return <div data-test="billing-entity-picker" />
  },
}))

jest.mock('~/components/paymentSettings/PaymentSettingsSelector', () => ({
  PaymentSettingsSelector: (props: Record<string, unknown>) => {
    mockPaymentSettingsSelector(props)
    return <div data-test="payment-settings-selector" />
  },
}))

jest.mock('../ContractInvoicingSettingsSection', () => ({
  ContractInvoicingSettingsSection: () => <div data-test="invoicing-settings-selector" />,
}))

jest.mock('~/components/purchaseOrder/PurchaseOrderFormBlock', () => ({
  PurchaseOrderFormBlock: () => <div data-test="purchase-order-form" />,
}))

const customersMock: MockedResponse = {
  request: {
    query: GetCustomersForContractDrawerDocument,
    variables: { limit: 50 },
  },
  result: {
    data: {
      customers: {
        collection: [
          {
            id: 'customer-1',
            displayName: 'Acme',
            externalId: 'customer-external-id',
            applicableTimezone: TimezoneEnum.TzUtc,
            billingEntity: { id: 'billing-entity-1' },
          },
        ],
      },
    },
  },
}

const plansMock: MockedResponse = {
  request: {
    query: GetCatalogPlansForContractDrawerDocument,
    variables: { limit: 50 },
  },
  result: {
    data: { catalogPlans: { collection: [] } },
  },
}

const Wrapper = () => {
  const form = useAppForm({
    defaultValues: {
      ...CONTRACT_FORM_DEFAULTS,
      externalCustomerId: 'customer-external-id',
    },
  })

  return (
    <>
      <button
        type="button"
        onClick={() => {
          form.setFieldValue('paymentMethod', {
            paymentMethodId: 'payment-method-1',
            paymentMethodType: PaymentMethodTypeEnum.Provider,
          })
          form.setFieldValue('externalCustomerId', '')
        }}
      >
        Clear customer
      </button>
      <ContractDrawerContent form={form} />
    </>
  )
}

describe('ContractDrawerContent', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders the supported settings and customer billing entity defaults', async () => {
    render(<Wrapper />, { mocks: [customersMock, plansMock] })

    expect(screen.getByTestId(CONTRACT_DRAWER_SHOW_EXTERNAL_ID_TEST_ID)).toBeEnabled()
    expect(screen.getByTestId('purchase-order-form')).toBeInTheDocument()
    expect(screen.getByTestId('invoicing-settings-selector')).toBeInTheDocument()
    expect(screen.getByTestId('payment-settings-selector')).toBeInTheDocument()

    await waitFor(() =>
      expect(mockBillingEntityPicker).toHaveBeenLastCalledWith(
        expect.objectContaining({
          value: 'billing-entity-1',
          label: 'Affiliated entity',
          helperText:
            'If not selected, this billing object will be linked to the customer’s default billing entity.',
        }),
      ),
    )
    expect(mockPaymentSettingsSelector).toHaveBeenLastCalledWith(
      expect.objectContaining({
        externalCustomerId: 'customer-external-id',
        disabled: false,
      }),
    )
  })

  it('reveals and removes the optional contract identity fields', async () => {
    render(<Wrapper />, { mocks: [customersMock, plansMock] })

    fireEvent.click(screen.getByTestId(CONTRACT_DRAWER_SHOW_EXTERNAL_ID_TEST_ID))
    expect(screen.getByPlaceholderText('Type a contract external id')).toBeInTheDocument()
    expect(
      screen.getByText(
        'ID used to define your own contract ID from your backend instead of using the one defined by Lago',
      ),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByTestId(CONTRACT_DRAWER_REMOVE_EXTERNAL_ID_TEST_ID))
    expect(screen.queryByPlaceholderText('Type a contract external id')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId(CONTRACT_DRAWER_SHOW_NAME_TEST_ID))
    expect(screen.getByPlaceholderText('Type a contract name')).toBeInTheDocument()
  })

  it('clears customer-dependent settings when the customer is cleared', async () => {
    render(<Wrapper />, { mocks: [customersMock, plansMock] })

    await waitFor(() =>
      expect(mockBillingEntityPicker).toHaveBeenLastCalledWith(
        expect.objectContaining({ value: 'billing-entity-1' }),
      ),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Clear customer' }))

    await waitFor(() =>
      expect(mockBillingEntityPicker).toHaveBeenLastCalledWith(
        expect.objectContaining({ value: undefined }),
      ),
    )
    expect(mockPaymentSettingsSelector).toHaveBeenLastCalledWith(
      expect.objectContaining({
        externalCustomerId: '',
        disabled: true,
        value: undefined,
      }),
    )
  })
})
