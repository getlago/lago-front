import { memo, useEffect } from 'react'
import { FormikProps } from 'formik'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { TextInputField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Typography } from '~/components/designSystem'
import { theme, Card } from '~/styles'
import { PLAN_FORM_TYPE_ENUM, FORM_ERRORS_ENUM } from '~/hooks/plans/usePlanForm'
import { Line } from '~/styles/mainObjectsForm'

import { PlanFormInput } from './types'

gql`
  fragment PlanSettings on Plan {
    id
    name
    code
    description
  }
`

interface PlanSettingsProps {
  canBeEdited: boolean
  errorCode: string | undefined
  formikProps: FormikProps<PlanFormInput>
  type: keyof typeof PLAN_FORM_TYPE_ENUM
}
export const PlanSettings = memo(
  ({ canBeEdited, errorCode, formikProps, type }: PlanSettingsProps) => {
    const { translate } = useInternationalization()
    const isEdition = type === PLAN_FORM_TYPE_ENUM.edition

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
        <SectionTitle variant="subhead">{translate('text_624453d52e945301380e4992')}</SectionTitle>

        <Line>
          <TextInputField
            name="name"
            label={translate('text_624453d52e945301380e4998')}
            placeholder={translate('text_624453d52e945301380e499c')}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            formikProps={formikProps}
          />
          <TextInputField
            name="code"
            beforeChangeFormatter="code"
            disabled={isEdition && !canBeEdited}
            label={translate('text_624453d52e945301380e499a')}
            placeholder={translate('text_624453d52e945301380e499e')}
            formikProps={formikProps}
            infoText={translate('text_624d9adba93343010cd14ca1')}
          />
        </Line>
        <TextInputField
          name="description"
          label={translate('text_624c5eadff7db800acc4c99f')}
          placeholder={translate('text_624453d52e945301380e49a2')}
          rows="3"
          multiline
          formikProps={formikProps}
        />
      </Card>
    )
  }
)

PlanSettings.displayName = 'PlanSettings'

const SectionTitle = styled(Typography)`
  > div:first-child {
    margin-bottom: ${theme.spacing(3)};
  }
`
