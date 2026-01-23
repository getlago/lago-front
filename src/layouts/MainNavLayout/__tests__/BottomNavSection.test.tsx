import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import { BOTTOM_NAV_SECTION_TEST_ID, BottomNavSection } from '../BottomNavSection'

const mockHasPermissions = jest.fn()
const mockOpenInspector = jest.fn()

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: mockHasPermissions,
  }),
}))

jest.mock('~/hooks/useDeveloperTool', () => ({
  useDeveloperTool: () => ({
    openPanel: mockOpenInspector,
  }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  envGlobalVar: () => ({ appEnv: 'development' }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
    locale: 'en',
  }),
}))

describe('BottomNavSection', () => {
  const defaultProps = {
    isLoading: false,
    onItemClick: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
  })

  describe('Test ID constants', () => {
    it('exports expected test ID constants', () => {
      expect(BOTTOM_NAV_SECTION_TEST_ID).toBe('bottom-nav-section')
    })

    it('test ID constants follow kebab-case naming convention', () => {
      expect(BOTTOM_NAV_SECTION_TEST_ID).toMatch(/^[a-z-]+$/)
    })
  })

  describe('Component rendering', () => {
    it('renders the bottom nav section', () => {
      render(<BottomNavSection {...defaultProps} />)

      expect(screen.getByTestId(BOTTOM_NAV_SECTION_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('Permission-based visibility', () => {
    it('calls hasPermissions for settings visibility', () => {
      render(<BottomNavSection {...defaultProps} />)

      expect(mockHasPermissions).toHaveBeenCalledWith(['organizationView'])
    })

    it('calls hasPermissions for developer tools visibility', () => {
      render(<BottomNavSection {...defaultProps} />)

      expect(mockHasPermissions).toHaveBeenCalledWith(['developersManage'])
    })
  })

  describe('Component exports', () => {
    it('exports successfully', () => {
      expect(BottomNavSection).toBeDefined()
      expect(typeof BottomNavSection).toBe('function')
    })
  })
})
