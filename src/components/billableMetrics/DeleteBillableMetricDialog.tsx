import { gql } from '@apollo/client'
import { forwardRef } from 'react'

import { Typography, DialogRef } from '~/components/designSystem'
import {
  DeleteBillableMetricDialogFragment,
  useDeleteBillableMetricMutation,
} from '~/generated/graphql'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { useI18nContext } from '~/core/I18nContext'
import { addToast } from '~/core/apolloClient'

gql`
  fragment DeleteBillableMetricDialog on BillableMetric {
    id
    name
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
    const { translate } = useI18nContext()

    return (
      <WarningDialog
        ref={ref}
        title={translate('text_6256f824b6368e01153caa47', {
          billableMetricName: billableMetric.name,
        })}
        description={<Typography html={translate('text_6256f824b6368e01153caa49')} />}
        onContinue={async () =>
          await deleteBillableMetric({
            variables: { input: { id: billableMetric.id } },
          })
        }
        continueText={translate('text_6256f824b6368e01153caa4d')}
      />
    )
  }
)

DeleteBillableMetricDialog.displayName = 'DeleteBillableMetricDialog'
