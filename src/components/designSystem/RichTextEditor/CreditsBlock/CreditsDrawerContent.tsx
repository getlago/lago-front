import { type MutableRefObject, useEffect, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Selector, SelectorActions } from '~/components/designSystem/Selector'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import {
  freeAndPaidToItem,
  itemToFreeAndPaid,
  itemToRecurring,
  itemToScope,
  itemToSettings,
  recurringToItem,
  scopeToItem,
  settingsToItem,
} from '~/components/wallets/tanstackForm/walletFormSchema'
import type { WalletFormItem } from '~/core/serializers/serializeQuoteWallets'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { useWalletFreeAndPaidCreditsDrawer } from './useWalletFreeAndPaidCreditsDrawer'
import { useWalletRecurringTopUpDrawer } from './useWalletRecurringTopUpDrawer'
import { useWalletScopeDrawer } from './useWalletScopeDrawer'
import { useWalletSettingsDrawer } from './useWalletSettingsDrawer'

interface CreditsDrawerContentProps {
  stateRef: MutableRefObject<WalletFormItem>
  initialItem: WalletFormItem
  currency: CurrencyEnum
}

export function CreditsDrawerContent({
  stateRef,
  initialItem,
  currency,
}: Readonly<CreditsDrawerContentProps>) {
  const { translate } = useInternationalization()
  const [item, setItem] = useState<WalletFormItem>(initialItem)

  // Mirror local draft into the parent ref so the top-level Save reads it.
  useEffect(() => {
    stateRef.current = item
  }, [item, stateRef])

  const settingsDrawer = useWalletSettingsDrawer(
    (s) => setItem((prev) => settingsToItem(prev, s)),
    currency,
  )
  const scopeDrawer = useWalletScopeDrawer((s) => setItem((prev) => scopeToItem(prev, s)))
  const freeAndPaidDrawer = useWalletFreeAndPaidCreditsDrawer(
    (s) => setItem((prev) => freeAndPaidToItem(prev, s)),
    {
      currency,
      rateAmount: item.rateAmount,
      walletName: item.name ?? '',
      min: item.paidTopUpMinAmountCents,
      max: item.paidTopUpMaxAmountCents,
    },
  )
  const recurringDrawer = useWalletRecurringTopUpDrawer(
    (s) => setItem((prev) => recurringToItem(prev, s)),
    { currency, rateAmount: item.rateAmount },
  )

  const endChevron = (
    <Tooltip placement="top-end" title={translate('text_63e51ef4985f0ebd75c212fc')}>
      <Button icon="chevron-right-filled" variant="quaternary" tabIndex={-1} />
    </Tooltip>
  )

  const hoverEdit = (onEdit: () => void) => (
    <SelectorActions
      actions={[
        {
          icon: 'pen',
          tooltipCopy: translate('text_63e51ef4985f0ebd75c212fc'),
          onClick: (e) => {
            e.stopPropagation()
            onEdit()
          },
        },
      ]}
    />
  )

  const openSettings = () => settingsDrawer.openDrawer(itemToSettings(item))
  const openScope = () => scopeDrawer.openDrawer(itemToScope(item))
  const openFreeAndPaid = () => freeAndPaidDrawer.openDrawer(itemToFreeAndPaid(item))
  const openRecurring = () => recurringDrawer.openDrawer(itemToRecurring(item))

  return (
    <CenteredPage.SubsectionWrapper>
      <div className="flex flex-col gap-1">
        <Typography variant="headline">{translate('text_1783352692385rxn8gajgtw4')}</Typography>
        <Typography variant="body" color="grey600">
          {translate('text_1783352692385djf5dxfo8l5')}
        </Typography>
      </div>

      <CenteredPage.PageSection>
        <CenteredPage.PageSectionTitle
          title={translate('text_17833526923851igosmn1oar')}
          description={translate('text_1783352692385hz7bj9un6gr')}
        />
        <Selector
          icon="wallet"
          title={translate('text_17833526923851igosmn1oar')}
          endContent={endChevron}
          hoverActions={hoverEdit(openSettings)}
          onClick={openSettings}
        />
      </CenteredPage.PageSection>

      <CenteredPage.PageSection>
        <CenteredPage.PageSectionTitle
          title={translate('text_178335269238576yarvlompv')}
          description={translate('text_1783352692385a04ln0put4m')}
        />
        <Selector
          icon="wallet"
          title={translate('text_178335269238576yarvlompv')}
          endContent={endChevron}
          hoverActions={hoverEdit(openScope)}
          onClick={openScope}
        />
      </CenteredPage.PageSection>

      <CenteredPage.PageSection>
        <CenteredPage.PageSectionTitle
          title={translate('text_1783352692385e6ttj3xne6k')}
          description={translate('text_17833526923856caxxme9l8x')}
        />
        <Selector
          icon="wallet"
          title={translate('text_1783352692385e6ttj3xne6k')}
          endContent={endChevron}
          hoverActions={hoverEdit(openFreeAndPaid)}
          onClick={openFreeAndPaid}
        />
      </CenteredPage.PageSection>

      <CenteredPage.PageSection>
        <CenteredPage.PageSectionTitle
          title={translate('text_1783352692385mulfe6vb211')}
          description={translate('text_1783352692385xcnr96jj40l')}
        />
        <Selector
          icon="wallet"
          title={translate('text_1783352692385mulfe6vb211')}
          endContent={endChevron}
          hoverActions={hoverEdit(openRecurring)}
          onClick={openRecurring}
        />
      </CenteredPage.PageSection>
    </CenteredPage.SubsectionWrapper>
  )
}
