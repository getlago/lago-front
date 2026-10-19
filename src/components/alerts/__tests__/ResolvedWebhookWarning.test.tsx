import { screen } from '@testing-library/react'

import { ResolvedWebhookWarning } from '~/components/alerts/ResolvedWebhookWarning'
import { EventTypeEnum, NotifyOnEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

const mockQuery = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetWebhookEndpointsForResolvedAlertsQuery: (...args: unknown[]) => mockQuery(...args),
}))

const thresholds = [{ value: '10', notifyOn: [NotifyOnEnum.Triggered, NotifyOnEnum.Resolved] }]

describe('ResolvedWebhookWarning query state', () => {
  it('shows a pending state until the endpoint query answers', () => {
    mockQuery.mockReturnValue({ data: undefined, loading: true })
    const { rerender } = render(<ResolvedWebhookWarning thresholds={thresholds} />)

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')

    mockQuery.mockReturnValue({
      data: { webhookEndpoints: { collection: [] } },
      loading: false,
    })
    rerender(<ResolvedWebhookWarning thresholds={thresholds} />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('does not present cached endpoint data as current while refetching', () => {
    mockQuery.mockReturnValue({
      data: {
        webhookEndpoints: {
          collection: [{ id: 'endpoint', eventTypes: [EventTypeEnum.AlertTriggered] }],
        },
      },
      loading: true,
    })
    render(<ResolvedWebhookWarning thresholds={thresholds} />)

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
  })
})
