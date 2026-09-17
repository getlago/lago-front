import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import { CreditNoteDetailsExternalSync } from '../CreditNoteDetailsExternalSync'

// A deployment that never exported APP_ENV resolves `appEnv` to `undefined`. The external
// links must then point at the LIVE Avalara dashboard, never at the sandbox one.
jest.mock('~/core/apolloClient', () => {
  const actual = jest.requireActual('~/core/apolloClient')

  return {
    ...actual,
    envGlobalVar: () => ({ appEnv: undefined }),
  }
})

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
    locale: 'en',
  }),
}))

const mockCreditNoteQuery = jest.fn()
const mockIntegrationsQuery = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetCreditNoteForDetailsExternalSyncQuery: () => mockCreditNoteQuery(),
  useGetIntegrationsListForCreditNoteDetailsExternalSyncQuery: () => mockIntegrationsQuery(),
}))

const AVALARA_INTEGRATION_ID = 'avalara-integration-1'

describe('CreditNoteDetailsExternalSync', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockCreditNoteQuery.mockReturnValue({
      data: {
        creditNote: {
          id: 'credit-note-1',
          taxProviderId: 'tax-provider-object-1',
          taxProviderSyncable: false,
          externalIntegrationId: null,
          customer: {
            anrokCustomer: null,
            avalaraCustomer: { id: 'avalara-customer-1', integrationId: AVALARA_INTEGRATION_ID },
            netsuiteCustomer: null,
            xeroCustomer: null,
          },
        },
      },
    })

    mockIntegrationsQuery.mockReturnValue({
      data: {
        integrations: {
          collection: [
            {
              __typename: 'AvalaraIntegration',
              id: AVALARA_INTEGRATION_ID,
              accountId: 'account-1',
              companyId: 'company-1',
            },
          ],
        },
      },
    })
  })

  describe('GIVEN a credit note synced with Avalara', () => {
    describe('WHEN appEnv is undefined because the deployment did not set APP_ENV', () => {
      it('THEN should link to the live Avalara dashboard', () => {
        render(<CreditNoteDetailsExternalSync retryTaxSync={jest.fn()} />, {
          useParams: { customerId: 'customer-1', creditNoteId: 'credit-note-1' },
        })

        const link = screen.getByText('tax-provider-object-1').closest('a')

        expect(link).toHaveAttribute(
          'href',
          'https://admin.avalara.com/cup/a/account-1/c/company-1/transactions/tax-provider-object-1',
        )
      })

      it('THEN should not link to the sandbox Avalara dashboard', () => {
        render(<CreditNoteDetailsExternalSync retryTaxSync={jest.fn()} />, {
          useParams: { customerId: 'customer-1', creditNoteId: 'credit-note-1' },
        })

        const link = screen.getByText('tax-provider-object-1').closest('a')

        expect(link?.getAttribute('href')).not.toContain('sandbox.')
      })
    })
  })
})
