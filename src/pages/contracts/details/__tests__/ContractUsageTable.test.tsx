import { render, screen } from '@testing-library/react'

import { GetContractUsagesDocument, TimezoneEnum } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { CONTRACT_USAGE_ROW_NAME_TEST_ID, ContractUsageTable } from '../ContractUsageTable'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, data?: Record<string, string>) =>
      data ? `${key}:${JSON.stringify(data)}` : key,
  }),
}))

const rowFixture = {
  id: 'rc-1',
  invoiceDisplayName: 'Support plan',
  units: 4,
  amountCents: '1200',
  productCode: 'support',
  productName: 'Support plan',
  productFilterCode: null as string | null,
  fromDatetime: '2027-02-01T00:00:00.000Z',
  toDatetime: '2027-03-01T00:00:00.000Z',
  __typename: 'RateCardUsage',
}

const buildMock = (collection: (typeof rowFixture)[]): TestMocksType[number] => ({
  request: {
    query: GetContractUsagesDocument,
    variables: { contractId: 'contract-1', page: 1, limit: 20, withoutProductCategory: true },
  },
  result: {
    data: {
      contractUsages: {
        __typename: 'RateCardUsageCollection',
        collection,
        metadata: {
          __typename: 'CollectionMetadata',
          currentPage: 1,
          totalPages: 1,
          totalCount: collection.length,
        },
      },
    },
  },
})

describe('ContractUsageTable', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
  })

  it('renders a row for each usage item', async () => {
    render(
      <AllTheProviders forceTypenames mocks={[buildMock([rowFixture])]}>
        <ContractUsageTable contractId="contract-1" />
      </AllTheProviders>,
    )

    expect(await screen.findByText('Support plan')).toBeInTheDocument()
  })

  it("shows each row's billing period under its name", async () => {
    render(
      <AllTheProviders forceTypenames mocks={[buildMock([rowFixture])]}>
        <ContractUsageTable contractId="contract-1" />
      </AllTheProviders>,
    )

    expect(
      await screen.findByText(
        'text_633dae57ca9a923dd53c2097:{"fromDate":"Feb 1, 2027","toDate":"Mar 1, 2027"}',
      ),
    ).toBeInTheDocument()
  })

  it("formats a row's billing period in the customer's timezone, not UTC", async () => {
    const row = {
      ...rowFixture,
      fromDatetime: '2027-02-01T04:00:00.000Z',
      toDatetime: '2027-03-01T04:59:59.000Z',
    }

    render(
      <AllTheProviders forceTypenames mocks={[buildMock([row])]}>
        <ContractUsageTable
          contractId="contract-1"
          customerTimezone={TimezoneEnum.TzAmericaNewYork}
        />
      </AllTheProviders>,
    )

    expect(
      await screen.findByText(
        'text_633dae57ca9a923dd53c2097:{"fromDate":"Jan 31, 2027","toDate":"Feb 28, 2027"}',
      ),
    ).toBeInTheDocument()
  })

  it("indents a filter row under its data-indented attribute, and leaves a product's own row flush", async () => {
    const collection = [
      { ...rowFixture, id: 'rc-product-a', invoiceDisplayName: 'Product A' },
      {
        ...rowFixture,
        id: 'rc-filter-1',
        invoiceDisplayName: 'Filter 1',
        productFilterCode: 'filt-1',
      },
    ]

    render(
      <AllTheProviders forceTypenames mocks={[buildMock(collection)]}>
        <ContractUsageTable contractId="contract-1" />
      </AllTheProviders>,
    )

    await screen.findByText('Product A')

    const nameCells = screen.getAllByTestId(CONTRACT_USAGE_ROW_NAME_TEST_ID)
    const indentedByName = new Map(
      nameCells.map((cell) => [cell.firstElementChild?.textContent, cell.dataset.indented]),
    )

    expect(indentedByName.get('Product A')).toBe('false')
    expect(indentedByName.get('Filter 1')).toBe('true')
  })

  it('shows the empty-state placeholder for a contract with no usage', async () => {
    render(
      <AllTheProviders forceTypenames mocks={[buildMock([])]}>
        <ContractUsageTable contractId="contract-1" />
      </AllTheProviders>,
    )

    expect(await screen.findByText('text_62c3f454e5d7f4ec8888c1d5')).toBeInTheDocument()
  })

  it('reads the bare `page` param - the same key the category rail drops on switch', async () => {
    window.history.pushState({}, '', '/?page=2')

    const mock: TestMocksType[number] = {
      request: {
        query: GetContractUsagesDocument,
        variables: { contractId: 'contract-1', page: 2, limit: 20, withoutProductCategory: true },
      },
      result: {
        data: {
          contractUsages: {
            __typename: 'RateCardUsageCollection',
            collection: [rowFixture],
            metadata: {
              __typename: 'CollectionMetadata',
              currentPage: 2,
              totalPages: 2,
              totalCount: 21,
            },
          },
        },
      },
    }

    render(
      <AllTheProviders forceTypenames mocks={[mock]}>
        <ContractUsageTable contractId="contract-1" />
      </AllTheProviders>,
    )

    expect(await screen.findByText('Support plan')).toBeInTheDocument()
  })

  it('refetches, without remounting, when refreshToken changes', async () => {
    const otherRowFixture = { ...rowFixture, id: 'rc-2', invoiceDisplayName: 'Other plan' }
    const mocks = [buildMock([rowFixture]), buildMock([otherRowFixture])]

    const { rerender } = render(
      <AllTheProviders forceTypenames mocks={mocks}>
        <ContractUsageTable contractId="contract-1" refreshToken={0} />
      </AllTheProviders>,
    )

    expect(await screen.findByText('Support plan')).toBeInTheDocument()

    rerender(
      <AllTheProviders forceTypenames mocks={mocks}>
        <ContractUsageTable contractId="contract-1" refreshToken={1} />
      </AllTheProviders>,
    )

    // useDebouncedSearch's loading-smoothing makes isLoading flicker on an instant refetch -
    // settle past that window, then assert against the final render.
    await new Promise((resolve) => setTimeout(resolve, 800))
    expect(screen.getByText('Other plan')).toBeInTheDocument()
  })

  it("shows the Table's own error placeholder in place when the usages query fails", async () => {
    const errorMock: TestMocksType[number] = {
      request: {
        query: GetContractUsagesDocument,
        variables: { contractId: 'contract-1', page: 1, limit: 20, withoutProductCategory: true },
      },
      error: new Error('boom'),
    }

    render(
      <AllTheProviders mocks={[errorMock]}>
        <ContractUsageTable contractId="contract-1" />
      </AllTheProviders>,
    )

    expect(await screen.findByText('text_629728388c4d2300e2d380d5')).toBeInTheDocument()
  })
})
