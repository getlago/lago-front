import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { Typography } from 'lago-design-system'
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'

import { DialogRef } from '~/components/designSystem'
import { RadioGroupField, SwitchField } from '~/components/form'
import { WarningDialog } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  InvoiceTypeEnum,
  OnTerminationCreditNoteEnum,
  OnTerminationInvoiceEnum,
  StatusTypeEnum,
  TerminateSubscriptionInput,
  useGetInvoicesForTerminationQuery,
  useTerminateCustomerSubscriptionMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

gql`
  mutation terminateCustomerSubscription($input: TerminateSubscriptionInput!) {
    terminateSubscription(input: $input) {
      id
      customer {
        id
        activeSubscriptionsCount
      }
    }
  }

  query getInvoicesForTermination(
    $subscriptionId: ID!
    $invoiceType: [InvoiceTypeEnum!]
    $limit: Int
  ) {
    invoices(subscriptionId: $subscriptionId, invoiceType: $invoiceType, limit: $limit) {
      collection {
        id
        number
        currency
        invoiceType
        refundableAmountCents
      }
    }
  }
`

interface TerminateCustomerSubscriptionDialogContext {
  id: string
  name: string
  status: StatusTypeEnum
  payInAdvance: boolean
  callback?: (() => unknown) | undefined
}

export interface TerminateCustomerSubscriptionDialogRef {
  openDialog: (subscriptionInfos: TerminateCustomerSubscriptionDialogContext) => unknown
  closeDialog: () => unknown
}

export const TerminateCustomerSubscriptionDialog =
  forwardRef<TerminateCustomerSubscriptionDialogRef>((_, ref) => {
    const { translate } = useInternationalization()
    const dialogRef = useRef<DialogRef>(null)
    const [context, setContext] = useState<TerminateCustomerSubscriptionDialogContext>()

    const { organization } = useOrganizationInfos()

    const { data: invoicesData } = useGetInvoicesForTerminationQuery({
      variables: {
        subscriptionId: context?.id as string,
        invoiceType: [InvoiceTypeEnum.Subscription],
        limit: 1,
      },
      skip: !context?.id || !context?.payInAdvance,
    })

    const invoice = invoicesData?.invoices?.collection?.[0]
    const currency = invoice?.currency || organization?.defaultCurrency || CurrencyEnum.Usd

    const refundAmount = deserializeAmount(invoice?.refundableAmountCents, currency)

    const [terminate] = useTerminateCustomerSubscriptionMutation({
      refetchQueries: ['getCustomerSubscriptionForList', 'getSubscriptionsList'],
      onCompleted({ terminateSubscription }) {
        if (!!terminateSubscription) {
          addToast({
            severity: 'success',
            translateKey: 'text_62d953aa13c166a6a24cbaf4',
          })

          if (!!context?.callback) {
            context?.callback()
          }
        }
      },
    })

    useImperativeHandle(ref, () => ({
      openDialog: (infos) => {
        formikProps.resetForm()
        setContext(infos)
        dialogRef.current?.openDialog()
      },
      closeDialog: () => {
        dialogRef.current?.closeDialog()
      },
    }))

    const formikProps = useFormik({
      initialValues: {
        onTerminationInvoice: true,
        onTerminationCreditNote: OnTerminationCreditNoteEnum.Credit,
      },
      onSubmit: async (values) => {
        const payload: TerminateSubscriptionInput = {
          ...values,
          onTerminationInvoice: values.onTerminationInvoice
            ? OnTerminationInvoiceEnum.Generate
            : OnTerminationInvoiceEnum.Skip,
          onTerminationCreditNote: context?.payInAdvance
            ? values.onTerminationCreditNote
            : undefined,
          id: context?.id as string,
        }

        await terminate({ variables: { input: payload } })
      },
    })

    const content = useMemo(() => {
      if (context?.status === StatusTypeEnum.Pending) {
        return {
          title: translate('text_64a6d8cb9ed7d9007e7121ca'),
          description: translate('text_64a6d96f84411700a90dbf51', {
            subscriptionName: context?.name,
          }),
          continueText: translate('text_64a6d736c23125004817627f'),
        }
      }

      return {
        title: translate('text_62d7f6178ec94cd09370e2f3'),
        description: context?.payInAdvance
          ? translate('text_62d7f6178ec94cd09370e313')
          : translate('text_1753198825180e09v150qcko'),
        continueText: translate('text_62d7f6178ec94cd09370e351'),
      }
    }, [context])

    return (
      <WarningDialog
        ref={dialogRef}
        title={content.title}
        description={content.description}
        continueText={content.continueText}
        onContinue={() => formikProps.handleSubmit()}
      >
        {context?.status === StatusTypeEnum.Active && (
          <div className="mb-8 flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <div>
                <Typography variant="bodyHl" color="grey700">
                  {translate('text_62d904b97e690a881f2b867c')}
                </Typography>
                <Typography variant="caption">
                  {translate('text_1753198825180dxhl10ooij3')}
                </Typography>
              </div>
              <SwitchField
                formikProps={formikProps}
                name="onTerminationInvoice"
                label={translate('text_1753198825180w91fhv7612n')}
                subLabel={translate('text_1753274319009dha80usx9zz')}
              />
            </div>
            {context?.payInAdvance && (
              <div className="flex flex-col gap-4">
                <div>
                  <Typography variant="bodyHl" color="grey700">
                    {translate('text_1748341883774iypsrgem3hr')}
                  </Typography>
                  <Typography variant="caption">
                    {translate('text_1753198825180qo474uj3p5f', {
                      invoiceNumber: invoice?.number,
                    })}
                  </Typography>
                </div>

                <RadioGroupField
                  formikProps={formikProps}
                  name="onTerminationCreditNote"
                  optionLabelVariant="body"
                  options={[
                    {
                      label: translate('text_1753198825180a94n1872cz4'),
                      sublabel: translate('text_17531988251808so7qch9zrf'),
                      value: OnTerminationCreditNoteEnum.Credit,
                    },
                    refundAmount > 0
                      ? {
                          label: translate('text_1753198825180jnk5xbdev57'),
                          sublabel: translate('text_1753198825180bu4iaf2tczy'),
                          value: OnTerminationCreditNoteEnum.Refund,
                        }
                      : undefined,
                    {
                      label: translate('text_1753198825180jfv0xkobkl5'),
                      sublabel: translate('text_1753198825180k6hugot9xmt'),
                      value: OnTerminationCreditNoteEnum.Skip,
                    },
                  ].filter((option) => !!option)}
                />
              </div>
            )}
          </div>
        )}
      </WarningDialog>
    )
  })

TerminateCustomerSubscriptionDialog.displayName = 'TerminateCustomerSubscriptionDialog'
