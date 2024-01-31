import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { FormikProps } from 'formik'
import { memo, useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'

import { TextInput } from '~/components/form'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum, InputMaybe, PropertiesInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import { PlanFormInput } from './types'

import { Button, Tooltip } from '../designSystem'
import { AmountInput } from '../form/AmountInput/AmountInput'

gql`
  fragment StandardCharge on Charge {
    id
    properties {
      amount
      groupedBy
    }
    groupProperties {
      values {
        amount
        groupedBy
      }
    }
  }
`

interface PackageChargeProps {
  chargeIndex: number
  currency: CurrencyEnum
  formikProps: FormikProps<PlanFormInput>
  initialValuePointer: InputMaybe<PropertiesInput> | undefined
  propertyCursor: string
  valuePointer: InputMaybe<PropertiesInput> | undefined
  disabled?: boolean
}

export const StandardCharge = memo(
  ({
    chargeIndex,
    currency,
    disabled,
    formikProps,
    initialValuePointer,
    propertyCursor,
    valuePointer,
  }: PackageChargeProps) => {
    const { translate } = useInternationalization()

    const [shouldDisplayGroupedBy, setShouldDisplayGroupedBy] = useState<boolean>(false)
    const handleUpdate = useCallback(
      (name: string, value: string) => {
        formikProps.setFieldValue(`charges.${chargeIndex}.${name}`, value)
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [chargeIndex],
    )

    useEffect(() => {
      setShouldDisplayGroupedBy(!!initialValuePointer?.groupedBy)
    }, [formikProps.initialValues.description, initialValuePointer?.groupedBy])

    return (
      <Container>
        <AmountInput
          name={`${propertyCursor}.amount`}
          currency={currency}
          beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
          disabled={disabled}
          label={translate('text_624453d52e945301380e49b6')}
          value={valuePointer?.amount || ''}
          onChange={(value) => handleUpdate(`${propertyCursor}.amount`, value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">{getCurrencySymbol(currency)}</InputAdornment>
            ),
          }}
        />
        {shouldDisplayGroupedBy ? (
          <InlineFields>
            {/* TODO: make it a single line textarea */}
            <StyledTextInput
              // multiline
              // maxRows={3}
              name={`${propertyCursor}.groupedBy`}
              label={translate('text_65ba6d45e780c1ff8acb205f')}
              placeholder={translate('text_65ba6d45e780c1ff8acb206f')}
              helperText={translate('text_65ba6d45e780c1ff8acb2073')}
              disabled={disabled}
              value={valuePointer?.groupedBy as unknown as string}
              onChange={(value) => handleUpdate(`${propertyCursor}.groupedBy`, value)}
            />

            <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
              <Button
                icon="trash"
                variant="quaternary"
                onClick={() => {
                  // @ts-ignore NOTE: that should be removed once the new multiple combobox is implemented and used to define the groupedBy
                  handleUpdate(`${propertyCursor}.groupedBy`, '')
                  setShouldDisplayGroupedBy(false)
                }}
              />
            </Tooltip>
          </InlineFields>
        ) : (
          <Button
            startIcon="plus"
            variant="quaternary"
            onClick={() => setShouldDisplayGroupedBy(true)}
          >
            {translate('text_65ba6d45e780c1ff8acb20e0')}
          </Button>
        )}
      </Container>
    )
  },
)

StandardCharge.displayName = 'StandardCharge'

const Container = styled.div`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

const InlineFields = styled.div`
  display: flex;

  > :first-child {
    margin-right: ${theme.spacing(3)};
  }

  > :last-child {
    margin-top: 28px;
  }
`

const StyledTextInput = styled(TextInput)`
  flex: 1;
  margin-right: ${theme.spacing(3)};
`
