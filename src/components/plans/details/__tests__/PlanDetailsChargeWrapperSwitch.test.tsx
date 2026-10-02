import { screen } from '@testing-library/react'

import {
  ChargeModelEnum,
  CurrencyEnum,
  FixedChargeProperties,
  Properties,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import { PlanDetailsChargeWrapperSwitch } from '../PlanDetailsChargeWrapperSwitch'

const mockJsonEditorTestId = 'json-editor'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/components/form', () => ({
  JsonEditor: ({ value, readOnly }: { value?: unknown; readOnly?: boolean }) => (
    <div data-test={mockJsonEditorTestId} data-readonly={String(readOnly)}>
      {JSON.stringify(value)}
    </div>
  ),
}))

const buildProperties = (overrides: Partial<Properties> = {}): Properties => ({
  __typename: 'Properties',
  ...overrides,
})

const getHeaderTexts = (): string[] =>
  screen.getAllByRole('columnheader').map((header) => header.textContent ?? '')

const getCellTexts = (): string[] =>
  screen.getAllByRole('cell').map((cell) => cell.textContent ?? '')

describe('PlanDetailsChargeWrapperSwitch', () => {
  describe('GIVEN a standard charge', () => {
    describe('WHEN it renders in the charge currency', () => {
      it('THEN shows the formatted amount', () => {
        render(
          <PlanDetailsChargeWrapperSwitch
            currency={CurrencyEnum.Usd}
            chargeModel={ChargeModelEnum.Standard}
            values={buildProperties({ amount: '12.5' })}
          />,
        )

        expect(getHeaderTexts()).toEqual(['text_624453d52e945301380e49b6'])
        expect(getCellTexts()).toEqual(['$12.50'])
      })
    })

    describe('WHEN it renders in a custom pricing unit', () => {
      it('THEN suffixes the amount with the unit short name', () => {
        render(
          <PlanDetailsChargeWrapperSwitch
            currency={CurrencyEnum.Usd}
            chargeModel={ChargeModelEnum.Standard}
            values={buildProperties({ amount: '12.5' })}
            chargeAppliedPricingUnit={{ pricingUnit: { shortName: 'tok' } }}
          />,
        )

        expect(getCellTexts()).toEqual(['12.50 tok'])
      })
    })

    describe('WHEN it carries pricing group keys', () => {
      it('THEN shows a chip per key', () => {
        render(
          <PlanDetailsChargeWrapperSwitch
            currency={CurrencyEnum.Usd}
            chargeModel={ChargeModelEnum.Standard}
            values={buildProperties({ amount: '1', pricingGroupKeys: ['region', 'tier'] })}
          />,
        )

        expect(screen.getByText('region')).toBeInTheDocument()
        expect(screen.getByText('tier')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a package charge', () => {
    describe('WHEN its values are usage properties', () => {
      it('THEN shows the amount, the package size and the free units', () => {
        render(
          <PlanDetailsChargeWrapperSwitch
            currency={CurrencyEnum.Usd}
            chargeModel={ChargeModelEnum.Package}
            values={buildProperties({ amount: '5', packageSize: 100, freeUnits: 10 })}
          />,
        )

        expect(getHeaderTexts()).toEqual([
          'text_624453d52e945301380e49b6',
          'text_65201b8216455901fe273de7',
          'text_65201b8216455901fe273de8',
        ])
        expect(getCellTexts()).toEqual(['$5.00', '100', '10'])
      })
    })

    describe('WHEN its values are fixed charge properties', () => {
      it('THEN renders no table', () => {
        const fixedChargeProperties: FixedChargeProperties = {
          __typename: 'FixedChargeProperties',
          amount: '5',
        }

        render(
          <PlanDetailsChargeWrapperSwitch
            currency={CurrencyEnum.Usd}
            chargeModel={ChargeModelEnum.Package}
            values={fixedChargeProperties}
          />,
        )

        expect(screen.queryByRole('table')).not.toBeInTheDocument()
      })
    })

    describe('WHEN it renders in a custom pricing unit', () => {
      it('THEN suffixes the amount with the unit short name', () => {
        render(
          <PlanDetailsChargeWrapperSwitch
            currency={CurrencyEnum.Usd}
            chargeModel={ChargeModelEnum.Package}
            values={buildProperties({ amount: '5', packageSize: 100, freeUnits: 10 })}
            chargeAppliedPricingUnit={{ pricingUnit: { shortName: 'tok' } }}
          />,
        )

        expect(getCellTexts()).toEqual(['5.00 tok', '100', '10'])
      })
    })
  })

  describe('GIVEN a percentage charge', () => {
    describe('WHEN it renders', () => {
      it('THEN shows the rate, the fees, the free units and the transaction bounds', () => {
        render(
          <PlanDetailsChargeWrapperSwitch
            currency={CurrencyEnum.Usd}
            chargeModel={ChargeModelEnum.Percentage}
            values={buildProperties({
              rate: '1.5',
              fixedAmount: '2',
              freeUnitsPerEvents: 3,
              freeUnitsPerTotalAggregation: '4',
              perTransactionMinAmount: '1',
              perTransactionMaxAmount: '9',
            })}
          />,
        )

        expect(getHeaderTexts()).toEqual([
          'text_64de472463e2da6b31737de0',
          'text_62ff5d01a306e274d4ffcc1e',
          'text_65201b8216455901fe273dfb',
          'text_62ff5d01a306e274d4ffcc48',
        ])
        expect(getCellTexts()).toEqual(['1.50%', '$2.00', '3', '$4.00'])
        expect(screen.getByText('$1.00')).toBeInTheDocument()
        expect(screen.getByText('$9.00')).toBeInTheDocument()
        expect(
          screen.getByText('$1.00').compareDocumentPosition(screen.getByText('$9.00')) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy()
      })
    })

    describe('WHEN it renders with no values set', () => {
      it('THEN shows zeros and has four $0.00 texts', () => {
        render(
          <PlanDetailsChargeWrapperSwitch
            currency={CurrencyEnum.Usd}
            chargeModel={ChargeModelEnum.Percentage}
            values={buildProperties({})}
          />,
        )

        expect(getCellTexts()).toEqual(['0.00%', '$0.00', '0', '$0.00'])
        expect(screen.getAllByText('$0.00')).toHaveLength(4)
      })
    })

    describe('WHEN it renders in a custom pricing unit', () => {
      it('THEN suffixes amounts with the unit short name', () => {
        render(
          <PlanDetailsChargeWrapperSwitch
            currency={CurrencyEnum.Usd}
            chargeModel={ChargeModelEnum.Percentage}
            values={buildProperties({
              rate: '1.5',
              fixedAmount: '2',
              freeUnitsPerEvents: 3,
              freeUnitsPerTotalAggregation: '4',
              perTransactionMinAmount: '1',
              perTransactionMaxAmount: '9',
            })}
            chargeAppliedPricingUnit={{ pricingUnit: { shortName: 'tok' } }}
          />,
        )

        expect(getCellTexts()).toEqual(['1.50%', '2.00 tok', '3', '4.00 tok'])
        expect(screen.getByText('1.00 tok')).toBeInTheDocument()
        expect(screen.getByText('9.00 tok')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a custom charge', () => {
    describe('WHEN it renders', () => {
      it('THEN shows its custom properties in a read-only editor', () => {
        render(
          <PlanDetailsChargeWrapperSwitch
            currency={CurrencyEnum.Usd}
            chargeModel={ChargeModelEnum.Custom}
            values={buildProperties({ customProperties: { tier: 'gold' } })}
          />,
        )

        expect(getHeaderTexts()).toEqual(['text_663dea5702b60301d8d06502'])
        expect(screen.getByTestId(mockJsonEditorTestId)).toHaveTextContent('{"tier":"gold"}')
        expect(screen.getByTestId(mockJsonEditorTestId)).toHaveAttribute('data-readonly', 'true')
      })
    })
  })

  describe('GIVEN a graduated charge', () => {
    describe('WHEN it renders', () => {
      it('THEN shows one row per range with an open last bound', () => {
        render(
          <PlanDetailsChargeWrapperSwitch
            currency={CurrencyEnum.Usd}
            chargeModel={ChargeModelEnum.Graduated}
            values={buildProperties({
              graduatedRanges: [
                {
                  __typename: 'GraduatedRange',
                  fromValue: 0,
                  toValue: 10,
                  perUnitAmount: '1',
                  flatAmount: '2',
                },
                {
                  __typename: 'GraduatedRange',
                  fromValue: 10,
                  toValue: null,
                  perUnitAmount: '0.5',
                  flatAmount: '0',
                },
              ],
            })}
          />,
        )

        expect(getCellTexts()).toEqual(['0', '10', '$1.00', '$2.00', '10', '∞', '$0.50', '$0.00'])
      })
    })
  })

  describe('GIVEN a graduated percentage charge', () => {
    describe('WHEN it renders in a custom pricing unit', () => {
      it('THEN shows ranges with percentage rates and pricing unit suffixed amounts', () => {
        render(
          <PlanDetailsChargeWrapperSwitch
            currency={CurrencyEnum.Usd}
            chargeModel={ChargeModelEnum.GraduatedPercentage}
            values={buildProperties({
              graduatedPercentageRanges: [
                {
                  __typename: 'GraduatedPercentageRange',
                  fromValue: 0,
                  toValue: 10,
                  rate: '1',
                  flatAmount: '2',
                },
                {
                  __typename: 'GraduatedPercentageRange',
                  fromValue: 11,
                  toValue: null,
                  rate: '0.5',
                  flatAmount: '0',
                },
              ],
            })}
            chargeAppliedPricingUnit={{ pricingUnit: { shortName: 'tok' } }}
          />,
        )

        expect(getCellTexts()).toEqual([
          '0',
          '10',
          '1.00%',
          '2.00 tok',
          '11',
          '∞',
          '0.50%',
          '0.00 tok',
        ])
      })
    })
  })

  describe('GIVEN a volume charge', () => {
    describe('WHEN it renders in a custom pricing unit', () => {
      it('THEN shows ranges with pricing unit suffixed amounts', () => {
        render(
          <PlanDetailsChargeWrapperSwitch
            currency={CurrencyEnum.Usd}
            chargeModel={ChargeModelEnum.Volume}
            values={buildProperties({
              volumeRanges: [
                {
                  __typename: 'VolumeRange',
                  fromValue: 0,
                  toValue: 100,
                  perUnitAmount: '1',
                  flatAmount: '0',
                },
                {
                  __typename: 'VolumeRange',
                  fromValue: 101,
                  toValue: null,
                  perUnitAmount: '0.5',
                  flatAmount: '2',
                },
              ],
            })}
            chargeAppliedPricingUnit={{ pricingUnit: { shortName: 'tok' } }}
          />,
        )

        expect(getCellTexts()).toEqual([
          '0',
          '100',
          '1.00 tok',
          '0.00 tok',
          '101',
          '∞',
          '0.50 tok',
          '2.00 tok',
        ])
      })
    })
  })

  describe('GIVEN presentation group keys', () => {
    describe('WHEN they are provided with showPresentationGroupKeys=true (default)', () => {
      it('THEN shows the region chip', () => {
        render(
          <PlanDetailsChargeWrapperSwitch
            currency={CurrencyEnum.Usd}
            chargeModel={ChargeModelEnum.Standard}
            values={buildProperties({
              amount: '1',
              presentationGroupKeys: [{ value: 'region', options: { displayInInvoice: true } }],
            })}
          />,
        )

        expect(screen.getByText('region')).toBeInTheDocument()
      })
    })

    describe('WHEN showPresentationGroupKeys={false}', () => {
      it('THEN does not show the region chip', () => {
        render(
          <PlanDetailsChargeWrapperSwitch
            currency={CurrencyEnum.Usd}
            chargeModel={ChargeModelEnum.Standard}
            values={buildProperties({
              amount: '1',
              presentationGroupKeys: [{ value: 'region', options: { displayInInvoice: true } }],
            })}
            showPresentationGroupKeys={false}
          />,
        )

        expect(screen.queryByText('region')).not.toBeInTheDocument()
      })
    })
  })
})
