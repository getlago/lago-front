import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemApiKeyIds } from '~/components/Filters/graphql/filtersElements/FiltersItemApiKeyIds'
import { filterDataInlineSeparator } from '~/components/Filters/presentation/types'
import { GetApiKeyIdsForFilterItemApiKeyIdsDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

jest.mock('~/components/Filters/graphql/useFilters', () => ({
  useFilters: () => ({
    displayInDialog: false,
  }),
}))

const mockSetFilterValue = jest.fn()

const apiKeysMock: TestMocksType = [
  {
    request: { query: GetApiKeyIdsForFilterItemApiKeyIdsDocument },
    result: {
      data: {
        apiKeys: {
          __typename: 'SanitizedApiKeyCollection',
          collection: [
            {
              __typename: 'SanitizedApiKey',
              id: 'apikey-1',
              value: 'Production key',
            },
            {
              __typename: 'SanitizedApiKey',
              id: 'apikey-2',
              value: 'Staging key',
            },
          ],
        },
      },
    },
  },
]

const renderComponent = (value?: string, mocks: TestMocksType = apiKeysMock) => {
  return render(<FiltersItemApiKeyIds value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: (props) => <AllTheProviders {...props} mocks={mocks} />,
  })
}

describe('FiltersItemApiKeyIds', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN no initial value', () => {
    it('THEN displays the combobox', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN undefined value', () => {
    it('THEN should not crash and displays the combobox', async () => {
      renderComponent(undefined)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a value with id and api key name', () => {
    it('THEN displays the api key name as a chip', async () => {
      const value = `apikey-1${filterDataInlineSeparator}Production key`

      renderComponent(value)

      await waitFor(() => {
        expect(screen.getByText('Production key')).toBeInTheDocument()
      })
    })
  })
})
