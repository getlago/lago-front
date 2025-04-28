import { gql } from '@apollo/client'
import { Box, Stack } from '@mui/material'
import { FormikProps } from 'formik'
import { DateTime } from 'luxon'
import { FC, useMemo } from 'react'

import { Alert, Skeleton, Table, Typography } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { OverviewCard } from '~/components/OverviewCard'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { isSameDay } from '~/core/timezone'
import { LocaleEnum } from '~/core/translations'
import {
  CurrencyEnum,
  InvoicesForRequestOverduePaymentFormFragment,
  LastPaymentRequestFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment CustomerForRequestOverduePaymentForm on Customer {
    email
  }

  fragment InvoicesForRequestOverduePaymentForm on Invoice {
    id
    number
    totalDueAmountCents
    currency
    issuingDate
  }

  fragment LastPaymentRequest on PaymentRequest {
    createdAt
  }
`

export interface CustomerRequestOverduePaymentForm {
  emails: string
}

interface RequestPaymentFormProps {
  invoicesLoading: boolean
  formikProps: FormikProps<CustomerRequestOverduePaymentForm>
  overdueAmount: number
  currency: CurrencyEnum
  invoices: InvoicesForRequestOverduePaymentFormFragment[]
  lastSentDate?: LastPaymentRequestFragment
}

export const RequestPaymentForm: FC<RequestPaymentFormProps> = ({
  invoicesLoading,
  formikProps,
  overdueAmount,
  currency,
  invoices,
  lastSentDate,
}) => {
  const { translate } = useInternationalization()

  const amount = intlFormatNumber(overdueAmount, { currency, currencyDisplay: 'narrowSymbol' })
  const count = invoices.length

  const date = useMemo(() => DateTime.fromISO(lastSentDate?.createdAt).toUTC(), [lastSentDate])
  const today = useMemo(() => DateTime.now().toUTC(), [])

  return (
    <div className="flex flex-col gap-10 md:max-w-168">
      {isSameDay(date, today) && (
        <Alert type="info">
          <Typography variant="body" color="textSecondary">
            {translate('text_66b4f00bd67ccc185ea75c70', {
              relativeDay: date.toRelativeCalendar({ locale: LocaleEnum.en }),
              time: date.toLocaleString(DateTime.TIME_24_WITH_SHORT_OFFSET),
            })}
          </Typography>
        </Alert>
      )}
      {invoicesLoading ? (
        <div>
          <Box marginBottom={10}>
            <Skeleton variant="text" className="w-80" />
          </Box>
          <Stack gap={6}>
            <Skeleton variant="text" className="w-120" />
            <Skeleton variant="text" className="w-40" />
          </Stack>
        </div>
      ) : (
        <>
          <header className="flex flex-col gap-3">
            <Typography variant="headline" color="textSecondary">
              {translate('text_66b258f62100490d0eb5ca86', { amount })}
            </Typography>
            <Typography>{translate('text_66b258f62100490d0eb5ca87')}</Typography>
          </header>

          <TextInputField
            formikProps={formikProps}
            name="emails"
            beforeChangeFormatter={['lowercase']}
            placeholder={translate('text_66b25bc7a069220091457628')}
            label={translate('text_66b258f62100490d0eb5ca88')}
            description={translate('text_66b258f62100490d0eb5ca89')}
          />
        </>
      )}
      <OverviewCard
        title={translate('text_6670a7222702d70114cc795a')}
        caption={translate('text_6670a7222702d70114cc795c', { count }, count)}
        tooltipContent={translate('text_6670a2a7ae3562006c4ee3e7')}
        content={amount}
        isAccentContent
        isLoading={invoicesLoading}
      />
      <Table
        name="overdue-invoices"
        containerSize={{
          default: 0,
        }}
        data={invoices}
        isLoading={invoicesLoading}
        columns={[
          {
            key: 'number',
            title: translate('text_634687079be251fdb43833fb'),
            maxSpace: true,
            content: ({ number }) => (
              <Typography variant="body" noWrap>
                {number}
              </Typography>
            ),
          },
          {
            key: 'totalDueAmountCents',
            title: translate('text_17374735502775afvcm9pqxk'),
            textAlign: 'right',
            content: (row) => (
              <Typography variant="bodyHl" color="textSecondary" noWrap>
                {intlFormatNumber(
                  deserializeAmount(row.totalDueAmountCents, row.currency || currency),
                  {
                    currency: row.currency || currency,
                    currencyDisplay: 'narrowSymbol',
                  },
                )}
              </Typography>
            ),
          },
          {
            key: 'issuingDate',
            title: translate('text_634687079be251fdb4383407'),
            content: ({ issuingDate }) => (
              <Typography variant="body" noWrap>
                {DateTime.fromISO(issuingDate).toLocaleString(DateTime.DATE_MED, {
                  locale: LocaleEnum.en,
                })}
              </Typography>
            ),
          },
        ]}
      />
    </div>
  )
}
