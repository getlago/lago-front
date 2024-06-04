import { InputAdornment } from '@mui/material'
import { FormikProps } from 'formik'
import { DateTime } from 'luxon'
import { FC } from 'react'
import styled, { css } from 'styled-components'

import { Button, Tooltip, Typography } from '~/components/designSystem'
import {
  AmountInputField,
  ComboBoxField,
  DatePickerField,
  TextInput,
  TextInputField,
} from '~/components/form'
import { dateErrorCodes, FORM_TYPE_ENUM } from '~/core/constants/form'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum, GetCustomerInfosForWalletFormQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Card, theme } from '~/styles'

import { TWalletDataForm } from '../types'

interface SettingsCardProps {
  formikProps: FormikProps<TWalletDataForm>
  customerData?: GetCustomerInfosForWalletFormQuery
  showExpirationDate: boolean
  setShowExpirationDate: (value: boolean) => void
  formType: keyof typeof FORM_TYPE_ENUM
}

export const SettingsCard: FC<SettingsCardProps> = ({
  formikProps,
  formType,
  customerData,
  showExpirationDate,
  setShowExpirationDate,
}) => {
  const { translate } = useInternationalization()

  return (
    <Card>
      <Typography variant="subhead">{translate('text_6560809c38fb9de88d8a5090')}</Typography>

      <TextInputField
        name="name"
        label={translate('text_62d18855b22699e5cf55f875')}
        placeholder={translate('text_62d18855b22699e5cf55f877')}
        formikProps={formikProps}
      />
      <InlineInputs $hasOnlyThreeColumn={!!customerData?.customer?.currency}>
        <TextInput value="1" label={translate('text_62d18855b22699e5cf55f879')} disabled={true} />
        <TextInput value="=" disabled={true} />
        <AmountInputField
          name="rateAmount"
          disabled={formType === FORM_TYPE_ENUM.edition}
          currency={formikProps.values.currency}
          beforeChangeFormatter={['positiveNumber']}
          label={translate('text_62d18855b22699e5cf55f87d')}
          formikProps={formikProps}
          InputProps={{
            endAdornment: !!customerData?.customer?.currency && (
              <InputAdornment position="end">
                {getCurrencySymbol(customerData?.customer?.currency)}
              </InputAdornment>
            ),
          }}
        />
        {!customerData?.customer?.currency && (
          <ComboBoxField
            disableClearable
            name="currency"
            data={Object.values(CurrencyEnum).map((currencyType) => ({
              value: currencyType,
            }))}
            formikProps={formikProps}
            PopperProps={{ displayInDialog: true }}
          />
        )}
      </InlineInputs>

      {showExpirationDate ? (
        <InlineExpirationInput>
          <DatePickerField
            disablePast
            name="expirationAt"
            placement="top-end"
            label={translate('text_62d18855b22699e5cf55f897')}
            placeholder={translate('text_62d18855b22699e5cf55f899')}
            formikProps={formikProps}
            error={
              formikProps.errors.expirationAt === dateErrorCodes.shouldBeInFuture
                ? translate('text_630ccd87b251590eaa5f9831', {
                    date: DateTime.now().toFormat('LLL. dd, yyyy'),
                  })
                : undefined
            }
          />
          <CloseExpirationTooltip
            placement="top-end"
            title={translate('text_63aa085d28b8510cd46443ff')}
          >
            <Button
              icon="trash"
              variant="quaternary"
              onClick={() => {
                formikProps.setFieldValue('expirationAt', null)
                setShowExpirationDate(false)
              }}
            />
          </CloseExpirationTooltip>
        </InlineExpirationInput>
      ) : (
        <Button
          startIcon="plus"
          variant="quaternary"
          onClick={() => setShowExpirationDate(true)}
          data-test="show-expiration-at"
        >
          {translate('text_6560809c38fb9de88d8a517e')}
        </Button>
      )}
    </Card>
  )
}

const InlineInputs = styled.div<{ $hasOnlyThreeColumn?: boolean }>`
  display: grid;
  grid-template-columns: 48px 48px 1fr 120px;
  gap: ${theme.spacing(3)};
  align-items: flex-end;

  ${({ $hasOnlyThreeColumn }) =>
    $hasOnlyThreeColumn &&
    css`
      grid-template-columns: minmax(48px, 120px) 48px minmax(160px, 1fr);
    `}
`

const InlineExpirationInput = styled.div`
  display: flex;
  gap: ${theme.spacing(4)};
  align-items: center;

  > *:first-child {
    flex-grow: 1;
  }
`

const CloseExpirationTooltip = styled(Tooltip)`
  margin-top: ${theme.spacing(6)};
`
