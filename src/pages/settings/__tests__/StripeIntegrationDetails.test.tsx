import { cleanup, screen, waitFor } from '@testing-library/react'

import { ENTITY_SECTION_VIEW_NAME_TEST_ID } from '~/components/MainHeader/mainHeaderTestIds'

import { renderIntegrationPage } from './integrationTestHelpers'

import StripeIntegrationDetails from '../StripeIntegrationDetails'

const CONSENT_COLLECTION_LABEL_KEY = 'text_1784801513985pk4c5o9i14q'
const YES_VALUE_KEY = 'text_1764160009979jzn4xunn1z8'
const NO_VALUE_KEY = 'text_176416000997957yqelmt2m2'

jest.mock('~/components/settings/integrations/AddStripeDialog', () => ({
  useAddStripeDialog: () => ({ openAddStripeDialog: jest.fn() }),
}))
jest.mock('~/components/settings/integrations/DeleteStripeIntegrationDialog', () => ({
  useDeleteStripeIntegrationDialog: () => ({ openDeleteStripeIntegrationDialog: jest.fn() }),
}))
jest.mock('~/components/settings/integrations/SuccessRedirectUrlDialogs', () => ({
  useAddEditSuccessRedirectUrlDialog: () => ({ openAddEditSuccessRedirectUrlDialog: jest.fn() }),
  useDeleteSuccessRedirectUrlDialog: () => ({ openDeleteSuccessRedirectUrlDialog: jest.fn() }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const mockQueryResult = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetStripeIntegrationsDetailsQuery: (...args: unknown[]) => mockQueryResult(...args),
}))

const buildQueryResult = (requireTermsOfServiceConsent: boolean | null) => ({
  data: {
    paymentProvider: {
      __typename: 'StripeProvider',
      id: 'test-id',
      name: 'Test Integration',
      code: 'test-code',
      secretKey: 'sk_****1234',
      successRedirectUrl: null,
      supports3ds: false,
      requireTermsOfServiceConsent,
    },
    paymentProviders: { __typename: 'PaymentProviderCollection', collection: [] },
  },
  loading: false,
})

describe('StripeIntegrationDetails', () => {
  afterEach(cleanup)

  describe('GIVEN the page is rendered with data', () => {
    it('THEN renders integration name in header when loaded', async () => {
      mockQueryResult.mockReturnValue(buildQueryResult(false))

      await renderIntegrationPage(StripeIntegrationDetails, {
        useParams: { integrationId: 'test-id' },
      })

      await waitFor(() => {
        const viewName = screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)

        expect(viewName[0]).toHaveTextContent('Test Integration')
      })
    })

    describe('WHEN the provider has consent collection enabled', () => {
      it('THEN renders the consent collection item with a positive value', async () => {
        mockQueryResult.mockReturnValue(buildQueryResult(true))

        await renderIntegrationPage(StripeIntegrationDetails, {
          useParams: { integrationId: 'test-id' },
        })

        const consentLabel = screen.getByText(CONSENT_COLLECTION_LABEL_KEY)

        expect(consentLabel.parentElement).toHaveTextContent(YES_VALUE_KEY)
      })
    })

    describe('WHEN the provider has consent collection disabled', () => {
      it('THEN renders the consent collection item with a negative value', async () => {
        mockQueryResult.mockReturnValue(buildQueryResult(false))

        await renderIntegrationPage(StripeIntegrationDetails, {
          useParams: { integrationId: 'test-id' },
        })

        const consentLabel = screen.getByText(CONSENT_COLLECTION_LABEL_KEY)

        expect(consentLabel.parentElement).toHaveTextContent(NO_VALUE_KEY)
      })
    })
  })

  describe('GIVEN the page is loading', () => {
    it('THEN renders loading state', async () => {
      mockQueryResult.mockReturnValue({ data: undefined, loading: true })

      const { container } = await renderIntegrationPage(StripeIntegrationDetails, {
        useParams: { integrationId: 'test-id' },
      })

      expect(screen.queryByText('Test Integration')).not.toBeInTheDocument()
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    })
  })
})
