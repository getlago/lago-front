import { EMPTY_SCOPE_ENTRY } from '~/components/scope/scopeEntry'
import {
  ContractAlertForDrawerFragment,
  ContractAlertScopeTypeEnum,
  ContractAlertTypeEnum,
  CurrencyEnum,
  NotifyOnEnum,
} from '~/generated/graphql'

import { mapFromApiToForm, mapFromFormToApi, ValidatedContractAlertFormValues } from '../mappers'

const THRESHOLD = {
  code: '',
  recurring: false,
  value: '',
  notifyOn: [NotifyOnEnum.Triggered],
}

const buildValues = (
  overrides: Partial<ValidatedContractAlertFormValues> = {},
): ValidatedContractAlertFormValues => ({
  name: 'Alert',
  code: 'alert',
  alertType: ContractAlertTypeEnum.UsageUnits,
  scope: null,
  thresholds: [{ ...THRESHOLD, value: '10' }],
  ...overrides,
})

const buildAlert = (
  overrides: Partial<ContractAlertForDrawerFragment> = {},
): ContractAlertForDrawerFragment => ({
  id: 'alert-1',
  name: 'Alert',
  code: 'alert',
  alertType: ContractAlertTypeEnum.UsageUnits,
  scope: [],
  thresholds: [],
  ...overrides,
})

const PRODUCT = { id: 'product-id', name: 'Product', code: 'P' }
const FILTER = { id: 'filter-id', name: 'Filter', code: 'F' }
const CONTRACT_SCOPE = ContractAlertScopeTypeEnum.Contract

const CREATE = { kind: 'create', contractId: 'contract-1', currency: CurrencyEnum.Eur } as const

describe('contract alert mappers', () => {
  describe('GIVEN form values to send', () => {
    describe('WHEN creating a usage amount alert', () => {
      it('THEN should serialize the threshold to cents', () => {
        const input = mapFromFormToApi(
          buildValues({
            alertType: ContractAlertTypeEnum.UsageAmount,
            thresholds: [{ ...THRESHOLD, value: '10.5' }],
          }),
          CREATE,
        )

        expect(input.thresholds[0].value).toBe('1050')
      })
    })

    describe('WHEN creating a usage units alert', () => {
      it('THEN should send the units value as typed', () => {
        const input = mapFromFormToApi(
          buildValues({ thresholds: [{ ...THRESHOLD, value: '10.12345' }] }),
          CREATE,
        )

        expect(input.thresholds[0].value).toBe('10.12345')
      })

      it('THEN should never notify a recurring threshold when resolved', () => {
        const input = mapFromFormToApi(
          buildValues({
            thresholds: [
              { ...THRESHOLD, value: '10', notifyOn: [] },
              {
                ...THRESHOLD,
                value: '5',
                recurring: true,
                notifyOn: [NotifyOnEnum.Triggered, NotifyOnEnum.Resolved],
              },
            ],
          }),
          CREATE,
        )

        expect(input.thresholds.map(({ notifyOn }) => notifyOn)).toEqual([
          [NotifyOnEnum.Triggered],
          [NotifyOnEnum.Triggered],
        ])
      })
    })

    describe('WHEN updating an alert', () => {
      it('THEN should send exactly the id, name and thresholds', () => {
        const input = mapFromFormToApi(buildValues(), {
          kind: 'update',
          id: 'alert-1',
          currency: CurrencyEnum.Eur,
        })

        expect(Object.keys(input).sort()).toEqual(['id', 'name', 'thresholds'])
      })
    })

    describe('WHEN mapping the scope', () => {
      it.each([
        ['no scope', null, []],
        ['an empty row', EMPTY_SCOPE_ENTRY, []],
        [
          'a product with all its filters',
          { type: 'product', productCode: 'P', productFilterCode: '', withProductFilters: true },
          [{ type: CONTRACT_SCOPE, productCode: 'P', withProductFilters: true }],
        ],
        [
          'a product alone',
          { type: 'product', productCode: 'P', productFilterCode: '', withProductFilters: false },
          [{ type: CONTRACT_SCOPE, productCode: 'P', withProductFilters: false }],
        ],
        [
          'a product and one filter',
          { type: 'product', productCode: 'P', productFilterCode: 'F', withProductFilters: false },
          [{ type: CONTRACT_SCOPE, productCode: 'P', productFilterCodes: ['F'] }],
        ],
        [
          'a product and one filter with the checkbox stale on',
          { type: 'product', productCode: 'P', productFilterCode: 'F', withProductFilters: true },
          [{ type: CONTRACT_SCOPE, productCode: 'P', productFilterCodes: ['F'] }],
        ],
      ])('THEN should map %s', (_, scope, expected) => {
        const input = mapFromFormToApi(buildValues({ scope }), CREATE)

        expect(input.scope).toStrictEqual(expected)
      })
    })
  })

  describe('GIVEN an alert from the API', () => {
    describe('WHEN its thresholds are in units', () => {
      it('THEN should strip trailing zeros only', () => {
        const values = mapFromApiToForm(
          buildAlert({
            thresholds: ['10.5', '10.0', '100.0', '0.12345'].map((value) => ({
              code: null,
              recurring: false,
              value,
              notifyOn: [NotifyOnEnum.Triggered],
            })),
          }),
          CurrencyEnum.Eur,
        )

        expect(values.thresholds.map(({ value }) => value)).toEqual([
          '10.5',
          '10',
          '100',
          '0.12345',
        ])
      })
    })

    describe('WHEN its thresholds are amounts', () => {
      it('THEN should deserialize the cents', () => {
        const values = mapFromApiToForm(
          buildAlert({
            alertType: ContractAlertTypeEnum.UsageAmount,
            thresholds: [
              { code: null, recurring: false, value: '1050.0', notifyOn: [NotifyOnEnum.Triggered] },
            ],
          }),
          CurrencyEnum.Eur,
        )

        expect(values.thresholds[0].value).toBe('10.5')
      })
    })

    describe('WHEN a threshold carries a typename', () => {
      it('THEN should keep only the input keys', () => {
        const values = mapFromApiToForm(
          buildAlert({
            thresholds: [
              {
                __typename: 'AlertThreshold',
                code: 'warn',
                recurring: false,
                value: '1',
                notifyOn: [NotifyOnEnum.Triggered],
              },
            ],
          }),
          CurrencyEnum.Eur,
        )

        expect(Object.keys(values.thresholds[0]).sort()).toEqual([
          'code',
          'notifyOn',
          'recurring',
          'value',
        ])
      })
    })

    describe('WHEN mapping its scope', () => {
      it.each([
        [
          'a product and a filter',
          [
            {
              type: CONTRACT_SCOPE,
              product: PRODUCT,
              productFilters: [FILTER],
              withProductFilters: null,
            },
          ],
          { type: 'product', productCode: 'P', productFilterCode: 'F', withProductFilters: false },
        ],
        [
          'a product with all its filters',
          [
            {
              type: CONTRACT_SCOPE,
              product: PRODUCT,
              productFilters: null,
              withProductFilters: true,
            },
          ],
          { type: 'product', productCode: 'P', productFilterCode: '', withProductFilters: true },
        ],
        [
          'a product without the filters flag',
          [
            {
              type: CONTRACT_SCOPE,
              product: PRODUCT,
              productFilters: null,
              withProductFilters: null,
            },
          ],
          { type: 'product', productCode: 'P', productFilterCode: '', withProductFilters: false },
        ],
        ['the whole contract', [], null],
      ])('THEN should map %s', (_, scope, expected) => {
        expect(mapFromApiToForm(buildAlert({ scope }), CurrencyEnum.Eur).scope).toEqual(expected)
      })
    })

    describe('WHEN the alert has no name', () => {
      it('THEN should seed an empty name', () => {
        expect(mapFromApiToForm(buildAlert({ name: null }), CurrencyEnum.Eur).name).toBe('')
      })
    })
  })
})
