import { useStore } from '@tanstack/react-form'
import { useCallback, useEffect, useMemo } from 'react'

import { Skeleton } from '~/components/designSystem/Skeleton'
import { ComboBox } from '~/components/form'
import { DrawerLayout } from '~/components/layouts/Drawer'
import { CurrencyEnum, useGetInvoiceDetailsForCreateFeeDrawerQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import { EditFeeAdjustmentSection } from './EditFeeAdjustmentSection'
import { EditFeeFeePreview } from './EditFeeFeePreview'
import { EditFeeDrawerContentProps } from './types'
import { isChargeModelUnitAdjustmentDisabled } from './utils'
import { EDIT_FEE_DEFAULT_VALUES } from './validationSchema'

import {
  EDIT_FEE_DRAWER_CHARGE_COMBOBOX_TEST_ID,
  EDIT_FEE_DRAWER_CHARGE_FILTER_COMBOBOX_TEST_ID,
  EDIT_FEE_DRAWER_LOADING_TEST_ID,
} from '../invoiceDetailsTestIds'
import {
  getChargesComboboxDataFromInvoiceSubscription,
  getChargesFiltersComboboxDataFromInvoiceSubscription,
} from '../utils'

// Zod issues reach the form error map either singly or as a list, depending on the path.
const readErrorMessage = (fieldError: unknown): string | undefined => {
  const first = Array.isArray(fieldError) ? fieldError[0] : fieldError

  return (first as { message?: string } | undefined)?.message
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

    // Kept stable: the combobox data below memoizes on it, and ComboBox re-runs an effect on
    // every new `data` reference.
    const subscriptionFees = useMemo(
      () => invoiceData?.invoice?.fees?.filter((f) => f.subscription?.id === invoiceSubscriptionId),
      [invoiceData, invoiceSubscriptionId],
    )

    const feesForCombobox = localFees ?? subscriptionFees

    const chargeId = useStore(form.store, (state) => state.values.chargeId)
    const fixedChargeId = useStore(form.store, (state) => state.values.fixedChargeId)
    const chargeFilterId = useStore(form.store, (state) => state.values.chargeFilterId)

    // `adjustmentType` is the field the schema rejects, but it unmounts with the adjustment
    // section, so its message has to come off the form error map rather than its field meta.
    const missingAdjustmentError = useStore(form.store, (state) => {
      const dynamicErrors = (state.errorMap as { onDynamic?: Record<string, unknown> })?.onDynamic

      return readErrorMessage(dynamicErrors?.adjustmentType)
    })

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

    const getSelectedItemType = (): 'charge' | 'fixed-charge' | null => {
      if (fee?.charge || chargeId) return 'charge'
      if (fee?.fixedCharge || fixedChargeId) return 'fixed-charge'

      return null
    }

    const selectedItemType = getSelectedItemType()
    const isUsageCharge = selectedItemType === 'charge'
    const hasChargeFilters = !!chargeFiltersComboboxData?.length

    const displayChargeIdField = !fee
    const displayChargeFilterIdField = !fee && isUsageCharge && hasChargeFilters
    const displayAdjustmentInputs =
      !!fee ||
      (hasChargeFilters && isUsageCharge ? !!chargeFilterId : !!chargeId || !!fixedChargeId)

    const getSelectedChargeConfig = () => {
      if (fee) return fee.charge || fee.fixedCharge || undefined

      if (isUsageCharge) {
        return currentSubscription?.plan.charges?.find((charge) => charge.id === chargeId)
      }

      if (selectedItemType === 'fixed-charge') {
        return currentSubscription?.plan.fixedCharges?.find(
          (fixedCharge) => fixedCharge.id === fixedChargeId,
        )
      }

      return undefined
    }

    const selectedChargeConfig = getSelectedChargeConfig()
    const isUnitAdjustmentTypeDisabled =
      !!selectedChargeConfig && isChargeModelUnitAdjustmentDisabled(selectedChargeConfig)

    const onChargeIdChange = useCallback(
      (selectedChargeId: string) => {
        if (selectedChargeId === (chargeId || fixedChargeId)) return

        const selectedUsageCharge = currentSubscription?.plan.charges?.find(
          (charge) => charge.id === selectedChargeId,
        )

        const selectedFixedCharge = currentSubscription?.plan.fixedCharges?.find(
          (fixedCharge) => fixedCharge.id === selectedChargeId,
        )

        if (!selectedUsageCharge && !selectedFixedCharge) return

        // The filter and the adjustment were entered for the previous charge. Left behind they
        // submit against the new one — a filtered charge would go out with no filter picked.
        form.setFieldValue('chargeId', selectedUsageCharge ? selectedChargeId : '')
        form.setFieldValue('fixedChargeId', selectedFixedCharge ? selectedChargeId : '')
        form.setFieldValue('chargeFilterId', '')
        form.setFieldValue('adjustmentType', undefined)
        form.setFieldValue('units', '')
        form.setFieldValue('unitPreciseAmount', '')
      },
      [chargeId, currentSubscription, fixedChargeId, form],
    )

    const feeName = fee?.metadata?.displayName || fee?.itemName || ''

    // The adjustment type is what the schema rejects, but while its section is hidden the only
    // selector on screen is the one still to be filled, so the message belongs there.
    const getSelectorError = (selector: 'charge' | 'filter'): string | undefined => {
      if (displayAdjustmentInputs || !missingAdjustmentError) return undefined

      const awaitedSelector = displayChargeFilterIdField ? 'filter' : 'charge'

      return selector === awaitedSelector ? translate(missingAdjustmentError) : undefined
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
          <DrawerLayout.Header
            title={
              !!fee
                ? translate('text_65a6b4e2cb38d9b70ec53c25', { name: feeName })
                : translate('text_1737709105343hpvidjp0yz0')
            }
            description={
              !!fee
                ? translate('text_65a6b4e2cb38d9b70ec53c2d')
                : translate('text_1737731953885hprgxewyizj')
            }
          />

          {!!fee && (
            <EditFeeFeePreview fee={fee} feeName={feeName} isRegenerateMode={isRegenerateMode} />
          )}

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
                  error={getSelectorError('charge')}
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
                      errorOverride={getSelectorError('filter')}
                    />
                  )}
                </form.AppField>
              )}

              {displayAdjustmentInputs && (
                <EditFeeAdjustmentSection
                  form={form}
                  currency={currency}
                  pricingUnitUsage={pricingUnitUsage ?? null}
                  isUnitAdjustmentTypeDisabled={isUnitAdjustmentTypeDisabled}
                  isRegenerateMode={isRegenerateMode}
                  showChargeAlert={!!fee?.charge}
                />
              )}
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
