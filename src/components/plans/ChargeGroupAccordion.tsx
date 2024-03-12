import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { FormikProps } from 'formik'
import { memo, MouseEvent, RefObject, useCallback, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'

import { Accordion, Button, Chip, Icon, Tooltip, Typography } from '~/components/designSystem'
import { AmountInput, ButtonSelector, ComboBox, Switch } from '~/components/form'
import { useDuplicatePlanVar } from '~/core/apolloClient'
import {
  FORM_TYPE_ENUM,
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_GROUP_CHARGE_INPUT_CLASSNAME,
} from '~/core/constants/form'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import getPropertyShape from '~/core/serializers/getPropertyShape'
import {
  ChargeGroupChildAccordionFragmentDoc,
  ChargeModelEnum,
  CurrencyEnum,
  PlanInterval,
  useGetMeteredBillableMetricsLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { theme } from '~/styles'

import { ChargeGroupChildAccordion } from './ChargeGroupChildAccordion'
import { ChargeGroupOptionsAccordion } from './ChargeGroupOptionsAccordion'
import { PackageGroupCharge } from './PackageGroupCharge'
import { RemoveChargeWarningDialogRef } from './RemoveChargeWarningDialog'
import { LocalChargeInput, PlanFormInput } from './types'

import { Item } from '../form/ComboBox/ComboBoxItem'
import { EditInvoiceDisplayNameRef } from '../invoices/EditInvoiceDisplayName'
import { PremiumWarningDialogRef } from '../PremiumWarningDialog'

const RESULT_LIMIT = 50

gql`
  fragment ChargeGroupAccordion on ChargeGroup {
    id
    invoiceDisplayName
    invoiceable
    minAmountCents
    payInAdvance
    properties {
      amount
    }
    charges {
      ...ChargeGroupChildAccordion
    }
  }

  ${ChargeGroupChildAccordionFragmentDoc}
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

interface ChargeGroupAccordionProps {
  currency: CurrencyEnum
  disabled?: boolean
  isInitiallyOpen?: boolean
  isInSubscriptionForm?: boolean
  formikProps: FormikProps<PlanFormInput>
  idProps: string
  index: number
  isUsedInSubscription?: boolean
  premiumWarningDialogRef?: RefObject<PremiumWarningDialogRef>
  editInvoiceDisplayNameRef: RefObject<EditInvoiceDisplayNameRef>
  removeChargeWarningDialogRef?: RefObject<RemoveChargeWarningDialogRef>
  subscriptionFormType?: keyof typeof FORM_TYPE_ENUM
}

const getNewChargeId = (id: string, index: number) => `plan-charge-${id}-${index}`

export const ChargeGroupAccordion = memo(
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
    idProps,
    index,
    subscriptionFormType,
  }: ChargeGroupAccordionProps) => {
    const { translate } = useInternationalization()
    const { isPremium } = useCurrentUser()
    const { type: actionType } = useDuplicatePlanVar()
    const chargeErrors = formikProps?.errors?.charges
    const [showAddGroupCharge, setShowAddGroupCharge] = useState(false)

    const [
      getMeteredBillableMetrics,
      { loading: meteredBillableMetricsLoading, data: meteredBillableMetricsData },
    ] = useGetMeteredBillableMetricsLazyQuery({
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
      variables: { limit: RESULT_LIMIT },
    })
    const meteredBillableMetrics = useMemo(() => {
      if (
        !meteredBillableMetricsData ||
        !meteredBillableMetricsData?.billableMetrics ||
        !meteredBillableMetricsData?.billableMetrics?.collection
      )
        return []

      return meteredBillableMetricsData?.billableMetrics?.collection.map(({ id, name, code }) => {
        return {
          label: `${name} (${code})`,
          labelNode: (
            <Item>
              <Typography color="grey700" noWrap>
                {name}
              </Typography>
              &nbsp;
              <Typography color="textPrimary" noWrap>
                ({code})
              </Typography>
            </Item>
          ),
          value: id,
        }
      })
    }, [meteredBillableMetricsData])

    const { groupId, localChargeGroup, initialLocalCharge, hasErrorInCharges } = useMemo(() => {
      return {
        groupId: idProps,
        localChargeGroup: formikProps.values.chargeGroups[index],
        initialLocalCharge: formikProps.initialValues.charges[index],
        hasDefaultPropertiesErrors:
          typeof chargeErrors === 'object' &&
          typeof chargeErrors[index] === 'object' &&
          // @ts-ignore
          typeof chargeErrors[index].properties === 'object',
        hasErrorInCharges: Boolean(chargeErrors && chargeErrors[index]),
      }
    }, [
      chargeErrors,
      formikProps.initialValues.charges,
      formikProps.values.chargeGroups,
      idProps,
      index,
    ])

    const [showSpendingMinimum, setShowSpendingMinimum] = useState(
      !!initialLocalCharge?.minAmountCents && Number(initialLocalCharge?.minAmountCents) > 0,
    )

    useEffect(() => {
      setShowSpendingMinimum(
        !!initialLocalCharge?.minAmountCents && Number(initialLocalCharge?.minAmountCents) > 0,
      )
    }, [initialLocalCharge?.minAmountCents])

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
        }

        if (name === 'payInAdvance') {
          if (value === true) {
            // Pay in advance
            formikProps.setFieldValue(`charges.${index}.minAmountCents`, undefined)
          } else {
            // Pay in arrears
            formikProps.setFieldValue(`charges.${index}.invoiceable`, true)
          }
        }

        formikProps.setFieldValue(`charges.${index}.${name}`, value)
      },

      [formikProps, index, isPremium, premiumWarningDialogRef],
    )

    const chargePayInAdvanceSwitchHelperText = useMemo(() => {
      if (localChargeGroup.payInAdvance) {
        return translate('text_646e2d0cc536351b62ba6f12')
      }

      // Charge paid in arrears
      return translate('text_646e2d0cc536351b62ba6f53')
    }, [localChargeGroup.payInAdvance, translate])

    return (
      <Accordion
        noContentMargin
        id={idProps}
        initiallyOpen={
          isInitiallyOpen || !formikProps.values.chargeGroups?.[index]?.id ? true : false
        }
        summary={
          <Summary>
            <ChargeSummaryLeftWrapper>
              <SummaryLeft>
                <Typography variant="bodyHl" color="textSecondary" noWrap>
                  {localChargeGroup?.invoiceDisplayName ||
                    'Group of ' +
                      (formikProps.values.charges.find(
                        (c) => c.chargeGroupId === localChargeGroup.id,
                      )?.billableMetric.name || 'charges')}
                </Typography>
                <Tooltip title={translate('text_65018c8e5c6b626f030bcf8d')} placement="top-end">
                  <Button
                    icon="pen"
                    variant="quaternary"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()

                      editInvoiceDisplayNameRef.current?.openDialog({
                        invoiceDisplayName: localChargeGroup.invoiceDisplayName,
                        callback: (invoiceDisplayName: string) => {
                          formikProps.setFieldValue(
                            `chargeGroups.${index}.invoiceDisplayName`,
                            invoiceDisplayName,
                          )
                        },
                      })
                    }}
                  />
                </Tooltip>
              </SummaryLeft>
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

                      const deleteChargeGroup = () => {
                        const chargeGroups = [...formikProps.values.chargeGroups]
                        const removedChargeGroup = chargeGroups.splice(index, 1)[0]
                        const updatedCharges = formikProps.values.charges.filter(
                          (charge) => charge.chargeGroupId !== removedChargeGroup.id,
                        )

                        formikProps.setFieldValue('chargeGroups', chargeGroups)
                        formikProps.setFieldValue('charges', updatedCharges)
                      }

                      if (actionType !== 'duplicate' && isUsedInSubscription) {
                        removeChargeWarningDialogRef?.current?.openDialog(index)
                      } else {
                        deleteChargeGroup()
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
        {/* Charge group amount input */}
        <PaddedChargesWrapper>
          <PackageGroupCharge
            chargeGroupIndex={index}
            currency={currency}
            disabled={disabled}
            formikProps={formikProps}
            propertyCursor="properties"
            valuePointer={localChargeGroup.properties}
          />
        </PaddedChargesWrapper>

        <PaddedChargesWrapper>
          <Charges>
            {formikProps.values.charges.map((charge, i) => {
              // Prevent displaying charges from different charge groups
              if (!charge.chargeGroupId || charge.chargeGroupId !== groupId) return

              const chargeId = getNewChargeId(charge.billableMetric.id, i)

              return (
                <ChargeGroupChildAccordion
                  id={chargeId}
                  key={chargeId}
                  isInitiallyOpen={!isInitiallyOpen}
                  isInSubscriptionForm={isInSubscriptionForm}
                  subscriptionFormType={subscriptionFormType}
                  removeChargeWarningDialogRef={removeChargeWarningDialogRef}
                  premiumWarningDialogRef={premiumWarningDialogRef}
                  editInvoiceDisplayNameRef={editInvoiceDisplayNameRef}
                  isUsedInSubscription={false}
                  currency={formikProps.values.amountCurrency || CurrencyEnum.Usd}
                  index={i}
                  disabled={false}
                  formikProps={formikProps}
                />
              )
            })}
          </Charges>

          {/* Add a child charge button */}
          {!!showAddGroupCharge && (
            <AddChargeInlineWrapper>
              <ComboBox
                className={SEARCH_GROUP_CHARGE_INPUT_CLASSNAME}
                data={meteredBillableMetrics}
                searchQuery={getMeteredBillableMetrics}
                loading={meteredBillableMetricsLoading}
                placeholder={translate('text_6435888d7cc86500646d8981')}
                emptyText={translate('text_6246b6bc6b25f500b779aa7a')}
                onChange={(newCharge) => {
                  const previousCharges = [...formikProps.values.charges]
                  // const newId = getNewChargeId(newCharge, previousCharges.length)
                  const localBillableMetrics =
                    meteredBillableMetricsData?.billableMetrics?.collection.find(
                      (bm) => bm.id === newCharge,
                    )
                  const lastMeteredIndex = previousCharges.findLastIndex(
                    (c) => c.billableMetric.recurring === false,
                  )
                  const newChargeIndex = lastMeteredIndex < 0 ? 0 : lastMeteredIndex + 1

                  previousCharges.splice(newChargeIndex, 0, {
                    payInAdvance: true,
                    invoiceable: true,
                    billableMetric: localBillableMetrics,
                    properties: getPropertyShape({}),
                    groupProperties: localBillableMetrics?.flatGroups?.length ? [] : undefined,
                    chargeModel: ChargeModelEnum.PackageGroup,
                    amountCents: undefined,
                    chargeGroupId: groupId,
                  } as LocalChargeInput)

                  formikProps.setFieldValue('charges', previousCharges)

                  setShowAddGroupCharge(false)
                  // newChargeId.current = newId
                }}
              />
              <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
                <Button
                  icon="trash"
                  variant="quaternary"
                  onClick={() => {
                    setShowAddGroupCharge(false)
                  }}
                />
              </Tooltip>
            </AddChargeInlineWrapper>
          )}
          {!isInSubscriptionForm && (
            <InlineButtons>
              <Button
                startIcon="plus"
                variant="quaternary"
                data-test="add-group-charge-item"
                onClick={() => {
                  setShowAddGroupCharge(true)
                  setTimeout(() => {
                    ;(
                      document.querySelector(
                        `.${SEARCH_GROUP_CHARGE_INPUT_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
                      ) as HTMLElement
                    )?.click()
                  }, 0)
                }}
              >
                {translate('Add a charge item')}
              </Button>
            </InlineButtons>
          )}
        </PaddedChargesWrapper>

        {/* Charge options */}
        <ChargeGroupOptionsAccordion chargeGroup={localChargeGroup} currency={currency}>
          <ButtonSelector
            label={translate('text_646e2d0cc536351b62ba6f1a')}
            disabled={isInSubscriptionForm || disabled}
            helperText={chargePayInAdvanceSwitchHelperText}
            onChange={(value) => handleUpdate('payInAdvance', Boolean(value))}
            value={localChargeGroup?.payInAdvance || true}
            options={[
              // NOTE: For now, charge group is pay in advance by default
              {
                label: translate('text_646e2d0cc536351b62ba6f2b'),
                value: false,
                disabled: true,
              },
              {
                label: translate('text_646e2d0cc536351b62ba6f3d'),
                value: true,
                disabled: true,
              },
            ]}
          />

          {localChargeGroup?.payInAdvance && (
            <InvoiceableSwitchWrapper>
              <Switch
                name={`charge-${localChargeGroup?.id}-invoiceable`}
                label={translate('text_646e2d0cc536351b62ba6f25')}
                disabled={isInSubscriptionForm || disabled}
                subLabel={translate('text_646e2d0cc536351b62ba6f35')}
                checked={!!localChargeGroup?.invoiceable}
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
          {!localChargeGroup?.payInAdvance && !!showSpendingMinimum && (
            <SpendingMinimumWrapper>
              <>
                <SpendingMinimumInput
                  id={`spending-minimum-input-${index}`}
                  beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
                  label={translate('text_643e592657fc1ba5ce110c30')}
                  currency={currency}
                  placeholder={translate('text_643e592657fc1ba5ce110c80')}
                  disabled={subscriptionFormType === FORM_TYPE_ENUM.edition || disabled}
                  value={localChargeGroup.minAmountCents}
                  onChange={(value) => handleUpdate('minAmountCents', value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">{getCurrencySymbol(currency)}</InputAdornment>
                    ),
                  }}
                />
                <CloseDescriptionTooltip
                  placement="top-end"
                  title={translate('text_63aa085d28b8510cd46443ff')}
                >
                  <Button
                    icon="trash"
                    variant="quaternary"
                    disabled={disabled}
                    onClick={() => {
                      formikProps.setFieldValue(`charges.${index}.minAmountCents`, null)
                      setShowSpendingMinimum(false)
                    }}
                  />
                </CloseDescriptionTooltip>
              </>
            </SpendingMinimumWrapper>
          )}

          <InlineButtonsWrapper>
            {!localChargeGroup.payInAdvance && !showSpendingMinimum && (
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
            )}
          </InlineButtonsWrapper>
        </ChargeGroupOptionsAccordion>
      </Accordion>
    )
  },
)

ChargeGroupAccordion.displayName = 'ChargeGroupAccordion'

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

const SpendingMinimumWrapper = styled.div`
  display: flex;
`

const SpendingMinimumInput = styled(AmountInput)`
  flex: 1;
  margin-right: ${theme.spacing(3)};
`

const CloseDescriptionTooltip = styled(Tooltip)`
  margin-top: ${theme.spacing(7)};
`

const InvoiceableSwitchWrapper = styled.div`
  display: flex;
  align-items: center;

  > *:first-child {
    flex: 1;
  }
`

const InlineButtonsWrapper = styled.div`
  display: flex;
`

const Summary = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${theme.spacing(3)};
  overflow: hidden;
`

const ChargeSummaryLeftWrapper = styled.div`
  display: flex;
  flex-direction: column;
`

const Charges = styled.div`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

const PaddedChargesWrapper = styled.div`
  margin-top: ${theme.spacing(4)};
  padding: 0 ${theme.spacing(4)} ${theme.spacing(4)};
  box-sizing: border-box;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(4)};
`

const InlineButtons = styled.div`
  display: flex;
`

const AddChargeInlineWrapper = styled.div`
  > :first-child {
    flex: 1;
    margin-right: ${theme.spacing(3)};
  }

  display: flex;
  align-items: center;
`
