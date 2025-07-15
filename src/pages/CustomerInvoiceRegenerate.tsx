import { gql } from '@apollo/client'
import { Alert, Button, GenericPlaceholder, Typography } from 'lago-design-system'
import { isNumber } from 'lodash'
import { useRef, useState } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import {
  DeleteAdjustedFeeDialog,
  DeleteAdjustedFeeDialogRef,
} from '~/components/invoices/details/DeleteAdjustedFeeDialog'
import { EditFeeDrawer, EditFeeDrawerRef } from '~/components/invoices/details/EditFeeDrawer'
import { InvoiceDetailsTable } from '~/components/invoices/details/InvoiceDetailsTable'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { addToast } from '~/core/apolloClient'
import { CustomerInvoiceDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { CUSTOMER_INVOICE_DETAILS_ROUTE } from '~/core/router'
import { serializeAmount } from '~/core/serializers/serializeAmount'
import { formatDateToTZ } from '~/core/timezone'
import {
  Charge,
  ChargeModelEnum,
  CurrencyEnum,
  Customer,
  Fee,
  FeeAmountDetails,
  Invoice,
  useGetInvoiceDetailsQuery,
  usePreviewAdjustedFeeMutation,
  useRegenerateInvoiceMutation,
  useVoidInvoiceMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { InvoiceQuickInfo } from '~/pages/InvoiceOverview'
import ErrorImage from '~/public/images/maneki/error.svg'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

gql`
  mutation regenerateInvoice($input: RegenerateInvoiceInput!) {
    regenerateFromVoided(input: $input) {
      id
    }
  }

  mutation previewAdjustedFee($input: PreviewAdjustedFeeInput!) {
    previewAdjustedFee(input: $input) {
      id
      addOn {
        id
      }
      appliedTaxes {
        id
        amountCents
        taxRate
        taxName
      }
      amountDetails {
        freeUnits
        paidUnits
        perPackageSize
        perPackageUnitAmount
        graduatedRanges {
          flatUnitAmount
          fromValue
          perUnitAmount
          toValue
          units
          perUnitTotalAmount
        }
        graduatedPercentageRanges {
          flatUnitAmount
          fromValue
          rate
          toValue
          units
          perUnitTotalAmount
        }
      }
      amountCents
      invoiceName
      invoiceDisplayName
      units
      groupedBy
      charge {
        id
        payInAdvance
        minAmountCents
        chargeModel
        billableMetric {
          id
          name
        }
      }
      chargeFilter {
        invoiceDisplayName
        values
      }
      subscription {
        id
        plan {
          id
          interval
        }
      }
    }
  }
`

export type OnRegeneratedFeeAdd = (input: {
  feeId?: string | null
  unitPreciseAmount?: string | null
  invoiceDisplayName?: string | null
  units?: number | null
  amountDetails?: FeeAmountDetails | null
  charge?: Charge | null
  invoiceSubscriptionId?: string | null
}) => void

const CustomerInvoiceRegenerate = () => {
  const { translate } = useInternationalization()
  const { goBack } = useLocationHistory()
  const { customerId, invoiceId } = useParams()
  const navigate = useNavigate()

  const deleteAdjustedFeeDialogRef = useRef<DeleteAdjustedFeeDialogRef>(null)
  const editFeeDrawerRef = useRef<EditFeeDrawerRef>(null)

  const { data, loading, error } = useGetInvoiceDetailsQuery({
    variables: { id: invoiceId as string },
    skip: !invoiceId,
  })

  const invoice = data?.invoice as Invoice
  const customer = invoice?.customer
  const billingEntity = invoice?.billingEntity

  const [fees, setFees] = useState(invoice?.fees || [])

  const [regenerateInvoice] = useRegenerateInvoiceMutation({
    onCompleted(regeneratedData) {
      if (regeneratedData?.regenerateFromVoided?.id && customerId && invoiceId) {
        addToast({
          message: translate('text_17512809059243nam2ohm0ul'),
          severity: 'success',
        })

        navigate(
          generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
            customerId,
            invoiceId: regeneratedData?.regenerateFromVoided?.id || invoiceId,
            tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
          }),
        )
      }
    },
  })

  const [voidInvoice] = useVoidInvoiceMutation()
  const [previewAdjustedFee] = usePreviewAdjustedFeeMutation()

  const TEMPORARY_ID_PREFIX = 'temporary-id-fee-'

  const removeEmptyKeys = (obj: object) => {
    const keys = Object.keys(obj).filter((key) => !!obj[key as keyof typeof obj])

    return Object.fromEntries(keys.map((key) => [key, obj[key as keyof typeof obj]]))
  }

  const onAdd: OnRegeneratedFeeAdd = async (input) => {
    let feeWithCalculatedRanges = null

    const isGraduated =
      input?.amountDetails?.graduatedRanges ||
      (input?.charge?.chargeModel &&
        [ChargeModelEnum.Graduated, ChargeModelEnum.GraduatedPercentage].includes(
          input?.charge?.chargeModel,
        ))

    if (isGraduated) {
      const previewInput = {
        feeId: input?.feeId,
        invoiceId: invoiceId as string,
        units: input?.units,
        unitPreciseAmount: input?.unitPreciseAmount,
        invoiceSubscriptionId: input?.invoiceSubscriptionId,
        chargeId: input?.charge?.id,
      }

      const updatedFee = await previewAdjustedFee({
        variables: {
          input: {
            ...removeEmptyKeys(previewInput),
            invoiceId: invoiceId as string,
          },
        },
      })

      feeWithCalculatedRanges = updatedFee?.data?.previewAdjustedFee
    }

    const feeId = input.feeId ? input.feeId : `${TEMPORARY_ID_PREFIX}${Math.random().toString()}`

    const existing = fees.find((f) => f.id === feeId)

    const computeAmountCents = (
      units: number | string | null | undefined,
      unitPreciseAmount: number | string | null | undefined,
    ) => {
      return isNumber(units) && isNumber(unitPreciseAmount)
        ? {
            amountCents: serializeAmount(
              Number(units) * Number(unitPreciseAmount),
              invoice.currency as CurrencyEnum,
            ),
          }
        : {}
    }

    if (existing) {
      const units = input.units ?? existing.units
      const unitPreciseAmount = input.unitPreciseAmount
        ? Number(input.unitPreciseAmount)
        : existing.preciseUnitAmount

      let updated = {}

      if (feeWithCalculatedRanges) {
        updated = {
          ...existing,
          ...feeWithCalculatedRanges,
          adjustedFee: true,
          id: existing.id,
        }
      } else {
        updated = {
          ...existing,
          adjustedFee: true,
          id: existing.id,
          units,
          preciseUnitAmount: unitPreciseAmount,
          invoiceDisplayName: input.invoiceDisplayName ?? existing.invoiceDisplayName,
          ...computeAmountCents(units, unitPreciseAmount),
        }
      }

      const newFees = fees.map((fee) => (fee.id === feeId ? (updated as Fee) : fee))

      return setFees([...newFees])
    }

    const fee = {
      ...input,
      id: feeId,
      adjustedFee: true,
      preciseUnitAmount: Number(input.unitPreciseAmount || 0),
      ...computeAmountCents(input.units, input.unitPreciseAmount),
      appliedTaxes: invoice?.appliedTaxes,
    }

    return setFees((f) => [...f, fee as unknown as Fee])
  }

  const onDelete = (id: string) => {
    const existing = fees?.find((f) => f.id === id)

    if (existing) {
      return setFees((f) => f.filter((fee) => fee.id !== id))
    }
  }

  const onSubmit = async () => {
    if (!invoiceId) {
      return
    }

    if (!invoice?.voidedAt) {
      await voidInvoice({
        variables: {
          input: {
            id: invoiceId,
            generateCreditNote: false,
          },
        },
      })
    }

    const taxCodes = invoice?.appliedTaxes?.map((tax) => tax.taxCode).filter((code) => !!code)

    const feesInput = fees
      .map((fee) => ({
        id: fee.id?.includes(TEMPORARY_ID_PREFIX) ? null : fee.id,
        addOnId: fee.addOn?.id,
        chargeId: fee.charge?.id,
        description: fee.description,
        invoiceDisplayName: fee.invoiceDisplayName,
        subscriptionId: fee.subscription?.id,
        unitAmountCents: fee.preciseUnitAmount,
        taxCodes: (taxCodes?.length || 0) > 0 ? taxCodes : null,
        units: fee.units,
      }))
      .map((fee) => removeEmptyKeys(fee))

    await regenerateInvoice({
      variables: {
        input: {
          voidedInvoiceId: invoiceId,
          fees: feesInput,
        },
      },
    })
  }

  const onClose = () => {
    if (customerId && invoiceId) {
      goBack(
        generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
          customerId,
          invoiceId,
          tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
        }),
      )
    }
  }

  if (error) {
    return (
      <GenericPlaceholder
        className="pt-12"
        title={translate('text_634812d6f16b31ce5cbf4126')}
        subtitle={translate('text_634812d6f16b31ce5cbf4128')}
        buttonTitle={translate('text_634812d6f16b31ce5cbf412a')}
        buttonVariant="primary"
        buttonAction={() => location.reload()}
        image={<ErrorImage width="136" height="104" />}
      />
    )
  }

  return (
    <CenteredPage.Wrapper>
      <CenteredPage.Header>
        <Typography className="font-medium text-grey-700">
          {translate(
            !!invoice?.voidedAt ? 'text_1750678506388s7bfu2qjzhn' : 'text_17519912068281q4wys5q1g2',
          )}
        </Typography>

        <Button variant="quaternary" icon="close" onClick={() => onClose()} />
      </CenteredPage.Header>

      {loading && (
        <CenteredPage.Container>
          <FormLoadingSkeleton id="customer-invoice-regenerate" />
        </CenteredPage.Container>
      )}

      {!loading && (
        <>
          <CenteredPage.Container className="pb-12">
            <div className="flex flex-col gap-12">
              <Alert type="info">
                <Typography className="text-grey-700">
                  {!!invoice?.voidedAt
                    ? translate('text_17506785063887oto6r0hcq0', {
                        invoiceNumber: invoice?.number,
                        issuingDate: formatDateToTZ(
                          invoice?.issuingDate,
                          customer?.applicableTimezone,
                          'LLL. dd, yyyy',
                        ),
                        voidDate: formatDateToTZ(
                          invoice?.voidedAt,
                          customer?.applicableTimezone,
                          'LLL. dd, yyyy',
                        ),
                      })
                    : translate('text_1751991206828m0rxpmddapo', {
                        invoiceNumber: invoice?.number,
                        issuingDate: formatDateToTZ(
                          invoice?.issuingDate,
                          customer?.applicableTimezone,
                          'LLL. dd, yyyy',
                        ),
                      })}
                </Typography>
              </Alert>
              <div className="flex flex-col gap-1">
                <Typography className="text-2xl font-semibold text-grey-700">
                  {translate(
                    !!invoice?.voidedAt
                      ? 'text_1750678506388s7bfu2qjzhn'
                      : 'text_17519912068281q4wys5q1g2',
                  )}
                </Typography>

                <Typography className="text-grey-600">
                  {translate(
                    !!invoice?.voidedAt
                      ? 'text_1750678506388d8u5rv893gn'
                      : 'text_17519914705750hjw95snsdf',
                  )}
                </Typography>
              </div>
            </div>
          </CenteredPage.Container>

          <div className="px-40">
            {invoice && customer && billingEntity && (
              <InvoiceQuickInfo
                customer={customer}
                invoice={invoice}
                billingEntity={billingEntity}
              />
            )}
            <InvoiceDetailsTable
              customer={customer as Customer}
              invoice={invoice as Invoice}
              editFeeDrawerRef={editFeeDrawerRef}
              deleteAdjustedFeeDialogRef={deleteAdjustedFeeDialogRef}
              isDraftOverride={true}
              onAdd={onAdd}
              onDelete={onDelete}
              fees={fees}
            />
          </div>
        </>
      )}

      <CenteredPage.StickyFooter>
        <Button variant="quaternary" size="large" onClick={() => onClose()}>
          {translate('text_6411e6b530cb47007488b027')}
        </Button>

        <Button variant="primary" size="large" onClick={() => onSubmit()}>
          {translate(
            !!invoice?.voidedAt ? 'text_1750678506388ssxh1yacay0' : 'text_1751991518313o0xwbo9xf0y',
          )}
        </Button>
      </CenteredPage.StickyFooter>

      <DeleteAdjustedFeeDialog ref={deleteAdjustedFeeDialogRef} />
      <EditFeeDrawer ref={editFeeDrawerRef} />
    </CenteredPage.Wrapper>
  )
}

export default CustomerInvoiceRegenerate
