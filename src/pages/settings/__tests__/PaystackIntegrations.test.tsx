import { cleanup, screen, waitFor } from '@testing-library/react'

import { GetPaystackIntegrationsListDocument, ProviderTypeEnum } from '~/generated/graphql'

import {
  createPaymentProviderListLoadingMock,
  createPaymentProviderListMock,
  renderIntegrationPage,
} from './integrationTestHelpers'

import PaystackIntegrations from '../PaystackIntegrations'

jest.mock('~/components/settings/integrations/AddPaystackDialog', () => ({
  AddPaystackDialog: () => null,
}))
jest.mock('~/components/settings/integrations/DeletePaystackIntegrationDialog', () => ({
  DeletePaystackIntegrationDialog: () => null,
}))

describe('PaystackIntegrations', () => {
  afterEach(cleanup)

  describe('GIVEN the page is rendered with data', () => {
    it('THEN renders connection items when data is loaded', async () => {
      await renderIntegrationPage(PaystackIntegrations, {
        mocks: createPaymentProviderListMock(
          GetPaystackIntegrationsListDocument,
          ProviderTypeEnum.Paystack,
          'PaystackProvider',
        ),
      })

      await waitFor(() => {
        expect(screen.getByText('Test Connection')).toBeInTheDocument()
        expect(screen.getByText('test-code')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the page is loading', () => {
    it('THEN shows loading skeletons while fetching', async () => {
      const { container } = await renderIntegrationPage(PaystackIntegrations, {
        mocks: createPaymentProviderListLoadingMock(
          GetPaystackIntegrationsListDocument,
          ProviderTypeEnum.Paystack,
        ),
      })

      expect(screen.queryByText('Test Connection')).not.toBeInTheDocument()
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    })
  })
})
