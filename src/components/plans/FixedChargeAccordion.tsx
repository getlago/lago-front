import { gql } from '@apollo/client'
import { FormikProps } from 'formik'
import { memo, RefObject, useCallback, useMemo } from 'react'

import { Accordion, Chip, Typography } from '~/components/designSystem'
import { Switch } from '~/components/form'
import { EditInvoiceDisplayNameDialogRef } from '~/components/invoices/EditInvoiceDisplayNameDialog'
import { ChargeModelSelector } from '~/components/plans/chargeAccordion/ChargeModelSelector'
import { EditInvoiceDisplayNameButton } from '~/components/plans/chargeAccordion/EditInvoiceDisplayNameButton'
import { ChargePayInAdvanceOption } from '~/components/plans/chargeAccordion/options/ChargePayInAdvanceOption'
import { FixedChargeOptionsAccordion } from '~/components/plans/chargeAccordion/options/FixedChargeOptionsAccordion'
import { RemoveChargeButton } from '~/components/plans/chargeAccordion/RemoveChargeButton'
import {
  handleUpdateFixedCharges,
  HandleUpdateFixedChargesProps,
} from '~/components/plans/chargeAccordion/utils'
import { ValidationIcon } from '~/components/plans/chargeAccordion/ValidationIcon'
import { mapChargeIntervalCopy } from '~/components/plans/utils'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { TaxesSelectorSection } from '~/components/taxes/TaxesSelectorSection'
import { SEARCH_TAX_INPUT_FOR_CHARGE_CLASSNAME } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  ChargeForFixedChargeOptionsAccordionFragmentDoc,
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

import { ChargeWrapperSwitch } from './chargeAccordion/ChargeWrapperSwitch'
import { RemoveChargeWarningDialogRef } from './RemoveChargeWarningDialog'
import { PlanFormInput } from './types'

gql`
  fragment addOnForFixedChargeAccordion on AddOn {
    id
    name
    code
  }

  fragment FixedChargeAccordion on FixedCharge {
    id
    chargeModel
    invoiceDisplayName
    payInAdvance
    prorated
    units
    addOn {
      ...addOnForFixedChargeAccordion
    }
    properties {
      graduatedRanges {
        ...GraduatedCharge
      }

      volumeRanges {
        ...VolumeRanges
      }
    }
    taxes {
      ...TaxForTaxesSelectorSection
    }

    ...ChargeForFixedChargeOptionsAccordion
  }

  fragment PlanForFixedChargeAccordion on Plan {
    billFixedChargesMonthly
  }

  ${GraduatedChargeFragmentDoc}
  ${GraduatedPercentageChargeFragmentDoc}
  ${VolumeRangesFragmentDoc}
  ${PackageChargeFragmentDoc}
  ${StandardChargeFragmentDoc}
  ${PercentageChargeFragmentDoc}
  ${CustomChargeFragmentDoc}
  ${ChargeForFixedChargeOptionsAccordionFragmentDoc}
  ${PricingGroupKeysFragmentDoc}
  ${TaxForTaxesSelectorSectionFragmentDoc}
`

interface FixedChargeAccordionProps {
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
}

export const FixedChargeAccordion = memo(
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
  }: FixedChargeAccordionProps) => {
    const { translate } = useInternationalization()
    const {
      getFixedChargeModelComboboxData,
      getIsPayInAdvanceOptionDisabledForFixedCharge,
      getIsProRatedOptionDisabledForFixedCharge,
    } = useChargeForm()
    const fixedChargeErrors = formikProps?.errors?.fixedCharges

    const {
      chargeModelComboboxData,
      isPayInAdvanceOptionDisabled,
      isProratedOptionDisabled,
      localCharge,
    } = useMemo(() => {
      const formikCharge = formikProps.values.fixedCharges[index]
      const localChargeModelComboboxData = getFixedChargeModelComboboxData()
      const localIsPayInAdvanceOptionDisabled = getIsPayInAdvanceOptionDisabledForFixedCharge({
        chargeModel: formikCharge.chargeModel,
        isProrated: formikCharge.prorated || false,
      })
      const localIsProratedOptionDisabled = getIsProRatedOptionDisabledForFixedCharge({
        isPayInAdvance: formikCharge.payInAdvance || false,
        chargeModel: formikCharge.chargeModel,
      })

      return {
        chargeModelComboboxData: localChargeModelComboboxData,
        hasDefaultPropertiesErrors:
          typeof fixedChargeErrors === 'object' &&
          typeof fixedChargeErrors[index] === 'object' &&
          typeof fixedChargeErrors[index].properties === 'object',
        initialLocalCharge: formikProps.initialValues.fixedCharges[index],
        isPayInAdvanceOptionDisabled: localIsPayInAdvanceOptionDisabled,
        isProratedOptionDisabled: localIsProratedOptionDisabled,
        localCharge: formikCharge,
      }
    }, [
      fixedChargeErrors,
      formikProps.initialValues.fixedCharges,
      formikProps.values.fixedCharges,
      getFixedChargeModelComboboxData,
      getIsPayInAdvanceOptionDisabledForFixedCharge,
      getIsProRatedOptionDisabledForFixedCharge,
      index,
    ])

    const chargePricingUnitShortName = undefined

    const isAnnual = [PlanInterval.Semiannual, PlanInterval.Yearly].includes(
      formikProps.values.interval,
    )

    const disableProRatedOption = isInSubscriptionForm || disabled || isProratedOptionDisabled

    const isAccordionInitiallyOpen = !!(
      isInitiallyOpen || !formikProps.values.fixedCharges?.[index]?.id
    )

    const handleUpdate = useCallback(
      (
        name: HandleUpdateFixedChargesProps['name'],
        value: HandleUpdateFixedChargesProps['value'],
      ) => {
        handleUpdateFixedCharges({
          setFieldValue: formikProps.setFieldValue,
          index,
          localCharge,
          name,
          value,
        })
      },

      // eslint-disable-next-line react-hooks/exhaustive-deps
      [index, localCharge],
    )

    const taxValueForBadgeDisplay = useMemo((): string | undefined => {
      if (!localCharge?.taxes?.length && !formikProps?.values?.taxes?.length) return

      if (localCharge.taxes?.length)
        return String(localCharge.taxes.reduce((acc, cur) => acc + cur.rate, 0))

      return String(formikProps?.values?.taxes?.reduce((acc, cur) => acc + cur.rate, 0))
    }, [formikProps?.values?.taxes, localCharge.taxes])

    const editInvoiceDisplayNameValue = useCallback(
      (invoiceDisplayName: string) => {
        formikProps.setFieldValue(`fixedCharges.${index}.invoiceDisplayName`, invoiceDisplayName)
      },

      // eslint-disable-next-line react-hooks/exhaustive-deps
      [index],
    )

    const intervalBadgeCopy = useMemo(() => {
      return translate(
        mapChargeIntervalCopy(
          formikProps.values.interval,
          (isAnnual && !!formikProps.values.billFixedChargesMonthly) || false,
        ),
      )
    }, [
      translate,
      formikProps.values.interval,
      formikProps.values.billFixedChargesMonthly,
      isAnnual,
    ])

    return (
      <Accordion
        noContentMargin
        id={id}
        initiallyOpen={isAccordionInitiallyOpen}
        summary={
          <div className="flex w-full items-center justify-between gap-3 overflow-hidden">
            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 truncate p-1 pl-0">
                <Typography variant="bodyHl" color="textSecondary" noWrap>
                  {localCharge.invoiceDisplayName || localCharge?.addOn?.name}
                </Typography>
                <EditInvoiceDisplayNameButton
                  editInvoiceDisplayNameDialogRef={editInvoiceDisplayNameDialogRef}
                  currentInvoiceDisplayName={localCharge.invoiceDisplayName}
                  onEdit={editInvoiceDisplayNameValue}
                />
              </div>
              <Typography variant="caption" noWrap>
                {localCharge?.addOn?.code}
              </Typography>
            </div>
            <div className="flex items-center gap-3 p-1 pl-0">
              <ValidationIcon hasError={Boolean(formikProps?.errors?.fixedCharges?.[index])} />

              {!!taxValueForBadgeDisplay && (
                <Chip
                  label={intlFormatNumber(Number(taxValueForBadgeDisplay) / 100 || 0, {
                    style: 'percent',
                  })}
                />
              )}
              <Chip label={intervalBadgeCopy} />

              <RemoveChargeButton
                isInSubscriptionForm={isInSubscriptionForm}
                isUsedInSubscription={isUsedInSubscription}
                removeChargeWarningDialogRef={removeChargeWarningDialogRef}
                existingCharges={formikProps.values.fixedCharges}
                chargeToRemoveIndex={index}
                onDeleteCharge={(charges) => formikProps.setFieldValue('fixedCharges', charges)}
              />
            </div>
          </div>
        }
        data-test={`fixed-charge-accordion-${index}`}
      >
        <>
          <ChargeModelSelector
            alreadyUsedChargeAlertMessage={alreadyUsedChargeAlertMessage}
            isInSubscriptionForm={isInSubscriptionForm}
            disabled={disabled}
            localCharge={localCharge}
            chargeModelComboboxData={chargeModelComboboxData}
            handleUpdate={handleUpdate}
          />

          <div className="flex flex-col gap-4">
            {/* Simple charge or default property for groups */}
            {!!localCharge.properties && (
              <div data-test={`default-fixed-charge-accordion-${index}`}>
                <ChargeWrapperSwitch
                  chargeCursor="fixedCharges"
                  chargeIndex={index}
                  chargeErrors={formikProps.errors}
                  chargePricingUnitShortName={chargePricingUnitShortName}
                  currency={currency}
                  isEdition={isEdition}
                  formikProps={formikProps}
                  premiumWarningDialogRef={premiumWarningDialogRef}
                  propertyCursor="properties"
                  setFieldValue={formikProps.setFieldValue}
                  valuePointer={localCharge?.properties}
                />
              </div>
            )}
          </div>

          {/* Charge options */}
          <FixedChargeOptionsAccordion charge={localCharge}>
            <ChargePayInAdvanceOption
              chargePayInAdvanceDescription={undefined}
              disabled={isInSubscriptionForm || disabled}
              isPayInAdvanceOptionDisabled={isPayInAdvanceOptionDisabled}
              payInAdvance={localCharge.payInAdvance || false}
              handleUpdate={({ payInAdvance }) => {
                const objectToUpdate = {
                  ...localCharge,
                  payInAdvance,
                }

                formikProps.setFieldValue(`fixedCharges.${index}`, objectToUpdate)
              }}
            />

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <Typography variant="captionHl" color="textSecondary">
                  {translate('text_17607297072670cl4jl071yy')}
                </Typography>
                <Typography variant="caption">
                  {translate('text_1760729707267wn4kdsg4mpi')}
                </Typography>
              </div>

              <Switch
                name={`fixed-charge-${localCharge.id}-prorated`}
                label={translate('text_17607297072670cl4jl071yy')}
                disabled={disableProRatedOption}
                checked={!!localCharge.prorated}
                onChange={(value) => handleUpdate('prorated', Boolean(value))}
              />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <Typography variant="captionHl" color="textSecondary">
                  {translate('text_1760729707267seik64l67k8')}
                </Typography>
                <Typography variant="caption">
                  {translate('text_17607297072672w5hid8gl1i')}
                </Typography>
              </div>

              <TaxesSelectorSection
                taxes={localCharge?.taxes || []}
                comboboxSelector={SEARCH_TAX_INPUT_FOR_CHARGE_CLASSNAME}
                onUpdate={(newTaxArray) => {
                  handleUpdate('taxes', newTaxArray)
                }}
              />
            </div>
          </FixedChargeOptionsAccordion>
        </>
      </Accordion>
    )
  },
)

FixedChargeAccordion.displayName = 'FixedChargeAccordion'
