import { screen } from '@testing-library/react'

import { MainHeaderConfig } from '~/components/MainHeader/types'
import { render } from '~/test-utils'

import SubscriptionsPage from '../SubscriptionsPage'

let capturedConfig: MainHeaderConfig | null = null

jest.mock('~/components/MainHeader/MainHeader', () => ({
  MainHeader: Object.assign(() => null, {
    Configure: (props: MainHeaderConfig) => {
      capturedConfig = props
      return null
    },
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockDebouncedSearch = jest.fn()

jest.mock('~/hooks/useDebouncedSearch', () => ({
  useDebouncedSearch: () => ({
    debouncedSearch: mockDebouncedSearch,
    isLoading: false,
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetSubscriptionsListLazyQuery: () => [
    jest.fn(),
    {
      data: {
        subscriptions: {
          metadata: { currentPage: 1, totalPages: 1, totalCount: 0 },
          collection: [],
        },
      },
      loading: false,
      error: null,
      fetchMore: jest.fn(),
      variables: {},
    },
  ],
}))

jest.mock('~/components/subscriptions/SubscriptionsList', () => ({
  SubscriptionsList: (props: { name: string }) => (
    <div data-test="subscriptions-list-mock">{props.name}</div>
  ),
}))

jest.mock('~/components/designSystem/InfiniteScroll', () => ({
  InfiniteScroll: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('SubscriptionsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedConfig = null
  })

  describe('GIVEN the page is rendered', () => {
    describe('WHEN in default state', () => {
      it('THEN should render the SubscriptionsList component', () => {
        render(<SubscriptionsPage />)

        expect(screen.getByTestId('subscriptions-list-mock')).toBeInTheDocument()
      })

      it('THEN should configure MainHeader with entity viewName', () => {
        render(<SubscriptionsPage />)

        expect(capturedConfig?.entity?.viewName).toBe('text_6250304370f0f700a8fdc28d')
      })

      it('THEN should configure MainHeader with a filtersSection', () => {
        render(<SubscriptionsPage />)

        expect(capturedConfig?.filtersSection).toBeDefined()
      })

      it('THEN should not configure any actions', () => {
        render(<SubscriptionsPage />)

        expect(capturedConfig?.actions).toBeUndefined()
      })
    })
  })
})
