import { MockedResponse } from '@apollo/client/testing'
import { useStore } from '@tanstack/react-form'
import { fireEvent, screen, waitFor } from '@testing-library/react'

import {
  ContractStatusEnum,
  GetCatalogPlansForContractDrawerDocument,
  GetCustomersForContractDrawerDocument,
  PaymentMethodTypeEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import { contractForDrawerFixture } from './fixtures'

import {
  CONTRACT_DRAWER_CUSTOMER_COMBOBOX_TEST_ID,
  CONTRACT_DRAWER_PLAN_COMBOBOX_TEST_ID,
  CONTRACT_DRAWER_REMOVE_EXTERNAL_ID_TEST_ID,
  CONTRACT_DRAWER_SHOW_EXTERNAL_ID_TEST_ID,
  CONTRACT_DRAWER_SHOW_NAME_TEST_ID,
  CONTRACT_FORM_DEFAULTS,
  ContractDrawerCustomer,
  ContractFormValues,
} from '../constants'
import {
  CONTRACT_DRAWER_EXTERNAL_ID_INPUT_TEST_ID,
  ContractDrawerContent,
} from '../ContractDrawerContent'
import { CREATE_CONTRACT_FIELD_LOCKS, getContractFieldLocks } from '../fieldLocks'
import { mapContractToDrawerCustomer, mapContractToFormValues } from '../mapContractToFormValues'

const FORM_DIRTY_STATE_TEST_ID = 'form-dirty-state'
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

const Wrapper = ({ seededCustomer }: { seededCustomer?: ContractDrawerCustomer }) => {
  const defaultValues: ContractFormValues = {
    ...CONTRACT_FORM_DEFAULTS,
    externalCustomerId: 'customer-external-id',
    // Mirrors buildContractFormDefaults: production seeds billingEntityId from the
    // customer at the same time as externalCustomerId, never after.
    billingEntityId: seededCustomer?.billingEntityId,
  }
  const form = useAppForm({ defaultValues })
  const isDirty = useStore(form.store, (state) => state.isDirty)

  return (
    <>
      <span data-test={FORM_DIRTY_STATE_TEST_ID}>{isDirty ? 'dirty' : 'pristine'}</span>
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
      <ContractDrawerContent
        form={form}
        isEdit={false}
        fieldLocks={CREATE_CONTRACT_FIELD_LOCKS}
        seededCustomer={seededCustomer}
      />
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

  it('does not mark the form dirty once a seeded customer resolves from the loaded list', async () => {
    render(
      <Wrapper
        seededCustomer={{ externalId: 'customer-external-id', billingEntityId: 'billing-entity-1' }}
      />,
      { mocks: [customersMock, plansMock] },
    )

    await waitFor(() =>
      expect(mockBillingEntityPicker).toHaveBeenLastCalledWith(
        expect.objectContaining({ value: 'billing-entity-1' }),
      ),
    )
    expect(screen.getByTestId(FORM_DIRTY_STATE_TEST_ID)).toHaveTextContent('pristine')
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

const getInputByTestId = (testId: string): HTMLInputElement | null => {
  const element = screen.getByTestId(testId)

  if (element instanceof HTMLInputElement) return element

  return element.querySelector('input')
}

const EditWrapper = ({ status }: { status: ContractStatusEnum }) => {
  const contract = { ...contractForDrawerFixture, status }
  const form = useAppForm({ defaultValues: mapContractToFormValues(contract) })
  const isDirty = useStore(form.store, (state) => state.isDirty)

  return (
    <>
      <span data-test={FORM_DIRTY_STATE_TEST_ID}>{isDirty ? 'dirty' : 'pristine'}</span>
      <ContractDrawerContent
        form={form}
        isEdit
        fieldLocks={getContractFieldLocks(status)}
        seededCustomer={mapContractToDrawerCustomer(contract)}
        seededPlan={{ code: 'enterprise', name: 'Enterprise plan' }}
      />
    </>
  )
}

describe('ContractDrawerContent in edit mode', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows the external id as a locked input with no remove button', () => {
    render(<EditWrapper status={ContractStatusEnum.Pending} />, {
      mocks: [customersMock, plansMock],
    })

    expect(getInputByTestId(CONTRACT_DRAWER_EXTERNAL_ID_INPUT_TEST_ID)).toBeDisabled()
    expect(screen.queryByTestId(CONTRACT_DRAWER_REMOVE_EXTERNAL_ID_TEST_ID)).not.toBeInTheDocument()
    expect(screen.queryByTestId(CONTRACT_DRAWER_SHOW_EXTERNAL_ID_TEST_ID)).not.toBeInTheDocument()
  })

  it('shows the current customer and plan labels even when absent from the first page', async () => {
    render(<EditWrapper status={ContractStatusEnum.Pending} />, {
      mocks: [customersMock, plansMock],
    })

    await waitFor(() =>
      expect(getInputByTestId(CONTRACT_DRAWER_CUSTOMER_COMBOBOX_TEST_ID)).toHaveValue('Acme'),
    )
    expect(getInputByTestId(CONTRACT_DRAWER_PLAN_COMBOBOX_TEST_ID)).toHaveValue('Enterprise plan')
  })

  it('keeps the plan editable and the customer locked on a pending contract', () => {
    render(<EditWrapper status={ContractStatusEnum.Pending} />, {
      mocks: [customersMock, plansMock],
    })

    expect(getInputByTestId(CONTRACT_DRAWER_PLAN_COMBOBOX_TEST_ID)).toBeEnabled()
    expect(getInputByTestId(CONTRACT_DRAWER_CUSTOMER_COMBOBOX_TEST_ID)).toBeDisabled()
  })

  it('locks the plan on an active contract', () => {
    render(<EditWrapper status={ContractStatusEnum.Active} />, {
      mocks: [customersMock, plansMock],
    })

    expect(getInputByTestId(CONTRACT_DRAWER_PLAN_COMBOBOX_TEST_ID)).toBeDisabled()
  })

  // The customer auto-fill effect would otherwise reset the stored billing entity and payment method.
  it('stays pristine and keeps the stored billing entity once the customers load', async () => {
    render(<EditWrapper status={ContractStatusEnum.Active} />, {
      mocks: [customersMock, plansMock],
    })

    await waitFor(() =>
      expect(mockBillingEntityPicker).toHaveBeenLastCalledWith(
        expect.objectContaining({ value: 'billing-entity-2' }),
      ),
    )
    expect(screen.getByTestId(FORM_DIRTY_STATE_TEST_ID)).toHaveTextContent('pristine')
  })
})
