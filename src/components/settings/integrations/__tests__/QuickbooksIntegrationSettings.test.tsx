import { cleanup, screen } from '@testing-library/react'

import { renderIntegrationPage } from '~/pages/settings/__tests__/integrationTestHelpers'

import QuickbooksIntegrationSettings from '../QuickbooksIntegrationSettings'

jest.mock('@nangohq/frontend', () => ({
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('~/components/settings/integrations/AddQuickbooksDialog', () => ({
  useAddQuickbooksDialog: () => ({ openAddQuickbooksDialog: jest.fn() }),
}))

// Identity translate so rows are asserted by their message keys.
jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const mockQueryResult = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetQuickbooksIntegrationsSettingsQuery: (...args: unknown[]) => mockQueryResult(...args),
}))

const SANDBOX_LABEL = 'text_1794221187063c6xcfwvtt6l'
const PRODUCTION_LABEL = 'text_17954342416893m90kxj9h0j'

const integration = (sandbox: boolean) => ({
  data: {
    integration: {
      __typename: 'QuickbooksIntegration',
      id: 'test-id',
      name: 'Test Integration',
      code: 'test_integration',
      connectionId: 'quickbooks-conn-123',
      realmId: '9341455839042337',
      sandbox,
      syncCreditNotes: false,
      syncInvoices: true,
      syncPayments: false,
    },
    integrations: { __typename: 'IntegrationCollection', collection: [] },
  },
  loading: false,
})

describe('QuickbooksIntegrationSettings', () => {
  afterEach(cleanup)

  describe('GIVEN a sandbox connection', () => {
    it('THEN shows the sandbox environment and the company id', async () => {
      mockQueryResult.mockReturnValue(integration(true))

      await renderIntegrationPage(QuickbooksIntegrationSettings, {
        useParams: { integrationId: 'test-id' },
      })

      expect(screen.getByText(SANDBOX_LABEL)).toBeInTheDocument()
      expect(screen.queryByText(PRODUCTION_LABEL)).not.toBeInTheDocument()
      expect(screen.getByText('9341455839042337')).toBeInTheDocument()
    })
  })

  describe('GIVEN a production connection', () => {
    it('THEN shows the production environment', async () => {
      mockQueryResult.mockReturnValue(integration(false))

      await renderIntegrationPage(QuickbooksIntegrationSettings, {
        useParams: { integrationId: 'test-id' },
      })

      expect(screen.getByText(PRODUCTION_LABEL)).toBeInTheDocument()
      expect(screen.queryByText(SANDBOX_LABEL)).not.toBeInTheDocument()
    })
  })
})
