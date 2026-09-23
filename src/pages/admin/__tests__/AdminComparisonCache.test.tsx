import { InMemoryCache } from '@apollo/client'
import { MockedProvider } from '@apollo/client/testing'
import { screen, waitFor } from '@testing-library/react'

import { queryFieldPolicies } from '~/core/apolloClient/cache'
import {
  AdminOrganizationsComparisonDocument,
  AdminOrganizationsDocument,
  PremiumIntegrationTypeEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import AdminComparison from '../AdminComparison'

it('fetches comparison organizations even when a smaller list page is cached', async () => {
  window.history.replaceState({}, '', '/admin/compare?orgs=one,two')
  const integration = Object.values(PremiumIntegrationTypeEnum)[0]
  const first = {
    id: 'one',
    name: 'First',
    email: null,
    createdAt: '2026-09-17T12:00:00Z',
    premiumIntegrations: [integration],
    featureFlags: [],
  }
  const second = { ...first, id: 'two', name: 'Second', premiumIntegrations: [] }
  const cache = new InMemoryCache({
    addTypename: false,
    typePolicies: { Query: { fields: queryFieldPolicies } },
  })

  cache.writeQuery({
    query: AdminOrganizationsDocument,
    variables: { page: 1, limit: 20 },
    data: {
      adminOrganizations: {
        collection: [first],
        metadata: { currentPage: 1, totalCount: 2, totalPages: 2 },
      },
    },
  })
  const result = jest.fn(() => ({ data: { adminOrganizations: { collection: [first, second] } } }))

  render(
    <MockedProvider
      cache={cache}
      addTypename={false}
      mocks={[
        {
          request: { query: AdminOrganizationsComparisonDocument, variables: { limit: 500 } },
          result,
        },
      ]}
    >
      <AdminComparison />
    </MockedProvider>,
  )
  await waitFor(() => expect(result).toHaveBeenCalledTimes(1))
  expect(await screen.findByText(integration)).toBeInTheDocument()
  expect(screen.queryByText('Select at least 2 organizations to compare')).not.toBeInTheDocument()
})
