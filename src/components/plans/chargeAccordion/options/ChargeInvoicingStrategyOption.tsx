import { Icon } from 'lago-design-system'
import { FC, useState } from 'react'

import { Button, PremiumBanner, Typography } from '~/components/designSystem'
import { Radio } from '~/components/form'
import { LocalUsageChargeInput } from '~/components/plans/types'
import { RegroupPaidFeesEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'

interface ChargeInvoicingStrategyOptionProps {
  localCharge: LocalUsageChargeInput
  disabled?: boolean
  openPremiumDialog: VoidFunction
  handleUpdate: ({
    invoiceable,
    regroupPaidFees,
  }: {
    invoiceable: boolean
    regroupPaidFees: RegroupPaidFeesEnum | null
  }) => void
}

type ChargeBillingRadioValue = 'invoiceable' | 'regroupPaidFees' | 'none'

export const ChargeInvoicingStrategyOption: FC<ChargeInvoicingStrategyOptionProps> = ({
  localCharge,
  disabled,
  openPremiumDialog,
  handleUpdate,
}) => {
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()

  const getInitialValue = (): ChargeBillingRadioValue | undefined => {
    if (localCharge.payInAdvance) {
      if (localCharge.regroupPaidFees === RegroupPaidFeesEnum.Invoice) {
        return 'regroupPaidFees'
      }

      if (localCharge.invoiceable) {
        return 'invoiceable'
      }

      return 'none'
    }
  }

  const [radioValue, setRadioValue] = useState<ChargeBillingRadioValue | undefined>(
    getInitialValue(),
  )

  if (!radioValue) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <Typography variant="captionHl" color="textSecondary" component="legend">
          {translate('text_6682c52081acea90520744ca')}
        </Typography>
        <Typography variant="caption">{translate('text_6682c52081acea90520745c4')}</Typography>
      </div>

      <Radio
        label={translate('text_6687b0081931407697975943')}
        value={'invoiceable'}
        checked={radioValue === 'invoiceable'}
        onChange={(value) => {
          setRadioValue(value as ChargeBillingRadioValue)
          handleUpdate({ invoiceable: true, regroupPaidFees: null })
        }}
        labelVariant="body"
        disabled={disabled}
      />
      {!isPremium && (
        <PremiumBanner
          variant="grey"
          title={translate('text_6682c52081acea90520744d0')}
          description={translate('text_6682c52081acea90520744d2')}
          premiumWarningDialogRef={{ current: { openDialog: openPremiumDialog } } as any}
          className="rounded-lg px-6 py-4"
        />
      )}
      <Radio
        label={translate('text_6687b0081931407697975945')}
        value={'regroupPaidFees'}
        checked={radioValue === 'regroupPaidFees'}
        onChange={(value) => {
          setRadioValue(value as ChargeBillingRadioValue)
          handleUpdate({ invoiceable: false, regroupPaidFees: RegroupPaidFeesEnum.Invoice })
        }}
        labelVariant="body"
        disabled={!isPremium || disabled}
      />
      <Radio
        label={translate('text_6687b0081931407697975947')}
        value={'none'}
        checked={radioValue === 'none'}
        onChange={(value) => {
          setRadioValue(value as ChargeBillingRadioValue)
          handleUpdate({ invoiceable: false, regroupPaidFees: null })
        }}
        labelVariant="body"
        disabled={!isPremium || disabled}
      />
    </div>
  )
}
