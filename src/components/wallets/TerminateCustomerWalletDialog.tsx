import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { DialogRef } from '~/components/designSystem/Dialog'
import { WarningDialog } from '~/components/designSystem/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { CustomerDetailsTabsOptions } from '~/core/constants/tabsOptions'
import { CUSTOMER_DETAILS_TAB_ROUTE } from '~/core/router'
import {
  CustomerDetailsFragment,
  CustomerDetailsFragmentDoc,
  useTerminateCustomerWalletMutation,
  WalletAccordionFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation terminateCustomerWallet($input: TerminateCustomerWalletInput!) {
    terminateCustomerWallet(input: $input) {
      id
      status
      ...WalletAccordion
      customer {
        id
        hasActiveWallet
      }
    }
  }

  ${WalletAccordionFragmentDoc}
`

export type TerminateCustomerWalletDialogRef = {
  openDialog: (props?: { walletId?: string }) => unknown
  closeDialog: () => unknown
}

export const TerminateCustomerWalletDialog = forwardRef<TerminateCustomerWalletDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()
    const navigate = useNavigate()
    const [localData, setLocalData] = useState<{ walletId?: string } | null>(null)
    const dialogRef = useRef<DialogRef>(null)
    const { customerId } = useParams()

    const [terminateWallet] = useTerminateCustomerWalletMutation({
      onCompleted(res) {
        if (res?.terminateCustomerWallet) {
          addToast({
            severity: 'success',
            translateKey: 'text_62e257c032ae895bbfead62e',
          })
        }
      },
      update(cache, { data }) {
        if (!data?.terminateCustomerWallet) return

        const cacheId = `Customer:${data.terminateCustomerWallet.customer?.id}`

        const previousData: CustomerDetailsFragment | null = cache.readFragment({
          id: cacheId,
          fragment: CustomerDetailsFragmentDoc,
          fragmentName: 'CustomerDetails',
        })

        cache.writeFragment({
          id: cacheId,
          fragment: CustomerDetailsFragmentDoc,
          fragmentName: 'CustomerDetails',
          data: {
            ...previousData,
            hasActiveWallet: data.terminateCustomerWallet.customer?.hasActiveWallet,
          },
        })
      },
      refetchQueries: ['getCustomerWalletList'],
    })

    useImperativeHandle(ref, () => ({
      openDialog: (props) => {
        if (!props) {
          return
        }

        setLocalData(props)
        dialogRef.current?.openDialog()
      },
      closeDialog: () => dialogRef.current?.closeDialog(),
    }))

    return (
      <WarningDialog
        ref={dialogRef}
        title={translate('text_62d9430e8b9fe36851cddd0b')}
        description={translate('text_62d9430e8b9fe36851cddd0f')}
        onContinue={async () => {
          await terminateWallet({
            variables: { input: { id: localData?.walletId as string } },
          })

          navigate(
            generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
              customerId: customerId as string,
              tab: CustomerDetailsTabsOptions.wallet,
            }),
          )
        }}
        continueText={translate('text_62d9430e8b9fe36851cddd17')}
      />
    )
  },
)

TerminateCustomerWalletDialog.displayName = 'TerminateCustomerWalletDialog'
