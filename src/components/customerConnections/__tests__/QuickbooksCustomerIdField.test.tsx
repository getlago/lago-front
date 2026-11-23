import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'

import { CustomerConnectionDrawerFormApi } from '~/components/customerConnections/CustomerConnectionDrawer'
import {
  FetchQuickbooksCustomerItemsDocument,
  GetQuickbooksCustomerItemsCountDocument,
  IntegrationItemTypeEnum,
} from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { QuickbooksCustomerIdField } from '../QuickbooksCustomerIdField'

const INTEGRATION_ID = 'qbo-integration-1'

const buildCountMock = (totalCount: number) => ({
  request: {
    query: GetQuickbooksCustomerItemsCountDocument,
    variables: { integrationId: INTEGRATION_ID, itemType: IntegrationItemTypeEnum.Customer },
  },
  result: {
    data: {
      integrationItems: {
        __typename: 'IntegrationItemCollection',
        metadata: { __typename: 'CollectionMetadata', totalCount },
      },
    },
  },
})

const buildFetchMock = (onCall: jest.Mock) => ({
  request: {
    query: FetchQuickbooksCustomerItemsDocument,
    variables: { input: { integrationId: INTEGRATION_ID } },
  },
  result: () => {
    onCall()

    return {
      data: {
        fetchIntegrationCustomers: { __typename: 'IntegrationItemCollection', collection: [] },
      },
    }
  },
})

const Harness = () => {
  const form = useAppForm({ defaultValues: { externalCustomerId: '' } })

  return (
    <QuickbooksCustomerIdField
      form={form as unknown as CustomerConnectionDrawerFormApi}
      integrationId={INTEGRATION_ID}
      connectionName="QuickBooks"
    />
  )
}

const renderField = (mocks: TestMocksType) =>
  render(
    <StrictMode>
      <AllTheProviders mocks={mocks} forceTypenames>
        <Harness />
      </AllTheProviders>
    </StrictMode>,
  )

const externalIdInput = (container: HTMLElement) =>
  container.querySelector('input[name="externalCustomerId"]')

describe('QuickbooksCustomerIdField', () => {
  describe('GIVEN the drawer opens in StrictMode', () => {
    describe('WHEN the field mounts, runs its effects twice and lists nothing yet', () => {
      it('THEN should sync the customers once and keep the id typeable', async () => {
        const onFetch = jest.fn()
        const { container } = renderField([
          buildCountMock(0),
          buildFetchMock(onFetch),
          buildFetchMock(onFetch),
          buildCountMock(0),
          buildCountMock(0),
        ])

        await waitFor(() => expect(onFetch).toHaveBeenCalledTimes(1))

        const input = externalIdInput(container) as HTMLInputElement

        expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
        fireEvent.change(input, { target: { value: '58' } })
        expect(input).toHaveValue('58')
        expect(onFetch).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN QuickBooks customers are stored', () => {
    describe('WHEN the field renders', () => {
      it('THEN should show the customer picker', async () => {
        renderField([buildCountMock(2), buildFetchMock(jest.fn()), buildCountMock(2)])

        expect(await screen.findByRole('combobox')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the refresh button', () => {
    describe('WHEN it is clicked after the first sync', () => {
      it('THEN should sync the customers again', async () => {
        const onFetch = jest.fn()

        renderField([
          buildCountMock(0),
          buildFetchMock(onFetch),
          buildCountMock(0),
          buildFetchMock(onFetch),
          buildCountMock(1),
        ])

        await waitFor(() => expect(onFetch).toHaveBeenCalledTimes(1))
        await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled())

        fireEvent.click(screen.getByRole('button'))

        await waitFor(() => expect(onFetch).toHaveBeenCalledTimes(2))
        expect(await screen.findByRole('combobox')).toBeInTheDocument()
      })
    })
  })
})
