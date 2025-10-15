import { Button, Tooltip } from 'lago-design-system'
import { RefObject } from 'react'

import { RemoveChargeWarningDialogRef } from '~/components/plans/RemoveChargeWarningDialog'
import { LocalUsageChargeInput } from '~/components/plans/types'
import { useDuplicatePlanVar } from '~/core/apolloClient'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const RemoveChargeButton = ({
  isInSubscriptionForm,
  isUsedInSubscription,
  removeChargeWarningDialogRef,
  existingCharges,
  chargeToRemoveIndex,
  onDeleteCharge,
}: {
  isInSubscriptionForm: boolean | undefined
  isUsedInSubscription: boolean | undefined
  removeChargeWarningDialogRef: RefObject<RemoveChargeWarningDialogRef> | undefined
  existingCharges: LocalUsageChargeInput[]
  chargeToRemoveIndex: number
  onDeleteCharge: (charges: LocalUsageChargeInput[]) => void
}) => {
  const { translate } = useInternationalization()
  const { type: actionType } = useDuplicatePlanVar()

  return (
    <>
      {!isInSubscriptionForm && (
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
                removeChargeWarningDialogRef?.current?.openDialog(chargeToRemoveIndex)
              } else {
                deleteCharge()
              }
            }}
          />
        </Tooltip>
      )}
    </>
  )
}
