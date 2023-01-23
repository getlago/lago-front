import { gql } from '@apollo/client'
import { forwardRef } from 'react'

import { Typography, DialogRef } from '~/components/designSystem'
import {
  DeleteBillableMetricDialogFragment,
  useDeleteBillableMetricMutation,
} from '~/generated/graphql'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { addToast } from '~/core/apolloClient'

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

export interface DeleteBillableMetricDialogRef extends WarningDialogRef {}

interface DeleteBillableMetricDialogProps {
  billableMetric: DeleteBillableMetricDialogFragment
}

export const DeleteBillableMetricDialog = forwardRef<DialogRef, DeleteBillableMetricDialogProps>(
  ({ billableMetric }: DeleteBillableMetricDialogProps, ref) => {
    const { id, name, draftInvoicesCount, activeSubscriptionsCount } = billableMetric
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
    const { translate } = useInternationalization()

    return (
      <WarningDialog
        ref={ref}
        title={translate('text_6256f824b6368e01153caa47', {
          billableMetricName: name,
        })}
        description={
          draftInvoicesCount > 0 || activeSubscriptionsCount || 0 ? (
            translate(
              'text_63c842d84a91637c3acf0395',
              draftInvoicesCount > 0 && activeSubscriptionsCount > 0
                ? {
                    usedObject1: translate(
                      'text_63c842ee2cd5dfeb173c2726',
                      { count: activeSubscriptionsCount },
                      activeSubscriptionsCount
                    ),
                    usedObject2: translate(
                      'text_63c8431193e8aca80f14cced',
                      { count: draftInvoicesCount },
                      draftInvoicesCount
                    ),
                  }
                : {
                    usedObject1:
                      activeSubscriptionsCount > 0
                        ? translate(
                            'text_63c842ee2cd5dfeb173c2726',
                            { count: activeSubscriptionsCount },
                            activeSubscriptionsCount
                          )
                        : translate(
                            'text_63c8431193e8aca80f14cced',
                            { count: draftInvoicesCount },
                            draftInvoicesCount
                          ),
                  },
              draftInvoicesCount > 0 && activeSubscriptionsCount > 0 ? 2 : 0
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
  }
)

DeleteBillableMetricDialog.displayName = 'DeleteBillableMetricDialog'
