import { GraphQLFormattedError } from 'graphql'

import { CopyToProductionItemTypeEnum } from '~/generated/graphql'

import {
  getItemTypeKey,
  getRefusalFromErrors,
  getRefusalKey,
  isTargetNotFound,
} from '../copyToProductionErrors'

const ALREADY_EXISTS_KEY = 'text_1795431906433xcd1rme3cdx'
const PARENT_MISSING_KEY = 'text_1795431906433wbhymkx79qb'
const RATE_MISMATCH_KEY = 'text_1795597376102tkbcu8a4f52'
const FILTER_VALUE_MISSING_KEY = 'text_1795630961583o318oscsu8g'
const CUSTOM_AGGREGATION_KEY = 'text_1795632118353nbberbjhk7i'
const FEATURE_UNAVAILABLE_KEY = 'text_1795619366911o3vnwd5udy6'
const UNSUPPORTED_KEY = 'text_1795431906433m4kipo8c27k'
const UNKNOWN_ITEM_TYPE_KEY = 'text_17954414475352pip2ykpd9z'
const PRODUCT_LABEL_KEY = 'text_1795431906434ld1peo7t04a'

const error = (extensions: GraphQLFormattedError['extensions']): GraphQLFormattedError[] => [
  { message: 'error', extensions },
]

const PRODUCT_CATEGORY = {
  itemType: CopyToProductionItemTypeEnum.ProductCategory,
  id: 'category-1',
  code: 'cloud',
}

describe('copyToProductionErrors', () => {
  describe('getRefusalFromErrors', () => {
    it('GIVEN no error code THEN it returns null', () => {
      expect(getRefusalFromErrors([{ message: 'Internal error' }])).toBeNull()
      expect(getRefusalFromErrors(undefined)).toBeNull()
    })

    it('GIVEN a validation error THEN it returns the first nested code and its field', () => {
      expect(
        getRefusalFromErrors(
          error({
            code: 'unprocessable_entity',
            details: { 'rates[0].rateModel': { 0: ['not_allowed_for_product'] } },
          }),
        ),
      ).toEqual({ code: 'not_allowed_for_product', field: 'rates[0].rateModel' })
    })

    it('GIVEN a validation error without a code THEN it returns null', () => {
      expect(getRefusalFromErrors(error({ code: 'unprocessable_entity', details: {} }))).toBeNull()
    })

    it('GIVEN a resource not found THEN it returns the resource as its field', () => {
      expect(
        getRefusalFromErrors(error({ code: 'not_found', details: { privilege: ['not_found'] } })),
      ).toEqual({ code: 'not_found', field: 'privilege' })
    })

    it('GIVEN a forbidden code THEN it returns the code without a field', () => {
      expect(getRefusalFromErrors(error({ code: 'copy_to_production_admin_only' }))).toEqual({
        code: 'copy_to_production_admin_only',
        field: null,
      })
    })

    it('GIVEN a missing parent THEN it names the parent', () => {
      expect(
        getRefusalFromErrors(
          error({
            code: 'copy_to_production_parent_missing',
            details: { itemType: 'product_category', code: 'cloud' },
          }),
        ),
      ).toEqual({
        code: 'copy_to_production_parent_missing',
        parent: { itemType: CopyToProductionItemTypeEnum.ProductCategory, code: 'cloud' },
      })
    })

    it('GIVEN a missing parent of a type it does not know THEN it leaves the type out', () => {
      expect(
        getRefusalFromErrors(
          error({
            code: 'copy_to_production_parent_missing',
            details: { itemType: 'something_new', code: 'x' },
          }),
        ),
      ).toEqual({
        code: 'copy_to_production_parent_missing',
        parent: { itemType: undefined, code: 'x' },
      })
    })
  })

  describe('getRefusalKey', () => {
    it('GIVEN a code mapped for the item type THEN it prefers it', () => {
      expect(
        getRefusalKey({ code: 'feature_unavailable' }, CopyToProductionItemTypeEnum.BillableMetric),
      ).toBe(CUSTOM_AGGREGATION_KEY)
      expect(
        getRefusalKey({ code: 'feature_unavailable' }, CopyToProductionItemTypeEnum.Coupon),
      ).toBe(FEATURE_UNAVAILABLE_KEY)
    })

    it('GIVEN a field THEN it matches its path without indices, then its last key', () => {
      expect(getRefusalKey({ code: 'value_is_invalid', field: 'values[2].value' })).toBe(
        FILTER_VALUE_MISSING_KEY,
      )
      expect(getRefusalKey({ code: 'not_allowed_for_product', field: 'rates[0].rateModel' })).toBe(
        RATE_MISMATCH_KEY,
      )
      expect(getRefusalKey({ code: 'value_already_exist', field: 'code' })).toBe(ALREADY_EXISTS_KEY)
    })

    it('GIVEN a code alone THEN it matches the code', () => {
      expect(getRefusalKey({ code: 'copy_to_production_parent_missing' })).toBe(PARENT_MISSING_KEY)
    })

    it('GIVEN a code it does not know THEN it says the item cannot be copied', () => {
      expect(getRefusalKey({ code: 'something_new', field: 'other' })).toBe(UNSUPPORTED_KEY)
    })
  })

  describe('getItemTypeKey', () => {
    it('THEN it labels known types and falls back to "item"', () => {
      expect(getItemTypeKey(CopyToProductionItemTypeEnum.Product)).toBe(PRODUCT_LABEL_KEY)
      expect(getItemTypeKey(undefined)).toBe(UNKNOWN_ITEM_TYPE_KEY)
    })
  })

  describe('isTargetNotFound', () => {
    it('GIVEN the copied item is not found THEN it is true', () => {
      expect(
        isTargetNotFound(
          PRODUCT_CATEGORY,
          error({ code: 'not_found', details: { productCategory: ['not_found'] } }),
        ),
      ).toBe(true)
      expect(isTargetNotFound(PRODUCT_CATEGORY, error({ code: 'not_found' }))).toBe(true)
    })

    it('GIVEN another resource is not found THEN it is false', () => {
      expect(
        isTargetNotFound(
          PRODUCT_CATEGORY,
          error({ code: 'not_found', details: { productFilter: ['not_found'] } }),
        ),
      ).toBe(false)
    })

    it('GIVEN another error THEN it is false', () => {
      expect(isTargetNotFound(PRODUCT_CATEGORY, error({ code: 'forbidden' }))).toBe(false)
      expect(isTargetNotFound(PRODUCT_CATEGORY, undefined)).toBe(false)
    })
  })
})
