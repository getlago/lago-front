import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { Button, Drawer, DrawerRef } from '~/components/designSystem'
import {
    WalletInfosForTransactionsFragment,
    WalletTransactionForTransactionListItemFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

interface WalletDetailsDrawerState {
  transaction: WalletTransactionForTransactionListItemFragment
}

export interface WalletDetailsDrawerRef extends DrawerRef {
  openDrawer: (data?: WalletDetailsDrawerState) => unknown
  closeDrawer: () => unknown
}

interface WalletDetailsDrawerProps {
  wallet: WalletInfosForTransactionsFragment
}

export const WalletDetailsDrawer = forwardRef<WalletDetailsDrawerRef, WalletDetailsDrawerProps>(
  ({ wallet }: WalletDetailsDrawerProps, ref) => {
    const { translate } = useInternationalization()

    const drawerRef = useRef<DrawerRef>(null)
    const [localData, setLocalData] = useState<WalletDetailsDrawerState>()

    useImperativeHandle(ref, () => ({
      openDrawer: (data) => {
        setLocalData(data)
        drawerRef.current?.openDrawer()
      },
      closeDrawer: () => {
        setLocalData(undefined)
        drawerRef.current?.closeDrawer()
      },
    }))

    console.log(localData?.transaction.id)

    return (
      <Drawer
        className="px-12 pt-12"
        ref={drawerRef}
        title={translate('Transaction details')}
        onClose={drawerRef.current?.closeDrawer}
        stickyBottomBar={
          <Button size="large" onClick={() => drawerRef?.current?.closeDrawer()}>
            {translate('text_62f50d26c989ab03196884ae')}
          </Button>
        }
      >
        <div>Hello</div>
      </Drawer>
    )
  },
)

WalletDetailsDrawer.displayName = 'WalletDetailsDrawer'
