import { gql } from '@apollo/client'
import { Alert, Button, GenericPlaceholder, Typography } from 'lago-design-system'
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
import { formatDateToTZ } from '~/core/timezone'
import {
  CreateAdjustedFeeInput,
  Customer,
  Fee,
  Invoice,
  useGetInvoiceDetailsQuery,
  useRegenerateInvoiceMutation,
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
`

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

  const invoice = data?.invoice
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
            invoiceId,
            tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
          }),
        )
      }
    },
  })

  const onAdd = (input: CreateAdjustedFeeInput) => {
    const existing = fees.find((f) => f.id === input.feeId)

    if (existing) {
      const updated = {
        ...existing,
        units: input.units ?? existing.units,
        preciseUnitAmount: input.unitPreciseAmount
          ? Number(input.unitPreciseAmount)
          : existing.preciseUnitAmount,
        invoiceDisplayName: input.invoiceDisplayName ?? existing.invoiceDisplayName,
        adjustedFee: true,
      }

      return setFees((f) => f.map((fee) => (fee.id === input.feeId ? (updated as Fee) : fee)))
    }

    const fee = {
      ...input,
      adjustedFee: true,
      ...(input.units && input.unitPreciseAmount
        ? {
            amountCents: Number(input.units) * Number(input.unitPreciseAmount),
          }
        : {}),
    }

    return setFees((f) => [...f, fee as unknown as Fee])
  }

  const onDelete = (id: string) => {
    const existing = invoice?.fees?.find((f) => f.id === id)

    if (existing) {
      return setFees((f) => f.map((fee) => (fee.id === id ? existing : fee)))
    }
  }

  const onSubmit = async () => {
    if (invoiceId) {
      await regenerateInvoice({
        variables: {
          input: {
            voidedInvoiceId: invoiceId,
            fees,
          },
        },
      })
    }
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
          {translate('text_1750678506388s7bfu2qjzhn')}
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
                  {translate('text_17506785063887oto6r0hcq0', {
                    invoiceNumber: invoice?.number,
                    issuingDate: formatDateToTZ(
                      invoice?.issuingDate,
                      customer?.applicableTimezone,
                      'LLL. dd, yyyy',
                    ),
                    voidDate: formatDateToTZ(
                      invoice?.issuingDate,
                      customer?.applicableTimezone,
                      'LLL. dd, yyyy',
                    ),
                  })}
                </Typography>
              </Alert>
              <div className="flex flex-col gap-1">
                <Typography className="text-2xl font-semibold text-grey-700">
                  {translate('text_1750678506388s7bfu2qjzhn', {
                    invoiceNumber: invoice?.number,
                  })}
                </Typography>

                <Typography className="text-grey-600">
                  {translate('text_1750678506388d8u5rv893gn')}
                </Typography>
              </div>
            </div>
          </CenteredPage.Container>

          <div className="px-40">
            {invoice && customer && billingEntity && (
              <InvoiceQuickInfo
                customer={customer}
                invoice={invoice as Partial<Invoice>}
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
          {translate('text_1750678506388ssxh1yacay0')}
        </Button>
      </CenteredPage.StickyFooter>

      <DeleteAdjustedFeeDialog ref={deleteAdjustedFeeDialogRef} />
      <EditFeeDrawer ref={editFeeDrawerRef} />
    </CenteredPage.Wrapper>
  )
}

export default CustomerInvoiceRegenerate
