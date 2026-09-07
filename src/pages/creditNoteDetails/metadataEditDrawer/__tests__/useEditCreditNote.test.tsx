import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook, waitFor } from '@testing-library/react'

import {
  CurrencyEnum,
  EditCreditNoteDocument,
  GetCreditNoteForDetailsDocument,
  GetCreditNoteForDetailsQuery,
  UpdateCreditNoteInput,
  useGetCreditNoteForDetailsQuery,
} from '~/generated/graphql'

import { useEditCreditNote } from '../useEditCreditNote'

const creditNote: NonNullable<GetCreditNoteForDetailsQuery['creditNote']> = {
  __typename: 'CreditNote',
  id: 'credit-note-1',
  number: 'CN-001',
  canBeVoided: true,
  totalAmountCents: '10000',
  creditAmountCents: '10000',
  refundAmountCents: '0',
  offsetAmountCents: '0',
  currency: CurrencyEnum.Usd,
  integrationSyncable: false,
  taxProviderSyncable: false,
  externalIntegrationId: null,
  taxProviderId: null,
  xmlUrl: null,
  refundStatus: null,
  metadata: [{ __typename: 'ItemMetadata', key: 'reference', value: 'original' }],
  billingEntity: {
    __typename: 'BillingEntity',
    id: 'billing-entity-1',
    name: 'Billing Entity',
    email: null,
    einvoicing: false,
    emailSettings: [],
    logoUrl: null,
  },
  customer: {
    __typename: 'Customer',
    id: 'customer-1',
    email: null,
    anrokCustomer: null,
    avalaraCustomer: null,
    netsuiteCustomer: null,
    xeroCustomer: null,
  },
}

describe('useEditCreditNote', () => {
  it('refetches active credit-note details after metadata is saved', async () => {
    const input: UpdateCreditNoteInput = {
      id: creditNote.id,
      metadata: [{ key: 'reference', value: 'updated' }],
    }
    const updatedCreditNote = { ...creditNote, metadata: input.metadata }
    const detailsResult = jest
      .fn()
      .mockReturnValueOnce({ data: { creditNote } })
      .mockReturnValueOnce({ data: { creditNote: updatedCreditNote } })
    const mutationResult = jest.fn().mockReturnValue({
      data: { updateCreditNote: { __typename: 'CreditNote', id: creditNote.id } },
    })
    const detailsMock: MockedResponse<GetCreditNoteForDetailsQuery> = {
      request: { query: GetCreditNoteForDetailsDocument, variables: { id: creditNote.id } },
      result: detailsResult,
    }
    const { result } = renderHook(
      () => ({
        ...useEditCreditNote(),
        details: useGetCreditNoteForDetailsQuery({ variables: { id: creditNote.id } }),
      }),
      {
        wrapper: ({ children }) => (
          <MockedProvider
            mocks={[
              detailsMock,
              { ...detailsMock },
              {
                request: { query: EditCreditNoteDocument, variables: { input } },
                result: mutationResult,
                delay: 50,
              },
            ]}
          >
            {children}
          </MockedProvider>
        ),
      },
    )

    expect(result.current.isUpdatingCreditNote).toBe(false)
    await waitFor(() =>
      expect(result.current.details.data?.creditNote?.metadata).toEqual(creditNote.metadata),
    )
    expect(detailsResult).toHaveBeenCalledTimes(1)

    let mutation: ReturnType<typeof result.current.updateCreditNote>

    act(() => {
      mutation = result.current.updateCreditNote({ variables: { input } })
    })
    await waitFor(() => expect(result.current.isUpdatingCreditNote).toBe(true))
    await act(async () => {
      await mutation
    })

    await waitFor(() => {
      expect(detailsResult).toHaveBeenCalledTimes(2)
      expect(result.current.details.data?.creditNote?.metadata).toEqual(input.metadata)
    })
    expect(mutationResult).toHaveBeenCalledTimes(1)
    expect(result.current.isUpdatingCreditNote).toBe(false)
  })
})
