import { memo, useCallback, useMemo } from 'react'

import { Alert } from '~/components/designSystem/Alert'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { ALL_CHARGE_MODELS, AnyChargeModel } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  ChargeModelEnum,
  CurrencyEnum,
  FixedChargeChargeModelEnum,
  FixedChargeProperties,
  Maybe,
  Properties,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { CustomChargeDetails } from './CustomChargeDetails'
import { formatChargeDetailsAmount } from './formatChargeDetailsAmount'
import { PackageChargeDetails } from './PackageChargeDetails'
import { PercentageChargeDetails } from './PercentageChargeDetails'
import PlanDetailsPresentationGroupKeys from './PlanDetailsPresentationGroupKeys'
import { PricingGroupKeysDetails } from './PricingGroupKeysDetails'
import { StandardChargeDetails } from './StandardChargeDetails'

const isUsageChargeProperties = (
  values?: Maybe<Properties> | Maybe<FixedChargeProperties>,
): values is Properties => {
  if (!values) return false

  return values?.__typename === 'Properties'
}

export const PlanDetailsChargeWrapperSwitch = memo(
  ({
    currency,
    chargeModel,
    values,
    chargeAppliedPricingUnit,
    showPresentationGroupKeys = true,
  }: {
    currency: CurrencyEnum
    chargeModel: ChargeModelEnum | FixedChargeChargeModelEnum
    values?: Maybe<Properties> | Maybe<FixedChargeProperties>
    chargeAppliedPricingUnit?: Maybe<{ pricingUnit?: Maybe<{ shortName?: string }> }>
    showPresentationGroupKeys?: boolean
  }) => {
    const { translate } = useInternationalization()

    const isUsageCharge = isUsageChargeProperties(values)
    const usageValues = isUsageCharge ? values : undefined
    const pricingUnitShortName = chargeAppliedPricingUnit?.pricingUnit?.shortName
    const presentationGroupKeys = usageValues?.presentationGroupKeys

    const formatAmountWithCurrency = useCallback(
      (
        amount: number,
        options?: { minimumFractionDigits?: number; maximumFractionDigits?: number },
      ) => formatChargeDetailsAmount(amount, { currency, pricingUnitShortName, ...options }),
      [currency, pricingUnitShortName],
    )

    const chargeModelConfigs: Record<
      AnyChargeModel,
      {
        isVisible: boolean
        content: JSX.Element
      }
    > = useMemo(
      () => ({
        [ALL_CHARGE_MODELS.Standard]: {
          isVisible: true,
          content: (
            <StandardChargeDetails
              amount={values?.amount}
              currency={currency}
              pricingUnitShortName={pricingUnitShortName}
            />
          ),
        },
        [ALL_CHARGE_MODELS.Package]: {
          isVisible: !!isUsageCharge,
          content: (
            <PackageChargeDetails
              amount={values?.amount}
              packageSize={usageValues?.packageSize}
              freeUnits={usageValues?.freeUnits}
              currency={currency}
              pricingUnitShortName={pricingUnitShortName}
            />
          ),
        },
        [ALL_CHARGE_MODELS.Graduated]: {
          isVisible: true,
          content: (
            <DetailsPage.TableDisplay
              name="graduated-ranges"
              header={[
                translate('text_62793bbb599f1c01522e91ab'),
                translate('text_62793bbb599f1c01522e91b1'),
                translate('text_62793bbb599f1c01522e91b6'),
                translate('text_62793bbb599f1c01522e91bc'),
              ]}
              body={
                values?.graduatedRanges?.map((value) => [
                  value.fromValue,
                  value.toValue || '∞',
                  formatAmountWithCurrency(Number(value.perUnitAmount) || 0),
                  formatAmountWithCurrency(Number(value.flatAmount) || 0),
                ]) || []
              }
            />
          ),
        },
        [ALL_CHARGE_MODELS.GraduatedPercentage]: {
          isVisible: !!isUsageCharge,
          content: (
            <DetailsPage.TableDisplay
              name="graduated-percentage-ranges"
              header={[
                translate('text_62793bbb599f1c01522e91ab'),
                translate('text_62793bbb599f1c01522e91b1'),
                translate('text_64de472463e2da6b31737de0'),
                translate('text_62793bbb599f1c01522e91bc'),
              ]}
              body={
                isUsageCharge
                  ? values.graduatedPercentageRanges?.map((value) => [
                      value.fromValue,
                      value.toValue || '∞',
                      intlFormatNumber(Number(value.rate) / 100 || 0, {
                        style: 'percent',
                        maximumFractionDigits: 15,
                      }),
                      formatAmountWithCurrency(Number(value.flatAmount) || 0, {
                        minimumFractionDigits: 2,
                      }),
                    ]) || []
                  : []
              }
            />
          ),
        },
        [ALL_CHARGE_MODELS.Percentage]: {
          isVisible: !!isUsageCharge,
          content: (
            <PercentageChargeDetails
              rate={usageValues?.rate}
              fixedAmount={usageValues?.fixedAmount}
              freeUnitsPerEvents={usageValues?.freeUnitsPerEvents}
              freeUnitsPerTotalAggregation={usageValues?.freeUnitsPerTotalAggregation}
              perTransactionMinAmount={usageValues?.perTransactionMinAmount}
              perTransactionMaxAmount={usageValues?.perTransactionMaxAmount}
              currency={currency}
              pricingUnitShortName={pricingUnitShortName}
            />
          ),
        },
        [ALL_CHARGE_MODELS.Volume]: {
          isVisible: true,
          content: (
            <DetailsPage.TableDisplay
              name="volume-ranges"
              header={[
                translate('text_62793bbb599f1c01522e91ab'),
                translate('text_62793bbb599f1c01522e91b1'),
                translate('text_62793bbb599f1c01522e91b6'),
                translate('text_62793bbb599f1c01522e91bc'),
              ]}
              body={
                values?.volumeRanges?.map((value) => [
                  value.fromValue,
                  value.toValue || '∞',
                  formatAmountWithCurrency(Number(value.perUnitAmount) || 0),
                  formatAmountWithCurrency(Number(value.flatAmount) || 0),
                ]) || []
              }
            />
          ),
        },
        [ALL_CHARGE_MODELS.Custom]: {
          isVisible: !!isUsageCharge,
          content: <CustomChargeDetails customProperties={usageValues?.customProperties} />,
        },
        [ALL_CHARGE_MODELS.Dynamic]: {
          isVisible: true,
          content: <Alert type="info">{translate('text_17277706303454rxgscdqklx')}</Alert>,
        },
      }),
      [
        currency,
        formatAmountWithCurrency,
        isUsageCharge,
        pricingUnitShortName,
        translate,
        usageValues,
        values,
      ],
    )

    const { isVisible, content } = chargeModelConfigs[chargeModel]

    return (
      <div className="flex flex-col gap-4">
        {isVisible && content}

        <PricingGroupKeysDetails pricingGroupKeys={usageValues?.pricingGroupKeys} />

        {showPresentationGroupKeys && !!presentationGroupKeys?.length && (
          <PlanDetailsPresentationGroupKeys presentationGroupKeys={presentationGroupKeys} />
        )}
      </div>
    )
  },
)

PlanDetailsChargeWrapperSwitch.displayName = 'PlanDetailsChargeWrapperSwitch'
