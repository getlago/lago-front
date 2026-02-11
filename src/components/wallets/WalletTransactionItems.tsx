import { Fragment } from 'react'
import { generatePath, Link } from 'react-router-dom'

import { Button, InfiniteScroll, Skeleton } from '~/components/designSystem'
import {
  DetailRow,
  GRID,
  TRANSACTION_STATUS_LABEL_MAP,
} from '~/components/wallets/WalletDetailsDrawer'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_DETAILS_TAB_ROUTE } from '~/core/router'
import { deserializeAmount, getCurrencyPrecision } from '~/core/serializers/serializeAmount'
import { DateFormat, intlFormatDateTime, TimeFormat } from '~/core/timezone'
import {
  CurrencyEnum,
  GetWalletTransactionConsumptionsQueryResult,
  GetWalletTransactionFundingsQueryResult,
  TimezoneEnum,
  WalletInfosForTransactionsFragment,
  WalletTransactionConsumptionItemFragment,
  WalletTransactionFundingItemFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { tw } from '~/styles/utils'

type WalletTransactionItem =
  | WalletTransactionFundingItemFragment
  | WalletTransactionConsumptionItemFragment

type WalletTransactionItemsProps = {
  isLoading: boolean
  error:
    | GetWalletTransactionConsumptionsQueryResult['error']
    | GetWalletTransactionFundingsQueryResult['error']
  transactions?: WalletTransactionItem[]
  isConsumption: boolean
  pagination: {
    currentPage?: number
    totalPages?: number
    fetchMore:
      | GetWalletTransactionConsumptionsQueryResult['fetchMore']
      | GetWalletTransactionFundingsQueryResult['fetchMore']
  }
  wallet?: WalletInfosForTransactionsFragment
  customerId?: string
  timezone?: TimezoneEnum
}

const WalletTransactionItems = ({
  isLoading,
  transactions,
  isConsumption,
  pagination,
  wallet,
  customerId,
  timezone,
}: WalletTransactionItemsProps) => {
  const { translate } = useInternationalization()

  const timestamp = (date: string) => {
    const d = intlFormatDateTime(date, {
      timezone,
      formatDate: DateFormat.DATE_FULL,
      formatTime: TimeFormat.TIME_WITH_SECONDS,
    })

    return `${d.date} ${d.time}`
  }

  if (isLoading) {
    return (
      <div className={tw(GRID)}>
        {[1, 2, 3, 4].map((i) => (
          <Fragment key={`loading-transaction-row-${i}`}>
            <Skeleton variant="text" className="w-28" />
            <Skeleton variant="text" className="w-28" />
            <Skeleton variant="text" className="w-28" />
            <Skeleton variant="text" className="w-28" />
          </Fragment>
        ))}
      </div>
    )
  }

  if (!transactions?.length) {
    return null
  }

  return (
    <InfiniteScroll
      onBottom={() => {
        const { currentPage = 0, totalPages = 0 } = pagination || {}

        currentPage < totalPages &&
          !isLoading &&
          pagination.fetchMore({
            variables: { page: currentPage + 1 },
          })
      }}
    >
      <div className="flex flex-col gap-12">
        {transactions?.map((transaction, index) => (
          <div
            className={tw(GRID, index !== transactions?.length - 1 && 'pb-12 shadow-b')}
            key={`wallet-transaction-consumption-${index}`}
          >
            <DetailRow
              label={translate('text_1770381610089b6q6j2poh3q')}
              value={
                <Link
                  target="_blank"
                  to={`${generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
                    customerId: (customerId as string) || '',
                    tab: 'wallet',
                  })}?walletId=${wallet?.id}&transactionId=${transaction?.walletTransaction?.id}`}
                >
                  <Button
                    className="visited:text-blue focus:underline focus:ring-0"
                    variant="inline"
                    endIcon="outside"
                  >
                    {transaction?.walletTransaction?.id}
                  </Button>
                </Link>
              }
            />
            <DetailRow
              label={translate('text_1770381610089as55cvn8fjk')}
              value={intlFormatNumber(
                deserializeAmount(transaction.amountCents, wallet?.currency || CurrencyEnum.Usd),
                {
                  currency: wallet?.currency,
                },
              )}
            />
            <DetailRow
              label={translate('text_1770381610089eg1vro120zy')}
              value={translate('text_62da6ec24a8e24e44f812872', {
                rateAmount: intlFormatNumber(wallet?.rateAmount || 0, {
                  currency: wallet?.currency,
                  minimumFractionDigits: getCurrencyPrecision(wallet?.currency || CurrencyEnum.Usd),
                  currencyDisplay: 'symbol',
                }),
              })}
            />
            <DetailRow
              label={translate('text_1741943835752ttg2ano3kju')}
              value={translate(
                'text_62da6ec24a8e24e44f812896',
                {
                  amount: Number(transaction?.creditAmount || 0),
                },
                Number(transaction?.creditAmount) || 0,
              )}
            />
            <DetailRow
              label={translate('text_1770381610089q933k8nf8ca')}
              value={translate(
                TRANSACTION_STATUS_LABEL_MAP[transaction?.walletTransaction?.transactionStatus],
              )}
            />
            <DetailRow
              label={translate(
                isConsumption ? 'text_1770381610089n22r3wjy68p' : 'text_1770381610089p8tpv093ns8',
              )}
              value={timestamp(transaction.createdAt)}
            />
          </div>
        ))}
      </div>
    </InfiniteScroll>
  )
}

export default WalletTransactionItems
