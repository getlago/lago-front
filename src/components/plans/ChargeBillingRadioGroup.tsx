import { FC, useState } from 'react'
import styled from 'styled-components'

import { Button, Icon, Typography } from '~/components/designSystem'
import { Radio } from '~/components/form'
import { LocalChargeInput } from '~/components/plans/types'
import { RegroupPaidFeesEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { theme } from '~/styles'

interface ChargeBillingRadioGroupProps {
  localCharge: LocalChargeInput
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

export const ChargeBillingRadioGroup: FC<ChargeBillingRadioGroupProps> = ({
  localCharge,
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
    <RadioGroup>
      <RadioLabel>
        <Typography variant="captionHl" color="textSecondary" component="legend">
          {translate('text_6682c52081acea90520744ca')}
        </Typography>
        <Typography variant="caption">{translate('text_6682c52081acea90520745c4')}</Typography>
      </RadioLabel>

      <Radio
        label={translate('text_6687b0081931407697975943')}
        value={'invoiceable'}
        checked={radioValue === 'invoiceable'}
        onChange={(value) => {
          setRadioValue(value as ChargeBillingRadioValue)
          handleUpdate({ invoiceable: true, regroupPaidFees: null })
        }}
        labelVariant="body"
      />
      {!isPremium && (
        <PremiumOption>
          <div>
            <Typography variant="bodyHl" color="textSecondary">
              {translate('text_6682c52081acea90520744d0')}
              <StyledIcon name="sparkles" />
            </Typography>

            <Typography variant="caption">{translate('text_6682c52081acea90520744d2')}</Typography>
          </div>
          <Button endIcon="sparkles" variant="tertiary" onClick={openPremiumDialog}>
            {translate('text_65ae73ebe3a66bec2b91d72d')}
          </Button>
        </PremiumOption>
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
        disabled={!isPremium}
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
        disabled={!isPremium}
      />
    </RadioGroup>
  )
}

const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(2)};
`

const RadioLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(1)};
  margin-bottom: ${theme.spacing(2)};
`

const PremiumOption = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: ${theme.spacing(4)};
  background-color: ${theme.palette.grey[100]};
  border-radius: 8px;
  padding: ${theme.spacing(4)} ${theme.spacing(6)};
`

const StyledIcon = styled(Icon)`
  margin-left: ${theme.spacing(2)};
`
