import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import _get from 'lodash/get'
import { useMemo, useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { array, number, object, string } from 'yup'

import { CreditNoteCodeSnippet } from '~/components/creditNote/CreditNoteCodeSnippet'
import { CreditNoteFormCalculation } from '~/components/creditNote/CreditNoteFormCalculation'
import { CreditNoteFormItem } from '~/components/creditNote/CreditNoteFormItem'
import {
  CreditNoteForm,
  CreditTypeEnum,
  FromFee,
  GroupedFee,
  PayBackErrorEnum,
} from '~/components/creditNote/types'
import {
  Avatar,
  Button,
  Icon,
  Skeleton,
  Status,
  StatusEnum,
  Typography,
} from '~/components/designSystem'
import { Checkbox, ComboBoxField, TextInputField } from '~/components/form'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { hasDefinedGQLError } from '~/core/apolloClient'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_INVOICE_DETAILS_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { generateAddOnFeesSchema, generateFeesSchema } from '~/formValidation/feesSchema'
import {
  CreditNoteFormFragmentDoc,
  CreditNoteReasonEnum,
  CurrencyEnum,
  InvoicePaymentStatusTypeEnum,
  LagoApiError,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCreateCreditNote } from '~/hooks/useCreateCreditNote'
import { CustomerInvoiceDetailsTabsOptionsEnum } from '~/layouts/CustomerInvoiceDetails'
import { Card, HEADER_TABLE_HEIGHT, PageHeader, theme } from '~/styles'
import { Content, Main, Side, Subtitle, Title } from '~/styles/mainObjectsForm'

gql`
  fragment CreateCreditNoteInvoice on Invoice {
    id
    currency
    number
    paymentStatus
    creditableAmountCents
    refundableAmountCents
    subTotalIncludingTaxesAmountCents
    ...CreditNoteForm
  }

  ${CreditNoteFormFragmentDoc}
`

const determineCheckboxValue = (
  initialValue: boolean | undefined | null,
  additionnalValue: boolean | undefined
) => {
  if (initialValue === undefined || additionnalValue === undefined) return undefined
  if (initialValue === null) {
    return additionnalValue
  }
  if (initialValue !== additionnalValue) {
    return undefined
  }
  return additionnalValue
}

const mapStatus = (type?: InvoicePaymentStatusTypeEnum | undefined) => {
  switch (type) {
    case InvoicePaymentStatusTypeEnum.Succeeded:
      return {
        type: StatusEnum.running,
        label: 'text_637d01eb5af40c52246a67aa',
      }
    case InvoicePaymentStatusTypeEnum.Pending:
      return {
        type: StatusEnum.paused,
        label: 'text_636bedf292786b19d3398ecc',
      }
    default:
      return {
        type: StatusEnum.error,
        label: 'text_6386477f5cf9042813d9e000',
      }
  }
}

const CreateCreditNote = () => {
  const { translate } = useInternationalization()
  const warningDialogRef = useRef<WarningDialogRef>(null)
  const { id, invoiceId } = useParams()
  const navigate = useNavigate()
  const { loading, invoice, feesPerInvoice, feeForAddOn, onCreate } = useCreateCreditNote()
  const currency = invoice?.currency || CurrencyEnum.Usd

  const addOnFeesValidation = useMemo(
    () => generateAddOnFeesSchema(feeForAddOn || [], currency),
    [feeForAddOn, currency]
  )

  const feesValidation = useMemo(
    () => generateFeesSchema(feesPerInvoice || {}, currency),
    [feesPerInvoice, currency]
  )

  const statusMap = mapStatus(invoice?.paymentStatus)
  const formikProps = useFormik<Partial<CreditNoteForm>>({
    initialValues: {
      description: undefined,
      reason: undefined,
      fees: feesPerInvoice,
      addOnFee: feeForAddOn,
      payBack: [{ type: undefined, value: undefined }],
      creditAmount: undefined,
      refundAmount: undefined,
    },
    validationSchema: object().shape({
      reason: string().required(''),
      fees: feesValidation,
      addOnFee: addOnFeesValidation,
      payBack: array().of(
        object().shape({
          type: string().required(''),
          value: number()
            .required('')
            .when('type', ([type]) => {
              return type === CreditTypeEnum.refund
                ? number().max(
                    deserializeAmount(invoice?.refundableAmountCents, currency) || 0,
                    PayBackErrorEnum.maxRefund
                  )
                : number().max(
                    deserializeAmount(invoice?.creditableAmountCents, currency) || 0,
                    PayBackErrorEnum.maxRefund
                  )
            }),
        })
      ),
    }),
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async (values, formikBag) => {
      const answer = await onCreate(values as CreditNoteForm)

      if (hasDefinedGQLError('DoesNotMatchItemAmounts', answer?.errors)) {
        formikBag.setErrors({
          // @ts-ignore - Formik doesn't know it here but we have 2 values in the array if we get this error
          payBack: [
            { value: LagoApiError.DoesNotMatchItemAmounts },
            { value: LagoApiError.DoesNotMatchItemAmounts },
          ],
        })
      }
    },
  })

  const checkboxGroupValue = useMemo(() => {
    const fees = formikProps.values.fees || {}

    return (
      Object.keys(fees).reduce((acc, subscriptionKey) => {
        const subscriptionValues = fees[subscriptionKey]

        let subscriptionGroupValues: {
          value: undefined | boolean | null
          [key: string]: undefined | boolean | null
        } = {
          value: null,
        }

        Object.keys(subscriptionValues.fees).forEach((childKey) => {
          const child = subscriptionValues.fees[childKey] as FromFee

          if (typeof child?.checked === 'boolean') {
            subscriptionGroupValues = {
              ...subscriptionGroupValues,
              value: determineCheckboxValue(subscriptionGroupValues.value, child?.checked),
            }
          } else {
            let groupValue: boolean | undefined | null = null

            const grouped = (child as unknown as GroupedFee)?.grouped

            Object.keys(grouped || {}).forEach((groupedKey) => {
              const feeValues = grouped[groupedKey]

              groupValue = determineCheckboxValue(groupValue, feeValues.checked)
            })

            subscriptionGroupValues = {
              ...subscriptionGroupValues,
              [childKey]: groupValue,
              value: determineCheckboxValue(
                subscriptionGroupValues.value,
                groupValue as unknown as boolean | undefined
              ),
            }
          }
        })

        return { ...acc, [subscriptionKey]: subscriptionGroupValues }
      }, {}) || {}
    )
  }, [formikProps.values.fees])

  return (
    <div>
      <PageHeader>
        {loading ? (
          <div>
            <Skeleton variant="text" height={12} width={120} />
          </div>
        ) : (
          <Typography variant="bodyHl" color="textSecondary" noWrap>
            {translate('text_636bedf292786b19d3398eb9', {
              invoiceNumber: invoice?.number,
            })}
          </Typography>
        )}
        <Button
          variant="quaternary"
          icon="close"
          onClick={() =>
            formikProps.dirty
              ? warningDialogRef.current?.openDialog()
              : navigate(
                  generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
                    id,
                    invoiceId,
                    tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
                  })
                )
          }
        />
      </PageHeader>

      <Content>
        <Main>
          <div>
            {loading ? (
              <>
                <Skeleton variant="text" height={12} width={280} marginBottom="22px" />
                <Skeleton variant="text" height={12} width={480} marginBottom="40px" />
                <StyledCard $loading>
                  <Skeleton variant="connectorAvatar" size="medium" marginRight="12px" />
                  <Skeleton variant="text" height={12} width={160} />
                </StyledCard>
                <Card>
                  <Skeleton variant="text" height={12} width={416} marginBottom="36px" />
                  <Skeleton variant="text" height={12} width={656} marginBottom="16px" />
                  <Skeleton variant="text" height={12} width={256} />
                </Card>
                <ButtonContainer>
                  <Button size="large" disabled fullWidth>
                    {translate('text_636bedf292786b19d3398ec4')}
                  </Button>
                </ButtonContainer>
              </>
            ) : (
              <>
                <div>
                  <Title variant="headline">{translate('text_636bedf292786b19d3398ec4')}</Title>
                  <Subtitle>{translate('text_636bedf292786b19d3398ec6')}</Subtitle>
                </div>
                <StyledCard>
                  <Avatar variant="connector">
                    <Icon name="document" />
                  </Avatar>

                  <div>
                    <Typography variant="caption">
                      {translate('text_636bedf292786b19d3398ec8')}
                    </Typography>
                    <Typography variant="bodyHl" color="grey700">
                      {translate('text_636bedf292786b19d3398eca', {
                        invoiceNumber: invoice?.number,
                        subtotal: intlFormatNumber(
                          deserializeAmount(
                            invoice?.subTotalIncludingTaxesAmountCents || 0,
                            currency
                          ),
                          {
                            currency,
                          }
                        ),
                      })}
                    </Typography>
                  </div>

                  <Status type={statusMap.type} label={translate(statusMap.label)} />
                </StyledCard>

                <Card>
                  <Typography variant="subhead">
                    {translate('text_636bedf292786b19d3398ece')}
                  </Typography>
                  <ComboBoxField
                    name="reason"
                    formikProps={formikProps}
                    label={translate('text_636bedf292786b19d3398ed0')}
                    placeholder={translate('text_636bedf292786b19d3398ed2')}
                    data={[
                      {
                        value: CreditNoteReasonEnum?.DuplicatedCharge,
                        label: translate('text_636d85ee6459e3fc0a859123'),
                      },
                      {
                        value: CreditNoteReasonEnum?.FraudulentCharge,
                        label: translate('text_636d864c7046be9069662e9d'),
                      },
                      {
                        value: CreditNoteReasonEnum?.OrderCancellation,
                        label: translate('text_636d86390ce8d6d7ed8ce937'),
                      },

                      {
                        value: CreditNoteReasonEnum?.OrderChange,
                        label: translate('text_636d8642904c9f56a8b2d834'),
                      },

                      {
                        value: CreditNoteReasonEnum?.Other,
                        label: translate('text_636d86cd9fd41b93c35bf1c7'),
                      },

                      {
                        value: CreditNoteReasonEnum?.ProductUnsatisfactory,
                        label: translate('text_636d86201507276b7421a981'),
                      },
                    ]}
                  />
                  <TextInputField
                    name="description"
                    formikProps={formikProps}
                    label={translate('text_636bedf292786b19d3398ed4')}
                    placeholder={translate('text_636bedf292786b19d3398ed6')}
                    rows={3}
                    multiline
                  />
                </Card>

                <Card>
                  <Typography variant="subhead">
                    {translate('text_636bedf292786b19d3398ed8')}
                  </Typography>
                  <div>
                    <Typography variant="caption">
                      {translate('text_636bedf292786b19d3398eda')}
                    </Typography>
                    <Typography variant="bodyHl" color="grey700">
                      {translate('text_636bedf292786b19d3398edc', {
                        invoiceNumber: invoice?.number,
                        subtotal: intlFormatNumber(
                          deserializeAmount(invoice?.creditableAmountCents || 0, currency),
                          {
                            currency,
                          }
                        ),
                      })}
                    </Typography>
                  </div>

                  {feeForAddOn &&
                    feeForAddOn.map((fee, i) => (
                      <CreditNoteFormItem
                        key={fee?.id}
                        formikProps={formikProps}
                        currency={currency}
                        feeName={fee?.name}
                        formikKey={`addOnFee.${i}`}
                        maxValue={fee?.maxAmount}
                      />
                    ))}

                  {feesPerInvoice &&
                    Object.keys(feesPerInvoice).map((subKey) => {
                      const subscription = feesPerInvoice[subKey]

                      return (
                        <div key={subKey}>
                          <HeaderLine>
                            <Checkbox
                              value={_get(checkboxGroupValue, `${subKey}.value`)}
                              canBeIndeterminate
                              label={
                                <Typography variant="bodyHl" color="grey500">
                                  {subscription?.subscriptionName}
                                </Typography>
                              }
                              onChange={(_, value) => {
                                const childValues = _get(
                                  formikProps.values.fees,
                                  `${subKey}.fees`
                                ) as unknown as { [feeGroupId: string]: FromFee | GroupedFee }

                                formikProps.setFieldValue(
                                  `fees.${subKey}.fees`,
                                  Object.keys(childValues).reduce((acc, childKey) => {
                                    const child = childValues[childKey] as FromFee

                                    if (typeof child.checked === 'boolean') {
                                      acc = { ...acc, [childKey]: { ...child, checked: value } }
                                    } else {
                                      const grouped = (child as unknown as GroupedFee)?.grouped

                                      acc = {
                                        ...acc,
                                        [childKey]: {
                                          ...child,
                                          grouped: Object.keys(grouped || {}).reduce(
                                            (accGroup, groupKey) => {
                                              const fee = grouped[groupKey]

                                              return {
                                                ...accGroup,
                                                [groupKey]: { ...fee, checked: value },
                                              }
                                            },
                                            {}
                                          ),
                                        },
                                      }
                                    }
                                    return acc
                                  }, {})
                                )
                              }}
                            />
                            <Typography variant="bodyHl" color="grey500">
                              {translate('text_636bedf292786b19d3398ee0')}
                            </Typography>
                          </HeaderLine>
                          {Object.keys(subscription?.fees)?.map((groupFeeKey) => {
                            const child = subscription?.fees[groupFeeKey] as FromFee

                            if (typeof child?.checked === 'boolean') {
                              return (
                                <CreditNoteFormItem
                                  key={child?.id}
                                  formikProps={formikProps}
                                  currency={currency}
                                  feeName={`${child?.name}${
                                    child.isTrueUpFee
                                      ? ` - ${translate('text_64463aaa34904c00a23be4f7')}`
                                      : ''
                                  }`}
                                  formikKey={`fees.${subKey}.fees.${groupFeeKey}`}
                                  maxValue={child?.maxAmount || 0}
                                />
                              )
                            }

                            const grouped = (child as unknown as GroupedFee)?.grouped

                            return (
                              <div key={groupFeeKey}>
                                {Object.keys(grouped).map((groupedFeeKey) => {
                                  const fee = grouped[groupedFeeKey]

                                  return (
                                    <CreditNoteFormItem
                                      key={fee?.id}
                                      formikProps={formikProps}
                                      currency={currency}
                                      feeName={`${child.name} • ${fee?.name}`}
                                      formikKey={`fees.${subKey}.fees.${groupFeeKey}.grouped.${fee?.id}`}
                                      maxValue={fee?.maxAmount || 0}
                                    />
                                  )
                                })}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}

                  <CreditNoteFormCalculation invoice={invoice} formikProps={formikProps} />
                </Card>
                <ButtonContainer>
                  <Button
                    disabled={!formikProps.isValid}
                    fullWidth
                    size="large"
                    onClick={formikProps.submitForm}
                  >
                    {translate('text_636bedf292786b19d3398f12')}
                  </Button>
                </ButtonContainer>
              </>
            )}
          </div>
        </Main>
        <Side>
          <CreditNoteCodeSnippet
            loading={loading}
            invoiceId={invoiceId as string}
            formValues={formikProps.values as CreditNoteForm}
            currency={currency}
          />
        </Side>
      </Content>

      <WarningDialog
        ref={warningDialogRef}
        title={translate('text_636bdf192a28e7cf28abf00d')}
        description={translate('text_636bed940028096908b735ed')}
        continueText={translate('text_636beda08285f03477c7e25e')}
        onContinue={() =>
          navigate(
            generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
              id,
              invoiceId,
              tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
            })
          )
        }
      />
    </div>
  )
}

export default CreateCreditNote

const StyledCard = styled.div<{ $loading?: boolean }>`
  border: 1px solid ${theme.palette.grey[300]};
  border-radius: 12px;
  box-sizing: border-box;
  padding: ${theme.spacing(4)};
  display: flex;
  align-items: center;

  > *:first-child {
    display: flex;
    margin-right: ${theme.spacing(3)};
  }

  ${({ $loading }) =>
    !$loading &&
    css`
      > *:last-child {
        margin-left: auto;
      }
    `}
`

const HeaderLine = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: ${theme.shadows[7]};
  height: ${HEADER_TABLE_HEIGHT}px;
`

const ButtonContainer = styled.div`
  padding: 0 ${theme.spacing(8)};
  margin-bottom: ${theme.spacing(20)};
`
