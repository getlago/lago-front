import { render, screen, waitFor } from '@testing-library/react'

import { GetContractUsagesDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { ContractUsageTable } from '../ContractUsageTable'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const rowFixture = {
  id: 'rc-1',
  invoiceDisplayName: 'Support plan',
  units: 4,
  amountCents: '1200',
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

  it('calls onErrorChange when the usages query fails', async () => {
    const onErrorChange = jest.fn()
    const errorMock: TestMocksType[number] = {
      request: {
        query: GetContractUsagesDocument,
        variables: { contractId: 'contract-1', page: 1, limit: 20, withoutProductCategory: true },
      },
      error: new Error('boom'),
    }

    render(
      <AllTheProviders mocks={[errorMock]}>
        <ContractUsageTable contractId="contract-1" onErrorChange={onErrorChange} />
      </AllTheProviders>,
    )

    await waitFor(() => expect(onErrorChange).toHaveBeenCalledWith(true))
  })
})
