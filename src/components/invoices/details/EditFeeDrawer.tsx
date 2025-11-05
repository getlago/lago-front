import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { useFormik } from 'formik'
import { tw } from 'lago-design-system'
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { number, object, string } from 'yup'

import { Alert, Button, Drawer, DrawerRef, Skeleton, Typography } from '~/components/designSystem'
import { AmountInputField, ComboBox, ComboBoxField, TextInputField } from '~/components/form'
import { DrawerLayout } from '~/components/layouts/Drawer'
import { ALL_FILTER_VALUES } from '~/core/constants/form'
import { TExtendedRemainingFee } from '~/core/formats/formatInvoiceItemsMap'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  AdjustedFeeTypeEnum,
  Charge,
  ChargeModelEnum,
  CreateAdjustedFeeInput,
  CurrencyEnum,
  useCreateAdjustedFeeMutation,
  useGetInvoiceDetailsForCreateFeeDrawerQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { OnRegeneratedFeeAdd } from '~/pages/CustomerInvoiceRegenerate'

import { InvoiceTableSection } from './InvoiceDetailsTable'
import { InvoiceDetailsTableBodyLine } from './InvoiceDetailsTableBodyLine'
import {
  getChargesComboboxDataFromInvoiceSubscription,
  getChargesFiltersComboboxDataFromInvoiceSubscription,
} from './utils'

const isChargeModelUnitAdjustmentDisabled = (chargeModel?: ChargeModelEnum, prorated?: boolean) => {
  if (!chargeModel) return false

  return (
    chargeModel === ChargeModelEnum.Percentage ||
    chargeModel === ChargeModelEnum.Dynamic ||
    (chargeModel === ChargeModelEnum.Graduated && prorated)
  )
}

const calculateTotalAmount = (
  units?: number | string | null,
  unitAmount?: number | string | null,
) => {
  return Number(units || 0) * Number(unitAmount || 0)
}

gql`
  fragment InvoiceSubscriptionForCreateFeeDrawer on InvoiceSubscription {
    subscription {
      id
      plan {
        id
        charges {
          id
          invoiceDisplayName
          chargeModel
          prorated
          properties {
            amount
          }
          filters {
            id
            invoiceDisplayName
            values
          }
          billableMetric {
            id
            name
            code
          }
        }
        fixedCharges {
          id
          invoiceDisplayName
          addOn {
            id
            name
            code
          }
        }
      }
    }
    fees {
      id
      charge {
        id
        filters {
          id
          values
        }
        properties {
          graduatedRanges {
            flatAmount
            fromValue
            perUnitAmount
            toValue
          }
          graduatedPercentageRanges {
            flatAmount
            fromValue
            rate
            toValue
          }
        }
      }
      fixedCharge {
        id
      }
      chargeFilter {
        id
      }
      pricingUnitUsage {
        shortName
      }
    }
  }

  fragment FeeForEditfeeDrawer on Fee {
    id
    currency
    charge {
      id
      chargeModel
      prorated
    }
  }

  query getInvoiceDetailsForCreateFeeDrawer($invoiceId: ID!) {
    invoice(id: $invoiceId) {
      id
      invoiceSubscriptions {
        ...InvoiceSubscriptionForCreateFeeDrawer
      }
    }
  }

  mutation createAdjustedFee($input: CreateAdjustedFeeInput!) {
    createAdjustedFee(input: $input) {
      id
    }
  }
`

type EditFeeDrawerProps = {
  invoiceId: string
  invoiceSubscriptionId?: string
  fee?: TExtendedRemainingFee | undefined
  onAdd?: OnRegeneratedFeeAdd
}

export interface EditFeeDrawerRef {
  openDrawer: (data: EditFeeDrawerProps) => unknown
  closeDrawer: () => unknown
}

type formikValues = Omit<Partial<CreateAdjustedFeeInput>, 'feeId'> & {
  adjustmentType?: AdjustedFeeTypeEnum.AdjustedAmount | AdjustedFeeTypeEnum.AdjustedUnits
}

export const EditFeeDrawer = forwardRef<EditFeeDrawerRef>((_, ref) => {
  const { translate } = useInternationalization()
  const drawerRef = useRef<DrawerRef>(null)
  const [localData, setLocalData] = useState<EditFeeDrawerProps | undefined>(undefined)
  const fee = localData?.fee
  const currency = fee?.currency || CurrencyEnum.Usd
  const pricingUnitUsage = fee?.pricingUnitUsage
  const isEditingFeeForInvoiceRegenerate = !!localData?.onAdd

  const resetForm = () => {
    formikProps.resetForm()
    formikProps.validateForm()
  }

  const { loading: invoiceLoading, data: invoiceData } =
    useGetInvoiceDetailsForCreateFeeDrawerQuery({
      variables: {
        invoiceId: localData?.invoiceId || '',
      },
      skip: !localData?.invoiceId && !localData?.invoiceSubscriptionId,
    })
  const currentInvoiceSubscription = invoiceData?.invoice?.invoiceSubscriptions?.find(
    (invoiceSubscription) =>
      invoiceSubscription.subscription.id === localData?.invoiceSubscriptionId,
  )

  const [createFee] = useCreateAdjustedFeeMutation({
    onCompleted({ createAdjustedFee }) {
      if (createAdjustedFee?.id) {
        // Close drawer
        drawerRef.current?.closeDrawer()
        resetForm()
      }
    },
    refetchQueries: ['getInvoiceSubscriptions'],
  })

  const initialValues = useMemo(() => {
    const values: formikValues = {
      invoiceDisplayName: fee?.invoiceDisplayName || '',
      chargeFilterId: '',
      chargeId: '',
      unitPreciseAmount: undefined,
      units: undefined,
      adjustmentType: undefined,
    }

    if (isEditingFeeForInvoiceRegenerate) {
      values.unitPreciseAmount = fee?.preciseUnitAmount?.toString()
      values.units = fee?.units
    }

    return values
  }, [fee, isEditingFeeForInvoiceRegenerate])

  const formikProps = useFormik<formikValues>({
    initialValues,
    validationSchema: object().shape({
      invoiceDisplayName: string(),
      chargeId: string().test({
        test: function (value) {
          // If it's a fee edition context, this validation is not needed
          if (!!fee) return true

          return !!value
        },
      }),
      chargeFilterId: string(),
      unitPreciseAmount: number().test({
        test: function (value, { from }) {
          if (
            from?.[0]?.value?.adjustmentType === AdjustedFeeTypeEnum.AdjustedAmount &&
            !value &&
            Number(value) !== 0
          ) {
            return false
          }

          return true
        },
      }),
      units: number().test({
        test: function (value, { from }) {
          if (!!from?.[0]?.value?.adjustmentType && !value && Number(value) !== 0) {
            return false
          }

          return true
        },
      }),
      adjustmentType: string().required(''),
    }),
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async ({ adjustmentType, unitPreciseAmount, units, ...values }) => {
      const chargeFilterId =
        values.chargeFilterId === ALL_FILTER_VALUES ? null : values.chargeFilterId || undefined

      const basePayload: CreateAdjustedFeeInput = {
        invoiceId: localData?.invoiceId || '',
        invoiceDisplayName: values.invoiceDisplayName || undefined,
        units: adjustmentType ? Number(units || 0) : undefined,
        unitPreciseAmount:
          adjustmentType === AdjustedFeeTypeEnum.AdjustedAmount
            ? String(unitPreciseAmount)
            : undefined,
      }

      const input: CreateAdjustedFeeInput = !!fee
        ? { ...basePayload, feeId: fee.id }
        : {
            ...basePayload,
            chargeId: values.chargeId,
            chargeFilterId,
            subscriptionId: localData?.invoiceSubscriptionId || '',
          }

      if (localData?.onAdd) {
        drawerRef.current?.closeDrawer()
        resetForm()

        const currentCharge = currentInvoiceSubscription?.subscription.plan.charges?.find(
          (charge) => charge.id === values.chargeId,
        )

        return localData.onAdd({
          ...(localData.fee || {}),
          ...input,
          charge: currentCharge as Charge,
          chargeFilterId,
          invoiceSubscriptionId: localData?.invoiceSubscriptionId,
        })
      }

      await createFee({
        variables: {
          input,
        },
      })
    },
  })

  const chargesComboboxData = useMemo(() => {
    return getChargesComboboxDataFromInvoiceSubscription({
      chargesGroupLabel: translate('text_6435888d7cc86500646d8977'),
      fixedChargesGroupLabel: translate('text_176072970726728iw4tc8ucl'),
      invoiceSubscription: currentInvoiceSubscription,
    })
  }, [currentInvoiceSubscription, translate])

  const chargeFiltersComboboxData = useMemo(() => {
    return getChargesFiltersComboboxDataFromInvoiceSubscription({
      defaultFilterOptionLabel: translate('text_64e620bca31226337ffc62ad'),
      invoiceSubscription: currentInvoiceSubscription,
      selectedChargeId: formikProps.values.chargeId,
    })
  }, [currentInvoiceSubscription, formikProps.values.chargeId, translate])

  const isChargeFilterIdValid: boolean = useMemo(() => {
    if (!fee && !!chargeFiltersComboboxData?.length && !formikProps.values.chargeFilterId) {
      return false
    }

    return true
  }, [chargeFiltersComboboxData?.length, fee, formikProps.values.chargeFilterId])

  useImperativeHandle(ref, () => ({
    openDrawer: (data) => {
      setLocalData(data)
      drawerRef.current?.openDrawer()
    },
    closeDrawer: () => drawerRef.current?.closeDrawer(),
  }))

  const { displayChargeIdField, displayChargeFilterIdField, displayAdjustmentInputs } =
    useMemo(() => {
      const hasChargeFiltersComboboxData = !!chargeFiltersComboboxData?.length

      return {
        displayChargeIdField: !fee,
        displayChargeFilterIdField: !fee && hasChargeFiltersComboboxData,
        displayAdjustmentInputs:
          !!fee ||
          (hasChargeFiltersComboboxData
            ? !!formikProps.values.chargeFilterId
            : !!formikProps.values.chargeId),
      }
    }, [
      chargeFiltersComboboxData?.length,
      fee,
      formikProps.values.chargeFilterId,
      formikProps.values.chargeId,
    ])

  const isUnitAdjustmentTypeDisabled = useMemo(() => {
    if (fee) {
      return isChargeModelUnitAdjustmentDisabled(fee.charge?.chargeModel, fee.charge?.prorated)
    }

    const selectedCharge = currentInvoiceSubscription?.subscription.plan.charges?.find(
      (charge) => charge.id === formikProps.values.chargeId,
    )

    return isChargeModelUnitAdjustmentDisabled(
      selectedCharge?.chargeModel,
      selectedCharge?.prorated,
    )
  }, [currentInvoiceSubscription?.subscription.plan.charges, fee, formikProps.values.chargeId])

  const feeName = fee?.metadata?.displayName || fee?.itemName || ''
  const drawerTitle = !!fee
    ? translate('text_65a6b4e2cb38d9b70ec53c25', { name: feeName })
    : translate('text_1737709105343hpvidjp0yz0')
  const drawerDescription = !!fee
    ? translate('text_65a6b4e2cb38d9b70ec53c2d')
    : translate('text_1737731953885hprgxewyizj')

  return (
    <Drawer
      showCloseWarningDialog={formikProps.dirty}
      fullContentHeight
      ref={drawerRef}
      withPadding={false}
      title={drawerTitle}
      onClose={resetForm}
    >
      {({ closeDrawer }) => (
        <DrawerLayout.Wrapper>
          <DrawerLayout.Content>
            {!fee && invoiceLoading ? (
              <div className="flex flex-col gap-12">
                {[...Array(2)].map((__, index) => (
                  <div
                    key={`edit-fee-drawer-loading-block-${index}`}
                    className="flex flex-col gap-1"
                  >
                    <Skeleton variant="text" className="w-40" />
                    <Skeleton variant="text" className="w-80" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <DrawerLayout.Header title={drawerTitle} description={drawerDescription} />

                {!!fee && (
                  <>
                    <DrawerLayout.Section>
                      <DrawerLayout.SectionTitle
                        title={translate('text_65a6b4e2cb38d9b70ec53c35')}
                        description={translate('text_1737556835239q7202lhbdhk')}
                      />
                      <InvoiceTableSection
                        className={tw(
                          '[&_table>thead>tr>th:nth-child(1)]:w-[45%] [&_table>thead>tr>th:nth-child(1)]:text-left [&_table>thead>tr>th:nth-child(2)]:w-[15%] [&_table>thead>tr>th:nth-child(3)]:w-[20%] [&_table>thead>tr>th:nth-child(4)]:w-[20%]',
                          '[&_table>tbody>tr>td:nth-child(1)]:w-[45%] [&_table>tbody>tr>td:nth-child(1)]:text-left [&_table>tbody>tr>td:nth-child(2)]:w-[15%] [&_table>tbody>tr>td:nth-child(3)]:w-[20%] [&_table>tbody>tr>td:nth-child(4)]:w-[20%]',
                          '[&_table>tbody>tr:last-child>td]:pb-0 [&_table>tbody>tr:last-child>td]:shadow-none [&_table>tbody>tr>td:not(:last-child)]:pr-3 [&_table>thead>tr>th]:pt-0',
                        )}
                      >
                        <table>
                          <thead>
                            <tr>
                              <th>
                                <Typography variant="captionHl" color="grey600">
                                  {translate('text_6388b923e514213fed58331c')}
                                </Typography>
                              </th>
                              <th>
                                <Typography variant="captionHl" color="grey600">
                                  {translate('text_65771fa3f4ab9a00720726ce')}
                                </Typography>
                              </th>
                              <th>
                                <Typography variant="captionHl" color="grey600">
                                  {translate('text_6453819268763979024ad089')}
                                </Typography>
                              </th>
                              <th>
                                <Typography variant="captionHl" color="grey600">
                                  {translate('text_634d631acf4dce7b0127a3a6')}
                                </Typography>
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            <InvoiceDetailsTableBodyLine
                              canHaveUnitPrice
                              hideVat
                              currency={fee?.currency}
                              displayName={feeName}
                              fee={fee}
                              isDraftInvoice={false}
                            />
                          </tbody>
                        </table>
                      </InvoiceTableSection>
                    </DrawerLayout.Section>
                  </>
                )}
                <DrawerLayout.Section>
                  <DrawerLayout.SectionTitle
                    title={translate('text_65a6b4e2cb38d9b70ec53d31')}
                    description={translate('text_17375568352390mlfarq4p6t')}
                  />

                  <div className="flex flex-col gap-6">
                    {displayChargeIdField && (
                      <ComboBoxField
                        name="chargeId"
                        label={translate('text_1737731953885tbem8s4xo8t')}
                        placeholder={translate('text_1737733582553rmmlatfbk1r')}
                        formikProps={formikProps}
                        data={chargesComboboxData}
                      />
                    )}

                    {displayChargeFilterIdField && (
                      <ComboBoxField
                        name="chargeFilterId"
                        label={translate('text_66ab42d4ece7e6b7078993ad')}
                        placeholder={translate('text_1737733582553dm4huzkoee6')}
                        formikProps={formikProps}
                        data={chargeFiltersComboboxData}
                      />
                    )}

                    {displayAdjustmentInputs && (
                      <>
                        <TextInputField
                          label={translate('text_65a6b4e2cb38d9b70ec53d39')}
                          name="invoiceDisplayName"
                          placeholder={translate('text_65a6b4e2cb38d9b70ec53d41')}
                          formikProps={formikProps}
                        />

                        <ComboBox
                          label={translate('text_65a6b4e2cb38d9b70ec53d49')}
                          name="adjustmentType"
                          placeholder={translate('text_65a94d976d7a9700716590d9')}
                          data={[
                            {
                              label: translate('text_65a6b4e2cb38d9b70ec53d83'),
                              value: AdjustedFeeTypeEnum.AdjustedAmount,
                            },
                            {
                              label: translate('text_6304e74aab6dbc18d615f3a2'),
                              value: AdjustedFeeTypeEnum.AdjustedUnits,
                              disabled: isUnitAdjustmentTypeDisabled,
                            },
                          ]}
                          value={formikProps.values.adjustmentType}
                          onChange={(newValue) => {
                            const formValues = {
                              ...formikProps.values,
                              adjustmentType: newValue as AdjustedFeeTypeEnum,
                            }

                            // NOTE: During invoice re-generate, we don't want to reset the unitPreciseAmount and units for fee already existing.
                            // Because the fee is already existing and we don't want to lose the data.
                            if (!isEditingFeeForInvoiceRegenerate) {
                              formValues.unitPreciseAmount = undefined
                              formValues.units = undefined
                            }

                            formikProps.setValues(formValues)
                          }}
                        />

                        {!!formikProps.values.adjustmentType && (
                          <>
                            <div className="flex items-start gap-4 *:flex-1">
                              <TextInputField
                                label={translate('text_65771fa3f4ab9a00720726ce')}
                                name="units"
                                error={undefined}
                                beforeChangeFormatter={['positiveNumber', 'decimal']}
                                placeholder={translate('text_62a0b7107afa2700a65ef700')}
                                formikProps={formikProps}
                              />

                              {formikProps.values.adjustmentType ===
                                AdjustedFeeTypeEnum.AdjustedAmount && (
                                <>
                                  <AmountInputField
                                    label={translate('text_6453819268763979024ad089')}
                                    name="unitPreciseAmount"
                                    currency={currency}
                                    beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
                                    placeholder={translate('text_62a0b7107afa2700a65ef700')}
                                    formikProps={formikProps}
                                    error={undefined}
                                    InputProps={{
                                      endAdornment: (
                                        <InputAdornment position="end">
                                          {pricingUnitUsage?.shortName ||
                                            getCurrencySymbol(currency)}
                                        </InputAdornment>
                                      ),
                                    }}
                                  />

                                  <div className="flex flex-col gap-1">
                                    <Typography
                                      className="text-end"
                                      variant="captionHl"
                                      color="grey700"
                                    >
                                      {translate('text_65a6b4e2cb38d9b70ec53d83')}
                                    </Typography>
                                    <div className="flex h-12 flex-col items-end justify-center self-end">
                                      <Typography variant="body" color="grey700">
                                        {intlFormatNumber(
                                          calculateTotalAmount(
                                            formikProps.values.units,
                                            formikProps.values.unitPreciseAmount,
                                          ),
                                          {
                                            currencyDisplay: 'symbol',
                                            currency: currency,
                                            maximumFractionDigits: 15,
                                            pricingUnitShortName: pricingUnitUsage?.shortName,
                                          },
                                        )}
                                      </Typography>

                                      {!!pricingUnitUsage && (
                                        <Typography variant="caption" color="grey600">
                                          {intlFormatNumber(
                                            calculateTotalAmount(
                                              formikProps.values.units,
                                              formikProps.values.unitPreciseAmount,
                                            ) * Number(pricingUnitUsage?.conversionRate || 0),
                                            {
                                              currencyDisplay: 'symbol',
                                              currency: currency,
                                            },
                                          )}
                                        </Typography>
                                      )}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>

                            {!!fee?.charge && (
                              <Alert type="info">
                                {translate(
                                  formikProps.values.adjustmentType ===
                                    AdjustedFeeTypeEnum.AdjustedAmount
                                    ? 'text_65a6b4e2cb38d9b70ec53d93'
                                    : 'text_6613b48da4efd500cacc44d3',
                                )}
                              </Alert>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </DrawerLayout.Section>
              </>
            )}
          </DrawerLayout.Content>

          <DrawerLayout.StickyFooter>
            <Button variant="quaternary" size="large" onClick={closeDrawer}>
              {translate('text_6411e6b530cb47007488b027')}
            </Button>

            <Button
              size="large"
              disabled={!formikProps.isValid || !formikProps.dirty || !isChargeFilterIdValid}
              loading={formikProps.isSubmitting}
              onClick={formikProps.submitForm}
            >
              {translate(
                fee?.id ? 'text_65a6b4e2cb38d9b70ec53d9b' : 'text_1752580912616sr615x718w7',
              )}
            </Button>
          </DrawerLayout.StickyFooter>
        </DrawerLayout.Wrapper>
      )}
    </Drawer>
  )
})

EditFeeDrawer.displayName = 'EditFeeDrawer'
