import { screen } from '@testing-library/react'

import { CurrencyEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { CustomChargeDetails } from '../CustomChargeDetails'
import { PackageChargeDetails } from '../PackageChargeDetails'
import { PercentageChargeDetails } from '../PercentageChargeDetails'
import { PricingGroupKeysDetails } from '../PricingGroupKeysDetails'
import { StandardChargeDetails } from '../StandardChargeDetails'

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

const getCellTexts = (): string[] =>
  screen.getAllByRole('cell').map((cell) => cell.textContent ?? '')

describe('charge details displays', () => {
  describe('GIVEN a standard amount', () => {
    describe('WHEN it is missing', () => {
      it('THEN shows a zero amount', () => {
        render(
          <StandardChargeDetails
            amount={null}
            currency={CurrencyEnum.Usd}
            pricingUnitShortName={undefined}
          />,
        )

        expect(getCellTexts()).toEqual(['$0.00'])
      })
    })
  })

  describe('GIVEN a package', () => {
    describe('WHEN it renders in a pricing unit', () => {
      it('THEN shows the unit amount, the size and the free units', () => {
        render(
          <PackageChargeDetails
            amount="5"
            packageSize={100}
            freeUnits={10}
            currency={CurrencyEnum.Usd}
            pricingUnitShortName="tok"
          />,
        )

        expect(getCellTexts()).toEqual(['5.00 tok', '100', '10'])
      })
    })
  })

  describe('GIVEN a percentage without free units', () => {
    describe('WHEN it renders', () => {
      it('THEN shows zero free units and zero transaction bounds', () => {
        render(
          <PercentageChargeDetails
            rate="2"
            fixedAmount={null}
            freeUnitsPerEvents={null}
            freeUnitsPerTotalAggregation={null}
            perTransactionMinAmount={null}
            perTransactionMaxAmount={null}
            currency={CurrencyEnum.Usd}
            pricingUnitShortName={undefined}
          />,
        )

        expect(getCellTexts()).toEqual(['2.00%', '$0.00', '0', '$0.00'])
        expect(screen.getAllByText('$0.00')).toHaveLength(4)
      })
    })
  })

  describe('GIVEN custom properties', () => {
    describe('WHEN they render', () => {
      it('THEN hands them to the read-only editor', () => {
        render(<CustomChargeDetails customProperties={{ tier: 'gold' }} />)

        expect(screen.getByTestId(mockJsonEditorTestId)).toHaveTextContent('{"tier":"gold"}')
        expect(screen.getByTestId(mockJsonEditorTestId)).toHaveAttribute('data-readonly', 'true')
      })
    })
  })

  describe('GIVEN pricing group keys', () => {
    describe('WHEN the list has keys', () => {
      it('THEN shows a chip per key', () => {
        render(<PricingGroupKeysDetails pricingGroupKeys={['region', 'tier']} />)

        expect(screen.getByText('region')).toBeInTheDocument()
        expect(screen.getByText('tier')).toBeInTheDocument()
      })
    })

    describe('WHEN the list is empty', () => {
      it('THEN renders nothing', () => {
        const { container } = render(<PricingGroupKeysDetails pricingGroupKeys={[]} />)

        expect(container).toBeEmptyDOMElement()
      })
    })
  })
})
