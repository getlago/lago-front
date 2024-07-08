import styled from 'styled-components'

import { Icon, Typography } from '~/components/designSystem'
import { BasicComboBoxData } from '~/components/form'
import { AggregationTypeEnum, ChargeModelEnum } from '~/generated/graphql'
import { theme } from '~/styles'

import { useInternationalization } from '../core/useInternationalization'

export type TGetChargeModelComboboxDataProps = {
  isPremium: boolean
  aggregationType: AggregationTypeEnum
}

type TUseChargeFormReturn = {
  getChargeModelComboboxData: (data: TGetChargeModelComboboxDataProps) => BasicComboBoxData[]
}

export const useChargeForm: () => TUseChargeFormReturn = () => {
  const { translate } = useInternationalization()

  const getChargeModelComboboxData = ({
    isPremium,
    aggregationType,
  }: TGetChargeModelComboboxDataProps): BasicComboBoxData[] => {
    const chargeModelComboboxData: BasicComboBoxData[] = [
      {
        label: translate('text_62793bbb599f1c01522e919f'),
        value: ChargeModelEnum.Graduated,
      },
      {
        label: translate('text_6282085b4f283b0102655868'),
        value: ChargeModelEnum.Package,
      },
      {
        label: translate('text_624aa732d6af4e0103d40e6f'),
        value: ChargeModelEnum.Standard,
      },
      {
        label: translate('text_6304e74aab6dbc18d615f386'),
        value: ChargeModelEnum.Volume,
      },
    ]

    if (aggregationType !== AggregationTypeEnum.LatestAgg) {
      chargeModelComboboxData.push(
        {
          labelNode: (
            <InlineComboboxLabelForPremiumWrapper>
              <InlineComboboxLabel>
                <Typography variant="body" color="grey700">
                  {translate('text_64de472463e2da6b31737db0')}
                </Typography>
              </InlineComboboxLabel>
              {!isPremium && <Icon name="sparkles" />}
            </InlineComboboxLabelForPremiumWrapper>
          ),
          label: translate('text_64de472463e2da6b31737db0'),
          value: ChargeModelEnum.GraduatedPercentage,
        },
        {
          label: translate('text_62a0b7107afa2700a65ef6e2'),
          value: ChargeModelEnum.Percentage,
        },
      )
    }

    if (aggregationType === AggregationTypeEnum.CustomAgg) {
      chargeModelComboboxData.push({
        label: translate('text_663dea5702b60301d8d064fa'),
        value: ChargeModelEnum.Custom,
      })
    }

    return chargeModelComboboxData.sort((a, b) => {
      return a.label && b.label ? a.label.localeCompare(b.label) : a.value.localeCompare(b.value)
    })
  }

  return {
    getChargeModelComboboxData,
  }
}

const InlineComboboxLabelForPremiumWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const InlineComboboxLabel = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(2)};
`
