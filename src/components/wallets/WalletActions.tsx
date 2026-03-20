import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import { buildLinkToActivityLog } from '~/components/activityLogs/utils'
import { Button } from '~/components/designSystem/Button'
import { AvailableFiltersEnum } from '~/components/designSystem/Filters'
import { Popper } from '~/components/designSystem/Popper'
import { Tooltip } from '~/components/designSystem/Tooltip'
import {
  TerminateCustomerWalletDialog,
  TerminateCustomerWalletDialogRef,
} from '~/components/wallets/TerminateCustomerWalletDialog'
import {
  WALLET_ACTIONS_DATA_TEST,
  WALLET_TOPUP_BUTTON_DATA_TEST,
} from '~/components/wallets/utils/dataTestConstants'
import { VoidWalletDialog, VoidWalletDialogRef } from '~/components/wallets/VoidWalletDialog'
import { addToast } from '~/core/apolloClient'
import { CREATE_WALLET_TOP_UP_ROUTE, EDIT_WALLET_ROUTE, WALLET_DETAILS_ROUTE } from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { CurrencyEnum, WalletStatusEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useDeveloperTool } from '~/hooks/useDeveloperTool'
import { usePermissions } from '~/hooks/usePermissions'
import { WalletDetailsTabsOptionsEnum } from '~/pages/wallet/WalletDetails'
import { MenuPopper } from '~/styles/designSystem/PopperComponents'

type WalletActionsProps = {
  walletId?: string
  customerId?: string
  status?: WalletStatusEnum
  creditsBalance?: number
  trigger?: (onClick: React.MouseEventHandler) => React.ReactNode
  showActionsTooltip?: boolean
  currency?: CurrencyEnum
  rateAmount?: number
}

const WalletActions = ({
  walletId,
  customerId,
  status,
  creditsBalance,
  trigger,
  showActionsTooltip,
  rateAmount,
  currency,
}: WalletActionsProps) => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { isPremium } = useCurrentUser()
  const { setUrl, openPanel: open } = useDeveloperTool()
  const isWalletActive = status === WalletStatusEnum.Active
  const terminateCustomerWalletDialogRef = useRef<TerminateCustomerWalletDialogRef>(null)
  const voidWalletDialogRef = useRef<VoidWalletDialogRef>(null)

  if (!walletId || !customerId) {
    return null
  }

  return (
    <div className="pr-1">
      {isWalletActive && (
        <Popper
          PopperProps={{ placement: 'bottom-end' }}
          opener={({ onClick }) => (
            <Tooltip
              placement="top-start"
              title={translate('text_1741251836185jea576d14uj')}
              disableHoverListener={!showActionsTooltip}
            >
              {trigger?.((e) => {
                e.stopPropagation()
                onClick()
              }) || (
                <Button
                  variant="quaternary"
                  icon="dots-horizontal"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClick()
                  }}
                  data-test={WALLET_ACTIONS_DATA_TEST}
                />
              )}
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
                      walletId,
                      customerId: customerId ?? null,
                    }),
                  )
                  closePopper()
                }}
                data-test={WALLET_TOPUP_BUTTON_DATA_TEST}
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
                  copyToClipboard(walletId)
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
                        walletId,
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
                  disabled={!!creditsBalance && creditsBalance <= 0}
                  onClick={(e) => {
                    e.stopPropagation()

                    voidWalletDialogRef.current?.openDialog({
                      walletId,
                      rateAmount,
                      creditsBalance,
                      currency,
                    })

                    closePopper()
                  }}
                >
                  {translate('text_63720bd734e1344aea75b7e9')}
                </Button>
              )}
              <Button
                startIcon="bell"
                variant="quaternary"
                align="left"
                fullWidth
                onClick={(e) => {
                  e.stopPropagation()

                  navigate(
                    generatePath(WALLET_DETAILS_ROUTE, {
                      walletId,
                      customerId: customerId as string,
                      tab: WalletDetailsTabsOptionsEnum.alerts,
                    }),
                  )

                  closePopper()
                }}
              >
                {translate('text_1772536695408i54gtdrmatk')}
              </Button>
              {isPremium && hasPermissions(['auditLogsView']) && (
                <Button
                  startIcon="pulse"
                  variant="quaternary"
                  align="left"
                  fullWidth
                  onClick={(e) => {
                    e.stopPropagation()
                    const url = buildLinkToActivityLog(walletId, AvailableFiltersEnum.resourceIds)

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
                    terminateCustomerWalletDialogRef?.current?.openDialog({
                      walletId,
                    })
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

      <TerminateCustomerWalletDialog ref={terminateCustomerWalletDialogRef} />
      <VoidWalletDialog ref={voidWalletDialogRef} />
    </div>
  )
}

export default WalletActions
