import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CustomerPortalEditableFieldEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import OrganizationGeneralSettings from '../OrganizationGeneralSettings'

const mockMainHeaderConfigure = jest.fn()
const mockHasPermissions = jest.fn()
const mockOpenEditOrganizationSlugDialog = jest.fn()
const mockOpenEditCustomerPortalFieldsDialog = jest.fn()
const mockUseGetOrganizationCustomerPortalSettingsQuery = jest.fn()

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

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetOrganizationCustomerPortalSettingsQuery: () =>
    mockUseGetOrganizationCustomerPortalSettingsQuery(),
}))

jest.mock('../dialogs/useEditCustomerPortalFieldsDialog', () => ({
  useEditCustomerPortalFieldsDialog: () => ({
    openEditCustomerPortalFieldsDialog: mockOpenEditCustomerPortalFieldsDialog,
  }),
}))

jest.mock('../dialogs/useEditOrganizationSlugDialog', () => ({
  useEditOrganizationSlugDialog: () => ({
    openEditOrganizationSlugDialog: mockOpenEditOrganizationSlugDialog,
  }),
}))

const renderWithSlug = (slug: string | undefined) =>
  render(<OrganizationGeneralSettings />, {
    useParams: slug ? { organizationSlug: slug } : {},
  })

describe('OrganizationGeneralSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockUseGetOrganizationCustomerPortalSettingsQuery.mockReturnValue({
      loading: false,
      data: {
        organization: {
          id: 'org-1',
          customerPortalEditableFields: [
            CustomerPortalEditableFieldEnum.Name,
            CustomerPortalEditableFieldEnum.City,
          ],
        },
      },
    })
  })

  describe('GIVEN the URL has no organizationSlug yet', () => {
    describe('WHEN the slug param is missing', () => {
      it('THEN should not display the slug content', () => {
        renderWithSlug(undefined)

        expect(screen.queryByTestId('current-organization-slug')).not.toBeInTheDocument()
        expect(screen.queryByTestId('edit-organization-slug-button')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the URL has an organizationSlug', () => {
    describe('WHEN the user has organizationUpdate permission', () => {
      it('THEN should display the current slug', () => {
        renderWithSlug('acme')

        const slugElement = screen.getByTestId('current-organization-slug')

        expect(slugElement).toHaveTextContent('/acme')
      })

      it('THEN should display the edit button', () => {
        renderWithSlug('acme')

        expect(screen.getByTestId('edit-organization-slug-button')).toBeInTheDocument()
      })

      it('THEN should enable the edit button', () => {
        renderWithSlug('acme')

        expect(screen.getByTestId('edit-organization-slug-button')).not.toBeDisabled()
      })
    })

    describe('WHEN the user clicks the edit button', () => {
      it('THEN should call openEditOrganizationSlugDialog with current slug', async () => {
        const user = userEvent.setup()

        renderWithSlug('acme')

        await user.click(screen.getByTestId('edit-organization-slug-button'))

        expect(mockOpenEditOrganizationSlugDialog).toHaveBeenCalledWith({
          currentSlug: 'acme',
        })
      })
    })

    describe('WHEN the user does NOT have organizationUpdate permission', () => {
      it('THEN should not display the edit button', () => {
        mockHasPermissions.mockReturnValue(false)

        renderWithSlug('acme')

        expect(screen.queryByTestId('edit-organization-slug-button')).not.toBeInTheDocument()
      })

      it('THEN should still display the slug', () => {
        mockHasPermissions.mockReturnValue(false)

        renderWithSlug('acme')

        expect(screen.getByTestId('current-organization-slug')).toHaveTextContent('/acme')
      })
    })
  })

  describe('GIVEN the customer portal section', () => {
    describe('WHEN the settings are loaded', () => {
      it('THEN should list the editable fields in the portal form order', () => {
        renderWithSlug('acme')

        expect(screen.getByTestId('customer-portal-editable-fields')).toHaveTextContent(
          'text_634687079be251fdb43833cb, text_62ab2d0396dd6b0361614d90',
        )
      })
    })

    describe('WHEN no field is editable', () => {
      it('THEN should display the empty state', () => {
        mockUseGetOrganizationCustomerPortalSettingsQuery.mockReturnValue({
          loading: false,
          data: { organization: { id: 'org-1', customerPortalEditableFields: [] } },
        })

        renderWithSlug('acme')

        expect(screen.getByTestId('customer-portal-editable-fields')).toHaveTextContent(
          'text_17927135765776z05d5xcetc',
        )
      })
    })

    describe('WHEN the user clicks the edit button', () => {
      it('THEN should open the dialog with the current editable fields', async () => {
        const user = userEvent.setup()

        renderWithSlug('acme')

        await user.click(screen.getByTestId('edit-customer-portal-fields-button'))

        expect(mockOpenEditCustomerPortalFieldsDialog).toHaveBeenCalledWith({
          editableFields: [
            CustomerPortalEditableFieldEnum.Name,
            CustomerPortalEditableFieldEnum.City,
          ],
        })
      })
    })

    describe('WHEN the user does NOT have organizationTaxesUpdate permission', () => {
      it('THEN should not display the edit button', () => {
        mockHasPermissions.mockImplementation(
          (permissions: string[]) => !permissions.includes('organizationTaxesUpdate'),
        )

        renderWithSlug('acme')

        expect(screen.queryByTestId('edit-customer-portal-fields-button')).not.toBeInTheDocument()
        expect(screen.getByTestId('edit-organization-slug-button')).toBeInTheDocument()
      })
    })
  })
})
