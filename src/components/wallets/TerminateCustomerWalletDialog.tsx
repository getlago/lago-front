import { gql } from '@apollo/client'
import { forwardRef } from 'react'

import { DialogRef } from '~/components/designSystem'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
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

export type TerminateCustomerWalletDialogRef = WarningDialogRef

interface TerminateCustomerWalletDialogProps {
  walletId: string
}

export const TerminateCustomerWalletDialog = forwardRef<
  DialogRef,
  TerminateCustomerWalletDialogProps
>(({ walletId }: TerminateCustomerWalletDialogProps, ref) => {
  const { translate } = useInternationalization()
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

  return (
    <WarningDialog
      ref={ref}
      title={translate('text_62d9430e8b9fe36851cddd0b')}
      description={translate('text_62d9430e8b9fe36851cddd0f')}
      onContinue={async () =>
        await terminateWallet({
          variables: { input: { id: walletId } },
        })
      }
      continueText={translate('text_62d9430e8b9fe36851cddd17')}
    />
  )
})

TerminateCustomerWalletDialog.displayName = 'TerminateCustomerWalletDialog'
