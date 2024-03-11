import { gql } from '@apollo/client'
import { FormikProps } from 'formik'
import { memo, MouseEvent, RefObject, useCallback, useMemo, useState } from 'react'
import styled from 'styled-components'

import { Accordion, Button, Icon, Tooltip, Typography } from '~/components/designSystem'
import { ComboBox } from '~/components/form'
import { useDuplicatePlanVar } from '~/core/apolloClient'
import {
  FORM_TYPE_ENUM,
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_CHARGE_GROUP_INPUT_CLASSNAME,
} from '~/core/constants/form'
import getPropertyShape from '~/core/serializers/getPropertyShape'
import {
  AggregationTypeEnum,
  ChargeForChargeGroupOptionsAccordionFragmentDoc,
  ChargeModelEnum,
  CurrencyEnum,
  PackageGroupChargeFragmentDoc,
  PlanInterval,
  TimebasedChargeFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { theme } from '~/styles'

import { ChargeWrapperSwitch } from './ChargeWrapperSwitch'
import { RemoveChargeWarningDialogRef } from './RemoveChargeWarningDialog'
import { PlanFormInput } from './types'

import { ConditionalWrapper } from '../ConditionalWrapper'
import { EditInvoiceDisplayNameRef } from '../invoices/EditInvoiceDisplayName'
import { PremiumWarningDialogRef } from '../PremiumWarningDialog'

const DEFAULT_GROUP_VALUE = 'DEFAULT'

gql`
  fragment ChargeGroupChildAccordion on Charge {
    id
    chargeModel
    invoiceable
    minAmountCents
    payInAdvance
    prorated
    invoiceDisplayName
    properties {
      amount
    }
    groupProperties {
      groupId
      invoiceDisplayName
      values {
        amount
      }
    }
    billableMetric {
      id
      name
      aggregationType
      recurring
      flatGroups {
        id
        key
        value
      }
    }
    taxes {
      ...TaxForPlanChargeAccordion
    }
    ...ChargeForChargeGroupOptionsAccordion
    ...PackageGroupCharge
    ...TimebasedCharge
  }

  ${ChargeForChargeGroupOptionsAccordionFragmentDoc}
  ${PackageGroupChargeFragmentDoc}
  ${TimebasedChargeFragmentDoc}
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
  } else if (interval === PlanInterval.Daily) {
    return 'Daily'
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
}

export const ChargeGroupChildAccordion = memo(
  ({
    currency,
    disabled,
    removeChargeWarningDialogRef,
    premiumWarningDialogRef,
    editInvoiceDisplayNameRef,
    isUsedInSubscription,
    isInitiallyOpen,
    isInSubscriptionForm,
    formikProps,
    id,
    index,
  }: ChargeAccordionProps) => {
    const { translate } = useInternationalization()
    const { isPremium } = useCurrentUser()
    const { type: actionType } = useDuplicatePlanVar()
    const chargeErrors = formikProps?.errors?.charges

    const { localCharge, hasDefaultPropertiesErrors, hasErrorInCharges } = useMemo(() => {
      return {
        localCharge: formikProps.values.charges[index],
        hasDefaultPropertiesErrors:
          typeof chargeErrors === 'object' &&
          typeof chargeErrors[index] === 'object' &&
          // @ts-ignore
          typeof chargeErrors[index].properties === 'object',
        hasErrorInCharges: Boolean(chargeErrors && chargeErrors[index]),
      }
    }, [chargeErrors, formikProps.values.charges, index])

    const localChargeExistingGroupPropertiesIds =
      localCharge?.groupProperties?.map((g) => g.groupId) || []

    const [showAddGroup, setShowAddGroup] = useState(false)

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

        if (name === 'payInAdvance') {
          if (value === true) {
            // Pay in advance
            formikProps.setFieldValue(`charges.${index}.minAmountCents`, undefined)

            if (localCharge.chargeModel === ChargeModelEnum.Graduated) {
              formikProps.setFieldValue(`charges.${index}.prorated`, false)
            }
          } else {
            // Pay in arrears
            formikProps.setFieldValue(`charges.${index}.invoiceable`, true)
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
        localCharge.chargeModel,
        premiumWarningDialogRef,
      ],
    )

    return (
      <Accordion
        noContentMargin
        id={id}
        initiallyOpen={isInitiallyOpen ? true : false}
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
            <ComboBox
              disableClearable
              sortValues={false}
              name="chargeModel"
              disabled={isInSubscriptionForm || disabled}
              label={
                <InlineComboboxLabel>
                  <Typography variant="captionHl" color="textSecondary">
                    {translate('text_624c5eadff7db800acc4ca0d')}
                  </Typography>
                </InlineComboboxLabel>
              }
              data={[
                {
                  label: translate('Package pricing'),
                  value: ChargeModelEnum.PackageGroup,
                },
                {
                  label: 'Time-based pricing',
                  value: ChargeModelEnum.Timebased,
                },
              ]}
              value={localCharge.chargeModel}
              helperText={translate(
                localCharge.chargeModel === ChargeModelEnum.PackageGroup
                  ? 'For example, user is allowed to use 100 units of this package.'
                  : localCharge.chargeModel === ChargeModelEnum.Timebased
                    ? ''
                    : 'text_624d9adba93343010cd14ca7',
              )}
              onChange={(value) => handleUpdate('chargeModel', value)}
            />
          </ChargeModelWrapper>

          <AllChargesWrapper
            $hasGroupDisplay={!!localCharge.billableMetric.flatGroups?.length}
            $hasChargesToDisplay={
              !!localCharge?.properties || !!localCharge?.groupProperties?.length
            }
          >
            {/* Simple charge or default property for groups */}
            {!!localCharge.properties && (
              <ConditionalWrapper
                condition={!!localCharge.billableMetric.flatGroups?.length}
                invalidWrapper={(children) => (
                  <div data-test="default-charge-accordion-without-group">{children}</div>
                )}
                validWrapper={(children) => (
                  <Accordion
                    noContentMargin
                    summary={
                      <Summary>
                        <Title>
                          <Typography variant="bodyHl" color="textSecondary" noWrap>
                            {translate('text_64e620bca31226337ffc62ad')}
                          </Typography>
                          <Typography variant="caption" noWrap>
                            {translate('text_64e620bca31226337ffc62af')}
                          </Typography>
                        </Title>
                        <SummaryRight>
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
                              onClick={() => {
                                // Remove the default charge
                                handleUpdate('properties', undefined)
                              }}
                            />
                          </Tooltip>
                        </SummaryRight>
                      </Summary>
                    }
                    data-test="default-charge-accordion-with-group"
                  >
                    {children}
                  </Accordion>
                )}
              >
                <ChargeWrapperSwitch
                  currency={currency}
                  formikProps={formikProps}
                  index={index}
                  propertyCursor="properties"
                  premiumWarningDialogRef={premiumWarningDialogRef}
                  valuePointer={localCharge.properties}
                  handleUpdate={handleUpdate}
                />
              </ConditionalWrapper>
            )}

            {/* Group properties  */}
            {localCharge?.groupProperties?.map((group, groupPropertyIndex) => {
              const associatedFlagGroup = localCharge?.billableMetric?.flatGroups?.find(
                (flatGroup) => flatGroup.id === group.groupId,
              )

              const groupKey = associatedFlagGroup?.key
              const groupName = associatedFlagGroup?.value
              const hasErrorInGroup =
                typeof chargeErrors === 'object' &&
                typeof chargeErrors[index] === 'object' &&
                // @ts-ignore
                typeof chargeErrors[index].groupProperties === 'object' &&
                // @ts-ignore
                typeof chargeErrors[index].groupProperties[groupPropertyIndex] === 'object' &&
                // @ts-ignore
                !!chargeErrors[index].groupProperties[groupPropertyIndex].values

              return (
                <Accordion
                  key={`charge-${group.groupId}-group-${group.groupId}`}
                  noContentMargin
                  summary={
                    <Summary>
                      <SummaryLeft>
                        <Typography variant="bodyHl" color="grey700">
                          {localCharge?.groupProperties?.[groupPropertyIndex]
                            .invoiceDisplayName || (
                            <>
                              <span>{groupKey && `${groupKey} • `}</span>
                              <span>{groupName}</span>
                            </>
                          )}
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
                                invoiceDisplayName:
                                  localCharge?.groupProperties?.[groupPropertyIndex]
                                    .invoiceDisplayName,
                                callback: (invoiceDisplayName: string) => {
                                  formikProps.setFieldValue(
                                    `charges.${index}.groupProperties.${groupPropertyIndex}.invoiceDisplayName`,
                                    invoiceDisplayName,
                                  )
                                },
                              })
                            }}
                          />
                        </Tooltip>
                      </SummaryLeft>

                      <ChargeGroupAccodionSummaryRight>
                        <Tooltip
                          placement="top-end"
                          title={
                            hasErrorInGroup
                              ? translate('text_635b975ecea4296eb76924b7')
                              : translate('text_635b975ecea4296eb76924b1')
                          }
                        >
                          <ValidationIcon
                            name="validate-filled"
                            color={hasErrorInGroup ? 'disabled' : 'success'}
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
                            onClick={() => {
                              const existingGroupProperties = [
                                ...(localCharge.groupProperties || []),
                              ]

                              existingGroupProperties.splice(groupPropertyIndex, 1)
                              handleUpdate('groupProperties', existingGroupProperties)
                            }}
                          />
                        </Tooltip>
                      </ChargeGroupAccodionSummaryRight>
                    </Summary>
                  }
                  data-test={`group-charge-accordion-${groupPropertyIndex}`}
                >
                  <ChargeWrapperSwitch
                    currency={currency}
                    formikProps={formikProps}
                    index={index}
                    propertyCursor={`groupProperties.${groupPropertyIndex}.values`}
                    premiumWarningDialogRef={premiumWarningDialogRef}
                    valuePointer={
                      localCharge?.groupProperties &&
                      localCharge?.groupProperties[groupPropertyIndex].values
                    }
                    handleUpdate={handleUpdate}
                  />
                </Accordion>
              )
            })}
          </AllChargesWrapper>

          {/* If the charge can have groups */}
          {!!localCharge.billableMetric.flatGroups?.length && (
            <>
              {!!showAddGroup ? (
                <InlineGroupInputWrapper>
                  <ComboBox
                    sortValues={false}
                    className={SEARCH_CHARGE_GROUP_INPUT_CLASSNAME}
                    data={[
                      {
                        label: translate('text_64e620bca31226337ffc62ad'),
                        value: DEFAULT_GROUP_VALUE,
                        disabled: !!localCharge?.properties,
                      },
                      ...localCharge.billableMetric.flatGroups?.map((group) => ({
                        label: `${group.key ? `${group.key} • ` : ''}${group.value}`,
                        value: group.id,
                        disabled: localChargeExistingGroupPropertiesIds.includes(group.id),
                      })),
                    ]}
                    placeholder={translate('text_64e6211f8fcca2366dc69005')}
                    onChange={(newGroupId) => {
                      if (newGroupId === DEFAULT_GROUP_VALUE) {
                        handleUpdate('properties', getPropertyShape({}))
                      } else {
                        const newGroupProperties = [
                          ...(localCharge.groupProperties || []),
                          {
                            groupId: newGroupId,
                            value: getPropertyShape({}),
                          },
                        ]

                        handleUpdate('groupProperties', newGroupProperties)
                      }
                      setShowAddGroup(false)
                    }}
                  />

                  <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
                    <Button
                      icon="trash"
                      variant="quaternary"
                      onClick={() => {
                        setShowAddGroup(false)
                      }}
                    />
                  </Tooltip>
                </InlineGroupInputWrapper>
              ) : (
                <ChargeAddActionsWrapper data-test="charge-with-group-actions-wrapper">
                  <ChargeAddActionsWrapperLeft>
                    <Button
                      startIcon="plus"
                      variant="quaternary"
                      disabled={
                        (localCharge.groupProperties?.length || 0) ===
                          (localCharge.billableMetric.flatGroups?.length || 0) &&
                        !!localCharge.properties
                      }
                      onClick={() => {
                        setShowAddGroup(true)
                        setTimeout(() => {
                          ;(
                            document.querySelector(
                              `.${SEARCH_CHARGE_GROUP_INPUT_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
                            ) as HTMLElement
                          )?.click()
                        }, 0)
                      }}
                      data-test="add-new-group"
                    >
                      {translate('text_64e620bca31226337ffc62b7')}
                    </Button>
                    <Button
                      startIcon="plus"
                      variant="quaternary"
                      disabled={
                        (localCharge.groupProperties?.length || 0) ===
                        (localCharge.billableMetric.flatGroups?.length || 0)
                      }
                      onClick={() => {
                        const newGroupProperties = [
                          ...(localCharge.groupProperties || []),
                          ...(localCharge.billableMetric.flatGroups
                            ?.filter((g) => !localChargeExistingGroupPropertiesIds.includes(g.id))
                            .map((group) => ({
                              groupId: group.id,
                              values: getPropertyShape({}),
                            })) || []),
                        ]

                        handleUpdate('groupProperties', newGroupProperties)
                      }}
                      data-test="add-all-group-cta"
                    >
                      {translate('text_64e620bca31226337ffc62b9')}
                    </Button>
                  </ChargeAddActionsWrapperLeft>
                  {translate('text_64e620bca31226337ffc62bb', {
                    count: localCharge.groupProperties?.length || 0,
                    total: localCharge.billableMetric.flatGroups?.length || 0,
                  })}
                </ChargeAddActionsWrapper>
              )}
            </>
          )}
        </>
      </Accordion>
    )
  },
)

ChargeGroupChildAccordion.displayName = 'ChargeGroupChildAccordion'

const ChargeModelWrapper = styled.div`
  padding: ${theme.spacing(4)} ${theme.spacing(4)} 0 ${theme.spacing(4)};
`

const Title = styled.div`
  display: flex;
  flex-direction: column;
  white-space: pre;
  min-width: 20px;
  margin-right: auto;
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
`

const SummaryRight = styled.div`
  display: flex;
  align-items: center;
  > *:not(:last-child) {
    margin-right: ${theme.spacing(3)};
  }
`

const InlineGroupInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};
  padding: ${theme.spacing(6)} ${theme.spacing(4)} ${theme.spacing(4)};

  > *:first-child {
    flex: 1;
  }
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

const AllChargesWrapper = styled.div<{ $hasGroupDisplay?: boolean; $hasChargesToDisplay: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(4)};
  margin-top: ${({ $hasChargesToDisplay, $hasGroupDisplay }) =>
    $hasChargesToDisplay && $hasGroupDisplay ? theme.spacing(6) : 0};
  margin-bottom: ${theme.spacing(6)};
  padding: ${({ $hasGroupDisplay }) => ($hasGroupDisplay ? `0 ${theme.spacing(4)}` : 0)};
`

const ChargeAddActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${theme.spacing(4)};
  margin-bottom: ${theme.spacing(4)};
`

const ChargeAddActionsWrapperLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};
`

const ChargeGroupAccodionSummaryRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};
`

const ChargeSummaryLeftWrapper = styled.div`
  display: flex;
  flex-direction: column;
`
