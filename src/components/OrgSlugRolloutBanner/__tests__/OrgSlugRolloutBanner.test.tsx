import { fireEvent, render, screen } from '@testing-library/react'

import { getItemFromLS, setItemFromLS } from '~/core/apolloClient/cacheUtils'
import { orgSlugOverridesVar } from '~/core/apolloClient/reactiveVars'
import { envGlobalVar } from '~/core/apolloClient/reactiveVars/envGlobalVar'
import { AppEnvEnum } from '~/core/constants/globalTypes'
import { ORG_SLUG_BANNER_DISMISSED_LS_KEY } from '~/core/constants/localStorageKeys'
import { GENERAL_SETTINGS_ROUTE } from '~/core/router'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

import {
  ORG_SLUG_ROLLOUT_BANNER_CLOUD_VARIANT,
  ORG_SLUG_ROLLOUT_BANNER_DISMISS_TEST_ID,
  ORG_SLUG_ROLLOUT_BANNER_SELFHOSTED_VARIANT,
  ORG_SLUG_ROLLOUT_BANNER_TEST_ID,
  OrgSlugRolloutBanner,
} from '../OrgSlugRolloutBanner'

jest.mock('~/core/apolloClient/reactiveVars/envGlobalVar', () => ({
  envGlobalVar: jest.fn(() => ({
    disablePdfGeneration: false,
    appEnv: 'production',
    apiUrl: 'https://api.getlago.com',
    lagoOauthProxyUrl: '',
    disableSignUp: false,
    appVersion: 'test',
    sentryDsn: '',
    nangoPublicKey: '',
    lagoSupersetUrl: '',
  })),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: jest.fn(),
}))

jest.mock('~/core/apolloClient/cacheUtils', () => ({
  getItemFromLS: jest.fn(() => undefined),
  setItemFromLS: jest.fn(),
}))

const mockedEnvGlobalVar = envGlobalVar as jest.MockedFunction<typeof envGlobalVar>
const mockedUseCurrentUser = useCurrentUser as jest.MockedFunction<typeof useCurrentUser>
const mockedGetItemFromLS = getItemFromLS as jest.MockedFunction<typeof getItemFromLS>
const mockedSetItemFromLS = setItemFromLS as jest.MockedFunction<typeof setItemFromLS>

const baseEnv = {
  disablePdfGeneration: false,
  appEnv: AppEnvEnum.production,
  apiUrl: 'https://api.getlago.com',
  lagoOauthProxyUrl: '',
  disableSignUp: false,
  appVersion: 'test',
  sentryDsn: '',
  nangoPublicKey: '',
  lagoSupersetUrl: '',
}

const setOrganization = (organization: { id?: string; slug?: string | null } | undefined) => {
  mockedUseCurrentUser.mockReturnValue({
    currentMembership: organization
      ? ({
          organization: { id: 'org-id-default', ...organization } as never,
        } as never)
      : undefined,
    refetchCurrentUserInfos: jest.fn(),
  } as never)
}

const renderBanner = () => render(<OrgSlugRolloutBanner />, { wrapper: AllTheProviders })

describe('OrgSlugRolloutBanner', () => {
  beforeEach(() => {
    setOrganization({ slug: 'acme' })
    mockedGetItemFromLS.mockReturnValue(undefined)
    // Reset the reactive var between tests — it's a module-level singleton
    // that would otherwise leak overrides across cases.
    orgSlugOverridesVar({})
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders the Cloud variant on *.getlago.com', () => {
    mockedEnvGlobalVar.mockReturnValue({
      ...baseEnv,
      apiUrl: 'https://api.getlago.com',
      appEnv: AppEnvEnum.production,
    })

    renderBanner()

    const banner = screen.getByTestId(ORG_SLUG_ROLLOUT_BANNER_TEST_ID)

    expect(banner).toBeInTheDocument()
    expect(banner).toHaveAttribute('data-variant', ORG_SLUG_ROLLOUT_BANNER_CLOUD_VARIANT)
  })

  it('renders the Cloud variant on staging (api.staging.getlago.com)', () => {
    mockedEnvGlobalVar.mockReturnValue({
      ...baseEnv,
      apiUrl: 'https://api.staging.getlago.com',
      appEnv: AppEnvEnum.staging,
    })

    renderBanner()

    expect(screen.getByTestId(ORG_SLUG_ROLLOUT_BANNER_TEST_ID)).toHaveAttribute(
      'data-variant',
      ORG_SLUG_ROLLOUT_BANNER_CLOUD_VARIANT,
    )
  })

  it('renders the Cloud variant in local dev regardless of apiUrl', () => {
    mockedEnvGlobalVar.mockReturnValue({
      ...baseEnv,
      apiUrl: 'http://localhost:3000/api',
      appEnv: AppEnvEnum.development,
    })

    renderBanner()

    expect(screen.getByTestId(ORG_SLUG_ROLLOUT_BANNER_TEST_ID)).toHaveAttribute(
      'data-variant',
      ORG_SLUG_ROLLOUT_BANNER_CLOUD_VARIANT,
    )
  })

  it('renders the self-hosted variant for custom apiUrl in non-dev environments', () => {
    mockedEnvGlobalVar.mockReturnValue({
      ...baseEnv,
      apiUrl: 'https://billing.acme-corp.io/api',
      appEnv: AppEnvEnum.production,
    })

    renderBanner()

    expect(screen.getByTestId(ORG_SLUG_ROLLOUT_BANNER_TEST_ID)).toHaveAttribute(
      'data-variant',
      ORG_SLUG_ROLLOUT_BANNER_SELFHOSTED_VARIANT,
    )
  })

  it('returns null when organization.slug is undefined (safety net)', () => {
    setOrganization({ slug: undefined })
    mockedEnvGlobalVar.mockReturnValue(baseEnv)

    renderBanner()

    expect(screen.queryByTestId(ORG_SLUG_ROLLOUT_BANNER_TEST_ID)).not.toBeInTheDocument()
  })

  it('returns null when organization.slug is empty string (safety net)', () => {
    setOrganization({ slug: '' })
    mockedEnvGlobalVar.mockReturnValue(baseEnv)

    renderBanner()

    expect(screen.queryByTestId(ORG_SLUG_ROLLOUT_BANNER_TEST_ID)).not.toBeInTheDocument()
  })

  it('interpolates the real organization slug into the description copy', () => {
    setOrganization({ slug: 'rocket' })
    mockedEnvGlobalVar.mockReturnValue(baseEnv)

    renderBanner()

    expect(screen.getByText(/\/rocket\/customers/)).toBeInTheDocument()
  })

  it('CTA navigates to GENERAL_SETTINGS_ROUTE on click', () => {
    mockedEnvGlobalVar.mockReturnValue(baseEnv)

    renderBanner()

    const cta = screen.getByRole('button', { name: /edit your slug/i })

    fireEvent.click(cta)

    expect(testMockNavigateFn).toHaveBeenCalledWith(GENERAL_SETTINGS_ROUTE)
  })

  it('renders the dismiss X button when the banner is visible', () => {
    mockedEnvGlobalVar.mockReturnValue(baseEnv)

    renderBanner()

    expect(screen.getByTestId(ORG_SLUG_ROLLOUT_BANNER_DISMISS_TEST_ID)).toBeInTheDocument()
  })

  it('persists dismissal in localStorage scoped to the current org id when X is clicked', () => {
    setOrganization({ id: 'org-1', slug: 'acme' })
    mockedEnvGlobalVar.mockReturnValue(baseEnv)

    renderBanner()

    fireEvent.click(screen.getByTestId(ORG_SLUG_ROLLOUT_BANNER_DISMISS_TEST_ID))

    expect(mockedSetItemFromLS).toHaveBeenCalledWith(ORG_SLUG_BANNER_DISMISSED_LS_KEY, {
      'org-1': true,
    })
    expect(screen.queryByTestId(ORG_SLUG_ROLLOUT_BANNER_TEST_ID)).not.toBeInTheDocument()
  })

  it('returns null on mount when the current org id is in the dismissed map', () => {
    setOrganization({ id: 'org-1', slug: 'acme' })
    mockedEnvGlobalVar.mockReturnValue(baseEnv)
    mockedGetItemFromLS.mockReturnValue({ 'org-1': true })

    renderBanner()

    expect(screen.queryByTestId(ORG_SLUG_ROLLOUT_BANNER_TEST_ID)).not.toBeInTheDocument()
    expect(mockedGetItemFromLS).toHaveBeenCalledWith(ORG_SLUG_BANNER_DISMISSED_LS_KEY)
  })

  it('still renders the banner when a different org id is dismissed (per-org dismiss)', () => {
    setOrganization({ id: 'org-1', slug: 'acme' })
    mockedEnvGlobalVar.mockReturnValue(baseEnv)
    // Only "org-2" was dismissed previously, not "org-1".
    mockedGetItemFromLS.mockReturnValue({ 'org-2': true })

    renderBanner()

    expect(screen.getByTestId(ORG_SLUG_ROLLOUT_BANNER_TEST_ID)).toBeInTheDocument()
  })

  it('returns null on full-screen create / edit pages (e.g. /customer/create)', () => {
    mockedEnvGlobalVar.mockReturnValue(baseEnv)
    window.history.pushState({}, '', '/customer/create')

    renderBanner()

    expect(screen.queryByTestId(ORG_SLUG_ROLLOUT_BANNER_TEST_ID)).not.toBeInTheDocument()

    // Reset for subsequent tests
    window.history.pushState({}, '', '/')
  })
})
