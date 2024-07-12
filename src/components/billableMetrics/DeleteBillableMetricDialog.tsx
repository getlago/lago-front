import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef, Skeleton, Typography } from '~/components/designSystem'
import { WarningDialog } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  useDeleteBillableMetricMutation,
  useGetBillableMetricToDeleteQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteBillableMetricDialog on BillableMetric {
    id
    name
    draftInvoicesCount # This attribute is heavy computation, so this fragment should not be used in collection query
    activeSubscriptionsCount # This attribute is heavy computation, so this fragment should not be used in collection query
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
  const [billableMetricId, setBillableMetricId] = useState<string | undefined>(undefined)
  const { data, loading } = useGetBillableMetricToDeleteQuery({
    variables: { id: billableMetricId || '' },
    skip: !billableMetricId,
  })

  const billableMetric = data?.billableMetric

  const {
    id = '',
    name = '',
    draftInvoicesCount = 0,
    activeSubscriptionsCount = 0,
  } = billableMetric || {}

  const [deleteBillableMetric] = useDeleteBillableMetricMutation({
    onCompleted({ destroyBillableMetric }) {
      if (destroyBillableMetric) {
        addToast({
          message: translate('text_6256f9f1184d3301290c7299'),
          severity: 'success',
        })
      }
    },
    update(cache, { data: updateData }) {
      if (!updateData?.destroyBillableMetric) return
      const cacheId = cache.identify({
        id: updateData?.destroyBillableMetric.id,
        __typename: 'BillableMetric',
      })

      cache.evict({ id: cacheId })
    },
  })

  useImperativeHandle(ref, () => ({
    openDialog: (infos) => {
      setBillableMetricId(infos)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  return (
    <WarningDialog
      ref={dialogRef}
      disableOnContinue={loading}
      title={
        loading ? (
          <Skeleton variant="text" width="100%" height={16} marginBottom={20} />
        ) : (
          translate('text_6256f824b6368e01153caa47', {
            billableMetricName: name,
          })
        )
      }
      description={
        loading ? (
          <>
            <Skeleton variant="text" width="100%" marginBottom={16} />
            <Skeleton variant="text" width="100%" marginBottom={16} />
            <Skeleton variant="text" width="100%" />
          </>
        ) : (billableMetric?.draftInvoicesCount || 0) > 0 ||
          billableMetric?.activeSubscriptionsCount ||
          0 ? (
          translate(
            'text_63c842d84a91637c3acf0395',
            draftInvoicesCount > 0 && activeSubscriptionsCount > 0
              ? {
                  usedObject1: translate(
                    'text_63c842ee2cd5dfeb173c2726',
                    { count: activeSubscriptionsCount },
                    activeSubscriptionsCount,
                  ),
                  usedObject2: translate(
                    'text_63c8431193e8aca80f14cced',
                    { count: draftInvoicesCount },
                    draftInvoicesCount,
                  ),
                }
              : {
                  usedObject1:
                    activeSubscriptionsCount > 0
                      ? translate(
                          'text_63c842ee2cd5dfeb173c2726',
                          { count: activeSubscriptionsCount },
                          activeSubscriptionsCount,
                        )
                      : translate(
                          'text_63c8431193e8aca80f14cced',
                          { count: draftInvoicesCount },
                          draftInvoicesCount,
                        ),
                },
            draftInvoicesCount > 0 && activeSubscriptionsCount > 0 ? 2 : 0,
          )
        ) : (
          <Typography html={translate('text_6256f824b6368e01153caa49')} />
        )
      }
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
