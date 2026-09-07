import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ConnectionFormValues } from '~/components/customerConnections/CustomerConnectionDrawer'
import {
  getCustomerConnectionMenuTestId,
  getCustomerConnectionRowTestId,
} from '~/components/customerConnections/CustomerConnectionsList'
import { MANUAL_CONNECTION_CODE } from '~/components/customerConnections/customerIntegrationConst'
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
jest.mock('~/components/customerConnections/useAccountingProvidersSubsidaries', () => ({
  useAccountingProvidersSubsidaries: () => ({ subsidiariesData: undefined }),
}))

const mockOpenCreate = jest.fn()
const mockOpenEdit = jest.fn()

// Spied entry points that still drive the REAL drawer through its ref, so the
// prefill/locked-provider arguments can be asserted without losing the
// drawer-submit path
jest.mock('~/components/customerConnections/useCustomerConnectionDrawer', () => {
  const { useMemo, useRef } = jest.requireActual('react')

  return {
    useCustomerConnectionDrawer: () => {
      const drawerRef = useRef(null)

      return useMemo(
        () => ({
          drawerRef,
          openCreate: (category: ConnectionCategory) => {
            mockOpenCreate(category)
            drawerRef.current?.openDrawer(category)
          },
          openEdit: (
            category: ConnectionCategory,
            initialValues: Partial<ConnectionFormValues>,
            lockedSelection?: unknown,
          ) => {
            mockOpenEdit(category, initialValues, lockedSelection)
            drawerRef.current?.openDrawer(category, initialValues, lockedSelection)
          },
        }),
        [],
      )
    },
  }
})

type CapturedDrawerProps = {
  onSave?: (
    category: ConnectionCategory,
    values: ConnectionFormValues,
    utils: { isEdition: boolean },
  ) => void | Promise<void>
}

const capturedDrawerProps: { current: CapturedDrawerProps | null } = { current: null }

// Pass-through wrapper: keeps the real drawer (ref + submit) while exposing
// the injected persistence strategy the accordion owns
jest.mock('~/components/customerConnections/CustomerConnectionDrawer', () => {
  const actual = jest.requireActual('~/components/customerConnections/CustomerConnectionDrawer')
  const { createElement, forwardRef } = jest.requireActual('react')

  return {
    ...actual,
    CustomerConnectionDrawer: forwardRef((props: CapturedDrawerProps, ref: unknown) => {
      capturedDrawerProps.current = props

      return createElement(actual.CustomerConnectionDrawer, { ...props, ref })
    }),
  }
})

jest.mock('~/components/customerConnections/usePaymentProviders', () => ({
  usePaymentProviders: () => ({
    paymentProviders: {
      paymentProviders: {
        collection: [
          { __typename: 'StripeProvider', id: 'stripe-id', name: 'Stripe EU', code: 'stripe-eu' },
          { __typename: 'AdyenProvider', id: 'adyen-id', name: 'Adyen EU', code: 'adyen-eu' },
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
    getAccountingProviderFromCode: (code?: string) => (code === 'ns-1' ? 'netsuite' : null),
  }),
}))

jest.mock('~/components/customerConnections/useTaxProviders', () => ({
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
    getCrmProviderFromCode: (code?: string) => (code === 'hub-1' ? 'hubspot' : null),
  }),
}))

/** Row ids are `${category}-${code}` — codes come from the provider mocks above */
const ROW_IDS: Record<ConnectionCategory, string> = {
  [ConnectionCategory.Payment]: 'payment-stripe-eu',
  [ConnectionCategory.Accounting]: 'accounting-ns-1',
  [ConnectionCategory.Tax]: 'tax-anrok-1',
  [ConnectionCategory.Crm]: 'crm-hub-1',
}

const ANY_ROW_TEST_ID = new RegExp(`^${getCustomerConnectionRowTestId('')}`)

type FormPaymentConnection = NonNullable<
  CreateCustomerDefaultValues['paymentProviderCustomers']
>[number]
type FormIntegrationConnection = NonNullable<
  CreateCustomerDefaultValues['integrationCustomers']
>[number]

/** The provider-backed payment connection as `mapFromApiToForm` emits it */
const PAYMENT_CONNECTION: FormPaymentConnection = {
  id: 'pc-1',
  code: 'stripe',
  isDefault: true,
  providerCode: 'stripe-eu',
  providerType: ProviderTypeEnum.Stripe,
  providerCustomerId: 'cus_123',
  syncWithProvider: false,
  providerPaymentMethods: { [ProviderPaymentMethodsEnum.Card]: true },
}

/** A manual row persisted on the customer: kept in the form, never rendered */
const PERSISTED_MANUAL_CONNECTION: FormPaymentConnection = {
  id: 'pc-manual',
  code: MANUAL_CONNECTION_CODE,
  isDefault: false,
}

/**
 * The backend's non-persisted manual placeholder. `mapFromApiToForm` drops it,
 * but the accordion must not surface it either if it ever reaches the form.
 */
const PLACEHOLDER_MANUAL_CONNECTION: FormPaymentConnection = {
  id: 'cust-1-manual',
  code: MANUAL_CONNECTION_CODE,
  isDefault: false,
}

const TAX_CONNECTION: FormIntegrationConnection = {
  id: 'tax-row-id',
  category: ConnectionCategory.Tax,
  providerCode: 'anrok-1',
  providerType: IntegrationTypeEnum.Anrok,
  externalCustomerId: 'anrok_cus_1',
  syncWithProvider: false,
}

const ACCOUNTING_CONNECTION: FormIntegrationConnection = {
  id: 'acc-row-id',
  category: ConnectionCategory.Accounting,
  providerCode: 'ns-1',
  providerType: IntegrationTypeEnum.Netsuite,
  externalCustomerId: 'ns_cus_1',
  syncWithProvider: false,
  subsidiaryId: '',
}

const CRM_CONNECTION: FormIntegrationConnection = {
  id: 'crm-row-id',
  category: ConnectionCategory.Crm,
  providerCode: 'hub-1',
  providerType: IntegrationTypeEnum.Hubspot,
  externalCustomerId: 'hub_cus_1',
  syncWithProvider: false,
  targetedObject: HubspotTargetedObjectsEnum.Companies,
}

/** Customer form with the payment and tax connections in their arrays */
const buildDefaultValues = (
  overrides: Partial<CreateCustomerDefaultValues> = {},
): CreateCustomerDefaultValues => ({
  ...emptyCreateCustomerDefaultValues,
  paymentProviderCustomers: [PAYMENT_CONNECTION],
  integrationCustomers: [TAX_CONNECTION],
  ...overrides,
})

/** Customer form with one connection in each of the four categories */
const buildFullDefaultValues = (): CreateCustomerDefaultValues =>
  buildDefaultValues({
    integrationCustomers: [ACCOUNTING_CONNECTION, TAX_CONNECTION, CRM_CONNECTION],
  })

/** Customer whose four connections were persisted at load (locks the providers) */
const buildPersistedCustomer = (
  overrides: Record<string, unknown> = {},
): AddCustomerDrawerFragment =>
  ({
    id: 'cust-1',
    paymentProvider: ProviderTypeEnum.Stripe,
    paymentProviderCode: 'stripe-eu',
    paymentProviderCustomers: [
      {
        __typename: 'ProviderCustomer',
        id: 'pc-1',
        code: 'stripe',
        isDefault: true,
        providerCustomerId: 'cus_123',
      },
    ],
    integrationCustomers: [
      {
        __typename: 'NetsuiteCustomer',
        id: 'acc-row-id',
        integrationId: 'int-ns',
        integrationCode: 'ns-1',
        integrationType: IntegrationTypeEnum.Netsuite,
        externalCustomerId: 'ns_cus_1',
      },
      {
        __typename: 'AnrokCustomer',
        id: 'tax-row-id',
        integrationId: 'int-anrok',
        integrationCode: 'anrok-1',
        integrationType: IntegrationTypeEnum.Anrok,
        externalCustomerId: 'anrok_cus_1',
      },
      {
        __typename: 'HubspotCustomer',
        id: 'crm-row-id',
        integrationId: 'int-hub',
        integrationCode: 'hub-1',
        integrationType: IntegrationTypeEnum.Hubspot,
        externalCustomerId: 'hub_cus_1',
      },
    ],
    ...overrides,
  }) as unknown as AddCustomerDrawerFragment

/** Latest form values of the mounted harness */
const readFormValues: { current: (() => CreateCustomerDefaultValues) | null } = { current: null }

const getFormValues = (): CreateCustomerDefaultValues =>
  readFormValues.current?.() ?? emptyCreateCustomerDefaultValues

const Harness = ({
  defaultValues = buildDefaultValues(),
  customer = null,
}: {
  defaultValues?: CreateCustomerDefaultValues
  customer?: AddCustomerDrawerFragment | null
}) => {
  const form = useAppForm({ defaultValues })

  readFormValues.current = () => form.state.values

  return <ExternalAppsAccordion form={form} customer={customer} isEdition={!!customer} />
}

const openAccordion = async (): Promise<void> => {
  // The section accordion is collapsed by default
  await userEvent.click(await screen.findByRole('button', { name: /connect to external apps/i }))
}

const clickRow = async (category: ConnectionCategory): Promise<void> => {
  const row = screen.getByTestId(getCustomerConnectionRowTestId(ROW_IDS[category]))

  await userEvent.click(within(row).getAllByRole('button')[0])
}

const deleteRow = async (category: ConnectionCategory): Promise<void> => {
  await userEvent.click(screen.getByTestId(getCustomerConnectionMenuTestId(ROW_IDS[category])))
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /delete connection/i })).toBeVisible()
  })
  await userEvent.click(screen.getByRole('button', { name: /delete connection/i }))
  await waitFor(() => {
    expect(
      screen.queryByTestId(getCustomerConnectionRowTestId(ROW_IDS[category])),
    ).not.toBeInTheDocument()
  })
}

/** Drive the drawer's injected persistence strategy with arbitrary values */
const saveFromDrawer = async (
  category: ConnectionCategory,
  values: Partial<ConnectionFormValues>,
): Promise<void> => {
  await act(async () => {
    await capturedDrawerProps.current?.onSave?.(category, values as ConnectionFormValues, {
      isEdition: true,
    })
  })
}

describe('ExternalAppsAccordion', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedDrawerProps.current = null
    readFormValues.current = null
  })

  describe('GIVEN a customer form with payment and tax connections in its arrays', () => {
    describe('WHEN the section is opened', () => {
      it('THEN should derive one list row per array entry', async () => {
        render(<Harness />)

        await openAccordion()

        const paymentRow = screen.getByTestId(
          getCustomerConnectionRowTestId(ROW_IDS[ConnectionCategory.Payment]),
        )

        expect(paymentRow).toBeVisible()
        expect(paymentRow).toHaveTextContent('Stripe EU')
        expect(paymentRow).toHaveTextContent('stripe-eu')
        expect(
          screen.getByTestId(getCustomerConnectionRowTestId(ROW_IDS[ConnectionCategory.Tax])),
        ).toBeVisible()
        expect(
          screen.queryByTestId(
            getCustomerConnectionRowTestId(ROW_IDS[ConnectionCategory.Accounting]),
          ),
        ).not.toBeInTheDocument()
        expect(
          screen.queryByTestId(getCustomerConnectionRowTestId(ROW_IDS[ConnectionCategory.Crm])),
        ).not.toBeInTheDocument()
        expect(screen.getAllByTestId(ANY_ROW_TEST_ID)).toHaveLength(2)
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
      it('THEN should open the connection drawer in edit with the array-derived values', async () => {
        render(<Harness />)

        await openAccordion()
        await clickRow(ConnectionCategory.Payment)

        expect(mockOpenEdit).toHaveBeenCalledWith(
          ConnectionCategory.Payment,
          expect.objectContaining({
            providerCode: 'stripe-eu',
            providerType: ProviderTypeEnum.Stripe,
            externalCustomerId: 'cus_123',
            syncWithProvider: false,
            providerPaymentMethods: { [ProviderPaymentMethodsEnum.Card]: true },
          }),
          undefined,
        )
        expect(mockFormDrawerOpen).toHaveBeenCalledWith(
          expect.objectContaining({ title: expect.any(String) }),
        )
      })

      it('THEN should prefill an integration row from its own array entry', async () => {
        render(<Harness />)

        await openAccordion()
        await clickRow(ConnectionCategory.Tax)

        expect(mockOpenEdit).toHaveBeenCalledWith(
          ConnectionCategory.Tax,
          expect.objectContaining({
            providerCode: 'anrok-1',
            providerType: IntegrationTypeEnum.Anrok,
            externalCustomerId: 'anrok_cus_1',
            syncWithProvider: false,
          }),
          undefined,
        )
      })
    })

    describe('WHEN an available category is picked from the "Add a connection" menu', () => {
      it('THEN should open the connection drawer in create', async () => {
        render(<Harness />)

        await openAccordion()
        await userEvent.click(screen.getByRole('button', { name: /add a connection/i }))
        await userEvent.click(await screen.findByRole('button', { name: /accounting provider/i }))

        expect(mockOpenCreate).toHaveBeenCalledWith(ConnectionCategory.Accounting)
        expect(mockFormDrawerOpen).toHaveBeenCalledWith(
          expect.objectContaining({ title: expect.any(String) }),
        )
      })
    })

    describe('WHEN the edit drawer is submitted', () => {
      it('THEN should persist the connection back into the form array and close the drawer', async () => {
        render(<Harness />)

        await openAccordion()
        await clickRow(ConnectionCategory.Payment)

        // The drawer chrome is mocked: drive its submit through the captured config
        const drawerConfig = mockFormDrawerOpen.mock.calls[0][0]

        await act(async () => {
          await drawerConfig.form.submit()
        })

        await waitFor(() => {
          expect(mockFormDrawerClose).toHaveBeenCalled()
        })
        expect(getFormValues().paymentProviderCustomers).toEqual([
          expect.objectContaining({
            providerCode: 'stripe-eu',
            providerCustomerId: 'cus_123',
          }),
        ])
        // Array untouched by a same-values save: the row is still derived from it
        expect(
          screen.getByTestId(getCustomerConnectionRowTestId(ROW_IDS[ConnectionCategory.Payment])),
        ).toHaveTextContent('Stripe EU')
      })
    })
  })

  describe('GIVEN manual payment rows in the form array', () => {
    describe('WHEN the section is opened', () => {
      it('THEN should never render the persisted manual row nor the placeholder', async () => {
        render(
          <Harness
            defaultValues={buildDefaultValues({
              paymentProviderCustomers: [
                PLACEHOLDER_MANUAL_CONNECTION,
                PERSISTED_MANUAL_CONNECTION,
                PAYMENT_CONNECTION,
              ],
            })}
          />,
        )

        await openAccordion()

        // Only the provider payment row and the tax row are visible
        expect(screen.getAllByTestId(ANY_ROW_TEST_ID)).toHaveLength(2)
        expect(
          screen.getByTestId(getCustomerConnectionRowTestId(ROW_IDS[ConnectionCategory.Payment])),
        ).toBeVisible()
        expect(
          screen.queryByTestId(getCustomerConnectionRowTestId('payment-manual')),
        ).not.toBeInTheDocument()
        // The manual rows are still in the model (their ids must round-trip)
        expect(getFormValues().paymentProviderCustomers).toHaveLength(3)
      })
    })

    describe('WHEN only manual rows are present', () => {
      it('THEN should leave the payment category addable', async () => {
        render(
          <Harness
            defaultValues={buildDefaultValues({
              paymentProviderCustomers: [PERSISTED_MANUAL_CONNECTION],
            })}
          />,
        )

        await openAccordion()

        expect(
          screen.queryByTestId(getCustomerConnectionRowTestId(ROW_IDS[ConnectionCategory.Payment])),
        ).not.toBeInTheDocument()

        await userEvent.click(screen.getByRole('button', { name: /add a connection/i }))

        expect(await screen.findByRole('button', { name: /payment provider/i })).not.toBeDisabled()
      })
    })
  })

  describe('GIVEN a customer form with one connection in every category', () => {
    describe('WHEN the connections were persisted on the customer', () => {
      it('THEN should open the edit drawer from each row with its provider locked', async () => {
        render(
          <Harness defaultValues={buildFullDefaultValues()} customer={buildPersistedCustomer()} />,
        )

        await openAccordion()

        const categories = [
          ConnectionCategory.Payment,
          ConnectionCategory.Accounting,
          ConnectionCategory.Tax,
          ConnectionCategory.Crm,
        ]

        for (const category of categories) {
          await clickRow(category)
        }

        expect(mockOpenEdit).toHaveBeenCalledTimes(categories.length)
        expect(mockFormDrawerOpen).toHaveBeenCalledTimes(categories.length)
        expect(mockOpenEdit).toHaveBeenCalledWith(
          ConnectionCategory.Payment,
          expect.anything(),
          expect.objectContaining({ title: 'Stripe EU', subtitle: 'stripe-eu' }),
        )
        expect(mockOpenEdit).toHaveBeenCalledWith(
          ConnectionCategory.Tax,
          expect.anything(),
          expect.objectContaining({ title: 'Anrok Main', subtitle: 'anrok-1' }),
        )
      })

      it('THEN should keep the "Add a connection" opener disabled at the four-category cap', async () => {
        render(
          <Harness defaultValues={buildFullDefaultValues()} customer={buildPersistedCustomer()} />,
        )

        await openAccordion()

        expect(screen.getAllByTestId(ANY_ROW_TEST_ID)).toHaveLength(4)
        expect(screen.getByRole('button', { name: /add a connection/i })).toBeDisabled()
      })
    })

    describe('WHEN a connection was re-added in-session (not the persisted one)', () => {
      it('THEN should leave its provider editable', async () => {
        render(
          <Harness
            defaultValues={buildFullDefaultValues()}
            customer={buildPersistedCustomer({
              paymentProviderCustomers: [],
              integrationCustomers: [],
            })}
          />,
        )

        await openAccordion()
        await clickRow(ConnectionCategory.Tax)

        expect(mockOpenEdit).toHaveBeenCalledWith(
          ConnectionCategory.Tax,
          expect.anything(),
          undefined,
        )
      })
    })

    describe('WHEN accounting and crm connections are deleted from their row menus', () => {
      it('THEN should clear only the deleted connections', async () => {
        render(<Harness defaultValues={buildFullDefaultValues()} />)

        await openAccordion()

        await deleteRow(ConnectionCategory.Accounting)
        await deleteRow(ConnectionCategory.Crm)

        expect(
          screen.getByTestId(getCustomerConnectionRowTestId(ROW_IDS[ConnectionCategory.Payment])),
        ).toBeInTheDocument()
        expect(
          screen.getByTestId(getCustomerConnectionRowTestId(ROW_IDS[ConnectionCategory.Tax])),
        ).toBeInTheDocument()
        expect(getFormValues().integrationCustomers).toEqual([TAX_CONNECTION])
        expect(getFormValues().paymentProviderCustomers).toEqual([PAYMENT_CONNECTION])
      })
    })
  })

  describe('GIVEN a payment connection deletion', () => {
    describe('WHEN a persisted manual row sits next to the provider connection', () => {
      it('THEN should remove only the provider connection and keep the manual row', async () => {
        render(
          <Harness
            defaultValues={buildDefaultValues({
              paymentProviderCustomers: [PERSISTED_MANUAL_CONNECTION, PAYMENT_CONNECTION],
            })}
          />,
        )

        await openAccordion()
        await deleteRow(ConnectionCategory.Payment)

        expect(getFormValues().paymentProviderCustomers).toEqual([PERSISTED_MANUAL_CONNECTION])
        // Integration connections are untouched by a payment deletion
        expect(
          screen.getByTestId(getCustomerConnectionRowTestId(ROW_IDS[ConnectionCategory.Tax])),
        ).toBeInTheDocument()
        expect(getFormValues().integrationCustomers).toEqual([TAX_CONNECTION])
      })
    })
  })

  describe('GIVEN a payment connection save from the drawer', () => {
    describe('WHEN the provider is unchanged', () => {
      it('THEN should preserve the persisted id, code and isDefault', async () => {
        render(<Harness defaultValues={buildDefaultValues()} customer={buildPersistedCustomer()} />)

        await openAccordion()
        await saveFromDrawer(ConnectionCategory.Payment, {
          providerCode: 'stripe-eu',
          providerType: ProviderTypeEnum.Stripe,
          externalCustomerId: 'cus_999',
          syncWithProvider: true,
          providerPaymentMethods: { [ProviderPaymentMethodsEnum.Card]: true },
        })

        expect(getFormValues().paymentProviderCustomers).toEqual([
          {
            id: 'pc-1',
            code: 'stripe',
            isDefault: true,
            providerCode: 'stripe-eu',
            providerType: ProviderTypeEnum.Stripe,
            providerCustomerId: 'cus_999',
            syncWithProvider: true,
            providerPaymentMethods: { [ProviderPaymentMethodsEnum.Card]: true },
          },
        ])
      })
    })

    describe('WHEN the payment provider is switched', () => {
      it('THEN should drop the persisted id and code so the backend creates a new link, while the replacement inherits the default flag', async () => {
        render(<Harness defaultValues={buildDefaultValues()} customer={buildPersistedCustomer()} />)

        await openAccordion()
        await saveFromDrawer(ConnectionCategory.Payment, {
          providerCode: 'adyen-eu',
          providerType: ProviderTypeEnum.Adyen,
          externalCustomerId: 'adyen_cus_1',
          syncWithProvider: false,
        })

        expect(getFormValues().paymentProviderCustomers).toEqual([
          {
            id: undefined,
            code: undefined,
            // Inherited: dropping it would leave a customer that also has a
            // manual connection with no default at all
            isDefault: true,
            providerCode: 'adyen-eu',
            providerType: ProviderTypeEnum.Adyen,
            providerCustomerId: 'adyen_cus_1',
            syncWithProvider: false,
            providerPaymentMethods: {},
          },
        ])
        await waitFor(() => {
          expect(
            screen.getByTestId(getCustomerConnectionRowTestId('payment-adyen-eu')),
          ).toBeVisible()
        })
      })
    })

    describe('WHEN a persisted manual row is in the array', () => {
      it('THEN should keep it alongside the saved provider connection', async () => {
        render(
          <Harness
            defaultValues={buildDefaultValues({
              paymentProviderCustomers: [PERSISTED_MANUAL_CONNECTION, PAYMENT_CONNECTION],
            })}
            customer={buildPersistedCustomer()}
          />,
        )

        await openAccordion()
        await saveFromDrawer(ConnectionCategory.Payment, {
          providerCode: 'adyen-eu',
          providerType: ProviderTypeEnum.Adyen,
          externalCustomerId: 'adyen_cus_1',
        })

        expect(getFormValues().paymentProviderCustomers).toEqual([
          PERSISTED_MANUAL_CONNECTION,
          expect.objectContaining({ providerCode: 'adyen-eu' }),
        ])
      })
    })
  })

  describe('GIVEN an integration connection save from the drawer', () => {
    describe('WHEN the integration is unchanged', () => {
      it('THEN should preserve its persisted id', async () => {
        render(<Harness defaultValues={buildDefaultValues()} customer={buildPersistedCustomer()} />)

        await openAccordion()
        await saveFromDrawer(ConnectionCategory.Tax, {
          providerCode: 'anrok-1',
          providerType: IntegrationTypeEnum.Anrok,
          externalCustomerId: 'anrok_cus_UPDATED',
          syncWithProvider: true,
        })

        expect(getFormValues().integrationCustomers).toEqual([
          {
            id: 'tax-row-id',
            category: ConnectionCategory.Tax,
            providerCode: 'anrok-1',
            providerType: IntegrationTypeEnum.Anrok,
            externalCustomerId: 'anrok_cus_UPDATED',
            syncWithProvider: true,
          },
        ])
      })
    })

    describe('WHEN the integration is switched', () => {
      it('THEN should drop the persisted id', async () => {
        render(<Harness defaultValues={buildDefaultValues()} customer={buildPersistedCustomer()} />)

        await openAccordion()
        await saveFromDrawer(ConnectionCategory.Tax, {
          providerCode: 'avalara-1',
          providerType: IntegrationTypeEnum.Avalara,
          externalCustomerId: 'avalara_cus_1',
        })

        expect(getFormValues().integrationCustomers).toEqual([
          expect.objectContaining({
            id: undefined,
            category: ConnectionCategory.Tax,
            providerCode: 'avalara-1',
            providerType: IntegrationTypeEnum.Avalara,
          }),
        ])
      })
    })

    describe('WHEN a new category is saved', () => {
      it('THEN should append it without touching the other categories', async () => {
        render(<Harness />)

        await openAccordion()
        await saveFromDrawer(ConnectionCategory.Crm, {
          providerCode: 'hub-1',
          providerType: IntegrationTypeEnum.Hubspot,
          externalCustomerId: 'hub_cus_1',
          targetedObject: HubspotTargetedObjectsEnum.Companies,
        })

        expect(getFormValues().integrationCustomers).toEqual([
          TAX_CONNECTION,
          expect.objectContaining({
            category: ConnectionCategory.Crm,
            providerCode: 'hub-1',
            targetedObject: HubspotTargetedObjectsEnum.Companies,
          }),
        ])
        expect(getFormValues().paymentProviderCustomers).toEqual([PAYMENT_CONNECTION])
        await waitFor(() => {
          expect(
            screen.getByTestId(getCustomerConnectionRowTestId(ROW_IDS[ConnectionCategory.Crm])),
          ).toBeVisible()
        })
      })
    })
  })
})
