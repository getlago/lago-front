import { useEffect, memo } from 'react'
import { FormikProps } from 'formik'
import styled from 'styled-components'
import { InputAdornment } from '@mui/material'
import { gql } from '@apollo/client'

import { PlanInterval, CurrencyEnum } from '~/generated/graphql'
import {
  TextInputField,
  ButtonSelectorField,
  ComboBoxField,
  SwitchField,
  AmountInputField,
} from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Typography } from '~/components/designSystem'
import { theme, Card } from '~/styles'
import { FORM_ERRORS_ENUM } from '~/hooks/plans/usePlanForm'
import { LineAmount } from '~/styles/mainObjectsForm'

import { PlanFormInput } from './types'

gql`
  fragment FixedFeeSection on Plan {
    id
    interval
    amountCents
    amountCurrency
    payInAdvance
    trialPeriod
  }
`

interface FixedFeeSectionProps {
  canBeEdited: boolean
  errorCode: string | undefined
  formikProps: FormikProps<PlanFormInput>
  isEdition: boolean
}

export const FixedFeeSection = memo(
  ({ canBeEdited, errorCode, formikProps, isEdition }: FixedFeeSectionProps) => {
    const { translate } = useInternationalization()

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
        <SectionTitle variant="subhead">{translate('text_624453d52e945301380e49a6')}</SectionTitle>
        <ButtonSelectorField
          disabled={isEdition && !canBeEdited}
          name="interval"
          label={translate('text_624c5eadff7db800acc4c9ad')}
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

        <LineAmount>
          <AmountInputField
            name="amountCents"
            currency={formikProps.values.amountCurrency}
            beforeChangeFormatter={['positiveNumber']}
            disabled={isEdition && !canBeEdited}
            label={translate('text_624453d52e945301380e49b6')}
            formikProps={formikProps}
          />
          <ComboBoxField
            disabled={isEdition && !canBeEdited}
            name="amountCurrency"
            data={Object.values(CurrencyEnum).map((currencyType) => ({
              value: currencyType,
            }))}
            disableClearable
            formikProps={formikProps}
          />
        </LineAmount>

        <SwitchField
          name="payInAdvance"
          disabled={isEdition && !canBeEdited}
          label={translate('text_624d90e6a93343010cd14b40')}
          subLabel={translate('text_624d90e6a93343010cd14b4c')}
          formikProps={formikProps}
        />

        <TextInputField
          name="trialPeriod"
          disabled={isEdition && !canBeEdited}
          label={translate('text_624453d52e945301380e49c2')}
          beforeChangeFormatter={['positiveNumber', 'int']}
          placeholder={translate('text_624453d52e945301380e49c4')}
          formikProps={formikProps}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {translate('text_624453d52e945301380e49c6')}
              </InputAdornment>
            ),
          }}
        />
      </Card>
    )
  }
)

FixedFeeSection.displayName = 'FixedFeeSection'

const SectionTitle = styled(Typography)`
  > div:first-child {
    margin-bottom: ${theme.spacing(3)};
  }
`
