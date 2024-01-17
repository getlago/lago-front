import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { FormikProps } from 'formik'
import { memo, RefObject, useEffect, useState } from 'react'
import styled from 'styled-components'

import { Accordion, Button, Chip, Icon, Tooltip, Typography } from '~/components/designSystem'
import { AmountInputField, ButtonSelectorField, TextInputField } from '~/components/form'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum, PlanInterval } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Card, NAV_HEIGHT, theme } from '~/styles'

import { PlanFormInput } from './types'

import { EditInvoiceDisplayNameRef } from '../invoices/EditInvoiceDisplayName'

gql`
  fragment PlanForFixedFeeSection on Plan {
    id
    amountCents
    payInAdvance
    trialPeriod
    invoiceDisplayName
  }
`

interface FixedFeeSectionProps {
  canBeEdited?: boolean
  isInSubscriptionForm?: boolean
  subscriptionFormType?: keyof typeof FORM_TYPE_ENUM
  editInvoiceDisplayNameRef: RefObject<EditInvoiceDisplayNameRef>
  formikProps: FormikProps<PlanFormInput>
  isEdition?: boolean
  isInitiallyOpen?: boolean
}

const mapIntervalCopy = (interval: string) => {
  if (interval === PlanInterval.Monthly) {
    return 'text_624453d52e945301380e49aa'
  }
  if (interval === PlanInterval.Yearly) {
    return 'text_624453d52e945301380e49ac'
  }
  if (interval === PlanInterval.Weekly) {
    return 'text_62b32ec6b0434070791c2d4c'
  }
  if (interval === PlanInterval.Quarterly) {
    return 'text_64d6357b00dea100ad1cb9e9'
  }
  if (interval === PlanInterval.Daily) {
    return 'Daily'
  }

  return ''
}

export const FixedFeeSection = memo(
  ({
    canBeEdited,
    isInSubscriptionForm,
    subscriptionFormType,
    editInvoiceDisplayNameRef,
    formikProps,
    isEdition,
    isInitiallyOpen,
  }: FixedFeeSectionProps) => {
    const { translate } = useInternationalization()
    const [shouldDisplayTrialPeriod, setShouldDisplayTrialPeriod] = useState(false)
    const hasErrorInSection =
      Boolean(formikProps.errors.amountCents) || formikProps.errors.amountCents === ''

    useEffect(() => {
      const initialTrialPeriod = formikProps?.initialValues?.trialPeriod || 0

      setShouldDisplayTrialPeriod(!isNaN(initialTrialPeriod) && initialTrialPeriod > 0)
    }, [formikProps.initialValues.trialPeriod])

    return (
      <Card>
        <SectionTitle variant="subhead">{translate('text_642d5eb2783a2ad10d670332')}</SectionTitle>

        <Accordion
          noContentMargin
          initiallyOpen={isInitiallyOpen}
          summary={
            <BoxHeader>
              <BoxHeaderGroupLeft>
                <Typography noWrap variant="bodyHl" color="grey700">
                  {formikProps.values.invoiceDisplayName ||
                    translate('text_642d5eb2783a2ad10d670336')}
                </Typography>
                <Tooltip title={translate('text_65018c8e5c6b626f030bcf8d')} placement="top-end">
                  <Button
                    icon="pen"
                    variant="quaternary"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()

                      editInvoiceDisplayNameRef.current?.openDialog({
                        invoiceDisplayName: formikProps.values.invoiceDisplayName,
                        callback: (invoiceDisplayName: string) => {
                          formikProps.setFieldValue('invoiceDisplayName', invoiceDisplayName)
                        },
                      })
                    }}
                  />
                </Tooltip>
              </BoxHeaderGroupLeft>
              <BoxHeaderGroupRight>
                <ValidationTooltip
                  placement="top-end"
                  title={
                    hasErrorInSection
                      ? translate('text_635b975ecea4296eb76924b7')
                      : translate('text_635b975ecea4296eb76924b1')
                  }
                >
                  <Icon name="validate-filled" color={hasErrorInSection ? 'disabled' : 'success'} />
                </ValidationTooltip>
                {!!formikProps.values?.taxes?.length && (
                  <Chip
                    label={intlFormatNumber(
                      Number(formikProps?.values?.taxes?.reduce((acc, cur) => acc + cur.rate, 0)) /
                        100 || 0,
                      {
                        minimumFractionDigits: 2,
                        style: 'percent',
                      },
                    )}
                  />
                )}
                <Chip label={translate(mapIntervalCopy(formikProps.values.interval))} />
              </BoxHeaderGroupRight>
            </BoxHeader>
          }
          data-test="fixed-fee-section-accordion"
        >
          <BoxContent>
            <AmountInputField
              name="amountCents"
              currency={formikProps.values.amountCurrency}
              beforeChangeFormatter={['positiveNumber']}
              disabled={
                subscriptionFormType === FORM_TYPE_ENUM.edition || (isEdition && !canBeEdited)
              }
              label={translate('text_624453d52e945301380e49b6')}
              formikProps={formikProps}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {getCurrencySymbol(formikProps.values.amountCurrency || CurrencyEnum.Usd)}
                  </InputAdornment>
                ),
              }}
            />
            <ButtonSelectorField
              name="payInAdvance"
              label={translate('text_646e2d0cc536351b62ba6f86')}
              formikProps={formikProps}
              disabled={isInSubscriptionForm || (isEdition && !canBeEdited)}
              helperText={
                formikProps.values.payInAdvance
                  ? translate('text_646e2d0cc536351b62ba6fc5')
                  : translate('text_646e2d0cc536351b62ba6fb0')
              }
              options={[
                {
                  label: translate('text_646e2d0cc536351b62ba6f8c'),
                  value: false,
                },
                {
                  label: translate('text_646e2d0cc536351b62ba6faa'),
                  value: true,
                },
              ]}
            />

            {shouldDisplayTrialPeriod ? (
              <InlineTrialPeriod>
                <InputTrialPeriod
                  name="trialPeriod"
                  disabled={
                    subscriptionFormType === FORM_TYPE_ENUM.edition || (isEdition && !canBeEdited)
                  }
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
                <CloseTrialPeriodTooltip
                  placement="top-end"
                  title={translate('text_63aa085d28b8510cd46443ff')}
                  disableHoverListener={
                    subscriptionFormType === FORM_TYPE_ENUM.edition || (isEdition && !canBeEdited)
                  }
                >
                  <Button
                    icon="trash"
                    variant="quaternary"
                    disabled={
                      subscriptionFormType === FORM_TYPE_ENUM.edition || (isEdition && !canBeEdited)
                    }
                    onClick={() => {
                      formikProps.setFieldValue('trialPeriod', null)
                      setShouldDisplayTrialPeriod(false)
                    }}
                  />
                </CloseTrialPeriodTooltip>
              </InlineTrialPeriod>
            ) : (
              <Button
                startIcon="plus"
                disabled={
                  subscriptionFormType === FORM_TYPE_ENUM.edition || (isEdition && !canBeEdited)
                }
                variant="quaternary"
                data-test="show-trial-period"
                onClick={() => setShouldDisplayTrialPeriod(true)}
              >
                {translate('text_642d5eb2783a2ad10d670344')}
              </Button>
            )}
          </BoxContent>
        </Accordion>
      </Card>
    )
  },
)

FixedFeeSection.displayName = 'FixedFeeSection'

const SectionTitle = styled(Typography)`
  > div:first-child {
    margin-bottom: ${theme.spacing(3)};
  }
`

const InlineTrialPeriod = styled.div`
  display: flex;
  align-items: center;
`

const InputTrialPeriod = styled(TextInputField)`
  flex: 1;
  margin-right: ${theme.spacing(3)};
`

const CloseTrialPeriodTooltip = styled(Tooltip)`
  margin-top: ${theme.spacing(6)};
`

const BoxHeader = styled.div`
  /* Used to prevent long invoice display name to overflow */
  overflow: hidden;
  width: 100%;
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing(3)};
`

const BoxHeaderGroupLeft = styled.div`
  /* Used to prevent long invoice display name to overflow */
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};
`

const BoxHeaderGroupRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};
`

const BoxContent = styled.div`
  padding: ${theme.spacing(4)};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(8)};
  }
`
const ValidationTooltip = styled(Tooltip)`
  height: 16px;
`
