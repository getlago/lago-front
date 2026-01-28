import { render, screen, waitFor } from '@testing-library/react'

import { maskValue } from '~/core/formats/maskValue'
import { GetOrganizationHmacDataDocument, GetWebhookListDocument } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { Webhooks } from '../Webhooks'

const MOCK_HMAC_KEY = 'hmac-secret-key-12345-abcde'
const MOCK_WEBHOOK_ID = 'webhook-12345'
const MOCK_WEBHOOK_URL = 'https://example.com/webhook'

const mockOrganizationHmacData = {
  request: {
    query: GetOrganizationHmacDataDocument,
  },
  result: {
    data: {
      organization: {
        __typename: 'Organization',
        id: 'org-123',
        hmacKey: MOCK_HMAC_KEY,
      },
    },
  },
}

const mockWebhookListData = {
  request: {
    query: GetWebhookListDocument,
    variables: { limit: 10 },
  },
  result: {
    data: {
      webhookEndpoints: {
        __typename: 'WebhookEndpointCollection',
        collection: [
          {
            __typename: 'WebhookEndpoint',
            id: MOCK_WEBHOOK_ID,
            webhookUrl: MOCK_WEBHOOK_URL,
            signatureAlgo: 'jwt',
          },
        ],
      },
    },
  },
}

const renderComponent = () => {
  return render(<Webhooks />, {
    wrapper: ({ children }) =>
      AllTheProviders({
        children,
        mocks: [mockOrganizationHmacData, mockWebhookListData],
        forceTypenames: true,
      }),
  })
}

describe('Webhooks', () => {
  it('should show masked HMAC key by default', async () => {
    renderComponent()

    const maskedKey = maskValue(MOCK_HMAC_KEY, { dotsCount: 8, visibleChars: 3 })

    await waitFor(() => {
      expect(screen.getByText(maskedKey)).toBeInTheDocument()
    })
  })

  it('should display webhook URL in table', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(MOCK_WEBHOOK_URL)).toBeInTheDocument()
    })
  })
})
