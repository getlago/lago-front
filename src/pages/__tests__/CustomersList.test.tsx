import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FieldNode, OperationDefinitionNode } from 'graphql'

import { MainHeaderConfig } from '~/components/MainHeader/types'
import { CustomersDocument } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'
import { render } from '~/test-utils'

import CustomersList from '../CustomersList'

let capturedConfig: MainHeaderConfig | null = null

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
    hasFeatureFlag: () => false,
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
  Table: () => null,
}))

let mockPage = 1
const mockGoToPage = jest.fn()

jest.mock('~/components/designSystem/Pagination/usePageSearchParam', () => ({
  usePageSearchParam: () => ({ page: mockPage, goToPage: mockGoToPage }),
}))

type CustomersMetadata = {
  currentPage: number
  totalPages: number
  totalCount: number
  totalCountCapped: boolean
  hasNextPage: boolean
}

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
  useCustomersLazyQuery: () => [
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
  ],
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

    describe('WHEN the list is on its last counted page', () => {
      it('THEN should disable the next page button', () => {
        mockPage = 3
        mockCustomersMetadata = {
          ...UNCAPPED_METADATA,
          currentPage: 3,
          hasNextPage: false,
        }

        render(<CustomersList />)

        expect(screen.getByRole('button', { name: 'next page' })).toBeDisabled()
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

    describe('WHEN the list is past the page counted by totalPages', () => {
      it('THEN should stay on that page', () => {
        render(<CustomersList />)

        expect(mockGoToPage).not.toHaveBeenCalled()
      })

      it('THEN should let the user go to the next page', async () => {
        const user = userEvent.setup()

        render(<CustomersList />)

        const nextButton = screen.getByRole('button', { name: 'next page' })

        expect(nextButton).toBeEnabled()

        await user.click(nextButton)

        expect(mockGoToPage).toHaveBeenCalledWith(CAPPED_PAST_FLOOR_METADATA.currentPage + 1)
      })
    })
  })
})
