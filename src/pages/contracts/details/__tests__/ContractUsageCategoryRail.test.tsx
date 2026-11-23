import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComponentProps } from 'react'

import { AllTheProviders } from '~/test-utils'

import { ContractUsageCategoryRail } from '../ContractUsageCategoryRail'
import { ContractUsageCategory } from '../useContractUsageCategories'

type RailProps = ComponentProps<typeof ContractUsageCategoryRail>

const supportCategory: ContractUsageCategory = {
  id: 'cat-1',
  name: 'Support',
  displayName: 'Support',
}
const computeCategory: ContractUsageCategory = {
  id: 'cat-2',
  name: 'Compute',
  displayName: 'Compute',
}

const renderRail = (props: Partial<RailProps> = {}): void => {
  render(
    <AllTheProviders>
      <ContractUsageCategoryRail
        categories={[supportCategory]}
        showStandalone
        activeCategoryId={null}
        isLoading={false}
        hasError={false}
        onRetry={jest.fn()}
        {...props}
      />
    </AllTheProviders>,
  )
}

describe('ContractUsageCategoryRail', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
  })

  describe('GIVEN a contract with standalone products and categories', () => {
    it('THEN shows Standalone products first, followed by the categories in the given order', async () => {
      renderRail({ categories: [computeCategory, supportCategory] })

      await screen.findByText(/standalone/i)
      const items = screen.getAllByRole('link')

      expect(items).toHaveLength(3)
      expect(items[0]).toHaveTextContent(/standalone/i)
      expect(items[1]).toHaveTextContent('Compute')
      expect(items[2]).toHaveTextContent('Support')
    })
  })

  describe('GIVEN a contract whose products all belong to a category', () => {
    it('THEN leaves the Standalone products entry out', () => {
      renderRail({ showStandalone: false, activeCategoryId: 'cat-1' })

      const items = screen.getAllByRole('link')

      expect(items).toHaveLength(1)
      expect(items[0]).toHaveTextContent('Support')
      expect(screen.queryByText(/standalone/i)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN an active view', () => {
    it('THEN marks Standalone products as current when no category is active', () => {
      renderRail({ activeCategoryId: null })

      const items = screen.getAllByRole('link')

      expect(items[0]).toHaveAttribute('aria-current', 'page')
      expect(items[1]).not.toHaveAttribute('aria-current', 'page')
    })

    it('THEN marks the active category as current', () => {
      renderRail({ activeCategoryId: 'cat-1' })

      const items = screen.getAllByRole('link')

      expect(items[0]).not.toHaveAttribute('aria-current', 'page')
      expect(items[1]).toHaveAttribute('aria-current', 'page')
    })
  })

  describe('WHEN switching category', () => {
    it('THEN drops the page param the table reads', () => {
      window.history.pushState({}, '', '/?page=3')

      renderRail()

      const items = screen.getAllByRole('link')

      expect(items[0]).toHaveAttribute('href', '/')
      expect(items[1]).toHaveAttribute('href', '/?categoryId=cat-1')
    })

    it('THEN drops the usage filters, which are scoped to the category being left', () => {
      window.history.pushState(
        {},
        '',
        '/?categoryId=cat-2&cus_rateCardProduct=p1&cus_appliedRateCardProductType=fixed&tab=usage',
      )

      renderRail({ activeCategoryId: 'cat-2' })

      const items = screen.getAllByRole('link')

      expect(items[0]).toHaveAttribute('href', '/?tab=usage')
      expect(items[1]).toHaveAttribute('href', '/?categoryId=cat-1&tab=usage')
    })
  })

  describe('GIVEN the categories are still loading', () => {
    it('THEN renders no entry yet', () => {
      renderRail({ isLoading: true, activeCategoryId: undefined })

      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })
  })

  describe('GIVEN the categories failed to load', () => {
    it('THEN shows its own error placeholder and retries on demand', async () => {
      const onRetry = jest.fn()

      renderRail({ hasError: true, onRetry })

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.queryByRole('link')).not.toBeInTheDocument()

      await userEvent.click(screen.getByRole('button'))

      expect(onRetry).toHaveBeenCalledTimes(1)
    })
  })
  describe('GIVEN a category with an invoice display name', () => {
    it('THEN labels its entry with that name, as the category total does', () => {
      renderRail({
        categories: [{ id: 'cat-3', name: 'gpu', displayName: 'GPU compute' }],
        activeCategoryId: 'cat-3',
      })

      const items = screen.getAllByRole('link')

      expect(items[items.length - 1]).toHaveTextContent('GPU compute')
      expect(screen.queryByText('gpu')).not.toBeInTheDocument()
    })
  })
})
