import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { FormikErrors, FormikProps } from 'formik'
import { memo, MouseEvent, RefObject, useCallback, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'

import {
  Accordion,
  Alert,
  Button,
  Chip,
  Icon,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { AmountInput, ComboBox, RadioGroup, Switch } from '~/components/form'
import { useDuplicatePlanVar } from '~/core/apolloClient'
import {
  ALL_FILTER_VALUES,
  FORM_TYPE_ENUM,
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
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { NAV_HEIGHT, theme } from '~/styles'

import { buildChargeFilterAddFilterButtonId, ChargeFilter } from './ChargeFilter'
import { ChargeOptionsAccordion } from './ChargeOptionsAccordion'
import { ChargeWrapperSwitch } from './ChargeWrapperSwitch'
import { RemoveChargeWarningDialogRef } from './RemoveChargeWarningDialog'
import { LocalChargeInput, PlanFormInput } from './types'

import { ConditionalWrapper } from '../ConditionalWrapper'
import { Item } from '../form/ComboBox/ComboBoxItem'
import { EditInvoiceDisplayNameRef } from '../invoices/EditInvoiceDisplayName'
import { PremiumWarningDialogRef } from '../PremiumWarningDialog'

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
    properties {
      ...GraduatedCharge
      ...GraduatedPercentageCharge
      ...VolumeRanges
      ...PackageCharge
      ...StandardCharge
      ...PercentageCharge
      ...CustomCharge
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
`

export const mapChargeIntervalCopy = (interval: string, forceMonthlyCharge: boolean): string => {
  if (forceMonthlyCharge) {
    return 'text_624453d52e945301380e49aa'
  } else if (interval === PlanInterval.Monthly) {
    return 'text_624453d52e945301380e49aa'
  } else if (interval === PlanInterval.Yearly) {
    return 'text_624453d52e945301380e49ac'
  } else if (interval === PlanInterval.Quarterly) {
    return 'text_64d6357b00dea100ad1cb9e9'
  } else if (interval === PlanInterval.Weekly) {
    return 'text_62b32ec6b0434070791c2d4c'
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
    isInitiallyOpen,
    isInSubscriptionForm,
    formikProps,
    id,
    index,
    subscriptionFormType,
  }: ChargeAccordionProps) => {
    const { translate } = useInternationalization()
    const { isPremium } = useCurrentUser()
    const { type: actionType } = useDuplicatePlanVar()
    const chargeErrors = formikProps?.errors?.charges

    const { localCharge, initialLocalCharge, hasDefaultPropertiesErrors, hasErrorInCharges } =
      useMemo(() => {
        return {
          localCharge: formikProps.values.charges[index],
          initialLocalCharge: formikProps.initialValues.charges[index],
          hasDefaultPropertiesErrors:
            typeof chargeErrors === 'object' &&
            typeof chargeErrors[index] === 'object' &&
            // @ts-ignore
            typeof chargeErrors[index].properties === 'object',
          hasErrorInCharges: Boolean(chargeErrors && chargeErrors[index]),
        }
      }, [chargeErrors, formikProps.initialValues.charges, formikProps.values.charges, index])

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

    useEffect(() => {
      const payInAdvance = localCharge.payInAdvance

      if (payInAdvance === true) {
        formikProps.setFieldValue(`charges.${index}.minAmountCents`, undefined)

        if (localCharge.chargeModel === ChargeModelEnum.Graduated) {
          formikProps.setFieldValue(`charges.${index}.prorated`, false)
        }
      } else {
        // Pay in arrears
        formikProps.setFieldValue(`charges.${index}.invoiceable`, true)
      }
    }, [formikProps, index, localCharge.chargeModel, localCharge.payInAdvance])

    const handleUpdate = useCallback(
      (name: string, value: unknown) => {
        if (name === 'chargeModel') {
          // IMPORTANT: This check should stay first in this function
          // If user is not premium and try to switch to graduated percentage pricing
          // We should show the premium modal and prevent any formik value change
          if (!isPremium && value === ChargeModelEnum.GraduatedPercentage) {
            premiumWarningDialogRef?.current?.openDialog()
            return
          }

          // Reset pay in advance when switching charge model
          if (
            (value === ChargeModelEnum.Graduated && localCharge.payInAdvance) ||
            value === ChargeModelEnum.Volume ||
            localCharge.billableMetric.aggregationType === AggregationTypeEnum.MaxAgg ||
            localCharge.billableMetric.aggregationType === AggregationTypeEnum.LatestAgg ||
            localCharge.billableMetric.aggregationType === AggregationTypeEnum.WeightedSumAgg
          ) {
            formikProps.setFieldValue(`charges.${index}.payInAdvance`, false)
          }

          // Reset prorated when switching charge model
          if (
            (localCharge.billableMetric.recurring && value === ChargeModelEnum.Graduated) ||
            localCharge.billableMetric.aggregationType === AggregationTypeEnum.WeightedSumAgg ||
            value === ChargeModelEnum.GraduatedPercentage ||
            value === ChargeModelEnum.Package ||
            value === ChargeModelEnum.Percentage
          ) {
            formikProps.setFieldValue(`charges.${index}.prorated`, false)
          }
        }

        formikProps.setFieldValue(`charges.${index}.${name}`, value)
      },

      [
        formikProps,
        index,
        isPremium,
        localCharge.billableMetric.aggregationType,
        localCharge.billableMetric.recurring,
        localCharge.payInAdvance,
        premiumWarningDialogRef,
      ],
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
            minimumFractionDigits: 2,
            style: 'percent',
          })})`,
          labelNode: (
            <Item>
              {name}&nbsp;
              <Typography color="textPrimary">
                (
                {intlFormatNumber(Number(rate) / 100 || 0, {
                  minimumFractionDigits: 2,
                  style: 'percent',
                })}
                )
              </Typography>
            </Item>
          ),
          value: taxId,
          disabled: chargeTaxesIds.includes(taxId),
        }
      })
    }, [localCharge.taxes, taxesCollection])

    const isProratedOptionDisabled = useMemo(() => {
      return (
        (localCharge.payInAdvance && localCharge.chargeModel === ChargeModelEnum.Graduated) ||
        localCharge.chargeModel === ChargeModelEnum.GraduatedPercentage ||
        localCharge.chargeModel === ChargeModelEnum.Package ||
        localCharge.chargeModel === ChargeModelEnum.Percentage ||
        localCharge.billableMetric.aggregationType === AggregationTypeEnum.WeightedSumAgg
      )
    }, [
      localCharge.billableMetric.aggregationType,
      localCharge.chargeModel,
      localCharge.payInAdvance,
    ])

    const proratedOptionHelperText = useMemo(() => {
      if (isProratedOptionDisabled)
        return translate('text_649c54823c9089006247625a', { chargeModel: localCharge.chargeModel })

      return translate('text_649c54823c90890062476259')
    }, [isProratedOptionDisabled, translate, localCharge.chargeModel])

    return (
      <Accordion
        noContentMargin
        id={id}
        initiallyOpen={isInitiallyOpen || !formikProps.values.charges?.[index]?.id ? true : false}
        summary={
          <Summary>
            <ChargeSummaryLeftWrapper>
              <SummaryLeft>
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
                          formikProps.setFieldValue(
                            `charges.${index}.invoiceDisplayName`,
                            invoiceDisplayName,
                          )
                        },
                      })
                    }}
                  />
                </Tooltip>
              </SummaryLeft>
              <Typography variant="caption" noWrap>
                {localCharge?.billableMetric?.code}
              </Typography>
            </ChargeSummaryLeftWrapper>
            <SummaryRight>
              <Tooltip
                placement="top-end"
                title={
                  hasErrorInCharges
                    ? translate('text_635b975ecea4296eb76924b7')
                    : translate('text_635b975ecea4296eb76924b1')
                }
              >
                <ValidationIcon
                  name="validate-filled"
                  color={hasErrorInCharges ? 'disabled' : 'success'}
                />
              </Tooltip>

              {!!taxValueForBadgeDisplay && (
                <Chip
                  label={intlFormatNumber(Number(taxValueForBadgeDisplay) / 100 || 0, {
                    minimumFractionDigits: 2,
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
                        formikProps.setFieldValue('charges', charges)
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
            </SummaryRight>
          </Summary>
        }
        data-test={`charge-accordion-${index}`}
      >
        <>
          {/* Charge main infos */}
          <ChargeModelWrapper data-test="charge-model-wrapper">
            {!!shouldDisplayAlreadyUsedChargeAlert && (
              <ChargeModelWrapperAlert type="warning">
                {translate('text_6435895831d323008a47911f')}
              </ChargeModelWrapperAlert>
            )}
            <ComboBox
              disableClearable
              sortValues={false}
              name="chargeModel"
              disabled={isInSubscriptionForm || disabled}
              label={
                <InlineComboboxLabel>
                  <Typography variant="captionHl" color="textSecondary">
                    {translate('text_65201b8216455901fe273dd5')}
                  </Typography>
                </InlineComboboxLabel>
              }
              data={[
                {
                  label: translate('text_62793bbb599f1c01522e919f'),
                  value: ChargeModelEnum.Graduated,
                },
                ...(!localCharge.billableMetric.recurring
                  ? [
                      ...(localCharge.billableMetric.aggregationType !==
                      AggregationTypeEnum.LatestAgg
                        ? [
                            {
                              labelNode: (
                                <InlineComboboxLabelForPremiumWrapper>
                                  <InlineComboboxLabel>
                                    <Typography variant="body" color="grey700">
                                      {translate('text_64de472463e2da6b31737db0')}
                                    </Typography>
                                  </InlineComboboxLabel>
                                  {!isPremium && <Icon name="sparkles" />}
                                </InlineComboboxLabelForPremiumWrapper>
                              ),
                              label: translate('text_64de472463e2da6b31737db0'),
                              value: ChargeModelEnum.GraduatedPercentage,
                            },
                          ]
                        : []),
                      {
                        label: translate('text_6282085b4f283b0102655868'),
                        value: ChargeModelEnum.Package,
                      },

                      ...(localCharge.billableMetric.aggregationType !==
                      AggregationTypeEnum.LatestAgg
                        ? [
                            {
                              label: translate('text_62a0b7107afa2700a65ef6e2'),
                              value: ChargeModelEnum.Percentage,
                            },
                          ]
                        : []),
                    ]
                  : []),
                {
                  label: translate('text_624aa732d6af4e0103d40e6f'),
                  value: ChargeModelEnum.Standard,
                },
                {
                  label: translate('text_6304e74aab6dbc18d615f386'),
                  value: ChargeModelEnum.Volume,
                },
                ...(localCharge.billableMetric.aggregationType === AggregationTypeEnum.CustomAgg
                  ? [
                      {
                        label: translate('text_663dea5702b60301d8d064fa'),
                        value: ChargeModelEnum.Custom,
                      },
                    ]
                  : []),
              ]
                // Sort the combobox values by label
                .sort((a, b) => translate(a.label).localeCompare(translate(b.label)))}
              value={localCharge.chargeModel}
              helperText={translate(
                localCharge.chargeModel === ChargeModelEnum.Percentage
                  ? 'text_62ff5d01a306e274d4ffcc06'
                  : localCharge.chargeModel === ChargeModelEnum.Graduated
                    ? 'text_62793bbb599f1c01522e91a1'
                    : localCharge.chargeModel === ChargeModelEnum.GraduatedPercentage
                      ? 'text_64de472463e2da6b31737db8'
                      : localCharge.chargeModel === ChargeModelEnum.Package
                        ? 'text_6282085b4f283b010265586c'
                        : localCharge.chargeModel === ChargeModelEnum.Volume
                          ? 'text_6304e74aab6dbc18d615f38a'
                          : localCharge.chargeModel === ChargeModelEnum.Custom
                            ? 'text_663dea5702b60301d8d064fe'
                            : 'text_624d9adba93343010cd14ca7',
              )}
              onChange={(value) => handleUpdate('chargeModel', value)}
            />
          </ChargeModelWrapper>

          {(!!localCharge.properties || !!localCharge?.filters?.length) && (
            <>
              <AllChargesWrapper $canHaveFilters={!!localCharge?.billableMetric?.filters?.length}>
                {/* Simple charge or default property for groups */}
                {!!localCharge.properties && (
                  <ConditionalWrapper
                    condition={!!localCharge?.billableMetric?.filters?.length}
                    invalidWrapper={(children) => (
                      <div data-test="default-charge-accordion-without-filters">{children}</div>
                    )}
                    validWrapper={(children) => (
                      <Accordion
                        noContentMargin
                        className={buildChargeDefaultPropertyId(index)}
                        summary={
                          <BoxHeader>
                            <BoxHeaderGroupLeft>
                              <div>
                                <Typography noWrap variant="bodyHl" color="grey700">
                                  {translate('text_64e620bca31226337ffc62ad')}
                                </Typography>
                                <Typography noWrap variant="caption" color="grey600">
                                  {translate('text_65f847a944603a01034f5830')}
                                </Typography>
                              </div>
                            </BoxHeaderGroupLeft>
                            <BoxHeaderGroupRight>
                              <Tooltip
                                placement="top-end"
                                title={
                                  hasDefaultPropertiesErrors
                                    ? translate('text_635b975ecea4296eb76924b7')
                                    : translate('text_635b975ecea4296eb76924b1')
                                }
                              >
                                <ValidationIcon
                                  name="validate-filled"
                                  color={hasDefaultPropertiesErrors ? 'disabled' : 'success'}
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

                                    // Remove the default charge
                                    handleUpdate('properties', undefined)
                                  }}
                                />
                              </Tooltip>
                            </BoxHeaderGroupRight>
                          </BoxHeader>
                        }
                        data-test={buildChargeDefaultPropertyId(index)}
                      >
                        {children}
                      </Accordion>
                    )}
                  >
                    <ChargeWrapperSwitch
                      currency={currency}
                      formikProps={formikProps}
                      chargeIndex={index}
                      propertyCursor="properties"
                      premiumWarningDialogRef={premiumWarningDialogRef}
                      valuePointer={localCharge?.properties}
                      initialValuePointer={initialLocalCharge?.properties}
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
                          <BoxHeader>
                            <BoxHeaderGroupLeft>
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
                                        formikProps.setFieldValue(
                                          `charges.${index}.filters.${filterIndex}.invoiceDisplayName`,
                                          invoiceDisplayName,
                                        )
                                      },
                                    })
                                  }}
                                />
                              </Tooltip>
                            </BoxHeaderGroupLeft>
                            <BoxHeaderGroupRight>
                              <Tooltip
                                placement="top-end"
                                title={
                                  hasFilterErrors
                                    ? translate('text_635b975ecea4296eb76924b7')
                                    : translate('text_635b975ecea4296eb76924b1')
                                }
                              >
                                <ValidationIcon
                                  name="validate-filled"
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
                            </BoxHeaderGroupRight>
                          </BoxHeader>
                        }
                        data-test={`filter-charge-accordion-${filterIndex}`}
                      >
                        <ChargeWithFiltersWrapper>
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
                                ...(localCharge.filters || [])?.[filterIndex].values,
                              ]

                              newValuesArray.splice(valueIndex, 1)

                              formikProps.setFieldValue(
                                `charges.${index}.filters.${filterIndex}.values`,
                                newValuesArray,
                              )
                            }}
                          />

                          <ChargeWrapperSwitch
                            currency={currency}
                            formikProps={formikProps}
                            chargeIndex={index}
                            filterIndex={filterIndex}
                            propertyCursor={`filters.${filterIndex}.properties`}
                            premiumWarningDialogRef={premiumWarningDialogRef}
                            valuePointer={filter.properties}
                            initialValuePointer={initialLocalCharge?.properties}
                          />
                        </ChargeWithFiltersWrapper>
                      </Accordion>
                    )
                  })}
              </AllChargesWrapper>
            </>
          )}

          {!!localCharge?.billableMetric?.filters?.length && (
            <ButtonWrapper>
              {!!localCharge.billableMetric.filters?.length && (
                <Button
                  variant="quaternary"
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
                  variant="quaternary"
                  startIcon="plus"
                  onClick={() => {
                    formikProps.setFieldValue(`charges.${index}.properties`, getPropertyShape({}))

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
            </ButtonWrapper>
          )}

          {/* Charge options */}
          <ChargeOptionsAccordion charge={localCharge} currency={currency}>
            <RadioGroup
              name={`charges.${index}.payInAdvance`}
              label={translate('text_6661fc17337de3591e29e3f9')}
              description={translate('text_6661fc17337de3591e29e435')}
              formikProps={formikProps}
              disabled={isInSubscriptionForm || disabled}
              optionLabelVariant="body"
              options={[
                {
                  label: translate('text_6661fc17337de3591e29e3fd'),
                  value: false,
                },
                {
                  label: translate('text_6661fc17337de3591e29e3ff'),
                  value: true,
                  disabled:
                    localCharge.chargeModel === ChargeModelEnum.Volume ||
                    localCharge.billableMetric.aggregationType === AggregationTypeEnum.MaxAgg ||
                    localCharge.billableMetric.aggregationType === AggregationTypeEnum.LatestAgg ||
                    localCharge.billableMetric.aggregationType ===
                      AggregationTypeEnum.WeightedSumAgg,
                },
              ]}
            />

            {!!localCharge.billableMetric.recurring && (
              <Switch
                name={`charge-${localCharge.id}-prorated`}
                label={translate('text_649c54823c90890062476255')}
                disabled={isInSubscriptionForm || disabled || isProratedOptionDisabled}
                subLabel={proratedOptionHelperText}
                checked={!!localCharge.prorated}
                onChange={(value) => handleUpdate('prorated', Boolean(value))}
              />
            )}
            {localCharge.payInAdvance && (
              <InvoiceableSwitchWrapper>
                <Switch
                  name={`charge-${localCharge.id}-invoiceable`}
                  label={translate('text_646e2d0cc536351b62ba6f25')}
                  disabled={isInSubscriptionForm || disabled}
                  subLabel={translate('text_646e2d0cc536351b62ba6f35')}
                  checked={!!localCharge.invoiceable}
                  onChange={(value) => {
                    if (isPremium) {
                      handleUpdate('invoiceable', value)
                    } else {
                      premiumWarningDialogRef?.current?.openDialog()
                    }
                  }}
                />
                {!isPremium && <Icon name="sparkles" />}
              </InvoiceableSwitchWrapper>
            )}

            {!localCharge.payInAdvance && (
              <Group>
                <GroupTitle>
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
                </GroupTitle>
                {!showSpendingMinimum ? (
                  <Button
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
                  <SpendingMinimumWrapper>
                    <SpendingMinimumInput
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
                          formikProps.setFieldValue(`charges.${index}.minAmountCents`, null)
                          setShowSpendingMinimum(false)
                        }}
                      />
                    </Tooltip>
                  </SpendingMinimumWrapper>
                )}
              </Group>
            )}

            <Group>
              <GroupTitle>
                <Typography variant="captionHl" color="textSecondary">
                  {translate('text_6661fc17337de3591e29e3e1')}
                </Typography>
                <Typography variant="caption">
                  {translate('text_6662c316125d2400f7995ff6')}
                </Typography>
              </GroupTitle>
              {!!localCharge?.taxes?.length && (
                <InlineTaxesWrapper>
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

                        formikProps.setFieldValue(`charges.${index}.taxes`, newTaxedArray)
                      }}
                    />
                  ))}
                </InlineTaxesWrapper>
              )}

              {!shouldDisplayTaxesInput ? (
                <Button
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
                <InlineTaxInputWrapper>
                  <ComboBox
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
                </InlineTaxInputWrapper>
              )}
            </Group>
          </ChargeOptionsAccordion>
        </>
      </Accordion>
    )
  },
)

ChargeAccordion.displayName = 'ChargeAccordion'

const ChargeModelWrapper = styled.div`
  padding: ${theme.spacing(4)} ${theme.spacing(4)} 0 ${theme.spacing(4)};
`

const ChargeModelWrapperAlert = styled(Alert)`
  margin-bottom: ${theme.spacing(4)};
`

const ValidationIcon = styled(Icon)`
  display: flex;
  align-items: center;
`

const SummaryLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(2)};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  /* Padding added to prevent overflow hidden to crop the focus ring */
  box-sizing: border-box;
  padding: ${theme.spacing(1)} ${theme.spacing(1)} ${theme.spacing(1)} 0;
`

const SummaryRight = styled.div`
  display: flex;
  align-items: center;
  /* Padding added to prevent overflow hidden to crop the focus ring */
  box-sizing: border-box;
  padding: ${theme.spacing(1)} ${theme.spacing(1)} ${theme.spacing(1)} 0;

  > *:not(:last-child) {
    margin-right: ${theme.spacing(3)};
  }
`

const SpendingMinimumWrapper = styled.div`
  display: flex;
  gap: ${theme.spacing(3)};
`

const SpendingMinimumInput = styled(AmountInput)`
  flex: 1;
`

const InvoiceableSwitchWrapper = styled.div`
  display: flex;
  align-items: center;

  > *:first-child {
    flex: 1;
  }
`

const InlineTaxInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};

  > *:first-child {
    flex: 1;
  }
`

const InlineTaxesWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};
  flex-wrap: wrap;
`

const InlineComboboxLabelForPremiumWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const InlineComboboxLabel = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(2)};
`

const Summary = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${theme.spacing(3)};
  overflow: hidden;
`

const AllChargesWrapper = styled.div<{ $canHaveFilters?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(4)};
  margin-top: ${({ $canHaveFilters }) => ($canHaveFilters ? theme.spacing(6) : 0)};
  padding: ${({ $canHaveFilters }) => ($canHaveFilters ? `0 ${theme.spacing(4)}` : 0)};
`

const ChargeSummaryLeftWrapper = styled.div`
  display: flex;
  flex-direction: column;
`

const ButtonWrapper = styled.div`
  padding: 0 ${theme.spacing(4)};
  margin: ${theme.spacing(6)} 0 ${theme.spacing(4)};
`

const BoxHeader = styled.div`
  /* Used to prevent long invoice display name to overflow */
  overflow: hidden;
  width: 100%;
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing(3)};
`

const BoxHeaderGroupLeft = styled.div`
  /* Used to prevent long invoice display name to overflow */
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};
  /* Padding added to prevent overflow hidden to crop the focus ring */
  box-sizing: border-box;
  padding: ${theme.spacing(1)} ${theme.spacing(1)} ${theme.spacing(1)} 0;
`

const BoxHeaderGroupRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};

  /* Padding added to prevent overflow hidden to crop the focus ring */
  box-sizing: border-box;
  padding: ${theme.spacing(1)} ${theme.spacing(1)} ${theme.spacing(1)} 0;
`

const ChargeWithFiltersWrapper = styled.div`
  > *:not(:last-child) {
    border-bottom: 1px solid ${theme.palette.grey[300]};
  }
`

const Group = styled.div`
  > div:not(:last-child) {
    margin-bottom: ${theme.spacing(4)};
  }
`

const GroupTitle = styled.div`
  > div:not(:last-child) {
    margin-bottom: ${theme.spacing(1)};
  }
`
