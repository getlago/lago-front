import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  getCustomerConnectionMenuTestId,
  getCustomerConnectionRowTestId,
} from '~/components/customerConnections/CustomerConnectionsList'
import { ConnectionCategory } from '~/components/customerConnections/types'
import {
  AddCustomerDrawerFragment,
  HubspotTargetedObjectsEnum,
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
const mockFormDrawerClose = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: mockFormDrawerOpen, close: mockFormDrawerClose }),
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
    accountingProviders: {
      integrations: {
        collection: [
          { __typename: 'NetsuiteIntegration', id: 'ns-id', code: 'ns-1', name: 'NetSuite Prod' },
        ],
      },
    },
    isLoadingAccountProviders: false,
    getAccountingProviderFromCode: (code?: string) => (code === 'ns-1' ? 'netsuite' : null),
  }),
}))

jest.mock('~/pages/createCustomers/common/useTaxProviders', () => ({
  useTaxProviders: () => ({
    taxProviders: {
      integrations: {
        collection: [
          { __typename: 'AnrokIntegration', id: 'anrok-id', code: 'anrok-1', name: 'Anrok Main' },
        ],
      },
    },
    isLoadingTaxProviders: false,
    getTaxProviderFromCode: (code?: string) => (code === 'anrok-1' ? 'anrok' : null),
  }),
}))

jest.mock('~/pages/createCustomers/common/useCrmProviders', () => ({
  useCrmProviders: () => ({
    crmProviders: {
      integrations: {
        collection: [
          { __typename: 'HubspotIntegration', id: 'hub-id', code: 'hub-1', name: 'Hubspot Main' },
        ],
      },
    },
    isLoadingCrmProviders: false,
    getCrmProviderFromCode: (code?: string) => (code === 'hub-1' ? 'hubspot' : null),
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

const FULL_SLOTS_DEFAULT_VALUES: CreateCustomerDefaultValues = {
  ...HARNESS_DEFAULT_VALUES,
  accountingProviderCode: 'ns-1',
  accountingCustomer: {
    id: 'acc-row-id',
    accountingCustomerId: 'ns_cus_1',
    syncWithProvider: false,
    providerType: IntegrationTypeEnum.Netsuite,
    subsidiaryId: '',
  },
  crmProviderCode: 'hub-1',
  crmCustomer: {
    id: 'crm-row-id',
    crmCustomerId: 'hub_cus_1',
    syncWithProvider: false,
    providerType: IntegrationTypeEnum.Hubspot,
    targetedObject: HubspotTargetedObjectsEnum.Companies,
  },
}

/** Customer whose four connections were persisted at load (locks the providers) */
const PERSISTED_CUSTOMER = {
  paymentProvider: ProviderTypeEnum.Stripe,
  providerCustomer: { providerCustomerId: 'cus_123' },
  netsuiteCustomer: { integrationCode: 'ns-1' },
  anrokCustomer: { integrationCode: 'anrok-1' },
  hubspotCustomer: { integrationCode: 'hub-1' },
} as unknown as AddCustomerDrawerFragment

const Harness = ({
  fullSlots = false,
  customer = null,
}: {
  fullSlots?: boolean
  customer?: AddCustomerDrawerFragment | null
}) => {
  const form = useAppForm({
    defaultValues: fullSlots ? FULL_SLOTS_DEFAULT_VALUES : HARNESS_DEFAULT_VALUES,
  })

  return <ExternalAppsAccordion form={form} customer={customer} isEdition={!!customer} />
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

    describe('WHEN every category is populated and persisted on the customer', () => {
      it('THEN should open the edit drawer from each row, locked providers included', async () => {
        mockFormDrawerOpen.mockClear()

        render(<Harness fullSlots customer={PERSISTED_CUSTOMER} />)

        await openAccordion()

        const categories = [
          ConnectionCategory.Payment,
          ConnectionCategory.Accounting,
          ConnectionCategory.Tax,
          ConnectionCategory.Crm,
        ]

        for (const category of categories) {
          const row = screen.getByTestId(getCustomerConnectionRowTestId(category))

          await userEvent.click(within(row).getAllByRole('button')[0])
        }

        expect(mockFormDrawerOpen).toHaveBeenCalledTimes(categories.length)
      })
    })

    describe('WHEN accounting and crm connections are deleted from their row menus', () => {
      it('THEN should clear only the deleted slots', async () => {
        render(<Harness fullSlots />)

        await openAccordion()

        for (const category of [ConnectionCategory.Accounting, ConnectionCategory.Crm]) {
          await userEvent.click(screen.getByTestId(getCustomerConnectionMenuTestId(category)))
          await waitFor(() => {
            expect(screen.getByRole('button', { name: /delete connection/i })).toBeVisible()
          })
          await userEvent.click(screen.getByRole('button', { name: /delete connection/i }))
          await waitFor(() => {
            expect(
              screen.queryByTestId(getCustomerConnectionRowTestId(category)),
            ).not.toBeInTheDocument()
          })
        }

        expect(
          screen.getByTestId(getCustomerConnectionRowTestId(ConnectionCategory.Payment)),
        ).toBeInTheDocument()
        expect(
          screen.getByTestId(getCustomerConnectionRowTestId(ConnectionCategory.Tax)),
        ).toBeInTheDocument()
      })
    })


    describe('WHEN the edit drawer is submitted', () => {
      it('THEN should persist the connection back into the slot and close the drawer', async () => {
        mockFormDrawerOpen.mockClear()
        mockFormDrawerClose.mockClear()

        render(<Harness />)

        await openAccordion()

        const paymentRow = screen.getByTestId(
          getCustomerConnectionRowTestId(ConnectionCategory.Payment),
        )

        await userEvent.click(within(paymentRow).getAllByRole('button')[0])

        // The drawer chrome is mocked: drive its submit through the captured config
        const drawerConfig = mockFormDrawerOpen.mock.calls[0][0]

        await drawerConfig.form.submit()

        await waitFor(() => {
          expect(mockFormDrawerClose).toHaveBeenCalled()
        })
        // Slot untouched by a same-values save: the row is still derived from it
        expect(paymentRow).toHaveTextContent('Stripe EU')
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
