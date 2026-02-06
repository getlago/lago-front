import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import PremiumFeature from '../PremiumFeature'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
    locale: 'en',
  }),
}))

const DEFAULT_PROPS = {
  title: 'Test Title',
  description: 'Test Description',
  feature: 'Test Feature',
}

describe('PremiumFeature', () => {
  afterEach(cleanup)

  describe('Basic Rendering', () => {
    it('renders the premium feature container', () => {
      const { container } = render(<PremiumFeature {...DEFAULT_PROPS} />)

      expect(container.firstChild).toBeInTheDocument()
    })

    it('renders the sparkles icon in header', () => {
      const { container } = render(<PremiumFeature {...DEFAULT_PROPS} />)

      // Icon component renders with data-test="sparkles/medium" by default
      const sparklesIcons = container.querySelectorAll('[data-test="sparkles/medium"]')

      expect(sparklesIcons.length).toBeGreaterThanOrEqual(1)
    })

    it('renders a button to upgrade', () => {
      render(<PremiumFeature {...DEFAULT_PROPS} />)

      const button = screen.getByRole('button')

      expect(button).toBeInTheDocument()
    })
  })

  describe('Props Handling', () => {
    it('passes through data-test prop', () => {
      render(<PremiumFeature {...DEFAULT_PROPS} data-test="premium-feature-test-id" />)

      expect(screen.getByTestId('premium-feature-test-id')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(<PremiumFeature {...DEFAULT_PROPS} className="custom-class" />)

      expect(container.querySelector('.custom-class')).toBeInTheDocument()
    })

    it('renders title in the DOM', () => {
      render(<PremiumFeature {...DEFAULT_PROPS} />)

      expect(screen.getByText(DEFAULT_PROPS.title)).toBeInTheDocument()
    })

    it('renders description in the DOM', () => {
      render(<PremiumFeature {...DEFAULT_PROPS} />)

      expect(screen.getByText(DEFAULT_PROPS.description)).toBeInTheDocument()
    })
  })

  describe('Dialog Interaction', () => {
    it('opens premium warning dialog when button is clicked', async () => {
      const user = userEvent.setup()

      render(<PremiumFeature {...DEFAULT_PROPS} />)

      const button = screen.getByRole('button')

      await user.click(button)

      // Dialog should be opened - check for dialog content
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('Snapshot Tests', () => {
    it('matches snapshot with default props', () => {
      const { container } = render(<PremiumFeature {...DEFAULT_PROPS} />)

      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot with data-test prop', () => {
      const { container } = render(
        <PremiumFeature {...DEFAULT_PROPS} data-test="premium-feature-test" />,
      )

      expect(container.firstChild).toMatchSnapshot()
    })
  })
})
