import { gql, useApolloClient } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { WarningDialog, WarningDialogRef } from '~/components/designSystem/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import {
  FeatureForDeleteFeatureDialogFragment,
  GetFeaturesListDocument,
  useDestroyFeatureMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment FeatureForDeleteFeatureDialog on FeatureObject {
    id
  }

  mutation destroyFeature($input: DestroyFeatureInput!) {
    destroyFeature(input: $input) {
      id
    }
  }
`

interface DeleteFeatureDialogProps {
  feature: FeatureForDeleteFeatureDialogFragment | undefined
  callback?: () => void
}

export interface DeleteFeatureDialogRef {
  openDialog: (dialogData: DeleteFeatureDialogProps) => unknown
  closeDialog: () => unknown
}

export const DeleteFeatureDialog = forwardRef<DeleteFeatureDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<WarningDialogRef>(null)
  const [dialogData, setDialogData] = useState<DeleteFeatureDialogProps | undefined>(undefined)
  const client = useApolloClient()

  const [destroyFeature] = useDestroyFeatureMutation({
    onCompleted({ destroyFeature: destroyedFeature }) {
      if (destroyedFeature?.id) {
        dialogRef.current?.closeDialog()

        addToast({
          message: translate('text_1752692673070wmlmc9i3rjz'),
          severity: 'success',
        })

        evictFromCache(client, {
          id: destroyedFeature.id,
          __typename: 'FeatureObject',
          listFieldName: 'features',
          listQueryDocument: GetFeaturesListDocument,
        })

        dialogData?.callback?.()
      }
    },
  })

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setDialogData(data)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  return (
    <WarningDialog
      ref={dialogRef}
      title={translate('text_1752692673070h6yiax84d7x')}
      description={translate('text_1752693359315c6eoxf5szyk')}
      onContinue={async () => {
        await destroyFeature({
          variables: {
            input: {
              id: dialogData?.feature?.id || '',
            },
          },
        })
      }}
      continueText={translate('text_1752693359315sd2ms0qxvi3')}
    />
  )
})

DeleteFeatureDialog.displayName = 'DeleteFeatureDialog'
