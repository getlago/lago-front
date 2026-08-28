import getPropertyShape from '~/core/serializers/getPropertyShape'
import {
  PropertiesInput,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
} from '~/generated/graphql'

export const RATE_CARD_RATE_FORM_ID = 'rateCardRateForm'

export const RATE_CARD_RATE_FORM_SUBMIT_TEST_ID = 'rate-card-rate-form-submit'

export const VALUE_REQUIRED_KEY = 'text_624ea7c29103fd010732ab7d' // "Value is mandatory to move forward"

export const RATE_CARD_RATE_EFFECTIVE_DATE_LABEL_KEY = 'text_1787737220227bfxpshdo133'
export const RATE_CARD_RATE_EFFECTIVE_DATE_DESCRIPTION_KEY = 'text_1787737220227auyye6x3cr0'
export const RATE_CARD_RATE_EFFECTIVE_DATE_AFTER_ACTIVE_KEY = 'text_1787737220227ti37lv0cu28'
export const RATE_CARD_RATE_BILLING_INTERVAL_LABEL_KEY = 'text_1787737220227tqziocrcywv'
export const RATE_CARD_RATE_BILLING_INTERVAL_DESCRIPTION_KEY = 'text_1787737220227zq85vxlw0aq'
export const RATE_CARD_RATE_MODEL_LABEL_KEY = 'text_17877372202270yaq0vyqria'

// Shared by the drawer, the rates tab, the row actions and the details page.
export const RATE_CARD_RATE_DRAWER_TITLE_CREATE_KEY = 'text_1787737220227lhrw4x3r4h8'
export const RATE_CARD_RATE_DRAWER_TITLE_EDIT_KEY = 'text_1787737220227dhuxfszp0v6'
export const RATE_CARD_RATE_DRAWER_DESCRIPTION_KEY = 'text_17877372202276uc54jqy1np'
export const RATE_CARD_RATES_SECTION_TITLE_KEY = 'text_1784930705742tg0kbcsak2v'
export const RATE_CARD_RATE_VIEW_ACTION_KEY = 'text_1787737220228sypguqmiv1l'
export const RATE_CARD_RATE_DUPLICATE_DATE_KEY = 'text_1787753924848luck8g8y1qd'
export const RATE_CARD_RATE_SAVE_FAILED_KEY = 'text_1787753924848adhyrzqb0gz'
export const RATE_CARD_RATE_DELETE_ACTION_KEY = 'text_1787737220228txu8nd2qayi'

// Refetched after any rate write. The rate's own details query is deliberately absent:
// refetching a deleted rate would answer 404.
export const RATE_CARD_RATE_DEPENDENT_QUERIES = [
  'rateCardRates',
  'getRateCardForDetails',
  'rateCards',
  'getRateCardsForProductDetails',
  'getRateCardsForProductFilterDetails',
]

export const BILLING_INTERVAL_UNIT_TRANSLATION_KEY: Record<
  RateCardRateBillingIntervalUnitEnum,
  string
> = {
  [RateCardRateBillingIntervalUnitEnum.Day]: 'text_1787737220227aguxuoxtf61',
  [RateCardRateBillingIntervalUnitEnum.Week]: 'text_1787737220227assiqlb0so6',
  [RateCardRateBillingIntervalUnitEnum.Month]: 'text_1787737220227gl11bsf4our',
  [RateCardRateBillingIntervalUnitEnum.Year]: 'text_1787737220227766n4sxclwx',
}

export interface RateCardRateFormValues {
  effectiveFrom: string
  code: string
  billingIntervalCount: string
  billingIntervalUnit: RateCardRateBillingIntervalUnitEnum
  conversionRate: string
  rateModel: RateCardRateModelEnum
  properties?: PropertiesInput
  minAmountCents: string
}

export const RATE_CARD_RATE_FORM_DEFAULTS: RateCardRateFormValues = {
  effectiveFrom: '',
  code: '',
  billingIntervalCount: '1',
  billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
  conversionRate: '',
  rateModel: RateCardRateModelEnum.Standard,
  properties: getPropertyShape({}),
  minAmountCents: '',
}
