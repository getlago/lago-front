import { useMemo, useRef } from 'react'

import type { ConnectionFormValues, CustomerConnectionDrawerRef } from './CustomerConnectionDrawer'
import type { LockedConnectionSelection } from './ProviderSelectionSection'
import { ConnectionCategory } from './types'

/**
 * Shared entry-point logic for the connection editor drawer: the mount site
 * renders `<CustomerConnectionDrawer ref={drawerRef} ... />` (choosing its own
 * persistence strategy via `onSave`) and drives it through `openCreate` /
 * `openEdit` — from the "Add a connection" menu, a row click (create/edit) or
 * the information view's Edit link.
 */
export const useCustomerConnectionDrawer = () => {
  const drawerRef = useRef<CustomerConnectionDrawerRef>(null)

  return useMemo(
    () => ({
      drawerRef,
      openCreate: (category: ConnectionCategory) => {
        drawerRef.current?.openDrawer(category)
      },
      openEdit: (
        category: ConnectionCategory,
        initialValues: Partial<ConnectionFormValues>,
        lockedSelection?: LockedConnectionSelection,
      ) => {
        drawerRef.current?.openDrawer(category, initialValues, lockedSelection)
      },
    }),
    [],
  )
}
