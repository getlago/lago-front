import { ConnectionCategory } from '~/components/customerConnections/types'
import { HubspotTargetedObjectsEnum, IntegrationTypeEnum } from '~/generated/graphql'

import { getIntegrationCustomers } from '../getIntegrationCustomers'

describe('getIntegrationCustomers', () => {
  describe('GIVEN no integration connection', () => {
    describe('WHEN the form array is undefined', () => {
      it('THEN should return an empty array', () => {
        expect(getIntegrationCustomers(undefined)).toEqual([])
      })
    })

    describe('WHEN the form array is empty', () => {
      it('THEN should return an empty array', () => {
        expect(getIntegrationCustomers([])).toEqual([])
      })
    })
  })

  describe('GIVEN an integration connection without a resolved provider', () => {
    describe('WHEN the provider code is missing', () => {
      it('THEN should drop the connection', () => {
        const result = getIntegrationCustomers([
          {
            id: 'anrok-1',
            category: ConnectionCategory.Tax,
            providerType: IntegrationTypeEnum.Anrok,
            externalCustomerId: 'tax-123',
          },
        ])

        expect(result).toEqual([])
      })

      it('THEN should drop the connection when the provider code is an empty string', () => {
        const result = getIntegrationCustomers([
          {
            id: 'anrok-1',
            category: ConnectionCategory.Tax,
            providerCode: '',
            providerType: IntegrationTypeEnum.Anrok,
          },
        ])

        expect(result).toEqual([])
      })
    })

    describe('WHEN the provider type is missing', () => {
      it('THEN should drop the connection', () => {
        const result = getIntegrationCustomers([
          {
            id: 'anrok-1',
            category: ConnectionCategory.Tax,
            providerCode: 'anrok_1',
            externalCustomerId: 'tax-123',
          },
        ])

        expect(result).toEqual([])
      })
    })

    describe('WHEN only some connections are resolved', () => {
      it('THEN should keep only the resolved ones', () => {
        const result = getIntegrationCustomers([
          {
            category: ConnectionCategory.Tax,
            providerCode: 'anrok_1',
            providerType: IntegrationTypeEnum.Anrok,
            externalCustomerId: 'tax-123',
            syncWithProvider: true,
          },
          {
            category: ConnectionCategory.Accounting,
            providerCode: 'netsuite_1',
          },
          {
            category: ConnectionCategory.Crm,
            providerType: IntegrationTypeEnum.Hubspot,
          },
        ])

        expect(result).toEqual([
          {
            id: undefined,
            code: null,
            integrationCode: 'anrok_1',
            integrationType: IntegrationTypeEnum.Anrok,
            externalCustomerId: 'tax-123',
            syncWithProvider: true,
          },
        ])
      })
    })
  })

  describe('GIVEN a tax integration connection', () => {
    describe('WHEN mapping it to an input item', () => {
      it('THEN should map the provider code and type and keep the persisted id', () => {
        const result = getIntegrationCustomers([
          {
            id: 'anrok-1',
            category: ConnectionCategory.Tax,
            providerCode: 'anrok_1',
            providerType: IntegrationTypeEnum.Anrok,
            externalCustomerId: 'tax-123',
            syncWithProvider: true,
          },
        ])

        expect(result).toEqual([
          {
            id: 'anrok-1',
            code: null,
            integrationCode: 'anrok_1',
            integrationType: IntegrationTypeEnum.Anrok,
            externalCustomerId: 'tax-123',
            syncWithProvider: true,
          },
        ])
      })

      it('THEN should omit the id when the connection is not persisted yet', () => {
        const result = getIntegrationCustomers([
          {
            category: ConnectionCategory.Tax,
            providerCode: 'avalara_1',
            providerType: IntegrationTypeEnum.Avalara,
            externalCustomerId: 'tax-456',
            syncWithProvider: false,
          },
        ])

        expect(result[0]?.id).toBeUndefined()
        expect(result).toEqual([
          {
            id: undefined,
            code: null,
            integrationCode: 'avalara_1',
            integrationType: IntegrationTypeEnum.Avalara,
            externalCustomerId: 'tax-456',
            syncWithProvider: false,
          },
        ])
      })

      it('THEN should forward the optional fields as undefined when they are not set', () => {
        const result = getIntegrationCustomers([
          {
            category: ConnectionCategory.Tax,
            providerCode: 'anrok_1',
            providerType: IntegrationTypeEnum.Anrok,
          },
        ])

        expect(result).toEqual([
          {
            id: undefined,
            code: null,
            integrationCode: 'anrok_1',
            integrationType: IntegrationTypeEnum.Anrok,
            externalCustomerId: undefined,
            syncWithProvider: undefined,
          },
        ])
      })
    })
  })

  describe('GIVEN an accounting integration connection', () => {
    describe('WHEN the subsidiaryId is set', () => {
      it('THEN should spread the subsidiaryId onto the input item', () => {
        const result = getIntegrationCustomers([
          {
            id: 'netsuite-1',
            category: ConnectionCategory.Accounting,
            providerCode: 'netsuite_1',
            providerType: IntegrationTypeEnum.Netsuite,
            externalCustomerId: 'accounting-123',
            syncWithProvider: true,
            subsidiaryId: 'subsidiary-1',
          },
        ])

        expect(result).toEqual([
          {
            id: 'netsuite-1',
            code: null,
            integrationCode: 'netsuite_1',
            integrationType: IntegrationTypeEnum.Netsuite,
            externalCustomerId: 'accounting-123',
            syncWithProvider: true,
            subsidiaryId: 'subsidiary-1',
          },
        ])
      })
    })

    describe('WHEN the subsidiaryId is an empty string', () => {
      it('THEN should omit the subsidiaryId from the input item', () => {
        const result = getIntegrationCustomers([
          {
            id: 'netsuite-1',
            category: ConnectionCategory.Accounting,
            providerCode: 'netsuite_1',
            providerType: IntegrationTypeEnum.Netsuite,
            externalCustomerId: 'accounting-123',
            syncWithProvider: true,
            subsidiaryId: '',
          },
        ])

        expect(result[0]).not.toHaveProperty('subsidiaryId')
      })
    })

    describe('WHEN the provider has no subsidiary at all', () => {
      it('THEN should omit the subsidiaryId from the input item', () => {
        const result = getIntegrationCustomers([
          {
            id: 'xero-1',
            category: ConnectionCategory.Accounting,
            providerCode: 'xero_1',
            providerType: IntegrationTypeEnum.Xero,
            externalCustomerId: 'accounting-456',
            syncWithProvider: false,
          },
        ])

        expect(result[0]).not.toHaveProperty('subsidiaryId')
        expect(result).toEqual([
          {
            id: 'xero-1',
            code: null,
            integrationCode: 'xero_1',
            integrationType: IntegrationTypeEnum.Xero,
            externalCustomerId: 'accounting-456',
            syncWithProvider: false,
          },
        ])
      })
    })
  })

  describe('GIVEN a CRM integration connection', () => {
    describe('WHEN the targetedObject is set', () => {
      it('THEN should spread the targetedObject onto the input item', () => {
        const result = getIntegrationCustomers([
          {
            id: 'hubspot-1',
            category: ConnectionCategory.Crm,
            providerCode: 'hubspot_1',
            providerType: IntegrationTypeEnum.Hubspot,
            externalCustomerId: 'crm-123',
            syncWithProvider: true,
            targetedObject: HubspotTargetedObjectsEnum.Companies,
          },
        ])

        expect(result).toEqual([
          {
            id: 'hubspot-1',
            code: null,
            integrationCode: 'hubspot_1',
            integrationType: IntegrationTypeEnum.Hubspot,
            externalCustomerId: 'crm-123',
            syncWithProvider: true,
            targetedObject: HubspotTargetedObjectsEnum.Companies,
          },
        ])
      })
    })

    describe('WHEN the targetedObject is undefined', () => {
      it('THEN should omit the targetedObject from the input item', () => {
        const result = getIntegrationCustomers([
          {
            id: 'salesforce-1',
            category: ConnectionCategory.Crm,
            providerCode: 'salesforce_1',
            providerType: IntegrationTypeEnum.Salesforce,
            externalCustomerId: 'crm-456',
            syncWithProvider: false,
            targetedObject: undefined,
          },
        ])

        expect(result[0]).not.toHaveProperty('targetedObject')
        expect(result).toEqual([
          {
            id: 'salesforce-1',
            code: null,
            integrationCode: 'salesforce_1',
            integrationType: IntegrationTypeEnum.Salesforce,
            externalCustomerId: 'crm-456',
            syncWithProvider: false,
          },
        ])
      })
    })
  })

  describe('GIVEN one integration connection per category', () => {
    describe('WHEN mapping them to input items', () => {
      it('THEN should map every connection preserving the array order and every id', () => {
        const result = getIntegrationCustomers([
          {
            id: 'netsuite-1',
            category: ConnectionCategory.Accounting,
            providerCode: 'netsuite_1',
            providerType: IntegrationTypeEnum.Netsuite,
            externalCustomerId: 'accounting-123',
            syncWithProvider: false,
            subsidiaryId: 'subsidiary-1',
          },
          {
            id: 'anrok-1',
            category: ConnectionCategory.Tax,
            providerCode: 'anrok_1',
            providerType: IntegrationTypeEnum.Anrok,
            externalCustomerId: 'tax-123',
            syncWithProvider: true,
          },
          {
            id: 'hubspot-1',
            category: ConnectionCategory.Crm,
            providerCode: 'hubspot_1',
            providerType: IntegrationTypeEnum.Hubspot,
            externalCustomerId: 'crm-123',
            syncWithProvider: true,
            targetedObject: HubspotTargetedObjectsEnum.Contacts,
          },
        ])

        expect(result).toEqual([
          {
            id: 'netsuite-1',
            code: null,
            integrationCode: 'netsuite_1',
            integrationType: IntegrationTypeEnum.Netsuite,
            externalCustomerId: 'accounting-123',
            syncWithProvider: false,
            subsidiaryId: 'subsidiary-1',
          },
          {
            id: 'anrok-1',
            code: null,
            integrationCode: 'anrok_1',
            integrationType: IntegrationTypeEnum.Anrok,
            externalCustomerId: 'tax-123',
            syncWithProvider: true,
          },
          {
            id: 'hubspot-1',
            code: null,
            integrationCode: 'hubspot_1',
            integrationType: IntegrationTypeEnum.Hubspot,
            externalCustomerId: 'crm-123',
            syncWithProvider: true,
            targetedObject: HubspotTargetedObjectsEnum.Contacts,
          },
        ])
      })

      it('THEN should not emit any category field on the input items', () => {
        const result = getIntegrationCustomers([
          {
            id: 'anrok-1',
            category: ConnectionCategory.Tax,
            providerCode: 'anrok_1',
            providerType: IntegrationTypeEnum.Anrok,
          },
        ])

        expect(result[0]).not.toHaveProperty('category')
        expect(result[0]).not.toHaveProperty('providerCode')
        expect(result[0]).not.toHaveProperty('providerType')
      })
    })
  })
  describe('GIVEN a connection with a user-entered code', () => {
    describe('WHEN mapping it to an input item', () => {
      it('THEN should send the entered code instead of a null', () => {
        const result = getIntegrationCustomers([
          {
            id: 'anrok-1',
            code: 'tax-eu',
            category: ConnectionCategory.Tax,
            providerCode: 'anrok_1',
            providerType: IntegrationTypeEnum.Anrok,
          },
        ])

        expect(result[0]).toEqual(
          expect.objectContaining({ code: 'tax-eu', integrationCode: 'anrok_1' }),
        )
      })
    })
  })
})
