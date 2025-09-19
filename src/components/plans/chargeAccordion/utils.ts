import { FormikProps } from 'formik'
import { RefObject } from 'react'

import { LocalChargeInput, PlanFormInput } from '~/components/plans/types'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import getPropertyShape from '~/core/serializers/getPropertyShape'
import { ChargeModelEnum } from '~/generated/graphql'

export type HandleUpdateChargesProps = {
  formikProps: FormikProps<PlanFormInput>
  index: number
  isPremium: boolean
  localCharge: LocalChargeInput
  name: string
  premiumWarningDialogRef: RefObject<PremiumWarningDialogRef> | undefined
  value: unknown
}
export const handleUpdateCharges = ({
  formikProps,
  index,
  isPremium,
  localCharge,
  name,
  premiumWarningDialogRef,
  value,
}: HandleUpdateChargesProps) => {
  // IMPORTANT: This check should stay first in this function
  // If user is not premium and try to switch to graduated percentage pricing
  // We should show the premium modal and prevent any formik value change
  if (name === 'chargeModel' && !isPremium && value === ChargeModelEnum.GraduatedPercentage) {
    premiumWarningDialogRef?.current?.openDialog()
    return
  }

  // NOTE: We prevent going further if the change is about the charge model and the value remain the same
  // It prevents fixing the properties to be wrongly reset to default on 2nd select.
  if (name === 'chargeModel' && value === localCharge.chargeModel) return

  let currentChargeValues: LocalChargeInput = {
    ...localCharge,
    [name]: value,
  }

  if (name === 'chargeModel') {
    // Reset charge data to default when switching charge model
    currentChargeValues = {
      ...currentChargeValues,
      payInAdvance: false,
      prorated: false,
      invoiceable: true,
      properties: getPropertyShape({}),
      filters: [],
      taxes: [],
    }
  }

  formikProps.setFieldValue(`charges.${index}`, currentChargeValues)
}
