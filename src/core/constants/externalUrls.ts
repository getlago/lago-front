import { HubspotTargetedObjectsEnum } from '~/generated/graphql'

export const DOCUMENTATION_URL = 'https://docs.getlago.com/'
export const LAGO_TAX_DOCUMENTATION_URL =
  'https://docs.getlago.com/integrations/taxes/lago-eu-taxes'
export const DOCUMENTATION_AIRBYTE = 'https://docs.airbyte.com/integrations/sources/getlago/'
export const DOCUMENTATION_SEGMENT = 'https://docs.getlago.com/integrations/usage/segment'
export const DOCUMENTATION_HIGHTTOUCH = 'https://docs.getlago.com/integrations/usage/hightouch'
export const DOCUMENTATION_OSO =
  'https://www.osohq.com/docs/guides/model-your-apps-authz#entitlements'
export const DOCUMENTATION_ENV_VARS =
  'https://docs.getlago.com/guide/self-hosted/docker#environment-variables'
export const FEATURE_REQUESTS_URL = 'https://getlago.canny.io/feature-requests'
export const ADYEN_SUCCESS_LINK_SPEC_URL =
  'https://docs.adyen.com/api-explorer/Checkout/latest/post/payments#request-returnUrl'
export const ROLE_ACCESS_LEVEL_DOC_URL = 'https://getlago.com/docs/guide/security/rbac'
export const PROGRESSIVE_BILLING_DOC_URL =
  'https://getlago.com/docs/guide/plans/progressive-billing'
export const buildNetsuiteCustomerUrl = (
  connectionAccountId?: string | null,
  netsuiteCustomerId?: string | null,
) => {
  return `https://${connectionAccountId}.app.netsuite.com/app/common/entity/custjob.nl?id=${netsuiteCustomerId}`
}
export const buildNetsuiteInvoiceUrl = (
  connectionAccountId?: string | null,
  netsuiteInvoiceId?: string | null,
) => {
  return `https://${connectionAccountId}.app.netsuite.com/app/accounting/transactions/custinvc.nl?id=${netsuiteInvoiceId}`
}
export const buildAnrokInvoiceUrl = (
  connectionAccountId?: string | null,
  anrokInvoiceId?: string | null,
) => {
  return `https://app.anrok.com/${connectionAccountId}/transactions/${anrokInvoiceId}`
}
export const buildAnrokCreditNoteUrl = (
  connectionAccountId?: string | null,
  anrokTaxProviderId?: string | null,
) => {
  return `https://app.anrok.com/${connectionAccountId}/transactions/${anrokTaxProviderId}`
}
export const buildNetsuiteCreditNoteUrl = (
  connectionAccountId?: string | null,
  netsuiteCreditNoteId?: string | null,
) => {
  return `https://${connectionAccountId}.app.netsuite.com/app/accounting/transactions/custcred.nl?id=${netsuiteCreditNoteId}`
}
export const buildGocardlessAuthUrl = (proxyUrl: string, lagoName: string, lagoCode: string) => {
  return `${proxyUrl}/gocardless/auth?lago_name=${lagoName}&lago_code=${lagoCode}`
}
export const buildAnrokCustomerUrl = (
  connectionAccountId?: string | null,
  anrokCustomerId?: string | null,
) => {
  return `https://app.anrok.com/${connectionAccountId}/customers/${anrokCustomerId}`
}
export const buildXeroCustomerUrl = (xeroCustomerId?: string | null) => {
  return `https://go.xero.com/app/contacts/contact/${xeroCustomerId}`
}
export const buildXeroInvoiceUrl = (xeroInvoiceId?: string | null) => {
  return `https://go.xero.com/app/invoicing/view/${xeroInvoiceId}`
}
export const buildXeroCreditNoteUrl = (xeroCreditNoteId?: string | null) => {
  return `https://go.xero.com/AccountsReceivable/ViewCreditNote.aspx?creditNoteID=${xeroCreditNoteId}`
}
export const buildHubspotObjectUrl = ({
  portalId,
  objectId,
  targetedObject,
}: {
  portalId: string
  objectId: string
  targetedObject: HubspotTargetedObjectsEnum
}) => {
  const targetedObjectMap = {
    [HubspotTargetedObjectsEnum.Contacts]: '0-1',
    [HubspotTargetedObjectsEnum.Companies]: '0-2',
  }

  return `https://app.hubspot.com/contacts/${portalId}/record/${targetedObjectMap[targetedObject]}/${objectId}`
}

export const buildHubspotInvoiceUrl = ({
  portalId,
  resourceId,
  externalCrmIntegrationId,
}: {
  portalId?: string | null
  resourceId?: string | null
  externalCrmIntegrationId?: string | null
}) => {
  return `https://app.hubspot.com/contacts/${portalId}/record/${resourceId}/${externalCrmIntegrationId}`
}

export const buildSalesforceUrl = ({
  instanceId,
  externalCustomerId,
}: {
  instanceId: string
  externalCustomerId: string
}) => {
  // Remove last slash if it exists
  const baseUrl = instanceId.replace(RegExp('/$'), '')

  return `${baseUrl}/${externalCustomerId}`
}
