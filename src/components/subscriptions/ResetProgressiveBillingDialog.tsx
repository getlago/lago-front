import { gql } from '@apollo/client'

import { Typography } from '~/components/designSystem/Typography'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { useResetSubscriptionProgressiveBillingMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation resetSubscriptionProgressiveBilling($input: UpdateSubscriptionInput!) {
    updateSubscription(input: $input) {
      id
      progressiveBillingDisabled
      usageThresholds {
        amountCents
        recurring
        thresholdDisplayName
      }
    }
  }
`

type ResetProgressiveBillingDialogProps = {
  subscriptionId: string
}

export const useResetProgressiveBillingDialog = () => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()

  const [resetProgressiveBilling] = useResetSubscriptionProgressiveBillingMutation({
    onCompleted({ updateSubscription: result }) {
      if (result?.id) {
        addToast({
          severity: 'success',
          translateKey: 'text_1738071730498resetsuccess',
        })
      }
    },
  })

  const openResetProgressiveBillingDialog = ({
    subscriptionId,
  }: ResetProgressiveBillingDialogProps) => {
    centralizedDialog.open({
      title: translate('text_17380717304987v96qpfimgc'),
      description: (
        <Typography variant="body" color="grey600">
          {translate('text_1738071730498zxzs6oy5tz3')}
        </Typography>
      ),
      colorVariant: 'danger',
      actionText: translate('text_1738071730498ht52blrjax6'),
      onAction: async () => {
        await resetProgressiveBilling({
          variables: {
            input: {
              id: subscriptionId,
              progressiveBillingDisabled: false,
              usageThresholds: [],
            },
          },
        })
      },
    })
  }

  return { openResetProgressiveBillingDialog }
}
