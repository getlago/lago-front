import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import { render, testMockNavigateFn } from '~/test-utils'

import { ACTIONS_BLOCK_TEST_ID } from '../ActionRenderer'
import { BREADCRUMB_NAV_TEST_ID } from '../Breadcrumb'
import { ENTITY_SECTION_VIEW_NAME_TEST_ID } from '../EntitySection'
import {
  MAIN_HEADER_BACK_BUTTON_TEST_ID,
  MAIN_HEADER_FILTERS_TEST_ID,
  MAIN_HEADER_TEST_ID,
  MAIN_HEADER_TITLE_TEST_ID,
  MainHeaderComponent,
} from '../MainHeader'
import { MainHeaderConfig } from '../types'

const mockUseMainHeaderReader = jest.fn()

jest.mock('../MainHeaderContext', () => ({
  useMainHeaderReader: () => mockUseMainHeaderReader(),
}))

describe('MainHeaderComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN no config is set', () => {
    describe('WHEN the component renders', () => {
      it('THEN should render nothing', () => {
        mockUseMainHeaderReader.mockReturnValue({ config: null })

        const { container } = render(<MainHeaderComponent />)

        expect(container.innerHTML).toBe('')
      })
    })
  })

  describe('GIVEN a config with backButton and title (fallback mode)', () => {
    const config: MainHeaderConfig = {
      backButton: { path: '/customers' },
      title: 'Customer Details',
    }

    beforeEach(() => {
      mockUseMainHeaderReader.mockReturnValue({ config })
    })

    describe('WHEN the component renders', () => {
      it('THEN should display the header', () => {
        render(<MainHeaderComponent />)

        expect(screen.getByTestId(MAIN_HEADER_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should display the back button', () => {
        render(<MainHeaderComponent />)

        expect(screen.getByTestId(MAIN_HEADER_BACK_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should display the title', () => {
        render(<MainHeaderComponent />)

        expect(screen.getByTestId(MAIN_HEADER_TITLE_TEST_ID)).toHaveTextContent('Customer Details')
      })

      it('THEN should not display the breadcrumb', () => {
        render(<MainHeaderComponent />)

        expect(screen.queryByTestId(BREADCRUMB_NAV_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the back button is clicked', () => {
      it('THEN should navigate to the back path', async () => {
        const user = userEvent.setup()

        render(<MainHeaderComponent />)

        await user.click(screen.getByTestId(MAIN_HEADER_BACK_BUTTON_TEST_ID))

        expect(testMockNavigateFn).toHaveBeenCalledWith('/customers')
      })
    })
  })

  describe('GIVEN a config with breadcrumb (breadcrumb mode)', () => {
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
        render(<MainHeaderComponent />)

        expect(screen.getByTestId(BREADCRUMB_NAV_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should not display the back button', () => {
        render(<MainHeaderComponent />)

        expect(screen.queryByTestId(MAIN_HEADER_BACK_BUTTON_TEST_ID)).not.toBeInTheDocument()
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
        render(<MainHeaderComponent />)

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
        render(<MainHeaderComponent />)

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
        render(<MainHeaderComponent />)

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
        render(<MainHeaderComponent />)

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
        render(<MainHeaderComponent />)

        expect(screen.getByTestId(MAIN_HEADER_FILTERS_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId('custom-filter')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a config with isLoading true and backButton', () => {
    const config: MainHeaderConfig = {
      backButton: { path: '/back' },
      isLoading: true,
    }

    beforeEach(() => {
      mockUseMainHeaderReader.mockReturnValue({ config })
    })

    describe('WHEN the component renders', () => {
      it('THEN should not display the title', () => {
        render(<MainHeaderComponent />)

        expect(screen.queryByTestId(MAIN_HEADER_TITLE_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN should display the back button', () => {
        render(<MainHeaderComponent />)

        expect(screen.getByTestId(MAIN_HEADER_BACK_BUTTON_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN backButton and breadcrumb are both set', () => {
    const config: MainHeaderConfig = {
      backButton: { path: '/back' },
      breadcrumb: [{ label: 'Home', path: '/' }],
    }

    beforeEach(() => {
      mockUseMainHeaderReader.mockReturnValue({ config })
    })

    describe('WHEN the component renders', () => {
      it('THEN should use breadcrumb mode (breadcrumb takes priority)', () => {
        render(<MainHeaderComponent />)

        expect(screen.getByTestId(BREADCRUMB_NAV_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(MAIN_HEADER_BACK_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })
})
