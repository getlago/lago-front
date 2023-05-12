import { memo, useEffect, useState } from 'react'
import { FormikProps } from 'formik'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { ButtonSelectorField, ComboBoxField, TextInputField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Button, Tooltip, Typography } from '~/components/designSystem'
import { theme, Card } from '~/styles'
import { PLAN_FORM_TYPE_ENUM } from '~/hooks/plans/usePlanForm'
import { LineSplit } from '~/styles/mainObjectsForm'
import { CurrencyEnum, PlanInterval } from '~/generated/graphql'
import { FORM_ERRORS_ENUM } from '~/core/formErrors'

import { PlanFormInput } from './types'

gql`
  fragment PlanForSettingsSection on Plan {
    id
    amountCurrency
    code
    description
    interval
    name
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
    const isEdition = type === PLAN_FORM_TYPE_ENUM.edition

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
              label: translate('text_624453d52e945301380e49aa'),
              value: PlanInterval.Monthly,
            },
            {
              label: translate('text_624453d52e945301380e49ac'),
              value: PlanInterval.Yearly,
            },
            {
              label: translate('text_62b32ec6b0434070791c2d4c'),
              value: PlanInterval.Weekly,
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

const TextArea = styled(TextInputField)`
  flex: 1;
  margin-right: ${theme.spacing(3)};

  textarea {
    min-height: 38px;
    resize: vertical;
  }
`

const CloseDescriptionTooltip = styled(Tooltip)`
  margin-top: ${theme.spacing(6)};
`
