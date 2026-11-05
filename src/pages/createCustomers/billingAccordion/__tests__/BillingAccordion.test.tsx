import { revalidateLogic } from '@tanstack/react-form'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Button } from '~/components/designSystem/Button'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { useAppForm } from '~/hooks/forms/useAppform'
import BillingAccordion from '~/pages/createCustomers/billingAccordion/BillingAccordion'
import {
  buildCustomerValidationSchema,
  CreateCustomerDefaultValues,
  emptyCreateCustomerDefaultValues,
} from '~/pages/createCustomers/formInitialization/validationSchema'
import { render } from '~/test-utils'

jest.mock('~/core/form/scrollToFirstInputError', () => ({
  scrollToFirstInputError: jest.fn(),
}))

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

const TestBillingAccordionWithSchema = ({ values }: { values: CreateCustomerDefaultValues }) => {
  const form = useAppForm({
    defaultValues: values,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: buildCustomerValidationSchema(emptyCreateCustomerDefaultValues) },
  })

  return (
    <>
      <Button onClick={() => form.handleSubmit()}>Submit</Button>
      <BillingAccordion form={form} />
    </>
  )
}

describe('BillingAccordion collapsed errors', () => {
  const submit = async () => {
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /submit/i }))
  }

  describe('GIVEN a collapsed accordion holding an over-limit address', () => {
    it('THEN should open on submit so the error is reachable', async () => {
      render(
        <TestBillingAccordionWithSchema
          values={{
            ...emptyCreateCustomerDefaultValues,
            externalId: 'customer-123',
            billingAddress: {
              addressLine1: 'a'.repeat(501),
              addressLine2: '',
              city: '',
              state: '',
              zipcode: '',
            },
          }}
        />,
      )

      expect(screen.queryAllByLabelText(/address line 1/i)).toHaveLength(0)

      await submit()

      await waitFor(() => {
        expect(screen.getAllByLabelText(/address line 1/i)).toHaveLength(2)
      })
    })
  })

  describe('GIVEN the user collapses the accordion without fixing the field', () => {
    it('THEN should reopen it on the next submit', async () => {
      const user = userEvent.setup()

      render(
        <TestBillingAccordionWithSchema
          values={{
            ...emptyCreateCustomerDefaultValues,
            externalId: 'customer-123',
            billingAddress: {
              addressLine1: 'a'.repeat(501),
              addressLine2: '',
              city: '',
              state: '',
              zipcode: '',
            },
          }}
        />,
      )

      await submit()
      await waitFor(() => {
        expect(screen.getAllByLabelText(/address line 1/i)).toHaveLength(2)
      })

      await user.click(screen.getAllByRole('button', { name: /billing information/i })[0])
      await waitFor(() => {
        expect(screen.queryAllByLabelText(/address line 1/i)).toHaveLength(0)
      })

      await submit()

      await waitFor(() => {
        expect(screen.getAllByLabelText(/address line 1/i)).toHaveLength(2)
      })
    })
  })

  describe('GIVEN a collapsed accordion with valid values', () => {
    it('THEN should stay closed on submit', async () => {
      render(
        <TestBillingAccordionWithSchema
          values={{ ...emptyCreateCustomerDefaultValues, externalId: 'customer-123' }}
        />,
      )

      await submit()

      expect(screen.queryAllByLabelText(/address line 1/i)).toHaveLength(0)
    })
  })
})

describe('BillingAccordion scroll on open', () => {
  beforeEach(() => {
    jest.mocked(scrollToFirstInputError).mockClear()
  })

  describe('GIVEN a submit that failed only outside the billing section', () => {
    describe('WHEN the user opens the accordion', () => {
      it('THEN should not scroll to the field outside the section', async () => {
        const user = userEvent.setup()

        render(
          <TestBillingAccordionWithSchema
            values={{ ...emptyCreateCustomerDefaultValues, externalId: '' }}
          />,
        )

        await user.click(screen.getByRole('button', { name: /submit/i }))
        await user.click(screen.getByText('Billing information'))

        await waitFor(() => {
          expect(scrollToFirstInputError).toHaveBeenCalled()
        })
        expect(scrollToFirstInputError).toHaveBeenLastCalledWith('create-customer', {})
      })
    })
  })

  describe('GIVEN a submit that failed inside and outside the billing section', () => {
    describe('WHEN the accordion opens on the error', () => {
      it('THEN should scroll to the billing field only', async () => {
        const user = userEvent.setup()

        render(
          <TestBillingAccordionWithSchema
            values={{
              ...emptyCreateCustomerDefaultValues,
              externalId: '',
              billingAddress: {
                addressLine1: 'a'.repeat(501),
                addressLine2: '',
                city: '',
                state: '',
                zipcode: '',
              },
            }}
          />,
        )

        await user.click(screen.getByRole('button', { name: /submit/i }))

        await waitFor(() => {
          expect(scrollToFirstInputError).toHaveBeenCalled()
        })
        expect(scrollToFirstInputError).toHaveBeenLastCalledWith('create-customer', {
          'billingAddress.addressLine1': true,
        })
      })
    })
  })
})
