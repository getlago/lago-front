import { renderHook } from '@testing-library/react'

import { MappableTypeEnum, MappingTypeEnum } from '~/generated/graphql'

import { QuickbooksIntegrationMapItemDrawerProps } from '../types'
import { useQuickbooksIntegrationTitleAndDescriptionMapping } from '../useQuickbooksIntegrationTitleAndDescriptionMapping'

// Echoes the key and its interpolations, so each assertion names the copy and the values it got.
jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, data?: Record<string, string>) =>
      data ? `${key}(${Object.values(data).join(',')})` : key,
  }),
}))

const QUICKBOOKS_NAME_KEY = 'text_179543424168937zditnx1d9'

const drawerProps = (
  type: MappableTypeEnum | MappingTypeEnum,
): QuickbooksIntegrationMapItemDrawerProps => ({
  type,
  integrationId: 'integration-1',
  billingEntities: [{ id: null, key: 'default', name: 'Default' }],
  itemMappings: {
    default: {
      itemId: null,
      itemExternalId: null,
      itemExternalName: undefined,
      itemExternalCode: undefined,
      lagoMappableId: 'mappable-1',
      lagoMappableName: 'API calls',
    },
  },
})

const getTitleAndDescription = (
  props: QuickbooksIntegrationMapItemDrawerProps | undefined,
  type: MappableTypeEnum | MappingTypeEnum | undefined,
) => {
  const { result } = renderHook(() => useQuickbooksIntegrationTitleAndDescriptionMapping())

  return result.current.getTitleAndDescription(props, type)
}

describe('useQuickbooksIntegrationTitleAndDescriptionMapping', () => {
  describe('GIVEN no drawer data', () => {
    it('THEN returns an empty title and description', () => {
      expect(getTitleAndDescription(undefined, MappingTypeEnum.Coupon)).toEqual({
        title: '',
        description: '',
      })
    })
  })

  describe('GIVEN a collection mapping type', () => {
    it.each([
      MappingTypeEnum.Coupon,
      MappingTypeEnum.CreditNote,
      MappingTypeEnum.MinimumCommitment,
      MappingTypeEnum.PrepaidCredit,
      MappingTypeEnum.SubscriptionFee,
      MappingTypeEnum.Account,
    ])('THEN names QuickBooks in the %s description', (type) => {
      const { title, description } = getTitleAndDescription(drawerProps(type), type)

      expect(title).not.toBe('')
      expect(description).toContain(QUICKBOOKS_NAME_KEY)
    })

    it('THEN names QuickBooks in the fallback item description', () => {
      const { description } = getTitleAndDescription(
        drawerProps(MappingTypeEnum.FallbackItem),
        MappingTypeEnum.FallbackItem,
      )

      expect(description).toContain(QUICKBOOKS_NAME_KEY)
    })
  })

  describe('GIVEN a Lago add-on or billable metric', () => {
    it.each([MappableTypeEnum.AddOn, MappableTypeEnum.BillableMetric])(
      'THEN names the %s and QuickBooks in the title',
      (type) => {
        const { title } = getTitleAndDescription(drawerProps(type), type)

        expect(title).toContain('API calls')
        expect(title).toContain(QUICKBOOKS_NAME_KEY)
      },
    )
  })

  describe('GIVEN a type QuickBooks does not map', () => {
    it('THEN returns an empty title and description', () => {
      expect(
        getTitleAndDescription(drawerProps(MappingTypeEnum.Currencies), MappingTypeEnum.Currencies),
      ).toEqual({ title: '', description: '' })
    })
  })
})
