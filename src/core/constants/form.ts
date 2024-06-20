import { CouponFrequency, CouponTypeEnum, MembershipRole, PlanInterval } from '~/generated/graphql'

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
export const SEARCH_TAX_INPUT_FOR_MIN_COMMITMENT_CLASSNAME = 'searchTaxForMinCommitmentInput'
export const SEARCH_FILTER_FOR_CHARGE_CLASSNAME = 'searchFilterForChargeInput'
export const ONE_TIER_EXAMPLE_UNITS = 10
// AddOns
export const SEARCH_TAX_INPUT_FOR_ADD_ON_CLASSNAME = 'searchTaxForAddOnInput'
// Invoices
export const SEARCH_TAX_INPUT_FOR_INVOICE_ADD_ON_CLASSNAME = 'searchTaxForInvoiceAddOnInput'
export const ADD_ITEM_FOR_INVOICE_INPUT_NAME = 'addItemInput'
// Customer
export const SEARCH_TAX_INPUT_FOR_CUSTOMER_CLASSNAME = 'searchTaxForCustomerInput'
export const ADD_CUSTOMER_PAYMENT_PROVIDER_ACCORDION = 'addCustomerPaymentProviderAccordion'
export const ADD_CUSTOMER_ACCOUNTING_PROVIDER_ACCORDION = 'addCustomerAccountingProviderAccordion'
export const ADD_CUSTOMER_TAX_PROVIDER_ACCORDION = 'addCustomerTaxProviderAccordion'

/**** DATA ****/
// Plan form types
export const FORM_TYPE_ENUM = {
  creation: 'creation',
  edition: 'edition',
  duplicate: 'duplicate',
  upgradeDowngrade: 'upgradeDowngrade',
} as const
// Filters
export const ALL_FILTER_VALUES = '__ALL_FILTER_VALUES__'

/**** Translations ****/
export const getIntervalTranslationKey = {
  [PlanInterval.Monthly]: 'text_624453d52e945301380e49aa',
  [PlanInterval.Quarterly]: 'text_64d6357b00dea100ad1cb9e9',
  [PlanInterval.Weekly]: 'text_62b32ec6b0434070791c2d4c',
  [PlanInterval.Yearly]: 'text_624453d52e945301380e49ac',
}

export const getCouponTypeTranslationKey = {
  [CouponTypeEnum.FixedAmount]: 'text_632d68358f1fedc68eed3e60',
  [CouponTypeEnum.Percentage]: 'text_632d68358f1fedc68eed3e66',
}

export const getCouponFrequencyTranslationKey = {
  [CouponFrequency.Once]: 'text_632d68358f1fedc68eed3ea3',
  [CouponFrequency.Recurring]: 'text_632d68358f1fedc68eed3e64',
  [CouponFrequency.Forever]: 'text_63c83a3476e46bc6ab9d85d6',
}

export const getRoleTranslationKey = {
  [MembershipRole.Admin]: 'text_664f035a68227f00e261b7ee',
  [MembershipRole.Finance]: 'text_664f035a68227f00e261b7f2',
  [MembershipRole.Manager]: 'text_664f035a68227f00e261b7f0',
}
