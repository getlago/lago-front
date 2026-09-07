import { DocumentNode } from '@apollo/client'
import { act, render as rtlRender } from '@testing-library/react'

import { MainHeader } from '~/components/MainHeader/MainHeader'
import { ProviderTypeEnum } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

const providerDetails: Record<string, Record<string, unknown>> = {
  AdyenProvider: {
    apiKey: 'test-api-key',
    hmacKey: 'test-hmac-key',
    livePrefix: 'test',
    merchantAccount: 'test-merchant',
  },
  CashfreeProvider: {
    clientId: 'test-client',
    clientSecret: 'test-secret',
    successRedirectUrl: 'https://example.com/success',
  },
  MoneyhashProvider: { apiKey: 'test-api-key', flowId: 'test-flow' },
  StripeProvider: {
    secretKey: 'sk_test_fixture',
    supports3ds: false,
    requireTermsOfServiceConsent: false,
  },
}

const integrationDetails: Record<string, Record<string, unknown>> = {
  AnrokIntegration: { apiKey: 'test-api-key' },
  AvalaraIntegration: {
    accountId: 'test-account',
    companyCode: 'test-company',
    licenseKey: 'test-license',
  },
  HubspotIntegration: {
    defaultTargetedObject: 'COMPANIES',
    syncInvoices: false,
    syncSubscriptions: false,
  },
  SalesforceIntegration: { instanceId: 'test-instance' },
  NetsuiteIntegration: {
    accountId: 'test-account',
    clientId: 'test-client',
    clientSecret: 'test-secret',
    scriptEndpointUrl: 'https://example.com/script',
    syncCreditNotes: false,
    syncInvoices: false,
    syncPayments: false,
    tokenId: 'test-token',
    tokenSecret: 'test-token-secret',
  },
  XeroIntegration: {
    connectionId: 'test-connection',
    hasMappingsConfigured: false,
    syncCreditNotes: false,
    syncInvoices: false,
    syncPayments: false,
  },
}

export function createPaymentProviderListMock(
  document: DocumentNode,
  providerType: ProviderTypeEnum,
  typename: string,
  connections: Array<{ id: string; name: string; code: string }> = [
    { id: 'test-id-1', name: 'Test Connection', code: 'test-code' },
  ],
): TestMocksType {
  return [
    {
      request: {
        query: document,
        variables: { limit: 1000, type: providerType },
      },
      result: {
        data: {
          paymentProviders: {
            __typename: 'PaymentProviderCollection',
            collection: connections.map((c) => ({
              __typename: typename,
              ...providerDetails[typename],
              ...c,
            })),
          },
        },
      },
    },
  ]
}

export function createPaymentProviderListLoadingMock(
  document: DocumentNode,
  providerType: ProviderTypeEnum,
): TestMocksType {
  return [
    {
      request: {
        query: document,
        variables: { limit: 1000, type: providerType },
      },
      delay: 100000000,
      result: {
        data: {
          paymentProviders: {
            __typename: 'PaymentProviderCollection',
            collection: [],
          },
        },
      },
    },
  ]
}

export function createIntegrationListMock(
  document: DocumentNode,
  integrationType: string,
  typename: string,
  connections: Array<{ id: string; name: string; code: string }> = [
    { id: 'test-id-1', name: 'Test Connection', code: 'test-code' },
  ],
): TestMocksType {
  return [
    {
      request: {
        query: document,
        variables: { limit: 1000, types: [integrationType] },
      },
      result: {
        data: {
          integrations: {
            __typename: 'IntegrationCollection',
            collection: connections.map((c) => ({
              __typename: typename,
              ...integrationDetails[typename],
              ...c,
            })),
          },
        },
      },
    },
  ]
}

export function createIntegrationListLoadingMock(
  document: DocumentNode,
  integrationType: string,
): TestMocksType {
  return [
    {
      request: {
        query: document,
        variables: { limit: 1000, types: [integrationType] },
      },
      delay: 100000000,
      result: {
        data: {
          integrations: {
            __typename: 'IntegrationCollection',
            collection: [],
          },
        },
      },
    },
  ]
}

export async function renderIntegrationPage(
  Component: React.ComponentType,
  options?: { mocks?: TestMocksType; useParams?: Record<string, string> },
) {
  const PageWithHeader = () => (
    <>
      <MainHeader />
      <Component />
    </>
  )

  let result: ReturnType<typeof rtlRender>

  await act(() => {
    result = rtlRender(<PageWithHeader />, {
      wrapper: ({ children }) => (
        <AllTheProviders
          mocks={options?.mocks}
          useParams={options?.useParams}
          forceTypenames={true}
        >
          {children}
        </AllTheProviders>
      ),
    })
  })

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return result!
}
