import { screen } from '@testing-library/react'
import React from 'react'

import { render } from '~/test-utils'

import { BREADCRUMB_NAV_TEST_ID } from '../Breadcrumb'
import { MainHeader } from '../MainHeader'
import {
  ACTIONS_BLOCK_TEST_ID,
  ENTITY_SECTION_VIEW_NAME_TEST_ID,
  MAIN_HEADER_FILTERS_TEST_ID,
} from '../mainHeaderTestIds'
import { MainHeaderConfig } from '../types'

const mockUseMainHeaderReader = jest.fn()

jest.mock('../MainHeaderContext', () => ({
  useMainHeaderReader: () => mockUseMainHeaderReader(),
}))

describe('MainHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN no config is set', () => {
    describe('WHEN the component renders', () => {
      it('THEN should render nothing', () => {
        mockUseMainHeaderReader.mockReturnValue({ config: null })

        const { container } = render(<MainHeader />)

        expect(container.innerHTML).toBe('')
      })
    })
  })

  describe('GIVEN a config with breadcrumb', () => {
    const config: MainHeaderConfig = {
      breadcrumb: [
        { label: 'Customers', path: '/customers' },
        { label: 'Acme Corp', path: '/customers/1' },
      ],
      entity: { viewName: 'Acme Corp' },
    }

    beforeEach(() => {
      mockUseMainHeaderReader.mockReturnValue({ config })
    })

    describe('WHEN the component renders', () => {
      it('THEN should display the breadcrumb nav', () => {
        render(<MainHeader />)

        expect(screen.getByTestId(BREADCRUMB_NAV_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a config with entity', () => {
    const config: MainHeaderConfig = {
      entity: { viewName: 'Test Entity' },
    }

    beforeEach(() => {
      mockUseMainHeaderReader.mockReturnValue({ config })
    })

    describe('WHEN the component renders', () => {
      it('THEN should display the entity view name', () => {
        render(<MainHeader />)

        const viewNames = screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)

        expect(viewNames.length).toBeGreaterThanOrEqual(1)
        expect(viewNames[0]).toHaveTextContent('Test Entity')
      })
    })
  })

  describe('GIVEN a config with actions', () => {
    const config: MainHeaderConfig = {
      actions: [{ type: 'action', label: 'Save', onClick: jest.fn(), dataTest: 'save-action' }],
    }

    beforeEach(() => {
      mockUseMainHeaderReader.mockReturnValue({ config })
    })

    describe('WHEN the component renders', () => {
      it('THEN should display the actions block', () => {
        render(<MainHeader />)

        expect(screen.getByTestId(ACTIONS_BLOCK_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a config with tabs', () => {
    describe('WHEN there are fewer than 2 tabs', () => {
      it('THEN should not render the tab bar', () => {
        const config: MainHeaderConfig = {
          tabs: [
            {
              title: 'Only Tab',
              link: '/only',
              content: React.createElement('div', null, 'content'),
            },
          ],
        }

        mockUseMainHeaderReader.mockReturnValue({ config })
        render(<MainHeader />)

        expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
      })
    })

    describe('WHEN there are 2 or more tabs', () => {
      it('THEN should render the tab bar', () => {
        const config: MainHeaderConfig = {
          tabs: [
            {
              title: 'Overview',
              link: '/overview',
              content: React.createElement('div', null, 'Overview'),
            },
            {
              title: 'Details',
              link: '/details',
              content: React.createElement('div', null, 'Details'),
            },
          ],
        }

        mockUseMainHeaderReader.mockReturnValue({ config })
        render(<MainHeader />)

        expect(screen.getAllByRole('tab')).toHaveLength(2)
      })
    })
  })

  describe('GIVEN a config with filtersSection', () => {
    const config: MainHeaderConfig = {
      filtersSection: React.createElement('div', { 'data-test': 'custom-filter' }, 'Filters'),
    }

    beforeEach(() => {
      mockUseMainHeaderReader.mockReturnValue({ config })
    })

    describe('WHEN the component renders', () => {
      it('THEN should display the filters section', () => {
        render(<MainHeader />)

        expect(screen.getByTestId(MAIN_HEADER_FILTERS_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId('custom-filter')).toBeInTheDocument()
      })
    })
  })
})
