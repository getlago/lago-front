import { FormikProps, FormikState } from 'formik'
import { memo, RefObject } from 'react'

import { Switch } from '~/components/form'
import FixedChargesUnits from '~/components/plans/chargeAccordion/FixedChargesUnits'
import { isFixedChargeInput, isUsageChargeInput } from '~/components/plans/chargeAccordion/utils'
import { ChargePercentage } from '~/components/plans/ChargePercentage'
import { CustomCharge } from '~/components/plans/CustomCharge'
import { DynamicCharge } from '~/components/plans/DynamicCharge'
import { GraduatedChargeTable } from '~/components/plans/GraduatedChargeTable'
import { GraduatedPercentageChargeTable } from '~/components/plans/GraduatedPercentageChargeTable'
import { PackageCharge } from '~/components/plans/PackageCharge'
import PricingGroupKeys from '~/components/plans/PricingGroupKeys'
import { StandardCharge } from '~/components/plans/StandardCharge'
import { LocalChargeFilterInput, PlanFormInput } from '~/components/plans/types'
import { VolumeChargeTable } from '~/components/plans/VolumeChargeTable'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { CurrencyEnum, PropertiesInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export type ChargeCursor = keyof Pick<PlanFormInput, 'charges' | 'fixedCharges'>

interface ChargeWrapperSwitchProps {
  chargeCursor: ChargeCursor
  chargeErrors: FormikState<PlanFormInput>['errors']
  chargeIndex: number
  chargePricingUnitShortName: string | undefined
  currency: CurrencyEnum
  disabled?: boolean
  filterIndex?: number
  formikProps: FormikProps<PlanFormInput>
  premiumWarningDialogRef?: RefObject<PremiumWarningDialogRef>
  propertyCursor: string
  setFieldValue: FormikProps<PlanFormInput>['setFieldValue']
  valuePointer: PropertiesInput | LocalChargeFilterInput['properties'] | undefined
}

export const ChargeWrapperSwitch = memo(
  ({
    chargeCursor,
    chargeIndex,
    chargeErrors,
    chargePricingUnitShortName,
    currency,
    disabled,
    filterIndex,
    formikProps,
    premiumWarningDialogRef,
    propertyCursor,
    setFieldValue,
    valuePointer,
  }: ChargeWrapperSwitchProps) => {
    const { translate } = useInternationalization()
    const localCharge = formikProps.values[chargeCursor]?.[chargeIndex]
    const isFixedCharge = isFixedChargeInput(chargeCursor, localCharge)
    const isUsageCharge = isUsageChargeInput(chargeCursor, localCharge)

    return (
      <div className="m-4 flex flex-col gap-6">
        {localCharge?.chargeModel === 'standard' && (
          <>
            <StandardCharge
              chargeCursor={chargeCursor}
              chargeIndex={chargeIndex}
              chargePricingUnitShortName={chargePricingUnitShortName}
              currency={currency}
              disabled={disabled}
              propertyCursor={propertyCursor}
              setFieldValue={setFieldValue}
              valuePointer={valuePointer}
            />
          </>
        )}
        {localCharge?.chargeModel === 'package' && (
          <PackageCharge
            chargeCursor={chargeCursor}
            chargeErrors={chargeErrors}
            chargeIndex={chargeIndex}
            chargePricingUnitShortName={chargePricingUnitShortName}
            currency={currency}
            disabled={disabled}
            propertyCursor={propertyCursor}
            setFieldValue={setFieldValue}
            valuePointer={valuePointer}
          />
        )}
        {localCharge?.chargeModel === 'graduated' && (
          <GraduatedChargeTable
            chargeCursor={chargeCursor}
            chargeIndex={chargeIndex}
            chargePricingUnitShortName={chargePricingUnitShortName}
            currency={currency}
            disabled={disabled}
            propertyCursor={propertyCursor}
            setFieldValue={setFieldValue}
            valuePointer={valuePointer}
          />
        )}
        {localCharge?.chargeModel === 'graduated_percentage' && (
          <GraduatedPercentageChargeTable
            chargeCursor={chargeCursor}
            chargeIndex={chargeIndex}
            chargePricingUnitShortName={chargePricingUnitShortName}
            currency={currency}
            disabled={disabled}
            propertyCursor={propertyCursor}
            setFieldValue={setFieldValue}
            valuePointer={valuePointer}
          />
        )}
        {localCharge?.chargeModel === 'percentage' && (
          <ChargePercentage
            chargeCursor={chargeCursor}
            chargeErrors={chargeErrors}
            chargeIndex={chargeIndex}
            chargePricingUnitShortName={chargePricingUnitShortName}
            currency={currency}
            disabled={disabled}
            filterIndex={filterIndex}
            premiumWarningDialogRef={premiumWarningDialogRef}
            propertyCursor={propertyCursor}
            setFieldValue={setFieldValue}
            valuePointer={valuePointer}
          />
        )}
        {localCharge?.chargeModel === 'volume' && (
          <VolumeChargeTable
            chargeCursor={chargeCursor}
            chargeIndex={chargeIndex}
            chargePricingUnitShortName={chargePricingUnitShortName}
            currency={currency}
            disabled={disabled}
            propertyCursor={propertyCursor}
            setFieldValue={setFieldValue}
            valuePointer={valuePointer}
          />
        )}
        {localCharge?.chargeModel === 'custom' && (
          <CustomCharge
            chargeCursor={chargeCursor}
            chargeErrors={chargeErrors}
            chargeIndex={chargeIndex}
            disabled={disabled}
            propertyCursor={propertyCursor}
            setFieldValue={setFieldValue}
            valuePointer={valuePointer}
          />
        )}
        {localCharge?.chargeModel === 'dynamic' && <DynamicCharge />}

        {isUsageCharge && (
          <PricingGroupKeys
            disabled={disabled}
            handleUpdate={(name, value) => {
              setFieldValue(`${chargeCursor}.${chargeIndex}.${name}`, value)
            }}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        )}

        {isFixedCharge && (
          <>
            <FixedChargesUnits
              onChange={(value) => setFieldValue(`${chargeCursor}.${chargeIndex}.units`, value)}
              value={localCharge.units}
            />

            <Switch
              name={`${chargeCursor}.${chargeIndex}.applyUnitsImmediately`}
              label={translate('text_1760721761361octnb0dfqm5')}
              subLabel={translate('text_1760721761361lqhc17vjr2b')}
              onChange={(value) =>
                setFieldValue(`${chargeCursor}.${chargeIndex}.applyUnitsImmediately`, value)
              }
              checked={localCharge.applyUnitsImmediately || false}
            />
          </>
        )}
      </div>
    )
  },
)

ChargeWrapperSwitch.displayName = 'ChargeWrapperSwitch'
