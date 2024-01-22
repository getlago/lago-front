import { PlanInterval } from '~/generated/graphql'

/**** Errors ****/
export enum FORM_ERRORS_ENUM {
  existingCode = 'existingCode',
  invalidGroupValue = 'invalidGroupValue',
}
export const dateErrorCodes = {
  wrongFormat: 'wrongFormat',
  shouldBeInFuture: 'shouldBeInFuture',
  shouldBeFutureAndBiggerThanSubscriptionAt: 'shouldBeFutureAndBiggerThanSubscriptionAt',
} as const
export const MIN_AMOUNT_SHOULD_BE_LOWER_THAN_MAX_ERROR = 'minAmountShouldBeLowerThanMax'

/**** Selectors ****/
export const MUI_INPUT_BASE_ROOT_CLASSNAME = 'MuiInputBase-root'
export const MUI_BUTTON_BASE_ROOT_CLASSNAME = 'MuiButtonBase-root'
// Plans
export const SEARCH_METERED_CHARGE_INPUT_CLASSNAME = 'searchMeteredChargeInput'
export const SEARCH_RECURRING_CHARGE_INPUT_CLASSNAME = 'searchRecurringChargeInput'
export const SEARCH_TAX_INPUT_FOR_PLAN_CLASSNAME = 'searchTaxForPlanInput'
export const SEARCH_TAX_INPUT_FOR_CHARGE_CLASSNAME = 'searchTaxForChargeInput'
export const SEARCH_CHARGE_GROUP_INPUT_CLASSNAME = 'searchChargeGroupInputClassname'
export const ONE_TIER_EXAMPLE_UNITS = 10
// AddOns
export const SEARCH_TAX_INPUT_FOR_ADD_ON_CLASSNAME = 'searchTaxForAddOnInput'
// Invoices
export const SEARCH_TAX_INPUT_FOR_INVOICE_ADD_ON_CLASSNAME = 'searchTaxForInvoiceAddOnInput'
export const ADD_ITEM_FOR_INVOICE_INPUT_NAME = 'addItemInput'
// Customer
export const SEARCH_TAX_INPUT_FOR_CUSTOMER_CLASSNAME = 'searchTaxForCustomerInput'

export const FORM_TYPE_ENUM = {
  creation: 'creation',
  edition: 'edition',
  duplicate: 'duplicate',
  upgradeDowngrade: 'upgradeDowngrade',
} as const

/**** Translations ****/
export const getIntervalTranslationKey = {
  [PlanInterval.Monthly]: 'text_624453d52e945301380e49aa',
  [PlanInterval.Quarterly]: 'text_64d6357b00dea100ad1cb9e9',
  [PlanInterval.Weekly]: 'text_62b32ec6b0434070791c2d4c',
  [PlanInterval.Yearly]: 'text_624453d52e945301380e49ac',
  [PlanInterval.Daily]: 'Daily',
}
