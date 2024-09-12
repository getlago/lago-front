import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { FormikProps } from 'formik'
import { memo, useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'

import { TextInput } from '~/components/form'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import { LocalChargeFilterInput, LocalPropertiesInput, PlanFormInput } from './types'

import { Button, Tooltip, Typography } from '../designSystem'
import { AmountInput } from '../form/AmountInput/AmountInput'

gql`
  fragment StandardCharge on Properties {
    amount
    groupedBy
  }
`

interface StandardChargeProps {
  chargeIndex: number
  currency: CurrencyEnum
  formikProps: FormikProps<PlanFormInput>
  initialValuePointer: LocalPropertiesInput | LocalChargeFilterInput['properties'] | undefined
  propertyCursor: string
  valuePointer: LocalPropertiesInput | LocalChargeFilterInput['properties'] | undefined
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
  }: StandardChargeProps) => {
    const { translate } = useInternationalization()

    const [shouldDisplayGroupedBy, setShouldDisplayGroupedBy] = useState<boolean>(
      !!initialValuePointer?.groupedBy,
    )
    const handleUpdate = useCallback(
      (name: string, value: string) => {
        formikProps.setFieldValue(`charges.${chargeIndex}.${name}`, value)
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [chargeIndex],
    )

    useEffect(() => {
      setShouldDisplayGroupedBy(!!initialValuePointer?.groupedBy)
    }, [initialValuePointer?.groupedBy])

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
        <Group>
          <GroupTitle>
            <Typography variant="captionHl" color="textSecondary">
              {translate('text_65ba6d45e780c1ff8acb20e0')}
            </Typography>
            <Typography variant="caption">{translate('text_6661fc17337de3591e29e425')}</Typography>
          </GroupTitle>
          {shouldDisplayGroupedBy || !!valuePointer?.groupedBy ? (
            <InlineFields>
              {/* TODO: make it a single line textarea */}
              <StyledTextInput
                // multiline
                // maxRows={3}
                name={`${propertyCursor}.groupedBy`}
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
              {translate('text_6661fc17337de3591e29e427')}
            </Button>
          )}
        </Group>
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
  gap: ${theme.spacing(3)};

  > *:last-child {
    margin-top: ${theme.spacing(1)};
  }
`

const StyledTextInput = styled(TextInput)`
  flex: 1;
`

const GroupTitle = styled.div`
  > div:not(:last-child) {
    margin-bottom: ${theme.spacing(1)};
  }
`

const Group = styled.div`
  > :not(:last-child) {
    margin-bottom: ${theme.spacing(4)};
  }
`
