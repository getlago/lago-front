import { MockedProvider } from '@apollo/client/testing'
import { waitFor } from '@testing-library/react'

import { GetSubscriptionForDetailsV2OverviewDocument } from '~/generated/graphql'
import { render } from '~/test-utils'

import { SubscriptionDetailsV2Overview } from '../SubscriptionDetailsV2Overview'

const capturedProps: Array<Record<string, unknown>> = []

jest.mock('../SubscriptionInformationSection', () => ({
  __esModule: true,
  SubscriptionInformationSection: (props: Record<string, unknown>) => {
    capturedProps.push(props)

    return null
  },
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const SUB_ID = 'sub_1'

const queryMock = {
  request: {
    query: GetSubscriptionForDetailsV2OverviewDocument,
    variables: { subscriptionId: SUB_ID },
  },
  result: {
    data: {
      subscription: { id: SUB_ID },
    },
  },
}

describe('SubscriptionDetailsV2Overview', () => {
  beforeEach(() => {
    capturedProps.length = 0
  })

  it('renders the subscription information section with the fetched subscription', async () => {
    render(
      <MockedProvider mocks={[queryMock]} addTypename={false}>
        <SubscriptionDetailsV2Overview subscriptionId={SUB_ID} />
      </MockedProvider>,
    )

    await waitFor(() => expect(capturedProps.length).toBeGreaterThan(0))
    const props = capturedProps[capturedProps.length - 1]

    expect((props.subscription as { id: string }).id).toBe(SUB_ID)
  })

  it('renders nothing and skips the query when no subscription id is provided', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <SubscriptionDetailsV2Overview subscriptionId="" />
      </MockedProvider>,
    )

    expect(capturedProps.length).toBe(0)
  })
})
