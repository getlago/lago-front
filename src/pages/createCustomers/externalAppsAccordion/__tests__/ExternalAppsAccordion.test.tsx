import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  getCustomerConnectionMenuTestId,
  getCustomerConnectionRowTestId,
} from '~/components/customerConnections/CustomerConnectionsList'
import { ConnectionCategory } from '~/components/customerConnections/types'
import {
  IntegrationTypeEnum,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
} from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import {
  CreateCustomerDefaultValues,
  emptyCreateCustomerDefaultValues,
} from '~/pages/createCustomers/formInitialization/validationSchema'
import { render } from '~/test-utils'

import ExternalAppsAccordion from '../ExternalAppsAccordion'

// The drawer stack relies on import.meta (unsupported in jest).
// Shared spy so tests can assert the connection drawer opens.
const mockFormDrawerOpen = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: mockFormDrawerOpen, close: jest.fn() }),
}))

// The NetSuite subsidiaries query hook needs an ApolloProvider — inert here
jest.mock(
  '~/pages/createCustomers/externalAppsAccordion/accountingProvidersAccordion/useAccountingProvidersSubsidaries',
  () => ({
    useAccountingProvidersSubsidaries: () => ({ subsidiariesData: undefined }),
  }),
)

jest.mock('~/pages/createCustomers/common/usePaymentProviders', () => ({
  usePaymentProviders: () => ({
    paymentProviders: {
      paymentProviders: {
        collection: [
          { __typename: 'StripeProvider', id: 'stripe-id', name: 'Stripe EU', code: 'stripe-eu' },
        ],
      },
    },
    isLoadingPaymentProviders: false,
    getPaymentProvider: (code?: string) => (code === 'stripe-eu' ? 'stripe' : null),
  }),
}))

jest.mock('~/pages/createCustomers/common/useAccountingProviders', () => ({
  useAccountingProviders: () => ({
    accountingProviders: undefined,
    isLoadingAccountProviders: false,
    getAccountingProviderFromCode: () => null,
  }),
}))

jest.mock('~/pages/createCustomers/common/useTaxProviders', () => ({
  useTaxProviders: () => ({
    taxProviders: undefined,
    isLoadingTaxProviders: false,
    getTaxProviderFromCode: (code?: string) => (code === 'anrok-1' ? 'anrok' : null),
  }),
}))

jest.mock('~/pages/createCustomers/common/useCrmProviders', () => ({
  useCrmProviders: () => ({
    crmProviders: undefined,
    isLoadingCrmProviders: false,
    getCrmProviderFromCode: () => null,
  }),
}))

/** Customer form with a stripe payment slot and an anrok tax slot populated */
const HARNESS_DEFAULT_VALUES: CreateCustomerDefaultValues = {
  ...emptyCreateCustomerDefaultValues,
  paymentProviderCode: 'stripe-eu',
  paymentProviderCustomer: {
    providerCustomerId: 'cus_123',
    syncWithProvider: false,
    providerType: ProviderTypeEnum.Stripe,
    providerPaymentMethods: { [ProviderPaymentMethodsEnum.Card]: true },
  },
  taxProviderCode: 'anrok-1',
  taxCustomer: {
    id: 'tax-row-id',
    taxCustomerId: 'anrok_cus_1',
    syncWithProvider: false,
    providerType: IntegrationTypeEnum.Anrok,
  },
}

const Harness = () => {
  const form = useAppForm({ defaultValues: HARNESS_DEFAULT_VALUES })

  return <ExternalAppsAccordion form={form} customer={null} isEdition={false} />
}

const openAccordion = async () => {
  // The section accordion is collapsed by default
  await userEvent.click(await screen.findByRole('button', { name: /connect to external apps/i }))
}

describe('ExternalAppsAccordion', () => {
  describe('GIVEN a customer form with payment and tax connections in its slots', () => {
    describe('WHEN the section is opened', () => {
      it('THEN should derive one list row per populated slot', async () => {
        render(<Harness />)

        await openAccordion()

        const paymentRow = screen.getByTestId(
          getCustomerConnectionRowTestId(ConnectionCategory.Payment),
        )

        expect(paymentRow).toBeVisible()
        expect(paymentRow).toHaveTextContent('Stripe EU')
        expect(paymentRow).toHaveTextContent('stripe-eu')
        expect(
          screen.getByTestId(getCustomerConnectionRowTestId(ConnectionCategory.Tax)),
        ).toBeVisible()
        expect(
          screen.queryByTestId(getCustomerConnectionRowTestId(ConnectionCategory.Accounting)),
        ).not.toBeInTheDocument()
        expect(
          screen.queryByTestId(getCustomerConnectionRowTestId(ConnectionCategory.Crm)),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN opening the "Add a connection" menu', () => {
      it('THEN should disable the categories already present and keep the others enabled', async () => {
        render(<Harness />)

        await openAccordion()
        await userEvent.click(screen.getByRole('button', { name: /add a connection/i }))

        expect(await screen.findByRole('button', { name: /payment provider/i })).toBeDisabled()
        expect(screen.getByRole('button', { name: /tax provider/i })).toBeDisabled()
        expect(screen.getByRole('button', { name: /accounting provider/i })).not.toBeDisabled()
        expect(screen.getByRole('button', { name: /crm connection/i })).not.toBeDisabled()
      })
    })

    describe('WHEN a row is clicked', () => {
      it('THEN should open the connection drawer in edit', async () => {
        mockFormDrawerOpen.mockClear()

        render(<Harness />)

        await openAccordion()

        const paymentRow = screen.getByTestId(
          getCustomerConnectionRowTestId(ConnectionCategory.Payment),
        )

        await userEvent.click(within(paymentRow).getAllByRole('button')[0])

        expect(mockFormDrawerOpen).toHaveBeenCalledWith(
          expect.objectContaining({ title: expect.any(String) }),
        )
      })
    })

    describe('WHEN an available category is picked from the "Add a connection" menu', () => {
      it('THEN should open the connection drawer in create', async () => {
        mockFormDrawerOpen.mockClear()

        render(<Harness />)

        await openAccordion()
        await userEvent.click(screen.getByRole('button', { name: /add a connection/i }))
        await userEvent.click(await screen.findByRole('button', { name: /accounting provider/i }))

        expect(mockFormDrawerOpen).toHaveBeenCalledWith(
          expect.objectContaining({ title: expect.any(String) }),
        )
      })
    })

    describe('WHEN a connection is deleted from the row menu', () => {
      it('THEN should clear the slot and remove only that row', async () => {
        render(<Harness />)

        await openAccordion()
        await userEvent.click(
          screen.getByTestId(getCustomerConnectionMenuTestId(ConnectionCategory.Payment)),
        )
        await waitFor(() => {
          expect(screen.getByRole('button', { name: /delete connection/i })).toBeVisible()
        })
        await userEvent.click(screen.getByRole('button', { name: /delete connection/i }))

        await waitFor(() => {
          expect(
            screen.queryByTestId(getCustomerConnectionRowTestId(ConnectionCategory.Payment)),
          ).not.toBeInTheDocument()
        })
        expect(
          screen.getByTestId(getCustomerConnectionRowTestId(ConnectionCategory.Tax)),
        ).toBeInTheDocument()
      })
    })
  })
})
