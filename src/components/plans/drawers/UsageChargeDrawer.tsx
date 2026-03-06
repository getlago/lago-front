import { gql } from '@apollo/client'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { tw } from 'lago-design-system'
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { z } from 'zod'

import { Accordion } from '~/components/designSystem/Accordion'
import { Button } from '~/components/designSystem/Button'
import { Drawer, DRAWER_TRANSITION_DURATION, DrawerRef } from '~/components/designSystem/Drawer'
import { Selector } from '~/components/designSystem/Selector'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { ComboboxItem } from '~/components/form'
import { ComboboxDataGrouped } from '~/components/form/ComboBox/types'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import {
  buildChargeFilterAddFilterButtonId,
  ChargeFilter,
} from '~/components/plans/chargeAccordion/ChargeFilter'
import { ChargeModelSelector } from '~/components/plans/chargeAccordion/ChargeModelSelector'
import { ChargeWrapperSwitch } from '~/components/plans/chargeAccordion/ChargeWrapperSwitch'
import { CustomPricingUnitSelector } from '~/components/plans/chargeAccordion/CustomPricingUnitSelector'
import { ChargeInvoicingStrategyOption } from '~/components/plans/chargeAccordion/options/ChargeInvoicingStrategyOption'
import { ChargePayInAdvanceOption } from '~/components/plans/chargeAccordion/options/ChargePayInAdvanceOption'
import { SpendingMinimumOptionSection } from '~/components/plans/chargeAccordion/SpendingMinimumOptionSection'
import { PlanBillingPeriodInfoSection } from '~/components/plans/drawers/PlanBillingPeriodInfoSection'
import { RemoveChargeWarningDialogRef } from '~/components/plans/RemoveChargeWarningDialog'
import {
  LocalChargeFilterInput,
  LocalPricingUnitInput,
  LocalPricingUnitType,
  LocalUsageChargeInput,
} from '~/components/plans/types'
import { mapChargeIntervalCopy } from '~/components/plans/utils'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { TaxesSelectorSection } from '~/components/taxes/TaxesSelectorSection'
import { usePlanFormContext } from '~/contexts/PlanFormContext'
import { useDuplicatePlanVar } from '~/core/apolloClient'
import {
  ALL_FILTER_VALUES,
  FORM_TYPE_ENUM,
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_BILLABLE_METRIC_IN_USAGE_CHARGE_DRAWER_INPUT_CLASSNAME,
  SEARCH_TAX_INPUT_FOR_CHARGE_CLASSNAME,
} from '~/core/constants/form'
import getPropertyShape from '~/core/serializers/getPropertyShape'
import { validateChargeProperties } from '~/formValidation/chargePropertiesSchema'
import {
  AggregationTypeEnum,
  BillableMetricForPlanFragment,
  ChargeModelEnum,
  CustomChargeFragmentDoc,
  GraduatedChargeFragmentDoc,
  GraduatedPercentageChargeFragmentDoc,
  PackageChargeFragmentDoc,
  PercentageChargeFragmentDoc,
  PricingGroupKeysFragmentDoc,
  PropertiesInput,
  RegroupPaidFeesEnum,
  StandardChargeFragmentDoc,
  TaxForTaxesSelectorSectionFragment,
  TaxForTaxesSelectorSectionFragmentDoc,
  useGetMeteredBillableMetricsLazyQuery,
  useGetRecurringBillableMetricsLazyQuery,
  VolumeRangesFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useChargeForm } from '~/hooks/plans/useChargeForm'
import { useCustomPricingUnits } from '~/hooks/plans/useCustomPricingUnits'
import { useCurrentUser } from '~/hooks/useCurrentUser'

const COMBOBOX_FOCUS_DELAY = DRAWER_TRANSITION_DURATION + 150

gql`
  fragment BillableMetricForUsageChargeSection on BillableMetric {
    id
    name
    code
    aggregationType
    recurring
    filters {
      id
      key
      values
    }
  }

  query getMeteredBillableMetrics($page: Int, $limit: Int, $searchTerm: String) {
    billableMetrics(page: $page, limit: $limit, searchTerm: $searchTerm, recurring: false) {
      collection {
        id
        ...BillableMetricForUsageChargeSection
      }
    }
  }

  query getRecurringBillableMetrics($page: Int, $limit: Int, $searchTerm: String) {
    billableMetrics(page: $page, limit: $limit, searchTerm: $searchTerm, recurring: true) {
      collection {
        id
        ...BillableMetricForUsageChargeSection
      }
    }
  }

  fragment UsageChargeForDrawer on Charge {
    id
    chargeModel
    invoiceable
    minAmountCents
    payInAdvance
    prorated
    invoiceDisplayName
    regroupPaidFees
    properties {
      graduatedRanges {
        ...GraduatedCharge
      }
      graduatedPercentageRanges {
        ...GraduatedPercentageCharge
      }
      volumeRanges {
        ...VolumeRanges
      }
      ...PackageCharge
      ...StandardCharge
      ...PercentageCharge
      ...CustomCharge
      ...PricingGroupKeys
    }
    filters {
      invoiceDisplayName
      values
      properties {
        graduatedRanges {
          ...GraduatedCharge
        }
        graduatedPercentageRanges {
          ...GraduatedPercentageCharge
        }
        volumeRanges {
          ...VolumeRanges
        }
        ...PackageCharge
        ...StandardCharge
        ...PercentageCharge
        ...CustomCharge
        ...PricingGroupKeys
      }
    }
    billableMetric {
      id
      name
      aggregationType
      recurring
      filters {
        key
        values
      }
    }
    taxes {
      ...TaxForTaxesSelectorSection
    }
  }

  ${GraduatedChargeFragmentDoc}
  ${GraduatedPercentageChargeFragmentDoc}
  ${VolumeRangesFragmentDoc}
  ${PackageChargeFragmentDoc}
  ${StandardChargeFragmentDoc}
  ${PercentageChargeFragmentDoc}
  ${CustomChargeFragmentDoc}
  ${PricingGroupKeysFragmentDoc}
  ${TaxForTaxesSelectorSectionFragmentDoc}
`

export interface UsageChargeDrawerFormValues {
  billableMetricId: string
  billableMetric: BillableMetricForPlanFragment
  appliedPricingUnit?: LocalPricingUnitInput
  chargeModel: ChargeModelEnum
  id?: string
  invoiceDisplayName: string
  invoiceable: boolean
  minAmountCents: string
  payInAdvance: boolean
  prorated: boolean
  properties?: PropertiesInput
  filters?: LocalChargeFilterInput[]
  regroupPaidFees: string | null
  taxes: TaxForTaxesSelectorSectionFragment[]
}

const usageChargeDrawerSchema = z
  .object({
    billableMetricId: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
    billableMetric: z.custom<BillableMetricForPlanFragment>(),
    appliedPricingUnit: z.custom<LocalPricingUnitInput>().optional(),
    chargeModel: z.enum(ChargeModelEnum),
    id: z.string().optional(),
    invoiceDisplayName: z.string(),
    invoiceable: z.boolean(),
    minAmountCents: z.string(),
    payInAdvance: z.boolean(),
    prorated: z.boolean(),
    properties: z.record(z.string(), z.unknown()).optional(),
    filters: z.custom<LocalChargeFilterInput[]>().optional(),
    regroupPaidFees: z.string().nullable(),
    taxes: z.array(
      z.object({ id: z.string(), code: z.string(), name: z.string(), rate: z.number() }),
    ),
  })
  .superRefine((data, ctx) => {
    // Validate default properties (only when no filters, or always present with filters)
    if (!data.filters?.length && data.properties) {
      validateChargeProperties(data.chargeModel, data.properties, ctx, ['properties'])
    }

    // Validate filter properties and filter values
    if (data.filters?.length) {
      for (let fi = 0; fi < data.filters.length; fi++) {
        validateChargeProperties(
          data.chargeModel,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.filters[fi].properties as any,
          ctx,
          ['filters', String(fi), 'properties'],
        )

        if (!data.filters[fi].values?.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '',
            path: ['filters', String(fi), 'values'],
          })
        }
      }
    }

    // Validate appliedPricingUnit conversion rate when custom
    if (
      data.appliedPricingUnit?.type === LocalPricingUnitType.Custom &&
      (!data.appliedPricingUnit.conversionRate ||
        Number(data.appliedPricingUnit.conversionRate || 0) <= 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '',
        path: ['appliedPricingUnit', 'conversionRate'],
      })
    }
  })

const DEFAULT_VALUES: UsageChargeDrawerFormValues = {
  billableMetricId: '',
  billableMetric: {
    id: '',
    name: '',
    code: '',
    aggregationType: AggregationTypeEnum.CountAgg,
    recurring: false,
  },
  appliedPricingUnit: undefined,
  chargeModel: ChargeModelEnum.Standard,
  id: undefined,
  invoiceDisplayName: '',
  invoiceable: true,
  minAmountCents: '',
  payInAdvance: false,
  prorated: false,
  properties: getPropertyShape({}),
  filters: [],
  regroupPaidFees: null,
  taxes: [],
}

const USAGE_CHARGE_DRAWER_FORM_ID = 'usage-charge-drawer-form'
const CHARGE_DEFAULT_PROPERTY_ID = 'drawer-charge-default-property-accordion'

export interface UsageChargeDrawerRef {
  openDrawer: (
    charge?: LocalUsageChargeInput,
    index?: number,
    options?: {
      alreadyUsedChargeAlertMessage?: string
      initialCharge?: LocalUsageChargeInput
      isUsedInSubscription?: boolean
    },
  ) => void
  closeDrawer: () => void
}

interface UsageChargeDrawerProps {
  disabled?: boolean
  isEdition?: boolean
  isInSubscriptionForm?: boolean
  premiumWarningDialogRef?: React.RefObject<PremiumWarningDialogRef>
  subscriptionFormType?: keyof typeof FORM_TYPE_ENUM
  onSave: (charge: LocalUsageChargeInput, index: number | null) => void
  onDelete?: (index: number) => void
  removeChargeWarningDialogRef?: React.RefObject<RemoveChargeWarningDialogRef>
  amountCurrency?: string
}

export const UsageChargeDrawer = forwardRef<UsageChargeDrawerRef, UsageChargeDrawerProps>(
  (
    {
      disabled,
      isEdition,
      isInSubscriptionForm,
      premiumWarningDialogRef,
      subscriptionFormType,
      onSave,
      onDelete,
      removeChargeWarningDialogRef,
      amountCurrency,
    },
    ref,
  ) => {
    const { translate } = useInternationalization()
    const { isPremium } = useCurrentUser()
    const { currency, interval } = usePlanFormContext()
    const { hasAnyPricingUnitConfigured } = useCustomPricingUnits()
    const { type: actionType } = useDuplicatePlanVar()
    const drawerRef = useRef<DrawerRef>(null)
    const editIndexRef = useRef<number>(-1)
    const alertMessageRef = useRef<string | undefined>(undefined)
    const initialChargeRef = useRef<LocalUsageChargeInput | undefined>(undefined)
    const [isCreateMode, setIsCreateMode] = useState(false)
    const isUsedInSubscriptionRef = useRef(false)

    const [getMeteredBillableMetrics, { data: meteredBmData }] =
      useGetMeteredBillableMetricsLazyQuery({
        fetchPolicy: 'network-only',
        nextFetchPolicy: 'network-only',
        variables: { limit: 1000 },
      })

    const [getRecurringBillableMetrics, { data: recurringBmData }] =
      useGetRecurringBillableMetricsLazyQuery({
        fetchPolicy: 'network-only',
        nextFetchPolicy: 'network-only',
        variables: { limit: 1000 },
      })

    const combinedSearchQuery = useCallback(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (options?: any) => {
        const vars = { variables: { searchTerm: options?.variables?.searchTerm, limit: 1000 } }

        const [results] = await Promise.all([
          getMeteredBillableMetrics(vars),
          getRecurringBillableMetrics(vars),
        ])

        return results
      },
      [getMeteredBillableMetrics, getRecurringBillableMetrics],
    )

    const billableMetricsComboboxData = useMemo(() => {
      const result: ComboboxDataGrouped[] = []

      const meteredCollection = meteredBmData?.billableMetrics?.collection || []
      const recurringCollection = recurringBmData?.billableMetrics?.collection || []

      for (const { id, name, code } of meteredCollection) {
        result.push({
          label: `${name} (${code})`,
          labelNode: (
            <ComboboxItem>
              <Typography variant="body" color="grey700" noWrap>
                {name}
              </Typography>
              <Typography variant="caption" color="grey600" noWrap>
                {code}
              </Typography>
            </ComboboxItem>
          ),
          value: id,
          group: 'metered',
        })
      }

      for (const { id, name, code } of recurringCollection) {
        result.push({
          label: `${name} (${code})`,
          labelNode: (
            <ComboboxItem>
              <Typography variant="body" color="grey700" noWrap>
                {name}
              </Typography>
              <Typography variant="caption" color="grey600" noWrap>
                {code}
              </Typography>
            </ComboboxItem>
          ),
          value: id,
          group: 'recurring',
        })
      }

      return result
    }, [meteredBmData?.billableMetrics?.collection, recurringBmData?.billableMetrics?.collection])

    const renderGroupHeader: Record<string, React.ReactNode> = useMemo(
      () => ({
        metered: (
          <Typography variant="captionHl" color="textSecondary">
            {translate('text_177273892183648ke5pdrlvc')}
          </Typography>
        ),
        recurring: (
          <Typography variant="captionHl" color="textSecondary">
            {translate('text_1772738921836t0afm4rguui')}
          </Typography>
        ),
      }),
      [translate],
    )

    const {
      getUsageChargeModelComboboxData,
      getIsPayInAdvanceOptionDisabledForUsageCharge,
      getIsProRatedOptionDisabledForUsageCharge,
    } = useChargeForm()

    const form = useAppForm({
      defaultValues: DEFAULT_VALUES,
      validationLogic: revalidateLogic(),
      validators: {
        onDynamic: usageChargeDrawerSchema,
      },
      onSubmit: async ({ value }) => {
        const localCharge: LocalUsageChargeInput = {
          billableMetric: value.billableMetric,
          appliedPricingUnit: value.appliedPricingUnit,
          chargeModel: value.chargeModel,
          id: value.id,
          invoiceDisplayName: value.invoiceDisplayName || undefined,
          invoiceable: value.invoiceable,
          minAmountCents: value.minAmountCents || undefined,
          payInAdvance: value.payInAdvance,
          prorated: value.prorated,
          properties: value.properties,
          filters: value.filters,
          regroupPaidFees: (value.regroupPaidFees as RegroupPaidFeesEnum) || undefined,
          taxes: value.taxes,
        }

        onSave(localCharge, isCreateMode ? null : editIndexRef.current)
        drawerRef.current?.closeDrawer()
      },
    })

    useImperativeHandle(ref, () => ({
      openDrawer: (charge?, index?, options?) => {
        if (charge && index !== undefined) {
          // Edit mode
          setIsCreateMode(false)
          editIndexRef.current = index
          alertMessageRef.current = options?.alreadyUsedChargeAlertMessage
          initialChargeRef.current = options?.initialCharge || charge
          isUsedInSubscriptionRef.current = options?.isUsedInSubscription || false
          form.reset(
            {
              billableMetricId: charge.billableMetric.id,
              billableMetric: charge.billableMetric,
              appliedPricingUnit: charge.appliedPricingUnit,
              chargeModel: charge.chargeModel,
              id: charge.id,
              invoiceDisplayName: charge.invoiceDisplayName || '',
              invoiceable: charge.invoiceable ?? true,
              minAmountCents: charge.minAmountCents || '',
              payInAdvance: charge.payInAdvance || false,
              prorated: charge.prorated || false,
              properties: charge.properties || getPropertyShape({}),
              filters: charge.filters || [],
              regroupPaidFees: charge.regroupPaidFees || null,
              taxes: charge.taxes || [],
            },
            { keepDefaultValues: true },
          )
        } else {
          // Create mode
          setIsCreateMode(true)
          editIndexRef.current = -1
          alertMessageRef.current = undefined
          initialChargeRef.current = undefined
          isUsedInSubscriptionRef.current = false
          form.reset(DEFAULT_VALUES, { keepDefaultValues: true })
        }

        drawerRef.current?.openDrawer()

        // Auto-focus ComboBox in create mode
        if (!charge) {
          setTimeout(() => {
            ;(
              document.querySelector(
                `.${SEARCH_BILLABLE_METRIC_IN_USAGE_CHARGE_DRAWER_INPUT_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
              ) as HTMLElement
            )?.click()
          }, COMBOBOX_FOCUS_DELAY)
        }
      },
      closeDrawer: () => {
        drawerRef.current?.closeDrawer()
      },
    }))

    const isDirty = useStore(form.store, (state) => state.isDirty)
    const formValues = useStore(form.store, (state) => state.values)

    const isCreatePickerScreen = isCreateMode && !formValues.billableMetricId

    const chargeModelComboboxData = useMemo(
      () =>
        getUsageChargeModelComboboxData({
          isPremium,
          aggregationType: formValues.billableMetric.aggregationType,
        }),
      [getUsageChargeModelComboboxData, isPremium, formValues.billableMetric.aggregationType],
    )

    const isPayInAdvanceOptionDisabled = useMemo(
      () =>
        getIsPayInAdvanceOptionDisabledForUsageCharge({
          aggregationType: formValues.billableMetric.aggregationType,
          chargeModel: formValues.chargeModel,
          isPayInAdvance: formValues.payInAdvance,
          isProrated: formValues.prorated,
          isRecurring: formValues.billableMetric.recurring,
        }),
      [
        getIsPayInAdvanceOptionDisabledForUsageCharge,
        formValues.billableMetric.aggregationType,
        formValues.billableMetric.recurring,
        formValues.chargeModel,
        formValues.payInAdvance,
        formValues.prorated,
      ],
    )

    const isProratedOptionDisabled = useMemo(
      () =>
        getIsProRatedOptionDisabledForUsageCharge({
          aggregationType: formValues.billableMetric.aggregationType,
          chargeModel: formValues.chargeModel,
          isPayInAdvance: formValues.payInAdvance,
        }),
      [
        getIsProRatedOptionDisabledForUsageCharge,
        formValues.billableMetric.aggregationType,
        formValues.chargeModel,
        formValues.payInAdvance,
      ],
    )

    const chargePricingUnitShortName = useMemo(
      () =>
        (formValues.appliedPricingUnit?.type === LocalPricingUnitType.Custom &&
          formValues.appliedPricingUnit?.shortName) ||
        undefined,
      [formValues.appliedPricingUnit],
    )

    const chargePayInAdvanceDescription = useMemo(() => {
      if (formValues.chargeModel === ChargeModelEnum.Volume) {
        return translate('text_6669b493fae79a0095e639bc')
      } else if (formValues.billableMetric.aggregationType === AggregationTypeEnum.MaxAgg) {
        return translate('text_6669b493fae79a0095e63986')
      } else if (formValues.billableMetric.aggregationType === AggregationTypeEnum.LatestAgg) {
        return translate('text_6669b493fae79a0095e639a1')
      }

      return translate('text_6661fc17337de3591e29e435')
    }, [formValues.chargeModel, formValues.billableMetric.aggregationType, translate])

    // TODO: Not sure about that logic
    const handleChargeModelUpdate = useCallback(
      (name: string, value: unknown) => {
        if (name === 'chargeModel') {
          if (value === form.getFieldValue('chargeModel')) return

          // Check premium gating for graduated percentage
          if (!isPremium && value === ChargeModelEnum.GraduatedPercentage) {
            premiumWarningDialogRef?.current?.openDialog()
            return
          }

          // Reset charge data when switching model — use form.reset to clear all field meta/errors
          form.reset(
            {
              ...form.state.values,
              chargeModel: value as ChargeModelEnum,
              payInAdvance: false,
              prorated: false,
              invoiceable: true,
              properties: getPropertyShape({}),
              filters: [],
              taxes: [],
            },
            { keepDefaultValues: true },
          )
          return
        }

        form.setFieldValue(
          name as keyof UsageChargeDrawerFormValues,
          value as UsageChargeDrawerFormValues[keyof UsageChargeDrawerFormValues],
        )
      },
      [form, isPremium, premiumWarningDialogRef],
    )

    const handleFormSubmit = (event: React.FormEvent) => {
      event.preventDefault()
      form.handleSubmit()
    }

    const showDelete = !isCreateMode && !isInSubscriptionForm && !!onDelete

    const handleDelete = () => {
      const deleteCharge = () => {
        onDelete?.(editIndexRef.current)
      }

      drawerRef.current?.closeDrawer()

      if (actionType !== 'duplicate' && isUsedInSubscriptionRef.current) {
        removeChargeWarningDialogRef?.current?.openDialog({ callback: deleteCharge })
      } else {
        deleteCharge()
      }
    }

    return (
      <Drawer
        ref={drawerRef}
        title={translate('text_177213328514118gjrdaqs8s')}
        showCloseWarningDialog={isDirty}
        onClose={() => {
          form.reset()
        }}
        stickyBottomBar={({ closeDrawer }) => (
          <div
            className={tw(
              'flex items-center gap-3',
              showDelete ? 'w-full justify-between' : 'justify-end',
            )}
          >
            {showDelete && (
              <Button danger variant="quaternary" onClick={handleDelete}>
                {translate('text_63ea0f84f400488553caa786')}
              </Button>
            )}
            <div className="flex items-center gap-3">
              <Button variant="quaternary" onClick={closeDrawer}>
                {translate('text_6411e6b530cb47007488b027')}
              </Button>
              <form.Subscribe selector={({ canSubmit }) => canSubmit}>
                {(canSubmit) => (
                  <Button
                    data-test="usage-charge-drawer-save"
                    onClick={handleFormSubmit}
                    disabled={!canSubmit}
                  >
                    {translate('text_17295436903260tlyb1gp1i7')}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </div>
        )}
        stickyBottomBarClassName="md:py-0 flex items-center gap-3"
      >
        <form id={USAGE_CHARGE_DRAWER_FORM_ID} onSubmit={handleFormSubmit}>
          <button type="submit" hidden aria-hidden="true" />
          <CenteredPage.SectionWrapper>
            <CenteredPage.PageTitle
              title={translate('text_177213328514118gjrdaqs8s')}
              description={translate('text_1772133285142lsyz4j6nrai')}
            />

            {isCreatePickerScreen ? (
              <CenteredPage.PageSection>
                <CenteredPage.PageSectionTitle
                  title={translate('text_1772133285142iljykq4wpq5')}
                  description={translate('text_1772738921836y4nmj2wms6b')}
                />

                <form.AppField
                  name="billableMetricId"
                  listeners={{
                    onChange: ({ value }) => {
                      const allBms = [
                        ...(meteredBmData?.billableMetrics?.collection || []),
                        ...(recurringBmData?.billableMetrics?.collection || []),
                      ]
                      const selectedBm = allBms.find((bm) => bm.id === value)

                      if (selectedBm) {
                        form.reset(
                          {
                            ...form.state.values,
                            billableMetricId: selectedBm.id,
                            billableMetric: selectedBm,
                            properties: getPropertyShape({}),
                            filters: selectedBm.filters?.length ? [] : undefined,
                            appliedPricingUnit:
                              hasAnyPricingUnitConfigured && amountCurrency
                                ? ({
                                    code: amountCurrency,
                                    conversionRate: undefined,
                                    shortName: amountCurrency,
                                    type: LocalPricingUnitType.Fiat,
                                  } as LocalPricingUnitInput)
                                : form.state.values.appliedPricingUnit,
                          },
                          { keepDefaultValues: true },
                        )
                      }
                    },
                  }}
                >
                  {(field) => (
                    <field.ComboBoxField
                      className={SEARCH_BILLABLE_METRIC_IN_USAGE_CHARGE_DRAWER_INPUT_CLASSNAME}
                      data={billableMetricsComboboxData}
                      searchQuery={combinedSearchQuery}
                      loading={false}
                      placeholder={translate('text_6435888d7cc86500646d8981')}
                      emptyText={translate('text_6246b6bc6b25f500b779aa7a')}
                      renderGroupHeader={renderGroupHeader}
                    />
                  )}
                </form.AppField>
              </CenteredPage.PageSection>
            ) : (
              <CenteredPage.SubsectionWrapper>
                {/* Selected billable metric (read-only) */}
                <CenteredPage.PageSection>
                  <CenteredPage.PageSectionTitle
                    title={translate('text_1772133285142iljykq4wpq5')}
                  />

                  <Selector
                    icon="pulse"
                    title={formValues.billableMetric.name}
                    subtitle={formValues.billableMetric.code}
                  />
                </CenteredPage.PageSection>

                {/* Pricing unit settings */}
                {!!hasAnyPricingUnitConfigured && (
                  <CenteredPage.PageSection>
                    <CenteredPage.PageSectionTitle
                      title={translate('text_17502574817266uy9bvk3i8u')}
                    />

                    <CustomPricingUnitSelector
                      currency={currency}
                      isInSubscriptionForm={isInSubscriptionForm}
                      disabled={disabled}
                      localCharge={formValues as unknown as LocalUsageChargeInput}
                      handleUpdate={handleChargeModelUpdate}
                    />
                  </CenteredPage.PageSection>
                )}

                {/* Pricing settings */}
                <CenteredPage.PageSection>
                  <CenteredPage.PageSectionTitle
                    title={translate('text_1772133285141xbpuxbd4vrk')}
                  />

                  <ChargeModelSelector
                    alreadyUsedChargeAlertMessage={alertMessageRef.current}
                    isInSubscriptionForm={isInSubscriptionForm}
                    disabled={disabled}
                    localCharge={formValues as unknown as LocalUsageChargeInput}
                    chargeModelComboboxData={chargeModelComboboxData}
                    handleUpdate={handleChargeModelUpdate}
                  />

                  <ChargeWrapperSwitch
                    chargeType="usage"
                    chargePricingUnitShortName={chargePricingUnitShortName}
                    currency={currency}
                    form={form}
                    isEdition={isEdition || false}
                    localCharge={formValues as unknown as LocalUsageChargeInput}
                    premiumWarningDialogRef={premiumWarningDialogRef}
                    propertyCursor="properties"
                  />

                  {!!formValues.billableMetric?.filters?.length && (
                    <CenteredPage.SubsectionTitle
                      title={translate('text_66ab42d4ece7e6b7078993ad')}
                      description={translate('text_17732575346321t54t9g8ok5')}
                    />
                  )}

                  {/* Default properties and filters */}
                  {!!formValues.filters?.length && (
                    <div className="flex flex-col gap-4">
                      {/* Filters */}
                      {!!formValues.filters?.length &&
                        formValues.filters.map((filter, filterIndex) => {
                          const accordionMappedDisplayValues: string = filter.values
                            .map((value: string) => {
                              try {
                                const [k, v] = Object.entries(JSON.parse(value))[0]

                                if (v === ALL_FILTER_VALUES) {
                                  return `${k}`
                                }

                                return `${v}`
                              } catch {
                                return value
                              }
                            })
                            .join(' • ')

                          return (
                            <Accordion
                              key={`drawer-charge-filter-${filterIndex}`}
                              noContentMargin
                              initiallyOpen={filter.values.length === 0}
                              summary={
                                <div className="flex h-18 w-full items-center justify-between gap-3 overflow-hidden">
                                  <div className="flex items-center gap-3 overflow-hidden p-1 pl-0">
                                    <Typography variant="bodyHl" color="textSecondary" noWrap>
                                      {filter.invoiceDisplayName ||
                                        accordionMappedDisplayValues ||
                                        translate('text_65f847a944603a01034f5831')}
                                    </Typography>
                                  </div>
                                  <div className="flex items-center gap-3 p-1 pl-0">
                                    <Tooltip
                                      placement="top-end"
                                      title={translate('text_63aa085d28b8510cd46443ff')}
                                    >
                                      <Button
                                        size="small"
                                        icon="trash"
                                        variant="quaternary"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          const newFiltersArray = [...(formValues.filters || [])]

                                          newFiltersArray.splice(filterIndex, 1)
                                          form.setFieldValue('filters', newFiltersArray)
                                        }}
                                      />
                                    </Tooltip>
                                  </div>
                                </div>
                              }
                              data-test={`filter-charge-accordion-${filterIndex}`}
                            >
                              <div className="not-last-child:shadow-b">
                                <ChargeFilter
                                  filter={filter}
                                  chargeIndex={editIndexRef.current}
                                  filterIndex={filterIndex}
                                  billableMetricFilters={formValues.billableMetric?.filters || []}
                                  setFilterValues={(values) => {
                                    const newFilters = [...(formValues.filters || [])]

                                    newFilters[filterIndex] = {
                                      ...newFilters[filterIndex],
                                      values,
                                    }
                                    form.setFieldValue('filters', newFilters)
                                  }}
                                  deleteFilterValue={(valueIndex) => {
                                    const newFilters = [...(formValues.filters || [])]
                                    const newValues = [...newFilters[filterIndex].values]

                                    newValues.splice(valueIndex, 1)
                                    newFilters[filterIndex] = {
                                      ...newFilters[filterIndex],
                                      values: newValues,
                                    }
                                    form.setFieldValue('filters', newFilters)
                                  }}
                                />

                                <ChargeWrapperSwitch
                                  chargeType="usage"
                                  chargePricingUnitShortName={chargePricingUnitShortName}
                                  currency={currency}
                                  form={form}
                                  isEdition={isEdition || false}
                                  localCharge={formValues as unknown as LocalUsageChargeInput}
                                  premiumWarningDialogRef={premiumWarningDialogRef}
                                  propertyCursor={`filters.${filterIndex}.properties`}
                                />
                              </div>
                            </Accordion>
                          )
                        })}
                    </div>
                  )}

                  {/* Add filter */}
                  {!!formValues.billableMetric?.filters?.length && (
                    <Button
                      align="left"
                      variant="inline"
                      startIcon="plus"
                      onClick={() => {
                        const newFilters = [
                          ...(formValues.filters || []),
                          {
                            invoiceDisplayName: '',
                            properties: getPropertyShape({}),
                            values: [] as string[],
                          },
                        ]

                        form.setFieldValue('filters', newFilters as LocalChargeFilterInput[])

                        setTimeout(() => {
                          const filterKeyInputs = document.getElementById(
                            buildChargeFilterAddFilterButtonId(
                              editIndexRef.current,
                              (formValues.filters || [])?.length,
                            ),
                          )

                          if (filterKeyInputs) {
                            filterKeyInputs.click()
                          }
                        }, 0)
                      }}
                    >
                      {translate('text_65f8472df7593301061e27e2')}
                    </Button>
                  )}
                </CenteredPage.PageSection>

                {/* Invoicing settings */}
                <CenteredPage.PageSection>
                  <CenteredPage.PageSectionTitle
                    title={translate('text_17423672025282dl7iozy1ru')}
                  />

                  <form.AppField name="invoiceDisplayName">
                    {(field) => (
                      <field.TextInputField
                        label={translate('text_65a6b4e2cb38d9b70ec53d39')}
                        description={translate('text_1771963033467yduu33x3qw9')}
                        placeholder={translate('text_65a6b4e2cb38d9b70ec53d41')}
                      />
                    )}
                  </form.AppField>

                  <PlanBillingPeriodInfoSection />

                  <ChargePayInAdvanceOption
                    chargePayInAdvanceDescription={chargePayInAdvanceDescription}
                    disabled={isInSubscriptionForm || disabled}
                    isPayInAdvanceOptionDisabled={isPayInAdvanceOptionDisabled}
                    payInAdvance={formValues.payInAdvance}
                    handleUpdate={({ invoiceable, payInAdvance, regroupPaidFees }) => {
                      form.setFieldValue('payInAdvance', payInAdvance)
                      if (invoiceable !== undefined) {
                        form.setFieldValue('invoiceable', invoiceable)
                      }
                      if (regroupPaidFees === null) {
                        form.setFieldValue('regroupPaidFees', null)
                      }
                    }}
                  />

                  {formValues.payInAdvance && (
                    <ChargeInvoicingStrategyOption
                      localCharge={formValues as unknown as LocalUsageChargeInput}
                      disabled={isInSubscriptionForm || disabled}
                      openPremiumDialog={() => premiumWarningDialogRef?.current?.openDialog()}
                      handleUpdate={({ regroupPaidFees, invoiceable }) => {
                        form.setFieldValue('regroupPaidFees', regroupPaidFees)
                        form.setFieldValue('invoiceable', invoiceable)
                      }}
                    />
                  )}

                  {!!formValues.billableMetric.recurring && (
                    <div className="flex flex-col gap-4">
                      <form.AppField name="prorated">
                        {(field) => (
                          <field.SwitchField
                            label={translate('text_649c54823c90890062476255')}
                            disabled={isInSubscriptionForm || disabled || isProratedOptionDisabled}
                            subLabel={
                              isProratedOptionDisabled
                                ? translate('text_649c54823c9089006247625a', {
                                    chargeModel: formValues.chargeModel,
                                  })
                                : translate('text_649c54823c90890062476259')
                            }
                          />
                        )}
                      </form.AppField>
                    </div>
                  )}

                  {!formValues.payInAdvance && (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <Typography variant="captionHl" color="textSecondary">
                          {translate('text_643e592657fc1ba5ce110c30')}
                        </Typography>
                        <Typography variant="caption">
                          {translate('text_6661fc17337de3591e29e451', {
                            interval: translate(
                              mapChargeIntervalCopy(interval, false),
                            ).toLocaleLowerCase(),
                          })}
                        </Typography>
                      </div>

                      <SpendingMinimumOptionSection
                        initialLocalCharge={
                          (initialChargeRef.current ||
                            formValues) as unknown as LocalUsageChargeInput
                        }
                        subscriptionFormType={subscriptionFormType}
                        disabled={disabled}
                        localCharge={formValues as unknown as LocalUsageChargeInput}
                        chargePricingUnitShortName={chargePricingUnitShortName}
                        currency={currency}
                        isPremium={isPremium}
                        premiumWarningDialogRef={premiumWarningDialogRef}
                        chargeIndex={editIndexRef.current}
                        handleUpdate={(name, value) => {
                          form.setFieldValue(
                            name as keyof UsageChargeDrawerFormValues,
                            value as UsageChargeDrawerFormValues[keyof UsageChargeDrawerFormValues],
                          )
                        }}
                        handleRemoveSpendingMinimum={() => {
                          form.setFieldValue('minAmountCents', '')
                        }}
                      />
                    </div>
                  )}

                  <TaxesSelectorSection
                    title={translate('text_1760729707267seik64l67k8')}
                    description={translate('text_6662c316125d2400f7995ff6')}
                    taxes={formValues.taxes}
                    comboboxSelector={SEARCH_TAX_INPUT_FOR_CHARGE_CLASSNAME}
                    onUpdate={(newTaxArray) => {
                      form.setFieldValue('taxes', newTaxArray)
                    }}
                  />
                </CenteredPage.PageSection>
              </CenteredPage.SubsectionWrapper>
            )}
          </CenteredPage.SectionWrapper>
        </form>
      </Drawer>
    )
  },
)

UsageChargeDrawer.displayName = 'UsageChargeDrawer'
