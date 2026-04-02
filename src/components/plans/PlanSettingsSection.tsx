import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'

import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import NameAndCodeGroup from '~/components/form/NameAndCodeGroup/NameAndCodeGroup'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { TaxesSelectorSection } from '~/components/taxes/TaxesSelectorSection'
import {
  FORM_TYPE_ENUM,
  getIntervalTranslationKey,
  SEARCH_TAX_INPUT_FOR_PLAN_CLASSNAME,
} from '~/core/constants/form'
import { CurrencyEnum, PlanInterval, TaxForPlanSettingsSectionFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

gql`
  fragment TaxForPlanSettingsSection on Tax {
    id
    code
    name
    rate
  }

  fragment PlanForSettingsSection on Plan {
    id
    amountCurrency
    code
    description
    interval
    name
    taxes {
      ...TaxForPlanSettingsSection
    }
  }

  query getTaxesForPlan($limit: Int, $page: Int, $searchTerm: String) {
    taxes(limit: $limit, page: $page, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        ...TaxForPlanSettingsSection
      }
    }
  }
`

export interface PlanSettingsFormValues {
  name: string
  code: string
  description: string
  interval: PlanInterval
  amountCurrency: CurrencyEnum
  taxes: TaxForPlanSettingsSectionFragment[]
}

const planSettingsSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string(),
  interval: z.enum(PlanInterval),
  amountCurrency: z.enum(CurrencyEnum),
  taxes: z.array(z.custom<TaxForPlanSettingsSectionFragment>()),
})

const INTERVAL_OPTIONS = [
  PlanInterval.Weekly,
  PlanInterval.Monthly,
  PlanInterval.Quarterly,
  PlanInterval.Semiannual,
  PlanInterval.Yearly,
]

const CURRENCY_DATA = Object.values(CurrencyEnum).map((currencyType) => ({
  value: currencyType,
}))

type PlanSettingsSectionProps = {
  canBeEdited?: boolean
  isInSubscriptionForm?: boolean
  subscriptionFormType?: keyof typeof FORM_TYPE_ENUM
  isEdition?: boolean
  initialValuesFromFormik: PlanSettingsFormValues
  onSettingsChange: (changes: Partial<PlanSettingsFormValues>) => void
  codeError?: string
}

export const PLAN_SETTINGS_REMOVE_DESCRIPTION_TEST_ID = 'remove-description'

export const PlanSettingsSection = ({
  canBeEdited,
  isInSubscriptionForm,
  subscriptionFormType,
  isEdition,
  initialValuesFromFormik,
  onSettingsChange,
  codeError,
}: PlanSettingsSectionProps) => {
  const { translate } = useInternationalization()
  const [shouldDisplayDescription, setShouldDisplayDescription] = useState(
    !!initialValuesFromFormik.description,
  )
  const prevInitialValuesRef = useRef(initialValuesFromFormik)

  const form = useAppForm({
    defaultValues: initialValuesFromFormik,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: planSettingsSchema,
    },
    onSubmit: () => {},
  })

  // Re-initialize when plan data loads (initialValuesFromFormik reference changes)
  // Will be removed once plan form migrates to TanStack
  // as the form will be initialized at a higher level
  useEffect(() => {
    if (prevInitialValuesRef.current !== initialValuesFromFormik) {
      form.reset(initialValuesFromFormik, { keepDefaultValues: true })
      setShouldDisplayDescription(!!initialValuesFromFormik.description)
      prevInitialValuesRef.current = initialValuesFromFormik
    }
  }, [initialValuesFromFormik, form])

  // Glue to make the data sync with formik
  const handleNameOrCodeChange = (field: 'name' | 'code', value: string) => {
    onSettingsChange({ [field]: value })
  }

  const handleHideDescription = () => {
    form.setFieldValue('description', '')
    // Glue to make the data sync with formik
    onSettingsChange({ description: '' })
    setShouldDisplayDescription(false)
  }

  const intervalOptions = INTERVAL_OPTIONS.map((interval) => ({
    label: translate(getIntervalTranslationKey[interval]),
    value: interval,
  }))

  return (
    <CenteredPage.PageSection>
      <CenteredPage.PageSectionTitle
        title={translate('text_642d5eb2783a2ad10d67031a')}
        description={translate('text_6661fc17337de3591e29e3c1')}
      />

      <NameAndCodeGroup
        form={form}
        fields={{ name: 'name', code: 'code' }}
        isDisabled={isInSubscriptionForm || (isEdition && !canBeEdited)}
        nameProps={{ autoFocus: !isInSubscriptionForm }}
        codeProps={{
          infoText: translate('text_6661fc17337de3591e29e3cd'),
          externalError: codeError ? translate(codeError) : undefined,
        }}
        onFieldChange={handleNameOrCodeChange}
      />

      {shouldDisplayDescription && (
        <div className="flex items-center">
          <form.AppField
            name="description"
            listeners={{
              onChange: ({ value }) => {
                onSettingsChange({ description: value })
              },
            }}
          >
            {(field) => (
              <field.TextInputField
                multiline
                className="mr-3 flex-1"
                label={translate('text_629728388c4d2300e2d380f1')}
                placeholder={translate('text_6661fc17337de3591e29e3c9')}
                rows="3"
              />
            )}
          </form.AppField>
          <Tooltip
            className="mt-6"
            placement="top-end"
            title={translate('text_63aa085d28b8510cd46443ff')}
          >
            <Button
              icon="trash"
              variant="quaternary"
              onClick={handleHideDescription}
              data-test={PLAN_SETTINGS_REMOVE_DESCRIPTION_TEST_ID}
            />
          </Tooltip>
        </div>
      )}
      {!shouldDisplayDescription && (
        <Button
          fitContent
          startIcon="plus"
          variant="inline"
          onClick={() => setShouldDisplayDescription(true)}
          data-test="show-description"
        >
          {translate('text_642d5eb2783a2ad10d670324')}
        </Button>
      )}

      <form.AppField
        name="interval"
        listeners={{
          onChange: ({ value }) => {
            onSettingsChange({ interval: value })
          },
        }}
      >
        {(field) => (
          <field.ButtonSelectorField
            disabled={isInSubscriptionForm || (isEdition && !canBeEdited)}
            label={translate('text_6661fc17337de3591e29e3d1')}
            description={translate('text_6661fc17337de3591e29e3d3')}
            options={intervalOptions}
          />
        )}
      </form.AppField>

      <form.AppField
        name="amountCurrency"
        listeners={{
          onChange: ({ value }) => {
            onSettingsChange({ amountCurrency: value })
          },
        }}
      >
        {(field) => (
          <field.ComboBoxField
            data={CURRENCY_DATA}
            disableClearable
            disabled={
              subscriptionFormType === FORM_TYPE_ENUM.edition || (isEdition && !canBeEdited)
            }
            label={translate('text_642d5eb2783a2ad10d67032e')}
          />
        )}
      </form.AppField>

      <form.Subscribe selector={(state) => state.values.taxes}>
        {(taxes) => (
          <TaxesSelectorSection
            title={translate('text_1760729707267seik64l67k8')}
            description={translate('text_1770124786732u8hv8voejbl')}
            taxes={taxes || []}
            comboboxSelector={SEARCH_TAX_INPUT_FOR_PLAN_CLASSNAME}
            onUpdate={(newTaxArray) => {
              form.setFieldValue('taxes', newTaxArray)
              onSettingsChange({ taxes: newTaxArray })
            }}
          />
        )}
      </form.Subscribe>
    </CenteredPage.PageSection>
  )
}

PlanSettingsSection.displayName = 'PlanSettingsSection'
