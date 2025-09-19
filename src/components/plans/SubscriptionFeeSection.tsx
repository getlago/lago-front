import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { FormikProps } from 'formik'
import { Icon } from 'lago-design-system'
import { memo, RefObject, useEffect, useState } from 'react'

import { Accordion, Button, Card, Chip, Tooltip, Typography } from '~/components/designSystem'
import { AmountInputField, RadioGroupField, TextInputField } from '~/components/form'
import { EditInvoiceDisplayNameDialogRef } from '~/components/invoices/EditInvoiceDisplayNameDialog'
import { FORM_TYPE_ENUM, getIntervalTranslationKey } from '~/core/constants/form'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { PlanFormInput } from './types'

gql`
  fragment PlanForSubscriptionFeeSection on Plan {
    id
    amountCents
    payInAdvance
    trialPeriod
    invoiceDisplayName
  }
`

interface SubscriptionFeeSectionProps {
  canBeEdited?: boolean
  isInSubscriptionForm?: boolean
  subscriptionFormType?: keyof typeof FORM_TYPE_ENUM
  editInvoiceDisplayNameDialogRef: RefObject<EditInvoiceDisplayNameDialogRef>
  formikProps: FormikProps<PlanFormInput>
  isEdition?: boolean
  isInitiallyOpen?: boolean
}

export const SubscriptionFeeSection = memo(
  ({
    canBeEdited,
    isInSubscriptionForm,
    subscriptionFormType,
    editInvoiceDisplayNameDialogRef,
    formikProps,
    isEdition,
    isInitiallyOpen,
  }: SubscriptionFeeSectionProps) => {
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
        <div className="flex flex-col gap-2">
          <Typography variant="subhead1">{translate('text_642d5eb2783a2ad10d670336')}</Typography>
          <Typography variant="caption">
            {translate('text_6661fc17337de3591e29e3ed', {
              interval: translate(getIntervalTranslationKey[formikProps.values.interval]),
            })}
          </Typography>
        </div>

        <Accordion
          noContentMargin
          initiallyOpen={isInitiallyOpen}
          summary={
            <div className="flex h-18 w-full items-center justify-between gap-3 overflow-hidden">
              <div className="flex items-center gap-3 overflow-hidden py-1 pr-1">
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

                      editInvoiceDisplayNameDialogRef.current?.openDialog({
                        invoiceDisplayName: formikProps.values.invoiceDisplayName,
                        callback: (invoiceDisplayName: string) => {
                          formikProps.setFieldValue('invoiceDisplayName', invoiceDisplayName)
                        },
                      })
                    }}
                  />
                </Tooltip>
              </div>
              <div className="flex items-center gap-3">
                <Tooltip
                  placement="top-end"
                  title={
                    hasErrorInSection
                      ? translate('text_635b975ecea4296eb76924b7')
                      : translate('text_635b975ecea4296eb76924b1')
                  }
                >
                  <Icon name="validate-filled" color={hasErrorInSection ? 'disabled' : 'success'} />
                </Tooltip>
                {!!formikProps.values?.taxes?.length && (
                  <Chip
                    label={intlFormatNumber(
                      Number(formikProps?.values?.taxes?.reduce((acc, cur) => acc + cur.rate, 0)) /
                        100 || 0,
                      {
                        style: 'percent',
                      },
                    )}
                  />
                )}
                <Chip label={translate(getIntervalTranslationKey[formikProps.values.interval])} />
              </div>
            </div>
          }
          data-test="subscription-fee-section-accordion"
        >
          <div className="flex flex-col gap-6 p-6">
            <AmountInputField
              name="amountCents"
              currency={formikProps.values.amountCurrency}
              beforeChangeFormatter={['positiveNumber']}
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

            <RadioGroupField
              name="payInAdvance"
              label={translate('text_6682c52081acea90520743a8')}
              description={translate('text_6682c52081acea90520743aa')}
              formikProps={formikProps}
              disabled={isInSubscriptionForm || (isEdition && !canBeEdited)}
              optionLabelVariant="body"
              options={[
                {
                  label: translate('text_6682c52081acea90520743ac'),
                  value: false,
                },
                {
                  label: translate('text_6682c52081acea90520743ae'),
                  value: true,
                },
              ]}
            />

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <Typography variant="captionHl" color="textSecondary">
                  {translate('text_624453d52e945301380e49c2')}
                </Typography>
                <Typography variant="caption">
                  {translate('text_6661fc17337de3591e29e403')}
                </Typography>
              </div>

              {shouldDisplayTrialPeriod ? (
                <div className="flex items-center gap-3">
                  <TextInputField
                    className="flex-1"
                    name="trialPeriod"
                    disabled={
                      subscriptionFormType === FORM_TYPE_ENUM.edition || (isEdition && !canBeEdited)
                    }
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
                  <Tooltip
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
                        subscriptionFormType === FORM_TYPE_ENUM.edition ||
                        (isEdition && !canBeEdited)
                      }
                      onClick={() => {
                        formikProps.setFieldValue('trialPeriod', null)
                        setShouldDisplayTrialPeriod(false)
                      }}
                    />
                  </Tooltip>
                </div>
              ) : (
                <Button
                  fitContent
                  startIcon="plus"
                  disabled={
                    subscriptionFormType === FORM_TYPE_ENUM.edition || (isEdition && !canBeEdited)
                  }
                  variant="inline"
                  data-test="show-trial-period"
                  onClick={() => setShouldDisplayTrialPeriod(true)}
                >
                  {translate('text_642d5eb2783a2ad10d670344')}
                </Button>
              )}
            </div>
          </div>
        </Accordion>
      </Card>
    )
  },
)

SubscriptionFeeSection.displayName = 'SubscriptionFeeSection'
