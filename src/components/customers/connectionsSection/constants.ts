import { ProviderPaymentMethodsEnum } from '~/generated/graphql'

export const CUSTOMER_CONNECTIONS_SECTION_TEST_ID = 'customer-connections-section'
export const CONNECTION_DETAILS_PANEL_TEST_ID = 'connection-details-panel'
export const CONNECTION_DETAILS_EDIT_TEST_ID = 'connection-details-edit'
export const CONNECTION_EXTERNAL_LINK_TEST_ID = 'external-integration-link'

export const ADD_PAYMENT_METHOD_TEST_ID = 'add-payment-method-dialog'
export const INELIGIBLE_PAYMENT_METHODS_TEST_ID = 'ineligible-payment-methods-text'
export const PAYMENT_METHODS_LIST_TEST_ID = 'payment-methods-list'

export const PaymentProviderMethodTranslationsLookup: Record<ProviderPaymentMethodsEnum, string> = {
  [ProviderPaymentMethodsEnum.BacsDebit]: 'text_65e1f90471bc198c0c934d92',
  [ProviderPaymentMethodsEnum.Card]: 'text_64aeb7b998c4322918c84208',
  [ProviderPaymentMethodsEnum.Link]: 'text_6686b316b672a6e75a29eea0',
  [ProviderPaymentMethodsEnum.SepaDebit]: 'text_64aeb7b998c4322918c8420c',
  [ProviderPaymentMethodsEnum.UsBankAccount]: 'text_65e1f90471bc198c0c934d8e',
  [ProviderPaymentMethodsEnum.Boleto]: 'text_1738234109827diqh4eswleu',
  [ProviderPaymentMethodsEnum.Crypto]: 'text_17394287699017cunbdlhnhf',
  [ProviderPaymentMethodsEnum.CustomerBalance]: 'text_1739432510045wh80q1wdt4z',
}
