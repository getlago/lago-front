import { MockedResponse } from '@apollo/client/testing'

import {
  BillingEntityDocumentNumberingEnum,
  BillingEntityItemFragment,
  CurrencyEnum,
  GetBillingEntitiesDocument,
  GetBillingEntitiesQuery,
} from '~/generated/graphql'

export const buildBillingEntity = (
  overrides: Partial<BillingEntityItemFragment> = {},
): BillingEntityItemFragment => ({
  __typename: 'BillingEntity',
  id: 'entity-id',
  code: 'entity-code',
  name: 'Entity name',
  documentNumbering: BillingEntityDocumentNumberingEnum.PerCustomer,
  documentNumberPrefix: 'INV',
  logoUrl: null,
  legalName: null,
  legalNumber: null,
  taxIdentificationNumber: null,
  email: null,
  phone: null,
  addressLine1: null,
  addressLine2: null,
  zipcode: null,
  city: null,
  state: null,
  country: null,
  emailSettings: [],
  timezone: null,
  isDefault: false,
  defaultCurrency: CurrencyEnum.Usd,
  euTaxManagement: false,
  einvoicing: false,
  selectedInvoiceCustomSections: [],
  appliedDunningCampaign: null,
  ...overrides,
})

export const emptyBillingEntitiesMock: MockedResponse<GetBillingEntitiesQuery> = {
  request: { query: GetBillingEntitiesDocument, variables: {} },
  result: { data: { billingEntities: { collection: [] } } },
}
