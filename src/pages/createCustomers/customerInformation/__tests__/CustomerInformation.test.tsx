import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  AddCustomerDrawerFragment,
  CountryCode,
  CustomerAccountTypeEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import CustomerInformation from '~/pages/createCustomers/customerInformation/CustomerInformation'
import { emptyCreateCustomerDefaultValues } from '~/pages/createCustomers/formInitialization/validationSchema'
import { render } from '~/test-utils'

const mockCustomer: AddCustomerDrawerFragment = {
  id: 'test-customer-id',
  canEditAttributes: true,
  applicableTimezone: TimezoneEnum.TzAfricaAlgiers,
  externalId: 'CUST-001',
  accountType: CustomerAccountTypeEnum.Customer,
  addressLine1: '123 Test St',
  addressLine2: 'Suite 100',
  city: 'Testville',
  state: 'TS',
  zipcode: '12345',
  country: CountryCode.Us,
  phone: '+1234567890',
  email: 'email@email.com',
  billingEntity: {
    __typename: 'BillingEntity',
    id: 'billing-entity-1',
    name: 'Test Billing Entity',
    code: 'TBE',
  },
}

const mockBillingEntities = [
  { value: 'TBE', label: 'Test Billing Entity' },
  { value: 'ABE', label: 'Another Billing Entity' },
]

// Create a test wrapper component that properly initializes the form
const TestCustomerInformationWrapper = ({
  isEdition = false,
  customer = null,
  billingEntities = mockBillingEntities,
  isLoading = false,
}: {
  isEdition?: boolean
  customer?: AddCustomerDrawerFragment | null
  billingEntities?: { value: string; label: string }[]
  isLoading?: boolean
}) => {
  const form = useAppForm({
    defaultValues: emptyCreateCustomerDefaultValues,
  })

  return (
    <CustomerInformation
      form={form}
      isEdition={isEdition}
      customer={customer}
      billingEntitiesList={billingEntities}
      isLoadingBillingEntities={isLoading}
    />
  )
}

describe('CustomerInformation Integration Tests', () => {
  describe('WHEN rendering the component', () => {
    it('THEN should render without crashing', () => {
      const { container } = render(<TestCustomerInformationWrapper />)

      // Check for accordion content by checking that the component rendered
      expect(container.firstChild).toBeInTheDocument()
    })

    it('THEN should render a matching snapshot', () => {
      const rendered = render(<TestCustomerInformationWrapper />)

      expect(rendered.container).toMatchSnapshot()
    })

    it('THEN should render with edition mode', async () => {
      const user = userEvent.setup()
      const rendered = render(<TestCustomerInformationWrapper isEdition={true} />)

      const accordionButton = screen.getAllByRole('button')[0]

      await user.click(accordionButton)
      await waitFor(() => {
        expect(rendered.container).toMatchSnapshot()
      })
    })

    it('THEN should render with customer data', async () => {
      const user = userEvent.setup()
      const rendered = render(
        <TestCustomerInformationWrapper customer={mockCustomer} isEdition={true} />,
      )
      const accordionButton = screen.getAllByRole('button')[0]

      await user.click(accordionButton)
      await waitFor(() => {
        expect(rendered.container).toMatchSnapshot()
      })
    })
  })
})
