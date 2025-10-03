import { gql } from '@apollo/client'
import { FormikProps } from 'formik'
import { memo, useEffect, useState } from 'react'

import { Button, Card, Tooltip, Typography } from '~/components/designSystem'
import { ButtonSelectorField, ComboBoxField, TextInput, TextInputField } from '~/components/form'
import { TaxesSelectorSection } from '~/components/taxes/TaxesSelectorSection'
import {
  FORM_TYPE_ENUM,
  getIntervalTranslationKey,
  SEARCH_TAX_INPUT_FOR_PLAN_CLASSNAME,
} from '~/core/constants/form'
import { updateNameAndMaybeCode } from '~/core/utils/updateNameAndMaybeCode'
import { CurrencyEnum, PlanInterval } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { PlanFormInput } from './types'

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

type PlanSettingsSectionProps = {
  canBeEdited?: boolean
  isInSubscriptionForm?: boolean
  subscriptionFormType?: keyof typeof FORM_TYPE_ENUM
  formikProps: FormikProps<PlanFormInput>
  isEdition?: boolean
}

export const PlanSettingsSection = memo(
  ({
    canBeEdited,
    isInSubscriptionForm,
    subscriptionFormType,
    formikProps,
    isEdition,
  }: PlanSettingsSectionProps) => {
    const { translate } = useInternationalization()
    const [shouldDisplayDescription, setShouldDisplayDescription] = useState<boolean>(
      !!formikProps.initialValues.description,
    )
    const plan = formikProps.values

    useEffect(() => {
      setShouldDisplayDescription(!!formikProps.initialValues.description)
    }, [formikProps.initialValues.description])

    return (
      <Card>
        <div className="flex flex-col gap-6">
          <div className="flex gap-3">
            <TextInput
              className="flex-1"
              name="name"
              label={translate('text_629728388c4d2300e2d38091')}
              placeholder={translate('text_624453d52e945301380e499c')}
              value={formikProps.values.name}
              onChange={(name) => {
                updateNameAndMaybeCode({ name, formikProps })
              }}
            />
            <TextInputField
              className="flex-1"
              name="code"
              label={translate('text_62876e85e32e0300e1803127')}
              infoText={translate('text_6661fc17337de3591e29e3cd')}
              beforeChangeFormatter="code"
              disabled={isInSubscriptionForm || (isEdition && !canBeEdited)}
              placeholder={translate('text_624453d52e945301380e499e')}
              formikProps={formikProps}
            />
          </div>

          {shouldDisplayDescription ? (
            <div className="flex items-center">
              <TextInputField
                multiline
                className="mr-3 flex-1"
                name="description"
                label={translate('text_629728388c4d2300e2d380f1')}
                placeholder={translate('text_6661fc17337de3591e29e3c9')}
                rows="3"
                formikProps={formikProps}
              />
              <Tooltip
                className="mt-6"
                placement="top-end"
                title={translate('text_63aa085d28b8510cd46443ff')}
              >
                <Button
                  icon="trash"
                  variant="quaternary"
                  onClick={() => {
                    formikProps.setFieldValue('description', '')
                    setShouldDisplayDescription(false)
                  }}
                />
              </Tooltip>
            </div>
          ) : (
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
        </div>

        <ButtonSelectorField
          disabled={isInSubscriptionForm || (isEdition && !canBeEdited)}
          name="interval"
          label={translate('text_6661fc17337de3591e29e3d1')}
          description={translate('text_6661fc17337de3591e29e3d3')}
          formikProps={formikProps}
          options={[
            {
              label: translate(getIntervalTranslationKey[PlanInterval.Weekly]),
              value: PlanInterval.Weekly,
            },
            {
              label: translate(getIntervalTranslationKey[PlanInterval.Monthly]),
              value: PlanInterval.Monthly,
            },
            {
              label: translate(getIntervalTranslationKey[PlanInterval.Quarterly]),
              value: PlanInterval.Quarterly,
            },
            {
              label: translate(getIntervalTranslationKey[PlanInterval.Semiannual]),
              value: PlanInterval.Semiannual,
            },
            {
              label: translate(getIntervalTranslationKey[PlanInterval.Yearly]),
              value: PlanInterval.Yearly,
            },
          ]}
        />

        <ComboBoxField
          data={Object.values(CurrencyEnum).map((currencyType) => ({
            value: currencyType,
          }))}
          disableClearable
          disabled={subscriptionFormType === FORM_TYPE_ENUM.edition || (isEdition && !canBeEdited)}
          formikProps={formikProps}
          label={translate('text_642d5eb2783a2ad10d67032e')}
          name="amountCurrency"
        />

        <div className="flex flex-col gap-1">
          {!!plan?.taxes?.length && (
            <Typography variant="captionHl" color="grey700">
              {translate('text_6661fc17337de3591e29e3e1')}
            </Typography>
          )}

          <TaxesSelectorSection
            taxes={plan.taxes || []}
            comboboxSelector={SEARCH_TAX_INPUT_FOR_PLAN_CLASSNAME}
            onUpdate={(newTaxArray) => {
              formikProps.setFieldValue('taxes', newTaxArray)
            }}
            onDelete={(newTaxArray) => {
              formikProps.setFieldValue('taxes', newTaxArray)
            }}
          />
        </div>
      </Card>
    )
  },
)

PlanSettingsSection.displayName = 'PlanSettingsSection'
