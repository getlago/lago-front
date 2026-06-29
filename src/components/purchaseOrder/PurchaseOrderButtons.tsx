import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { tw } from '~/styles/utils'

import { PURCHASE_ORDER_TRANSLATIONS } from './constants'
import { usePurchaseOrderContext } from './PurchaseOrderContext'
import { PurchaseOrderButtonProps } from './types'

export const PurchaseOrderAddButton = ({
  children,
  className,
  disabled,
  onClick,
}: PurchaseOrderButtonProps) => {
  const { translate } = useInternationalization()
  const { disabled: contextDisabled, openEditDialog } = usePurchaseOrderContext()

  return (
    <Button
      className={tw('self-start', className)}
      startIcon="plus"
      variant="inline"
      disabled={disabled || contextDisabled}
      onClick={onClick || openEditDialog}
    >
      {children || translate(PURCHASE_ORDER_TRANSLATIONS.add)}
    </Button>
  )
}

export const PurchaseOrderEditButton = ({
  children,
  className,
  disabled,
  onClick,
}: PurchaseOrderButtonProps) => {
  const { translate } = useInternationalization()
  const { disabled: contextDisabled, openEditDialog } = usePurchaseOrderContext()

  return children ? (
    <Button
      className={className}
      startIcon="pen"
      variant="inline"
      disabled={disabled || contextDisabled}
      onClick={onClick || openEditDialog}
    >
      {children}
    </Button>
  ) : (
    <Tooltip placement="top-end" title={translate('text_63e51ef4985f0ebd75c212fc')}>
      <Button
        className={className}
        icon="pen"
        size="small"
        variant="quaternary"
        disabled={disabled || contextDisabled}
        onClick={onClick || openEditDialog}
      />
    </Tooltip>
  )
}

export const PurchaseOrderTrashButton = ({
  className,
  disabled,
  onClick,
}: Omit<PurchaseOrderButtonProps, 'children'>) => {
  const { translate } = useInternationalization()
  const { clearPurchaseOrderNumber, disabled: contextDisabled } = usePurchaseOrderContext()

  return (
    <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
      <Button
        className={className}
        icon="trash"
        size="small"
        variant="quaternary"
        disabled={disabled || contextDisabled}
        onClick={onClick || clearPurchaseOrderNumber}
      />
    </Tooltip>
  )
}

export const PurchaseOrderDynamicInputButton = ({
  children,
  className,
  disabled,
  onClick,
}: PurchaseOrderButtonProps) => {
  const { translate } = useInternationalization()
  const { disabled: contextDisabled, openEditDialog } = usePurchaseOrderContext()

  return (
    <Button
      className={tw('self-start', className)}
      startIcon="plus"
      variant="inline"
      disabled={disabled || contextDisabled}
      onClick={onClick || openEditDialog}
    >
      {children || translate(PURCHASE_ORDER_TRANSLATIONS.addShort)}
    </Button>
  )
}
