import { fireEvent, render, screen } from '@testing-library/react'

import { envGlobalVar } from '~/core/apolloClient/reactiveVars/envGlobalVar'
import { AppEnvEnum } from '~/core/constants/globalTypes'
import { GENERAL_SETTINGS_ROUTE } from '~/core/router'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

import {
  ORG_SLUG_ROLLOUT_BANNER_CLOUD_VARIANT,
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

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: jest.fn(),
}))

const mockedEnvGlobalVar = envGlobalVar as jest.MockedFunction<typeof envGlobalVar>
const mockedUseOrganizationInfos = useOrganizationInfos as jest.MockedFunction<
  typeof useOrganizationInfos
>

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

const setOrganization = (organization: { slug?: string | null } | undefined) => {
  mockedUseOrganizationInfos.mockReturnValue({
    organization: organization as never,
  } as never)
}

const renderBanner = () => render(<OrgSlugRolloutBanner />, { wrapper: AllTheProviders })

describe('OrgSlugRolloutBanner', () => {
  beforeEach(() => {
    setOrganization({ slug: 'acme' })
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

  it('interpolates the slug into the description copy', () => {
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
})
