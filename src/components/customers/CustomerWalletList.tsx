import { forwardRef, MutableRefObject } from 'react'

import { Typography, Button } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { SectionHeader, SideSection } from '~/styles/customer'

import { AddWalletToCustomerDialogRef } from './AddWalletToCustomerDialog'

export const CustomerWalletsList = forwardRef<AddWalletToCustomerDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const hasNoWallet = true // TODO: fetch wallets in this component

  return (
    <SideSection $empty={hasNoWallet}>
      <SectionHeader variant="subhead">
        {translate('text_62d175066d2dbf1d50bc9384')}
        <Button
          variant="quaternary"
          onClick={() =>
            (ref as MutableRefObject<AddWalletToCustomerDialogRef>)?.current?.openDialog()
          }
        >
          {hasNoWallet ? translate('text_62d175066d2dbf1d50bc9382') : 'TODO'}
        </Button>
      </SectionHeader>
      {hasNoWallet ? (
        <Typography>{translate('text_62d175066d2dbf1d50bc9386')}</Typography>
      ) : (
        <>TODO: Display wallet list</>
      )}
    </SideSection>
  )
})

CustomerWalletsList.displayName = 'CustomerWalletsList'
