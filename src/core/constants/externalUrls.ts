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
export const buildNetsuiteCreditNoteUrl = (
  connectionAccountId?: string | null,
  netsuiteCreditNoteId?: string | null,
) => {
  return `https://${connectionAccountId}.app.netsuite.com/app/accounting/transactions/custcred.nl?id=${netsuiteCreditNoteId}`
}
