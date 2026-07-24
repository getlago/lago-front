import { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'
import { SelectedPaymentMethod } from '~/components/paymentMethodSelection/types'
import {
  BillableMetricForWalletScopeSectionFragment,
  CreateCustomerWalletInput,
  UpdateCustomerWalletInput,
  WalletForScopeSectionFragment,
} from '~/generated/graphql'

// billableMetrics items come from two sources with identical minimal shapes: the
// existing wallet (`BillableMetric`) and the selection query (`SelectableBillableMetric`).
// Only id/name/code are ever read, so widen to a __typename-agnostic shape.
type WalletScopeBillableMetric = Pick<
  BillableMetricForWalletScopeSectionFragment,
  'id' | 'name' | 'code'
>

export type TWalletDataForm = Omit<CreateCustomerWalletInput, 'customerId' | 'name' | 'code'> &
  Omit<UpdateCustomerWalletInput, 'id' | 'name' | 'code'> & {
    // Always strings in the form ('' when unset) so they stay compatible
    // with NameAndCodeGroup's field mapping.
    name: string
    code: string
    appliesTo?: Omit<NonNullable<WalletForScopeSectionFragment['appliesTo']>, 'billableMetrics'> & {
      billableMetrics?: WalletScopeBillableMetric[] | null
    }
    paymentMethod?: SelectedPaymentMethod
    invoiceCustomSection?: InvoiceCustomSectionInput
  }
