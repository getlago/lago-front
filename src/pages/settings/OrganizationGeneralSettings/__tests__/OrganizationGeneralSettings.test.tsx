import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import OrganizationGeneralSettings from '../OrganizationGeneralSettings'

const mockMainHeaderConfigure = jest.fn()
const mockHasPermissions = jest.fn()
const mockOpenEditOrganizationSlugDialog = jest.fn()
const mockUseOrganizationInfos = jest.fn()

jest.mock('~/components/MainHeader/MainHeader', () => ({
  MainHeader: {
    Configure: (props: Record<string, unknown>) => {
      mockMainHeaderConfigure(props)
      return null
    },
  },
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => mockUseOrganizationInfos(),
}))

jest.mock('../dialogs/useEditOrganizationSlugDialog', () => ({
  useEditOrganizationSlugDialog: () => ({
    openEditOrganizationSlugDialog: mockOpenEditOrganizationSlugDialog,
  }),
}))

describe('OrganizationGeneralSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockUseOrganizationInfos.mockReturnValue({
      organization: { slug: 'acme' },
      loading: false,
    })
  })

  describe('GIVEN the page is loading', () => {
    describe('WHEN loading is true', () => {
      it('THEN should not display the slug content', () => {
        mockUseOrganizationInfos.mockReturnValue({
          organization: null,
          loading: true,
        })

        render(<OrganizationGeneralSettings />)

        expect(screen.queryByTestId('current-organization-slug')).not.toBeInTheDocument()
        expect(screen.queryByTestId('edit-organization-slug-button')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the page is loaded with an organization slug', () => {
    describe('WHEN the user has organizationUpdate permission', () => {
      it('THEN should display the current slug', () => {
        render(<OrganizationGeneralSettings />)

        const slugElement = screen.getByTestId('current-organization-slug')

        expect(slugElement).toHaveTextContent('/acme')
      })

      it('THEN should display the edit button', () => {
        render(<OrganizationGeneralSettings />)

        expect(screen.getByTestId('edit-organization-slug-button')).toBeInTheDocument()
      })

      it('THEN should enable the edit button', () => {
        render(<OrganizationGeneralSettings />)

        expect(screen.getByTestId('edit-organization-slug-button')).not.toBeDisabled()
      })
    })

    describe('WHEN the user clicks the edit button', () => {
      it('THEN should call openEditOrganizationSlugDialog with current slug', async () => {
        const user = userEvent.setup()

        render(<OrganizationGeneralSettings />)

        await user.click(screen.getByTestId('edit-organization-slug-button'))

        expect(mockOpenEditOrganizationSlugDialog).toHaveBeenCalledWith({
          currentSlug: 'acme',
        })
      })
    })

    describe('WHEN the user does NOT have organizationUpdate permission', () => {
      it('THEN should not display the edit button', () => {
        mockHasPermissions.mockReturnValue(false)

        render(<OrganizationGeneralSettings />)

        expect(screen.queryByTestId('edit-organization-slug-button')).not.toBeInTheDocument()
      })

      it('THEN should still display the slug', () => {
        mockHasPermissions.mockReturnValue(false)

        render(<OrganizationGeneralSettings />)

        expect(screen.getByTestId('current-organization-slug')).toHaveTextContent('/acme')
      })
    })
  })

  describe('GIVEN the organization has no slug', () => {
    describe('WHEN slug is empty', () => {
      it('THEN should display a dash placeholder', () => {
        mockUseOrganizationInfos.mockReturnValue({
          organization: { slug: '' },
          loading: false,
        })

        render(<OrganizationGeneralSettings />)

        expect(screen.getByTestId('current-organization-slug')).toHaveTextContent('—')
      })

      it('THEN should disable the edit button', () => {
        mockUseOrganizationInfos.mockReturnValue({
          organization: { slug: '' },
          loading: false,
        })

        render(<OrganizationGeneralSettings />)

        expect(screen.getByTestId('edit-organization-slug-button')).toBeDisabled()
      })
    })
  })
})
