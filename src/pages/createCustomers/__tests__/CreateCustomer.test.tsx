import { RenderOptions, render as rtlRender, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactElement } from 'react'

import { initializeYup } from '~/formValidation/initializeYup'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import CreateCustomer from '../CreateCustomer'

// Initialize form validation
initializeYup()

// Custom render function for CreateCustomer component (create mode)
const renderCreateCustomer = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    mocks?: TestMocksType
    useParams?: { [key: string]: string }
  },
) =>
  rtlRender(ui, {
    wrapper: (props) => (
      <AllTheProviders
        {...props}
        mocks={options?.mocks}
        useParams={options?.useParams || {}} // Empty object for create mode
        forceTypenames={true}
      />
    ),
    ...options,
  })

describe('CreateCustomer Integration Tests', () => {
  describe('WHEN rendering the component', () => {
    it('THEN should render without crashing', () => {
      renderCreateCustomer(<CreateCustomer />)

      // Basic smoke test - component should render without errors
      expect(screen.getByTestId('submit-customer')).toBeInTheDocument()
    })

    it('THEN should render a matching snapshot', () => {
      const rendered = renderCreateCustomer(<CreateCustomer />)

      expect(rendered.container).toMatchSnapshot()
    })
  })

  describe('WHEN checking form structure', () => {
    it('THEN should display key form elements', () => {
      renderCreateCustomer(<CreateCustomer />)

      // Check for main form elements
      expect(screen.getByTestId('submit-customer')).toBeInTheDocument()
      expect(
        screen.getByRole('textbox', { name: 'Customer external ID (required)' }),
      ).toBeInTheDocument()
    })
    it('THEN should show customer information section', () => {
      renderCreateCustomer(<CreateCustomer />)

      // Look for customer information fields
      expect(screen.getByLabelText(/customer external id/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/customer name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    })
  })

  describe('WHEN checking accordion sections', () => {
    it('THEN should display billing information accordion', () => {
      renderCreateCustomer(<CreateCustomer />)

      // Check for accordion structure
      expect(
        screen.getByRole('button', { name: /expand billing information/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/define the customer information to use in the invoices/i),
      ).toBeInTheDocument()
    })

    it('THEN should display metadata accordion', () => {
      renderCreateCustomer(<CreateCustomer />)

      // Check for metadata accordion
      expect(screen.getByRole('button', { name: /expand metadata/i })).toBeInTheDocument()
      expect(screen.getByText(/add metadata to the customer/i)).toBeInTheDocument()
    })

    it('THEN should display external apps accordion', () => {
      renderCreateCustomer(<CreateCustomer />)

      // Check for external apps accordion
      expect(
        screen.getByRole('button', { name: /expand connect to external apps/i }),
      ).toBeInTheDocument()
      expect(screen.getByText(/sync this customer data to an integration/i)).toBeInTheDocument()
    })
  })

  describe('WHEN checking form validation structure', () => {
    it('THEN should have form validation in place', () => {
      renderCreateCustomer(<CreateCustomer />)

      // Basic validation check - submit button should be disabled initially
      const submitButton = screen.getByTestId('submit-customer')
      const externalIdField = screen.getByLabelText(/customer external id/i)

      expect(submitButton).toBeDisabled()
      expect(externalIdField).toBeInTheDocument()
      expect(externalIdField).not.toBeRequired()
    })
  })

  describe('WHEN checking on expanded features', () => {
    it('THEN should handle expanded billing information accordion', async () => {
      const user = userEvent.setup()
      const rendered = renderCreateCustomer(<CreateCustomer />)

      const accordionButton = screen.getByRole('button', { name: /expand billing information/i })

      expect(accordionButton).toBeInTheDocument()
      await user.click(accordionButton)

      // Wait for accordion to expand and show address fields
      await waitFor(() => {
        // After expanding, check for address fields (both billing and shipping appear)
        expect(screen.getAllByLabelText(/address line 1/i)).toHaveLength(2) // Both billing and shipping
        expect(screen.getAllByLabelText(/city/i)).toHaveLength(2) // Both billing and shipping
        expect(screen.getAllByLabelText(/zip code/i)).toHaveLength(2) // Both billing and shipping zip codes
        // Check for country fields using text content instead of labelText since they might be select dropdowns
        expect(screen.getAllByText(/country/i)).toHaveLength(2) // Both billing and shipping
      })

      // Snapshot after expanding accordion
      expect(rendered.container).toMatchSnapshot()
    })

    it('THEN should handle expanded metadata accordion', async () => {
      const user = userEvent.setup()
      const rendered = renderCreateCustomer(<CreateCustomer />)

      const accordionButton = screen.getByRole('button', { name: /expand metadata/i })

      expect(accordionButton).toBeInTheDocument()
      await user.click(accordionButton)

      // Wait for accordion to expand and show address fields
      await waitFor(async () => {
        // After expanding, check for metadata button
        const metadataButton = screen.getByRole('button', { name: 'Add metadata' })

        expect(metadataButton).toBeInTheDocument()
        //Snapshot now
        expect(rendered.container).toMatchSnapshot()
        await user.click(accordionButton)

        //Snapshot after adding field
        expect(rendered.container).toMatchSnapshot()
      })
    })

    it('THEN should handle expanded external apps accordion', async () => {
      const user = userEvent.setup()
      const rendered = renderCreateCustomer(<CreateCustomer />)

      const accordionButton = screen.getByRole('button', {
        name: /expand connect to external apps/i,
      })

      expect(accordionButton).toBeInTheDocument()
      await user.click(accordionButton)

      // Wait for accordion to expand and show address fields
      await waitFor(async () => {
        // After expanding, check for external apps fields
        const connectionButton = screen.getByRole('button', { name: 'Add a connection' })

        expect(connectionButton).toBeInTheDocument()
        // Snapshot after expanding accordion
        expect(rendered.container).toMatchSnapshot()

        await user.click(connectionButton)
        // Snapshot after expanding popover
        expect(rendered.container).toMatchSnapshot()
      })
    })
  })

  describe('WHEN checking premium features', () => {
    it('THEN should handle partner account toggle visibility', () => {
      renderCreateCustomer(<CreateCustomer />)

      // Check basic structure for premium features
      expect(screen.getByLabelText(/isPartner/i)).toBeInTheDocument()
      expect(screen.getByText(/Entity that sells your products or services/i)).toBeInTheDocument()
    })
  })

  describe('WHEN checking navigation elements', () => {
    it('THEN should display navigation buttons', () => {
      renderCreateCustomer(<CreateCustomer />)

      // Check for navigation/action buttons
      expect(screen.getByTestId('submit-customer')).toBeInTheDocument()
    })
  })

  describe('WHEN checking form sections are present', () => {
    it('THEN should display key form elements', () => {
      renderCreateCustomer(<CreateCustomer />)

      // Verify major sections are present
      expect(screen.getByTestId('submit-customer')).toBeInTheDocument()
      expect(screen.getByTestId('headline')).toHaveTextContent('Create a customer')
      expect(screen.getByRole('button', { name: /create customer/i })).toBeInTheDocument()
    })
  })

  describe('WHEN checking loading states', () => {
    it('THEN should handle loading states gracefully', () => {
      renderCreateCustomer(<CreateCustomer />)

      // Basic loading state check
      expect(screen.getByTestId('submit-customer')).toBeInTheDocument()
      // Component should render without loading indicators initially
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })
  })

  describe('WHEN checking component accessibility', () => {
    it('THEN should have proper ARIA labels and roles', () => {
      renderCreateCustomer(<CreateCustomer />)

      // Check for proper accessibility attributes
      expect(screen.getByTestId('submit-customer')).toBeInTheDocument()
      expect(screen.getByLabelText(/customer external id/i)).toHaveAttribute(
        'aria-invalid',
        'false',
      )
      expect(screen.getByRole('button', { name: /create customer/i })).toBeInTheDocument()
    })
  })
})
