import { tw } from '~/styles/utils'

import { PurchaseOrderContext } from './PurchaseOrderContext'
import { PurchaseOrderRootProps } from './types'
import { usePurchaseOrderNumberDialogs } from './usePurchaseOrderNumberDialogs'

export const PurchaseOrderRoot = ({
  children,
  className,
  description,
  disabled,
  onChange,
  value,
}: PurchaseOrderRootProps) => {
  const { openEditDialog } = usePurchaseOrderNumberDialogs({
    description,
    onChange,
    value,
  })
  const clearPurchaseOrderNumber = () => {
    void onChange?.(null)
  }

  return (
    <PurchaseOrderContext.Provider
      value={{
        value,
        description,
        disabled,
        openEditDialog,
        clearPurchaseOrderNumber,
      }}
    >
      <div className={tw('flex flex-col gap-3', className)}>{children}</div>
    </PurchaseOrderContext.Provider>
  )
}
