import { ReactNode } from 'react'
import { generatePath } from 'react-router'

import { ConnectionSettingsSections } from '~/components/connectionSelection/read/ConnectionSettingsSections'
import { ButtonLink } from '~/components/designSystem/ButtonLink'
import { EDIT_WALLET_ROUTE } from '~/core/router'
import { WalletDetailsFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const WALLET_EXTERNAL_APPS_CONTAINER_TEST_ID = 'wallet-external-apps-container'
export const WALLET_EXTERNAL_APPS_EDIT_PAYMENT_TEST_ID = 'wallet-external-apps-edit-payment'
export const WALLET_EXTERNAL_APPS_EDIT_ADDITIONAL_TEST_ID = 'wallet-external-apps-edit-additional'

type WalletExternalAppsProps = {
  wallet?: WalletDetailsFragment | null
  walletId?: string
  customerId?: string
  canEditWallet: boolean
}

const WalletExternalApps = ({
  wallet,
  walletId,
  customerId,
  canEditWallet,
}: WalletExternalAppsProps) => {
  const { translate } = useInternationalization()

  if (!wallet) {
    return
  }

  const renderEditLink = (
    routerState: Record<string, boolean>,
    dataTest: string,
  ): ReactNode | null => {
    if (!canEditWallet || !walletId || !customerId) return null

    return (
      <ButtonLink
        buttonProps={{ variant: 'inline' }}
        type="button"
        to={generatePath(EDIT_WALLET_ROUTE, { walletId, customerId })}
        routerState={routerState}
        data-test={dataTest}
      >
        {translate('text_62e161ceb87c201025388aa2')}
      </ButtonLink>
    )
  }

  return (
    <div data-test={WALLET_EXTERNAL_APPS_CONTAINER_TEST_ID} className="flex flex-col gap-12">
      <ConnectionSettingsSections
        connections={wallet.connections}
        customerId={wallet.customer?.id}
        externalCustomerId={wallet.customer?.externalId}
        selectedPaymentMethod={{
          paymentMethodType: wallet.paymentMethodType,
          paymentMethodId: wallet.paymentMethod?.id,
        }}
        paymentDescription={translate('text_1789557972391wk0smb0t3km')}
        additionalDescription={translate('text_1789557972392sivbc9oyt08')}
        paymentAction={renderEditLink(
          { openConnectionPaymentDrawer: true },
          WALLET_EXTERNAL_APPS_EDIT_PAYMENT_TEST_ID,
        )}
        additionalAction={renderEditLink(
          { openAdditionalIntegrationDrawer: true },
          WALLET_EXTERNAL_APPS_EDIT_ADDITIONAL_TEST_ID,
        )}
      />
    </div>
  )
}

export default WalletExternalApps
