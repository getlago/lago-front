import { calculateIfDetailsShouldBeDisplayed } from '~/components/invoices/details/InvoiceDetailsTableBodyLine'
import { TExtendedRemainingFee } from '~/core/formats/formatInvoiceItemsMap'
import { AdjustedFeeTypeEnum, ChargeModelEnum, FeeTypesEnum } from '~/generated/graphql'

type TPrepare = {
  fee?: TExtendedRemainingFee
  isTrueUpFee?: boolean
  canHaveUnitPrice?: boolean
}
const prepare = ({ fee, isTrueUpFee = false, canHaveUnitPrice = true }: TPrepare) => {
  return calculateIfDetailsShouldBeDisplayed(fee, isTrueUpFee, canHaveUnitPrice)
}

describe('calculateIfDetailsShouldBeDisplayed', () => {
  it('should return false if fee is undefined', () => {
    const result = prepare({ fee: undefined })

    expect(result).toBe(false)
  })

  it('should return false if isTrueUpFee is true', () => {
    const fee = {
      amountCents: 100,
      amountCurrency: 'USD',
    } as TExtendedRemainingFee
    const result = prepare({ fee, isTrueUpFee: true })

    expect(result).toBe(false)
  })

  it('should return false if canHaveUnitPrice is false', () => {
    const fee = {
      amountCents: 100,
      amountCurrency: 'USD',
    } as TExtendedRemainingFee
    const result = prepare({ fee, canHaveUnitPrice: false })

    expect(result).toBe(false)
  })

  it('should return false if fee.adjustedFeeType is AdjustedAmount', () => {
    const fee = {
      adjustedFeeType: AdjustedFeeTypeEnum.AdjustedAmount,
    } as TExtendedRemainingFee
    const result = prepare({ fee })

    expect(result).toBe(false)
  })

  it('should return false if fee.metadata.isSubscriptionFee is true', () => {
    const fee = {
      metadata: { isSubscriptionFee: true },
    } as TExtendedRemainingFee
    const result = prepare({ fee })

    expect(result).toBe(false)
  })

  it('should return false if fee.charge.chargeModel is Standard', () => {
    const fee = {
      charge: { chargeModel: ChargeModelEnum.Standard },
    } as TExtendedRemainingFee
    const result = prepare({ fee })

    expect(result).toBe(false)
  })

  it('should return false if fee.feeType is AddOn or Credit', () => {
    let fee = { feeType: FeeTypesEnum.AddOn } as TExtendedRemainingFee
    const result = prepare({ fee })

    expect(result).toBe(false)
    fee = { feeType: FeeTypesEnum.Credit } as TExtendedRemainingFee
    expect(result).toBe(false)
  })

  it('should return false if fee is in advance', () => {
    const fee = {
      charge: { payInAdvance: true },
    } as TExtendedRemainingFee
    const result = prepare({ fee })

    expect(result).toBe(false)
  })

  it('should return false if fee is recurring', () => {
    const fee = {
      charge: { billableMetric: { recurring: true } },
    } as TExtendedRemainingFee
    const result = prepare({ fee })

    expect(result).toBe(false)
  })

  it('should return true for graduated full charges', () => {
    const fee = {
      charge: { chargeModel: ChargeModelEnum.Graduated, prorated: false },
    } as TExtendedRemainingFee
    const result = prepare({ fee })

    expect(result).toBe(true)
  })

  it('should return true for volume charges', () => {
    const fee = {
      charge: { chargeModel: ChargeModelEnum.Volume },
    } as TExtendedRemainingFee
    const result = prepare({ fee })

    expect(result).toBe(true)
  })

  it('should return true for package charges', () => {
    const fee = {
      charge: { chargeModel: ChargeModelEnum.Package },
    } as TExtendedRemainingFee
    const result = prepare({ fee })

    expect(result).toBe(true)
  })

  it('should return true for percentage charges', () => {
    const fee = {
      charge: { chargeModel: ChargeModelEnum.Percentage },
    } as TExtendedRemainingFee
    const result = prepare({ fee })

    expect(result).toBe(true)
  })

  it('should return true for graduated percentage charges', () => {
    const fee = {
      charge: { chargeModel: ChargeModelEnum.GraduatedPercentage },
    } as TExtendedRemainingFee
    const result = prepare({ fee })

    expect(result).toBe(true)
  })

  it('should return true if fee is in arrears', () => {
    const fee = {
      charge: { payInAdvance: false },
    } as TExtendedRemainingFee
    const result = prepare({ fee })

    expect(result).toBe(false)
  })

  it('should return true if fee is valid advance recurring volume charge', () => {
    const fee = {
      amountDetails: { flatUnitAmount: '1' },
      charge: {
        chargeModel: ChargeModelEnum.Volume,
        payInAdvance: true,
        billableMetric: { recurring: true },
      },
    } as TExtendedRemainingFee
    const result = prepare({ fee })

    expect(result).toBe(true)
  })

  it('should return true if fee is valid advance recurring package charge', () => {
    const fee = {
      amountDetails: { freeUnits: '1' },
      charge: {
        chargeModel: ChargeModelEnum.Package,
        payInAdvance: true,
        billableMetric: { recurring: true },
      },
    } as TExtendedRemainingFee
    const result = prepare({ fee })

    expect(result).toBe(true)
  })

  it('should return true if fee is valid advance recurring percentage charge', () => {
    const fee = {
      amountDetails: { fixedFeeUnitAmount: '1' },
      charge: {
        chargeModel: ChargeModelEnum.Percentage,
        payInAdvance: true,
        billableMetric: { recurring: true },
      },
    } as TExtendedRemainingFee
    const result = prepare({ fee })

    expect(result).toBe(true)
  })

  it('should return true if fee is valid advance recurring graduated charge', () => {
    const fee = {
      amountDetails: { graduatedRanges: [{ toValue: 1 }] },
      charge: {
        chargeModel: ChargeModelEnum.Graduated,
        payInAdvance: true,
        billableMetric: { recurring: true },
      },
    } as TExtendedRemainingFee
    const result = prepare({ fee })

    expect(result).toBe(true)
  })

  it('should return true if fee is valid advance recurring graduated percentage charge', () => {
    const fee = {
      amountDetails: { graduatedPercentageRanges: [{ toValue: 1 }] },
      charge: {
        chargeModel: ChargeModelEnum.GraduatedPercentage,
        payInAdvance: true,
        billableMetric: { recurring: true },
      },
    } as TExtendedRemainingFee
    const result = prepare({ fee })

    expect(result).toBe(true)
  })
})
