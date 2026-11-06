import { render, screen, waitFor } from '@testing-library/react'

import { GetContractUsageCategoriesDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { ContractUsageCategoryRail } from '../ContractUsageCategoryRail'

const buildMock = (appliedRateCards: unknown[]): TestMocksType[number] => ({
  request: { query: GetContractUsageCategoriesDocument, variables: { contractId: 'contract-1' } },
  result: {
    data: {
      contract: { id: 'contract-1', __typename: 'Contract', appliedRateCards },
    },
  },
})

describe('ContractUsageCategoryRail', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
  })

  it('always shows Standalone products first, then the distinct categories, deduped', async () => {
    const appliedRateCards = [
      {
        id: 'a1',
        __typename: 'ContractAppliedRateCard',
        product: {
          id: 'p1',
          __typename: 'Product',
          productCategory: { id: 'cat-1', name: 'Support', __typename: 'ProductCategory' },
        },
      },
      {
        id: 'a2',
        __typename: 'ContractAppliedRateCard',
        product: {
          id: 'p2',
          __typename: 'Product',
          productCategory: { id: 'cat-1', name: 'Support', __typename: 'ProductCategory' },
        },
      },
      {
        id: 'a3',
        __typename: 'ContractAppliedRateCard',
        product: { id: 'p3', __typename: 'Product', productCategory: null },
      },
    ]

    render(
      <AllTheProviders forceTypenames mocks={[buildMock(appliedRateCards)]}>
        <ContractUsageCategoryRail contractId="contract-1" />
      </AllTheProviders>,
    )

    await waitFor(() => expect(screen.getAllByRole('link')).toHaveLength(2))
    const items = screen.getAllByRole('link')

    expect(items[0]).toHaveTextContent(/standalone/i)
    expect(items[1]).toHaveTextContent('Support')
  })

  it('sorts categories alphabetically, regardless of the order rate cards arrive in', async () => {
    const appliedRateCards = [
      {
        id: 'a1',
        __typename: 'ContractAppliedRateCard',
        product: {
          id: 'p1',
          __typename: 'Product',
          productCategory: { id: 'cat-z', name: 'Zebra', __typename: 'ProductCategory' },
        },
      },
      {
        id: 'a2',
        __typename: 'ContractAppliedRateCard',
        product: {
          id: 'p2',
          __typename: 'Product',
          productCategory: { id: 'cat-a', name: 'Apple', __typename: 'ProductCategory' },
        },
      },
      {
        id: 'a3',
        __typename: 'ContractAppliedRateCard',
        product: {
          id: 'p3',
          __typename: 'Product',
          productCategory: { id: 'cat-m', name: 'Mango', __typename: 'ProductCategory' },
        },
      },
    ]

    render(
      <AllTheProviders forceTypenames mocks={[buildMock(appliedRateCards)]}>
        <ContractUsageCategoryRail contractId="contract-1" />
      </AllTheProviders>,
    )

    await waitFor(() => expect(screen.getAllByRole('link')).toHaveLength(4))
    const items = screen.getAllByRole('link')

    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringMatching(/standalone/i),
      'Apple',
      'Mango',
      'Zebra',
    ])
  })

  it('sorts numeric suffixes numerically, not lexically', async () => {
    const appliedRateCards = [
      {
        id: 'a1',
        __typename: 'ContractAppliedRateCard',
        product: {
          id: 'p1',
          __typename: 'Product',
          productCategory: { id: 'cat-19', name: 'Category 19', __typename: 'ProductCategory' },
        },
      },
      {
        id: 'a2',
        __typename: 'ContractAppliedRateCard',
        product: {
          id: 'p2',
          __typename: 'Product',
          productCategory: { id: 'cat-2', name: 'Category 2', __typename: 'ProductCategory' },
        },
      },
    ]

    render(
      <AllTheProviders forceTypenames mocks={[buildMock(appliedRateCards)]}>
        <ContractUsageCategoryRail contractId="contract-1" />
      </AllTheProviders>,
    )

    await waitFor(() => expect(screen.getAllByRole('link')).toHaveLength(3))
    const items = screen.getAllByRole('link')

    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringMatching(/standalone/i),
      'Category 2',
      'Category 19',
    ])
  })

  it('shows only Standalone products for a contract with no applied rate cards', async () => {
    render(
      <AllTheProviders forceTypenames mocks={[buildMock([])]}>
        <ContractUsageCategoryRail contractId="contract-1" />
      </AllTheProviders>,
    )

    const items = await screen.findAllByRole('link')

    expect(items).toHaveLength(1)
    expect(items[0]).toHaveTextContent(/standalone/i)
  })

  it('calls onErrorChange when the categories query fails', async () => {
    const onErrorChange = jest.fn()
    const errorMock: TestMocksType[number] = {
      request: {
        query: GetContractUsageCategoriesDocument,
        variables: { contractId: 'contract-1' },
      },
      error: new Error('boom'),
    }

    render(
      <AllTheProviders mocks={[errorMock]}>
        <ContractUsageCategoryRail contractId="contract-1" onErrorChange={onErrorChange} />
      </AllTheProviders>,
    )

    await waitFor(() => expect(onErrorChange).toHaveBeenCalledWith(true))
  })

  it('selects Standalone products by default and a real category when categoryId matches the URL', async () => {
    window.history.pushState({}, '', '/?categoryId=cat-1')

    const appliedRateCards = [
      {
        id: 'a1',
        __typename: 'ContractAppliedRateCard',
        product: {
          id: 'p1',
          __typename: 'Product',
          productCategory: { id: 'cat-1', name: 'Support', __typename: 'ProductCategory' },
        },
      },
    ]

    render(
      <AllTheProviders forceTypenames mocks={[buildMock(appliedRateCards)]}>
        <ContractUsageCategoryRail contractId="contract-1" />
      </AllTheProviders>,
    )

    await waitFor(() => expect(screen.getAllByRole('link')).toHaveLength(2))
    const items = screen.getAllByRole('link')

    expect(items[0]).not.toHaveAttribute('aria-current', 'page')
    expect(items[1]).toHaveAttribute('aria-current', 'page')
  })

  it('drops the page param (same key the table reads) when switching category', async () => {
    window.history.pushState({}, '', '/?page=3')

    const appliedRateCards = [
      {
        id: 'a1',
        __typename: 'ContractAppliedRateCard',
        product: {
          id: 'p1',
          __typename: 'Product',
          productCategory: { id: 'cat-1', name: 'Support', __typename: 'ProductCategory' },
        },
      },
    ]

    render(
      <AllTheProviders forceTypenames mocks={[buildMock(appliedRateCards)]}>
        <ContractUsageCategoryRail contractId="contract-1" />
      </AllTheProviders>,
    )

    await waitFor(() => expect(screen.getAllByRole('link')).toHaveLength(2))
    const items = screen.getAllByRole('link')

    expect(items[0]).toHaveAttribute('href', '/')
    expect(items[1]).toHaveAttribute('href', '/?categoryId=cat-1')
  })

  it('refetches, without remounting, when refreshToken changes', async () => {
    const appliedRateCards = [
      {
        id: 'a1',
        __typename: 'ContractAppliedRateCard',
        product: {
          id: 'p1',
          __typename: 'Product',
          productCategory: { id: 'cat-1', name: 'Support', __typename: 'ProductCategory' },
        },
      },
    ]

    const mocks = [buildMock([]), buildMock(appliedRateCards)]

    const { rerender } = render(
      <AllTheProviders forceTypenames mocks={mocks}>
        <ContractUsageCategoryRail contractId="contract-1" refreshToken={0} />
      </AllTheProviders>,
    )

    await waitFor(() => expect(screen.getAllByRole('link')).toHaveLength(1))

    rerender(
      <AllTheProviders forceTypenames mocks={mocks}>
        <ContractUsageCategoryRail contractId="contract-1" refreshToken={1} />
      </AllTheProviders>,
    )

    await waitFor(() => expect(screen.getAllByRole('link')).toHaveLength(2))
  })
})
