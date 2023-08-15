import { memo, useEffect, useMemo, useState } from 'react'
import { FormikProps } from 'formik'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { Item } from '~/components/form/ComboBox/ComboBoxItem'
import { ButtonSelectorField, ComboBox, ComboBoxField, TextInputField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Button, Chip, Tooltip, Typography } from '~/components/designSystem'
import { theme, Card } from '~/styles'
import { PLAN_FORM_TYPE_ENUM } from '~/hooks/plans/usePlanForm'
import { LineSplit } from '~/styles/mainObjectsForm'
import { CurrencyEnum, PlanInterval, useGetTaxesForPlanLazyQuery } from '~/generated/graphql'
import {
  FORM_ERRORS_ENUM,
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_TAX_INPUT_FOR_PLAN_CLASSNAME,
} from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'

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

interface PlanSettingsSectionProps {
  canBeEdited: boolean
  errorCode: string | undefined
  formikProps: FormikProps<PlanFormInput>
  type: keyof typeof PLAN_FORM_TYPE_ENUM
}

export const PlanSettingsSection = memo(
  ({ canBeEdited, errorCode, formikProps, type }: PlanSettingsSectionProps) => {
    const { translate } = useInternationalization()
    const [shouldDisplayDescription, setShouldDisplayDescription] = useState<boolean>(
      !!formikProps.initialValues.description
    )
    const [shouldDisplayTaxesInput, setShouldDisplayTaxesInput] = useState<boolean>(false)
    const plan = formikProps.values
    const isEdition = type === PLAN_FORM_TYPE_ENUM.edition
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
        <SectionTitle variant="subhead">{translate('text_642d5eb2783a2ad10d67031a')}</SectionTitle>

        <AdjustableSection $shouldDisplayDescription={shouldDisplayDescription}>
          <LineSplit>
            <TextInputField
              name="name"
              label={translate('text_642d5eb2783a2ad10d67031c')}
              placeholder={translate('text_624453d52e945301380e499c')}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              formikProps={formikProps}
            />
            <TextInputField
              name="code"
              beforeChangeFormatter="code"
              disabled={isEdition && !canBeEdited}
              label={translate('text_642d5eb2783a2ad10d670320')}
              placeholder={translate('text_624453d52e945301380e499e')}
              formikProps={formikProps}
              infoText={translate('text_624d9adba93343010cd14ca1')}
            />
          </LineSplit>
          {shouldDisplayDescription ? (
            <InlineDescription>
              <TextArea
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                multiline
                name="description"
                label={translate('text_642d616c8d9eb000716e2bf1')}
                placeholder={translate('text_624453d52e945301380e49a2')}
                rows="3"
                formikProps={formikProps}
              />
              <CloseDescriptionTooltip
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
              </CloseDescriptionTooltip>
            </InlineDescription>
          ) : (
            <Button
              startIcon="plus"
              variant="quaternary"
              onClick={() => setShouldDisplayDescription(true)}
              data-test="show-description"
            >
              {translate('text_642d5eb2783a2ad10d670324')}
            </Button>
          )}
        </AdjustableSection>

        <ButtonSelectorField
          disabled={isEdition && !canBeEdited}
          name="interval"
          label={translate('text_642d5eb2783a2ad10d670326')}
          infoText={translate('text_624d9adba93343010cd14ca3')}
          formikProps={formikProps}
          options={[
            {
              label: translate('text_62b32ec6b0434070791c2d4c'),
              value: PlanInterval.Weekly,
            },
            {
              label: translate('text_624453d52e945301380e49aa'),
              value: PlanInterval.Monthly,
            },
            {
              label: translate('text_64d6357b00dea100ad1cb9e9'),
              value: PlanInterval.Quarterly,
            },
            {
              label: translate('text_624453d52e945301380e49ac'),
              value: PlanInterval.Yearly,
            },
          ]}
        />

        <ComboBoxField
          data={Object.values(CurrencyEnum).map((currencyType) => ({
            value: currencyType,
          }))}
          disableClearable
          disabled={isEdition && !canBeEdited}
          formikProps={formikProps}
          label={translate('text_642d5eb2783a2ad10d67032e')}
          name="amountCurrency"
        />

        {!!plan?.taxes?.length && (
          <div>
            <TaxLabel variant="captionHl" color="grey700">
              {translate('text_64be910fba8ef9208686a8e3')}
            </TaxLabel>
            <InlineTaxesWrapper>
              {plan.taxes.map(({ id, name, rate }) => (
                <Chip
                  key={id}
                  label={`${name} (${rate}%)`}
                  disabled={isEdition && !canBeEdited}
                  variant="secondary"
                  size="medium"
                  closeIcon="trash"
                  icon="percentage"
                  onCloseLabel={
                    isEdition && !canBeEdited
                      ? undefined
                      : translate('text_63aa085d28b8510cd46443ff')
                  }
                  onClose={() => {
                    const newTaxedArray = plan.taxes?.filter((tax) => tax.id !== id) || []

                    formikProps.setFieldValue('taxes', newTaxedArray)
                  }}
                />
              ))}
            </InlineTaxesWrapper>
          </div>
        )}

        {shouldDisplayTaxesInput ? (
          <div>
            {!plan.taxes?.length && (
              <TaxLabel variant="captionHl" color="grey700">
                {translate('text_64be910fba8ef9208686a8e3')}
              </TaxLabel>
            )}
            <InlineTaxInputWrapper>
              <ComboBox
                className={SEARCH_TAX_INPUT_FOR_PLAN_CLASSNAME}
                data={taxesDataForCombobox}
                searchQuery={getTaxes}
                loading={taxesLoading}
                placeholder={translate('text_64be910fba8ef9208686a8e7')}
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
                  disabled={isEdition && !canBeEdited}
                  onClick={() => {
                    setShouldDisplayTaxesInput(false)
                  }}
                />
              </Tooltip>
            </InlineTaxInputWrapper>
          </div>
        ) : (
          <Button
            startIcon="plus"
            variant="quaternary"
            disabled={isEdition && !canBeEdited}
            onClick={() => {
              setShouldDisplayTaxesInput(true)

              setTimeout(() => {
                const element = document.querySelector(
                  `.${SEARCH_TAX_INPUT_FOR_PLAN_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`
                ) as HTMLElement

                if (!element) return

                element.scrollIntoView({ behavior: 'smooth' })
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
  }
)

PlanSettingsSection.displayName = 'PlanSettingsSection'

const SectionTitle = styled(Typography)`
  > div:first-child {
    margin-bottom: ${theme.spacing(3)};
  }
`

const AdjustableSection = styled.div<{ $shouldDisplayDescription: boolean }>`
  > *:not(:last-child) {
    margin-bottom: ${({ $shouldDisplayDescription }) =>
      $shouldDisplayDescription ? theme.spacing(6) : theme.spacing(3)};
  }
`

const InlineDescription = styled.div`
  display: flex;
  align-items: center;
`

const InlineTaxInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};

  > *:first-child {
    flex: 1;
  }
`

const TaxLabel = styled(Typography)`
  margin-bottom: ${theme.spacing(1)};
`

const InlineTaxesWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};
  flex-wrap: wrap;
`

const TextArea = styled(TextInputField)`
  flex: 1;
  margin-right: ${theme.spacing(3)};

  textarea {
    min-height: 38px;
    resize: vertical;
    white-space: pre-wrap;
  }
`

const CloseDescriptionTooltip = styled(Tooltip)`
  margin-top: ${theme.spacing(6)};
`
