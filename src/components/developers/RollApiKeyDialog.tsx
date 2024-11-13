import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { Button, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { addToast } from '~/core/apolloClient'
import { formatDateToTZ } from '~/core/timezone/utils'
import {
  ApiKeyForRollApiKeyDialogFragment,
  ApiKeyRevealedForApiKeysListFragment,
  ApiKeyRevealedForApiKeysListFragmentDoc,
  TimezoneEnum,
  useRotateApiKeyMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment ApiKeyForRollApiKeyDialog on SanitizedApiKey {
    id
    lastUsedAt
  }

  mutation rotateApiKey($input: RotateApiKeyInput!) {
    rotateApiKey(input: $input) {
      id
      ...ApiKeyRevealedForApiKeysList
    }
  }

  ${ApiKeyRevealedForApiKeysListFragmentDoc}
`

type RollApiKeyDialogProps = {
  apiKey: ApiKeyForRollApiKeyDialogFragment
  callBack: (itemToReveal: ApiKeyRevealedForApiKeysListFragment) => void
}

export interface RollApiKeyDialogRef {
  openDialog: (data: RollApiKeyDialogProps) => unknown
  closeDialog: () => unknown
}

export const RollApiKeyDialog = forwardRef<RollApiKeyDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<RollApiKeyDialogProps | undefined>(undefined)
  const apiKey = localData?.apiKey

  const [rotateApiKey] = useRotateApiKeyMutation({
    onCompleted(data) {
      if (!!data?.rotateApiKey?.id) {
        localData?.callBack(data.rotateApiKey)

        addToast({
          message: translate('text_1731506310510htbvgegpzd8'),
          severity: 'success',
        })
      }
    },
    refetchQueries: ['getApiKeys'],
  })

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setLocalData(data)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => {
      dialogRef.current?.closeDialog()
    },
  }))

  return (
    <Dialog
      ref={dialogRef}
      title={translate('text_173151476175058ugha8fd08')}
      description={translate('text_1731514761750dnh1s073j9o')}
      actions={({ closeDialog }) => (
        <>
          <Button variant="quaternary" onClick={closeDialog}>
            {translate('text_64352657267c3d916f962769')}
          </Button>
          <Button
            danger
            variant="primary"
            onClick={async () => {
              try {
                await rotateApiKey({
                  variables: { input: { id: apiKey?.id || '' } },
                })

                closeDialog()
              } catch {
                addToast({
                  severity: 'danger',
                  translateKey: 'text_62b31e1f6a5b8b1b745ece48',
                })
              }
            }}
          >
            {translate('text_173151476175058ugha8fd08')}
          </Button>
        </>
      )}
    >
      <div className="mb-8 flex w-full items-center">
        <Typography className="w-35" variant="caption" color="grey600">
          {translate('text_1731515447290xbe4iqm5n6r')}
        </Typography>
        <Typography className="flex-1" variant="body" color="grey700">
          {!!apiKey?.lastUsedAt
            ? formatDateToTZ(apiKey?.lastUsedAt, TimezoneEnum.TzUtc, 'LLL. dd, yyyy')
            : '-'}
        </Typography>
      </div>
    </Dialog>
  )
})

RollApiKeyDialog.displayName = 'RollApiKeyDialog'
