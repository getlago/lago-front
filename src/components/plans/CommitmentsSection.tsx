import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { FormikProps } from 'formik'
import { Icon } from 'lago-design-system'
import { RefObject, useEffect, useMemo, useState } from 'react'

import { Accordion, Button, Chip, Tooltip, Typography } from '~/components/designSystem'
import { AmountInputField, ComboBox, ComboboxItem } from '~/components/form'
import { EditInvoiceDisplayNameRef } from '~/components/invoices/EditInvoiceDisplayName'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import {
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_TAX_INPUT_FOR_MIN_COMMITMENT_CLASSNAME,
} from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { scrollToAndClickElement } from '~/core/utils/domUtils'
import {
  CommitmentTypeEnum,
  CurrencyEnum,
  useGetTaxesForCommitmentsLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'

import { PlanFormInput } from './types'
import { mapChargeIntervalCopy } from './UsageChargeAccordion'

gql`
  query getTaxesForCommitments($limit: Int, $page: Int) {
    taxes(limit: $limit, page: $page) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        ...TaxForPlanUsageChargeAccordion
      }
    }
  }
`

type CommitmentsSectionProps = {
  editInvoiceDisplayNameRef: RefObject<EditInvoiceDisplayNameRef>
  formikProps: FormikProps<PlanFormInput>
  premiumWarningDialogRef: RefObject<PremiumWarningDialogRef>
}

export const CommitmentsSection = ({
  editInvoiceDisplayNameRef,
  formikProps,
  premiumWarningDialogRef,
}: CommitmentsSectionProps) => {
  const { isPremium } = useCurrentUser()
  const { translate } = useInternationalization()

  const [shouldDisplayTaxesInput, setShouldDisplayTaxesInput] = useState<boolean>(false)
  const [displayMinimumCommitment, setDisplayMinimumCommitment] = useState<boolean>(
    !isNaN(Number(formikProps.initialValues.minimumCommitment?.amountCents)),
  )

  const hasErrorInGroup = !!formikProps?.errors?.minimumCommitment

  const [getTaxes, { data: taxesData, loading: taxesLoading }] = useGetTaxesForCommitmentsLazyQuery(
    {
      variables: { limit: 500 },
    },
  )
  const { collection: taxesCollection } = taxesData?.taxes || {}

  const taxesDataForCombobox = useMemo(() => {
    if (!taxesCollection) return []

    const minCommitmentsTaxesIds =
      formikProps.values.minimumCommitment?.taxes?.map((tax) => tax.id) || []

    return taxesCollection.map(({ id: taxId, name, rate }) => {
      const formatedRate = intlFormatNumber(Number(rate) / 100 || 0, {
        style: 'percent',
      })

      return {
        label: `${name} (${formatedRate})`,
        labelNode: (
          <ComboboxItem>
            <Typography variant="body" color="grey700" noWrap>
              {name}
            </Typography>
            <Typography variant="caption" color="grey600" noWrap>
              {formatedRate}
            </Typography>
          </ComboboxItem>
        ),
        value: taxId,
        disabled: minCommitmentsTaxesIds.includes(taxId),
      }
    })
  }, [formikProps.values.minimumCommitment?.taxes, taxesCollection])

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

                      editInvoiceDisplayNameRef.current?.openDialog({
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
              <div className="flex flex-col gap-4">
                {!!formikProps?.values?.minimumCommitment?.taxes?.length && (
                  <div className="flex flex-wrap items-center gap-3">
                    {formikProps?.values?.minimumCommitment?.taxes.map(
                      ({ id: localTaxId, name, rate }) => (
                        <Chip
                          key={localTaxId}
                          label={`${name} (${rate}%)`}
                          type="secondary"
                          size="medium"
                          deleteIcon="trash"
                          icon="percentage"
                          deleteIconLabel={translate('text_63aa085d28b8510cd46443ff')}
                          onDelete={() => {
                            const newTaxedArray =
                              formikProps?.values?.minimumCommitment?.taxes?.filter(
                                (tax) => tax.id !== localTaxId,
                              ) || []

                            formikProps.setFieldValue('minimumCommitment.taxes', newTaxedArray)
                          }}
                        />
                      ),
                    )}
                  </div>
                )}

                {shouldDisplayTaxesInput ? (
                  <div className="flex items-center gap-3">
                    <ComboBox
                      containerClassName="flex-1"
                      className={SEARCH_TAX_INPUT_FOR_MIN_COMMITMENT_CLASSNAME}
                      data={taxesDataForCombobox}
                      searchQuery={getTaxes}
                      loading={taxesLoading}
                      placeholder={translate('text_64be910fba8ef9208686a8e7')}
                      emptyText={translate('text_64be91fd0678965126e5657b')}
                      onChange={(newTaxId) => {
                        const previousTaxes = [
                          ...(formikProps?.values?.minimumCommitment?.taxes || []),
                        ]
                        const newTaxObject = taxesData?.taxes?.collection.find(
                          (t) => t.id === newTaxId,
                        )

                        formikProps.setFieldValue('minimumCommitment.taxes', [
                          ...previousTaxes,
                          newTaxObject,
                        ])
                        setShouldDisplayTaxesInput(false)
                      }}
                    />

                    <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
                      <Button
                        icon="trash"
                        variant="quaternary"
                        onClick={() => {
                          setShouldDisplayTaxesInput(false)
                        }}
                      />
                    </Tooltip>
                  </div>
                ) : (
                  // Wrapping div to avoid the button to be full width, caused by the <Stack> parent
                  <div>
                    <Button
                      fitContent
                      startIcon="plus"
                      variant="inline"
                      onClick={() => {
                        setShouldDisplayTaxesInput(true)

                        scrollToAndClickElement({
                          selector: `.${SEARCH_TAX_INPUT_FOR_MIN_COMMITMENT_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
                        })
                      }}
                    >
                      {translate('text_64be910fba8ef9208686a8c9')}
                    </Button>
                  </div>
                )}
              </div>
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
