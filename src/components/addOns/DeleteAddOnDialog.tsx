import { gql } from '@apollo/client'
import { forwardRef } from 'react'

import { Typography, DialogRef } from '~/components/designSystem'
import { DeleteAddOnFragment, useDeleteAddOnMutation } from '~/generated/graphql'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { useInternationalization } from '~/hooks/useInternationalization'
import { addToast } from '~/core/apolloClient'

gql`
  fragment DeleteAddOn on AddOn {
    id
    name
  }

  mutation deleteAddOn($input: DestroyAddOnInput!) {
    destroyAddOn(input: $input) {
      id
    }
  }
`

export interface DeleteAddOnDialogRef extends WarningDialogRef {}

interface DeleteAddOnDialogProps {
  addOn: DeleteAddOnFragment
}

export const DeleteAddOnDialog = forwardRef<DialogRef, DeleteAddOnDialogProps>(
  ({ addOn }: DeleteAddOnDialogProps, ref) => {
    const [deleteAddOn] = useDeleteAddOnMutation({
      onCompleted(data) {
        if (data && data.destroyAddOn) {
          addToast({
            message: translate('text_628b432fd8f2bc0105b9746f'),
            severity: 'success',
          })
        }
      },
      update(cache, { data }) {
        if (!data?.destroyAddOn) return
        const cacheId = cache.identify({
          id: data?.destroyAddOn.id,
          __typename: 'AddOn',
        })

        cache.evict({ id: cacheId })
      },
    })
    const { translate } = useInternationalization()

    return (
      <WarningDialog
        ref={ref}
        title={translate('text_629728388c4d2300e2d380ad', {
          addOnName: addOn.name,
        })}
        description={<Typography html={translate('text_629728388c4d2300e2d380c5')} />}
        onContinue={async () =>
          await deleteAddOn({
            variables: { input: { id: addOn.id } },
          })
        }
        continueText={translate('text_629728388c4d2300e2d380f5')}
      />
    )
  }
)

DeleteAddOnDialog.displayName = 'DeleteAddOnDialog'
