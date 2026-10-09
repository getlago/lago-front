import { screen } from '@testing-library/react'

import { GENERIC_PLACEHOLDER_TEST_ID } from '~/components/designSystem/GenericPlaceholder'
import { MappingTypeEnum } from '~/generated/graphql'
import { IntegrationItemsTableProps } from '~/pages/settings/integrations/IntegrationItem/types'
import { render } from '~/test-utils'

import NetsuiteAdditionalMappings from '../NetsuiteAdditionalMappings'

const INTEGRATION_ID = 'integration-1'
const TABLE_TEST_ID = 'integration-items-table'

let mockQueryResult: {
  data?: unknown
  loading: boolean
  error?: Error
} = { data: undefined, loading: false }

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetNetsuiteIntegrationCollectionCurrenciesMappingsQuery: () => mockQueryResult,
}))

const mockOpenDrawer = jest.fn()

jest.mock('../useNetsuiteAdditionalMappingDrawer', () => ({
  useNetsuiteAdditionalMappingDrawer: () => ({ openDrawer: mockOpenDrawer }),
}))

let capturedTableProps: IntegrationItemsTableProps | undefined

jest.mock('~/pages/settings/integrations/IntegrationItem', () => ({
  IntegrationItemsTable: (props: IntegrationItemsTableProps) => {
    capturedTableProps = props

    return <div data-test="integration-items-table" />
  },
}))

const currenciesMapping = {
  id: 'collection-mapping-1',
  mappingType: MappingTypeEnum.Currencies,
  currencies: [],
}

describe('NetsuiteAdditionalMappings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedTableProps = undefined
    mockQueryResult = { data: undefined, loading: false }
  })

  describe('GIVEN the mappings query fails', () => {
    describe('WHEN the component renders', () => {
      it('THEN should display the error placeholder instead of the table', () => {
        mockQueryResult = { data: undefined, loading: false, error: new Error('boom') }

        render(<NetsuiteAdditionalMappings integrationId={INTEGRATION_ID} />)

        expect(screen.getByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(TABLE_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the mappings query succeeds', () => {
    describe('WHEN the collection holds other mapping types', () => {
      it('THEN should only forward the currencies mappings', () => {
        mockQueryResult = {
          data: {
            integrationCollectionMappings: {
              collection: [currenciesMapping, { id: 'other', mappingType: MappingTypeEnum.Coupon }],
            },
          },
          loading: false,
        }

        render(<NetsuiteAdditionalMappings integrationId={INTEGRATION_ID} />)

        expect(capturedTableProps?.items).toHaveLength(1)
        expect(capturedTableProps?.items[0].integrationMappings).toEqual([currenciesMapping])
      })
    })

    describe('WHEN the table asks to open a currencies mapping', () => {
      it('THEN should hand it the drawer hook opener', () => {
        render(<NetsuiteAdditionalMappings integrationId={INTEGRATION_ID} />)

        expect(capturedTableProps?.openCurrenciesMappingDrawer).toBe(mockOpenDrawer)
        expect(capturedTableProps?.openIntegrationMapItemDrawer).toBeUndefined()
      })
    })
  })
})
