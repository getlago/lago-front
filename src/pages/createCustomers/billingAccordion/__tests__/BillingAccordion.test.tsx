import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useAppForm } from '~/hooks/forms/useAppform'
import BillingAccordion from '~/pages/createCustomers/billingAccordion/BillingAccordion'
import { emptyCreateCustomerDefaultValues } from '~/pages/createCustomers/formInitialization/validationSchema'
import { render } from '~/test-utils'

// Create a test wrapper component that properly initializes the form
const TestBillingAccordionWrapper = () => {
  const form = useAppForm({
    defaultValues: emptyCreateCustomerDefaultValues,
  })

  return <BillingAccordion form={form} />
}

describe('BillingAccordion Integration Tests', () => {
  describe('WHEN rendering the component', () => {
    it('THEN should render without crashing', () => {
      const { container } = render(<TestBillingAccordionWrapper />)

      // Check for accordion content by checking that the component rendered
      expect(container.firstChild).toBeInTheDocument()
    })

    it('THEN should render a matching snapshot', () => {
      const rendered = render(<TestBillingAccordionWrapper />)

      expect(rendered.container).toMatchSnapshot()
    })

    it('THEN should render a matching snapshot after expansion', async () => {
      const user = userEvent.setup()
      const rendered = render(<TestBillingAccordionWrapper />)

      const accordionButton = screen.getAllByRole('button')[0]

      await user.click(accordionButton)
      await waitFor(() => {
        // After expanding, check for address fields (both billing and shipping appear)
        expect(screen.getAllByLabelText(/address line 1/i)).toHaveLength(2) // Both billing and shipping
        expect(screen.getAllByLabelText(/city/i)).toHaveLength(2) // Both billing and shipping
        expect(screen.getAllByLabelText(/zip code/i)).toHaveLength(2) // Both billing and shipping zip codes
        // Check for country fields using text content instead of labelText since they might be select dropdowns
        expect(screen.getAllByText(/country/i)).toHaveLength(2) // Both billing and shipping
        expect(rendered.container).toMatchSnapshot()
      })
    })

    it('THEN should render with edition mode', async () => {
      const user = userEvent.setup()
      const rendered = render(<TestBillingAccordionWrapper />)

      const accordionButton = screen.getAllByRole('button')[0]

      await user.click(accordionButton)
      await waitFor(() => {
        expect(rendered.container).toMatchSnapshot()
      })
    })
  })
})
