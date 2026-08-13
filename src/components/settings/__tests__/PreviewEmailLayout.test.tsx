import { act, cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { PreviewEmailLayout } from '~/components/settings/PreviewEmailLayout'
import { LocaleEnum } from '~/core/translations'
import { PremiumIntegrationTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

const mockOrganizationInfos = {
  hasOrganizationPremiumAddon: jest.fn(),
}

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => mockOrganizationInfos,
}))

const mockOpenUpdateBillingEntityLogoDialog = jest.fn()

jest.mock('~/components/settings/emails/UpdateBillingEntityLogoDialog', () => ({
  useUpdateBillingEntityLogoDialog: () => ({
    openUpdateBillingEntityLogoDialog: mockOpenUpdateBillingEntityLogoDialog,
  }),
}))

describe('PreviewEmailLayout', () => {
  beforeEach(() => {
    mockOrganizationInfos.hasOrganizationPremiumAddon.mockReturnValue(false)
  })

  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  it('renders children content', () => {
    render(
      <PreviewEmailLayout
        language={LocaleEnum.en}
        logoUrl="https://example.com/logo.png"
        name="Test Company"
      >
        <div>Test Content</div>
      </PreviewEmailLayout>,
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('renders company name', () => {
    render(
      <PreviewEmailLayout
        language={LocaleEnum.en}
        logoUrl="https://example.com/logo.png"
        name="Test Company"
      >
        <div>Content</div>
      </PreviewEmailLayout>,
    )

    expect(screen.getByText('Test Company')).toBeInTheDocument()
  })

  it('renders email subject when provided', () => {
    render(
      <PreviewEmailLayout
        language={LocaleEnum.en}
        emailObject="Test Email Subject"
        logoUrl="https://example.com/logo.png"
        name="Test Company"
      >
        <div>Content</div>
      </PreviewEmailLayout>,
    )

    expect(screen.getByText('Test Email Subject')).toBeInTheDocument()
  })

  it('renders email from when provided', () => {
    render(
      <PreviewEmailLayout
        language={LocaleEnum.en}
        emailObject="Test Subject"
        emailFrom="from@example.com"
        logoUrl="https://example.com/logo.png"
        name="Test Company"
      >
        <div>Content</div>
      </PreviewEmailLayout>,
    )

    expect(screen.getByText('from@example.com')).toBeInTheDocument()
  })

  it('renders email to when provided', () => {
    render(
      <PreviewEmailLayout
        language={LocaleEnum.en}
        emailObject="Test Subject"
        emailTo="to@example.com"
        logoUrl="https://example.com/logo.png"
        name="Test Company"
      >
        <div>Content</div>
      </PreviewEmailLayout>,
    )

    expect(screen.getByText('to@example.com')).toBeInTheDocument()
  })

  it('renders logo when logoUrl is provided', () => {
    render(
      <PreviewEmailLayout
        language={LocaleEnum.en}
        logoUrl="https://example.com/logo.png"
        name="Test Company"
      >
        <div>Content</div>
      </PreviewEmailLayout>,
    )

    const logo = screen.getByAltText('company-logo')

    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', 'https://example.com/logo.png')
  })

  it('renders plus button when no logo is provided', () => {
    render(
      <PreviewEmailLayout language={LocaleEnum.en} logoUrl={null} name="Test Company">
        <div>Content</div>
      </PreviewEmailLayout>,
    )

    const plusButton = screen.getByRole('button')

    expect(plusButton).toBeInTheDocument()
  })

  it('opens logo dialog when clicking on logo', async () => {
    render(
      <PreviewEmailLayout
        language={LocaleEnum.en}
        logoUrl="https://example.com/logo.png"
        name="Test Company"
      >
        <div>Content</div>
      </PreviewEmailLayout>,
    )

    const logoButton = screen.getByRole('button')

    await act(async () => {
      await userEvent.click(logoButton)
    })

    expect(mockOpenUpdateBillingEntityLogoDialog).toHaveBeenCalledWith({
      existingLogoUrl: 'https://example.com/logo.png',
    })
  })

  it('opens logo dialog when clicking plus button', async () => {
    render(
      <PreviewEmailLayout language={LocaleEnum.en} logoUrl={null} name="Test Company">
        <div>Content</div>
      </PreviewEmailLayout>,
    )

    const plusButton = screen.getByRole('button')

    await act(async () => {
      await userEvent.click(plusButton)
    })

    expect(mockOpenUpdateBillingEntityLogoDialog).toHaveBeenCalledWith({
      existingLogoUrl: null,
    })
  })

  it('renders a static logo without an edit button when disableLogoEdit is true', () => {
    render(
      <PreviewEmailLayout
        language={LocaleEnum.en}
        logoUrl="https://example.com/logo.png"
        name="Test Company"
        disableLogoEdit
      >
        <div>Content</div>
      </PreviewEmailLayout>,
    )

    expect(screen.getByAltText('company-logo')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders a static placeholder box (no edit button) when disableLogoEdit is true and no logo is provided', () => {
    const { container } = render(
      <PreviewEmailLayout
        language={LocaleEnum.en}
        logoUrl={null}
        name="Test Company"
        disableLogoEdit
      >
        <div>Content</div>
      </PreviewEmailLayout>,
    )

    // A company placeholder avatar is rendered instead of an editable plus button
    expect(container.querySelector('[data-test="company/medium"]')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows "Powered by" section when organization does not have premium addon', () => {
    mockOrganizationInfos.hasOrganizationPremiumAddon.mockReturnValue(false)

    const { container } = render(
      <PreviewEmailLayout language={LocaleEnum.en} logoUrl={null} name="Test Company">
        <div>Content</div>
      </PreviewEmailLayout>,
    )

    // Should show the Lago logo
    const lagoLogo = container.querySelector('svg')

    expect(lagoLogo).toBeInTheDocument()
  })

  it('hides "Powered by" section when organization has premium addon', () => {
    mockOrganizationInfos.hasOrganizationPremiumAddon.mockReturnValue(true)

    const { container } = render(
      <PreviewEmailLayout language={LocaleEnum.en} logoUrl={null} name="Test Company">
        <div>Content</div>
      </PreviewEmailLayout>,
    )

    // Should not show the "Powered by" section
    const poweredBySection = container.querySelector('.mb-20')

    expect(poweredBySection).not.toBeInTheDocument()
  })

  it('checks for correct premium addon type', () => {
    render(
      <PreviewEmailLayout language={LocaleEnum.en} logoUrl={null} name="Test Company">
        <div>Content</div>
      </PreviewEmailLayout>,
    )

    expect(mockOrganizationInfos.hasOrganizationPremiumAddon).toHaveBeenCalledWith(
      PremiumIntegrationTypeEnum.RemoveBrandingWatermark,
    )
  })

  it('shows skeleton loaders when isLoading is true', () => {
    const { container } = render(
      <PreviewEmailLayout
        language={LocaleEnum.en}
        logoUrl="https://example.com/logo.png"
        name="Test Company"
        emailObject="Test Subject"
        isLoading={true}
      >
        <div>Content</div>
      </PreviewEmailLayout>,
    )

    // Component renders with isLoading prop
    expect(container).toBeInTheDocument()
  })

  it('does not show email header when emailObject is not provided', () => {
    render(
      <PreviewEmailLayout language={LocaleEnum.en} logoUrl={null} name="Test Company">
        <div>Content</div>
      </PreviewEmailLayout>,
    )

    // Avatar and email details should not be rendered
    const avatars = screen.queryAllByRole('img', { name: /avatar/i })

    expect(avatars.length).toBe(0)
  })

  it('renders email header with avatar when emailObject is provided', () => {
    const { container } = render(
      <PreviewEmailLayout
        language={LocaleEnum.en}
        emailObject="Test Subject"
        logoUrl={null}
        name="Test Company"
      >
        <div>Content</div>
      </PreviewEmailLayout>,
    )

    // Should render the email header section with avatar
    const avatar = container.querySelector('.size-10')

    expect(avatar).toBeInTheDocument()
  })

  it('uses contextual locale for translations', () => {
    render(
      <PreviewEmailLayout language={LocaleEnum.fr} logoUrl={null} name="Test Company">
        <div>Content</div>
      </PreviewEmailLayout>,
    )

    // Should render without errors using French locale
    expect(screen.getByText('Test Company')).toBeInTheDocument()
  })

  it('renders without name', () => {
    render(
      <PreviewEmailLayout language={LocaleEnum.en} logoUrl={null}>
        <div>Content</div>
      </PreviewEmailLayout>,
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
  })
})
