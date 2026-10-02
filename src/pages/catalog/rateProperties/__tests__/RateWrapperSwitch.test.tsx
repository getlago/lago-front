import { screen } from '@testing-library/react'

import { CurrencyEnum, ProductTypeEnum, RateCardRateModelEnum } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { RATE_CARD_RATE_FORM_DEFAULTS } from '~/pages/catalog/drawers/rateCardRate/constants'
import { render } from '~/test-utils'

import { RateWrapperSwitch } from '../RateWrapperSwitch'

const mockStandardChargeTestId = 'standard-charge'
const mockPackageChargeTestId = 'package-charge'
const mockPercentageChargeTestId = 'percentage-charge'
const mockCustomChargeTestId = 'custom-charge'
const mockDynamicChargeTestId = 'dynamic-charge'
const mockPricingGroupKeysTestId = 'pricing-group-keys'
const mockGraduatedTableTestId = 'graduated-rate-tiers-table'
const mockGraduatedPercentageTableTestId = 'graduated-percentage-rate-tiers-table'
const mockVolumeTableTestId = 'volume-rate-tiers-table'

let mockCustomChargeProps: Record<string, unknown> = {}
let mockTierTableProps: Record<string, unknown> = {}

jest.mock('~/components/plans/StandardCharge', () => {
  const { useChargeFormContext } = jest.requireActual<
    typeof import('~/contexts/ChargeFormContext')
  >('~/contexts/ChargeFormContext')

  return {
    StandardCharge: () => {
      const { propertyCursor, currency, chargePricingUnitShortName } = useChargeFormContext()

      return (
        <div
          data-test={mockStandardChargeTestId}
          data-property-cursor={propertyCursor}
          data-currency={currency}
          data-pricing-unit={chargePricingUnitShortName}
        />
      )
    },
  }
})
jest.mock('~/components/plans/PackageCharge', () => ({
  PackageCharge: () => <div data-test={mockPackageChargeTestId} />,
}))
jest.mock('~/components/plans/ChargePercentage', () => ({
  ChargePercentage: () => <div data-test={mockPercentageChargeTestId} />,
}))
jest.mock('~/components/plans/CustomCharge', () => ({
  CustomCharge: (props: Record<string, unknown>) => {
    mockCustomChargeProps = props

    return <div data-test={mockCustomChargeTestId} />
  },
}))
jest.mock('~/components/plans/DynamicCharge', () => ({
  DynamicCharge: () => <div data-test={mockDynamicChargeTestId} />,
}))
jest.mock('~/components/plans/PricingGroupKeys', () => ({
  __esModule: true,
  default: () => <div data-test={mockPricingGroupKeysTestId} />,
}))
jest.mock('../tiers/GraduatedRateTiersTable', () => ({
  GraduatedRateTiersTable: (props: Record<string, unknown>) => {
    mockTierTableProps = props

    return <div data-test={mockGraduatedTableTestId} />
  },
}))
jest.mock('../tiers/GraduatedPercentageRateTiersTable', () => ({
  GraduatedPercentageRateTiersTable: (props: Record<string, unknown>) => {
    mockTierTableProps = props

    return <div data-test={mockGraduatedPercentageTableTestId} />
  },
}))
jest.mock('../tiers/VolumeRateTiersTable', () => ({
  VolumeRateTiersTable: (props: Record<string, unknown>) => {
    mockTierTableProps = props

    return <div data-test={mockVolumeTableTestId} />
  },
}))

const handleExpandCustomCharge = jest.fn()

const Host = ({
  rateModel,
  productType = ProductTypeEnum.Metered,
}: {
  rateModel: RateCardRateModelEnum
  productType?: ProductTypeEnum
}) => {
  const form = useAppForm({ defaultValues: { ...RATE_CARD_RATE_FORM_DEFAULTS, rateModel } })

  return (
    <RateWrapperSwitch
      form={form}
      rateModel={rateModel}
      productType={productType}
      currency={CurrencyEnum.Eur}
      pricingUnitShortName="tok"
      onExpandCustomCharge={handleExpandCustomCharge}
    />
  )
}

describe('RateWrapperSwitch', () => {
  beforeEach(() => {
    mockCustomChargeProps = {}
    mockTierTableProps = {}
  })

  describe('GIVEN each rate model', () => {
    it.each([
      [RateCardRateModelEnum.Standard, mockStandardChargeTestId],
      [RateCardRateModelEnum.Package, mockPackageChargeTestId],
      [RateCardRateModelEnum.Percentage, mockPercentageChargeTestId],
      [RateCardRateModelEnum.Custom, mockCustomChargeTestId],
      [RateCardRateModelEnum.Dynamic, mockDynamicChargeTestId],
      [RateCardRateModelEnum.Graduated, mockGraduatedTableTestId],
      [RateCardRateModelEnum.GraduatedPercentage, mockGraduatedPercentageTableTestId],
      [RateCardRateModelEnum.Volume, mockVolumeTableTestId],
    ])('WHEN the model is %p THEN renders %p', (rateModel, testId) => {
      render(<Host rateModel={rateModel} />)

      expect(screen.getByTestId(testId)).toBeInTheDocument()
    })
  })

  describe('GIVEN the standard model', () => {
    describe('WHEN its charge renders', () => {
      it('THEN the charge form context carries the properties cursor, the card currency and the pricing unit', () => {
        render(<Host rateModel={RateCardRateModelEnum.Standard} />)

        const standardCharge = screen.getByTestId(mockStandardChargeTestId)

        expect(standardCharge).toHaveAttribute('data-property-cursor', 'properties')
        expect(standardCharge).toHaveAttribute('data-currency', CurrencyEnum.Eur)
        expect(standardCharge).toHaveAttribute('data-pricing-unit', 'tok')
      })
    })
  })

  describe('GIVEN a tiered model', () => {
    describe('WHEN its table renders', () => {
      it.each([
        RateCardRateModelEnum.Graduated,
        RateCardRateModelEnum.GraduatedPercentage,
        RateCardRateModelEnum.Volume,
      ])('THEN the %p table receives the card currency and pricing unit', (rateModel) => {
        render(<Host rateModel={rateModel} />)

        expect(mockTierTableProps.currency).toBe(CurrencyEnum.Eur)
        expect(mockTierTableProps.pricingUnitShortName).toBe('tok')
      })
    })
  })

  describe('GIVEN the custom model', () => {
    describe('WHEN its editor renders', () => {
      it('THEN receives the expand callback', () => {
        render(<Host rateModel={RateCardRateModelEnum.Custom} />)

        expect(mockCustomChargeProps.onExpandCustomCharge).toBe(handleExpandCustomCharge)
      })
    })
  })

  describe('GIVEN the product type', () => {
    it('WHEN the product is metered THEN shows the pricing group keys', () => {
      render(<Host rateModel={RateCardRateModelEnum.Standard} />)

      expect(screen.getByTestId(mockPricingGroupKeysTestId)).toBeInTheDocument()
    })

    it('WHEN the product is fixed THEN hides the pricing group keys', () => {
      render(
        <Host rateModel={RateCardRateModelEnum.Standard} productType={ProductTypeEnum.Fixed} />,
      )

      expect(screen.queryByTestId(mockPricingGroupKeysTestId)).not.toBeInTheDocument()
    })
  })
})
