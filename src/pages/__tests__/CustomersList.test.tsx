import { FieldNode, OperationDefinitionNode } from 'graphql'

import { TableColumn } from '~/components/designSystem/Table/Table'
import { MainHeaderConfig } from '~/components/MainHeader/types'
import { CustomersDocument, CustomersQuery } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'
import { render } from '~/test-utils'

import CustomersList from '../CustomersList'

let capturedConfig: MainHeaderConfig | null = null

type CustomerRow = CustomersQuery['customers']['collection'][number]

let mockIsProductCatalogEnabled = false
let capturedColumns: Array<TableColumn<CustomerRow>> = []
let capturedQueryVariables: Record<string, unknown> | undefined

jest.mock('~/components/MainHeader/MainHeader', () => ({
  MainHeader: Object.assign(() => null, {
    Configure: (props: MainHeaderConfig) => {
      capturedConfig = props
      return null
    },
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, args?: Record<string, unknown>) =>
      args ? [key, ...Object.values(args)].join(' ') : key,
  }),
}))

jest.mock('~/hooks/useDebouncedSearch', () => ({
  useDebouncedSearch: () => ({
    debouncedSearch: jest.fn(),
    isLoading: false,
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    intlFormatDateTimeOrgaTZ: () => ({ date: '' }),
    hasFeatureFlag: () => mockIsProductCatalogEnabled,
    loading: false,
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: jest.fn().mockReturnValue(true),
  }),
}))

jest.mock('~/hooks/customer/useCustomersListHeaderActions', () => ({
  useCustomersListHeaderActions: () => [],
}))

jest.mock('~/hooks/customer/useCustomersListHeaderFilters', () => ({
  useCustomersListHeaderFilters: () => undefined,
}))

jest.mock('~/components/customers/DeleteCustomerDialog', () => ({
  useDeleteCustomerDialog: () => ({ openDeleteCustomerDialog: jest.fn() }),
}))

jest.mock('~/components/designSystem/Table/Table', () => ({
  Table: ({ columns }: { columns: Array<TableColumn<CustomerRow>> }) => {
    capturedColumns = columns
    return null
  },
}))

let mockPage = 1
const mockGoToPage = jest.fn()

jest.mock('~/components/designSystem/Pagination/usePageSearchParam', () => ({
  usePageSearchParam: () => ({ page: mockPage, goToPage: mockGoToPage }),
}))

type CustomersMetadata = CustomersQuery['customers']['metadata']

const UNCAPPED_METADATA: CustomersMetadata = {
  currentPage: 1,
  totalPages: 3,
  totalCount: 45,
  totalCountCapped: false,
  hasNextPage: true,
}

const CAPPED_PAST_FLOOR_METADATA: CustomersMetadata = {
  currentPage: 501,
  totalPages: 500,
  totalCount: 10000,
  totalCountCapped: true,
  hasNextPage: true,
}

let mockCustomersMetadata: CustomersMetadata = UNCAPPED_METADATA

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useCustomersLazyQuery: (options: { variables?: Record<string, unknown> }) => {
    capturedQueryVariables = options.variables

    return [
      jest.fn(),
      {
        data: {
          customers: {
            metadata: mockCustomersMetadata,
            collection: [],
          },
        },
        loading: false,
        error: null,
        variables: {},
      },
    ]
  },
}))

const mockFormatCountToMetadata = jest.fn()

jest.mock('~/components/MainHeader/formatCountToMetadata', () => ({
  formatCountToMetadata: (
    count: number | undefined | null,
    translate: TranslateFunc,
    capped?: boolean,
  ) => mockFormatCountToMetadata(count, translate, capped),
}))

const getCustomersMetadataSelection = (): string[] => {
  const operation = CustomersDocument.definitions.find(
    (definition): definition is OperationDefinitionNode =>
      definition.kind === 'OperationDefinition',
  )
  const customersField = operation?.selectionSet.selections[0] as FieldNode
  const metadataField = customersField.selectionSet?.selections.find(
    (selection): selection is FieldNode =>
      selection.kind === 'Field' && selection.name.value === 'metadata',
  )

  return (
    metadataField?.selectionSet?.selections.map(
      (selection) => (selection as FieldNode).name.value,
    ) ?? []
  )
}

describe('CustomersList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedConfig = null
    capturedColumns = []
    capturedQueryVariables = undefined
    mockIsProductCatalogEnabled = false
    mockPage = 1
    mockCustomersMetadata = UNCAPPED_METADATA
    mockFormatCountToMetadata.mockReturnValue('formatted-count')
  })

  describe('GIVEN the customers list query', () => {
    describe('WHEN its metadata selection is inspected', () => {
      it('THEN should select the capped flag and the next page flag', () => {
        expect(getCustomersMetadataSelection()).toEqual(
          expect.arrayContaining([
            'currentPage',
            'totalPages',
            'totalCount',
            'totalCountCapped',
            'hasNextPage',
          ]),
        )
      })
    })
  })

  describe('GIVEN the total is exact', () => {
    describe('WHEN the header count is built', () => {
      it('THEN should format it as an exact total', () => {
        render(<CustomersList />)

        expect(mockFormatCountToMetadata).toHaveBeenCalledWith(45, expect.any(Function), false)
        expect(capturedConfig?.entity?.metadata).toBe('formatted-count')
      })
    })
  })

  describe('GIVEN the total is capped', () => {
    beforeEach(() => {
      mockPage = CAPPED_PAST_FLOOR_METADATA.currentPage
      mockCustomersMetadata = CAPPED_PAST_FLOOR_METADATA
    })

    describe('WHEN the header count is built', () => {
      it('THEN should flag it as capped', () => {
        render(<CustomersList />)

        expect(mockFormatCountToMetadata).toHaveBeenCalledWith(10000, expect.any(Function), true)
      })
    })
  })
  describe('GIVEN the active count column', () => {
    const findActiveCountColumn = (): TableColumn<CustomerRow> | undefined =>
      capturedColumns.find(({ key }) =>
        ['activeSubscriptionsCount', 'activeContractsCount'].includes(String(key)),
      )

    describe('WHEN the product catalog is disabled', () => {
      it('THEN counts the active subscriptions and only queries them', () => {
        render(<CustomersList />)

        expect(findActiveCountColumn()?.key).toBe('activeSubscriptionsCount')
        expect(findActiveCountColumn()?.title).toBe('text_1734452833961chacuky8218')
        expect(capturedQueryVariables).toEqual(
          expect.objectContaining({ isProductCatalogEnabled: false }),
        )
      })
    })

    describe('WHEN the product catalog is enabled', () => {
      it('THEN counts the active contracts and only queries them', () => {
        mockIsProductCatalogEnabled = true

        render(<CustomersList />)

        expect(findActiveCountColumn()?.key).toBe('activeContractsCount')
        expect(findActiveCountColumn()?.title).toBe('text_1795187036698g1pnr18vrtb')
        expect(capturedQueryVariables).toEqual(
          expect.objectContaining({ isProductCatalogEnabled: true }),
        )
      })
    })

    describe('WHEN its fields are inspected in the query', () => {
      it('THEN gates each count on the product catalog flag', () => {
        const operation = CustomersDocument.loc?.source.body ?? ''

        expect(operation).toContain('activeSubscriptionsCount @skip(if: $isProductCatalogEnabled)')
        expect(operation).toContain('activeContractsCount @include(if: $isProductCatalogEnabled)')
      })
    })
  })
})
