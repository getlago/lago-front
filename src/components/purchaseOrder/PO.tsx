import {
  PurchaseOrderAddButton,
  PurchaseOrderDynamicInputButton,
  PurchaseOrderEditButton,
  PurchaseOrderTrashButton,
} from './PurchaseOrderButtons'
import { PurchaseOrderDescription } from './PurchaseOrderDescription'
import { PurchaseOrderNumber } from './PurchaseOrderNumber'
import { PurchaseOrderRoot } from './PurchaseOrderRoot'
import { PurchaseOrderTitle } from './PurchaseOrderTitle'
import { normalizePurchaseOrderNumber } from './utils'

export { normalizePurchaseOrderNumber }

export const PO = Object.assign(PurchaseOrderRoot, {
  Title: PurchaseOrderTitle,
  Description: PurchaseOrderDescription,
  Number: PurchaseOrderNumber,
  AddButton: PurchaseOrderAddButton,
  EditButton: PurchaseOrderEditButton,
  TrashButton: PurchaseOrderTrashButton,
  DynamicInputButton: PurchaseOrderDynamicInputButton,
})
