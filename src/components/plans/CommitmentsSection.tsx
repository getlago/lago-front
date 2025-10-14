import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { FormikProps } from 'formik'
import { Icon } from 'lago-design-system'
import { RefObject, useEffect, useMemo, useState } from 'react'

import { Accordion, Button, Chip, Tooltip, Typography } from '~/components/designSystem'
import { AmountInputField } from '~/components/form'
import { EditInvoiceDisplayNameDialogRef } from '~/components/invoices/EditInvoiceDisplayNameDialog'
import { mapChargeIntervalCopy } from '~/components/plans/utils'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { TaxesSelectorSection } from '~/components/taxes/TaxesSelectorSection'
import { SEARCH_TAX_INPUT_FOR_MIN_COMMITMENT_CLASSNAME } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  CommitmentTypeEnum,
  CurrencyEnum,
  TaxForTaxesSelectorSectionFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'

import { PlanFormInput } from './types'

gql`
  query getTaxesForCommitments($limit: Int, $page: Int) {
    taxes(limit: $limit, page: $page) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        ...TaxForTaxesSelectorSection
      }
    }
  }

  ${TaxForTaxesSelectorSectionFragmentDoc}
`

type CommitmentsSectionProps = {
  editInvoiceDisplayNameDialogRef: RefObject<EditInvoiceDisplayNameDialogRef>
  formikProps: FormikProps<PlanFormInput>
  premiumWarningDialogRef: RefObject<PremiumWarningDialogRef>
}

export const CommitmentsSection = ({
  editInvoiceDisplayNameDialogRef,
  formikProps,
  premiumWarningDialogRef,
}: CommitmentsSectionProps) => {
  const { isPremium } = useCurrentUser()
  const { translate } = useInternationalization()

  const [displayMinimumCommitment, setDisplayMinimumCommitment] = useState<boolean>(
    !isNaN(Number(formikProps.initialValues.minimumCommitment?.amountCents)),
  )

  const hasErrorInGroup = !!formikProps?.errors?.minimumCommitment

  const taxValueForBadgeDisplay = useMemo((): string | undefined => {
    if (!formikProps?.values?.minimumCommitment?.taxes?.length) return

    return String(
      formikProps?.values?.minimumCommitment?.taxes?.reduce((acc, cur) => acc + cur.rate, 0),
    )
  }, [formikProps?.values?.minimumCommitment?.taxes])

  useEffect(() => {
    setDisplayMinimumCommitment(
      !isNaN(Number(formikProps.initialValues.minimumCommitment?.amountCents)),
    )
  }, [formikProps.initialValues.minimumCommitment?.amountCents])

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex flex-col gap-1">
        <Typography variant="bodyHl" color="grey700">
          {translate('text_65d601bffb11e0f9d1d9f569')}
        </Typography>
        <Typography variant="caption" color="grey600">
          {translate('text_6661fc17337de3591e29e451', {
            interval: translate(
              mapChargeIntervalCopy(formikProps.values.interval, false),
            ).toLocaleLowerCase(),
          })}
        </Typography>
      </div>
      {displayMinimumCommitment ? (
        <Accordion
          className="w-full"
          summary={
            <div className="flex h-18 w-full items-center justify-between gap-3 overflow-hidden">
              <div className="flex items-center gap-3 overflow-hidden py-1 pr-1">
                <Typography variant="bodyHl" color="grey700" noWrap>
                  {formikProps.values.minimumCommitment?.invoiceDisplayName ||
                    translate('text_65d601bffb11e0f9d1d9f569')}
                </Typography>
                <Tooltip title={translate('text_65018c8e5c6b626f030bcf8d')} placement="top-end">
                  <Button
                    icon="pen"
                    variant="quaternary"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()

                      editInvoiceDisplayNameDialogRef.current?.openDialog({
                        invoiceDisplayName:
                          formikProps.values.minimumCommitment?.invoiceDisplayName,
                        callback: (invoiceDisplayName: string) => {
                          formikProps.setFieldValue(
                            'minimumCommitment.invoiceDisplayName',
                            invoiceDisplayName,
                          )
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
                    hasErrorInGroup
                      ? translate('text_635b975ecea4296eb76924b7')
                      : translate('text_635b975ecea4296eb76924b1')
                  }
                >
                  <Icon
                    name="validate-filled"
                    className="flex items-center"
                    color={hasErrorInGroup ? 'disabled' : 'success'}
                  />
                </Tooltip>
                {!!taxValueForBadgeDisplay && (
                  <Chip
                    label={intlFormatNumber(Number(taxValueForBadgeDisplay) / 100 || 0, {
                      style: 'percent',
                    })}
                  />
                )}
                <Chip
                  label={translate(mapChargeIntervalCopy(formikProps.values.interval, false))}
                />
                <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
                  <Button
                    size="small"
                    icon="trash"
                    variant="quaternary"
                    onClick={() => {
                      formikProps.setFieldValue('minimumCommitment', {})
                      setDisplayMinimumCommitment(false)
                    }}
                  />
                </Tooltip>
              </div>
            </div>
          }
        >
          <Stack direction="column" spacing={6}>
            <AmountInputField
              name="minimumCommitment.amountCents"
              currency={formikProps.values.amountCurrency || CurrencyEnum.Usd}
              beforeChangeFormatter={['positiveNumber']}
              label={translate('text_65d601bffb11e0f9d1d9f571')}
              placeholder={translate('text_62a0b7107afa2700a65ef700')}
              formikProps={formikProps}
            />

            <div>
              <Typography className="mb-2" variant="captionHl" color="grey700">
                {translate('text_64be910fba8ef9208686a8e3')}
              </Typography>

              <TaxesSelectorSection
                taxes={formikProps?.values?.minimumCommitment?.taxes || []}
                comboboxSelector={SEARCH_TAX_INPUT_FOR_MIN_COMMITMENT_CLASSNAME}
                onUpdate={(newTaxArray) => {
                  formikProps.setFieldValue('minimumCommitment.taxes', newTaxArray)
                }}
                onDelete={(newTaxArray) => {
                  formikProps.setFieldValue('minimumCommitment.taxes', newTaxArray)
                }}
              />
            </div>
          </Stack>
        </Accordion>
      ) : (
        <Button
          variant="inline"
          startIcon="plus"
          endIcon={isPremium ? undefined : 'sparkles'}
          disabled={displayMinimumCommitment}
          onClick={() => {
            if (isPremium) {
              // Add default minimum commitment to the plan
              formikProps.setFieldValue('minimumCommitment', {
                commitmentType: CommitmentTypeEnum.MinimumCommitment,
              })

              // Show the minimum commitment input
              setDisplayMinimumCommitment(true)
            } else {
              premiumWarningDialogRef.current?.openDialog()
            }
          }}
        >
          {translate('text_6661ffe746c680007e2df0e1')}
        </Button>
      )}
    </div>
  )
}

CommitmentsSection.displayName = 'CommitmentsSection'
