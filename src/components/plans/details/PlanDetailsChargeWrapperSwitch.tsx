import styled from 'styled-components'

import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  ChargeModelEnum,
  CurrencyEnum,
  GroupProperties,
  Maybe,
  Properties,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'
import { DetailsInfoGrid, DetailsInfoItem } from '~/styles/detailsPage'

import PlanDetailsChargeTableDisplay from './PlanDetailsChargeTableDisplay'

const PlanDetailsChargeWrapperSwitch = ({
  currency,
  chargeModel,
  values,
}: {
  currency: CurrencyEnum
  chargeModel: ChargeModelEnum
  values?: Maybe<Properties> | Maybe<GroupProperties['values']>
}) => {
  const { translate } = useInternationalization()

  return (
    <div>
      {chargeModel === ChargeModelEnum.Standard && (
        <ChargeContentWrapper>
          <PlanDetailsChargeTableDisplay
            header={[translate('text_624453d52e945301380e49b6')]}
            body={[
              [
                intlFormatNumber(Number(values?.amount) || 0, {
                  currency: currency,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 15,
                }),
              ],
            ]}
          />
        </ChargeContentWrapper>
      )}
      {chargeModel === ChargeModelEnum.Package && (
        <ChargeContentWrapper>
          <PlanDetailsChargeTableDisplay
            header={[
              translate('text_624453d52e945301380e49b6'),
              translate('text_65201b8216455901fe273de7'),
              translate('text_65201b8216455901fe273de8'),
            ]}
            body={[
              [
                intlFormatNumber(Number(values?.amount) || 0, {
                  currency: currency,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 15,
                }),
                values?.packageSize,
                values?.freeUnits,
              ],
            ]}
          />
        </ChargeContentWrapper>
      )}
      {chargeModel === ChargeModelEnum.Graduated && !!values?.graduatedRanges?.length && (
        <ChargeContentWrapper>
          <PlanDetailsChargeTableDisplay
            header={[
              translate('text_62793bbb599f1c01522e91ab'),
              translate('text_62793bbb599f1c01522e91b1'),
              translate('text_62793bbb599f1c01522e91b6'),
              translate('text_62793bbb599f1c01522e91bc'),
            ]}
            body={(() => {
              return values?.graduatedRanges?.map((value) => {
                return [
                  value.fromValue,
                  value.toValue || '∞',
                  intlFormatNumber(Number(value.perUnitAmount) || 0, {
                    currency: currency,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 15,
                  }),
                  intlFormatNumber(Number(value.flatAmount) || 0, {
                    currency: currency,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 15,
                  }),
                ]
              })
            })()}
          />
        </ChargeContentWrapper>
      )}
      {chargeModel === ChargeModelEnum.GraduatedPercentage &&
        !!values?.graduatedPercentageRanges?.length && (
          <ChargeContentWrapper>
            <PlanDetailsChargeTableDisplay
              header={[
                translate('text_62793bbb599f1c01522e91ab'),
                translate('text_62793bbb599f1c01522e91b1'),
                translate('text_64de472463e2da6b31737de0'),
                translate('text_62793bbb599f1c01522e91bc'),
              ]}
              body={(() => {
                return values?.graduatedPercentageRanges?.map((value) => {
                  return [
                    value.fromValue,
                    value.toValue || '∞',
                    intlFormatNumber(Number(value.rate) / 100 || 0, {
                      style: 'percent',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 15,
                    }),
                    intlFormatNumber(Number(value.flatAmount) || 0, {
                      currency: currency,
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 15,
                    }),
                  ]
                })
              })()}
            />
          </ChargeContentWrapper>
        )}
      {chargeModel === ChargeModelEnum.Percentage && (
        <ChargeContentWrapper>
          <PlanDetailsChargeTableDisplay
            header={[
              translate('text_64de472463e2da6b31737de0'),
              translate('text_62ff5d01a306e274d4ffcc1e'),
              translate('text_65201b8216455901fe273dfb'),
              translate('text_62ff5d01a306e274d4ffcc48'),
            ]}
            body={[
              [
                intlFormatNumber(Number(values?.rate) / 100 || 0, {
                  style: 'percent',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 15,
                }),
                intlFormatNumber(Number(values?.fixedAmount) || 0, {
                  currency: currency,
                }),
                !!values?.freeUnitsPerEvents ? values?.freeUnitsPerEvents : 0,
                intlFormatNumber(Number(values?.freeUnitsPerTotalAggregation) || 0, {
                  currency: currency,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 15,
                }),
              ],
            ]}
          />

          <DetailsInfoGrid>
            <DetailsInfoItem
              label={translate('text_65201b8216455901fe273e01')}
              value={intlFormatNumber(Number(values?.perTransactionMinAmount || 0), {
                currency: currency,
                minimumFractionDigits: 2,
              })}
            />
            <DetailsInfoItem
              label={translate('text_65201b8216455901fe273e03')}
              value={intlFormatNumber(Number(values?.perTransactionMaxAmount || 0), {
                currency: currency,
                minimumFractionDigits: 2,
              })}
            />
          </DetailsInfoGrid>
        </ChargeContentWrapper>
      )}
      {chargeModel === ChargeModelEnum.Volume && !!values?.volumeRanges?.length && (
        <ChargeContentWrapper>
          <PlanDetailsChargeTableDisplay
            header={[
              translate('text_62793bbb599f1c01522e91ab'),
              translate('text_62793bbb599f1c01522e91b1'),
              translate('text_62793bbb599f1c01522e91b6'),
              translate('text_62793bbb599f1c01522e91bc'),
            ]}
            body={(() => {
              return values?.volumeRanges?.map((value) => {
                return [
                  value.fromValue,
                  value.toValue || '∞',
                  intlFormatNumber(Number(value.perUnitAmount) || 0, {
                    currency: currency,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 15,
                  }),
                  intlFormatNumber(Number(value.flatAmount) || 0, {
                    currency: currency,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 15,
                  }),
                ]
              })
            })()}
          />
        </ChargeContentWrapper>
      )}
    </div>
  )
}

export default PlanDetailsChargeWrapperSwitch

const ChargeContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(4)};
`
