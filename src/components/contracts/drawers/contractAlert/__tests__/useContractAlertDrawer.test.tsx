import { ApolloLink } from '@apollo/client'
import { MockedProvider, MockedResponse, MockLink } from '@apollo/client/testing'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { GraphQLError } from 'graphql'
import { useSyncExternalStore } from 'react'

import { THRESHOLDS_ADD_ROW_TEST_ID } from '~/components/alerts/Thresholds'
import { CREATE_MORE_SWITCH_TEST_ID } from '~/components/drawers/createMore/CreateMoreControl'
import { FormDrawerProps } from '~/components/drawers/FormDrawer'
import { ComboBoxProps } from '~/components/form/ComboBox/types'
import {
  SCOPE_ROW_ADD_FILTERS_TEST_ID,
  SCOPE_ROW_ALL_FILTERS_TEST_ID,
  SCOPE_ROW_ERROR_TEST_ID,
  SCOPE_ROW_FILTER_TEST_ID,
  SCOPE_ROW_PRODUCT_TEST_ID,
  SCOPE_ROW_REMOVE_TEST_ID,
  SCOPE_ROW_TYPE_TEST_ID,
} from '~/components/scope/ScopeRow'
import { addToast } from '~/core/apolloClient'
import {
  ContractAlertForDrawerFragment,
  ContractAlertScopeTypeEnum,
  ContractAlertTypeEnum,
  CreateContractAlertDocument,
  CurrencyEnum,
  GetContractAlertDrawerScopeOptionsDocument,
  GetContractAlertsForAlertDrawerDocument,
  LagoApiError,
  NotifyOnEnum,
  ProductTypeEnum,
  UpdateContractAlertDocument,
} from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import {
  CONTRACT_ALERT_DRAWER_ADD_SCOPE_TEST_ID,
  CONTRACT_ALERT_DRAWER_ALERT_TYPE_TEST_ID,
  CONTRACT_ALERT_DRAWER_SCOPE_ERROR_TEST_ID,
  CONTRACT_ALERT_DRAWER_SKELETON_TEST_ID,
} from '../ContractAlertDrawerContent'
import {
  CONTRACT_ALERT_DRAWER_SUBMIT_TEST_ID,
  ContractAlertDrawerProps,
  useContractAlertDrawer,
} from '../useContractAlertDrawer'

type DrawerArgs = Partial<FormDrawerProps>

const mockDrawerStore: { args: DrawerArgs | null; listeners: Set<() => void> } = {
  args: null,
  listeners: new Set(),
}
const mockSetDrawerArgs = (args: DrawerArgs | null): void => {
  mockDrawerStore.args = args
  mockDrawerStore.listeners.forEach((listener) => listener())
}
const mockClose = jest.fn(() => mockSetDrawerArgs(null))
const mockUpdate = jest.fn((props: DrawerArgs) => {
  if (mockDrawerStore.args) mockSetDrawerArgs({ ...mockDrawerStore.args, ...props })
})

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn(), update: mockUpdate }),
  useFormDrawer: () => ({
    open: (args: DrawerArgs) => mockSetDrawerArgs(args),
    close: mockClose,
    update: mockUpdate,
  }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/components/form/ComboBox/ComboBox', () => ({
  ComboBox: ({ data, disabled, value, error, onChange, 'data-test': dataTest }: ComboBoxProps) => (
    <select
      data-test={dataTest}
      disabled={disabled}
      aria-invalid={!!error}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="" />
      {data?.map(({ value: optionValue, label, disabled: optionDisabled }) => (
        <option key={optionValue} value={optionValue} disabled={optionDisabled}>
          {label}
        </option>
      ))}
    </select>
  ),
}))

const PRODUCT_P = {
  __typename: 'Product',
  id: 'P',
  name: 'Product P',
  code: 'product_p',
  invoiceDisplayName: null,
  productType: ProductTypeEnum.Metered,
  productCategory: null,
}

const appliedRateCard = (id: string, filterId?: string) => ({
  __typename: 'ContractAppliedRateCard',
  id,
  product: PRODUCT_P,
  rateCard: {
    __typename: 'RateCard',
    id: `rc-${id}`,
    productFilter: filterId
      ? {
          __typename: 'ProductFilter',
          id: filterId,
          name: `Filter ${filterId}`,
          code: filterId,
          invoiceDisplayName: null,
        }
      : null,
  },
})

const scopeOptionsMock = (delay = 0): MockedResponse => ({
  request: { query: GetContractAlertDrawerScopeOptionsDocument },
  variableMatcher: () => true,
  maxUsageCount: Number.POSITIVE_INFINITY,
  delay,
  result: {
    data: {
      contract: {
        __typename: 'Contract',
        id: 'contract-1',
        appliedRateCards: [appliedRateCard('arc-1'), appliedRateCard('arc-2', 'F1')],
      },
    },
  },
})

type ExistingAlert = {
  alertType: ContractAlertTypeEnum
  productCode: string | null
  productFilterCode: string | null
  withProductFilters: boolean
}

const existingAlertsMock = (
  alerts: ExistingAlert[] = [],
  { delay = 0, onRequest }: { delay?: number; onRequest?: () => void } = {},
): MockedResponse => ({
  request: { query: GetContractAlertsForAlertDrawerDocument },
  variableMatcher: () => {
    onRequest?.()
    return true
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
  delay,
  result: {
    data: {
      contractAlerts: {
        __typename: 'ContractAlertCollection',
        collection: alerts.map((alert, index) => ({
          __typename: 'ContractAlert',
          id: `existing-${index}`,
          alertType: alert.alertType,
          scope: alert.productCode
            ? [
                {
                  __typename: 'ContractAlertScope',
                  withProductFilters: alert.withProductFilters,
                  product: {
                    __typename: 'Product',
                    id: alert.productCode,
                    code: alert.productCode,
                  },
                  productFilters: alert.productFilterCode
                    ? [
                        {
                          __typename: 'ProductFilter',
                          id: alert.productFilterCode,
                          code: alert.productFilterCode,
                        },
                      ]
                    : null,
                },
              ]
            : [],
        })),
      },
    },
  },
})

const graphQLError = (details: Record<string, string[]>): GraphQLError =>
  new GraphQLError('Unprocessable Entity', {
    extensions: { code: 'unprocessable_entity', details },
  })

const createMock = (
  onInput: (input: Record<string, unknown>) => void,
  errors?: GraphQLError[],
): MockedResponse => ({
  request: { query: CreateContractAlertDocument },
  variableMatcher: (variables) => {
    onInput(variables?.input)
    return true
  },
  result: errors
    ? { data: { createContractAlert: null }, errors }
    : { data: { createContractAlert: { __typename: 'ContractAlert', id: 'new-alert' } } },
})

const EXISTING_ALERT: ContractAlertForDrawerFragment = {
  id: 'alert-1',
  name: 'Usage alert',
  code: 'usage_alert',
  alertType: ContractAlertTypeEnum.UsageUnits,
  scope: [
    {
      type: ContractAlertScopeTypeEnum.Contract,
      withProductFilters: null,
      product: { id: 'P', name: 'Product P', code: 'product_p', invoiceDisplayName: null },
      productFilters: [{ id: 'F1', name: 'Filter F1', code: 'F1', invoiceDisplayName: null }],
    },
  ],
  thresholds: [{ code: null, recurring: false, value: '10.0', notifyOn: [NotifyOnEnum.Triggered] }],
}

const updateMock = (
  onInput: (input: Record<string, unknown>) => void,
  errors?: GraphQLError[],
): MockedResponse => ({
  request: { query: UpdateContractAlertDocument },
  variableMatcher: (variables) => {
    onInput(variables?.input)
    return true
  },
  result: errors
    ? { data: { updateContractAlert: null }, errors }
    : {
        data: {
          updateContractAlert: {
            __typename: 'ContractAlert',
            ...EXISTING_ALERT,
            scope: EXISTING_ALERT.scope.map(({ product, productFilters, ...entry }) => ({
              __typename: 'ContractAlertScope',
              ...entry,
              product: { __typename: 'Product', ...product, productCategory: null },
              productFilters: productFilters?.map((productFilter) => ({
                __typename: 'ProductFilter',
                ...productFilter,
              })),
            })),
            thresholds: EXISTING_ALERT.thresholds.map((threshold) => ({
              __typename: 'AlertThreshold',
              ...threshold,
            })),
          },
        },
      },
})

let openDrawerRef: ((props: ContractAlertDrawerProps) => void) | null = null

const subscribe = (listener: () => void): (() => void) => {
  mockDrawerStore.listeners.add(listener)

  return () => mockDrawerStore.listeners.delete(listener)
}

const DrawerOutlet = (): JSX.Element => {
  const args = useSyncExternalStore(subscribe, () => mockDrawerStore.args)

  return (
    <>
      {args?.children}
      {args?.secondaryAction}
      {args?.mainAction}
    </>
  )
}

const Host = (): JSX.Element => {
  const { openDrawer } = useContractAlertDrawer()

  openDrawerRef = openDrawer

  return <DrawerOutlet />
}

type CapturedOperation = { operationName: string; silentErrorDetails: unknown }

const renderHost = async (
  mocks: MockedResponse[],
  capturedOperations: CapturedOperation[] = [],
): Promise<void> => {
  const captureLink = new ApolloLink((operation, forward) => {
    capturedOperations.push({
      operationName: operation.operationName,
      silentErrorDetails: operation.getContext().silentErrorDetails,
    })

    return forward(operation)
  })

  await act(async () => {
    render(
      <AllTheProviders>
        <MockedProvider
          addTypename={false}
          link={ApolloLink.from([captureLink, new MockLink(mocks, false)])}
          defaultOptions={{ mutate: { errorPolicy: 'all' }, watchQuery: { errorPolicy: 'all' } }}
        >
          <Host />
        </MockedProvider>
      </AllTheProviders>,
    )
  })
}

const openDrawer = async (props: Partial<ContractAlertDrawerProps> = {}): Promise<void> => {
  await act(async () => {
    openDrawerRef?.({ contractId: 'contract-1', currency: CurrencyEnum.Eur, ...props })
  })
}

const select = async (testId: string, value: string): Promise<void> => {
  await act(async () => {
    fireEvent.change(screen.getByTestId(testId), { target: { value } })
  })
}

const pickAlertType = (alertType: ContractAlertTypeEnum): Promise<void> =>
  select(CONTRACT_ALERT_DRAWER_ALERT_TYPE_TEST_ID, alertType)

const typeInto = async (input: HTMLElement, value: string): Promise<void> => {
  await act(async () => {
    fireEvent.change(input, { target: { value } })
  })
}

const submit = async (): Promise<void> => {
  await act(async () => {
    await mockDrawerStore.args?.form?.submit()
  })
}

const getNameInput = (): HTMLInputElement => screen.getByPlaceholderText('Type a name')

const SILENT_ERROR_DETAILS = [
  LagoApiError.AlertAlreadyExists,
  LagoApiError.ProductRequiredForUnits,
  LagoApiError.ValueAlreadyExist,
]

describe('useContractAlertDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSetDrawerArgs(null)
  })

  describe('GIVEN the create drawer is opened', () => {
    describe('WHEN no alert type is picked yet', () => {
      it('THEN should render neither the scope nor the thresholds', async () => {
        await renderHost([scopeOptionsMock(), existingAlertsMock()])
        await openDrawer()

        expect(screen.getByTestId(CONTRACT_ALERT_DRAWER_ALERT_TYPE_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(SCOPE_ROW_TYPE_TEST_ID)).not.toBeInTheDocument()
        expect(
          screen.queryByTestId(CONTRACT_ALERT_DRAWER_ADD_SCOPE_TEST_ID),
        ).not.toBeInTheDocument()
        expect(screen.queryByTestId(THRESHOLDS_ADD_ROW_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN usage units is picked', () => {
      it('THEN should render the scope row without a trash button', async () => {
        await renderHost([scopeOptionsMock(), existingAlertsMock()])
        await openDrawer()
        await pickAlertType(ContractAlertTypeEnum.UsageUnits)

        expect(await screen.findByTestId(SCOPE_ROW_TYPE_TEST_ID)).toBeDisabled()
        expect(screen.queryByTestId(SCOPE_ROW_REMOVE_TEST_ID)).not.toBeInTheDocument()
        expect(screen.getByTestId(THRESHOLDS_ADD_ROW_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN usage amount is picked on a free contract', () => {
      it('THEN should add and remove the scope row on demand', async () => {
        await renderHost([scopeOptionsMock(), existingAlertsMock()])
        await openDrawer()
        await pickAlertType(ContractAlertTypeEnum.UsageAmount)

        const addScope = await screen.findByTestId(CONTRACT_ALERT_DRAWER_ADD_SCOPE_TEST_ID)

        expect(screen.queryByTestId(SCOPE_ROW_TYPE_TEST_ID)).not.toBeInTheDocument()

        await act(async () => {
          fireEvent.click(addScope)
        })

        expect(screen.getByTestId(SCOPE_ROW_TYPE_TEST_ID)).toBeInTheDocument()
        expect(
          screen.queryByTestId(CONTRACT_ALERT_DRAWER_ADD_SCOPE_TEST_ID),
        ).not.toBeInTheDocument()

        await act(async () => {
          fireEvent.click(screen.getByTestId(SCOPE_ROW_REMOVE_TEST_ID))
        })

        expect(screen.queryByTestId(SCOPE_ROW_TYPE_TEST_ID)).not.toBeInTheDocument()
        expect(screen.getByTestId(CONTRACT_ALERT_DRAWER_ADD_SCOPE_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN usage amount is picked and a whole-contract alert exists', () => {
      it('THEN should require a non-removable scope row', async () => {
        await renderHost([
          scopeOptionsMock(),
          existingAlertsMock([
            {
              alertType: ContractAlertTypeEnum.UsageAmount,
              productCode: null,
              productFilterCode: null,
              withProductFilters: false,
            },
          ]),
        ])
        await openDrawer()

        await waitFor(() =>
          expect(screen.getByTestId(CONTRACT_ALERT_DRAWER_SUBMIT_TEST_ID)).not.toBeDisabled(),
        )
        await pickAlertType(ContractAlertTypeEnum.UsageAmount)

        expect(screen.getByTestId(SCOPE_ROW_TYPE_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(SCOPE_ROW_REMOVE_TEST_ID)).not.toBeInTheDocument()
        expect(
          screen.queryByTestId(CONTRACT_ALERT_DRAWER_ADD_SCOPE_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN the applied rate cards are still loading', () => {
      it('THEN should show skeletons and disable the submit button', async () => {
        await renderHost([scopeOptionsMock(60_000), existingAlertsMock()])
        await openDrawer()
        await pickAlertType(ContractAlertTypeEnum.UsageUnits)

        expect(screen.getAllByTestId(CONTRACT_ALERT_DRAWER_SKELETON_TEST_ID)).not.toHaveLength(0)
        expect(screen.queryByTestId(SCOPE_ROW_TYPE_TEST_ID)).not.toBeInTheDocument()
        expect(screen.getByTestId(CONTRACT_ALERT_DRAWER_SUBMIT_TEST_ID)).toBeDisabled()
      })
    })

    describe('WHEN the existing alerts arrive after usage amount was picked', () => {
      it('THEN should seed the required scope row once the whole contract shows as taken', async () => {
        await renderHost([
          scopeOptionsMock(),
          existingAlertsMock(
            [
              {
                alertType: ContractAlertTypeEnum.UsageAmount,
                productCode: null,
                productFilterCode: null,
                withProductFilters: false,
              },
            ],
            { delay: 50 },
          ),
        ])
        await openDrawer()
        await pickAlertType(ContractAlertTypeEnum.UsageAmount)

        expect(screen.queryByTestId(SCOPE_ROW_TYPE_TEST_ID)).not.toBeInTheDocument()

        expect(await screen.findByTestId(SCOPE_ROW_TYPE_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(SCOPE_ROW_REMOVE_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN a units alert on a product with all its filters is submitted', () => {
      it('THEN should send the flat scope and the typed threshold', async () => {
        let capturedInput: Record<string, unknown> | undefined

        await renderHost([
          scopeOptionsMock(),
          existingAlertsMock(),
          createMock((input) => {
            capturedInput = input
          }),
        ])
        await openDrawer()
        await typeInto(getNameInput(), 'My alert')
        await pickAlertType(ContractAlertTypeEnum.UsageUnits)
        await screen.findByTestId(SCOPE_ROW_PRODUCT_TEST_ID)

        await act(async () => {
          fireEvent.click(
            within(screen.getByTestId(SCOPE_ROW_ALL_FILTERS_TEST_ID)).getByRole('checkbox'),
          )
        })
        await typeInto(screen.getByPlaceholderText('0.00'), '100')
        await submit()

        await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))
        expect(capturedInput).toEqual({
          contractId: 'contract-1',
          name: 'My alert',
          code: 'my_alert',
          alertType: ContractAlertTypeEnum.UsageUnits,
          scope: [
            {
              type: ContractAlertScopeTypeEnum.Contract,
              productCode: 'product_p',
              withProductFilters: true,
            },
          ],
          thresholds: [
            { code: '', recurring: false, value: '100', notifyOn: [NotifyOnEnum.Triggered] },
          ],
        })
        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
      })
    })

    describe('WHEN create more is on and the alert is created', () => {
      it('THEN should reset the form and keep the drawer open', async () => {
        await renderHost([scopeOptionsMock(), existingAlertsMock(), createMock(() => undefined)])
        await openDrawer()

        await act(async () => {
          fireEvent.click(screen.getByTestId(CREATE_MORE_SWITCH_TEST_ID))
        })
        await typeInto(getNameInput(), 'My alert')
        await pickAlertType(ContractAlertTypeEnum.UsageAmount)
        await typeInto(await screen.findByPlaceholderText('0.00'), '10')
        await submit()

        await waitFor(() =>
          expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' })),
        )
        expect(mockClose).not.toHaveBeenCalled()
        expect(getNameInput()).toHaveValue('')
        expect(screen.queryByTestId(THRESHOLDS_ADD_ROW_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the backend answers alert_already_exists on a whole-contract alert', () => {
      it('THEN should show the scope error and keep the drawer open', async () => {
        const capturedOperations: CapturedOperation[] = []

        await renderHost(
          [
            scopeOptionsMock(),
            existingAlertsMock(),
            createMock(() => undefined, [graphQLError({ base: ['alert_already_exists'] })]),
          ],
          capturedOperations,
        )
        await openDrawer()
        await typeInto(getNameInput(), 'My alert')
        await pickAlertType(ContractAlertTypeEnum.UsageAmount)
        await typeInto(await screen.findByPlaceholderText('0.00'), '10')
        await submit()

        expect(
          await screen.findByTestId(CONTRACT_ALERT_DRAWER_SCOPE_ERROR_TEST_ID),
        ).toBeInTheDocument()
        expect(mockClose).not.toHaveBeenCalled()
        expect(capturedOperations).toContainEqual({
          operationName: 'createContractAlert',
          silentErrorDetails: SILENT_ERROR_DETAILS,
        })
      })
    })

    describe('WHEN the backend answers alert_already_exists on a product scope', () => {
      it('THEN should flag the product and keep the drawer open', async () => {
        await renderHost([
          scopeOptionsMock(),
          existingAlertsMock(),
          createMock(() => undefined, [graphQLError({ base: ['alert_already_exists'] })]),
        ])
        await openDrawer()
        await typeInto(getNameInput(), 'My alert')
        await pickAlertType(ContractAlertTypeEnum.UsageUnits)
        await screen.findByTestId(SCOPE_ROW_PRODUCT_TEST_ID)
        await typeInto(screen.getByPlaceholderText('0.00'), '10')

        expect(screen.getByTestId(SCOPE_ROW_PRODUCT_TEST_ID)).toBeValid()

        await submit()

        await waitFor(() => expect(screen.getByTestId(SCOPE_ROW_PRODUCT_TEST_ID)).toBeInvalid())
        expect(mockClose).not.toHaveBeenCalled()
      })
    })

    describe('WHEN a filter is added but left empty', () => {
      it('THEN should flag the filter and not create the alert', async () => {
        const onCreate = jest.fn()

        await renderHost([scopeOptionsMock(), existingAlertsMock(), createMock(onCreate)])
        await openDrawer()
        await typeInto(getNameInput(), 'My alert')
        await pickAlertType(ContractAlertTypeEnum.UsageUnits)
        await screen.findByTestId(SCOPE_ROW_PRODUCT_TEST_ID)
        await typeInto(screen.getByPlaceholderText('0.00'), '10')

        await act(async () => {
          fireEvent.click(screen.getByTestId(SCOPE_ROW_ADD_FILTERS_TEST_ID))
        })
        await submit()

        await waitFor(() => expect(screen.getByTestId(SCOPE_ROW_FILTER_TEST_ID)).toBeInvalid())
        expect(onCreate).not.toHaveBeenCalled()
        expect(mockClose).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the alert type switches from units to amount', () => {
      it('THEN should truncate the kept thresholds to the currency precision', async () => {
        await renderHost([scopeOptionsMock(), existingAlertsMock()])
        await openDrawer({ currency: CurrencyEnum.Usd })
        await pickAlertType(ContractAlertTypeEnum.UsageUnits)
        await screen.findByTestId(SCOPE_ROW_PRODUCT_TEST_ID)
        await typeInto(screen.getByPlaceholderText('0.00'), '1.23456')

        expect(screen.getByDisplayValue('1.23456')).toBeInTheDocument()

        await pickAlertType(ContractAlertTypeEnum.UsageAmount)

        expect(screen.getByDisplayValue('1.23')).toBeInTheDocument()
        expect(screen.queryByDisplayValue('1.23456')).not.toBeInTheDocument()
      })
    })

    describe('WHEN the backend answers product_required_for_units', () => {
      it('THEN should show the error in the scope row', async () => {
        await renderHost([
          scopeOptionsMock(),
          existingAlertsMock(),
          createMock(() => undefined, [graphQLError({ scope: ['product_required_for_units'] })]),
        ])
        await openDrawer()
        await typeInto(getNameInput(), 'My alert')
        await pickAlertType(ContractAlertTypeEnum.UsageUnits)
        await screen.findByTestId(SCOPE_ROW_PRODUCT_TEST_ID)
        await select(SCOPE_ROW_PRODUCT_TEST_ID, 'product_p')
        await typeInto(screen.getByPlaceholderText('0.00'), '10')
        await submit()

        expect(await screen.findByTestId(SCOPE_ROW_ERROR_TEST_ID)).toBeInTheDocument()
        expect(mockClose).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the backend answers a taken code', () => {
      it('THEN should flag the code field and keep the drawer open', async () => {
        await renderHost([
          scopeOptionsMock(),
          existingAlertsMock(),
          createMock(() => undefined, [graphQLError({ code: ['value_already_exist'] })]),
        ])
        await openDrawer()
        await typeInto(getNameInput(), 'My alert')
        await pickAlertType(ContractAlertTypeEnum.UsageAmount)
        await typeInto(await screen.findByPlaceholderText('0.00'), '10')
        await submit()

        await waitFor(() => expect(screen.getByPlaceholderText('Type a code')).toBeInvalid())
        expect(mockClose).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the name is edited', () => {
      it('THEN should prompt before closing', async () => {
        await renderHost([scopeOptionsMock(), existingAlertsMock()])
        await openDrawer()

        expect(mockDrawerStore.args?.shouldPromptOnClose?.()).toBe(false)

        await typeInto(getNameInput(), 'My alert')

        expect(mockDrawerStore.args?.shouldPromptOnClose?.()).toBe(true)
      })
    })
  })

  describe('GIVEN the edit drawer is opened', () => {
    describe('WHEN it renders', () => {
      it('THEN should lock the code, the type and the scope', async () => {
        const onExistingAlertsRequest = jest.fn()

        await renderHost([
          scopeOptionsMock(),
          existingAlertsMock([], { onRequest: onExistingAlertsRequest }),
        ])
        await openDrawer({ alert: EXISTING_ALERT })

        expect(await screen.findByTestId(SCOPE_ROW_PRODUCT_TEST_ID)).toBeDisabled()
        expect(screen.getByTestId(SCOPE_ROW_TYPE_TEST_ID)).toBeDisabled()
        expect(screen.getByTestId(CONTRACT_ALERT_DRAWER_ALERT_TYPE_TEST_ID)).toBeDisabled()
        expect(screen.getByDisplayValue('usage_alert')).toBeDisabled()
        expect(screen.queryByTestId(SCOPE_ROW_REMOVE_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(CREATE_MORE_SWITCH_TEST_ID)).not.toBeInTheDocument()
        expect(onExistingAlertsRequest).not.toHaveBeenCalled()
      })
    })

    describe('WHEN a create drawer was closed before', () => {
      it('THEN should submit the renamed alert once with the update input only', async () => {
        let capturedInput: Record<string, unknown> | undefined
        const onUpdate = jest.fn((input: Record<string, unknown>) => {
          capturedInput = input
        })

        const capturedOperations: CapturedOperation[] = []

        await renderHost(
          [scopeOptionsMock(), existingAlertsMock(), updateMock(onUpdate)],
          capturedOperations,
        )
        await openDrawer()
        await act(async () => {
          mockDrawerStore.args?.onClose?.()
        })
        await openDrawer({ alert: EXISTING_ALERT })
        await screen.findByTestId(SCOPE_ROW_PRODUCT_TEST_ID)

        await typeInto(getNameInput(), 'Renamed alert')
        await submit()

        await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))
        expect(onUpdate).toHaveBeenCalledTimes(1)
        expect(capturedInput).toEqual({
          id: 'alert-1',
          name: 'Renamed alert',
          thresholds: [
            { code: null, recurring: false, value: '10', notifyOn: [NotifyOnEnum.Triggered] },
          ],
        })
        expect(capturedOperations).toContainEqual({
          operationName: 'updateContractAlert',
          silentErrorDetails: SILENT_ERROR_DETAILS,
        })
      })
    })

    describe('WHEN the alert was deleted meanwhile', () => {
      it('THEN should close the drawer without a success toast', async () => {
        await renderHost([
          scopeOptionsMock(),
          updateMock(() => undefined, [graphQLError({ alert: ['not_found'] })]),
        ])
        await openDrawer({ alert: EXISTING_ALERT })
        await screen.findByTestId(SCOPE_ROW_PRODUCT_TEST_ID)

        await typeInto(getNameInput(), 'Renamed alert')
        await submit()

        await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))
        expect(addToast).not.toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
      })
    })
  })
})
