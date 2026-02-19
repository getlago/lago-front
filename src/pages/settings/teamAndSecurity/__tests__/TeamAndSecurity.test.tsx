import { cleanup, screen, waitFor } from '@testing-library/react'

import { initializeTranslations } from '~/core/apolloClient'
import { render } from '~/test-utils'

import TeamAndSecurity from '../TeamAndSecurity'

jest.mock('../authentication/Authentication', () => {
  return {
    __esModule: true,
    default: () => <div data-test="authentication-tab">Authentication Content</div>,
  }
})

jest.mock('../members/Members', () => {
  return {
    __esModule: true,
    default: () => <div data-test="members-tab">Members Content</div>,
  }
})

jest.mock('../roles/rolesList/RolesList', () => {
  return {
    __esModule: true,
    default: () => <div data-test="roles-tab">Roles Content</div>,
  }
})

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    organization: {},
    loading: false,
  }),
}))

describe('TeamAndSecurity', () => {
  beforeAll(async () => {
    await initializeTranslations()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(cleanup)

  it('renders the page header', async () => {
    render(<TeamAndSecurity />)

    await waitFor(() => {
      expect(document.body.textContent).toBeTruthy()
    })
  })

  it('renders 3 navigation tabs', async () => {
    render(<TeamAndSecurity />)

    await waitFor(() => {
      // NavigationTab renders MUI Tabs as buttons with role="tab"
      const tabs = screen.getAllByRole('tab')

      expect(tabs).toHaveLength(3)
    })
  })

  it('renders Members tab label', async () => {
    render(<TeamAndSecurity />)

    await waitFor(() => {
      const tabs = screen.getAllByRole('tab')

      // First tab is Members
      expect(tabs[0]).toHaveTextContent('Members')
    })
  })

  it('renders Roles & permissions tab label', async () => {
    render(<TeamAndSecurity />)

    await waitFor(() => {
      const tabs = screen.getAllByRole('tab')

      // Second tab is Roles
      expect(tabs[1]).toBeInTheDocument()
    })
  })

  it('renders Authentication tab label', async () => {
    render(<TeamAndSecurity />)

    await waitFor(() => {
      const tabs = screen.getAllByRole('tab')

      // Third tab is Authentication
      expect(tabs[2]).toHaveTextContent('Authentication')
    })
  })

  it('renders first tab as selected by default', async () => {
    render(<TeamAndSecurity />)

    await waitFor(() => {
      const tabs = screen.getAllByRole('tab')

      expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    })
  })

  it('renders the first tab panel content (Members)', async () => {
    render(<TeamAndSecurity />)

    await waitFor(() => {
      expect(screen.getByTestId('members-tab')).toBeInTheDocument()
    })
  })
})
