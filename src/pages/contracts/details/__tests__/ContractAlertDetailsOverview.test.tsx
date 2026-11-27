import { screen, waitFor, within } from '@testing-library/react'

import {
  ContractAlertForDrawerFragment,
  ContractAlertScopeTypeEnum,
  ContractAlertTypeEnum,
  CurrencyEnum,
  NotifyOnEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  CONTRACT_ALERT_OVERVIEW_CODE_TEST_ID,
  CONTRACT_ALERT_OVERVIEW_NAME_TEST_ID,
  CONTRACT_ALERT_OVERVIEW_SCOPE_CHIP_TEST_ID,
  CONTRACT_ALERT_OVERVIEW_THRESHOLDS_TEST_ID,
  CONTRACT_ALERT_OVERVIEW_TYPE_TEST_ID,
  ContractAlertDetailsOverview,
  formatContractAlertThresholdValue,
} from '../ContractAlertDetailsOverview'

type Scope = ContractAlertForDrawerFragment['scope'][number]
type Threshold = ContractAlertForDrawerFragment['thresholds'][number]

const buildProduct = (overrides: Partial<Scope['product']> = {}): Scope['product'] => ({
  __typename: 'Product',
  id: 'product-1',
  name: 'Storage',
  code: 'storage',
  invoiceDisplayName: null,
  productCategory: null,
  ...overrides,
})

const buildScope = (overrides: Partial<Scope> = {}): Scope => ({
  __typename: 'ContractAlertScope',
  type: ContractAlertScopeTypeEnum.Contract,
  withProductFilters: false,
  product: buildProduct(),
  productFilters: null,
  ...overrides,
})

const buildThreshold = (overrides: Partial<Threshold> = {}): Threshold => ({
  __typename: 'AlertThreshold',
  code: null,
  recurring: false,
  value: '100',
  notifyOn: [NotifyOnEnum.Triggered],
  ...overrides,
})

const buildAlert = (
  overrides: Partial<ContractAlertForDrawerFragment> = {},
): ContractAlertForDrawerFragment => ({
  __typename: 'ContractAlert',
  id: 'alert-1',
  name: 'Usage alert',
  code: 'usage_alert',
  alertType: ContractAlertTypeEnum.UsageUnits,
  scope: [],
  thresholds: [],
  ...overrides,
})

const renderOverview = (
  alert: ContractAlertForDrawerFragment,
  currency: CurrencyEnum = CurrencyEnum.Usd,
): void => {
  render(<ContractAlertDetailsOverview alert={alert} currency={currency} />)
}

const getChipLabels = (): string[] =>
  screen
    .getAllByTestId(CONTRACT_ALERT_OVERVIEW_SCOPE_CHIP_TEST_ID)
    .map((chip) => chip.textContent ?? '')

const getThresholdRows = (): string[][] =>
  within(screen.getByTestId(CONTRACT_ALERT_OVERVIEW_THRESHOLDS_TEST_ID))
    .getAllByRole('row')
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent ?? ''),
    )

describe('formatContractAlertThresholdValue', () => {
  describe('GIVEN a usage amount alert', () => {
    it.each([
      [CurrencyEnum.Usd, '$10,000.00'],
      [CurrencyEnum.Jpy, '¥1,000,000'],
    ])('THEN should deserialize the cents and format them in %s', (currency, expected) => {
      expect(
        formatContractAlertThresholdValue({
          value: '1000000.0',
          alertType: ContractAlertTypeEnum.UsageAmount,
          currency,
          unitsLabel: 'units',
        }),
      ).toBe(expected)
    })
  })

  describe('GIVEN a usage units alert', () => {
    it.each([
      ['1500.5', '1,500.5 units'],
      ['1500.0', '1,500 units'],
      ['0.12345', '0.12345 units'],
    ])('THEN should format %s as %s', (value, expected) => {
      expect(
        formatContractAlertThresholdValue({
          value,
          alertType: ContractAlertTypeEnum.UsageUnits,
          currency: CurrencyEnum.Usd,
          unitsLabel: 'units',
        }),
      ).toBe(expected)
    })
  })
})

describe('ContractAlertDetailsOverview', () => {
  describe('GIVEN an alert with its settings', () => {
    it('THEN should display its name, code and type', async () => {
      renderOverview(buildAlert({ alertType: ContractAlertTypeEnum.UsageAmount }))

      expect(screen.getByTestId(CONTRACT_ALERT_OVERVIEW_NAME_TEST_ID)).toHaveTextContent(
        'Usage alert',
      )
      expect(screen.getByTestId(CONTRACT_ALERT_OVERVIEW_CODE_TEST_ID)).toHaveTextContent(
        'usage_alert',
      )
      await waitFor(() =>
        expect(screen.getByTestId(CONTRACT_ALERT_OVERVIEW_TYPE_TEST_ID)).toHaveTextContent(
          'Usage amount',
        ),
      )
    })
  })

  describe('GIVEN the alert scope', () => {
    it.each([
      ['the whole contract', [], ['All products']],
      [
        'a product with all its filters',
        [buildScope({ withProductFilters: true })],
        ['Product: Storage and all filters'],
      ],
      ['a product only', [buildScope()], ['Product: Storage']],
      [
        'a product filter',
        [
          buildScope({
            productFilters: [
              {
                __typename: 'ProductFilter',
                id: 'filter-1',
                name: 'EU region',
                code: 'eu',
                invoiceDisplayName: null,
              },
            ],
          }),
        ],
        ['Filter: EU region from Storage'],
      ],
      [
        'names with an invoice display name',
        [
          buildScope({
            product: buildProduct({ invoiceDisplayName: 'Cloud storage' }),
            productFilters: [
              {
                __typename: 'ProductFilter',
                id: 'filter-1',
                name: 'EU region',
                code: 'eu',
                invoiceDisplayName: 'Europe',
              },
            ],
          }),
        ],
        ['Filter: Europe from Cloud storage'],
      ],
    ])('WHEN it targets %s THEN should display the matching chip', (_, scope, expected) => {
      renderOverview(buildAlert({ scope }))

      expect(getChipLabels()).toEqual(expected)
    })
  })

  describe('GIVEN one-time and recurring thresholds', () => {
    it('THEN should list them in API order with their label, code and resolved flag', () => {
      renderOverview(
        buildAlert({
          thresholds: [
            buildThreshold({ value: '100' }),
            buildThreshold({
              value: '200',
              code: 'warn',
              notifyOn: [NotifyOnEnum.Triggered, NotifyOnEnum.Resolved],
            }),
            buildThreshold({ value: '50', recurring: true }),
          ],
        }),
      )

      expect(getThresholdRows()).toEqual([
        ['When usage reaches', '100 units', '-', 'False'],
        ['Then', '200 units', 'warn', 'True'],
        ['Then every', '50 units', '-', 'False'],
      ])
    })
  })

  describe('GIVEN only a recurring threshold', () => {
    it('THEN should display a single then every row', () => {
      renderOverview(
        buildAlert({
          alertType: ContractAlertTypeEnum.UsageAmount,
          thresholds: [buildThreshold({ value: '1000', recurring: true })],
        }),
      )

      expect(getThresholdRows()).toEqual([['Then every', '$10.00', '-', 'False']])
    })
  })
})
