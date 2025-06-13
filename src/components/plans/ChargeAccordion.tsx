import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { FormikErrors, FormikProps } from 'formik'
import { tw } from 'lago-design-system'
import { memo, MouseEvent, RefObject, useCallback, useEffect, useMemo, useState } from 'react'

import { ConditionalWrapper } from '~/components/ConditionalWrapper'
import {
  Accordion,
  Alert,
  Button,
  Chip,
  Icon,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { AmountInput, ComboBox, ComboboxItem, RadioGroupField, Switch } from '~/components/form'
import { EditInvoiceDisplayNameRef } from '~/components/invoices/EditInvoiceDisplayName'
import { ChargeBillingRadioGroup } from '~/components/plans/ChargeBillingRadioGroup'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { useDuplicatePlanVar } from '~/core/apolloClient'
import {
  ALL_FILTER_VALUES,
  FORM_TYPE_ENUM,
  getChargeModelHelpTextTranslationKey,
  getIntervalTranslationKey,
  MUI_BUTTON_BASE_ROOT_CLASSNAME,
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_TAX_INPUT_FOR_CHARGE_CLASSNAME,
} from '~/core/constants/form'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import getPropertyShape from '~/core/serializers/getPropertyShape'
import {
  AggregationTypeEnum,
  ChargeForChargeOptionsAccordionFragmentDoc,
  ChargeModelEnum,
  CurrencyEnum,
  CustomChargeFragmentDoc,
  DynamicChargeFragmentDoc,
  GraduatedChargeFragmentDoc,
  GraduatedPercentageChargeFragmentDoc,
  PackageChargeFragmentDoc,
  PercentageChargeFragmentDoc,
  PlanInterval,
  StandardChargeFragmentDoc,
  TaxForPlanChargeAccordionFragment,
  useGetTaxesForChargesLazyQuery,
  VolumeRangesFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useChargeForm } from '~/hooks/plans/useChargeForm'
import { useCurrentUser } from '~/hooks/useCurrentUser'

import { buildChargeFilterAddFilterButtonId, ChargeFilter } from './ChargeFilter'
import { ChargeOptionsAccordion } from './ChargeOptionsAccordion'
import { ChargeWrapperSwitch } from './ChargeWrapperSwitch'
import { RemoveChargeWarningDialogRef } from './RemoveChargeWarningDialog'
import { LocalChargeInput, PlanFormInput, TChargeErrors, TSetFieldValue } from './types'

const buildChargeDefaultPropertyId = (chargeIndex: number) =>
  `charge-${chargeIndex}-default-property-accordion`

gql`
  fragment TaxForPlanChargeAccordion on Tax {
    id
    code
    name
    rate
  }

  fragment ChargeAccordion on Charge {
    id
    chargeModel
    invoiceable
    minAmountCents
    payInAdvance
    prorated
    invoiceDisplayName
    regroupPaidFees
    properties {
      ...GraduatedCharge
      ...GraduatedPercentageCharge
      ...VolumeRanges
      ...PackageCharge
      ...StandardCharge
      ...PercentageCharge
      ...CustomCharge
      ...DynamicCharge
    }
    filters {
      invoiceDisplayName
      values
      properties {
        ...GraduatedCharge
        ...GraduatedPercentageCharge
        ...VolumeRanges
        ...PackageCharge
        ...StandardCharge
        ...PercentageCharge
        ...CustomCharge
        ...DynamicCharge
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
      ...TaxForPlanChargeAccordion
    }
    ...ChargeForChargeOptionsAccordion
  }

  query getTaxesForCharges($limit: Int, $page: Int) {
    taxes(limit: $limit, page: $page) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        ...TaxForPlanChargeAccordion
      }
    }
  }

  ${GraduatedChargeFragmentDoc}
  ${GraduatedPercentageChargeFragmentDoc}
  ${VolumeRangesFragmentDoc}
  ${PackageChargeFragmentDoc}
  ${StandardChargeFragmentDoc}
  ${PercentageChargeFragmentDoc}
  ${CustomChargeFragmentDoc}
  ${ChargeForChargeOptionsAccordionFragmentDoc}
  ${DynamicChargeFragmentDoc}
`

export const mapChargeIntervalCopy = (interval: string, forceMonthlyCharge: boolean): string => {
  if (forceMonthlyCharge || interval === PlanInterval.Monthly) {
    return getIntervalTranslationKey[PlanInterval.Monthly]
  } else if (interval === PlanInterval.Yearly) {
    return getIntervalTranslationKey[PlanInterval.Yearly]
  } else if (interval === PlanInterval.Quarterly) {
    return getIntervalTranslationKey[PlanInterval.Quarterly]
  } else if (interval === PlanInterval.Weekly) {
    return getIntervalTranslationKey[PlanInterval.Weekly]
  }

  return ''
}

interface ChargeAccordionProps {
  currency: CurrencyEnum
  disabled?: boolean
  isInitiallyOpen?: boolean
  isInSubscriptionForm?: boolean
  formikProps: FormikProps<PlanFormInput>
  id: string
  index: number
  isUsedInSubscription?: boolean
  formikCharge: LocalChargeInput
  formikInitialCharges: LocalChargeInput[]
  setFieldValue: TSetFieldValue
  chargeErrors: TChargeErrors
  premiumWarningDialogRef?: RefObject<PremiumWarningDialogRef>
  editInvoiceDisplayNameRef: RefObject<EditInvoiceDisplayNameRef>
  removeChargeWarningDialogRef?: RefObject<RemoveChargeWarningDialogRef>
  subscriptionFormType?: keyof typeof FORM_TYPE_ENUM
  shouldDisplayAlreadyUsedChargeAlert: boolean
}

export const ChargeAccordion = memo(
  ({
    currency,
    disabled,
    shouldDisplayAlreadyUsedChargeAlert,
    removeChargeWarningDialogRef,
    premiumWarningDialogRef,
    editInvoiceDisplayNameRef,
    isUsedInSubscription,
    formikInitialCharges,
    isInitiallyOpen,
    isInSubscriptionForm,
    formikCharge,
    formikProps,
    setFieldValue,
    chargeErrors,
    id,
    index,
    subscriptionFormType,
  }: ChargeAccordionProps) => {
    const { translate } = useInternationalization()
    const { isPremium } = useCurrentUser()
    const { type: actionType } = useDuplicatePlanVar()
    const {
      getChargeModelComboboxData,
      getIsPayInAdvanceOptionDisabled,
      getIsProRatedOptionDisabled,
    } = useChargeForm()

    const {
      chargeModelComboboxData,
      hasDefaultPropertiesErrors,
      hasErrorInCharges,
      initialLocalCharge,
      isPayInAdvanceOptionDisabled,
      isProratedOptionDisabled,
      localCharge,
    } = useMemo(() => {
      const localChargeModelComboboxData = getChargeModelComboboxData({
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
        hasErrorInCharges: Boolean(chargeErrors && chargeErrors[index]),
        initialLocalCharge: formikInitialCharges[index],
        isPayInAdvanceOptionDisabled: localIsPayInAdvanceOptionDisabled,
        isProratedOptionDisabled: localIsProratedOptionDisabled,
        localCharge: formikCharge,
      }
    }, [
      chargeErrors,
      formikCharge,
      formikInitialCharges,
      getChargeModelComboboxData,
      getIsPayInAdvanceOptionDisabled,
      getIsProRatedOptionDisabled,
      index,
      isPremium,
    ])

    const [showSpendingMinimum, setShowSpendingMinimum] = useState(
      !!initialLocalCharge?.minAmountCents && Number(initialLocalCharge?.minAmountCents) > 0,
    )
    const [shouldDisplayTaxesInput, setShouldDisplayTaxesInput] = useState<boolean>(false)
    const [getTaxes, { data: taxesData, loading: taxesLoading }] = useGetTaxesForChargesLazyQuery({
      variables: { limit: 500 },
    })
    const { collection: taxesCollection } = taxesData?.taxes || {}

    useEffect(() => {
      setShowSpendingMinimum(
        !!initialLocalCharge?.minAmountCents && Number(initialLocalCharge?.minAmountCents) > 0,
      )
    }, [initialLocalCharge?.minAmountCents])

    const handleUpdate = useCallback(
      (name: string, value: unknown) => {
        // IMPORTANT: This check should stay first in this function
        // If user is not premium and try to switch to graduated percentage pricing
        // We should show the premium modal and prevent any formik value change
        if (name === 'chargeModel' && !isPremium && value === ChargeModelEnum.GraduatedPercentage) {
          premiumWarningDialogRef?.current?.openDialog()
          return
        }

        // NOTE: We prevent going further if the change is about the charge model and the value remain the same
        // It prevents fixing the properties to be wrongly reset to default on 2nd select.
        if (name === 'chargeModel' && value === localCharge.chargeModel) return

        let currentChargeValues: LocalChargeInput = {
          ...localCharge,
          [name]: value,
        }

        if (name === 'chargeModel') {
          // Reset charge data to default when switching charge model
          currentChargeValues = {
            ...currentChargeValues,
            payInAdvance: false,
            prorated: false,
            invoiceable: true,
            properties: getPropertyShape({}),
            filters: [],
            taxes: [],
          }
        }

        setFieldValue(`charges.${index}`, currentChargeValues)
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

    const taxesDataForCombobox = useMemo(() => {
      if (!taxesCollection) return []

      const chargeTaxesIds = localCharge.taxes?.map((tax) => tax.id) || []

      return taxesCollection.map(({ id: taxId, name, rate }) => {
        return {
          label: `${name} (${intlFormatNumber(Number(rate) / 100 || 0, {
            style: 'percent',
          })})`,
          labelNode: (
            <ComboboxItem>
              {name}&nbsp;
              <Typography color="textPrimary">
                (
                {intlFormatNumber(Number(rate) / 100 || 0, {
                  style: 'percent',
                })}
                )
              </Typography>
            </ComboboxItem>
          ),
          value: taxId,
          disabled: chargeTaxesIds.includes(taxId),
        }
      })
    }, [localCharge.taxes, taxesCollection])

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
                <Tooltip title={translate('text_65018c8e5c6b626f030bcf8d')} placement="top-end">
                  <Button
                    icon="pen"
                    variant="quaternary"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()

                      editInvoiceDisplayNameRef.current?.openDialog({
                        invoiceDisplayName: localCharge.invoiceDisplayName,
                        callback: (invoiceDisplayName: string) => {
                          setFieldValue(`charges.${index}.invoiceDisplayName`, invoiceDisplayName)
                        },
                      })
                    }}
                  />
                </Tooltip>
              </div>
              <Typography variant="caption" noWrap>
                {localCharge?.billableMetric?.code}
              </Typography>
            </div>
            <div className="flex items-center gap-3 p-1 pl-0">
              <Tooltip
                placement="top-end"
                title={
                  hasErrorInCharges
                    ? translate('text_635b975ecea4296eb76924b7')
                    : translate('text_635b975ecea4296eb76924b1')
                }
              >
                <Icon
                  name="validate-filled"
                  className="flex items-center"
                  color={hasErrorInCharges ? 'disabled' : 'success'}
                />
              </Tooltip>

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
                    (formikProps.values.interval === PlanInterval.Yearly &&
                      !!formikProps.values.billChargesMonthly) ||
                      false,
                  ),
                )}
              />
              {!isInSubscriptionForm && (
                <Tooltip placement="top-end" title={translate('text_624aa732d6af4e0103d40e65')}>
                  <Button
                    variant="quaternary"
                    size="small"
                    icon="trash"
                    data-test="remove-charge"
                    onClick={(e: MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation()
                      e.preventDefault()

                      const deleteCharge = () => {
                        const charges = [...formikProps.values.charges]

                        charges.splice(index, 1)
                        setFieldValue('charges', charges)
                      }

                      if (actionType !== 'duplicate' && isUsedInSubscription) {
                        removeChargeWarningDialogRef?.current?.openDialog(index)
                      } else {
                        deleteCharge()
                      }
                    }}
                  />
                </Tooltip>
              )}
            </div>
          </div>
        }
        data-test={`charge-accordion-${index}`}
      >
        <>
          {/* Charge main infos */}
          <div className="p-4 pb-0" data-test="charge-model-wrapper">
            {!!shouldDisplayAlreadyUsedChargeAlert && (
              <Alert type="warning" className="mb-4">
                {translate('text_6435895831d323008a47911f')}
              </Alert>
            )}
            <ComboBox
              disableClearable
              name="chargeModel"
              disabled={isInSubscriptionForm || disabled}
              label={translate('text_65201b8216455901fe273dd5')}
              data={chargeModelComboboxData}
              value={localCharge.chargeModel}
              helperText={translate(getChargeModelHelpTextTranslationKey[localCharge.chargeModel])}
              onChange={(value) => handleUpdate('chargeModel', value)}
            />
          </div>

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
                      <div data-test="default-charge-accordion-without-filters">{children}</div>
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
                                <Tooltip
                                  placement="top-end"
                                  title={
                                    hasDefaultPropertiesErrors
                                      ? translate('text_635b975ecea4296eb76924b7')
                                      : translate('text_635b975ecea4296eb76924b1')
                                  }
                                >
                                  <Icon
                                    name="validate-filled"
                                    className="flex items-center"
                                    color={hasDefaultPropertiesErrors ? 'disabled' : 'success'}
                                  />
                                </Tooltip>
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
                      chargeErrors={chargeErrors}
                      chargeIndex={index}
                      currency={currency}
                      formikErrors={formikProps.errors}
                      localCharge={localCharge}
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
                      (formikProps?.errors?.charges?.[index] as FormikErrors<LocalChargeInput>)
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

                              <Tooltip
                                title={translate('text_65018c8e5c6b626f030bcf8d')}
                                placement="top-end"
                              >
                                <Button
                                  icon="pen"
                                  variant="quaternary"
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation()

                                    editInvoiceDisplayNameRef.current?.openDialog({
                                      invoiceDisplayName: filter.invoiceDisplayName,
                                      callback: (invoiceDisplayName: string) => {
                                        setFieldValue(
                                          `charges.${index}.filters.${filterIndex}.invoiceDisplayName`,
                                          invoiceDisplayName,
                                        )
                                      },
                                    })
                                  }}
                                />
                              </Tooltip>
                            </div>
                            <div className="flex items-center gap-3 p-1 pl-0">
                              <Tooltip
                                placement="top-end"
                                title={
                                  hasFilterErrors
                                    ? translate('text_635b975ecea4296eb76924b7')
                                    : translate('text_635b975ecea4296eb76924b1')
                                }
                              >
                                <Icon
                                  name="validate-filled"
                                  className="flex items-center"
                                  color={hasFilterErrors ? 'disabled' : 'success'}
                                />
                              </Tooltip>
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
                              setFieldValue(
                                `charges.${index}.filters.${filterIndex}.values`,
                                values,
                              )
                            }}
                            deleteFilterValue={(valueIndex) => {
                              const newValuesArray = [
                                ...((localCharge.filters || [])?.[filterIndex].values || {}),
                              ]

                              newValuesArray.splice(valueIndex, 1)

                              setFieldValue(
                                `charges.${index}.filters.${filterIndex}.values`,
                                newValuesArray,
                              )
                            }}
                          />

                          <ChargeWrapperSwitch
                            chargeErrors={chargeErrors}
                            chargeIndex={index}
                            currency={currency}
                            filterIndex={filterIndex}
                            formikErrors={formikProps.errors}
                            localCharge={localCharge}
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
            <div className="mx-0 mb-4 mt-6 px-4">
              {!!localCharge.billableMetric.filters?.length && (
                <Button
                  variant="quaternary"
                  startIcon="plus"
                  onClick={() => {
                    setFieldValue(`charges.${index}.filters`, [
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
                  variant="quaternary"
                  startIcon="plus"
                  onClick={() => {
                    setFieldValue(`charges.${index}.properties`, getPropertyShape({}))

                    setTimeout(() => {
                      const element = document.querySelector(
                        `.${buildChargeDefaultPropertyId(
                          index,
                        )} .${MUI_BUTTON_BASE_ROOT_CLASSNAME}`,
                      ) as HTMLElement

                      if (!element) return

                      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      element.click()
                    }, 0)
                  }}
                >
                  {translate('text_65faba06377c5900f5111cc6')}
                </Button>
              )}
            </div>
          )}

          {/* Charge options */}
          <ChargeOptionsAccordion charge={localCharge} currency={currency}>
            <RadioGroupField
              name={`charges.${index}.payInAdvance`}
              label={translate('text_6682c52081acea90520743a8')}
              description={chargePayInAdvanceDescription}
              formikProps={formikProps}
              disabled={isInSubscriptionForm || disabled}
              optionLabelVariant="body"
              options={[
                {
                  label: translate('text_6682c52081acea90520743ac'),
                  value: false,
                },
                {
                  label: translate('text_6682c52081acea90520744c8'),
                  value: true,
                  disabled: isPayInAdvanceOptionDisabled,
                },
              ]}
            />

            {localCharge.payInAdvance && (
              <ChargeBillingRadioGroup
                localCharge={localCharge}
                disabled={isInSubscriptionForm || disabled}
                openPremiumDialog={() => premiumWarningDialogRef?.current?.openDialog()}
                handleUpdate={({ regroupPaidFees, invoiceable }) => {
                  const currentChargeValues: LocalChargeInput = {
                    ...localCharge,
                    regroupPaidFees,
                    invoiceable,
                  }

                  setFieldValue(`charges.${index}`, currentChargeValues)
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
                {!showSpendingMinimum ? (
                  <Button
                    fitContent
                    variant="quaternary"
                    startIcon="plus"
                    disabled={subscriptionFormType === FORM_TYPE_ENUM.edition || disabled}
                    endIcon={isPremium ? undefined : 'sparkles'}
                    onClick={() => {
                      if (isPremium) {
                        setShowSpendingMinimum(true)
                        setTimeout(() => {
                          document.getElementById(`spending-minimum-input-${index}`)?.focus()
                        }, 0)
                      } else {
                        premiumWarningDialogRef?.current?.openDialog()
                      }
                    }}
                  >
                    {translate('text_643e592657fc1ba5ce110b9e')}
                  </Button>
                ) : (
                  <div className="flex items-center gap-3">
                    <AmountInput
                      className="flex-1"
                      id={`spending-minimum-input-${index}`}
                      beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
                      currency={currency}
                      placeholder={translate('text_643e592657fc1ba5ce110c80')}
                      disabled={subscriptionFormType === FORM_TYPE_ENUM.edition || disabled}
                      value={localCharge?.minAmountCents || ''}
                      onChange={(value) => handleUpdate('minAmountCents', value)}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            {getCurrencySymbol(currency)}
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
                      <Button
                        icon="trash"
                        variant="quaternary"
                        disabled={disabled}
                        onClick={() => {
                          setFieldValue(`charges.${index}.minAmountCents`, undefined)
                          setShowSpendingMinimum(false)
                        }}
                      />
                    </Tooltip>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <Typography variant="captionHl" color="textSecondary">
                  {translate('text_6661fc17337de3591e29e3e1')}
                </Typography>
                <Typography variant="caption">
                  {translate('text_6662c316125d2400f7995ff6')}
                </Typography>
              </div>
              {!!localCharge?.taxes?.length && (
                <div className="flex flex-wrap items-center gap-3">
                  {localCharge.taxes.map(({ id: localTaxId, name, rate }) => (
                    <Chip
                      key={localTaxId}
                      label={`${name} (${rate}%)`}
                      type="secondary"
                      size="medium"
                      deleteIcon="trash"
                      icon="percentage"
                      deleteIconLabel={translate('text_63aa085d28b8510cd46443ff')}
                      onDelete={() => {
                        const newTaxedArray =
                          localCharge.taxes?.filter((tax) => tax.id !== localTaxId) || []

                        setFieldValue(`charges.${index}.taxes`, newTaxedArray)
                      }}
                    />
                  ))}
                </div>
              )}

              {!shouldDisplayTaxesInput ? (
                <Button
                  fitContent
                  startIcon="plus"
                  variant="quaternary"
                  onClick={() => {
                    setShouldDisplayTaxesInput(true)

                    setTimeout(() => {
                      const element = document.querySelector(
                        `.${SEARCH_TAX_INPUT_FOR_CHARGE_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
                      ) as HTMLElement

                      if (!element) return

                      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      element.click()
                    }, 0)
                  }}
                  data-test="show-add-taxes"
                >
                  {translate('text_64be910fba8ef9208686a8c9')}
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <ComboBox
                    containerClassName="flex-1"
                    className={SEARCH_TAX_INPUT_FOR_CHARGE_CLASSNAME}
                    data={taxesDataForCombobox}
                    searchQuery={getTaxes}
                    loading={taxesLoading}
                    placeholder={translate('text_64be910fba8ef9208686a8e7')}
                    emptyText={translate('text_64be91fd0678965126e5657b')}
                    onChange={(newTaxId) => {
                      const previousTaxes = [...(localCharge?.taxes || [])]
                      const newTaxObject = taxesData?.taxes.collection.find(
                        (t) => t.id === newTaxId,
                      ) as TaxForPlanChargeAccordionFragment

                      handleUpdate('taxes', [...previousTaxes, newTaxObject])
                      setShouldDisplayTaxesInput(false)
                    }}
                  />

                  <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
                    <Button
                      icon="trash"
                      variant="quaternary"
                      onClick={() => {
                        setShouldDisplayTaxesInput(false)
                      }}
                    />
                  </Tooltip>
                </div>
              )}
            </div>
          </ChargeOptionsAccordion>
        </>
      </Accordion>
    )
  },
)

ChargeAccordion.displayName = 'ChargeAccordion'
