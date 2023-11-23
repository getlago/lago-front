import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef, Typography } from '~/components/designSystem'
import { WarningDialog } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { BillableMetricItemFragment, useDeleteBillableMetricMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteBillableMetricDialog on BillableMetric {
    id
    name
    draftInvoicesCount
    activeSubscriptionsCount
  }

  mutation deleteBillableMetric($input: DestroyBillableMetricInput!) {
    destroyBillableMetric(input: $input) {
      id
    }
  }
`

export interface DeleteBillableMetricDialogRef {
  openDialog: (billableMetric: BillableMetricItemFragment) => unknown
  closeDialog: () => unknown
}

export const DeleteBillableMetricDialog = forwardRef<DeleteBillableMetricDialogRef>((_, ref) => {
  const dialogRef = useRef<DialogRef>(null)
  const { translate } = useInternationalization()
  const [billableMetric, setBillableMetric] = useState<BillableMetricItemFragment | undefined>(
    undefined,
  )

  const {
    id = '',
    name = '',
    draftInvoicesCount = 0,
    activeSubscriptionsCount = 0,
  } = billableMetric || {}

  const [deleteBillableMetric] = useDeleteBillableMetricMutation({
    onCompleted(data) {
      if (data && data.destroyBillableMetric) {
        addToast({
          message: translate('text_6256f9f1184d3301290c7299'),
          severity: 'success',
        })
      }
    },
    update(cache, { data }) {
      if (!data?.destroyBillableMetric) return
      const cacheId = cache.identify({
        id: data?.destroyBillableMetric.id,
        __typename: 'BillableMetric',
      })

      cache.evict({ id: cacheId })
    },
  })

  useImperativeHandle(ref, () => ({
    openDialog: (infos) => {
      setBillableMetric(infos)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  return (
    <WarningDialog
      ref={dialogRef}
      title={translate('text_6256f824b6368e01153caa47', {
        billableMetricName: name,
      })}
      description={
        (billableMetric?.draftInvoicesCount || 0) > 0 ||
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
