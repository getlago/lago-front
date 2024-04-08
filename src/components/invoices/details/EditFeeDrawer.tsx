import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { useFormik } from 'formik'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import styled from 'styled-components'
import { number, object, string } from 'yup'

import { Alert, Button, Drawer, DrawerRef, Typography } from '~/components/designSystem'
import { AmountInputField, ComboBoxField, TextInputField } from '~/components/form'
import { TExtendedRemainingFee } from '~/core/formats/formatInvoiceItemsMap'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { serializeAmount } from '~/core/serializers/serializeAmount'
import {
  AdjustedFeeTypeEnum,
  ChargeModelEnum,
  CreateAdjustedFeeInput,
  CurrencyEnum,
  useCreateAdjustedFeeMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Card, DrawerContent, DrawerSubmitButton, DrawerTitle, theme } from '~/styles'

import { InvoiceWrapper } from './InvoiceDetailsTable'
import { InvoiceDetailsTableBodyLine } from './InvoiceDetailsTableBodyLine'

gql`
  fragment FeeForEditfeeDrawer on Fee {
    id
    currency
  }

  mutation createAdjustedFee($input: CreateAdjustedFeeInput!) {
    createAdjustedFee(input: $input) {
      id
    }
  }
`

type EditFeeDrawerProps = {
  fee: TExtendedRemainingFee | undefined
}

export interface EditFeeDrawerRef extends DrawerRef {
  openDrawer: (data?: EditFeeDrawerProps) => unknown
  closeDrawer: () => unknown
}

export const EditFeeDrawer = forwardRef<EditFeeDrawerRef>((_, ref) => {
  const { translate } = useInternationalization()
  const drawerRef = useRef<DrawerRef>(null)
  const [localData, setLocalData] = useState<EditFeeDrawerProps | undefined>(undefined)
  const fee = localData?.fee
  const currency = fee?.currency || CurrencyEnum.Usd
  const [createFee] = useCreateAdjustedFeeMutation({
    onCompleted({ createAdjustedFee }) {
      if (createAdjustedFee?.id) {
        // Close drawer
        drawerRef.current?.closeDrawer()
        formikProps.resetForm()
        formikProps.validateForm()
      }
    },
    refetchQueries: ['getInvoiceDetails'],
  })
  const formikProps = useFormik<
    Omit<Partial<CreateAdjustedFeeInput>, 'feeId'> & {
      adjustmentType?: AdjustedFeeTypeEnum.AdjustedAmount | AdjustedFeeTypeEnum.AdjustedUnits
    }
  >({
    initialValues: {
      invoiceDisplayName: fee?.invoiceDisplayName || '',
      unitAmountCents: undefined,
      units: undefined,
      adjustmentType: undefined,
    },
    validationSchema: object().shape({
      invoiceDisplayName: string(),
      unitAmountCents: number().test({
        test: function (value) {
          if (
            arguments[1].from[0]?.value?.adjustmentType === AdjustedFeeTypeEnum.AdjustedAmount &&
            !value &&
            Number(value) !== 0
          ) {
            return false
          }

          return true
        },
      }),
      units: number().test({
        test: function (value) {
          if (!!arguments[1].from[0]?.value?.adjustmentType && !value && Number(value) !== 0) {
            return false
          }

          return true
        },
      }),
      adjustmentType: string(),
    }),
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async ({ adjustmentType, unitAmountCents, units, ...values }) => {
      await createFee({
        variables: {
          input: {
            feeId: fee?.id as string,
            units: !!adjustmentType ? Number(units || 0) : undefined,
            unitAmountCents:
              adjustmentType === AdjustedFeeTypeEnum.AdjustedAmount
                ? Number(serializeAmount(unitAmountCents, currency) || 0)
                : undefined,
            invoiceDisplayName: values.invoiceDisplayName || undefined,
            ...values,
          },
        },
      })
    },
  })

  // Reset unitAmountCents and units if adjustmentType changes
  useEffect(() => {
    formikProps.setFieldValue('unitAmountCents', undefined)
    formikProps.setFieldValue('units', undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formikProps.values.adjustmentType])

  useImperativeHandle(ref, () => ({
    openDrawer: (data) => {
      setLocalData(data)
      drawerRef.current?.openDrawer()
    },
    closeDrawer: () => drawerRef.current?.closeDrawer(),
  }))

  return (
    <Drawer
      ref={drawerRef}
      title={translate('text_65a6b4e2cb38d9b70ec53c25', {
        name: fee?.metadata?.displayName,
      })}
      onClose={() => {
        formikProps.resetForm()
        formikProps.validateForm()
      }}
    >
      <DrawerContent>
        <DrawerTitle>
          <Typography variant="headline">
            {translate('text_65a6b4e2cb38d9b70ec53c25', {
              name: fee?.metadata?.displayName,
            })}
          </Typography>
          <Typography>{translate('text_65a6b4e2cb38d9b70ec53c2d')}</Typography>
        </DrawerTitle>

        <Card>
          <Typography variant="subhead">{translate('text_65a6b4e2cb38d9b70ec53c35')}</Typography>

          {!!fee && (
            <LocalInvoiceWrapper>
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
                    currency={fee.currency}
                    displayName={fee.metadata.displayName}
                    fee={fee}
                    isDraftInvoice={false}
                  />
                </tbody>
              </table>
            </LocalInvoiceWrapper>
          )}
        </Card>

        <Card>
          <Typography variant="subhead">{translate('text_65a6b4e2cb38d9b70ec53d31')}</Typography>

          <TextInputField
            label={translate('text_65a6b4e2cb38d9b70ec53d39')}
            name="invoiceDisplayName"
            placeholder={translate('text_65a6b4e2cb38d9b70ec53d41')}
            formikProps={formikProps}
          />

          <ComboBoxField
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
                disabled:
                  fee?.charge?.chargeModel === ChargeModelEnum.Percentage ||
                  (fee?.charge?.chargeModel === ChargeModelEnum.Graduated && fee.charge.prorated),
              },
            ]}
            formikProps={formikProps}
          />
          {!!formikProps.values.adjustmentType && (
            <>
              <InlineElements>
                <TextInputField
                  label={translate('text_65771fa3f4ab9a00720726ce')}
                  name="units"
                  error={undefined}
                  beforeChangeFormatter={['positiveNumber', 'int']}
                  placeholder={translate('text_62a0b7107afa2700a65ef700')}
                  formikProps={formikProps}
                />

                {formikProps.values.adjustmentType === AdjustedFeeTypeEnum.AdjustedAmount && (
                  <>
                    <AmountInputField
                      label={translate('text_6453819268763979024ad089')}
                      name="unitAmountCents"
                      currency={currency}
                      beforeChangeFormatter={['positiveNumber']}
                      placeholder={translate('text_62a0b7107afa2700a65ef700')}
                      formikProps={formikProps}
                      error={undefined}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            {getCurrencySymbol(currency)}
                          </InputAdornment>
                        ),
                      }}
                    />

                    <InlineTotalAmountDisplay>
                      <Typography variant="captionHl" color="grey700">
                        {translate('text_65a6b4e2cb38d9b70ec53d83')}
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {intlFormatNumber(
                          Number(
                            Number(formikProps.values.units || 0) *
                              Number(formikProps.values.unitAmountCents || 0) || 0,
                          ),
                          {
                            currencyDisplay: 'symbol',
                            currency: currency,
                          },
                        )}
                      </Typography>
                    </InlineTotalAmountDisplay>
                  </>
                )}
              </InlineElements>

              <Alert type="info">
                {translate(
                  formikProps.values.adjustmentType === AdjustedFeeTypeEnum.AdjustedAmount
                    ? 'text_65a6b4e2cb38d9b70ec53d93'
                    : 'text_6613b48da4efd500cacc44d3',
                )}
              </Alert>
            </>
          )}
        </Card>

        <DrawerSubmitButton>
          <Button
            fullWidth
            size="large"
            disabled={!formikProps.isValid || !formikProps.dirty}
            loading={formikProps.isSubmitting}
            onClick={formikProps.submitForm}
          >
            {translate('text_65a6b4e2cb38d9b70ec53d9b')}
          </Button>
        </DrawerSubmitButton>
      </DrawerContent>
    </Drawer>
  )
})

EditFeeDrawer.displayName = 'EditFeeDrawer'

const LocalInvoiceWrapper = styled(InvoiceWrapper)`
  table {
    thead tr th,
    tbody tr td {
      &:nth-child(1) {
        width: 45%;
        text-align: left;
      }
      &:nth-child(2) {
        width: 15%;
      }
      &:nth-child(3) {
        width: 20%;
      }
      &:nth-child(4) {
        width: 20%;
      }
    }

    thead tr th {
      padding-top: 0;
    }

    tbody tr {
      td:not(:last-child) {
        padding-right: ${theme.spacing(3)};
      }

      &:last-child td {
        padding-bottom: 0;
        box-shadow: none;
      }
    }
  }
`

const InlineElements = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${theme.spacing(4)};

  > * {
    flex: 1;
  }
`

const InlineTotalAmountDisplay = styled.div`
  text-align: right;

  > *:first-child {
    margin-bottom: ${theme.spacing(1)};
  }

  > *:last-child {
    padding: 10px 0;
  }
`
