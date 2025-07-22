import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef } from '~/components/designSystem'
import { WarningDialog } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { authenticationMethodsMapping } from '~/core/constants/authenticationMethodsMapping'
import {
  AuthenticationMethodsEnum,
  useUpdateOrganizationAuthenticationMethodsMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

gql`
  mutation updateOrganizationAuthenticationMethods($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      id
      authenticationMethods
    }
  }
`

type UpdateLoginMethodDialogProps = {
  method: AuthenticationMethodsEnum
  type: 'enable' | 'disable'
}

export interface UpdateLoginMethodDialogRef {
  openDialog: (dialogData: UpdateLoginMethodDialogProps) => unknown
  closeDialog: () => unknown
}

export const UpdateLoginMethodDialog = forwardRef<UpdateLoginMethodDialogRef>((_, ref) => {
  const { organization, refetchOrganizationInfos } = useOrganizationInfos()
  const { translate } = useInternationalization()
  const [dialogData, setDialogData] = useState<UpdateLoginMethodDialogProps | undefined>(undefined)
  const dialogRef = useRef<DialogRef>(null)

  const getNewOrganizationAuthenticationMethods = () => {
    if (dialogData?.type === 'disable') {
      return (
        organization?.authenticationMethods?.filter((method) => method !== dialogData?.method) || []
      )
    }

    if (dialogData?.type === 'enable') {
      return [...(organization?.authenticationMethods || []), dialogData?.method]
    }

    return []
  }

  const handleCloseDialog = () => {
    setDialogData(undefined)
    dialogRef.current?.closeDialog()
  }

  const [updateOrganizationAuthenticationMethods] =
    useUpdateOrganizationAuthenticationMethodsMutation({
      variables: {
        input: {
          authenticationMethods: getNewOrganizationAuthenticationMethods(),
        },
      },
      onCompleted: ({ updateOrganization }) => {
        const method = dialogData?.method

        if (!method) return

        const message = updateOrganization?.authenticationMethods?.includes(method)
          ? 'text_1752158380555fssagh1zpp1'
          : 'text_1752158380555al7jwgd0hfk'

        addToast({
          message: translate(message, {
            method: translate(authenticationMethodsMapping[method]),
          }),
          severity: 'success',
        })

        refetchOrganizationInfos()

        handleCloseDialog()
      },
    })

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setDialogData(data)
      dialogRef.current?.openDialog()
    },
    closeDialog: handleCloseDialog,
  }))

  return (
    <WarningDialog
      ref={dialogRef}
      onCancel={handleCloseDialog}
      title={
        dialogData &&
        translate(
          dialogData.type === 'disable'
            ? 'text_1752157864305cyuembvqwls'
            : 'text_1752157864305roig666alyw',
          {
            method: translate(authenticationMethodsMapping[dialogData.method]),
          },
        )
      }
      description={
        dialogData &&
        translate(
          dialogData.type === 'disable'
            ? 'text_1752157864305wmeiff8xkih'
            : 'text_1752157864305uw22hplchmu',
          {
            method: translate(authenticationMethodsMapping[dialogData.method]),
          },
        )
      }
      onContinue={async () => updateOrganizationAuthenticationMethods()}
      continueText={translate(
        dialogData?.type === 'disable'
          ? 'text_1752158016616mbk432yu9oz'
          : 'text_17521580166150wyrhvd2u56',
      )}
    />
  )
})

UpdateLoginMethodDialog.displayName = 'UpdateLoginMethodDialog'
