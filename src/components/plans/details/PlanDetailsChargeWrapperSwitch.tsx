import { useId } from 'react'

import { Alert, Chip } from '~/components/designSystem'
import { JsonEditor } from '~/components/form'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  AppliedPricingUnit,
  ChargeModelEnum,
  CurrencyEnum,
  Maybe,
  Properties,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const PlanDetailsChargeWrapperSwitch = ({
  currency,
  chargeModel,
  values,
  chargeAppliedPricingUnit,
}: {
  currency: CurrencyEnum
  chargeModel: ChargeModelEnum
  values?: Maybe<Properties>
  chargeAppliedPricingUnit: Maybe<AppliedPricingUnit> | undefined
}) => {
  const componentId = useId()
  const { translate } = useInternationalization()
  const pricingGroupKeys = values?.pricingGroupKeys || undefined

  return (
    <div className="flex flex-col gap-4">
      {chargeModel === ChargeModelEnum.Standard && (
        <DetailsPage.TableDisplay
          name="standard"
          header={[translate('text_624453d52e945301380e49b6')]}
          body={[
            [
              intlFormatNumber(Number(values?.amount) || 0, {
                pricingUnitShortName: chargeAppliedPricingUnit?.pricingUnit?.shortName,
                currency: currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 15,
              }),
            ],
          ]}
        />
      )}
      {chargeModel === ChargeModelEnum.Package && (
        <DetailsPage.TableDisplay
          name="package"
          header={[
            translate('text_624453d52e945301380e49b6'),
            translate('text_65201b8216455901fe273de7'),
            translate('text_65201b8216455901fe273de8'),
          ]}
          body={[
            [
              intlFormatNumber(Number(values?.amount) || 0, {
                pricingUnitShortName: chargeAppliedPricingUnit?.pricingUnit?.shortName,
                currency: currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 15,
              }),
              values?.packageSize,
              values?.freeUnits,
            ],
          ]}
        />
      )}
      {chargeModel === ChargeModelEnum.Graduated && !!values?.graduatedRanges?.length && (
        <DetailsPage.TableDisplay
          name="graduated-ranges"
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
                  pricingUnitShortName: chargeAppliedPricingUnit?.pricingUnit?.shortName,
                  currency: currency,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 15,
                }),
                intlFormatNumber(Number(value.flatAmount) || 0, {
                  pricingUnitShortName: chargeAppliedPricingUnit?.pricingUnit?.shortName,
                  currency: currency,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 15,
                }),
              ]
            })
          })()}
        />
      )}
      {chargeModel === ChargeModelEnum.GraduatedPercentage &&
        !!values?.graduatedPercentageRanges?.length && (
          <DetailsPage.TableDisplay
            name="graduated-percentage-ranges"
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
                    maximumFractionDigits: 15,
                  }),
                  intlFormatNumber(Number(value.flatAmount) || 0, {
                    pricingUnitShortName: chargeAppliedPricingUnit?.pricingUnit?.shortName,
                    currency: currency,
                    maximumFractionDigits: 15,
                  }),
                ]
              })
            })()}
          />
        )}
      {chargeModel === ChargeModelEnum.Percentage && (
        <>
          <DetailsPage.TableDisplay
            name="percentage"
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
                  maximumFractionDigits: 15,
                }),
                intlFormatNumber(Number(values?.fixedAmount) || 0, {
                  pricingUnitShortName: chargeAppliedPricingUnit?.pricingUnit?.shortName,
                  currency: currency,
                }),
                !!values?.freeUnitsPerEvents ? values?.freeUnitsPerEvents : 0,
                intlFormatNumber(Number(values?.freeUnitsPerTotalAggregation) || 0, {
                  pricingUnitShortName: chargeAppliedPricingUnit?.pricingUnit?.shortName,
                  currency: currency,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 15,
                }),
              ],
            ]}
          />

          <DetailsPage.InfoGrid
            grid={[
              {
                label: translate('text_65201b8216455901fe273e01'),
                value: intlFormatNumber(Number(values?.perTransactionMinAmount || 0), {
                  pricingUnitShortName: chargeAppliedPricingUnit?.pricingUnit?.shortName,
                  currency: currency,
                  minimumFractionDigits: 2,
                }),
              },
              {
                label: translate('text_65201b8216455901fe273e03'),
                value: intlFormatNumber(Number(values?.perTransactionMaxAmount || 0), {
                  pricingUnitShortName: chargeAppliedPricingUnit?.pricingUnit?.shortName,
                  currency: currency,
                  minimumFractionDigits: 2,
                }),
              },
            ]}
          />
        </>
      )}
      {chargeModel === ChargeModelEnum.Volume && !!values?.volumeRanges?.length && (
        <DetailsPage.TableDisplay
          name="volume-ranges"
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
                  pricingUnitShortName: chargeAppliedPricingUnit?.pricingUnit?.shortName,
                  currency: currency,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 15,
                }),
                intlFormatNumber(Number(value.flatAmount) || 0, {
                  pricingUnitShortName: chargeAppliedPricingUnit?.pricingUnit?.shortName,
                  currency: currency,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 15,
                }),
              ]
            })
          })()}
        />
      )}
      {chargeModel === ChargeModelEnum.Custom && (
        <DetailsPage.TableDisplay
          name="custom"
          className="[&_tbody_td]:p-0"
          header={[translate('text_663dea5702b60301d8d06502')]}
          body={[
            [
              <JsonEditor
                key="custom-json-editor"
                label={translate('text_663dea5702b60301d8d06502')}
                value={values?.customProperties}
                hideLabel
                readOnly
              />,
            ],
          ]}
        />
      )}
      {chargeModel === ChargeModelEnum.Dynamic && (
        <Alert type="info">{translate('text_17277706303454rxgscdqklx')}</Alert>
      )}

      {chargeModel !== ChargeModelEnum.Custom && !!pricingGroupKeys?.length && (
        <DetailsPage.InfoGridItem
          label={translate('text_65ba6d45e780c1ff8acb20ce')}
          value={
            <div className="mt-1 flex flex-wrap gap-2">
              {pricingGroupKeys?.map((group, groupIndex) => (
                <Chip key={`${componentId}-${groupIndex}`} label={group} />
              ))}
            </div>
          }
        />
      )}
    </div>
  )
}
