import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  AnrokIntegrationItemsListDefaultFragment,
  IntegrationTypeEnum,
  MappingTypeEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import AnrokIntegrationItemsListDefault from '../AnrokIntegrationItemsListDefault'
import AvalaraIntegrationItemsListDefault from '../AvalaraIntegrationItemsListDefault'

const mockOpenDrawer = jest.fn()

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetBillingEntitiesQuery: () => ({
    loading: false,
    data: {
      billingEntities: {
        collection: [{ id: 'billing-entity-id', name: 'Billing entity', code: 'billing-entity' }],
      },
    },
  }),
}))

const defaultItems: AnrokIntegrationItemsListDefaultFragment[] = [
  MappingTypeEnum.FallbackItem,
  MappingTypeEnum.SubscriptionFee,
  MappingTypeEnum.MinimumCommitment,
].map((mappingType) => ({
  id: `${mappingType}-mapping-id`,
  mappingType,
  billingEntityId: null,
  externalId: `${mappingType}-external-id`,
  externalName: `${mappingType} external name`,
  externalAccountCode: null,
}))

defaultItems.push({
  id: 'billing-entity-fallback-id',
  mappingType: MappingTypeEnum.FallbackItem,
  billingEntityId: 'billing-entity-id',
  externalId: 'billing-entity-external-id',
  externalName: 'Billing entity fallback',
  externalAccountCode: null,
})

const fallbackLabel = 'text_6630e3210c13c500cd398e98'
const subscriptionLabel = 'text_6630e3210c13c500cd398ea2'
const commitmentLabel = 'text_6630e3210c13c500cd398ea5'

describe.each([
  {
    provider: IntegrationTypeEnum.Anrok,
    renderList: (items = defaultItems, canViewLegacyMappings = true) => (
      <AnrokIntegrationItemsListDefault
        openIntegrationMapItemDrawer={mockOpenDrawer}
        defaultItems={items}
        hasError={false}
        integrationId="integration-id"
        isLoading={false}
        canViewLegacyMappings={canViewLegacyMappings}
      />
    ),
  },
  {
    provider: IntegrationTypeEnum.Avalara,
    renderList: (items = defaultItems, canViewLegacyMappings = true) => (
      <AvalaraIntegrationItemsListDefault
        openIntegrationMapItemDrawer={mockOpenDrawer}
        defaultItems={items}
        hasError={false}
        integrationId="integration-id"
        isLoading={false}
        canViewLegacyMappings={canViewLegacyMappings}
      />
    ),
  },
])('$provider default mappings', ({ renderList }) => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when Product Catalog is enabled', () => {
    it('hides subscription and commitment rows even when mappings already exist', () => {
      render(renderList(defaultItems, false))

      expect(screen.getByText(fallbackLabel)).toBeInTheDocument()
      expect(screen.queryByText(subscriptionLabel)).not.toBeInTheDocument()
      expect(screen.queryByText(commitmentLabel)).not.toBeInTheDocument()
      expect(screen.getAllByTestId(/^table-row-/)).toHaveLength(1)
    })

    it('opens the fallback drawer with organization and billing entity mappings', async () => {
      const user = userEvent.setup()

      render(renderList(defaultItems, false))
      await user.click(screen.getByText(fallbackLabel))

      expect(mockOpenDrawer).toHaveBeenCalledWith(
        expect.objectContaining({
          integrationId: 'integration-id',
          type: MappingTypeEnum.FallbackItem,
          itemMappings: {
            default: {
              itemId: 'fallback_item-mapping-id',
              itemExternalId: 'fallback_item-external-id',
              itemExternalName: 'fallback_item external name',
              itemExternalCode: undefined,
            },
            'billing-entity-id': {
              itemId: 'billing-entity-fallback-id',
              itemExternalId: 'billing-entity-external-id',
              itemExternalName: 'Billing entity fallback',
              itemExternalCode: undefined,
            },
          },
        }),
      )
    })

    it('keeps the fallback row available when no mappings exist', async () => {
      const user = userEvent.setup()

      render(renderList([], false))
      await user.click(screen.getByText(fallbackLabel))

      expect(screen.getAllByTestId(/^table-row-/)).toHaveLength(1)
      expect(mockOpenDrawer).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MappingTypeEnum.FallbackItem,
          itemMappings: expect.objectContaining({
            default: expect.objectContaining({ itemId: null, itemExternalId: null }),
          }),
        }),
      )
    })
  })

  describe('when Product Catalog is disabled', () => {
    it('keeps all legacy mappings visible and editable', async () => {
      const user = userEvent.setup()

      render(renderList())

      expect(screen.getByText(fallbackLabel)).toBeInTheDocument()
      expect(screen.getAllByTestId(/^table-row-/)).toHaveLength(3)

      for (const [label, mappingType] of [
        [subscriptionLabel, MappingTypeEnum.SubscriptionFee],
        [commitmentLabel, MappingTypeEnum.MinimumCommitment],
      ]) {
        await user.click(screen.getByText(label))

        expect(mockOpenDrawer).toHaveBeenLastCalledWith(
          expect.objectContaining({ type: mappingType }),
        )
      }
    })
  })
})
