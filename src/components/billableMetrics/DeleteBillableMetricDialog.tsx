import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef } from 'react'

import { DialogRef, Skeleton } from '~/components/designSystem'
import { WarningDialog } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  useDeleteBillableMetricMutation,
  useGetBillableMetricToDeleteLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteBillableMetricDialog on BillableMetric {
    id
    name
    hasDraftInvoices
    hasActiveSubscriptions
  }

  query getBillableMetricToDelete($id: ID!) {
    billableMetric(id: $id) {
      ...DeleteBillableMetricDialog
    }
  }

  mutation deleteBillableMetric($input: DestroyBillableMetricInput!) {
    destroyBillableMetric(input: $input) {
      id
    }
  }
`

export interface DeleteBillableMetricDialogRef {
  openDialog: (billableMetricId: string) => unknown
  closeDialog: () => unknown
}

export const DeleteBillableMetricDialog = forwardRef<DeleteBillableMetricDialogRef>((_, ref) => {
  const dialogRef = useRef<DialogRef>(null)
  const { translate } = useInternationalization()
  const [getBillableMetricToDelete, { data, loading }] = useGetBillableMetricToDeleteLazyQuery()

  const billableMetric = data?.billableMetric

  const { id = '', name = '', hasDraftInvoices, hasActiveSubscriptions } = billableMetric || {}

  const [deleteBillableMetric] = useDeleteBillableMetricMutation({
    onCompleted({ destroyBillableMetric }) {
      if (destroyBillableMetric) {
        addToast({
          message: translate('text_6256f9f1184d3301290c7299'),
          severity: 'success',
        })
      }
    },
    refetchQueries: ['billableMetrics'],
  })

  useImperativeHandle(ref, () => ({
    openDialog: (billableMetricId) => {
      getBillableMetricToDelete({ variables: { id: billableMetricId } })
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  const getDescription = () => {
    if (loading) {
      return (
        <>
          <Skeleton className="mb-4 w-full" variant="text" />
          <Skeleton className="mb-4 w-full" variant="text" />
          <Skeleton className="w-full" variant="text" />
        </>
      )
    }

    if (!!hasDraftInvoices || !!hasActiveSubscriptions) {
      return translate(
        'text_63c842d84a91637c3acf0395',
        !!hasDraftInvoices && !!hasActiveSubscriptions
          ? {
              usedObject1: translate('text_63c842ee2cd5dfeb173c2726'),
              usedObject2: translate('text_63c8431193e8aca80f14cced'),
            }
          : {
              usedObject1: !!hasActiveSubscriptions
                ? translate('text_63c842ee2cd5dfeb173c2726')
                : translate('text_63c8431193e8aca80f14cced'),
            },
        !!hasDraftInvoices && !!hasActiveSubscriptions ? 2 : 0,
      )
    }

    return translate('text_6256f824b6368e01153caa49')
  }

  return (
    <WarningDialog
      ref={dialogRef}
      disableOnContinue={loading}
      title={
        loading ? (
          <Skeleton className="mb-5 h-4 w-full" variant="text" />
        ) : (
          translate('text_6256f824b6368e01153caa47', {
            billableMetricName: name,
          })
        )
      }
      description={getDescription()}
      onContinue={async () =>
        await deleteBillableMetric({
          variables: { input: { id } },
        })
      }
      continueText={translate('text_6256f824b6368e01153caa4d')}
    />
  )
})

DeleteBillableMetricDialog.displayName = 'DeleteBillableMetricDialog'
