import { render, screen } from '@testing-library/react'
import { useEffect } from 'react'

import { GetContractCurrentUsageTotalDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { ContractUsageSection } from '../ContractUsageSection'

type MockedChildProps = { onErrorChange?: (hasError: boolean) => void }

const mockContractUsageCategoryRail = jest.fn<JSX.Element, [MockedChildProps]>(() => (
  <div data-test="mocked-rail" />
))
const mockContractUsageTable = jest.fn<JSX.Element, [MockedChildProps]>(() => (
  <div data-test="mocked-table" />
))

jest.mock('../ContractUsageCategoryRail', () => ({
  ContractUsageCategoryRail: (props: { onErrorChange?: (hasError: boolean) => void }) =>
    mockContractUsageCategoryRail(props),
}))
jest.mock('../ContractUsageTable', () => ({
  ContractUsageTable: (props: { onErrorChange?: (hasError: boolean) => void }) =>
    mockContractUsageTable(props),
}))

const buildTotalMock = (totalAmountCents: string): TestMocksType[number] => ({
  request: { query: GetContractCurrentUsageTotalDocument, variables: { contractId: 'contract-1' } },
  result: {
    data: {
      contractCurrentUsageTotal: { __typename: 'ContractCurrentUsageTotal', totalAmountCents },
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

  it('also collapses to the error placeholder when only the rail reports an error', async () => {
    mockContractUsageCategoryRail.mockImplementation(
      ({ onErrorChange }: { onErrorChange?: (hasError: boolean) => void }) => {
        useEffect(() => {
          onErrorChange?.(true)
        }, [onErrorChange])

        return <div data-test="mocked-rail" />
      },
    )

    render(
      <AllTheProviders forceTypenames mocks={[buildTotalMock('0')]}>
        <ContractUsageSection contractId="contract-1" />
      </AllTheProviders>,
    )

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument()
    expect(screen.queryByTestId('mocked-table')).not.toBeInTheDocument()
  })

  it('also collapses to the error placeholder when only the table reports an error', async () => {
    mockContractUsageTable.mockImplementation(
      ({ onErrorChange }: { onErrorChange?: (hasError: boolean) => void }) => {
        useEffect(() => {
          onErrorChange?.(true)
        }, [onErrorChange])

        return <div data-test="mocked-table" />
      },
    )

    render(
      <AllTheProviders forceTypenames mocks={[buildTotalMock('0')]}>
        <ContractUsageSection contractId="contract-1" />
      </AllTheProviders>,
    )

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument()
    expect(screen.queryByTestId('mocked-rail')).not.toBeInTheDocument()
  })
})
