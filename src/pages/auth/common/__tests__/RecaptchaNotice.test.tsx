import { screen } from '@testing-library/react'

import { envGlobalVar, initializeTranslations } from '~/core/apolloClient'
import { render } from '~/test-utils'

import { RecaptchaNotice } from '../RecaptchaNotice'

jest.mock('~/core/apolloClient', () => {
  const actual = jest.requireActual<typeof import('~/core/apolloClient')>('~/core/apolloClient')

  return { ...actual, envGlobalVar: jest.fn(actual.envGlobalVar) }
})

const mockedEnvGlobalVar = jest.mocked(envGlobalVar)

const NOTICE_START = /^This site is protected by reCAPTCHA/
const GOOGLE_PRIVACY_POLICY_URL = 'https://policies.google.com/privacy'
const GOOGLE_TERMS_URL = 'https://policies.google.com/terms'

const mockSiteKey = (recaptchaSiteKey: string): void => {
  const actual = jest.requireActual<typeof import('~/core/apolloClient')>('~/core/apolloClient')

  mockedEnvGlobalVar.mockReturnValue({ ...actual.envGlobalVar(), recaptchaSiteKey })
}

describe('RecaptchaNotice', () => {
  beforeAll(async () => {
    await initializeTranslations()
  })

  describe('GIVEN a reCAPTCHA site key is configured', () => {
    beforeEach(() => {
      mockSiteKey('site-key')
    })

    describe('WHEN it renders', () => {
      it('THEN should show the notice', () => {
        render(<RecaptchaNotice />)

        expect(screen.getByText(NOTICE_START)).toBeInTheDocument()
      })

      it.each([
        ['privacy policy', GOOGLE_PRIVACY_POLICY_URL],
        ['terms of service', GOOGLE_TERMS_URL],
      ])('THEN should link the Google %s', (_, url) => {
        render(<RecaptchaNotice />)

        expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toContain(url)
      })
    })
  })

  describe('GIVEN no reCAPTCHA site key is configured', () => {
    beforeEach(() => {
      mockSiteKey('')
    })

    describe('WHEN it renders', () => {
      it('THEN should render nothing', () => {
        render(<RecaptchaNotice />)

        expect(screen.queryByText(NOTICE_START)).not.toBeInTheDocument()
      })
    })
  })
})
