import { gql } from '@apollo/client'
import { Icon } from 'lago-design-system'
import { DateTime } from 'luxon'
import { FC, PropsWithChildren, RefObject, useMemo, useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { buildLinkToActivityLog } from '~/components/activityLogs/utils'
import {
  Accordion,
  Button,
  Card,
  Popper,
  Skeleton,
  Status,
  StatusProps,
  StatusType,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { AvailableFiltersEnum } from '~/components/designSystem/Filters'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { TimezoneDate } from '~/components/TimezoneDate'
import {
  TerminateCustomerWalletDialog,
  TerminateCustomerWalletDialogRef,
} from '~/components/wallets/TerminateCustomerWalletDialog'
import { VoidWalletDialog, VoidWalletDialogRef } from '~/components/wallets/VoidWalletDialog'
import { WalletTransactionList } from '~/components/wallets/WalletTransactionList'
import { WalletTransactionListItem } from '~/components/wallets/WalletTransactionListItem'
import { addToast } from '~/core/apolloClient'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CREATE_WALLET_TOP_UP_ROUTE, EDIT_WALLET_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { DateFormat, intlFormatDateTime, TimeFormat } from '~/core/timezone/utils'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  TimezoneEnum,
  WalletAccordionFragment,
  WalletInfosForTransactionsFragmentDoc,
  WalletStatusEnum,
  WalletTransactionSourceEnum,
  WalletTransactionStatusEnum,
  WalletTransactionTransactionTypeEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useDeveloperTool } from '~/hooks/useDeveloperTool'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import { MenuPopper } from '~/styles'
import { tw } from '~/styles/utils'

gql`
  fragment WalletAccordion on Wallet {
    id
    balanceCents
    consumedAmountCents
    consumedCredits
    createdAt
    creditsBalance
    currency
    expirationAt
    lastBalanceSyncAt
    lastConsumedCreditAt
    lastOngoingBalanceSyncAt
    name
    rateAmount
    status
    terminatedAt
    ongoingBalanceCents
    creditsOngoingBalance
    priority

    ...WalletInfosForTransactions
  }

  ${WalletInfosForTransactionsFragmentDoc}
`

const TODAY = DateTime.now().toISODate()

interface WalletAccordionProps {
  wallet: WalletAccordionFragment
  premiumWarningDialogRef: RefObject<PremiumWarningDialogRef>
  customerTimezone?: TimezoneEnum
}

const mapStatus = (type?: WalletStatusEnum | undefined): StatusProps => {
  switch (type) {
    case WalletStatusEnum.Active:
      return {
        type: StatusType.success,
        label: 'active',
      }
    default:
      return {
        type: StatusType.danger,
        label: 'terminated',
      }
  }
}

export const WalletAccordion: FC<WalletAccordionProps> = ({
  customerTimezone,
  premiumWarningDialogRef,
  wallet,
}) => {
  const {
    balanceCents,
    consumedAmountCents,
    consumedCredits,
    createdAt,
    creditsBalance,
    currency,
    expirationAt,
    lastBalanceSyncAt,
    lastConsumedCreditAt,
    lastOngoingBalanceSyncAt,
    name,
    rateAmount,
    status,
    terminatedAt,
    ongoingBalanceCents,
    creditsOngoingBalance,
    priority,
  } = wallet
  const { isPremium } = useCurrentUser()
  const { customerId } = useParams()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()
  const { setUrl, openPanel: open } = useDeveloperTool()

  const terminateCustomerWalletDialogRef = useRef<TerminateCustomerWalletDialogRef>(null)
  const voidWalletDialogRef = useRef<VoidWalletDialogRef>(null)

  const statusMap = mapStatus(status)
  const [creditAmountUnit = '0', creditAmountCents = '00'] = String(creditsBalance).split('.')
  const [consumedCreditUnit = '0', consumedCreditCents = '00'] =
    String(creditsOngoingBalance).split('.')
  const { translate } = useInternationalization()
  const isWalletActive = status === WalletStatusEnum.Active

  const { formattedLastOngoingBalanceSyncAt, formattedLastBalanceSyncAt } = useMemo(() => {
    const dateConfig = {
      timezone: TimezoneEnum.TzUtc,
      formatDate: DateFormat.DATE_MED,
      formatTime: TimeFormat.TIME_24_WITH_SECONDS,
    }

    const localFormattedLastOngoingBalanceSyncAt = intlFormatDateTime(
      lastOngoingBalanceSyncAt || DateTime.now(),
      dateConfig,
    )

    const localFormattedLastBalanceSyncAt = intlFormatDateTime(
      lastBalanceSyncAt || DateTime.now(),
      dateConfig,
    )

    return {
      formattedLastOngoingBalanceSyncAt: `${localFormattedLastOngoingBalanceSyncAt.date} ${localFormattedLastOngoingBalanceSyncAt.time} ${localFormattedLastOngoingBalanceSyncAt.timezone}`,
      formattedLastBalanceSyncAt: `${localFormattedLastBalanceSyncAt.date} ${localFormattedLastBalanceSyncAt.time} ${localFormattedLastBalanceSyncAt.timezone}`,
    }
  }, [lastOngoingBalanceSyncAt, lastBalanceSyncAt])

  return (
    <>
      <Accordion
        noContentMargin
        transitionProps={{ unmountOnExit: false }}
        summary={
          <div className="flex flex-1 items-center justify-between gap-3">
            <div className="flex flex-col">
              <Typography variant="bodyHl" color="grey700">
                {name ||
                  translate('text_62da6ec24a8e24e44f8128b2', {
                    createdAt: intlFormatDateTimeOrgaTZ(createdAt).date,
                  })}
              </Typography>
              <Typography variant="caption" color="grey600">
                {`${translate('text_62da6ec24a8e24e44f812872', {
                  rateAmount: intlFormatNumber(Number(rateAmount) || 0, {
                    currencyDisplay: 'symbol',
                    currency,
                  }),
                })} • ${translate('text_1755695821678c8hkgkxkh4', {
                  priority: priority,
                })}`}
              </Typography>
            </div>

            <div className="flex flex-row items-center gap-3">
              <Status {...statusMap} />

              {isWalletActive && (
                <Popper
                  PopperProps={{ placement: 'bottom-end' }}
                  opener={({ onClick }) => (
                    <Tooltip
                      placement="top-start"
                      title={translate('text_1741251836185jea576d14uj')}
                    >
                      <Button
                        variant="quaternary"
                        icon="dots-horizontal"
                        onClick={(e) => {
                          e.stopPropagation()
                          onClick()
                        }}
                      />
                    </Tooltip>
                  )}
                >
                  {({ closePopper }) => (
                    <MenuPopper>
                      <Button
                        startIcon="plus"
                        variant="quaternary"
                        align="left"
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(
                            generatePath(CREATE_WALLET_TOP_UP_ROUTE, {
                              walletId: wallet.id,
                              customerId: customerId ?? null,
                            }),
                          )
                          closePopper()
                        }}
                      >
                        {translate('text_1741253143637fb7iatyka9w')}
                      </Button>
                      <Button
                        startIcon="duplicate"
                        variant="quaternary"
                        align="left"
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation()
                          copyToClipboard(wallet.id)
                          addToast({
                            severity: 'info',
                            translateKey: 'text_1741253143637w2e9cbec620',
                          })
                          closePopper()
                        }}
                      >
                        {translate('text_1741253143637fwbbxxn9195')}
                      </Button>
                      {hasPermissions(['walletsUpdate']) && (
                        <Button
                          startIcon="pen"
                          variant="quaternary"
                          align="left"
                          fullWidth
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(
                              generatePath(EDIT_WALLET_ROUTE, {
                                walletId: wallet.id,
                                customerId: customerId ?? null,
                              }),
                            )
                            closePopper()
                          }}
                        >
                          {translate('text_62e161ceb87c201025388aa2')}
                        </Button>
                      )}
                      {hasPermissions(['walletsTerminate']) && (
                        <Button
                          startIcon="minus"
                          variant="quaternary"
                          align="left"
                          fullWidth
                          disabled={creditsBalance <= 0}
                          onClick={(e) => {
                            e.stopPropagation()
                            voidWalletDialogRef.current?.openDialog()
                            closePopper()
                          }}
                        >
                          {translate('text_63720bd734e1344aea75b7e9')}
                        </Button>
                      )}
                      {isPremium && hasPermissions(['auditLogsView']) && (
                        <Button
                          startIcon="pulse"
                          variant="quaternary"
                          align="left"
                          fullWidth
                          onClick={(e) => {
                            e.stopPropagation()
                            const url = buildLinkToActivityLog(
                              wallet.id,
                              AvailableFiltersEnum.resourceIds,
                            )

                            setUrl(url)
                            open()
                            closePopper()
                          }}
                        >
                          {translate('text_17494778224951pa9u6uvz3t')}
                        </Button>
                      )}
                      {hasPermissions(['walletsTerminate']) && (
                        <Button
                          startIcon="trash"
                          variant="quaternary"
                          align="left"
                          fullWidth
                          onClick={(e) => {
                            e.stopPropagation()
                            terminateCustomerWalletDialogRef?.current?.openDialog()
                            closePopper()
                          }}
                        >
                          {translate('text_62d9430e8b9fe36851cddd17')}
                        </Button>
                      )}
                    </MenuPopper>
                  )}
                </Popper>
              )}
            </div>
          </div>
        }
      >
        {({ isOpen }) => (
          <>
            {!isPremium && (
              <div className="flex items-center justify-between gap-4 bg-grey-100 p-4 shadow-y">
                <div>
                  <div className="flex flex-row items-baseline gap-1">
                    <Typography variant="bodyHl" color="grey700">
                      {translate('text_65ae73ebe3a66bec2b91d721')}
                    </Typography>

                    <Icon name="sparkles" />
                  </div>
                  <Typography variant="caption" color="grey600">
                    {translate('text_65ae73ebe3a66bec2b91d727')}
                  </Typography>
                </div>
                <Button
                  variant="tertiary"
                  endIcon="sparkles"
                  onClick={() => premiumWarningDialogRef.current?.openDialog()}
                >
                  {translate('text_65ae73ebe3a66bec2b91d72d')}
                </Button>
              </div>
            )}
            <div className="flex flex-row items-end gap-8 px-4 py-6 shadow-b">
              <div className="flex flex-col gap-1">
                <div className="flex items-center [&_*]:flex">
                  <Typography className="mr-1" variant="captionHl" color="grey600">
                    {translate('text_65ae73ebe3a66bec2b91d747')}
                  </Typography>
                  <Tooltip
                    className="flex h-5 items-end"
                    placement="bottom-start"
                    title={translate('text_65ae73ebe3a66bec2b91d741', {
                      date: formattedLastBalanceSyncAt,
                    })}
                  >
                    <Icon name="info-circle" />
                  </Tooltip>
                </div>
                <DetailSummaryLine className="items-baseline">
                  <Typography
                    color={isWalletActive ? 'grey700' : 'grey600'}
                    variant="subhead1"
                    noWrap
                  >
                    {creditAmountUnit}
                  </Typography>
                  <Typography
                    className="mr-1"
                    color={isWalletActive ? 'grey700' : 'grey600'}
                    variant="captionHl"
                  >
                    .{creditAmountCents}
                  </Typography>
                  <Typography color={isWalletActive ? 'grey700' : 'grey600'} variant="captionHl">
                    {translate(
                      'text_62da6ec24a8e24e44f81287a',
                      undefined,
                      Number(creditAmountUnit) || 0,
                    )}
                  </Typography>
                </DetailSummaryLine>
                <DetailSummaryLine>
                  <Typography color="grey600" variant="caption">
                    {intlFormatNumber(deserializeAmount(balanceCents, currency), {
                      currencyDisplay: 'symbol',
                      currency,
                    })}
                  </Typography>
                </DetailSummaryLine>
              </div>

              {isWalletActive && (
                <div className="flex flex-col gap-1">
                  <DetailSummaryLine>
                    <Typography className="mr-1" variant="captionHl" color="grey600">
                      {translate('text_65ae73ebe3a66bec2b91d75f')}
                    </Typography>
                    <Tooltip
                      className="flex h-5 items-end"
                      placement="bottom-start"
                      title={translate('text_65ae73ebe3a66bec2b91d749', {
                        date: formattedLastOngoingBalanceSyncAt,
                      })}
                    >
                      <Icon name="info-circle" />
                    </Tooltip>
                  </DetailSummaryLine>
                  <DetailSummaryLine className="items-baseline">
                    <Typography
                      blur={!isPremium}
                      color={isWalletActive ? 'grey700' : 'grey600'}
                      variant="subhead1"
                      noWrap
                    >
                      {isPremium ? consumedCreditUnit : '0'}
                    </Typography>
                    <Typography
                      className="mr-1"
                      blur={!isPremium}
                      color={isWalletActive ? 'grey700' : 'grey600'}
                      variant="captionHl"
                    >
                      .{isPremium ? consumedCreditCents : '00'}
                    </Typography>
                    <Typography
                      color={isWalletActive ? 'grey700' : 'grey600'}
                      variant="captionHl"
                      blur={!isPremium}
                    >
                      {translate(
                        'text_62da6ec24a8e24e44f812884',
                        undefined,
                        Number(consumedCreditUnit) || 0,
                      )}
                    </Typography>
                  </DetailSummaryLine>
                  <DetailSummaryLine>
                    <Typography color="grey600" variant="caption" blur={!isPremium}>
                      {intlFormatNumber(
                        deserializeAmount(isPremium ? ongoingBalanceCents : 0, currency),
                        {
                          currencyDisplay: 'symbol',
                          currency,
                        },
                      )}
                    </Typography>
                  </DetailSummaryLine>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <DetailSummaryLine>
                  <Typography color="grey500" variant="captionHl">
                    {isWalletActive
                      ? translate('text_62da6ec24a8e24e44f81288a')
                      : translate('text_62e2a2f2a79d60429eff3035')}
                  </Typography>
                </DetailSummaryLine>
                <DetailSummaryLine>
                  {!isWalletActive && (
                    <TimezoneDate
                      mainTypographyProps={{ variant: 'caption', color: 'grey700' }}
                      date={terminatedAt}
                      customerTimezone={customerTimezone}
                    />
                  )}
                  {isWalletActive && expirationAt && (
                    <TimezoneDate
                      mainTypographyProps={{ variant: 'caption', color: 'grey700' }}
                      date={expirationAt}
                      customerTimezone={customerTimezone}
                    />
                  )}
                  {isWalletActive && !expirationAt && (
                    <Typography color="grey700" variant="caption">
                      {translate('text_62da6ec24a8e24e44f81288c')}
                    </Typography>
                  )}
                </DetailSummaryLine>
              </div>
            </div>

            {isWalletActive && (
              <WalletTransactionListItem
                isRealTimeTransaction
                transaction={{
                  id: 'real-time-transaction-id',
                  amount: String(
                    deserializeAmount(wallet.ongoingUsageBalanceCents, wallet.currency),
                  ),
                  creditAmount: String(wallet.creditsOngoingUsageBalance),
                  createdAt: TODAY,
                  settledAt: TODAY,
                  wallet,
                  status: WalletTransactionStatusEnum.Settled,
                  transactionType: WalletTransactionTransactionTypeEnum.Outbound,
                  transactionStatus: undefined,
                  source: WalletTransactionSourceEnum.Manual,
                }}
                customerTimezone={customerTimezone}
                isWalletActive={isWalletActive}
              />
            )}

            <WalletTransactionList
              customerTimezone={customerTimezone}
              isOpen={isOpen}
              wallet={wallet}
              footer={
                <Typography
                  className="ml-auto flex items-center gap-1"
                  color="grey600"
                  variant="caption"
                >
                  {`${translate('text_65ae73ece3a66bec2b91d7d7')} ${consumedCredits} ${translate('text_62da6ec24a8e24e44f81287a', undefined, Number(consumedCredits) || 0)} | ${intlFormatNumber(
                    deserializeAmount(consumedAmountCents, currency),
                    {
                      currencyDisplay: 'symbol',
                      currency,
                    },
                  )}`}
                  <Tooltip
                    className="flex h-5 items-end"
                    placement="top-end"
                    title={translate('text_62da6db136909f52c2704c40', {
                      date: intlFormatDateTimeOrgaTZ(lastConsumedCreditAt || DateTime.now()).date,
                    })}
                  >
                    <Icon name="info-circle" />
                  </Tooltip>
                </Typography>
              }
            />
          </>
        )}
      </Accordion>

      {isWalletActive && (
        <>
          <TerminateCustomerWalletDialog
            ref={terminateCustomerWalletDialogRef}
            walletId={wallet.id}
          />
          <VoidWalletDialog ref={voidWalletDialogRef} wallet={wallet} />
        </>
      )}
    </>
  )
}

const DetailSummaryLine: FC<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => {
  return <div className={tw('flex items-center [&_*]:flex', className)}>{children}</div>
}

export const WalletAccordionSkeleton = () => {
  return (
    <Card className="p-4">
      <div className="flex flex-1 items-center gap-3">
        <Icon name="chevron-right" color="disabled" />
        <Skeleton variant="connectorAvatar" size="big" />
        <div className="w-full">
          <Skeleton variant="text" className="max-w-60" />
          <Skeleton variant="text" className="max-w-30" />
        </div>
      </div>
    </Card>
  )
}
