import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { envGlobalVar, initializeTranslations } from '~/core/apolloClient'
import { LOGIN_ROUTE } from '~/core/router'
import { render } from '~/test-utils'

import SelfServeSignUp from '../SelfServeSignUp'
import {
  SELF_SERVE_SIGNUP_DATA_REGION_TEST_ID,
  SIGNUP_SUBMIT_BUTTON_TEST_ID,
} from '../signUpTestIds'

type EnvGlobal = ReturnType<typeof envGlobalVar>

jest.mock('~/core/apolloClient', () => {
  const actual = jest.requireActual<typeof import('~/core/apolloClient')>('~/core/apolloClient')

  return { ...actual, envGlobalVar: jest.fn(actual.envGlobalVar) }
})

// jsdom never lays out the popper's scroll container, so options render only with this.
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: (config: { count: number; estimateSize: (index: number) => number }) => ({
    getVirtualItems: () =>
      Array.from({ length: config.count }, (_, index) => ({
        index,
        key: index,
        size: config.estimateSize(index),
        start: index * config.estimateSize(index),
      })),
    getTotalSize: () => config.count * config.estimateSize(0),
    scrollToIndex: jest.fn(),
    measureElement: jest.fn(),
  }),
}))

const mockedEnvGlobalVar = jest.mocked(envGlobalVar)

const TERMS_OF_SERVICE_URL = 'https://www.getlago.com/company/terms-of-service'
const PRIVACY_POLICY_URL = 'https://www.getlago.com/company/privacy-policy'

const PAGE_ORIGIN = window.location.origin
const US_FRONT_URL = 'https://app.getlago.com/'
const EU_FRONT_URL = 'https://app.eu.getlago.com/'
const US_SIGN_UP_URL = 'https://app.getlago.com/sign-up'
const EU_SIGN_UP_URL = 'https://app.eu.getlago.com/sign-up'

const UNITED_STATES = 'United States'
const EUROPEAN_UNION = 'European Union'

const mockRegionFrontUrls = ({
  usFrontUrl,
  euFrontUrl,
}: Pick<EnvGlobal, 'usFrontUrl' | 'euFrontUrl'>): void => {
  const realEnv = jest
    .requireActual<typeof import('~/core/apolloClient')>('~/core/apolloClient')
    .envGlobalVar()

  mockedEnvGlobalVar.mockReturnValue({ ...realEnv, usFrontUrl, euFrontUrl })
}

// jsdom makes window.location.assign read-only, so the spy goes on the object it delegates to
const spyOnLocationAssign = (): jest.SpyInstance => {
  const implSymbol = Object.getOwnPropertySymbols(window.location).find(
    (symbol) => symbol.description === 'impl',
  ) as symbol
  const locationImpl = (window.location as unknown as Record<symbol, Pick<Location, 'assign'>>)[
    implSymbol
  ]

  return jest.spyOn(locationImpl, 'assign').mockImplementation(() => undefined)
}

const getLinksTo = (href: string): HTMLElement[] =>
  screen.getAllByRole('link').filter((link) => link.getAttribute('href') === href)

const getRegionInput = (): HTMLInputElement =>
  within(screen.getByTestId(SELF_SERVE_SIGNUP_DATA_REGION_TEST_ID)).getByRole(
    'combobox',
  ) as HTMLInputElement

const pickRegion = async (regionLabel: string): Promise<void> => {
  const user = userEvent.setup()

  await user.click(getRegionInput())

  const options = await screen.findAllByRole('option')

  await user.click(options.find((option) => option.textContent === regionLabel) as HTMLElement)
}

describe('SelfServeSignUp', () => {
  let assignSpy: jest.SpyInstance

  beforeAll(async () => {
    await initializeTranslations()
  })

  beforeEach(() => {
    assignSpy = spyOnLocationAssign()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN the self-serve sign-up page is rendered', () => {
    beforeEach(() => {
      mockRegionFrontUrls({ usFrontUrl: '', euFrontUrl: '' })
    })

    describe('WHEN it shows the first step', () => {
      it('THEN should display the welcome title', () => {
        render(<SelfServeSignUp />)

        expect(screen.getByText('Welcome to Lago')).toBeInTheDocument()
      })

      it.each([
        ['terms of service', TERMS_OF_SERVICE_URL],
        ['privacy policy', PRIVACY_POLICY_URL],
      ])('THEN should link to the %s in a new tab', (_, url) => {
        render(<SelfServeSignUp />)

        const links = getLinksTo(url)

        expect(links).toHaveLength(1)
        expect(links[0]).toHaveAttribute('target', '_blank')
      })

      it('THEN should link to the login page', () => {
        render(<SelfServeSignUp />)

        expect(getLinksTo(LOGIN_ROUTE)).toHaveLength(1)
      })
    })

    describe('WHEN looking for the sign-up form', () => {
      it('THEN should not render the legacy submit button', () => {
        render(<SelfServeSignUp />)

        expect(screen.queryByTestId(SIGNUP_SUBMIT_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN should not render any input', () => {
        const { container } = render(<SelfServeSignUp />)

        expect(container.querySelector('input')).toBeNull()
      })
    })
  })

  describe('GIVEN a region front URL is missing or invalid', () => {
    it.each([
      ['the US front URL is missing', '', EU_FRONT_URL],
      ['the EU front URL is missing', US_FRONT_URL, ''],
      ['both front URLs are missing', '', ''],
      ['the US front URL has no scheme', 'app.getlago.com', EU_FRONT_URL],
      ['the EU front URL is not a URL', US_FRONT_URL, 'not a url'],
    ])('THEN should not render the data region select when %s', (_, usFrontUrl, euFrontUrl) => {
      mockRegionFrontUrls({ usFrontUrl, euFrontUrl })

      render(<SelfServeSignUp />)

      expect(screen.queryByTestId(SELF_SERVE_SIGNUP_DATA_REGION_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN both region front URLs are valid', () => {
    describe('WHEN the select is opened', () => {
      it('THEN should list the European Union then the United States', async () => {
        mockRegionFrontUrls({ usFrontUrl: US_FRONT_URL, euFrontUrl: EU_FRONT_URL })

        render(<SelfServeSignUp />)

        await userEvent.setup().click(getRegionInput())

        const options = await screen.findAllByRole('option')

        expect(options.map((option) => option.textContent)).toEqual([EUROPEAN_UNION, UNITED_STATES])
      })
    })

    describe('WHEN detecting the current region from the page origin', () => {
      it.each([
        {
          origin: 'the US front',
          usFrontUrl: PAGE_ORIGIN,
          euFrontUrl: EU_FRONT_URL,
          selectedRegion: UNITED_STATES,
        },
        {
          origin: 'the EU front',
          usFrontUrl: US_FRONT_URL,
          euFrontUrl: PAGE_ORIGIN,
          selectedRegion: EUROPEAN_UNION,
        },
        {
          origin: 'the EU front configured with a trailing path',
          usFrontUrl: US_FRONT_URL,
          euFrontUrl: `${PAGE_ORIGIN}/sign-up`,
          selectedRegion: EUROPEAN_UNION,
        },
        {
          origin: 'neither front',
          usFrontUrl: US_FRONT_URL,
          euFrontUrl: EU_FRONT_URL,
          selectedRegion: UNITED_STATES,
        },
      ])(
        'THEN should select $selectedRegion when the page is served from $origin',
        ({ usFrontUrl, euFrontUrl, selectedRegion }) => {
          mockRegionFrontUrls({ usFrontUrl, euFrontUrl })

          render(<SelfServeSignUp />)

          expect(getRegionInput()).toHaveValue(selectedRegion)
        },
      )
    })
  })

  describe('GIVEN the page is served from the US front', () => {
    beforeEach(() => {
      mockRegionFrontUrls({ usFrontUrl: PAGE_ORIGIN, euFrontUrl: EU_FRONT_URL })
    })

    describe('WHEN picking the European Union', () => {
      it('THEN should open the EU sign-up page', async () => {
        render(<SelfServeSignUp />)

        await pickRegion(EUROPEAN_UNION)

        expect(assignSpy).toHaveBeenCalledTimes(1)
        expect(assignSpy).toHaveBeenCalledWith(EU_SIGN_UP_URL)
      })
    })

    describe('WHEN picking the United States', () => {
      it('THEN should stay on the current page', async () => {
        render(<SelfServeSignUp />)

        await pickRegion(UNITED_STATES)

        expect(assignSpy).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the page is served from the EU front', () => {
    beforeEach(() => {
      mockRegionFrontUrls({ usFrontUrl: US_FRONT_URL, euFrontUrl: PAGE_ORIGIN })
    })

    describe('WHEN picking the United States', () => {
      it('THEN should open the US sign-up page', async () => {
        render(<SelfServeSignUp />)

        await pickRegion(UNITED_STATES)

        expect(assignSpy).toHaveBeenCalledTimes(1)
        expect(assignSpy).toHaveBeenCalledWith(US_SIGN_UP_URL)
      })
    })

    describe('WHEN picking the European Union', () => {
      it('THEN should stay on the current page', async () => {
        render(<SelfServeSignUp />)

        await pickRegion(EUROPEAN_UNION)

        expect(assignSpy).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the page is served from neither region front', () => {
    beforeEach(() => {
      mockRegionFrontUrls({ usFrontUrl: US_FRONT_URL, euFrontUrl: EU_FRONT_URL })
    })

    describe('WHEN picking the European Union', () => {
      it('THEN should open the EU sign-up page', async () => {
        render(<SelfServeSignUp />)

        await pickRegion(EUROPEAN_UNION)

        expect(assignSpy).toHaveBeenCalledTimes(1)
        expect(assignSpy).toHaveBeenCalledWith(EU_SIGN_UP_URL)
      })
    })

    describe('WHEN picking the default United States', () => {
      it('THEN should stay on the current page', async () => {
        render(<SelfServeSignUp />)

        await pickRegion(UNITED_STATES)

        expect(assignSpy).not.toHaveBeenCalled()
      })
    })
  })
})
