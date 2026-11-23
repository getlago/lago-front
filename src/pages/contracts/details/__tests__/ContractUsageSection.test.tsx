import { act, render, screen, within } from '@testing-library/react'
import { useEffect } from 'react'

import {
  CurrencyEnum,
  GetContractCurrentUsageTotalDocument,
  TimezoneEnum,
} from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import {
  CONTRACT_USAGE_CATEGORY_TOTAL_TEST_ID,
  ContractUsageSection,
} from '../ContractUsageSection'
import { useContractUsageCategories } from '../useContractUsageCategories'

type UsageCategories = ReturnType<typeof useContractUsageCategories>

type MockedChildProps = {
  refreshToken?: number
  categoryId?: string | null
  activeCategoryId?: string | null
  showStandalone?: boolean
  filterOptions?: ReturnType<UsageCategories['getFilterOptions']>
}

const buildUsageCategories = (overrides: Partial<UsageCategories> = {}): UsageCategories => ({
  categories: [],
  hasStandaloneProducts: false,
  isResolved: true,
  hasError: false,
  refetch: jest.fn(),
  getFilterOptions: () => undefined,
  ...overrides,
})

const mockUseContractUsageCategories = jest.fn<UsageCategories, []>(() => buildUsageCategories())

jest.mock('../useContractUsageCategories', () => ({
  useContractUsageCategories: () => mockUseContractUsageCategories(),
}))

const computeCategory = { id: 'cat-compute', name: 'Compute', displayName: 'Compute & GPUs' }
const storageCategory = { id: 'cat-storage', name: 'Storage', displayName: 'Storage' }

const mockContractUsageCategoryRail = jest.fn<JSX.Element, [MockedChildProps]>(() => (
  <div data-test="mocked-rail" />
))
const mockContractUsageTable = jest.fn<JSX.Element, [MockedChildProps]>(() => (
  <div data-test="mocked-table" />
))

jest.mock('../ContractUsageCategoryRail', () => ({
  ContractUsageCategoryRail: (props: MockedChildProps) => mockContractUsageCategoryRail(props),
}))
jest.mock('../ContractUsageTable', () => ({
  ContractUsageTable: (props: MockedChildProps) => mockContractUsageTable(props),
}))

type CategoryTotalFixture = {
  categoryId: string | null
  totalAmountCents: string
  fromDatetime: string
  toDatetime: string
}

const buildTotalMock = (
  totalAmountCents: string,
  period?: { fromDatetime: string; toDatetime: string },
  categoryTotals: CategoryTotalFixture[] = [],
): TestMocksType[number] => ({
  request: { query: GetContractCurrentUsageTotalDocument, variables: { contractId: 'contract-1' } },
  result: {
    data: {
      contractCurrentUsageTotal: {
        __typename: 'ContractCurrentUsageTotal',
        totalAmountCents,
        taxesUnavailable: false,
        fromDatetime: period?.fromDatetime ?? null,
        toDatetime: period?.toDatetime ?? null,
        productCategoryTotals: categoryTotals.map(({ categoryId, ...totals }) => ({
          __typename: 'ContractCurrentUsageCategoryTotal',
          productCategory: categoryId ? { __typename: 'ProductCategory', id: categoryId } : null,
          ...totals,
        })),
      },
    },
  },
})

describe('ContractUsageSection', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
    mockUseContractUsageCategories.mockImplementation(() => buildUsageCategories())
    mockContractUsageCategoryRail.mockClear()
    mockContractUsageCategoryRail.mockImplementation(() => <div data-test="mocked-rail" />)
    mockContractUsageTable.mockClear()
    mockContractUsageTable.mockImplementation(() => <div data-test="mocked-table" />)
  })

  it('renders the total, the rail, and the table together', async () => {
    render(
      <AllTheProviders forceTypenames mocks={[buildTotalMock('67050')]}>
        <ContractUsageSection
          contractId="contract-1"
          currency={CurrencyEnum.Usd}
          customerTimezone={TimezoneEnum.TzUtc}
        />
      </AllTheProviders>,
    )

    expect(await screen.findByTestId('mocked-rail')).toBeInTheDocument()
    expect(screen.getByTestId('mocked-table')).toBeInTheDocument()
    expect(await screen.findByText(/670\.50|67050/)).toBeInTheDocument()
  })

  it("shows the total's billing period when the backend reports one", async () => {
    render(
      <AllTheProviders
        forceTypenames
        mocks={[
          buildTotalMock('67050', {
            fromDatetime: '2027-02-01T00:00:00.000Z',
            toDatetime: '2027-02-28T23:59:59.000Z',
          }),
        ]}
      >
        <ContractUsageSection
          contractId="contract-1"
          currency={CurrencyEnum.Usd}
          customerTimezone={TimezoneEnum.TzUtc}
        />
      </AllTheProviders>,
    )

    expect(await screen.findByText('From Feb 1, 2027 to Feb 28, 2027')).toBeInTheDocument()
  })

  it("formats the billing period in the customer's timezone, not UTC", async () => {
    render(
      <AllTheProviders
        forceTypenames
        mocks={[
          buildTotalMock('67050', {
            fromDatetime: '2027-02-01T04:00:00.000Z',
            toDatetime: '2027-03-01T04:59:59.000Z',
          }),
        ]}
      >
        <ContractUsageSection
          contractId="contract-1"
          currency={CurrencyEnum.Usd}
          customerTimezone={TimezoneEnum.TzAmericaNewYork}
        />
      </AllTheProviders>,
    )

    expect(await screen.findByText('From Jan 31, 2027 to Feb 28, 2027')).toBeInTheDocument()
  })

  it('shows $0.00 (not hidden) for a contract with no usage', async () => {
    render(
      <AllTheProviders forceTypenames mocks={[buildTotalMock('0')]}>
        <ContractUsageSection
          contractId="contract-1"
          currency={CurrencyEnum.Usd}
          customerTimezone={TimezoneEnum.TzUtc}
        />
      </AllTheProviders>,
    )

    expect(await screen.findByText(/0\.00/)).toBeInTheDocument()
  })

  it('collapses to the error placeholder when the total query fails', async () => {
    const errorMock: TestMocksType[number] = {
      request: {
        query: GetContractCurrentUsageTotalDocument,
        variables: { contractId: 'contract-1' },
      },
      error: new Error('boom'),
    }

    render(
      <AllTheProviders mocks={[errorMock]}>
        <ContractUsageSection
          contractId="contract-1"
          currency={CurrencyEnum.Usd}
          customerTimezone={TimezoneEnum.TzUtc}
        />
      </AllTheProviders>,
    )

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument()
    expect(screen.queryByTestId('mocked-rail')).not.toBeInTheDocument()
    expect(screen.queryByTestId('mocked-table')).not.toBeInTheDocument()
  })

  it('keeps the total and the table visible when only the rail renders its own error, instead of blanking the section', async () => {
    mockContractUsageCategoryRail.mockImplementation(() => <div data-test="mocked-rail-error" />)

    render(
      <AllTheProviders forceTypenames mocks={[buildTotalMock('67050')]}>
        <ContractUsageSection
          contractId="contract-1"
          currency={CurrencyEnum.Usd}
          customerTimezone={TimezoneEnum.TzUtc}
        />
      </AllTheProviders>,
    )

    expect(await screen.findByTestId('mocked-rail-error')).toBeInTheDocument()
    expect(screen.getByTestId('mocked-table')).toBeInTheDocument()
    expect(await screen.findByText(/670\.50|67050/)).toBeInTheDocument()
  })

  it('keeps the total and the rail visible when only the table renders its own error, instead of blanking the section', async () => {
    mockContractUsageTable.mockImplementation(() => <div data-test="mocked-table-error" />)

    render(
      <AllTheProviders forceTypenames mocks={[buildTotalMock('67050')]}>
        <ContractUsageSection
          contractId="contract-1"
          currency={CurrencyEnum.Usd}
          customerTimezone={TimezoneEnum.TzUtc}
        />
      </AllTheProviders>,
    )

    expect(await screen.findByTestId('mocked-table-error')).toBeInTheDocument()
    expect(screen.getByTestId('mocked-rail')).toBeInTheDocument()
    expect(await screen.findByText(/670\.50|67050/)).toBeInTheDocument()
  })
  describe('GIVEN no category in the URL', () => {
    it('THEN opens the first category when the contract has no standalone product', async () => {
      mockUseContractUsageCategories.mockImplementation(() =>
        buildUsageCategories({ categories: [computeCategory, storageCategory] }),
      )

      render(
        <AllTheProviders forceTypenames mocks={[buildTotalMock('67050')]}>
          <ContractUsageSection
            contractId="contract-1"
            currency={CurrencyEnum.Usd}
            customerTimezone={TimezoneEnum.TzUtc}
          />
        </AllTheProviders>,
      )

      await screen.findByTestId('mocked-table')

      expect(mockContractUsageTable).toHaveBeenLastCalledWith(
        expect.objectContaining({ categoryId: 'cat-compute' }),
      )
      expect(mockContractUsageCategoryRail).toHaveBeenLastCalledWith(
        expect.objectContaining({ showStandalone: false, activeCategoryId: 'cat-compute' }),
      )
    })

    it('THEN opens Standalone products when the contract has some', async () => {
      mockUseContractUsageCategories.mockImplementation(() =>
        buildUsageCategories({ categories: [computeCategory], hasStandaloneProducts: true }),
      )

      render(
        <AllTheProviders forceTypenames mocks={[buildTotalMock('67050')]}>
          <ContractUsageSection
            contractId="contract-1"
            currency={CurrencyEnum.Usd}
            customerTimezone={TimezoneEnum.TzUtc}
          />
        </AllTheProviders>,
      )

      await screen.findByTestId('mocked-table')

      expect(mockContractUsageTable).toHaveBeenLastCalledWith(
        expect.objectContaining({ categoryId: null }),
      )
      expect(mockContractUsageCategoryRail).toHaveBeenLastCalledWith(
        expect.objectContaining({ showStandalone: true, activeCategoryId: null }),
      )
    })

    it('THEN keeps Standalone products as the only view of a contract with no rate card', async () => {
      render(
        <AllTheProviders forceTypenames mocks={[buildTotalMock('0')]}>
          <ContractUsageSection
            contractId="contract-1"
            currency={CurrencyEnum.Usd}
            customerTimezone={TimezoneEnum.TzUtc}
          />
        </AllTheProviders>,
      )

      await screen.findByTestId('mocked-table')

      expect(mockContractUsageCategoryRail).toHaveBeenLastCalledWith(
        expect.objectContaining({ showStandalone: true, activeCategoryId: null }),
      )
      expect(screen.queryByTestId(CONTRACT_USAGE_CATEGORY_TOTAL_TEST_ID)).not.toBeInTheDocument()
    })

    it('THEN holds the table back until the categories are known, so no usage is priced for a view about to be replaced', () => {
      mockUseContractUsageCategories.mockImplementation(() =>
        buildUsageCategories({ isResolved: false }),
      )

      render(
        <AllTheProviders forceTypenames mocks={[buildTotalMock('67050')]}>
          <ContractUsageSection
            contractId="contract-1"
            currency={CurrencyEnum.Usd}
            customerTimezone={TimezoneEnum.TzUtc}
          />
        </AllTheProviders>,
      )

      expect(screen.getByTestId('mocked-rail')).toBeInTheDocument()
      expect(screen.queryByTestId('mocked-table')).not.toBeInTheDocument()
    })
  })

  describe('GIVEN a contract with a single section', () => {
    it('THEN hides the section total, which would repeat the contract total, for a single category', async () => {
      mockUseContractUsageCategories.mockImplementation(() =>
        buildUsageCategories({ categories: [computeCategory] }),
      )

      render(
        <AllTheProviders forceTypenames mocks={[buildTotalMock('67050')]}>
          <ContractUsageSection
            contractId="contract-1"
            currency={CurrencyEnum.Usd}
            customerTimezone={TimezoneEnum.TzUtc}
          />
        </AllTheProviders>,
      )

      await screen.findByTestId('mocked-table')

      expect(screen.queryByTestId(CONTRACT_USAGE_CATEGORY_TOTAL_TEST_ID)).not.toBeInTheDocument()
    })

    it('THEN hides the section total for standalone products only', async () => {
      mockUseContractUsageCategories.mockImplementation(() =>
        buildUsageCategories({ hasStandaloneProducts: true }),
      )

      render(
        <AllTheProviders forceTypenames mocks={[buildTotalMock('67050')]}>
          <ContractUsageSection
            contractId="contract-1"
            currency={CurrencyEnum.Usd}
            customerTimezone={TimezoneEnum.TzUtc}
          />
        </AllTheProviders>,
      )

      await screen.findByTestId('mocked-table')

      expect(screen.queryByTestId(CONTRACT_USAGE_CATEGORY_TOTAL_TEST_ID)).not.toBeInTheDocument()
    })

    it('THEN shows the section total again once there are two sections', async () => {
      mockUseContractUsageCategories.mockImplementation(() =>
        buildUsageCategories({ categories: [computeCategory], hasStandaloneProducts: true }),
      )

      render(
        <AllTheProviders forceTypenames mocks={[buildTotalMock('67050')]}>
          <ContractUsageSection
            contractId="contract-1"
            currency={CurrencyEnum.Usd}
            customerTimezone={TimezoneEnum.TzUtc}
          />
        </AllTheProviders>,
      )

      expect(await screen.findByTestId(CONTRACT_USAGE_CATEGORY_TOTAL_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('GIVEN a category in the URL', () => {
    beforeEach(() => {
      window.history.pushState({}, '', '/?categoryId=cat-storage')
      mockUseContractUsageCategories.mockImplementation(() =>
        buildUsageCategories({
          categories: [computeCategory, storageCategory],
          hasStandaloneProducts: true,
          getFilterOptions: (categoryId) => ({
            products: [{ id: `product-of-${categoryId}`, label: 'Product' }],
            productFilters: [],
          }),
        }),
      )
    })

    it('THEN opens that category and hands the table its filter options', async () => {
      render(
        <AllTheProviders forceTypenames mocks={[buildTotalMock('67050')]}>
          <ContractUsageSection
            contractId="contract-1"
            currency={CurrencyEnum.Usd}
            customerTimezone={TimezoneEnum.TzUtc}
          />
        </AllTheProviders>,
      )

      await screen.findByTestId('mocked-table')

      expect(mockContractUsageTable).toHaveBeenLastCalledWith(
        expect.objectContaining({
          categoryId: 'cat-storage',
          filterOptions: {
            products: [{ id: 'product-of-cat-storage', label: 'Product' }],
            productFilters: [],
          },
        }),
      )
    })

    it("THEN shows that category's own total and billing period above the table", async () => {
      render(
        <AllTheProviders
          forceTypenames
          mocks={[
            buildTotalMock('67050', undefined, [
              {
                categoryId: null,
                totalAmountCents: '50000',
                fromDatetime: '2027-02-01T00:00:00.000Z',
                toDatetime: '2027-02-28T23:59:59.000Z',
              },
              {
                categoryId: 'cat-storage',
                totalAmountCents: '17050',
                fromDatetime: '2027-02-15T00:00:00.000Z',
                toDatetime: '2027-03-14T23:59:59.000Z',
              },
            ]),
          ]}
        >
          <ContractUsageSection
            contractId="contract-1"
            currency={CurrencyEnum.Usd}
            customerTimezone={TimezoneEnum.TzUtc}
          />
        </AllTheProviders>,
      )

      const categoryTotal = await screen.findByTestId(CONTRACT_USAGE_CATEGORY_TOTAL_TEST_ID)

      await within(categoryTotal).findByText(/170\.50/)
      expect(within(categoryTotal).getByText(/Storage/)).toBeInTheDocument()
      expect(
        within(categoryTotal).getByText('From Feb 15, 2027 to Mar 14, 2027'),
      ).toBeInTheDocument()
    })

    it('THEN falls back to the default view when the contract has no such category', async () => {
      window.history.pushState({}, '', '/?categoryId=cat-from-another-contract')

      render(
        <AllTheProviders forceTypenames mocks={[buildTotalMock('67050')]}>
          <ContractUsageSection
            contractId="contract-1"
            currency={CurrencyEnum.Usd}
            customerTimezone={TimezoneEnum.TzUtc}
          />
        </AllTheProviders>,
      )

      await screen.findByTestId('mocked-table')

      expect(mockContractUsageTable).toHaveBeenLastCalledWith(
        expect.objectContaining({ categoryId: null }),
      )
      expect(mockContractUsageCategoryRail).toHaveBeenLastCalledWith(
        expect.objectContaining({ activeCategoryId: null }),
      )
    })

    it('THEN keeps the category of the URL when the categories failed to load, as none can be checked', async () => {
      mockUseContractUsageCategories.mockImplementation(() =>
        buildUsageCategories({ hasError: true }),
      )

      render(
        <AllTheProviders forceTypenames mocks={[buildTotalMock('67050')]}>
          <ContractUsageSection
            contractId="contract-1"
            currency={CurrencyEnum.Usd}
            customerTimezone={TimezoneEnum.TzUtc}
          />
        </AllTheProviders>,
      )

      await screen.findByTestId('mocked-table')

      expect(mockContractUsageTable).toHaveBeenLastCalledWith(
        expect.objectContaining({ categoryId: 'cat-storage' }),
      )
    })

    it('THEN shows $0.00 for a category the total reports nothing for', async () => {
      render(
        <AllTheProviders forceTypenames mocks={[buildTotalMock('67050')]}>
          <ContractUsageSection
            contractId="contract-1"
            currency={CurrencyEnum.Usd}
            customerTimezone={TimezoneEnum.TzUtc}
          />
        </AllTheProviders>,
      )

      const categoryTotal = await screen.findByTestId(CONTRACT_USAGE_CATEGORY_TOTAL_TEST_ID)

      expect(await within(categoryTotal).findByText(/0\.00/)).toBeInTheDocument()
    })
  })
  describe('GIVEN the table holds its own search term', () => {
    const tableMounts = jest.fn()
    const tableUnmounts = jest.fn()

    const navigateTo = (search: string): void => {
      act(() => {
        window.history.pushState({}, '', search)
        window.dispatchEvent(new PopStateEvent('popstate'))
      })
    }

    beforeEach(() => {
      tableMounts.mockClear()
      tableUnmounts.mockClear()
      window.history.pushState({}, '', '/?categoryId=cat-compute')
      mockUseContractUsageCategories.mockImplementation(() =>
        buildUsageCategories({ categories: [computeCategory, storageCategory] }),
      )
      mockContractUsageTable.mockImplementation(() => {
        useEffect(() => {
          tableMounts()

          return () => tableUnmounts()
        }, [])

        return <div data-test="mocked-table" />
      })
    })

    it('WHEN switching category THEN remounts the table, which drops the search term', async () => {
      render(
        <AllTheProviders forceTypenames mocks={[buildTotalMock('67050')]}>
          <ContractUsageSection
            contractId="contract-1"
            currency={CurrencyEnum.Usd}
            customerTimezone={TimezoneEnum.TzUtc}
          />
        </AllTheProviders>,
      )

      await screen.findByTestId('mocked-table')
      expect(tableMounts).toHaveBeenCalledTimes(1)

      navigateTo('/?categoryId=cat-storage')

      expect(tableUnmounts).toHaveBeenCalledTimes(1)
      expect(tableMounts).toHaveBeenCalledTimes(2)
    })

    it('WHEN only the page changes THEN keeps the same table and its search term', async () => {
      render(
        <AllTheProviders forceTypenames mocks={[buildTotalMock('67050')]}>
          <ContractUsageSection
            contractId="contract-1"
            currency={CurrencyEnum.Usd}
            customerTimezone={TimezoneEnum.TzUtc}
          />
        </AllTheProviders>,
      )

      await screen.findByTestId('mocked-table')

      navigateTo('/?categoryId=cat-compute&page=2')

      expect(tableUnmounts).not.toHaveBeenCalled()
      expect(tableMounts).toHaveBeenCalledTimes(1)
    })
  })
})
