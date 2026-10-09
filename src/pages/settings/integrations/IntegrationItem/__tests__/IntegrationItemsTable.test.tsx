import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CurrencyEnum, IntegrationTypeEnum, MappingTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import IntegrationItemsTable from '../IntegrationItemsTable'
import { IntegrationItem } from '../types'

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetBillingEntitiesQuery: () => ({ data: undefined, loading: false }),
}))

const INTEGRATION_ID = 'integration-1'
const ITEM_ID = 'collection-mapping-1'
const FIRST_ROW_TEST_ID = 'table-row-0'

const currencies = [
  {
    __typename: 'CurrencyMappingItem' as const,
    currencyCode: CurrencyEnum.Eur,
    currencyExternalCode: 'EUR-EXT',
  },
]

const currenciesItem: IntegrationItem = {
  id: 'currencies',
  icon: 'coin-dollar',
  label: 'Currencies',
  description: 'Currencies mapping',
  mappingType: MappingTypeEnum.Currencies,
  integrationMappings: [
    {
      __typename: 'CollectionMapping',
      id: ITEM_ID,
      mappingType: MappingTypeEnum.Currencies,
      currencies,
    },
  ],
}

const couponItem: IntegrationItem = {
  id: 'coupon',
  icon: 'coupon',
  label: 'Coupon',
  description: 'Coupon mapping',
  mappingType: MappingTypeEnum.Coupon,
  integrationMappings: [],
}

describe('IntegrationItemsTable', () => {
  describe('GIVEN a currencies mapping row', () => {
    describe('WHEN the row is clicked', () => {
      it('THEN should open the currencies drawer seeded with the existing mapping', async () => {
        const openCurrenciesMappingDrawer = jest.fn()
        const user = userEvent.setup()

        render(
          <IntegrationItemsTable
            integrationId={INTEGRATION_ID}
            openCurrenciesMappingDrawer={openCurrenciesMappingDrawer}
            items={[currenciesItem]}
            provider={IntegrationTypeEnum.Netsuite}
            isLoading={false}
            displayBillingEntities={false}
          />,
        )

        await user.click(screen.getByTestId(FIRST_ROW_TEST_ID))

        expect(openCurrenciesMappingDrawer).toHaveBeenCalledWith({
          integrationId: INTEGRATION_ID,
          type: MappingTypeEnum.Currencies,
          itemId: ITEM_ID,
          mappings: currencies,
        })
      })
    })
  })

  describe('GIVEN a non-currencies mapping row', () => {
    describe('WHEN the row is clicked', () => {
      it('THEN should open the map item drawer seeded with the row mapping', async () => {
        const openIntegrationMapItemDrawer = jest.fn()
        const user = userEvent.setup()

        render(
          <IntegrationItemsTable
            integrationId={INTEGRATION_ID}
            openIntegrationMapItemDrawer={openIntegrationMapItemDrawer}
            items={[couponItem]}
            provider={IntegrationTypeEnum.Netsuite}
            isLoading={false}
            displayBillingEntities={false}
          />,
        )

        await user.click(screen.getByTestId(FIRST_ROW_TEST_ID))

        expect(openIntegrationMapItemDrawer).toHaveBeenCalledWith(
          expect.objectContaining({
            integrationId: INTEGRATION_ID,
            type: MappingTypeEnum.Coupon,
          }),
        )
      })
    })
  })
})
