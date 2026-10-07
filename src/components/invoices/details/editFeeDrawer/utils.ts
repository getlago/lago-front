import { ALL_CHARGE_MODELS } from '~/core/constants/form'
import { ChargeModelEnum, FixedChargeChargeModelEnum } from '~/generated/graphql'

type ChargeAdjustmentConfig = {
  chargeModel?: ChargeModelEnum | FixedChargeChargeModelEnum
  prorated?: boolean
}

export const isChargeModelUnitAdjustmentDisabled = ({
  chargeModel,
  prorated,
}: ChargeAdjustmentConfig): boolean => {
  if (!chargeModel) return false

  return !!(
    chargeModel === ALL_CHARGE_MODELS.Percentage ||
    chargeModel === ALL_CHARGE_MODELS.Dynamic ||
    (chargeModel === ALL_CHARGE_MODELS.Graduated && prorated)
  )
}

export const calculateTotalAmount = (
  units?: number | string | null,
  unitAmount?: number | string | null,
): number => Number(units || 0) * Number(unitAmount || 0)
