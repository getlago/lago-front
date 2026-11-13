import { captureException } from '@sentry/react'

import { IntegrationTypeEnum, MappableTypeEnum, MappingTypeEnum } from '~/generated/graphql'
import {
  CreateUpdateDeleteFunctions,
  handleIntegrationMappingCreateUpdateDelete,
  MappableIntegrationMapItemDrawerData,
} from '~/pages/settings/integrations/common'

import { submitIntegrationMapItemMappings } from '../submitIntegrationMapItemMappings'

jest.mock('@sentry/react', () => ({ captureException: jest.fn() }))

jest.mock('~/pages/settings/integrations/common', () => ({
  ...jest.requireActual('~/pages/settings/integrations/common'),
  handleIntegrationMappingCreateUpdateDelete: jest.fn(),
}))

const mockHandleMutation = jest.mocked(handleIntegrationMappingCreateUpdateDelete)

const mappingFunctions: CreateUpdateDeleteFunctions = {
  createCollectionMapping: jest.fn(),
  createMapping: jest.fn(),
  deleteCollectionMapping: jest.fn(),
  deleteMapping: jest.fn(),
  updateCollectionMapping: jest.fn(),
  updateMapping: jest.fn(),
}

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

        expect(result.success).toBe(true)
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

        expect(result.success).toBe(false)
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

        expect(result.success).toBe(false)
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

        expect(result.success).toBe(false)
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

        expect(result.success).toBe(true)
        expect(mockHandleMutation).not.toHaveBeenCalled()
      })
    })
  })
  describe('GIVEN a partial save', () => {
    describe('WHEN one billing entity was applied and another failed', () => {
      it('THEN should fold the applied mapping into the returned snapshot', async () => {
        const createdMapping = {
          itemId: 'created-mapping',
          itemExternalId: 'ext-2',
          lagoMappableId: 'bm-1',
          lagoMappableName: 'Metric',
        }

        mockHandleMutation
          .mockResolvedValueOnce({ success: false, reasons: ['boom'] })
          .mockResolvedValueOnce({ success: true, appliedMapping: createdMapping })

        const drawerData = buildDrawerData()

        const result = await submitIntegrationMapItemMappings({
          values,
          drawerData,
          mappingFunctions,
          provider: IntegrationTypeEnum.Anrok,
        })

        expect(result).toEqual({
          success: false,
          itemMappings: {
            default: drawerData.itemMappings.default,
            'be-1': createdMapping,
          },
        })
      })
    })

    describe('WHEN a mutation rejects instead of returning an error', () => {
      it('THEN should still keep what the other billing entity applied', async () => {
        const deletedMapping = {
          itemId: null,
          itemExternalId: null,
          lagoMappableId: 'bm-1',
          lagoMappableName: 'Metric',
        }

        mockHandleMutation
          .mockResolvedValueOnce({ success: true, appliedMapping: deletedMapping })
          .mockRejectedValueOnce(new Error('network down'))

        const result = await submitIntegrationMapItemMappings({
          values,
          drawerData: buildDrawerData(),
          mappingFunctions,
          provider: IntegrationTypeEnum.Anrok,
        })

        expect(result.success).toBe(false)
        expect(result.itemMappings.default).toEqual(deletedMapping)
      })

      it('THEN should report the rejection so the failed save stays diagnosable', async () => {
        const reason = new Error('network down')

        mockHandleMutation.mockResolvedValueOnce({ success: true }).mockRejectedValueOnce(reason)

        await submitIntegrationMapItemMappings({
          values,
          drawerData: buildDrawerData(),
          mappingFunctions,
          provider: IntegrationTypeEnum.Anrok,
        })

        expect(captureException).toHaveBeenCalledWith(reason, {
          tags: { errorType: 'IntegrationMappingSaveError', provider: IntegrationTypeEnum.Anrok },
        })
      })
    })

    describe('WHEN every billing entity succeeded without touching the backend', () => {
      it('THEN should return the opening snapshot unchanged', async () => {
        mockHandleMutation.mockResolvedValue({ success: true })
        const drawerData = buildDrawerData()

        const result = await submitIntegrationMapItemMappings({
          values,
          drawerData,
          mappingFunctions,
          provider: IntegrationTypeEnum.Anrok,
        })

        expect(result.itemMappings).toEqual(drawerData.itemMappings)
      })
    })
  })
})
