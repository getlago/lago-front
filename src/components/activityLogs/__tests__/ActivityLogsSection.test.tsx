import { ApolloError } from '@apollo/client'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ActivityLogsSection } from '~/components/activityLogs/ActivityLogsSection'
import { GENERIC_PLACEHOLDER_BUTTON_TEST_ID } from '~/components/designSystem/GenericPlaceholder'
import { render } from '~/test-utils'

const ACTIVITY_DESCRIPTION = 'Quote QT-2026-0042 was created'
const SUBTITLE = 'Logs reflecting this resource activity.'

const mockOpenPanel = jest.fn()
const mockSetUrl = jest.fn()

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/useDeveloperTool', () => ({
  useDeveloperTool: () => ({
    openPanel: mockOpenPanel,
    setUrl: mockSetUrl,
  }),
}))

jest.mock('~/hooks/activityLogs/useActivityLogsInformation', () => ({
  useActivityLogsInformation: () => ({
    getActivityDescription: () => ACTIVITY_DESCRIPTION,
    getResourceType: (typename: string) => typename,
  }),
}))

jest.mock('~/hooks/helpers/useFormatterDateHelper', () => ({
  useFormatterDateHelper: () => ({
    formattedDateTimeWithSecondsOrgaTZ: (date: string) => date,
  }),
}))

const activityLogs = {
  collection: [
    {
      activityId: 'activity-001',
      activityType: 'quote_created',
      activityObject: { number: 'QT-2026-0042' },
      loggedAt: '2026-08-17T10:00:00Z',
      externalCustomerId: 'ext-cust-001',
      externalSubscriptionId: null,
    },
  ],
  metadata: { currentPage: 1, totalPages: 3, totalCount: 42 },
  // The fragment type carries __typename fields the section never reads
} as any

const baseProps = {
  subtitle: SUBTITLE,
  activityLogs,
  loading: false,
  error: undefined,
  refetch: jest.fn(),
}

describe('ActivityLogsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN activity logs are loaded', () => {
    describe('WHEN the section renders', () => {
      it('THEN should render a row per log', () => {
        render(<ActivityLogsSection {...baseProps} fetchMore={jest.fn()} />)

        expect(screen.getByText(ACTIVITY_DESCRIPTION)).toBeInTheDocument()
      })

      it('THEN should render the subtitle', () => {
        render(<ActivityLogsSection {...baseProps} fetchMore={jest.fn()} />)

        expect(screen.getByText(SUBTITLE)).toBeInTheDocument()
      })

      it('THEN should render the pager', () => {
        render(<ActivityLogsSection {...baseProps} fetchMore={jest.fn()} />)

        expect(screen.getByTestId('pagination')).toBeInTheDocument()
      })
    })

    describe('WHEN a row is clicked', () => {
      it('THEN should open the developer tool on that log', async () => {
        const user = userEvent.setup()

        render(<ActivityLogsSection {...baseProps} fetchMore={jest.fn()} />)

        await user.click(screen.getByText(ACTIVITY_DESCRIPTION))

        expect(mockOpenPanel).toHaveBeenCalled()
        expect(mockSetUrl).toHaveBeenCalledWith(expect.stringContaining('activity-001'))
      })
    })
  })

  describe('GIVEN the list paginates through fetchMore', () => {
    describe('WHEN the next arrow is clicked', () => {
      it('THEN should call fetchMore with the target page', async () => {
        const user = userEvent.setup()
        const fetchMore = jest.fn()

        render(<ActivityLogsSection {...baseProps} fetchMore={fetchMore} />)

        await user.click(screen.getByRole('button', { name: 'next page' }))

        expect(fetchMore).toHaveBeenCalledWith({ variables: { page: 2 } })
      })
    })
  })

  describe('GIVEN the page lives in the URL', () => {
    describe('WHEN the next arrow is clicked', () => {
      it('THEN should call onPageChange with the target page', async () => {
        const user = userEvent.setup()
        const onPageChange = jest.fn()

        render(<ActivityLogsSection {...baseProps} onPageChange={onPageChange} />)

        await user.click(screen.getByRole('button', { name: 'next page' }))

        expect(onPageChange).toHaveBeenCalledWith(2)
      })
    })
  })

  describe('GIVEN the query failed', () => {
    describe('WHEN the section renders', () => {
      it('THEN should offer a retry that refetches', async () => {
        const user = userEvent.setup()
        const refetch = jest.fn()

        render(
          <ActivityLogsSection
            {...baseProps}
            refetch={refetch}
            error={new ApolloError({ errorMessage: 'boom' })}
            fetchMore={jest.fn()}
          />,
        )

        await user.click(screen.getByTestId(GENERIC_PLACEHOLDER_BUTTON_TEST_ID))

        expect(refetch).toHaveBeenCalled()
      })
    })
  })
})
