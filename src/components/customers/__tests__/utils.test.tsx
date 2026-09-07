import { IntegrationsListForCustomerMainInfosQuery } from '~/generated/graphql'

import { getConnectedIntegrations } from '../utils'

const buildIntegrationsData = (
  collection: Array<{ __typename: string; id: string }>,
): IntegrationsListForCustomerMainInfosQuery =>
  ({ integrations: { collection } }) as unknown as IntegrationsListForCustomerMainInfosQuery

describe('getConnectedIntegrations', () => {
  describe('GIVEN no integrations data', () => {
    describe('WHEN looking up an integration', () => {
      it('THEN should return undefined', () => {
        const result = getConnectedIntegrations(undefined, 'AvalaraIntegration', 'integration-1')

        expect(result).toBeUndefined()
      })
    })
  })

  describe('GIVEN an integration customer without an integration id', () => {
    describe.each([
      ['undefined', undefined],
      ['null', null],
    ])('WHEN the id is %s', (_, integrationId) => {
      it('THEN should return undefined instead of matching the first integration of the type', () => {
        const data = buildIntegrationsData([{ __typename: 'AvalaraIntegration', id: 'int-1' }])

        const result = getConnectedIntegrations(data, 'AvalaraIntegration', integrationId)

        expect(result).toBeUndefined()
      })
    })
  })

  describe('GIVEN integrations of several types', () => {
    describe('WHEN both the typename and the integration id match', () => {
      it('THEN should return that integration', () => {
        const data = buildIntegrationsData([
          { __typename: 'AvalaraIntegration', id: 'integration-1' },
          { __typename: 'SalesforceIntegration', id: 'integration-2' },
        ])

        const result = getConnectedIntegrations(data, 'AvalaraIntegration', 'integration-1')

        expect(result).toEqual({ __typename: 'AvalaraIntegration', id: 'integration-1' })
      })
    })

    describe('WHEN the id belongs to another integration type', () => {
      it('THEN should return undefined', () => {
        const data = buildIntegrationsData([
          { __typename: 'SalesforceIntegration', id: 'integration-2' },
        ])

        const result = getConnectedIntegrations(data, 'AvalaraIntegration', 'integration-2')

        expect(result).toBeUndefined()
      })
    })

    describe('WHEN no integration carries that id', () => {
      it('THEN should return undefined', () => {
        const data = buildIntegrationsData([
          { __typename: 'HubspotIntegration', id: 'integration-1' },
        ])

        const result = getConnectedIntegrations(data, 'HubspotIntegration', 'non-existent-id')

        expect(result).toBeUndefined()
      })
    })
  })
})
