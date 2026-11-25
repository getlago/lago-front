import { ApolloClient, InMemoryCache } from '@apollo/client'
import { MockLink } from '@apollo/client/testing'
import { screen } from '@testing-library/react'
import { visit } from 'graphql'

import { InvoiceDetailsTableBodyLine } from '~/components/invoices/details/InvoiceDetailsTableBodyLine'
import { FeeMetadata } from '~/core/formats/formatInvoiceItemsMap'
import {
  CurrencyEnum,
  FeeAppliedTaxesForInvoiceDetailsFragment,
  FeeAppliedTaxesForInvoiceDetailsFragmentDoc,
  FeeForInvoiceDetailsTableBodyLineFragment,
  FeeTypesEnum,
  GetInvoiceDetailsDocument,
  GetInvoiceFeesDocument,
  RefreshInvoiceDocument,
} from '~/generated/graphql'
import { render } from '~/test-utils'

jest.mock('~/components/invoices/details/ViewFeeDetailsDrawer', () => ({
  useViewFeeDetailsDrawer: () => ({ open: jest.fn() }),
}))
jest.mock('~/components/invoices/details/DeleteAdjustedFeeDialog', () => ({
  useDeleteAdjustedFeeDialog: () => ({ openDeleteAdjustedFeeDialog: jest.fn() }),
}))

describe('GIVEN the invoice GraphQL documents', () => {
  it('THEN never selects the full fee list through any details fragment', () => {
    const fields: string[] = []

    visit(GetInvoiceDetailsDocument, {
      Field: ({ name }) => {
        fields.push(name.value)
      },
    })
    expect(fields).not.toContain('fees')
    expect(fields).toContain('appliedTaxes')
    expect(fields).toContain('invoiceSubscriptions')
  })

  it('THEN makes the legacy refresh fee selection conditional', () => {
    const directives: string[] = []

    visit(RefreshInvoiceDocument, {
      Field: (field) => {
        if (field.name.value === 'fees')
          directives.push(...(field.directives ?? []).map(({ name }) => name.value))
      },
    })
    expect(directives).toContain('include')
  })

  it('THEN renders V1 applied taxes fetched into a cold cache by the fees query alone', async () => {
    const cache = new InMemoryCache()
    const fee = {
      __typename: 'Fee',
      id: 'fee-tax',
      amountCents: '1000',
      currency: CurrencyEnum.Usd,
      feeType: FeeTypesEnum.AddOn,
      itemName: 'Service',
      itemCode: 'service',
      itemType: 'AddOn',
      units: 1,
      preciseUnitAmount: 10,
      properties: null,
      charge: null,
      appliedTaxes: [
        {
          __typename: 'FeeAppliedTax',
          id: 'applied-tax',
          taxCode: 'vat',
          taxRate: 20,
          tax: { __typename: 'Tax', id: 'tax-1', code: 'vat', name: 'VAT', rate: 20 },
        },
      ],
    }
    const client = new ApolloClient({
      cache,
      link: new MockLink([
        {
          request: { query: GetInvoiceFeesDocument, variables: { id: 'invoice-1' } },
          result: { data: { invoice: { __typename: 'Invoice', id: 'invoice-1', fees: [fee] } } },
        },
      ]),
    })

    expect(cache.extract()).toEqual({})
    await client.query({ query: GetInvoiceFeesDocument, variables: { id: 'invoice-1' } })
    const cachedTaxes = cache.readFragment<FeeAppliedTaxesForInvoiceDetailsFragment>({
      id: 'Fee:fee-tax',
      fragment: FeeAppliedTaxesForInvoiceDetailsFragmentDoc,
    })

    expect(cachedTaxes?.appliedTaxes?.[0]).toMatchObject({
      taxCode: 'vat',
      taxRate: 20,
      tax: { code: 'vat', rate: 20 },
    })
    const row = {
      ...fee,
      ...cachedTaxes,
      metadata: {},
    } as FeeForInvoiceDetailsTableBodyLineFragment & { metadata: FeeMetadata }

    render(
      <table>
        <tbody>
          <InvoiceDetailsTableBodyLine
            fee={row}
            currency={CurrencyEnum.Usd}
            displayName="Service"
            canHaveUnitPrice={true}
            isDraftInvoice={false}
          />
        </tbody>
      </table>,
    )
    expect(screen.getByRole('row')).toHaveTextContent('20.00%')
    client.stop()
  })
})
