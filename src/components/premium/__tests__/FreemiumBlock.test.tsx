import { cleanup, screen } from '@testing-library/react'

import { render } from '~/test-utils'

import { FreemiumBlock } from '../FreemiumBlock'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
    locale: 'en',
  }),
}))

const TRANSLATION_KEYS = {
  title: 'test_title_key',
  description: 'test_description_key',
  emailSubject: 'test_email_subject_key',
  emailBody: 'test_email_body_key',
}

describe('FreemiumBlock', () => {
  afterEach(cleanup)

  describe('Basic Rendering', () => {
    it('renders the freemium block container', () => {
      const { container } = render(<FreemiumBlock translationKeys={TRANSLATION_KEYS} />)

      expect(container.firstChild).toBeInTheDocument()
    })

    it('renders the sparkles icon', () => {
      const { container } = render(<FreemiumBlock translationKeys={TRANSLATION_KEYS} />)

      const sparklesIcons = container.querySelectorAll('[data-test="sparkles/medium"]')

      // Should have sparkles icons (one in header, one in button)
      expect(sparklesIcons.length).toBe(2)
    })

    it('renders with external link target', () => {
      render(<FreemiumBlock translationKeys={TRANSLATION_KEYS} />)

      const link = screen.getByRole('link')

      expect(link).toHaveAttribute('target', '_blank')
    })
  })

  describe('Props Handling', () => {
    it('passes through HTML div props like data-test', () => {
      render(
        <FreemiumBlock translationKeys={TRANSLATION_KEYS} data-test="freemium-block-test-id" />,
      )

      expect(screen.getByTestId('freemium-block-test-id')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(
        <FreemiumBlock translationKeys={TRANSLATION_KEYS} className="custom-class" />,
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('renders title translation in the DOM', () => {
      render(<FreemiumBlock translationKeys={TRANSLATION_KEYS} />)

      expect(screen.getByText(TRANSLATION_KEYS.title)).toBeInTheDocument()
    })

    it('renders description translation in the DOM', () => {
      render(<FreemiumBlock translationKeys={TRANSLATION_KEYS} />)

      expect(screen.getByText(TRANSLATION_KEYS.description)).toBeInTheDocument()
    })

    it('renders mailto link with subject and body translations', () => {
      render(<FreemiumBlock translationKeys={TRANSLATION_KEYS} />)

      const link = screen.getByRole('link')

      expect(link).toHaveAttribute(
        'href',
        `mailto:hello@getlago.com?subject=${TRANSLATION_KEYS.emailSubject}&body=${TRANSLATION_KEYS.emailBody}`,
      )
    })
  })

  describe('Snapshot Tests', () => {
    it('matches snapshot with default props', () => {
      const { container } = render(<FreemiumBlock translationKeys={TRANSLATION_KEYS} />)

      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot with data-test prop', () => {
      const { container } = render(
        <FreemiumBlock translationKeys={TRANSLATION_KEYS} data-test="freemium-test" />,
      )

      expect(container.firstChild).toMatchSnapshot()
    })
  })
})
