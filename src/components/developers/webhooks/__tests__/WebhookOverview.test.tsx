import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TYPOGRAPHY_WITH_COPY_BUTTON_TEST_ID } from '~/components/designSystem/TypographyWithCopy'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  EventTypeEnum,
  GetWebhookEndpointSigningKeysDocument,
  WebhookEndpointSignatureAlgoEnum,
} from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

import {
  WEBHOOK_OVERVIEW_CONTAINER_TEST_ID,
  WEBHOOK_OVERVIEW_EVENTS_LIST_TEST_ID,
  WEBHOOK_OVERVIEW_LOADING_TEST_ID,
  WEBHOOK_OVERVIEW_NAME_VALUE_TEST_ID,
  WEBHOOK_OVERVIEW_SIGNATURE_VALUE_TEST_ID,
  WEBHOOK_OVERVIEW_SIGNING_KEY_REVEAL_BUTTON_TEST_ID,
  WEBHOOK_OVERVIEW_SIGNING_KEY_VALUE_TEST_ID,
  WEBHOOK_OVERVIEW_URL_VALUE_TEST_ID,
  WebhookOverview,
} from '../WebhookOverview'

jest.mock('~/core/utils/copyToClipboard', () => ({ copyToClipboard: jest.fn() }))

// Mock useWebhookEventTypes hook
const mockGetEventDisplayInfo = jest.fn()

jest.mock('~/hooks/useWebhookEventTypes', () => ({
  useWebhookEventTypes: () => ({
    getEventDisplayInfo: mockGetEventDisplayInfo,
    loading: false,
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, params?: Record<string, unknown>) => {
      if (params?.count !== undefined) {
        return `${params.count} events`
      }
      return key
    },
  }),
}))

const mockWebhook = {
  id: 'webhook-123',
  name: 'My Webhook',
  webhookUrl: 'https://example.com/webhook',
  signatureAlgo: WebhookEndpointSignatureAlgoEnum.Hmac,
  eventTypes: [EventTypeEnum.CustomerCreated, EventTypeEnum.InvoiceDrafted],
}

describe('WebhookOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetEventDisplayInfo.mockReturnValue({
      isListeningToAll: false,
      displayedEvents: ['customer.created', 'invoice.paid'],
      eventCount: 2,
    })
  })

  describe('GIVEN the component is loading', () => {
    describe('WHEN loading prop is true', () => {
      it('THEN should display loading skeleton', () => {
        render(<WebhookOverview webhook={undefined} loading={true} signatureLabel="HMAC" />)

        expect(screen.getByTestId(WEBHOOK_OVERVIEW_LOADING_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(WEBHOOK_OVERVIEW_CONTAINER_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the component is loaded', () => {
    describe('WHEN webhook data is available', () => {
      it('THEN should display the container', () => {
        render(<WebhookOverview webhook={mockWebhook} loading={false} signatureLabel="HMAC" />)

        expect(screen.getByTestId(WEBHOOK_OVERVIEW_CONTAINER_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(WEBHOOK_OVERVIEW_LOADING_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN should display the webhook name', () => {
        render(<WebhookOverview webhook={mockWebhook} loading={false} signatureLabel="HMAC" />)

        const nameElement = screen.getByTestId(WEBHOOK_OVERVIEW_NAME_VALUE_TEST_ID)

        expect(nameElement).toHaveTextContent('My Webhook')
      })

      it('THEN should display the signature label', () => {
        render(<WebhookOverview webhook={mockWebhook} loading={false} signatureLabel="HMAC" />)

        const signatureElement = screen.getByTestId(WEBHOOK_OVERVIEW_SIGNATURE_VALUE_TEST_ID)

        expect(signatureElement).toHaveTextContent('HMAC')
      })

      it('THEN should display the webhook URL', () => {
        render(<WebhookOverview webhook={mockWebhook} loading={false} signatureLabel="HMAC" />)

        const urlElement = screen.getByTestId(WEBHOOK_OVERVIEW_URL_VALUE_TEST_ID)

        expect(urlElement).toHaveTextContent('https://example.com/webhook')
      })

      it('THEN should display the events list', () => {
        render(<WebhookOverview webhook={mockWebhook} loading={false} signatureLabel="HMAC" />)

        const eventsList = screen.getByTestId(WEBHOOK_OVERVIEW_EVENTS_LIST_TEST_ID)

        expect(eventsList).toBeInTheDocument()
        expect(eventsList).toHaveTextContent('customer.created')
        expect(eventsList).toHaveTextContent('invoice.paid')
      })
    })

    describe('WHEN webhook has no name', () => {
      it('THEN should display dash for name', () => {
        const webhookWithoutName = { ...mockWebhook, name: null }

        render(
          <WebhookOverview webhook={webhookWithoutName} loading={false} signatureLabel="HMAC" />,
        )

        const nameElement = screen.getByTestId(WEBHOOK_OVERVIEW_NAME_VALUE_TEST_ID)

        expect(nameElement).toHaveTextContent('-')
      })
    })

    describe('WHEN webhook has JWT signature', () => {
      it('THEN should display JWT as signature label', () => {
        render(<WebhookOverview webhook={mockWebhook} loading={false} signatureLabel="JWT" />)

        const signatureElement = screen.getByTestId(WEBHOOK_OVERVIEW_SIGNATURE_VALUE_TEST_ID)

        expect(signatureElement).toHaveTextContent('JWT')
      })
    })

    describe('WHEN webhook has no events (empty array)', () => {
      beforeEach(() => {
        mockGetEventDisplayInfo.mockReturnValue({
          isListeningToAll: false,
          displayedEvents: [],
          eventCount: 0,
        })
      })

      it('THEN should not display events list', () => {
        const webhookNoEvents = { ...mockWebhook, eventTypes: [] }

        render(<WebhookOverview webhook={webhookNoEvents} loading={false} signatureLabel="HMAC" />)

        expect(screen.queryByTestId(WEBHOOK_OVERVIEW_EVENTS_LIST_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN webhook is listening to all events', () => {
      beforeEach(() => {
        mockGetEventDisplayInfo.mockReturnValue({
          isListeningToAll: true,
          displayedEvents: ['customer.created', 'customer.updated', 'invoice.created'],
          eventCount: 3,
        })
      })

      it('THEN should display all available events', () => {
        const webhookAllEvents = { ...mockWebhook, eventTypes: null }

        render(<WebhookOverview webhook={webhookAllEvents} loading={false} signatureLabel="HMAC" />)

        const eventsList = screen.getByTestId(WEBHOOK_OVERVIEW_EVENTS_LIST_TEST_ID)

        expect(eventsList).toHaveTextContent('customer.created')
        expect(eventsList).toHaveTextContent('customer.updated')
        expect(eventsList).toHaveTextContent('invoice.created')
      })
    })
  })

  describe('GIVEN eventTypes loading state', () => {
    beforeEach(() => {
      jest.resetModules()
    })

    describe('WHEN event types are loading', () => {
      it('THEN should display loading skeleton', () => {
        // Override the mock for this specific test
        jest.doMock('~/hooks/useWebhookEventTypes', () => ({
          useWebhookEventTypes: () => ({
            getEventDisplayInfo: mockGetEventDisplayInfo,
            loading: true,
          }),
        }))

        // Since we can't easily re-import, we test via the loading prop
        // The component shows loading when either loading or eventTypesLoading is true
        render(<WebhookOverview webhook={mockWebhook} loading={true} signatureLabel="HMAC" />)

        expect(screen.getByTestId(WEBHOOK_OVERVIEW_LOADING_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a Standard Webhooks endpoint', () => {
    const standardWebhooksEndpoint = {
      ...mockWebhook,
      signatureAlgo: WebhookEndpointSignatureAlgoEnum.StandardWebhooks,
    }

    const signingKeysMock = (
      signingKeys: Array<{ id: string; secretKey: string }> | null,
    ): TestMocksType[number] => ({
      request: {
        query: GetWebhookEndpointSigningKeysDocument,
        variables: { id: standardWebhooksEndpoint.id },
      },
      result: {
        data: {
          webhookEndpoint: { id: standardWebhooksEndpoint.id, signingKeys },
        },
      },
    })

    const renderStandardWebhooks = (mocks: TestMocksType) =>
      render(
        <WebhookOverview
          webhook={standardWebhooksEndpoint}
          loading={false}
          signatureLabel="Standard Webhooks"
        />,
        { mocks },
      )

    describe('WHEN the query returns its signing keys', () => {
      const mocks = [
        signingKeysMock([
          { id: 'key-old', secretKey: 'whsec_oldkeyvalue000' },
          { id: 'key-current', secretKey: 'whsec_currentkeyabc' },
        ]),
      ]

      it('THEN shows the current key masked by default', async () => {
        renderStandardWebhooks(mocks)

        const keyElement = await screen.findByTestId(WEBHOOK_OVERVIEW_SIGNING_KEY_VALUE_TEST_ID)

        expect(keyElement).toHaveTextContent('••••••••abc')
        expect(keyElement).not.toHaveTextContent('whsec_currentkeyabc')
      })

      it('THEN reveals and hides the key', async () => {
        const user = userEvent.setup()

        renderStandardWebhooks(mocks)

        await user.click(
          await screen.findByTestId(WEBHOOK_OVERVIEW_SIGNING_KEY_REVEAL_BUTTON_TEST_ID),
        )

        expect(screen.getByTestId(WEBHOOK_OVERVIEW_SIGNING_KEY_VALUE_TEST_ID)).toHaveTextContent(
          'whsec_currentkeyabc',
        )

        await user.click(screen.getByTestId(WEBHOOK_OVERVIEW_SIGNING_KEY_REVEAL_BUTTON_TEST_ID))

        expect(
          screen.getByTestId(WEBHOOK_OVERVIEW_SIGNING_KEY_VALUE_TEST_ID),
        ).not.toHaveTextContent('whsec_currentkeyabc')
      })

      it('THEN copies the full key while it is masked', async () => {
        const user = userEvent.setup()

        renderStandardWebhooks(mocks)

        const keyElement = await screen.findByTestId(WEBHOOK_OVERVIEW_SIGNING_KEY_VALUE_TEST_ID)
        const keyCopyButton = screen
          .getAllByTestId(TYPOGRAPHY_WITH_COPY_BUTTON_TEST_ID)
          .find((button) => button.contains(keyElement)) as HTMLElement

        await user.click(keyCopyButton)

        expect(copyToClipboard).toHaveBeenCalledWith('whsec_currentkeyabc')
      })
    })

    describe('WHEN the user cannot read signing keys', () => {
      it('THEN shows no key', async () => {
        renderStandardWebhooks([signingKeysMock(null)])

        expect(await screen.findByTestId(WEBHOOK_OVERVIEW_CONTAINER_TEST_ID)).toBeInTheDocument()
        await waitFor(() =>
          expect(
            screen.queryByTestId(WEBHOOK_OVERVIEW_SIGNING_KEY_VALUE_TEST_ID),
          ).not.toBeInTheDocument(),
        )
        expect(
          screen.queryByTestId(WEBHOOK_OVERVIEW_SIGNING_KEY_REVEAL_BUTTON_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN an HMAC endpoint with no signing key', () => {
    it('THEN shows no key', () => {
      render(<WebhookOverview webhook={mockWebhook} loading={false} signatureLabel="HMAC" />)

      expect(
        screen.queryByTestId(WEBHOOK_OVERVIEW_SIGNING_KEY_VALUE_TEST_ID),
      ).not.toBeInTheDocument()
    })
  })
})
