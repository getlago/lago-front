import InputAdornment from '@mui/material/InputAdornment'
import { useStore } from '@tanstack/react-form'
import { tw } from 'lago-design-system'
import { useCallback, useEffect, useMemo } from 'react'

import { Alert } from '~/components/designSystem/Alert'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { ComboBox } from '~/components/form'
import { DrawerLayout } from '~/components/layouts/Drawer'
import { ALL_CHARGE_MODELS } from '~/core/constants/form'
import { TExtendedRemainingFee } from '~/core/formats/formatInvoiceItemsMap'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  AdjustedFeeTypeEnum,
  ChargeModelEnum,
  CurrencyEnum,
  FeeForCreateFeeDrawerFragment,
  FixedChargeChargeModelEnum,
  SubscriptionForCreateFeeDrawerFragment,
  useGetInvoiceDetailsForCreateFeeDrawerQuery,
} from '~/generated/graphql'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import { EDIT_FEE_DEFAULT_VALUES } from './validationSchema'

import { InvoiceTableSection } from '../InvoiceDetailsTable'
import { InvoiceDetailsTableBodyLine } from '../InvoiceDetailsTableBodyLine'
import {
  EDIT_FEE_DRAWER_ADJUSTMENT_TYPE_COMBOBOX_TEST_ID,
  EDIT_FEE_DRAWER_CHARGE_COMBOBOX_TEST_ID,
  EDIT_FEE_DRAWER_CHARGE_FILTER_COMBOBOX_TEST_ID,
  EDIT_FEE_DRAWER_LOADING_TEST_ID,
} from '../invoiceDetailsTestIds'
import {
  getChargesComboboxDataFromInvoiceSubscription,
  getChargesFiltersComboboxDataFromInvoiceSubscription,
} from '../utils'
import { ViewFeeDetailsDrawerProvider } from '../ViewFeeDetailsDrawer'

const isChargeModelUnitAdjustmentDisabled = (
  chargeModel?: ChargeModelEnum | FixedChargeChargeModelEnum,
  prorated?: boolean,
): boolean => {
  if (!chargeModel) return false

  return !!(
    chargeModel === ALL_CHARGE_MODELS.Percentage ||
    chargeModel === ALL_CHARGE_MODELS.Dynamic ||
    (chargeModel === ALL_CHARGE_MODELS.Graduated && prorated)
  )
}

// `form.AppField` types `meta.errors` as never[] when no field-level validator is declared,
// though the form schema still fills it at runtime.
const fieldErrorMessage = (errors: unknown[], translate: TranslateFunc): string =>
  (errors as Array<{ message?: string } | undefined>)
    .map((error) => error?.message)
    .filter((message): message is string => !!message)
    .map((message) => translate(message))
    .join('\n')

const calculateTotalAmount = (
  units?: number | string | null,
  unitAmount?: number | string | null,
): number => {
  return Number(units || 0) * Number(unitAmount || 0)
}

export type EditFeeDrawerContentProps = {
  invoiceId: string
  invoiceSubscriptionId: string | undefined
  isRegenerateMode: boolean
  fee: TExtendedRemainingFee | undefined
  localFees: FeeForCreateFeeDrawerFragment[] | undefined
  onSubscriptionLoaded: (subscription: SubscriptionForCreateFeeDrawerFragment | undefined) => void
}

const contentDefaultProps: EditFeeDrawerContentProps = {
  invoiceId: '',
  invoiceSubscriptionId: undefined,
  isRegenerateMode: false,
  fee: undefined,
  localFees: undefined,
  onSubscriptionLoaded: () => {},
}

export const EditFeeDrawerContent = withForm({
  defaultValues: EDIT_FEE_DEFAULT_VALUES,
  props: contentDefaultProps,
  render: function EditFeeDrawerContentRender({
    form,
    invoiceId,
    invoiceSubscriptionId,
    isRegenerateMode,
    fee,
    localFees,
    onSubscriptionLoaded,
  }) {
    const { translate } = useInternationalization()

    const currency = fee?.currency || CurrencyEnum.Usd
    const pricingUnitUsage = fee?.pricingUnitUsage

    const { loading: invoiceLoading, data: invoiceData } =
      useGetInvoiceDetailsForCreateFeeDrawerQuery({
        variables: { invoiceId },
        skip: !invoiceId,
        // Prevent this query from polluting the Apollo cache with partial fee data
        // which would overwrite the full fee data from getInvoiceFees
        fetchPolicy: 'no-cache',
      })

    const currentSubscription = invoiceData?.invoice?.subscriptions?.find(
      (subscription) => subscription.id === invoiceSubscriptionId,
    )

    useEffect(() => {
      onSubscriptionLoaded(currentSubscription)
    }, [currentSubscription, onSubscriptionLoaded])

    // Filter invoice-level fees by subscription ID (matches InvoiceForFormatInvoiceItemMap pattern)
    const subscriptionFees = invoiceData?.invoice?.fees?.filter(
      (f) => f.subscription?.id === invoiceSubscriptionId,
    )

    // Use localFees (from regenerate mode) or subscriptionFees (from invoice query)
    const feesForCombobox = localFees ?? subscriptionFees

    const chargeId = useStore(form.store, (state) => state.values.chargeId)
    const fixedChargeId = useStore(form.store, (state) => state.values.fixedChargeId)
    const chargeFilterId = useStore(form.store, (state) => state.values.chargeFilterId)
    const adjustmentType = useStore(form.store, (state) => state.values.adjustmentType)
    const units = useStore(form.store, (state) => state.values.units)
    const unitPreciseAmount = useStore(form.store, (state) => state.values.unitPreciseAmount)

    const chargesComboboxData = useMemo(() => {
      return getChargesComboboxDataFromInvoiceSubscription({
        chargesGroupLabel: translate('text_6435888d7cc86500646d8977'),
        fixedChargesGroupLabel: translate('text_176072970726728iw4tc8ucl'),
        subscription: currentSubscription,
        overrideFees: feesForCombobox,
      })
    }, [currentSubscription, translate, feesForCombobox])

    const chargeFiltersComboboxData = useMemo(() => {
      return getChargesFiltersComboboxDataFromInvoiceSubscription({
        defaultFilterOptionLabel: translate('text_64e620bca31226337ffc62ad'),
        subscription: currentSubscription,
        selectedChargeId: chargeId,
        overrideFees: feesForCombobox,
      })
    }, [currentSubscription, feesForCombobox, chargeId, translate])

    // Determine if the selected item is a charge or fixed charge
    const selectedItemType = useMemo((): 'charge' | 'fixed-charge' | null => {
      if (fee?.charge || chargeId) return 'charge'
      if (fee?.fixedCharge || fixedChargeId) return 'fixed-charge'

      return null
    }, [fee, chargeId, fixedChargeId])

    const { displayChargeIdField, displayChargeFilterIdField, displayAdjustmentInputs } =
      useMemo(() => {
        const hasChargeFiltersComboboxData = !!chargeFiltersComboboxData?.length
        const isUsageCharge = selectedItemType === 'charge'

        return {
          displayChargeIdField: !fee,
          displayChargeFilterIdField: !fee && isUsageCharge && hasChargeFiltersComboboxData,
          displayAdjustmentInputs:
            !!fee ||
            (hasChargeFiltersComboboxData && isUsageCharge
              ? !!chargeFilterId
              : !!chargeId || !!fixedChargeId),
        }
      }, [
        chargeFiltersComboboxData?.length,
        fee,
        chargeFilterId,
        chargeId,
        fixedChargeId,
        selectedItemType,
      ])

    const isUnitAdjustmentTypeDisabled = useMemo((): boolean => {
      const getChargeConfig = ():
        | { chargeModel?: ChargeModelEnum | FixedChargeChargeModelEnum; prorated?: boolean }
        | undefined => {
        // If we have an existing fee, extract from fee's charge or fixedCharge
        if (fee) {
          const source = fee.charge || fee.fixedCharge

          return source ? { chargeModel: source.chargeModel, prorated: source.prorated } : undefined
        }

        // If we're adding a new fee, find the selected charge or fixed charge
        if (selectedItemType === 'charge') {
          return currentSubscription?.plan.charges?.find((charge) => charge.id === chargeId)
        }

        if (selectedItemType === 'fixed-charge') {
          return currentSubscription?.plan.fixedCharges?.find(
            (fixedCharge) => fixedCharge.id === fixedChargeId,
          ) as { chargeModel?: FixedChargeChargeModelEnum; prorated?: boolean } | undefined
        }

        return undefined
      }

      const config = getChargeConfig()

      return !!config && isChargeModelUnitAdjustmentDisabled(config.chargeModel, config.prorated)
    }, [currentSubscription, fee, chargeId, fixedChargeId, selectedItemType])

    const onChargeIdChange = useCallback(
      (selectedChargeId: string) => {
        if (selectedChargeId === (chargeId || fixedChargeId)) return

        const isUsageCharge = currentSubscription?.plan.charges?.find(
          (charge) => charge.id === selectedChargeId,
        )

        const isFixedCharge = currentSubscription?.plan.fixedCharges?.find(
          (fixedCharge) => fixedCharge.id === selectedChargeId,
        )

        if (!isUsageCharge && !isFixedCharge) return

        // The filter and the adjustment were entered for the previous charge. Left behind they
        // submit against the new one — a filtered charge would go out with no filter picked.
        form.setFieldValue('chargeId', isUsageCharge ? selectedChargeId : '')
        form.setFieldValue('fixedChargeId', isFixedCharge ? selectedChargeId : '')
        form.setFieldValue('chargeFilterId', '')
        form.setFieldValue('adjustmentType', undefined)
        form.setFieldValue('units', '')
        form.setFieldValue('unitPreciseAmount', '')
      },
      [chargeId, currentSubscription, fixedChargeId, form],
    )

    const feeName = fee?.metadata?.displayName || fee?.itemName || ''
    const drawerDescription = !!fee
      ? translate('text_65a6b4e2cb38d9b70ec53c2d')
      : translate('text_1737731953885hprgxewyizj')
    const drawerTitle = !!fee
      ? translate('text_65a6b4e2cb38d9b70ec53c25', { name: feeName })
      : translate('text_1737709105343hpvidjp0yz0')

    const renderFeePreview = (): JSX.Element | null => {
      if (!fee) return null

      const preview = (
        <DrawerLayout.Section>
          <DrawerLayout.SectionTitle
            title={translate('text_65a6b4e2cb38d9b70ec53c35')}
            description={translate('text_1737556835239q7202lhbdhk')}
          />
          <InvoiceTableSection
            className={tw(
              '[&_table>thead>tr>th:nth-child(1)]:w-[45%] [&_table>thead>tr>th:nth-child(1)]:text-left [&_table>thead>tr>th:nth-child(2)]:w-[15%] [&_table>thead>tr>th:nth-child(3)]:w-[20%] [&_table>thead>tr>th:nth-child(4)]:w-[20%]',
              '[&_table>tbody>tr>td:nth-child(1)]:w-[45%] [&_table>tbody>tr>td:nth-child(1)]:text-left [&_table>tbody>tr>td:nth-child(2)]:w-[15%] [&_table>tbody>tr>td:nth-child(3)]:w-[20%] [&_table>tbody>tr>td:nth-child(4)]:w-[20%]',
              '[&_table>tbody>tr:last-child>td]:pb-0 [&_table>tbody>tr:last-child>td]:shadow-none [&_table>tbody>tr>td:not(:last-child)]:pr-3 [&_table>thead>tr>th]:pt-0',
            )}
          >
            <table>
              <thead>
                <tr>
                  <th>
                    <Typography variant="captionHl" color="grey600">
                      {translate('text_6388b923e514213fed58331c')}
                    </Typography>
                  </th>
                  <th>
                    <Typography variant="captionHl" color="grey600">
                      {translate('text_65771fa3f4ab9a00720726ce')}
                    </Typography>
                  </th>
                  <th>
                    <Typography variant="captionHl" color="grey600">
                      {translate('text_6453819268763979024ad089')}
                    </Typography>
                  </th>
                  <th>
                    <Typography variant="captionHl" color="grey600">
                      {translate('text_634d631acf4dce7b0127a3a6')}
                    </Typography>
                  </th>
                </tr>
              </thead>

              <tbody>
                <InvoiceDetailsTableBodyLine
                  canHaveUnitPrice
                  hideVat
                  currency={fee?.currency}
                  displayName={feeName}
                  fee={fee}
                  isDraftInvoice={false}
                />
              </tbody>
            </table>
          </InvoiceTableSection>
        </DrawerLayout.Section>
      )

      // NiceModal mounts this body at the app root, outside the page's provider; the regenerate
      // flow has none by design, so its preview row must not open the details drawer.
      if (isRegenerateMode) return preview

      return <ViewFeeDetailsDrawerProvider>{preview}</ViewFeeDetailsDrawerProvider>
    }

    const renderAdjustmentAmountFields = (): JSX.Element | null => {
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
                  currency: currency,
                  maximumFractionDigits: 15,
                  pricingUnitShortName: pricingUnitUsage?.shortName,
                })}
              </Typography>

              {!!pricingUnitUsage && (
                <Typography variant="caption" color="grey600">
                  {intlFormatNumber(totalAmount * Number(pricingUnitUsage?.conversionRate || 0), {
                    currencyDisplay: 'symbol',
                    currency: currency,
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

            {renderAdjustmentAmountFields()}
          </div>

          {!!fee?.charge && (
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

    const renderAdjustmentSection = (): JSX.Element | null => {
      if (!displayAdjustmentInputs) return null

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
            {(field) => (
              <ComboBox
                label={translate('text_65a6b4e2cb38d9b70ec53d49')}
                name={field.name}
                data-test={EDIT_FEE_DRAWER_ADJUSTMENT_TYPE_COMBOBOX_TEST_ID}
                placeholder={translate('text_65a94d976d7a9700716590d9')}
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
                value={field.state.value}
                error={fieldErrorMessage(field.state.meta.errors, translate)}
                onChange={(newValue) => {
                  field.handleChange((newValue || undefined) as AdjustedFeeTypeEnum | undefined)

                  // Regenerate seeds these from the fee being re-added, so clearing them on a
                  // type change would throw away the amounts the user came in with.
                  if (!isRegenerateMode) {
                    form.setFieldValue('unitPreciseAmount', '')
                    form.setFieldValue('units', '')
                  }
                }}
              />
            )}
          </form.AppField>

          {renderAdjustmentFields()}
        </>
      )
    }

    const renderLoadingSkeleton = (): JSX.Element => (
      <div className="flex flex-col gap-12" data-test={EDIT_FEE_DRAWER_LOADING_TEST_ID}>
        {[...Array(2)].map((__, index) => (
          <div key={`edit-fee-drawer-loading-block-${index}`} className="flex flex-col gap-1">
            <Skeleton variant="text" className="w-40" />
            <Skeleton variant="text" className="w-80" />
          </div>
        ))}
      </div>
    )

    const renderBody = (): JSX.Element => {
      if (!fee && invoiceLoading) return renderLoadingSkeleton()

      return (
        <>
          <DrawerLayout.Header title={drawerTitle} description={drawerDescription} />

          {renderFeePreview()}

          <DrawerLayout.Section>
            <DrawerLayout.SectionTitle
              title={translate('text_65a6b4e2cb38d9b70ec53d31')}
              description={translate('text_17375568352390mlfarq4p6t')}
            />

            <div className="flex flex-col gap-6">
              {displayChargeIdField && (
                <ComboBox
                  label={translate('text_1737731953885tbem8s4xo8t')}
                  placeholder={translate('text_1737733582553rmmlatfbk1r')}
                  data={chargesComboboxData}
                  data-test={EDIT_FEE_DRAWER_CHARGE_COMBOBOX_TEST_ID}
                  onChange={onChargeIdChange}
                  loading={invoiceLoading}
                  value={chargeId || fixedChargeId || ''}
                />
              )}

              {displayChargeFilterIdField && (
                <form.AppField
                  name="chargeFilterId"
                  listeners={{
                    onChange: ({ value }) => {
                      // Clearing the filter unselects the fee being adjusted: the adjustment
                      // inputs are hidden again, so their values must not survive and submit.
                      if (value) return

                      form.setFieldValue('adjustmentType', undefined)
                      form.setFieldValue('unitPreciseAmount', '')
                      form.setFieldValue('units', '')
                    },
                  }}
                >
                  {(field) => (
                    <field.ComboBoxField
                      dataTest={EDIT_FEE_DRAWER_CHARGE_FILTER_COMBOBOX_TEST_ID}
                      label={translate('text_66ab42d4ece7e6b7078993ad')}
                      placeholder={translate('text_1737733582553dm4huzkoee6')}
                      data={chargeFiltersComboboxData}
                    />
                  )}
                </form.AppField>
              )}

              {renderAdjustmentSection()}
            </div>
          </DrawerLayout.Section>
        </>
      )
    }

    return (
      <DrawerLayout.Wrapper>
        <DrawerLayout.Content>{renderBody()}</DrawerLayout.Content>
      </DrawerLayout.Wrapper>
    )
  },
})
