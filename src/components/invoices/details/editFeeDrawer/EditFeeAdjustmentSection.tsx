import InputAdornment from '@mui/material/InputAdornment'
import { useStore } from '@tanstack/react-form'

import { Alert } from '~/components/designSystem/Alert'
import { Typography } from '~/components/designSystem/Typography'
import { BasicComboBoxData, ComboBox } from '~/components/form'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { AdjustedFeeTypeEnum, CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useFieldContext } from '~/hooks/forms/formContext'
import { withForm } from '~/hooks/forms/useAppform'
import { useFieldError } from '~/hooks/forms/useFieldError'

import { calculateTotalAmount } from './utils'
import { EDIT_FEE_DEFAULT_VALUES } from './validationSchema'

import { EDIT_FEE_DRAWER_ADJUSTMENT_TYPE_COMBOBOX_TEST_ID } from '../invoiceDetailsTestIds'

type PricingUnitUsage = { shortName?: string | null; conversionRate?: number | null } | null

/**
 * Raw `ComboBox` rather than the registered `field.ComboBoxField`: picking a type also clears
 * the sibling amounts, which the wrapper does not reproduce.
 */
const AdjustmentTypeComboBox = ({
  data,
  onAfterChange,
}: {
  data: BasicComboBoxData[]
  onAfterChange: () => void
}) => {
  const { translate } = useInternationalization()
  const field = useFieldContext<AdjustedFeeTypeEnum | undefined>()
  const error = useFieldError({ translateErrors: true, firstOnly: true, noBoolean: true })

  return (
    <ComboBox
      label={translate('text_65a6b4e2cb38d9b70ec53d49')}
      name={field.name}
      data-test={EDIT_FEE_DRAWER_ADJUSTMENT_TYPE_COMBOBOX_TEST_ID}
      placeholder={translate('text_65a94d976d7a9700716590d9')}
      data={data}
      value={field.state.value}
      error={error}
      onChange={(newValue) => {
        field.handleChange((newValue || undefined) as AdjustedFeeTypeEnum | undefined)
        onAfterChange()
      }}
    />
  )
}

type EditFeeAdjustmentSectionProps = {
  currency: CurrencyEnum
  pricingUnitUsage: PricingUnitUsage
  isUnitAdjustmentTypeDisabled: boolean
  isRegenerateMode: boolean
  showChargeAlert: boolean
}

const defaultProps: EditFeeAdjustmentSectionProps = {
  currency: CurrencyEnum.Usd,
  pricingUnitUsage: null,
  isUnitAdjustmentTypeDisabled: false,
  isRegenerateMode: false,
  showChargeAlert: false,
}

export const EditFeeAdjustmentSection = withForm({
  defaultValues: EDIT_FEE_DEFAULT_VALUES,
  props: defaultProps,
  render: function EditFeeAdjustmentSectionRender({
    form,
    currency,
    pricingUnitUsage,
    isUnitAdjustmentTypeDisabled,
    isRegenerateMode,
    showChargeAlert,
  }) {
    const { translate } = useInternationalization()

    const adjustmentType = useStore(form.store, (state) => state.values.adjustmentType)
    const units = useStore(form.store, (state) => state.values.units)
    const unitPreciseAmount = useStore(form.store, (state) => state.values.unitPreciseAmount)

    const clearAmountsOnTypeChange = (): void => {
      // Regenerate seeds these from the fee being re-added, so clearing them on a type change
      // would throw away the amounts the user came in with.
      if (isRegenerateMode) return

      form.setFieldValue('unitPreciseAmount', '')
      form.setFieldValue('units', '')
    }

    const renderAmountFields = (): JSX.Element | null => {
      if (adjustmentType !== AdjustedFeeTypeEnum.AdjustedAmount) return null

      const totalAmount = calculateTotalAmount(units, unitPreciseAmount)

      return (
        <>
          <form.AppField name="unitPreciseAmount">
            {(field) => (
              <field.AmountInputField
                label={translate('text_6453819268763979024ad089')}
                currency={currency}
                beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
                placeholder={translate('text_62a0b7107afa2700a65ef700')}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {pricingUnitUsage?.shortName || getCurrencySymbol(currency)}
                    </InputAdornment>
                  ),
                }}
              />
            )}
          </form.AppField>

          <div className="flex flex-col gap-1">
            <Typography className="text-end" variant="captionHl" color="grey700">
              {translate('text_65a6b4e2cb38d9b70ec53d83')}
            </Typography>
            <div className="flex h-12 flex-col items-end justify-center self-end">
              <Typography variant="body" color="grey700">
                {intlFormatNumber(totalAmount, {
                  currencyDisplay: 'symbol',
                  currency,
                  maximumFractionDigits: 15,
                  pricingUnitShortName: pricingUnitUsage?.shortName || undefined,
                })}
              </Typography>

              {!!pricingUnitUsage && (
                <Typography variant="caption" color="grey600">
                  {intlFormatNumber(totalAmount * Number(pricingUnitUsage.conversionRate || 0), {
                    currencyDisplay: 'symbol',
                    currency,
                  })}
                </Typography>
              )}
            </div>
          </div>
        </>
      )
    }

    const renderAdjustmentFields = (): JSX.Element | null => {
      if (!adjustmentType) return null

      return (
        <>
          <div className="flex items-start gap-4 *:flex-1">
            <form.AppField name="units">
              {(field) => (
                <field.TextInputField
                  label={translate('text_65771fa3f4ab9a00720726ce')}
                  beforeChangeFormatter={['positiveNumber', 'decimal']}
                  placeholder={translate('text_62a0b7107afa2700a65ef700')}
                />
              )}
            </form.AppField>

            {renderAmountFields()}
          </div>

          {showChargeAlert && (
            <Alert type="info">
              {translate(
                adjustmentType === AdjustedFeeTypeEnum.AdjustedAmount
                  ? 'text_65a6b4e2cb38d9b70ec53d93'
                  : 'text_6613b48da4efd500cacc44d3',
              )}
            </Alert>
          )}
        </>
      )
    }

    return (
      <>
        <form.AppField name="invoiceDisplayName">
          {(field) => (
            <field.TextInputField
              label={translate('text_65a6b4e2cb38d9b70ec53d39')}
              placeholder={translate('text_65a6b4e2cb38d9b70ec53d41')}
            />
          )}
        </form.AppField>

        <form.AppField name="adjustmentType">
          {() => (
            <AdjustmentTypeComboBox
              onAfterChange={clearAmountsOnTypeChange}
              data={[
                {
                  label: translate('text_65a6b4e2cb38d9b70ec53d83'),
                  value: AdjustedFeeTypeEnum.AdjustedAmount,
                },
                {
                  label: translate('text_6304e74aab6dbc18d615f3a2'),
                  value: AdjustedFeeTypeEnum.AdjustedUnits,
                  disabled: isUnitAdjustmentTypeDisabled,
                },
              ]}
            />
          )}
        </form.AppField>

        {renderAdjustmentFields()}
      </>
    )
  },
})
