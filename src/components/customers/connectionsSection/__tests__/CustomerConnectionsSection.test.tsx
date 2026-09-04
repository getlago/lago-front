import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ConnectionFormValues } from '~/components/customerConnections/CustomerConnectionDrawer'
import {
  getCustomerConnectionDefaultBadgeTestId,
  getCustomerConnectionMenuTestId,
  getCustomerConnectionRowTestId,
  getCustomerConnectionSetDefaultTestId,
} from '~/components/customerConnections/CustomerConnectionsList'
import { MANUAL_CONNECTION_CODE } from '~/components/customerConnections/customerIntegrationConst'
import { ConnectionCategory } from '~/components/customerConnections/types'
import { GENERIC_PLACEHOLDER_TEST_ID } from '~/components/designSystem/GenericPlaceholder'
import {
  CustomerDetailsFragment,
  IntegrationTypeEnum,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import { CONNECTION_DETAILS_EDIT_TEST_ID, PAYMENT_METHODS_LIST_TEST_ID } from '../constants'
import { CustomerConnectionsSection } from '../CustomerConnectionsSection'

const mockOpenCreate = jest.fn()
const mockOpenEdit = jest.fn()
const mockDialogOpen = jest.fn()
const mockUpdatePayment = jest.fn(() =>
  Promise.resolve({ data: { updatePaymentProviderCustomer: { id: 'pc-1' } } }),
)
const mockDestroyIntegration = jest.fn(() =>
  Promise.resolve({ data: { destroyIntegrationCustomer: { id: 'ac-1' } } }),
)
const mockOpenAddPaymentMethodDialog = jest.fn()
const mockSetPaymentDefault = jest.fn(() =>
  Promise.resolve({
    data: { setPaymentProviderCustomerAsDefault: { id: 'pc-1', isDefault: true } },
  }),
)
const mockSetIntegrationDefault = jest.fn(() =>
  Promise.resolve({ data: { setIntegrationCustomerAsDefault: { __typename: 'AnrokCustomer' } } }),
)
const mockHasFeatureFlag = jest.fn(() => false)

jest.mock('~/hooks/useOrganizationInfos', () => ({
  ...jest.requireActual('~/hooks/useOrganizationInfos'),
  useOrganizationInfos: () => ({ hasFeatureFlag: mockHasFeatureFlag }),
}))

type CapturedDrawerProps = {
  onSave?: (
    category: ConnectionCategory,
    values: ConnectionFormValues,
    utils: { isEdition: boolean },
  ) => Promise<void>
}

const capturedDrawerProps: { current: CapturedDrawerProps | null } = { current: null }

// The drawer stack relies on import.meta (unsupported in jest)
jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
}))

jest.mock('~/components/customerConnections/useCustomerConnectionDrawer', () => ({
  useCustomerConnectionDrawer: () => ({
    drawerRef: { current: null },
    openCreate: mockOpenCreate,
    openEdit: mockOpenEdit,
  }),
}))

jest.mock('~/components/customerConnections/CustomerConnectionDrawer', () => {
  const actual = jest.requireActual('~/components/customerConnections/CustomerConnectionDrawer')
  const { forwardRef: fr } = jest.requireActual('react')

  return {
    ...actual,
    CustomerConnectionDrawer: fr((props: CapturedDrawerProps) => {
      capturedDrawerProps.current = props

      return null
    }),
  }
})

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockDialogOpen }),
}))

jest.mock('~/components/customers/useAddPaymentMethodDialog', () => ({
  useAddPaymentMethodDialog: () => ({
    openAddPaymentMethodDialog: mockOpenAddPaymentMethodDialog,
  }),
}))

jest.mock('~/components/paymentMethodsList/PaymentMethodList', () => ({
  PaymentMethodsList: () => <div data-test="mock-payment-methods-list" />,
}))

jest.mock('~/components/customerConnections/usePaymentProviders', () => ({
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

jest.mock('~/components/customerConnections/useAccountingProviders', () => ({
  useAccountingProviders: () => ({
    accountingProviders: {
      integrations: {
        collection: [
          { __typename: 'NetsuiteIntegration', id: 'ns-id', code: 'ns-1', name: 'NetSuite Prod' },
        ],
      },
    },
    isLoadingAccountProviders: false,
    getAccountingProviderFromCode: () => null,
  }),
}))

jest.mock('~/components/customerConnections/useTaxProviders', () => ({
  useTaxProviders: () => ({
    taxProviders: {
      integrations: {
        collection: [
          { __typename: 'AnrokIntegration', id: 'int-anrok', code: 'anrok-1', name: 'Anrok Main' },
        ],
      },
    },
    isLoadingTaxProviders: false,
    getTaxProviderFromCode: () => null,
  }),
}))

jest.mock('~/components/customerConnections/useCrmProviders', () => ({
  useCrmProviders: () => ({
    crmProviders: {
      integrations: {
        collection: [
          { __typename: 'HubspotIntegration', id: 'hub-id', code: 'hub-1', name: 'Hubspot Main' },
        ],
      },
    },
    isLoadingCrmProviders: false,
    getCrmProviderFromCode: () => null,
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useIntegrationsListForCustomerMainInfosQuery: () => ({
    data: {
      integrations: {
        collection: [
          {
            __typename: 'AnrokIntegration',
            id: 'int-anrok',
            name: 'Anrok Main',
            externalAccountId: 'acc-ext',
          },
        ],
      },
    },
    loading: false,
  }),
  useCreateCustomerPaymentConnectionMutation: () => [
    jest.fn(() => Promise.resolve({ errors: undefined })),
  ],
  useUpdateCustomerPaymentConnectionMutation: () => [mockUpdatePayment],
  useDestroyCustomerPaymentConnectionMutation: () => [
    jest.fn(() => Promise.resolve({ errors: undefined })),
  ],
  useCreateCustomerIntegrationConnectionMutation: () => [
    jest.fn(() => Promise.resolve({ errors: undefined })),
  ],
  useUpdateCustomerIntegrationConnectionMutation: () => [
    jest.fn(() => Promise.resolve({ errors: undefined })),
  ],
  useDestroyCustomerIntegrationConnectionMutation: () => [mockDestroyIntegration],
  useSetCustomerPaymentConnectionAsDefaultMutation: () => [mockSetPaymentDefault],
  useSetCustomerIntegrationConnectionAsDefaultMutation: () => [mockSetIntegrationDefault],
}))

const ANY_ROW_TEST_ID = new RegExp(`^${getCustomerConnectionRowTestId('')}`)

/** The backend's non-persisted manual placeholder, prepended to the array */
const MANUAL_PLACEHOLDER_CONNECTION = {
  __typename: 'ProviderCustomer',
  id: 'cust-1-manual',
  code: MANUAL_CONNECTION_CODE,
  isDefault: false,
}

/**
 * Customer with a Stripe payment connection (behind the manual placeholder)
 * and an Anrok tax link persisted, both in the connection arrays.
 */
const customer = {
  id: 'cust-1',
  externalId: 'ext-1',
  paymentProvider: ProviderTypeEnum.Stripe,
  paymentProviderCode: 'stripe-eu',
  paymentProviderCustomers: [
    MANUAL_PLACEHOLDER_CONNECTION,
    {
      __typename: 'ProviderCustomer',
      id: 'pc-1',
      code: 'stripe',
      isDefault: true,
      providerCustomerId: 'cus_123',
      syncWithProvider: false,
      providerPaymentMethods: [ProviderPaymentMethodsEnum.Card],
    },
  ],
  integrationCustomers: [
    {
      __typename: 'AnrokCustomer',
      id: 'ac-1',
      integrationId: 'int-anrok',
      integrationCode: 'anrok-1',
      integrationType: IntegrationTypeEnum.Anrok,
      externalCustomerId: 'anrok_cus_1',
      syncWithProvider: false,
    },
  ],
} as unknown as CustomerDetailsFragment

describe('CustomerConnectionsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedDrawerProps.current = null
    mockUpdatePayment.mockResolvedValue({
      data: { updatePaymentProviderCustomer: { id: 'pc-1' } },
    } as never)
    mockDestroyIntegration.mockResolvedValue({
      data: { destroyIntegrationCustomer: { id: 'ac-1' } },
    } as never)
    mockSetPaymentDefault.mockResolvedValue({
      data: { setPaymentProviderCustomerAsDefault: { id: 'pc-1', isDefault: true } },
    } as never)
    mockHasFeatureFlag.mockReturnValue(false)
  })

  describe('GIVEN a customer with connections', () => {
    describe('WHEN the section renders', () => {
      it.each([
        ['payment provider row', 'payment-stripe-eu'],
        ['tax row', 'tax-anrok-1'],
      ])('THEN should render the %s', (_, rowId) => {
        render(<CustomerConnectionsSection customer={customer} />)

        expect(screen.getByTestId(getCustomerConnectionRowTestId(rowId))).toBeInTheDocument()
      })

      it('THEN should select the first connection by default and offer Edit', () => {
        render(<CustomerConnectionsSection customer={customer} />)

        expect(
          screen.getByTestId(getCustomerConnectionRowTestId('payment-stripe-eu')),
        ).toHaveAttribute('data-state', 'selected')
        expect(screen.getByTestId(CONNECTION_DETAILS_EDIT_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should show the payment methods block for the default payment selection', () => {
        render(<CustomerConnectionsSection customer={customer} />)

        expect(screen.getByTestId(PAYMENT_METHODS_LIST_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should never list a manual payment row', () => {
        render(<CustomerConnectionsSection customer={customer} />)

        expect(screen.getAllByTestId(ANY_ROW_TEST_ID)).toHaveLength(2)
        expect(
          screen.queryByTestId(getCustomerConnectionRowTestId('payment-manual')),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN the customer has no connection but the manual placeholder', () => {
      it('THEN should show the empty state', () => {
        render(
          <CustomerConnectionsSection
            customer={
              {
                ...customer,
                paymentProvider: null,
                paymentProviderCode: null,
                paymentProviderCustomers: [MANUAL_PLACEHOLDER_CONNECTION],
                integrationCustomers: [],
              } as unknown as CustomerDetailsFragment
            }
          />,
        )

        expect(screen.getByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(ANY_ROW_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(CONNECTION_DETAILS_EDIT_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the provider payment row is selected', () => {
      it('THEN should show its settings and the scoped payment methods block', async () => {
        const user = userEvent.setup()

        render(<CustomerConnectionsSection customer={customer} />)

        await user.click(
          within(
            screen.getByTestId(getCustomerConnectionRowTestId('payment-stripe-eu')),
          ).getAllByRole('button')[0],
        )

        expect(
          screen.getByTestId(getCustomerConnectionRowTestId('payment-stripe-eu')),
        ).toHaveAttribute('data-state', 'selected')
        expect(screen.getByTestId(PAYMENT_METHODS_LIST_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN a tax row is selected', () => {
      it('THEN should show its settings without the payment methods block', async () => {
        const user = userEvent.setup()

        render(<CustomerConnectionsSection customer={customer} />)

        await user.click(
          within(screen.getByTestId(getCustomerConnectionRowTestId('tax-anrok-1'))).getAllByRole(
            'button',
          )[0],
        )

        expect(screen.queryByTestId(PAYMENT_METHODS_LIST_TEST_ID)).not.toBeInTheDocument()
        expect(screen.getByTestId(CONNECTION_DETAILS_EDIT_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN opening the "Add a connection" menu', () => {
      it('THEN should disable only the connected categories (manual never counts)', async () => {
        const user = userEvent.setup()

        render(<CustomerConnectionsSection customer={customer} />)

        await user.click(screen.getByRole('button', { name: /add a connection/i }))

        expect(await screen.findByRole('button', { name: /payment provider/i })).toBeDisabled()
        expect(screen.getByRole('button', { name: /tax provider/i })).toBeDisabled()
        expect(screen.getByRole('button', { name: /accounting provider/i })).not.toBeDisabled()
        expect(screen.getByRole('button', { name: /crm connection/i })).not.toBeDisabled()
      })

      it('THEN should open the drawer in create mode for an available category', async () => {
        const user = userEvent.setup()

        render(<CustomerConnectionsSection customer={customer} />)

        await user.click(screen.getByRole('button', { name: /add a connection/i }))
        await user.click(await screen.findByRole('button', { name: /accounting provider/i }))

        expect(mockOpenCreate).toHaveBeenCalledWith(ConnectionCategory.Accounting)
      })
    })

    describe('WHEN the panel Edit action is clicked', () => {
      it('THEN should open the drawer in edit with the fragment-derived values and a locked provider', async () => {
        const user = userEvent.setup()

        render(<CustomerConnectionsSection customer={customer} />)

        await user.click(
          within(screen.getByTestId(getCustomerConnectionRowTestId('tax-anrok-1'))).getAllByRole(
            'button',
          )[0],
        )
        await user.click(screen.getByTestId(CONNECTION_DETAILS_EDIT_TEST_ID))

        expect(mockOpenEdit).toHaveBeenCalledWith(
          ConnectionCategory.Tax,
          expect.objectContaining({
            providerCode: 'anrok-1',
            providerType: IntegrationTypeEnum.Anrok,
            externalCustomerId: 'anrok_cus_1',
          }),
          expect.objectContaining({ title: 'Anrok Main', subtitle: 'anrok-1' }),
        )
      })

      it('THEN should prefill the payment values from the provider row of the array', async () => {
        const user = userEvent.setup()

        render(<CustomerConnectionsSection customer={customer} />)

        await user.click(screen.getByTestId(CONNECTION_DETAILS_EDIT_TEST_ID))

        expect(mockOpenEdit).toHaveBeenCalledWith(
          ConnectionCategory.Payment,
          expect.objectContaining({
            providerCode: 'stripe-eu',
            providerType: ProviderTypeEnum.Stripe,
            externalCustomerId: 'cus_123',
            syncWithProvider: false,
            providerPaymentMethods: { [ProviderPaymentMethodsEnum.Card]: true },
          }),
          expect.objectContaining({ title: 'Stripe EU', subtitle: 'stripe-eu' }),
        )
      })
    })

    describe('WHEN deleting a connection from its row menu', () => {
      it('THEN should ask for confirmation and persist the deletion on confirm', async () => {
        const user = userEvent.setup()

        render(<CustomerConnectionsSection customer={customer} />)

        await user.click(screen.getByTestId(getCustomerConnectionMenuTestId('tax-anrok-1')))
        await user.click(await screen.findByRole('button', { name: /delete connection/i }))

        expect(mockDialogOpen).toHaveBeenCalledWith(
          expect.objectContaining({ colorVariant: 'danger' }),
        )

        // Confirm through the captured dialog action
        await act(async () => {
          await mockDialogOpen.mock.calls[0][0].onAction()
        })

        expect(mockDestroyIntegration).toHaveBeenCalledWith({
          variables: { input: { id: 'ac-1' } },
        })
      })
    })

    describe('WHEN the drawer saves an existing connection', () => {
      it('THEN should persist it and select its row', async () => {
        render(<CustomerConnectionsSection customer={customer} />)

        await act(async () => {
          await capturedDrawerProps.current?.onSave?.(
            ConnectionCategory.Payment,
            {
              providerCode: 'stripe-eu',
              providerType: ProviderTypeEnum.Stripe,
              externalCustomerId: 'cus_123',
              syncWithProvider: false,
            } as ConnectionFormValues,
            { isEdition: true },
          )
        })

        expect(mockUpdatePayment).toHaveBeenCalled()
        await waitFor(() => {
          expect(
            screen.getByTestId(getCustomerConnectionRowTestId('payment-stripe-eu')),
          ).toHaveAttribute('data-state', 'selected')
        })
      })

      it('THEN should keep the drawer open when the mutation fails', async () => {
        mockUpdatePayment.mockResolvedValue({ errors: [{}] } as never)

        render(<CustomerConnectionsSection customer={customer} />)

        // Resolves false rather than rejecting: BaseDrawer calls form.submit()
        // without catching, so throwing here would escape as an unhandled
        // promise rejection on every failed save
        await expect(
          capturedDrawerProps.current?.onSave?.(
            ConnectionCategory.Payment,
            {
              providerCode: 'stripe-eu',
              providerType: ProviderTypeEnum.Stripe,
              externalCustomerId: 'cus_123',
            } as ConnectionFormValues,
            { isEdition: true },
          ),
        ).resolves.toBe(false)
      })
    })
  })
  describe('GIVEN the multi-connection feature flag is enabled', () => {
    beforeEach(() => {
      mockHasFeatureFlag.mockReturnValue(true)
    })

    describe('WHEN the section renders', () => {
      it('THEN should badge the default connection', () => {
        render(<CustomerConnectionsSection customer={customer} />)

        expect(
          screen.getByTestId(getCustomerConnectionDefaultBadgeTestId('payment-stripe-eu')),
        ).toBeInTheDocument()
        expect(
          screen.queryByTestId(getCustomerConnectionDefaultBadgeTestId('tax-anrok-1')),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN setting a non-default connection as default', () => {
      it('THEN should call the dedicated mutation with the connection id', async () => {
        render(<CustomerConnectionsSection customer={customer} />)

        await userEvent.click(screen.getByTestId(getCustomerConnectionMenuTestId('tax-anrok-1')))
        await waitFor(() => {
          expect(
            screen.getByTestId(getCustomerConnectionSetDefaultTestId('tax-anrok-1')),
          ).toBeVisible()
        })

        await userEvent.click(
          screen.getByTestId(getCustomerConnectionSetDefaultTestId('tax-anrok-1')),
        )

        await waitFor(() => {
          expect(mockSetIntegrationDefault).toHaveBeenCalledWith({
            variables: { input: { id: 'ac-1' } },
          })
        })
      })
    })

    describe('WHEN the connection already is the default', () => {
      it('THEN should disable the Set as default entry', async () => {
        render(<CustomerConnectionsSection customer={customer} />)

        await userEvent.click(
          screen.getByTestId(getCustomerConnectionMenuTestId('payment-stripe-eu')),
        )

        await waitFor(() => {
          expect(
            screen.getByTestId(getCustomerConnectionSetDefaultTestId('payment-stripe-eu')),
          ).toBeVisible()
        })
        expect(
          screen.getByTestId(getCustomerConnectionSetDefaultTestId('payment-stripe-eu')),
        ).toBeDisabled()
      })
    })
  })

  describe('GIVEN the multi-connection feature flag is disabled', () => {
    describe('WHEN the section renders', () => {
      it('THEN should show no Default badge', () => {
        render(<CustomerConnectionsSection customer={customer} />)

        expect(
          screen.queryByTestId(getCustomerConnectionDefaultBadgeTestId('payment-stripe-eu')),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN a row menu is opened', () => {
      it('THEN should offer no Set as default entry', async () => {
        render(<CustomerConnectionsSection customer={customer} />)

        await userEvent.click(screen.getByTestId(getCustomerConnectionMenuTestId('tax-anrok-1')))
        await waitFor(() => {
          expect(screen.getByRole('button', { name: /edit connection/i })).toBeVisible()
        })

        expect(
          screen.queryByTestId(getCustomerConnectionSetDefaultTestId('tax-anrok-1')),
        ).not.toBeInTheDocument()
        expect(mockSetIntegrationDefault).not.toHaveBeenCalled()
      })
    })
  })
})
