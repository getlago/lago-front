import { EMPTY_SCOPE_ENTRY } from '~/components/scope/scopeEntry'
import { ContractAlertTypeEnum, NotifyOnEnum } from '~/generated/graphql'

import { toScopeKey } from '../alertScope'
import {
  buildContractAlertSchema,
  CONTRACT_ALERT_FORM_DEFAULTS,
  ContractAlertFormValues,
  SCOPE_ALREADY_TAKEN_ERROR,
} from '../validationSchema'

const MANDATORY_ERROR = expect.any(String)

const PRODUCT_SCOPE = {
  type: 'product',
  productCode: 'P',
  productFilterCode: '',
  withProductFilters: false,
}

const threshold = (value: string, recurring = false) => ({
  code: '',
  recurring,
  value,
  notifyOn: [NotifyOnEnum.Triggered],
})

const buildValues = (
  overrides: Partial<ContractAlertFormValues> = {},
): ContractAlertFormValues => ({
  ...CONTRACT_ALERT_FORM_DEFAULTS,
  name: 'Alert',
  code: 'alert',
  alertType: ContractAlertTypeEnum.UsageUnits,
  scope: PRODUCT_SCOPE,
  thresholds: [threshold('10')],
  ...overrides,
})

const getIssues = (values: ContractAlertFormValues, takenKeys: string[] = []) => {
  const result = buildContractAlertSchema(new Set(takenKeys)).safeParse(values)

  return result.success ? [] : result.error.issues.map(({ path, message }) => ({ path, message }))
}

const WHOLE_CONTRACT_KEY = toScopeKey({
  alertType: ContractAlertTypeEnum.UsageAmount,
  withProductFilters: false,
})

describe('buildContractAlertSchema', () => {
  describe('GIVEN complete values', () => {
    it('THEN should pass', () => {
      expect(getIssues(buildValues())).toEqual([])
    })
  })

  describe('GIVEN required fields left empty', () => {
    it.each([
      ['name', { name: '' }, ['name']],
      ['code', { code: '' }, ['code']],
    ])('THEN should flag an empty %s as mandatory', (_, overrides, path) => {
      expect(getIssues(buildValues(overrides))).toEqual([{ path, message: MANDATORY_ERROR }])
    })

    it('THEN should flag an empty alert type', () => {
      expect(getIssues(buildValues({ alertType: '', scope: null }))).toEqual([
        { path: ['alertType'], message: expect.any(String) },
      ])
    })
  })

  describe('GIVEN the scope', () => {
    it.each([
      ['usage units with an empty row', ContractAlertTypeEnum.UsageUnits, EMPTY_SCOPE_ENTRY],
      ['usage units with no row', ContractAlertTypeEnum.UsageUnits, null],
      ['usage amount with an empty row', ContractAlertTypeEnum.UsageAmount, EMPTY_SCOPE_ENTRY],
    ])('WHEN %s THEN should flag the scope', (_, alertType, scope) => {
      expect(getIssues(buildValues({ alertType, scope }))).toEqual([
        { path: ['scope'], message: MANDATORY_ERROR },
      ])
    })

    describe('WHEN usage amount has no row', () => {
      it('THEN should pass while the whole contract is free', () => {
        expect(
          getIssues(buildValues({ alertType: ContractAlertTypeEnum.UsageAmount, scope: null })),
        ).toEqual([])
      })

      it('THEN should flag the scope once the whole contract is taken', () => {
        expect(
          getIssues(buildValues({ alertType: ContractAlertTypeEnum.UsageAmount, scope: null }), [
            WHOLE_CONTRACT_KEY,
          ]),
        ).toEqual([{ path: ['scope'], message: MANDATORY_ERROR }])
      })
    })

    describe('WHEN a filter was added but left empty', () => {
      it('THEN should flag the filter as mandatory', () => {
        expect(
          getIssues(buildValues({ scope: { ...PRODUCT_SCOPE, isFilterAdded: true } })),
        ).toEqual([{ path: ['scope', 'productFilterCode'], message: MANDATORY_ERROR }])
      })

      it('THEN should pass once a filter is picked', () => {
        expect(
          getIssues(
            buildValues({
              scope: { ...PRODUCT_SCOPE, isFilterAdded: true, productFilterCode: 'F' },
            }),
          ),
        ).toEqual([])
      })
    })

    describe('WHEN the picked scope is already taken', () => {
      it.each([
        ['product only', PRODUCT_SCOPE, 'P', null, false],
        [
          'product with all filters',
          { ...PRODUCT_SCOPE, withProductFilters: true },
          'P',
          null,
          true,
        ],
        ['product and filter', { ...PRODUCT_SCOPE, productFilterCode: 'F' }, 'P', 'F', false],
      ])('THEN should flag the product for %s', (_, scope, productCode, productFilterCode, wpf) => {
        const key = toScopeKey({
          alertType: ContractAlertTypeEnum.UsageUnits,
          productCode,
          productFilterCode,
          withProductFilters: wpf,
        })

        expect(getIssues(buildValues({ scope }), [key])).toEqual([
          { path: ['scope', 'productCode'], message: SCOPE_ALREADY_TAKEN_ERROR },
        ])
      })

      it('THEN should ignore a key taken by the other alert type', () => {
        const key = toScopeKey({
          alertType: ContractAlertTypeEnum.UsageAmount,
          productCode: 'P',
          withProductFilters: false,
        })

        expect(getIssues(buildValues(), [key])).toEqual([])
      })
    })
  })

  describe('GIVEN thresholds', () => {
    it('THEN should flag a value not greater than the previous one', () => {
      expect(getIssues(buildValues({ thresholds: [threshold('10'), threshold('10')] }))).toEqual([
        { path: ['thresholds', 1, 'value'], message: expect.any(String) },
      ])
    })

    it('THEN should flag a value lower than the previous one', () => {
      expect(
        getIssues(buildValues({ thresholds: [threshold('10'), threshold('20'), threshold('15')] })),
      ).toEqual([{ path: ['thresholds', 2, 'value'], message: expect.any(String) }])
    })

    it('THEN should flag a recurring value of zero', () => {
      expect(
        getIssues(buildValues({ thresholds: [threshold('10'), threshold('0', true)] })),
      ).toEqual([{ path: ['thresholds', 1, 'value'], message: 'text_1795802708078t9ythhvdvd5' }])
    })

    it('THEN should accept a recurring value lower than the last threshold', () => {
      expect(
        getIssues(buildValues({ thresholds: [threshold('10'), threshold('5', true)] })),
      ).toEqual([])
    })

    it('THEN should flag an empty value', () => {
      expect(getIssues(buildValues({ thresholds: [threshold('')] }))).toEqual([
        { path: ['thresholds', 0, 'value'], message: expect.any(String) },
      ])
    })

    it('THEN should flag a missing code when notifying on resolve', () => {
      const issues = getIssues(
        buildValues({
          thresholds: [
            { ...threshold('10'), notifyOn: [NotifyOnEnum.Triggered, NotifyOnEnum.Resolved] },
          ],
        }),
      )

      expect(issues).toEqual([{ path: ['thresholds', 0, 'code'], message: expect.any(String) }])
    })
  })
})
