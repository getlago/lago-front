import { RefObject } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { RemoveChargeWarningDialogRef } from '~/components/plans/RemoveChargeWarningDialog'
import { LocalFixedChargeInput, LocalUsageChargeInput } from '~/components/plans/types'
import { useDuplicatePlanVar } from '~/core/apolloClient'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const RemoveChargeButton = ({
  isUsedInSubscription,
  removeChargeWarningDialogRef,
  existingCharges,
  chargeToRemoveIndex,
  onDeleteCharge,
}: {
  isUsedInSubscription: boolean | undefined
  removeChargeWarningDialogRef: RefObject<RemoveChargeWarningDialogRef> | undefined
  existingCharges: LocalUsageChargeInput[] | LocalFixedChargeInput[]
  chargeToRemoveIndex: number
  onDeleteCharge: (charges: (LocalUsageChargeInput | LocalFixedChargeInput)[]) => void
}) => {
  const { translate } = useInternationalization()
  const { type: actionType } = useDuplicatePlanVar()

  return (
    <Tooltip placement="top-end" title={translate('text_624aa732d6af4e0103d40e65')}>
      <Button
        variant="quaternary"
        size="small"
        icon="trash"
        data-test="remove-charge"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation()
          e.preventDefault()

          const deleteCharge = () => {
            const charges = [...existingCharges]

            charges.splice(chargeToRemoveIndex, 1)
            onDeleteCharge(charges)
          }

          if (actionType !== 'duplicate' && isUsedInSubscription) {
            removeChargeWarningDialogRef?.current?.openDialog({ callback: deleteCharge })
          } else {
            deleteCharge()
          }
        }}
      />
    </Tooltip>
  )
}
