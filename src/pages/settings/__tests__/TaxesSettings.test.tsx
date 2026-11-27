import { ReactNode } from 'react'

import { TableProps } from '~/components/designSystem/Table/Table'
import { CREATE_TAX_ROUTE } from '~/core/router'
import { TaxItemForTaxSettingsFragment } from '~/generated/graphql'
import { render } from '~/test-utils'

import TaxesSettings from '../TaxesSettings'

const EMPTY_TITLE_KEY = 'text_1743600025133454kb04evs6'
const EMPTY_SUBTITLE_KEY = 'text_645bb193927b375079d28b7e'
const ADD_TAX_KEY = 'text_645bb193927b375079d289af'

const mockTableProps = jest.fn()
const mockHasPermissions = jest.fn()
const mockNavigate = jest.fn()
const mockUseGetTaxesSettingsInformationsQuery = jest.fn()

jest.mock('~/components/MainHeader/MainHeader', () => ({
  MainHeader: {
    Configure: () => null,
  },
}))

jest.mock('~/components/designSystem/Table/Table', () => ({
  Table: (props: Record<string, unknown>) => {
    mockTableProps(props)
    return null
  },
}))

jest.mock('~/components/designSystem/Pagination', () => ({
  PaginatedContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  usePageSearchParam: () => ({ page: 1, goToPage: jest.fn() }),
}))

jest.mock('~/components/taxes/DeleteTaxDialog', () => ({
  useDeleteTaxDialog: () => ({ openDeleteTaxDialog: jest.fn() }),
}))

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useNavigate: () => mockNavigate,
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetTaxesSettingsInformationsQuery: (options: Record<string, unknown>) =>
    mockUseGetTaxesSettingsInformationsQuery(options),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/hooks/useIntegrations', () => ({
  useIntegrations: () => ({ hasTaxProvider: false }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

const getTableProps = (): TableProps<TaxItemForTaxSettingsFragment> =>
  mockTableProps.mock.calls[0][0] as TableProps<TaxItemForTaxSettingsFragment>

describe('TaxesSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockUseGetTaxesSettingsInformationsQuery.mockReturnValue({
      data: {
        taxes: {
          metadata: { currentPage: 1, totalPages: 0, totalCount: 0 },
          collection: [],
        },
      },
      error: undefined,
      loading: false,
    })
  })

  it('offers an add-tax action in the empty state when allowed', () => {
    render(<TaxesSettings />)

    const { data, placeholder } = getTableProps()

    expect(data).toEqual([])
    expect(placeholder?.emptyState).toEqual(
      expect.objectContaining({
        title: EMPTY_TITLE_KEY,
        subtitle: EMPTY_SUBTITLE_KEY,
        buttonTitle: ADD_TAX_KEY,
        buttonVariant: 'primary',
      }),
    )

    placeholder?.emptyState?.buttonAction?.()
    expect(mockNavigate).toHaveBeenCalledWith(CREATE_TAX_ROUTE)
  })

  it('hides the empty-state action without the organization tax update permission', () => {
    mockHasPermissions.mockReturnValue(false)

    render(<TaxesSettings />)

    const { emptyState } = getTableProps().placeholder ?? {}

    expect(emptyState?.title).toBe(EMPTY_TITLE_KEY)
    expect(emptyState?.subtitle).toBe(EMPTY_SUBTITLE_KEY)
    expect(emptyState?.buttonTitle).toBeUndefined()
    expect(emptyState?.buttonAction).toBeUndefined()
  })
})
