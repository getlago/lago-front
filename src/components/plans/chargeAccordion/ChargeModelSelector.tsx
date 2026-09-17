import { Alert } from '~/components/designSystem/Alert'
import { BasicComboBoxData, ComboBox } from '~/components/form'
import { LocalFixedChargeInput, LocalUsageChargeInput } from '~/components/plans/types'
import { getChargeModelHelpTextTranslationKey } from '~/core/constants/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type ChargeModelSelectorProps = {
  label: string
  disabled: boolean | undefined
  // Narrowed to what is read, so a caller owning no charge need not fake one.
  localCharge: Pick<LocalUsageChargeInput | LocalFixedChargeInput, 'chargeModel'>
  chargeModelComboboxData: BasicComboBoxData[]
  handleUpdate: (name: string, value: unknown) => void
  alreadyUsedChargeAlertMessage?: string
  isInSubscriptionForm?: boolean
}

export const ChargeModelSelector = ({
  label,
  disabled,
  localCharge,
  chargeModelComboboxData,
  handleUpdate,
  alreadyUsedChargeAlertMessage,
  isInSubscriptionForm,
}: ChargeModelSelectorProps) => {
  const { translate } = useInternationalization()

  return (
    <div data-test="charge-model-wrapper">
      {!!alreadyUsedChargeAlertMessage && (
        <Alert type="warning" className="mb-4">
          {alreadyUsedChargeAlertMessage}
        </Alert>
      )}
      <ComboBox
        disableClearable
        name="chargeModel"
        disabled={isInSubscriptionForm || disabled}
        label={label}
        data={chargeModelComboboxData}
        value={localCharge.chargeModel}
        helperText={translate(getChargeModelHelpTextTranslationKey[localCharge.chargeModel])}
        onChange={(value) => handleUpdate('chargeModel', value)}
      />
    </div>
  )
}
