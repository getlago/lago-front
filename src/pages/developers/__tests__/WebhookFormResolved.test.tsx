import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  EventCategoryEnum,
  EventTypeEnum,
  EventTypesQuery,
  WebhookEndpointSignatureAlgoEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import WebhookForm, { WEBHOOK_FORM_SUBMIT_BUTTON_TEST_ID } from '../WebhookForm'

// useVirtualizer needs layout measurements that jsdom does not provide.
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({
    count,
    estimateSize,
  }: {
    count: number
    estimateSize: (index: number) => number
  }) => ({
    getTotalSize: () => count * 100,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        key: index,
        start: index * 100,
        size: estimateSize(index),
      })),
    measureElement: jest.fn(),
    measure: jest.fn(),
  }),
}))

const mockUpdate = jest.fn()
let mockEndpointEventTypes = [EventTypeEnum.AlertTriggered]
const mockCatalog: EventTypesQuery = {
  eventTypes: [
    {
      key: EventTypeEnum.AlertTriggered,
      name: 'alert.triggered',
      description: 'An alert threshold is crossed',
      category: EventCategoryEnum.Alerts,
      deprecated: false,
    },
    {
      key: EventTypeEnum.AlertResolved,
      name: 'alert.resolved',
      description: 'One or more thresholds defined in the alert are no longer crossed',
      category: EventCategoryEnum.Alerts,
      deprecated: false,
    },
    {
      key: EventTypeEnum.CustomerCreated,
      name: 'customer.created',
      description: 'Customer created',
      category: EventCategoryEnum.Customers,
      deprecated: false,
    },
  ],
}

jest.mock('~/hooks/useDeveloperTool', () => ({
  useDeveloperTool: () => ({ panelOpen: false, openPanel: jest.fn(), closePanel: jest.fn() }),
}))
jest.mock('~/hooks/core/useLocationHistory', () => ({
  useLocationHistory: () => ({ goBack: jest.fn() }),
}))
jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useEventTypesQuery: () => ({ data: mockCatalog, loading: false }),
  useGetWebhookEndpointQuery: () => ({
    data: {
      webhookEndpoint: {
        id: 'endpoint',
        name: 'Billing',
        webhookUrl: 'https://example.com/hooks',
        signatureAlgo:
          jest.requireActual('~/generated/graphql').WebhookEndpointSignatureAlgoEnum.Hmac,
        eventTypes: mockEndpointEventTypes,
      },
    },
    loading: false,
  }),
  useCreateWebhookEndpointMutation: () => [jest.fn()],
  useUpdateWebhookEndpointMutation: () => [mockUpdate],
}))

describe('resolution event in the real webhook picker', () => {
  it('uses the server label and description, counts and searches it, and saves it explicitly', async () => {
    mockUpdate.mockResolvedValue({ data: { updateWebhookEndpoint: { id: 'endpoint' } } })
    const user = userEvent.setup()
    const { unmount } = render(<WebhookForm />, { useParams: { webhookId: 'endpoint' } })

    expect(screen.getByText('Alerts')).toBeInTheDocument()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox')[1]).toHaveAttribute('aria-checked', 'mixed')
    const search = await screen.findByPlaceholderText(/search/i)
    await user.type(search, 'alert.resolved')

    expect(await screen.findByText('alert.resolved')).toBeInTheDocument()
    expect(screen.getByText(mockCatalog.eventTypes[1].description)).toBeInTheDocument()
    expect(screen.queryByText('alert.triggered')).not.toBeInTheDocument()
    const checkbox = document.querySelector('input[aria-labelledby$="alert_resolved"]')
    if (!checkbox) throw new Error('Missing resolution checkbox')
    await user.click(checkbox)
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox')[1]).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByTestId(WEBHOOK_FORM_SUBMIT_BUTTON_TEST_ID))

    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith({
        variables: {
          input: {
            id: 'endpoint',
            name: 'Billing',
            webhookUrl: 'https://example.com/hooks',
            signatureAlgo: WebhookEndpointSignatureAlgoEnum.Hmac,
            eventTypes: [EventTypeEnum.AlertTriggered, EventTypeEnum.AlertResolved],
          },
        },
      }),
    )
    mockEndpointEventTypes = [EventTypeEnum.AlertTriggered, EventTypeEnum.AlertResolved]
    unmount()
    render(<WebhookForm />, { useParams: { webhookId: 'endpoint' } })
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
  })
})
