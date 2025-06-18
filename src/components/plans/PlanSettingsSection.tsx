import { gql } from '@apollo/client'
import { FormikProps } from 'formik'
import { memo, useEffect, useMemo, useState } from 'react'

import { Button, Card, Chip, Tooltip, Typography } from '~/components/designSystem'
import {
  ButtonSelectorField,
  ComboBox,
  ComboBoxField,
  ComboboxItem,
  TextInput,
  TextInputField,
} from '~/components/form'
import {
  FORM_ERRORS_ENUM,
  FORM_TYPE_ENUM,
  getIntervalTranslationKey,
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_TAX_INPUT_FOR_PLAN_CLASSNAME,
} from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { updateNameAndMaybeCode } from '~/core/utils/updateNameAndMaybeCode'
import { CurrencyEnum, PlanInterval, useGetTaxesForPlanLazyQuery } from '~/generated/graphql'
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

  query getTaxesForPlan($limit: Int, $page: Int) {
    taxes(limit: $limit, page: $page) {
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
  errorCode: string | undefined
  formikProps: FormikProps<PlanFormInput>
  isEdition?: boolean
}

export const PlanSettingsSection = memo(
  ({
    canBeEdited,
    isInSubscriptionForm,
    subscriptionFormType,
    errorCode,
    formikProps,
    isEdition,
  }: PlanSettingsSectionProps) => {
    const { translate } = useInternationalization()
    const [shouldDisplayDescription, setShouldDisplayDescription] = useState<boolean>(
      !!formikProps.initialValues.description,
    )
    const [shouldDisplayTaxesInput, setShouldDisplayTaxesInput] = useState(false)
    const plan = formikProps.values
    const [getTaxes, { data: taxesData, loading: taxesLoading }] = useGetTaxesForPlanLazyQuery({
      variables: { limit: 20 },
    })
    const { collection: taxesCollection } = taxesData?.taxes || {}

    const taxesDataForCombobox = useMemo(() => {
      if (!taxesCollection) return []

      const planTaxesIds = plan.taxes?.map((tax) => tax.id) || []

      return taxesCollection.map(({ id, name, rate }) => {
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
          value: id,
          disabled: planTaxesIds.includes(id),
        }
      })
    }, [plan.taxes, taxesCollection])

    useEffect(() => {
      setShouldDisplayDescription(!!formikProps.initialValues.description)
    }, [formikProps.initialValues.description])

    useEffect(() => {
      if (errorCode === FORM_ERRORS_ENUM.existingCode) {
        formikProps.setFieldError('code', 'text_632a2d437e341dcc76817556')
        const rootElement = document.getElementById('root')

        if (!rootElement) return
        rootElement.scrollTo({ top: 0 })
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [errorCode])

    return (
      <Card>
        <div className="flex flex-col gap-8">
          <TextInput
            name="name"
            label={translate('text_629728388c4d2300e2d38091')}
            placeholder={translate('text_624453d52e945301380e499c')}
            value={formikProps.values.name}
            onChange={(name) => {
              updateNameAndMaybeCode({ name, formikProps })
            }}
          />

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
              variant="quaternary"
              onClick={() => setShouldDisplayDescription(true)}
              data-test="show-description"
            >
              {translate('text_642d5eb2783a2ad10d670324')}
            </Button>
          )}
          <TextInputField
            name="code"
            label={translate('text_62876e85e32e0300e1803127')}
            description={translate('text_6661fc17337de3591e29e3cd')}
            beforeChangeFormatter="code"
            disabled={isInSubscriptionForm || (isEdition && !canBeEdited)}
            placeholder={translate('text_624453d52e945301380e499e')}
            formikProps={formikProps}
          />
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

        {!!plan?.taxes?.length && (
          <div>
            <Typography className="mb-1" variant="captionHl" color="grey700">
              {translate('text_6661fc17337de3591e29e3e1')}
            </Typography>
            <div className="flex flex-wrap items-center gap-3">
              {plan.taxes.map(({ id, name, rate }) => (
                <Chip
                  key={id}
                  label={`${name} (${rate}%)`}
                  size="medium"
                  deleteIcon="trash"
                  icon="percentage"
                  deleteIconLabel={
                    subscriptionFormType === FORM_TYPE_ENUM.edition || (isEdition && !canBeEdited)
                      ? undefined
                      : translate('text_63aa085d28b8510cd46443ff')
                  }
                  onDelete={() => {
                    const newTaxedArray = plan.taxes?.filter((tax) => tax.id !== id) || []

                    formikProps.setFieldValue('taxes', newTaxedArray)
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {shouldDisplayTaxesInput ? (
          <div>
            {!plan.taxes?.length && (
              <Typography className="mb-1" variant="captionHl" color="grey700">
                {translate('text_6661fc17337de3591e29e3e1')}
              </Typography>
            )}
            <div className="flex items-center gap-3">
              <ComboBox
                containerClassName="flex-1"
                className={SEARCH_TAX_INPUT_FOR_PLAN_CLASSNAME}
                data={taxesDataForCombobox}
                searchQuery={getTaxes}
                loading={taxesLoading}
                placeholder={translate('text_6661fc17337de3591e29e3e3')}
                emptyText={translate('text_64be91fd0678965126e5657b')}
                onChange={(newTaxId) => {
                  const previousTaxes = [...(formikProps?.values?.taxes || [])]
                  const newTaxObject = taxesData?.taxes?.collection.find((t) => t.id === newTaxId)

                  formikProps.setFieldValue('taxes', [...previousTaxes, newTaxObject])
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
          </div>
        ) : (
          <Button
            className="self-start"
            startIcon="plus"
            variant="quaternary"
            onClick={() => {
              setShouldDisplayTaxesInput(true)
              setTimeout(() => {
                const element = document.querySelector(
                  `.${SEARCH_TAX_INPUT_FOR_PLAN_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
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
        )}
      </Card>
    )
  },
)

PlanSettingsSection.displayName = 'PlanSettingsSection'
