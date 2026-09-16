import { screen } from '@testing-library/react'

import { CONTRACT_DETAILS_ROUTE, objectDetailsRoutes } from '~/core/router/ObjectsRoutes'
import { FeatureFlagEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import ContractDetails from '../ContractDetails'

describe('ContractDetails', () => {
  it('renders the temporary placeholder', () => {
    render(<ContractDetails />)

    expect(screen.getByText('Todo')).toBeInTheDocument()
  })

  it('registers the exact protected details route', () => {
    const route = objectDetailsRoutes.find(
      ({ path }) => Array.isArray(path) && path.includes(CONTRACT_DETAILS_ROUTE),
    )

    expect(CONTRACT_DETAILS_ROUTE).toBe('/contracts/:id')
    expect(route).toEqual(
      expect.objectContaining({
        private: true,
        permissions: ['contractsView'],
        featureFlag: FeatureFlagEnum.ProductCatalog,
      }),
    )
  })
})
