import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'

import { CustomerConnectionDrawerFormApi } from '~/components/customerConnections/CustomerConnectionDrawer'
import {
  FetchQuickbooksCustomerItemsDocument,
  GetQuickbooksCustomerItemsCountDocument,
  GetQuickbooksCustomerItemsDocument,
  IntegrationItemTypeEnum,
} from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { QuickbooksCustomerIdField } from '../QuickbooksCustomerIdField'
import { QUICKBOOKS_CUSTOMER_ITEMS_LIMIT } from '../useQuickbooksCustomerItems'

const mockHasPermissions = jest.fn()

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

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

const buildItemsMock = (searchTerm: string | undefined, externalIds: string[]) => ({
  request: {
    query: GetQuickbooksCustomerItemsDocument,
    variables: {
      searchTerm,
      integrationId: INTEGRATION_ID,
      itemType: IntegrationItemTypeEnum.Customer,
      limit: QUICKBOOKS_CUSTOMER_ITEMS_LIMIT,
    },
  },
  result: {
    data: {
      integrationItems: {
        __typename: 'IntegrationItemCollection',
        collection: externalIds.map((externalId) => ({
          __typename: 'IntegrationItem',
          id: `item-${externalId}`,
          externalId,
          externalName: `Customer ${externalId}`,
        })),
      },
    },
  },
})

const Harness = ({ onSubmit }: { onSubmit: (values: { externalCustomerId: string }) => void }) => {
  const form = useAppForm({
    defaultValues: { externalCustomerId: '' },
    onSubmit: ({ value }) => onSubmit(value),
  })

  return (
    <>
      <QuickbooksCustomerIdField
        form={form as unknown as CustomerConnectionDrawerFormApi}
        integrationId={INTEGRATION_ID}
        connectionName="QuickBooks"
      />
      <button type="button" data-test="submit" onClick={() => form.handleSubmit()} />
    </>
  )
}

const renderField = (mocks: TestMocksType, onSubmit = jest.fn()) =>
  render(
    <StrictMode>
      <AllTheProviders mocks={mocks} forceTypenames>
        <Harness onSubmit={onSubmit} />
      </AllTheProviders>
    </StrictMode>,
  )

const externalIdInput = (container: HTMLElement) =>
  container.querySelector('input[name="externalCustomerId"]')

describe('QuickbooksCustomerIdField', () => {
  beforeEach(() => {
    mockHasPermissions.mockReturnValue(true)
  })

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

  describe('GIVEN a stored list that misses the customer', () => {
    describe('WHEN its id is typed with Enter and the form is submitted', () => {
      it('THEN should submit the typed id as the external customer id', async () => {
        const onSubmit = jest.fn()
        const { container } = renderField(
          [
            buildCountMock(2),
            buildFetchMock(jest.fn()),
            buildCountMock(2),
            buildItemsMock(undefined, ['58', '59']),
            buildItemsMock(undefined, ['58', '59']),
            buildItemsMock('9001', []),
          ],
          onSubmit,
        )

        const combobox = await screen.findByRole('combobox')

        await userEvent.click(combobox)
        await userEvent.type(combobox, '9001{Enter}')

        await waitFor(() => expect(combobox).toHaveValue('9001'))

        fireEvent.click(container.querySelector('[data-test="submit"]') as HTMLElement)

        await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ externalCustomerId: '9001' }))
      })
    })
  })

  describe('GIVEN the refresh button', () => {
    describe('WHEN it is clicked after the first sync', () => {
      it('THEN should sync the customers again', async () => {
        const onFetch = jest.fn()

        const { container } = renderField([
          buildCountMock(0),
          buildFetchMock(onFetch),
          buildCountMock(0),
          buildFetchMock(onFetch),
          buildCountMock(1),
        ])

        await waitFor(() => expect(onFetch).toHaveBeenCalledTimes(1))
        expect(container.querySelector('[data-test^="reload"]')).toBeInTheDocument()
        const reloadButton = () =>
          container.querySelector('[data-test^="reload"]')?.closest('button') as HTMLElement

        await waitFor(() => expect(reloadButton()).not.toBeDisabled())

        fireEvent.click(reloadButton())

        await waitFor(() => expect(onFetch).toHaveBeenCalledTimes(2))
        expect(await screen.findByRole('combobox')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a member who cannot update integrations', () => {
    describe('WHEN the field renders', () => {
      it('THEN should hide the refresh button', async () => {
        mockHasPermissions.mockImplementation(
          (permissions: string[]) => !permissions.includes('organizationIntegrationsUpdate'),
        )

        const { container } = renderField([buildCountMock(2)])

        expect(await screen.findByRole('combobox')).toBeInTheDocument()
        expect(container.querySelector('[data-test^="reload"]')).not.toBeInTheDocument()
      })
    })
  })
})
