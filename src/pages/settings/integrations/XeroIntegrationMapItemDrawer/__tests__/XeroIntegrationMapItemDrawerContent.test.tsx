import { ApolloClient, ApolloLink, ApolloProvider, InMemoryCache, Observable } from '@apollo/client'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router'

import { ComboBoxProps } from '~/components/form/ComboBox/types'
import { MappableTypeEnum } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'

import { stringifyOptionValue } from '../stringifyOptionValue'
import { xeroMappingDefaultValues } from '../validationSchema'
import { XeroIntegrationMapItemDrawerContent } from '../XeroIntegrationMapItemDrawerContent'

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

const ITEM_A = { externalId: 'ext-1', externalName: 'Sales', externalAccountCode: '200' }
const ITEM_B = { externalId: 'ext-2', externalName: 'Services', externalAccountCode: '300' }
const ITEM_C = { externalId: 'ext-3', externalName: 'Support', externalAccountCode: '400' }

const ALL_ITEMS = [ITEM_A, ITEM_B, ITEM_C]

// The id has to identify the item, not its position in a result set: Apollo normalises
// IntegrationItem by id, so an index-based id lets a search result overwrite another item.
const toApiItem = (item: typeof ITEM_A) => ({
  __typename: 'IntegrationItem',
  id: `item-${item.externalId}`,
  externalId: item.externalId,
  externalName: item.externalName,
  externalAccountCode: item.externalAccountCode,
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
}: { seeded?: boolean; searchDelayMs?: number } = {}) => {
  mockRenderedOptions.mockClear()

  const executedOperations = jest.fn()

  // The app client is cache-and-network with a cache-first follow-up; a lazy query re-executed
  // with the same variables still reaches the link, so only a real link exposes the refetches.
  const client = new ApolloClient({
    link: new ApolloLink((operation) => {
      executedOperations(operation.operationName, operation.variables)

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
            default: { selectedElementValue: stringifyOptionValue(ITEM_A) },
            acme: { selectedElementValue: stringifyOptionValue(ITEM_B) },
          }
        : xeroMappingDefaultValues,
    })

    return (
      <XeroIntegrationMapItemDrawerContent
        title="Map item"
        description="Pick a Xero item"
        billingEntities={BILLING_ENTITIES}
        form={form}
        formId="xero-map-item-form"
        formType={MappableTypeEnum.AddOn}
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

  return { executedOperations, user: userEvent.setup({ pointerEventsCheck: 0 }) }
}

describe('XeroIntegrationMapItemDrawerContent', () => {
  describe('GIVEN a drawer with several billing entity tabs', () => {
    describe('WHEN it opens', () => {
      it('THEN should fetch the integration items exactly once', async () => {
        const { executedOperations } = renderDrawer()

        await settle()

        expect(executedOperations).toHaveBeenCalledTimes(1)
        expect(executedOperations).toHaveBeenCalledWith('getXeroIntegrationItems', {
          integrationId: INTEGRATION_ID,
          itemType: 'standard',
          limit: 1000,
        })
      })

      it('THEN should give the fetched options to every rendered combobox', async () => {
        const { executedOperations } = renderDrawer({ seeded: true })

        await settle()

        expect(executedOperations).toHaveBeenCalledTimes(1)
        expect(getInput('default')).toHaveValue('Sales (200)')
        expect(getInput('acme')).toHaveValue('Services (300)')
      })
    })

    // Regression: the wrappers used to own the query, and `useDebouncedSearch` fetches on mount,
    // so every tab switch re-ran it and blanked the combobox until it resolved.
    describe('WHEN switching billing entity tabs', () => {
      it('THEN should not fetch the integration items again', async () => {
        const { executedOperations, user } = renderDrawer()

        await settle()
        expect(executedOperations).toHaveBeenCalledTimes(1)

        await user.click(screen.getByRole('tab', { name: 'Globex' }))
        await settle()

        await user.click(screen.getByRole('tab', { name: 'Acme' }))
        await settle()

        expect(executedOperations).toHaveBeenCalledTimes(1)
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

        expect(getInput('acme')).toHaveValue('Services (300)')
      })

      it('THEN should leave the other combobox offering the options the search excluded', async () => {
        const { user } = renderDrawer({ seeded: true })

        await settle()
        await searchFrom(user, 'default', 'sales')

        // `Support` is in the unfiltered list only: reading the shared search result, acme would
        // be scoped to the other field's `sales` hit.
        expect(lastOptionsFor('acme')).toContain('Support (400)')
        expect(lastOptionsFor('default')).not.toContain('Support (400)')
      })

      it('THEN should keep each field on its own results', async () => {
        const { user } = renderDrawer({ seeded: true })

        await settle()
        await typeSearch(user, 'default', 'support')
        await typeSearch(user, 'acme', 'sales')

        // A mapped field keeps its value on blur, so its search is never cleared: another field's
        // search must neither narrow it nor hand it back the unfiltered list.
        expect(lastOptionsFor('default')).toContain('Support (400)')
        expect(lastOptionsFor('default')).not.toContain('Services (300)')
        expect(lastOptionsFor('acme')).toContain('Sales (200)')
        expect(lastOptionsFor('acme')).not.toContain('Support (400)')
      })

      it('THEN should drop the filter when the field is remounted by a tab switch', async () => {
        const { user } = renderDrawer({ seeded: true })

        await settle()
        await typeSearch(user, 'acme', 'support')

        expect(lastOptionsFor('acme')).not.toContain('Sales (200)')

        await user.click(screen.getByRole('tab', { name: 'Globex' }))
        await settle()
        await user.click(screen.getByRole('tab', { name: 'Acme' }))
        await settle()

        // Remounting the field drops its search, so the list is whole again.
        expect(lastOptionsFor('acme')).toContain('Sales (200)')
        expect(lastOptionsFor('acme')).toContain('Support (400)')
      })

      it('THEN should run no query when the term is cleared', async () => {
        const { user, executedOperations } = renderDrawer({ seeded: true })

        await settle()
        await typeSearch(user, 'default', 'support')

        expect(executedOperations).toHaveBeenCalledTimes(2)

        // Under three characters useDebouncedSearch sends the search back to "no term": the
        // catalog is already held by the drawer, so re-fetching it would only be thrown away.
        await typeSearch(user, 'default', 'su')

        expect(executedOperations).toHaveBeenCalledTimes(2)
      })

      it('THEN should keep the list it shows until its own results arrive', async () => {
        const { user } = renderDrawer({ seeded: true, searchDelayMs: 1000 })

        await settle()
        await typeSearch(user, 'default', 'support')

        expect(lastOptionsFor('default')).toEqual([
          'Sales (200)',
          'Services (300)',
          'Support (400)',
        ])

        await settle(1000)

        expect(lastOptionsFor('default')).toEqual(['Support (400)'])
      })

      it('THEN should not list its stored mapping among the results of an unrelated term', async () => {
        const { user } = renderDrawer({ seeded: true })

        await settle()
        await typeSearch(user, 'default', 'support')

        expect(lastOptionsFor('default')).toEqual(['Support (400)'])

        await user.tab()

        expect(getInput('default')).toHaveValue('Sales (200)')
      })

      it('THEN should keep its own selection when no result matches', async () => {
        const { user } = renderDrawer({ seeded: true })

        await settle()
        await searchFrom(user, 'default', 'nothingmatches')
        await user.tab()

        expect(getInput('default')).toHaveValue('Sales (200)')
      })
    })
  })
})
