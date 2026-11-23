import { ApolloClient, ApolloLink, ApolloProvider, InMemoryCache, Observable } from '@apollo/client'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router'

import { COMBOBOX_LOADING_TEST_ID } from '~/components/form/ComboBox/ComboBoxInput'
import { ComboBoxProps } from '~/components/form/ComboBox/types'
import { MappableTypeEnum, MappingTypeEnum } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'

import { QuickbooksIntegrationMapItemDrawerContent } from '../QuickbooksIntegrationMapItemDrawerContent'
import { toQuickbooksOption } from '../toQuickbooksOption'
import { quickbooksMappingDefaultValues } from '../validationSchema'

const mockRenderedOptions = jest.fn()

// The real ComboBox virtualizes its options (0px in jsdom) and two open dropdowns probe flakily,
// so the spy records the `data` each field is given instead.
jest.mock('~/components/form/ComboBox/ComboBox', () => {
  const actual = jest.requireActual('~/components/form/ComboBox/ComboBox')

  return {
    ComboBox: (props: ComboBoxProps) => {
      mockRenderedOptions(
        props.name,
        (props.data || []).filter(({ hidden }) => !hidden).map((option) => option.label),
      )

      return <actual.ComboBox {...props} virtualized={false} />
    },
  }
})

const lastOptionsFor = (billingEntityKey: string): string[] => {
  const call = mockRenderedOptions.mock.calls
    .filter(([name]) => name === `${billingEntityKey}.selectedElementValue`)
    .at(-1)

  return (call?.[1] as string[]) ?? []
}

const INTEGRATION_ID = 'integration-1'
const DEBOUNCE_MS = 700

const ITEMS_QUERY = 'getQuickbooksIntegrationItems'
const ITEMS_REFETCH_MUTATION = 'triggerQuickbooksIntegrationItemsRefetch'
const ACCOUNTS_REFETCH_MUTATION = 'triggerQuickbooksIntegrationAccountsRefetch'

// QuickBooks items and accounts carry no account code.
const ITEM_A = { externalId: 'ext-1', externalName: 'Sales' }
const ITEM_B = { externalId: 'ext-2', externalName: 'Services' }
const ITEM_C = { externalId: 'ext-3', externalName: 'Support' }

const ALL_ITEMS = [ITEM_A, ITEM_B, ITEM_C]

// The id has to identify the item, not its position in a result set: Apollo normalises
// IntegrationItem by id, so an index-based id lets a search result overwrite another item.
const toApiItem = (item: typeof ITEM_A) => ({
  __typename: 'IntegrationItem',
  id: `item-${item.externalId}`,
  externalId: item.externalId,
  externalName: item.externalName,
  externalAccountCode: null,
  itemType: 'standard',
})

const buildResponse = (items: Array<Record<string, unknown>>) => ({
  integrationItems: {
    __typename: 'IntegrationItemCollection',
    collection: items,
    metadata: {
      __typename: 'CollectionMetadata',
      currentPage: 1,
      totalPages: 1,
      totalCount: items.length,
    },
  },
})

const BILLING_ENTITIES = [
  { id: null, key: 'default', name: 'Default' },
  { id: 'be-1', key: 'acme', name: 'Acme' },
  { id: 'be-2', key: 'globex', name: 'Globex' },
]

const buildRefetchResponse = (operationName: string) =>
  operationName === ACCOUNTS_REFETCH_MUTATION
    ? { fetchIntegrationAccounts: { __typename: 'IntegrationItemCollection', collection: [] } }
    : { fetchIntegrationItems: { __typename: 'IntegrationItemCollection', collection: [] } }

const getInput = (billingEntityKey: string): HTMLInputElement =>
  document.querySelector(
    `input[name="${billingEntityKey}.selectedElementValue"]`,
  ) as HTMLInputElement

const settle = async (ms = 50): Promise<void> => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })
}

const renderDrawer = ({
  seeded = false,
  searchDelayMs = 0,
  formType = MappableTypeEnum.AddOn,
}: {
  seeded?: boolean
  searchDelayMs?: number
  formType?: MappableTypeEnum | MappingTypeEnum
} = {}) => {
  mockRenderedOptions.mockClear()

  const executedOperations = jest.fn()

  // The app client is cache-and-network with a cache-first follow-up; a lazy query re-executed
  // with the same variables still reaches the link, so only a real link exposes the refetches.
  const client = new ApolloClient({
    link: new ApolloLink((operation) => {
      executedOperations(operation.operationName, operation.variables)

      if (operation.operationName !== ITEMS_QUERY) {
        return new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: buildRefetchResponse(operation.operationName) })
            observer.complete()
          }, 0)
        })
      }

      const { searchTerm } = operation.variables
      const matching = ALL_ITEMS.filter(
        ({ externalName }) =>
          !searchTerm || externalName.toLowerCase().includes(String(searchTerm).toLowerCase()),
      )

      return new Observable((observer) => {
        setTimeout(
          () => {
            observer.next({
              data: buildResponse(matching.map(toApiItem)),
            })
            observer.complete()
          },
          searchTerm ? searchDelayMs : 0,
        )
      })
    }),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first',
        errorPolicy: 'all',
      },
      mutate: { errorPolicy: 'all' },
    },
  })

  const Host = () => {
    const form = useAppForm({
      defaultValues: seeded
        ? {
            default: { selectedElementValue: toQuickbooksOption(ITEM_A).value },
            acme: { selectedElementValue: toQuickbooksOption(ITEM_B).value },
          }
        : quickbooksMappingDefaultValues,
    })

    return (
      <QuickbooksIntegrationMapItemDrawerContent
        title="Map item"
        description="Pick a Quickbooks item"
        billingEntities={BILLING_ENTITIES}
        form={form}
        formId="quickbooks-map-item-form"
        formType={formType}
        integrationId={INTEGRATION_ID}
      />
    )
  }

  render(
    <BrowserRouter basename="/">
      <ApolloProvider client={client}>
        <Host />
      </ApolloProvider>
    </BrowserRouter>,
  )

  const callsTo = (operationName: string) =>
    executedOperations.mock.calls.filter(([name]) => name === operationName)

  return {
    executedOperations,
    // Searches run the same query with a term: the catalog is the query without one.
    catalogQueries: () => callsTo(ITEMS_QUERY).filter(([, { searchTerm }]) => !searchTerm),
    searchQueries: () => callsTo(ITEMS_QUERY).filter(([, { searchTerm }]) => !!searchTerm),
    callsTo,
    user: userEvent.setup({ pointerEventsCheck: 0 }),
  }
}

describe('QuickbooksIntegrationMapItemDrawerContent', () => {
  describe('GIVEN a drawer with several billing entity tabs', () => {
    describe('WHEN it opens', () => {
      // Opening the drawer syncs the QuickBooks catalog, so an item created there since the last
      // sync can be mapped without leaving the drawer.
      it('THEN should trigger the items sync exactly once', async () => {
        const { callsTo } = renderDrawer()

        await settle()

        expect(callsTo(ITEMS_REFETCH_MUTATION)).toEqual([
          [ITEMS_REFETCH_MUTATION, { input: { integrationId: INTEGRATION_ID } }],
        ])
        expect(callsTo(ACCOUNTS_REFETCH_MUTATION)).toHaveLength(0)
      })

      it('THEN should trigger the accounts sync instead in an account context', async () => {
        const { callsTo, catalogQueries } = renderDrawer({ formType: MappingTypeEnum.Account })

        await settle()

        expect(callsTo(ACCOUNTS_REFETCH_MUTATION)).toEqual([
          [ACCOUNTS_REFETCH_MUTATION, { input: { integrationId: INTEGRATION_ID } }],
        ])
        expect(callsTo(ITEMS_REFETCH_MUTATION)).toHaveLength(0)
        expect(catalogQueries()).not.toHaveLength(0)
        catalogQueries().forEach(([, variables]) =>
          expect(variables).toEqual({
            integrationId: INTEGRATION_ID,
            itemType: 'account',
            limit: 1000,
          }),
        )
      })

      it('THEN should load the catalog, then reload it once the sync completes', async () => {
        const { catalogQueries, searchQueries } = renderDrawer()

        await settle()

        const catalogQuery = [
          ITEMS_QUERY,
          { integrationId: INTEGRATION_ID, itemType: 'standard', limit: 1000 },
        ]

        expect(catalogQueries()).toEqual([catalogQuery, catalogQuery])
        expect(searchQueries()).toHaveLength(0)
      })

      it('THEN should give the fetched options to every rendered combobox', async () => {
        renderDrawer({ seeded: true })

        await settle()

        expect(getInput('default')).toHaveValue('Sales')
        expect(getInput('acme')).toHaveValue('Services')
      })
    })

    // Regression: the wrappers used to own the query, and `useDebouncedSearch` fetches on mount,
    // so every tab switch re-ran it and blanked the combobox until it resolved.
    describe('WHEN switching billing entity tabs', () => {
      it('THEN should preserve selections without fetching or showing a loading spinner', async () => {
        const { executedOperations, user } = renderDrawer({ seeded: true })

        await settle(DEBOUNCE_MS)
        const operationsOnOpen = executedOperations.mock.calls.length

        await user.click(screen.getByRole('tab', { name: 'Globex' }))
        expect(
          document.querySelector(`[data-test="${COMBOBOX_LOADING_TEST_ID}"]`),
        ).not.toBeInTheDocument()
        await settle(DEBOUNCE_MS)

        await user.click(screen.getByRole('tab', { name: 'Acme' }))
        expect(
          document.querySelector(`[data-test="${COMBOBOX_LOADING_TEST_ID}"]`),
        ).not.toBeInTheDocument()
        expect(getInput('default')).toHaveValue('Sales')
        expect(getInput('acme')).toHaveValue('Services')
        await settle(DEBOUNCE_MS)

        expect(executedOperations).toHaveBeenCalledTimes(operationsOnOpen)
      })
    })

    // Regression: a search replaced the list every combobox read, narrowing the other field and
    // wiping its mapping (`ComboBox` clears a field whose selected option leaves `data`).
    describe('WHEN one combobox searches', () => {
      // Select-then-type, not delete-then-type: emptying the input is MUI's clear-selection gesture,
      // and a field with no selection drops its search on blur.
      const typeSearch = async (
        user: ReturnType<typeof renderDrawer>['user'],
        billingEntityKey: string,
        term: string,
      ): Promise<void> => {
        const input = getInput(billingEntityKey)

        await user.click(input)
        input.setSelectionRange(0, input.value.length)
        await user.keyboard(term)
        await settle(DEBOUNCE_MS)
      }

      const searchFrom = async (
        user: ReturnType<typeof renderDrawer>['user'],
        billingEntityKey: string,
        term: string,
      ): Promise<void> => {
        await user.type(getInput(billingEntityKey), term)
        await settle(DEBOUNCE_MS)
      }

      it('THEN should keep the other mapping selected', async () => {
        const { user } = renderDrawer({ seeded: true })

        await settle()
        await searchFrom(user, 'default', 'sales')

        expect(getInput('acme')).toHaveValue('Services')
      })

      it('THEN should leave the other combobox offering the options the search excluded', async () => {
        const { user } = renderDrawer({ seeded: true })

        await settle()
        await searchFrom(user, 'default', 'sales')

        // `Support` is in the unfiltered list only: reading the shared search result, acme would
        // be scoped to the other field's `sales` hit.
        expect(lastOptionsFor('acme')).toContain('Support')
        expect(lastOptionsFor('default')).not.toContain('Support')
      })

      it('THEN should keep each field on its own results', async () => {
        const { user } = renderDrawer({ seeded: true })

        await settle()
        await typeSearch(user, 'default', 'support')
        await typeSearch(user, 'acme', 'sales')

        // A mapped field keeps its value on blur, so its search is never cleared: another field's
        // search must neither narrow it nor hand it back the unfiltered list.
        expect(lastOptionsFor('default')).toContain('Support')
        expect(lastOptionsFor('default')).not.toContain('Services')
        expect(lastOptionsFor('acme')).toContain('Sales')
        expect(lastOptionsFor('acme')).not.toContain('Support')
      })

      it('THEN should drop the filter when the field is remounted by a tab switch', async () => {
        const { user } = renderDrawer({ seeded: true })

        await settle()
        await typeSearch(user, 'acme', 'support')

        expect(lastOptionsFor('acme')).not.toContain('Sales')

        await user.click(screen.getByRole('tab', { name: 'Globex' }))
        await settle()
        await user.click(screen.getByRole('tab', { name: 'Acme' }))
        await settle()

        // Remounting the field drops its search, so the list is whole again.
        expect(lastOptionsFor('acme')).toContain('Sales')
        expect(lastOptionsFor('acme')).toContain('Support')
      })

      it('THEN should run no query when the term is cleared', async () => {
        const { user, executedOperations, searchQueries } = renderDrawer({ seeded: true })

        await settle()
        await typeSearch(user, 'default', 'support')

        expect(searchQueries()).toHaveLength(1)
        const operationsAfterSearch = executedOperations.mock.calls.length

        // Under three characters useDebouncedSearch sends the search back to "no term": the
        // catalog is already held by the drawer, so re-fetching it would only be thrown away.
        await typeSearch(user, 'default', 'su')

        expect(executedOperations).toHaveBeenCalledTimes(operationsAfterSearch)
      })

      it('THEN should keep the list it shows until its own results arrive', async () => {
        const { user } = renderDrawer({ seeded: true, searchDelayMs: 1000 })

        await settle()
        await typeSearch(user, 'default', 'support')

        expect(lastOptionsFor('default')).toEqual(['Sales', 'Services', 'Support'])

        await settle(1000)

        expect(lastOptionsFor('default')).toEqual(['Support'])
      })

      it('THEN should not list its stored mapping among the results of an unrelated term', async () => {
        const { user } = renderDrawer({ seeded: true })

        await settle()
        await typeSearch(user, 'default', 'support')

        expect(lastOptionsFor('default')).toEqual(['Support'])

        await user.tab()

        expect(getInput('default')).toHaveValue('Sales')
      })

      it('THEN should keep its own selection when no result matches', async () => {
        const { user } = renderDrawer({ seeded: true })

        await settle()
        await searchFrom(user, 'default', 'nothingmatches')
        await user.tab()

        expect(getInput('default')).toHaveValue('Sales')
      })
    })
  })
})
