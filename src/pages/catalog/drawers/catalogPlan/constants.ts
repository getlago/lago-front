import { CurrencyEnum } from '~/generated/graphql'

export const CATALOG_PLAN_FORM_ID = 'catalog-plan-drawer-form'

export const CATALOG_PLAN_DRAWER_SUBMIT_TEST_ID = 'catalog-plan-drawer-submit'
export const CATALOG_PLAN_DRAWER_SHOW_DESCRIPTION_TEST_ID = 'catalog-plan-drawer-show-description'
export const CATALOG_PLAN_DRAWER_REMOVE_DESCRIPTION_TEST_ID =
  'catalog-plan-drawer-remove-description'

export const VALUE_REQUIRED_KEY = 'text_624ea7c29103fd010732ab7d'

export const CATALOG_PLAN_DRAWER_TITLE_CREATE_KEY = 'text_1789030049528b0qu0hphtg4'
export const CATALOG_PLAN_DRAWER_TITLE_EDIT_KEY = 'text_1789030049528hmelti5lsxj'

export interface CatalogPlanFormValues {
  name: string
  code: string
  currency: CurrencyEnum | undefined
  description: string
  invoiceDisplayName: string
}

export const CATALOG_PLAN_FORM_DEFAULTS: CatalogPlanFormValues = {
  name: '',
  code: '',
  currency: undefined,
  description: '',
  invoiceDisplayName: '',
}
