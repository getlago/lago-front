import { gql } from '@apollo/client'
import { FormikErrors, FormikProps } from 'formik'
import { tw } from 'lago-design-system'
import { memo, RefObject, useCallback, useEffect, useMemo } from 'react'

import { ConditionalWrapper } from '~/components/ConditionalWrapper'
import { Accordion, Button, Chip, Tooltip, Typography } from '~/components/designSystem'
import { Switch } from '~/components/form'
import { EditInvoiceDisplayNameDialogRef } from '~/components/invoices/EditInvoiceDisplayNameDialog'
import { ChargeModelSelector } from '~/components/plans/chargeAccordion/ChargeModelSelector'
import { CustomPricingUnitSelector } from '~/components/plans/chargeAccordion/CustomPricingUnitSelector'
import { EditInvoiceDisplayNameButton } from '~/components/plans/chargeAccordion/EditInvoiceDisplayNameButton'
import { ChargeInvoicingStrategyOption } from '~/components/plans/chargeAccordion/options/ChargeInvoicingStrategyOption'
import { ChargePayInAdvanceOption } from '~/components/plans/chargeAccordion/options/ChargePayInAdvanceOption'
import { RemoveChargeButton } from '~/components/plans/chargeAccordion/RemoveChargeButton'
import { SpendingMinimumOptionSection } from '~/components/plans/chargeAccordion/SpendingMinimumOptionSection'
import {
  handleUpdateUsageCharges,
  HandleUpdateUsageChargesProps,
} from '~/components/plans/chargeAccordion/utils'
import { ValidationIcon } from '~/components/plans/chargeAccordion/ValidationIcon'
import { mapChargeIntervalCopy } from '~/components/plans/utils'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { TaxesSelectorSection } from '~/components/taxes/TaxesSelectorSection'
import {
  ALL_FILTER_VALUES,
  FORM_TYPE_ENUM,
  MUI_BUTTON_BASE_ROOT_CLASSNAME,
  SEARCH_TAX_INPUT_FOR_CHARGE_CLASSNAME,
} from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import getPropertyShape from '~/core/serializers/getPropertyShape'
import { scrollToAndClickElement } from '~/core/utils/domUtils'
import {
  AggregationTypeEnum,
  ChargeForUsageChargeOptionsAccordionFragmentDoc,
  ChargeModelEnum,
  CurrencyEnum,
  CustomChargeFragmentDoc,
  GraduatedChargeFragmentDoc,
  GraduatedPercentageChargeFragmentDoc,
  PackageChargeFragmentDoc,
  PercentageChargeFragmentDoc,
  PlanInterval,
  PricingGroupKeysFragmentDoc,
  StandardChargeFragmentDoc,
  TaxForTaxesSelectorSectionFragmentDoc,
  VolumeRangesFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useChargeForm } from '~/hooks/plans/useChargeForm'
import { useCurrentUser } from '~/hooks/useCurrentUser'

import { buildChargeFilterAddFilterButtonId, ChargeFilter } from './chargeAccordion/ChargeFilter'
import { ChargeWrapperSwitch } from './chargeAccordion/ChargeWrapperSwitch'
import { UsageChargeOptionsAccordion } from './chargeAccordion/options/UsageChargeOptionsAccordion'
import { RemoveChargeWarningDialogRef } from './RemoveChargeWarningDialog'
import { LocalPricingUnitType, LocalUsageChargeInput, PlanFormInput } from './types'

const buildChargeDefaultPropertyId = (chargeIndex: number) =>
  `charge-${chargeIndex}-default-property-accordion`

gql`
  fragment UsageChargeAccordion on Charge {
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
    ...ChargeForUsageChargeOptionsAccordion
  }

  ${GraduatedChargeFragmentDoc}
  ${GraduatedPercentageChargeFragmentDoc}
  ${VolumeRangesFragmentDoc}
  ${PackageChargeFragmentDoc}
  ${StandardChargeFragmentDoc}
  ${PercentageChargeFragmentDoc}
  ${CustomChargeFragmentDoc}
  ${ChargeForUsageChargeOptionsAccordionFragmentDoc}
  ${PricingGroupKeysFragmentDoc}
  ${TaxForTaxesSelectorSectionFragmentDoc}
`

interface UsageChargeAccordionProps {
  alreadyUsedChargeAlertMessage: string | undefined
  currency: CurrencyEnum
  disabled?: boolean
  editInvoiceDisplayNameDialogRef: RefObject<EditInvoiceDisplayNameDialogRef>
  formikProps: FormikProps<PlanFormInput>
  id: string
  index: number
  isEdition: boolean
  isInitiallyOpen?: boolean
  isInSubscriptionForm?: boolean
  isUsedInSubscription?: boolean
  premiumWarningDialogRef?: RefObject<PremiumWarningDialogRef>
  removeChargeWarningDialogRef?: RefObject<RemoveChargeWarningDialogRef>
  subscriptionFormType?: keyof typeof FORM_TYPE_ENUM
}

export const UsageChargeAccordion = memo(
  ({
    alreadyUsedChargeAlertMessage,
    currency,
    disabled,
    editInvoiceDisplayNameDialogRef,
    formikProps,
    id,
    index,
    isEdition,
    isInitiallyOpen,
    isInSubscriptionForm,
    isUsedInSubscription,
    premiumWarningDialogRef,
    removeChargeWarningDialogRef,
    subscriptionFormType,
  }: UsageChargeAccordionProps) => {
    const { translate } = useInternationalization()
    const { isPremium } = useCurrentUser()
    const {
      getUsageChargeModelComboboxData,
      getIsPayInAdvanceOptionDisabled,
      getIsProRatedOptionDisabled,
    } = useChargeForm()
    const chargeErrors = formikProps?.errors?.charges

    const {
      chargeModelComboboxData,
      hasDefaultPropertiesErrors,
      initialLocalCharge,
      isPayInAdvanceOptionDisabled,
      isProratedOptionDisabled,
      localCharge,
    } = useMemo(() => {
      const formikCharge = formikProps.values.charges[index]
      const localChargeModelComboboxData = getUsageChargeModelComboboxData({
        isPremium,
        aggregationType: formikCharge.billableMetric.aggregationType,
      })
      const localIsPayInAdvanceOptionDisabled = getIsPayInAdvanceOptionDisabled({
        aggregationType: formikCharge.billableMetric.aggregationType,
        chargeModel: formikCharge.chargeModel,
        isPayInAdvance: formikCharge.payInAdvance || false,
        isProrated: formikCharge.prorated || false,
        isRecurring: formikCharge.billableMetric.recurring,
      })
      const localIsProratedOptionDisabled = getIsProRatedOptionDisabled({
        isPayInAdvance: formikCharge.payInAdvance || false,
        aggregationType: formikCharge.billableMetric.aggregationType,
        chargeModel: formikCharge.chargeModel,
      })

      return {
        chargeModelComboboxData: localChargeModelComboboxData,
        hasDefaultPropertiesErrors:
          typeof chargeErrors === 'object' &&
          typeof chargeErrors[index] === 'object' &&
          typeof chargeErrors[index].properties === 'object',
        initialLocalCharge: formikProps.initialValues.charges[index],
        isPayInAdvanceOptionDisabled: localIsPayInAdvanceOptionDisabled,
        isProratedOptionDisabled: localIsProratedOptionDisabled,
        localCharge: formikCharge,
      }
    }, [
      chargeErrors,
      formikProps.initialValues.charges,
      formikProps.values.charges,
      getUsageChargeModelComboboxData,
      getIsPayInAdvanceOptionDisabled,
      getIsProRatedOptionDisabled,
      index,
      isPremium,
    ])

    const handleUpdate = useCallback(
      (
        name: HandleUpdateUsageChargesProps['name'],
        value: HandleUpdateUsageChargesProps['value'],
      ) => {
        handleUpdateUsageCharges({
          formikProps,
          index,
          isPremium,
          localCharge,
          name,
          premiumWarningDialogRef,
          value,
        })
      },

      // eslint-disable-next-line react-hooks/exhaustive-deps
      [index, isPremium, localCharge, premiumWarningDialogRef],
    )

    const taxValueForBadgeDisplay = useMemo((): string | undefined => {
      if (!localCharge?.taxes?.length && !formikProps?.values?.taxes?.length) return

      if (localCharge.taxes?.length)
        return String(localCharge.taxes.reduce((acc, cur) => acc + cur.rate, 0))

      return String(formikProps?.values?.taxes?.reduce((acc, cur) => acc + cur.rate, 0))
    }, [formikProps?.values?.taxes, localCharge.taxes])

    const chargePricingUnitShortName = useMemo(
      () =>
        (localCharge.appliedPricingUnit?.type === LocalPricingUnitType.Custom &&
          localCharge.appliedPricingUnit?.shortName) ||
        undefined,
      [localCharge.appliedPricingUnit],
    )

    const chargePayInAdvanceDescription = useMemo(() => {
      if (localCharge.chargeModel === ChargeModelEnum.Volume) {
        return translate('text_6669b493fae79a0095e639bc')
      } else if (localCharge.billableMetric.aggregationType === AggregationTypeEnum.MaxAgg) {
        return translate('text_6669b493fae79a0095e63986')
      } else if (localCharge.billableMetric.aggregationType === AggregationTypeEnum.LatestAgg) {
        return translate('text_6669b493fae79a0095e639a1')
      }

      return translate('text_6661fc17337de3591e29e435')
    }, [localCharge.chargeModel, localCharge.billableMetric.aggregationType, translate])

    // When plan currency changes, make sure the pricing unit is set to the new currency if it's a Fiat one
    useEffect(() => {
      if (
        localCharge.appliedPricingUnit?.type === LocalPricingUnitType.Fiat &&
        (localCharge.appliedPricingUnit?.code !== currency ||
          localCharge.appliedPricingUnit?.shortName !== currency)
      ) {
        handleUpdate('appliedPricingUnit', {
          ...localCharge.appliedPricingUnit,
          code: currency,
          shortName: currency,
        })
      }

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currency])

    const isAnnual = [PlanInterval.Semiannual, PlanInterval.Yearly].includes(
      formikProps.values.interval,
    )

    return (
      <Accordion
        noContentMargin
        id={id}
        initiallyOpen={!!(isInitiallyOpen || !formikProps.values.charges?.[index]?.id)}
        summary={
          <div className="flex w-full items-center justify-between gap-3 overflow-hidden">
            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 truncate p-1 pl-0">
                <Typography variant="bodyHl" color="textSecondary" noWrap>
                  {localCharge.invoiceDisplayName || localCharge?.billableMetric?.name}
                </Typography>
                <EditInvoiceDisplayNameButton
                  editInvoiceDisplayNameDialogRef={editInvoiceDisplayNameDialogRef}
                  currentInvoiceDisplayName={localCharge.invoiceDisplayName}
                  onEdit={(invoiceDisplayName: string) => {
                    formikProps.setFieldValue(
                      `charges.${index}.invoiceDisplayName`,
                      invoiceDisplayName,
                    )
                  }}
                />
              </div>
              <Typography variant="caption" noWrap>
                {localCharge?.billableMetric?.code}
              </Typography>
            </div>
            <div className="flex items-center gap-3 p-1 pl-0">
              <ValidationIcon hasError={Boolean(formikProps?.errors?.charges?.[index])} />

              {!!taxValueForBadgeDisplay && (
                <Chip
                  label={intlFormatNumber(Number(taxValueForBadgeDisplay) / 100 || 0, {
                    style: 'percent',
                  })}
                />
              )}
              <Chip
                label={translate(
                  mapChargeIntervalCopy(
                    formikProps.values.interval,
                    (isAnnual && !!formikProps.values.billChargesMonthly) || false,
                  ),
                )}
              />

              <RemoveChargeButton
                isInSubscriptionForm={isInSubscriptionForm}
                isUsedInSubscription={isUsedInSubscription}
                removeChargeWarningDialogRef={removeChargeWarningDialogRef}
                existingCharges={formikProps.values.charges}
                chargeToRemoveIndex={index}
                onDeleteCharge={(charges) => formikProps.setFieldValue('charges', charges)}
              />
            </div>
          </div>
        }
        data-test={`charge-accordion-${index}`}
      >
        <>
          <CustomPricingUnitSelector
            currency={currency}
            isInSubscriptionForm={isInSubscriptionForm}
            disabled={disabled}
            localCharge={localCharge}
            handleUpdate={handleUpdate}
          />

          <ChargeModelSelector
            alreadyUsedChargeAlertMessage={alreadyUsedChargeAlertMessage}
            isInSubscriptionForm={isInSubscriptionForm}
            disabled={disabled}
            localCharge={localCharge}
            chargeModelComboboxData={chargeModelComboboxData}
            handleUpdate={handleUpdate}
          />

          {(!!localCharge.properties || !!localCharge?.filters?.length) && (
            <>
              <div
                className={tw(
                  'flex flex-col gap-4',
                  !!localCharge?.billableMetric?.filters?.length && 'mt-6 px-4',
                )}
              >
                {/* Simple charge or default property for groups */}
                {!!localCharge.properties && (
                  <ConditionalWrapper
                    condition={!!localCharge?.billableMetric?.filters?.length}
                    invalidWrapper={(children) => (
                      <div data-test="default-usage-charge-accordion-without-filters">
                        {children}
                      </div>
                    )}
                    validWrapper={(children) => {
                      const cannotDeleteDefaultProperties = !!isInSubscriptionForm

                      return (
                        <Accordion
                          noContentMargin
                          className={buildChargeDefaultPropertyId(index)}
                          summary={
                            <div className="flex h-18 w-full items-center justify-between gap-3 overflow-hidden">
                              <div className="flex items-center gap-3 overflow-hidden p-1 pl-0">
                                <div>
                                  <Typography noWrap variant="bodyHl" color="grey700">
                                    {translate('text_64e620bca31226337ffc62ad')}
                                  </Typography>
                                  <Typography noWrap variant="caption" color="grey600">
                                    {translate('text_65f847a944603a01034f5830')}
                                  </Typography>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-1 pl-0">
                                <ValidationIcon hasError={hasDefaultPropertiesErrors} />
                                <Tooltip
                                  placement="top-end"
                                  title={
                                    cannotDeleteDefaultProperties
                                      ? translate('text_17333939568926k978cvbly9')
                                      : translate('text_63aa085d28b8510cd46443ff')
                                  }
                                >
                                  <Button
                                    size="small"
                                    icon="trash"
                                    variant="quaternary"
                                    disabled={cannotDeleteDefaultProperties}
                                    onClick={(e) => {
                                      e.stopPropagation()

                                      // Remove the default charge
                                      handleUpdate('properties', undefined)
                                    }}
                                  />
                                </Tooltip>
                              </div>
                            </div>
                          }
                          data-test={buildChargeDefaultPropertyId(index)}
                        >
                          {children}
                        </Accordion>
                      )
                    }}
                  >
                    <ChargeWrapperSwitch
                      chargeCursor="charges"
                      chargeErrors={formikProps.errors}
                      chargeIndex={index}
                      chargePricingUnitShortName={chargePricingUnitShortName}
                      currency={currency}
                      formikProps={formikProps}
                      isEdition={isEdition}
                      premiumWarningDialogRef={premiumWarningDialogRef}
                      propertyCursor="properties"
                      setFieldValue={formikProps.setFieldValue}
                      valuePointer={localCharge?.properties}
                    />
                  </ConditionalWrapper>
                )}

                {/* Filters */}
                {!!localCharge?.filters?.length &&
                  localCharge?.filters.map((filter, filterIndex) => {
                    const hasFilterErrors = Boolean(
                      (formikProps?.errors?.charges?.[index] as FormikErrors<LocalUsageChargeInput>)
                        ?.filters?.[filterIndex],
                    )
                    const accordionMappedDisplayValues: string = filter.values
                      .map((value: string) => {
                        const [k, v] = Object.entries(JSON.parse(value))[0]

                        if (v === ALL_FILTER_VALUES) {
                          return `${k}`
                        }

                        return `${v}`
                      })
                      .join(' • ')

                    return (
                      <Accordion
                        key={`charge-${index}-filter-${filterIndex}`}
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

                              <EditInvoiceDisplayNameButton
                                editInvoiceDisplayNameDialogRef={editInvoiceDisplayNameDialogRef}
                                currentInvoiceDisplayName={filter.invoiceDisplayName}
                                onEdit={(invoiceDisplayName: string) => {
                                  formikProps.setFieldValue(
                                    `charges.${index}.filters.${filterIndex}.invoiceDisplayName`,
                                    invoiceDisplayName,
                                  )
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-3 p-1 pl-0">
                              <ValidationIcon hasError={hasFilterErrors} />
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

                                    // Remove the filter from the charge
                                    const newFiltersArray = [...(localCharge.filters || [])]

                                    newFiltersArray.splice(filterIndex, 1)

                                    handleUpdate('filters', newFiltersArray)
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
                            chargeIndex={index}
                            filterIndex={filterIndex}
                            billableMetricFilters={localCharge.billableMetric?.filters || []}
                            setFilterValues={(values) => {
                              formikProps.setFieldValue(
                                `charges.${index}.filters.${filterIndex}.values`,
                                values,
                              )
                            }}
                            deleteFilterValue={(valueIndex) => {
                              const newValuesArray = [
                                ...((localCharge.filters || [])?.[filterIndex].values || {}),
                              ]

                              newValuesArray.splice(valueIndex, 1)

                              formikProps.setFieldValue(
                                `charges.${index}.filters.${filterIndex}.values`,
                                newValuesArray,
                              )
                            }}
                          />

                          <ChargeWrapperSwitch
                            chargeCursor="charges"
                            chargeErrors={formikProps.errors}
                            chargeIndex={index}
                            chargePricingUnitShortName={chargePricingUnitShortName}
                            currency={currency}
                            filterIndex={filterIndex}
                            formikProps={formikProps}
                            isEdition={isEdition}
                            premiumWarningDialogRef={premiumWarningDialogRef}
                            propertyCursor={`filters.${filterIndex}.properties`}
                            setFieldValue={formikProps.setFieldValue}
                            valuePointer={filter.properties}
                          />
                        </div>
                      </Accordion>
                    )
                  })}
              </div>
            </>
          )}

          {!!localCharge?.billableMetric?.filters?.length && (
            <div className="mx-0 mb-4 mt-6 flex flex-wrap gap-4 px-4">
              {!!localCharge.billableMetric.filters?.length && (
                <Button
                  variant="inline"
                  startIcon="plus"
                  onClick={() => {
                    formikProps.setFieldValue(`charges.${index}.filters`, [
                      ...(localCharge.filters || []),
                      {
                        invoiceDisplayName: '',
                        properties: getPropertyShape({}),
                        values: [],
                      },
                    ])

                    // Trigger the appearition of filter combobox
                    setTimeout(() => {
                      const filterKeyInputs = document.getElementById(
                        buildChargeFilterAddFilterButtonId(
                          index,
                          (localCharge.filters || [])?.length,
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

              {!localCharge.properties && (
                <Button
                  variant="inline"
                  startIcon="plus"
                  onClick={() => {
                    formikProps.setFieldValue(`charges.${index}.properties`, getPropertyShape({}))

                    scrollToAndClickElement({
                      selector: `.${buildChargeDefaultPropertyId(index)} .${MUI_BUTTON_BASE_ROOT_CLASSNAME}`,
                    })
                  }}
                >
                  {translate('text_65faba06377c5900f5111cc6')}
                </Button>
              )}
            </div>
          )}

          {/* Charge options */}
          <UsageChargeOptionsAccordion
            charge={localCharge}
            currency={currency}
            chargePricingUnitShortName={chargePricingUnitShortName}
          >
            <ChargePayInAdvanceOption
              chargePayInAdvanceDescription={chargePayInAdvanceDescription}
              disabled={isInSubscriptionForm || disabled}
              isPayInAdvanceOptionDisabled={isPayInAdvanceOptionDisabled}
              payInAdvance={localCharge.payInAdvance || false}
              handleUpdate={({ invoiceable, payInAdvance, regroupPaidFees }) => {
                const objectToUpdate = {
                  ...localCharge,
                  ...(invoiceable ? { invoiceable } : {}),
                  ...(regroupPaidFees === null ? { regroupPaidFees: null } : {}),
                  payInAdvance,
                }

                formikProps.setFieldValue(`charges.${index}`, objectToUpdate)
              }}
            />

            {localCharge.payInAdvance && (
              <ChargeInvoicingStrategyOption
                localCharge={localCharge}
                disabled={isInSubscriptionForm || disabled}
                openPremiumDialog={() => premiumWarningDialogRef?.current?.openDialog()}
                handleUpdate={({ regroupPaidFees, invoiceable }) => {
                  const currentChargeValues: LocalUsageChargeInput = {
                    ...localCharge,
                    regroupPaidFees,
                    invoiceable,
                  }

                  formikProps.setFieldValue(`charges.${index}`, currentChargeValues)
                }}
              />
            )}

            {!!localCharge.billableMetric.recurring && (
              <Switch
                name={`charge-${localCharge.id}-prorated`}
                label={translate('text_649c54823c90890062476255')}
                disabled={isInSubscriptionForm || disabled || isProratedOptionDisabled}
                subLabel={
                  isProratedOptionDisabled
                    ? translate('text_649c54823c9089006247625a', {
                        chargeModel: localCharge.chargeModel,
                      })
                    : translate('text_649c54823c90890062476259')
                }
                checked={!!localCharge.prorated}
                onChange={(value) => handleUpdate('prorated', Boolean(value))}
              />
            )}

            {!localCharge.payInAdvance && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <Typography variant="captionHl" color="textSecondary">
                    {translate('text_643e592657fc1ba5ce110c30')}
                  </Typography>
                  <Typography variant="caption">
                    {translate('text_6661fc17337de3591e29e451', {
                      interval: translate(
                        mapChargeIntervalCopy(formikProps.values.interval, false),
                      ).toLocaleLowerCase(),
                    })}
                  </Typography>
                </div>

                <SpendingMinimumOptionSection
                  initialLocalCharge={initialLocalCharge}
                  subscriptionFormType={subscriptionFormType}
                  disabled={disabled}
                  localCharge={localCharge}
                  chargePricingUnitShortName={chargePricingUnitShortName}
                  currency={currency}
                  isPremium={isPremium}
                  premiumWarningDialogRef={premiumWarningDialogRef}
                  chargeIndex={index}
                  handleUpdate={handleUpdate}
                  handleRemoveSpendingMinimum={() => {
                    formikProps.setFieldValue(`charges.${index}.minAmountCents`, undefined)
                  }}
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <Typography variant="captionHl" color="textSecondary">
                {translate('text_6661fc17337de3591e29e3e1')}
              </Typography>
              <Typography variant="caption">
                {translate('text_6662c316125d2400f7995ff6')}
              </Typography>
            </div>

            <TaxesSelectorSection
              taxes={localCharge?.taxes || []}
              comboboxSelector={SEARCH_TAX_INPUT_FOR_CHARGE_CLASSNAME}
              onUpdate={(newTaxArray) => {
                handleUpdate('taxes', newTaxArray)
              }}
              onDelete={(newTaxArray) => {
                handleUpdate('taxes', newTaxArray)
              }}
            />
          </UsageChargeOptionsAccordion>
        </>
      </Accordion>
    )
  },
)

UsageChargeAccordion.displayName = 'UsageChargeAccordion'
