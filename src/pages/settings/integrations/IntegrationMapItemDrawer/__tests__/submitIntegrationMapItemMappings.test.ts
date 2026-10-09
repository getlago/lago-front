import { IntegrationTypeEnum, MappableTypeEnum, MappingTypeEnum } from '~/generated/graphql'
import {
  CreateUpdateDeleteFunctions,
  handleIntegrationMappingCreateUpdateDelete,
  MappableIntegrationMapItemDrawerData,
} from '~/pages/settings/integrations/common'

import { submitIntegrationMapItemMappings } from '../submitIntegrationMapItemMappings'

jest.mock('~/pages/settings/integrations/common', () => ({
  ...jest.requireActual('~/pages/settings/integrations/common'),
  handleIntegrationMappingCreateUpdateDelete: jest.fn(),
}))

const mockHandleMutation = jest.mocked(handleIntegrationMappingCreateUpdateDelete)

const mappingFunctions = {} as CreateUpdateDeleteFunctions

const DEFAULT_ENTITY = { id: null, key: 'default', name: 'Default' }
const OTHER_ENTITY = { id: 'be-1', key: 'be-1', name: 'Entity One' }

const buildDrawerData = (
  overrides: Partial<MappableIntegrationMapItemDrawerData> = {},
): MappableIntegrationMapItemDrawerData => ({
  type: MappableTypeEnum.BillableMetric,
  integrationId: 'integration-1',
  billingEntities: [DEFAULT_ENTITY, OTHER_ENTITY],
  itemMappings: {
    default: {
      itemId: 'mapping-default',
      itemExternalId: 'ext-1',
      lagoMappableId: 'bm-1',
      lagoMappableName: 'Metric',
    },
    'be-1': {
      itemId: null,
      itemExternalId: null,
      lagoMappableId: 'bm-1',
      lagoMappableName: 'Metric',
    },
  },
  ...overrides,
})

const values = {
  default: { externalId: 'ext-1', externalName: 'Name' },
  'be-1': { externalId: '', externalName: '' },
}

describe('submitIntegrationMapItemMappings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN every billing entity mutation succeeds', () => {
    describe('WHEN submitting', () => {
      it('THEN should call the mutation handler once per billing entity with its own values', async () => {
        mockHandleMutation.mockResolvedValue({ success: true })
        const drawerData = buildDrawerData()

        const result = await submitIntegrationMapItemMappings({
          values,
          drawerData,
          mappingFunctions,
          provider: IntegrationTypeEnum.Anrok,
        })

        expect(result).toBe(true)
        expect(mockHandleMutation).toHaveBeenCalledTimes(2)
        expect(mockHandleMutation).toHaveBeenNthCalledWith(
          1,
          values.default,
          drawerData.itemMappings.default,
          MappableTypeEnum.BillableMetric,
          'integration-1',
          mappingFunctions,
          DEFAULT_ENTITY,
          IntegrationTypeEnum.Anrok,
        )
        expect(mockHandleMutation).toHaveBeenNthCalledWith(
          2,
          values['be-1'],
          drawerData.itemMappings['be-1'],
          MappableTypeEnum.BillableMetric,
          'integration-1',
          mappingFunctions,
          OTHER_ENTITY,
          IntegrationTypeEnum.Anrok,
        )
      })
    })
  })

  describe('GIVEN one billing entity mutation fails', () => {
    describe('WHEN submitting', () => {
      it('THEN should report a failure', async () => {
        mockHandleMutation
          .mockResolvedValueOnce({ success: true })
          .mockResolvedValueOnce({ success: false, reasons: ['boom'] })

        const result = await submitIntegrationMapItemMappings({
          values,
          drawerData: buildDrawerData(),
          mappingFunctions,
          provider: IntegrationTypeEnum.Anrok,
        })

        expect(result).toBe(false)
      })
    })
  })

  describe('GIVEN the mapping is a currencies mapping', () => {
    describe('WHEN submitting', () => {
      it('THEN should report a failure without calling any mutation', async () => {
        const result = await submitIntegrationMapItemMappings({
          values,
          drawerData: buildDrawerData({
            type: MappingTypeEnum.Currencies,
            billingEntities: [DEFAULT_ENTITY],
            itemMappings: { default: { itemId: null, currencies: [] } },
          }),
          mappingFunctions,
          provider: IntegrationTypeEnum.Netsuite,
        })

        expect(result).toBe(false)
        expect(mockHandleMutation).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the drawer data is missing the integration id', () => {
    describe('WHEN submitting', () => {
      it('THEN should report a failure without calling any mutation', async () => {
        const result = await submitIntegrationMapItemMappings({
          values,
          drawerData: buildDrawerData({ integrationId: '' }),
          mappingFunctions,
          provider: IntegrationTypeEnum.Anrok,
        })

        expect(result).toBe(false)
        expect(mockHandleMutation).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN no drawer data', () => {
    describe('WHEN submitting', () => {
      it('THEN should succeed without calling any mutation', async () => {
        const result = await submitIntegrationMapItemMappings({
          values,
          drawerData: undefined,
          mappingFunctions,
          provider: IntegrationTypeEnum.Anrok,
        })

        expect(result).toBe(true)
        expect(mockHandleMutation).not.toHaveBeenCalled()
      })
    })
  })
})
