import { Alert } from 'lago-design-system'

import { BasicComboBoxData, ComboBox } from '~/components/form'
import { HandleUpdateChargesProps } from '~/components/plans/chargeAccordion/utils'
import { LocalChargeInput } from '~/components/plans/types'
import { getChargeModelHelpTextTranslationKey } from '~/core/constants/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const ChargeModelSelector = ({
  shouldDisplayAlreadyUsedChargeAlert,
  isInSubscriptionForm,
  disabled,
  localCharge,
  chargeModelComboboxData,
  handleUpdate,
}: {
  shouldDisplayAlreadyUsedChargeAlert: boolean
  isInSubscriptionForm: boolean | undefined
  disabled: boolean | undefined
  localCharge: LocalChargeInput
  chargeModelComboboxData: BasicComboBoxData[]
  handleUpdate: (
    name: HandleUpdateChargesProps['name'],
    value: HandleUpdateChargesProps['value'],
  ) => void
}) => {
  const { translate } = useInternationalization()

  return (
    <div className="p-4 pb-0" data-test="charge-model-wrapper">
      {!!shouldDisplayAlreadyUsedChargeAlert && (
        <Alert type="warning" className="mb-4">
          {translate('text_6435895831d323008a47911f')}
        </Alert>
      )}
      <ComboBox
        disableClearable
        name="chargeModel"
        disabled={isInSubscriptionForm || disabled}
        label={translate('text_65201b8216455901fe273dd5')}
        data={chargeModelComboboxData}
        value={localCharge.chargeModel}
        helperText={translate(getChargeModelHelpTextTranslationKey[localCharge.chargeModel])}
        onChange={(value) => handleUpdate('chargeModel', value)}
      />
    </div>
  )
}
