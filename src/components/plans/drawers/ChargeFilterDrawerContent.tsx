import { useStore } from '@tanstack/react-form'
import { RefObject, useEffect, useRef } from 'react'
import { z } from 'zod'

import { Chip } from '~/components/designSystem/Chip'
import { Typography } from '~/components/designSystem/Typography'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { ChargeFilter } from '~/components/plans/chargeAccordion/ChargeFilter'
import { ChargeWrapperSwitch } from '~/components/plans/chargeAccordion/ChargeWrapperSwitch'
import { LocalChargeFilterInput, LocalUsageChargeInput } from '~/components/plans/types'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { useChargeFilterDrawerContext } from '~/contexts/ChargeFilterDrawerContext'
import { chargeModelLookupTranslation } from '~/core/constants/form'
import {
  PropertiesZodInput,
  validateChargeProperties,
} from '~/formValidation/chargePropertiesSchema'
import { BillableMetricFilter, ChargeModelEnum, PropertiesInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

// Test ID constants
export const CHARGE_FILTER_DRAWER_CHARGE_MODEL_CHIP_TEST_ID =
  'charge-filter-drawer-charge-model-chip'

export interface ChargeFilterFormValues {
  chargeModel: ChargeModelEnum
  invoiceDisplayName: string
  properties: PropertiesInput
  values: string[]
}

export const chargeFilterDrawerSchema = z
  .object({
    chargeModel: z.custom<ChargeModelEnum>(),
    invoiceDisplayName: z.string(),
    properties: z.record(z.string(), z.unknown()),
    values: z.array(z.string()).min(1),
  })
  .superRefine((data, ctx) => {
    validateChargeProperties(data.chargeModel, data.properties as PropertiesZodInput, ctx, [
      'properties',
    ])
  })

const chargeFilterDefaultValues: ChargeFilterFormValues = {
  chargeModel: ChargeModelEnum.Standard,
  invoiceDisplayName: '',
  properties: {} as PropertiesInput,
  values: [],
}

interface ChargeFilterDrawerContentExtraProps {
  initialValues: ChargeFilterFormValues
  billableMetricFilters: BillableMetricFilter[]
  existingFilterValues?: Set<string>
  premiumWarningDialogRef?: RefObject<PremiumWarningDialogRef>
  chargeIndex: number
  filterIndex: number
}

const chargeFilterDrawerContentDefaultProps: ChargeFilterDrawerContentExtraProps = {
  initialValues: chargeFilterDefaultValues,
  billableMetricFilters: [],
  existingFilterValues: undefined,
  premiumWarningDialogRef: undefined,
  chargeIndex: 0,
  filterIndex: 0,
}

export const ChargeFilterDrawerContent = withForm({
  defaultValues: chargeFilterDefaultValues,
  props: chargeFilterDrawerContentDefaultProps,
  render: function ChargeFilterDrawerContent({
    form,
    initialValues,
    billableMetricFilters,
    existingFilterValues,
    premiumWarningDialogRef,
    chargeIndex,
    filterIndex,
  }) {
    const { translate } = useInternationalization()
    const { chargeModel, chargeType, currency, chargePricingUnitShortName, isEdition } =
      useChargeFilterDrawerContext()

    // Reset the form when this component mounts so values are guaranteed fresh,
    // regardless of NiceModal/React batching timing.
    const didResetRef = useRef(false)

    useEffect(() => {
      if (!didResetRef.current) {
        didResetRef.current = true
        form.reset(initialValues)
      }
    }, [form, initialValues])

    const filterState = useStore(form.store, (state) => state.values)

    const filter: LocalChargeFilterInput = {
      invoiceDisplayName: filterState.invoiceDisplayName,
      properties: filterState.properties,
      values: filterState.values,
    }

    return (
      <CenteredPage.SectionWrapper>
        <CenteredPage.SubsectionWrapper>
          {/* Filter values */}
          <CenteredPage.PageSection>
            <ChargeFilter
              filter={filter}
              chargeIndex={chargeIndex}
              filterIndex={filterIndex}
              billableMetricFilters={billableMetricFilters}
              existingFilterValues={existingFilterValues}
              setFilterValues={(values) => {
                form.setFieldValue('values', values)
              }}
              deleteFilterValue={(valueIndex) => {
                const currentValues = [...form.state.values.values]

                currentValues.splice(valueIndex, 1)
                form.setFieldValue('values', currentValues)
              }}
            />
          </CenteredPage.PageSection>

          {/* Pricing properties */}
          <CenteredPage.PageSection>
            {/* Charge model info (read-only) */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <Typography color="grey700" variant="captionHl">
                  {translate('text_1773687275957bjkl8w0vrsg')}
                </Typography>
                <Typography color="grey600" variant="caption">
                  {translate('text_1773687275957f97sto0sosz')}
                </Typography>
              </div>

              <Chip
                data-test={CHARGE_FILTER_DRAWER_CHARGE_MODEL_CHIP_TEST_ID}
                label={translate(chargeModelLookupTranslation[chargeModel])}
              />
            </div>

            <ChargeWrapperSwitch
              chargeType={chargeType}
              chargePricingUnitShortName={chargePricingUnitShortName}
              currency={currency}
              form={form}
              isEdition={isEdition}
              localCharge={{ chargeModel } as LocalUsageChargeInput}
              premiumWarningDialogRef={premiumWarningDialogRef}
              propertyCursor="properties"
            />
          </CenteredPage.PageSection>

          {/* Invoice display name */}
          <CenteredPage.PageSection>
            <form.AppField name="invoiceDisplayName">
              {(field) => (
                <field.TextInputField
                  label={translate('text_65a6b4e2cb38d9b70ec53d39')}
                  placeholder={translate('text_65a6b4e2cb38d9b70ec53d41')}
                />
              )}
            </form.AppField>
          </CenteredPage.PageSection>
        </CenteredPage.SubsectionWrapper>
      </CenteredPage.SectionWrapper>
    )
  },
})
