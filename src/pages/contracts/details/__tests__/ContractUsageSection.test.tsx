import { render, screen } from '@testing-library/react'

import { GetContractCurrentUsageTotalDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { ContractUsageSection } from '../ContractUsageSection'

type MockedChildProps = { refreshToken?: number }

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

const buildTotalMock = (
  totalAmountCents: string,
  period?: { fromDatetime: string; toDatetime: string },
): TestMocksType[number] => ({
  request: { query: GetContractCurrentUsageTotalDocument, variables: { contractId: 'contract-1' } },
  result: {
    data: {
      contractCurrentUsageTotal: {
        __typename: 'ContractCurrentUsageTotal',
        totalAmountCents,
        fromDatetime: period?.fromDatetime ?? null,
        toDatetime: period?.toDatetime ?? null,
      },
    },
  },
})

describe('ContractUsageSection', () => {
  beforeEach(() => {
    mockContractUsageCategoryRail.mockClear()
    mockContractUsageCategoryRail.mockImplementation(() => <div data-test="mocked-rail" />)
    mockContractUsageTable.mockClear()
    mockContractUsageTable.mockImplementation(() => <div data-test="mocked-table" />)
  })

  it('renders the total, the rail, and the table together', async () => {
    render(
      <AllTheProviders forceTypenames mocks={[buildTotalMock('67050')]}>
        <ContractUsageSection contractId="contract-1" />
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
        <ContractUsageSection contractId="contract-1" />
      </AllTheProviders>,
    )

    expect(await screen.findByText('From Feb 1, 2027 to Feb 28, 2027')).toBeInTheDocument()
  })

  it('shows $0.00 (not hidden) for a contract with no usage', async () => {
    render(
      <AllTheProviders forceTypenames mocks={[buildTotalMock('0')]}>
        <ContractUsageSection contractId="contract-1" />
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
        <ContractUsageSection contractId="contract-1" />
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
        <ContractUsageSection contractId="contract-1" />
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
        <ContractUsageSection contractId="contract-1" />
      </AllTheProviders>,
    )

    expect(await screen.findByTestId('mocked-table-error')).toBeInTheDocument()
    expect(screen.getByTestId('mocked-rail')).toBeInTheDocument()
    expect(await screen.findByText(/670\.50|67050/)).toBeInTheDocument()
  })
})
