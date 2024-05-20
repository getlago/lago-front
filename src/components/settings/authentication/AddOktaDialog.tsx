import { InputAdornment, Stack } from '@mui/material'
import { forwardRef, RefObject, useImperativeHandle, useRef, useState } from 'react'
import styled from 'styled-components'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { DeleteOktaIntegrationDialogRef } from '~/components/settings/authentication/DeleteOktaIntegrationDialog'
import {
  useOktaIntegration,
  UseOktaIntegrationProps,
} from '~/components/settings/authentication/useOktaIntegration'
import { AddOktaIntegrationDialogFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

type AddOktaDialogProps = Partial<{
  integration: AddOktaIntegrationDialogFragment
  deleteModalRef: RefObject<DeleteOktaIntegrationDialogRef>
  deleteDialogCallback: Function
  callback?: UseOktaIntegrationProps['onSubmit']
}>

export interface AddOktaDialogRef {
  openDialog: (props?: AddOktaDialogProps) => unknown
  closeDialog: () => unknown
}

export const AddOktaDialog = forwardRef<AddOktaDialogRef>((_, ref) => {
  const { translate } = useInternationalization()

  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<AddOktaDialogProps | undefined>()

  const integration = localData?.integration
  const isEdition = !!integration

  const { formikProps } = useOktaIntegration({
    initialValues: integration,
    onSubmit: (id) => {
      localData?.callback?.(id)
      dialogRef.current?.closeDialog()
    },
  })

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setLocalData(data)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  console.log(localData?.deleteDialogCallback)

  return (
    <>
      <Dialog
        ref={dialogRef}
        title={translate(isEdition ? 'TODO: Edit Okta connection' : 'TODO: Connect Lago and Okta')}
        description={translate(
          isEdition
            ? 'TODO: To edit Okta connection, please edit the following information'
            : 'TODO: To connect to Okta, please enter the following information',
        )}
        onClose={formikProps.resetForm}
        actions={({ closeDialog }) => (
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            width={isEdition ? '100%' : 'inherit'}
            spacing={3}
          >
            {isEdition && localData?.deleteDialogCallback && (
              <Button
                danger
                variant="quaternary"
                onClick={() => {
                  closeDialog()
                  localData?.deleteModalRef?.current?.openDialog({
                    integration,
                    callback: localData.deleteDialogCallback,
                  })
                }}
              >
                {translate('text_65845f35d7d69c3ab4793dad')}
              </Button>
            )}

            <Stack direction="row" spacing={3} alignItems="center" marginLeft="auto !important">
              <Button variant="quaternary" onClick={closeDialog}>
                {translate('text_63eba8c65a6c8043feee2a14')}
              </Button>
              <Button
                variant="primary"
                disabled={!formikProps.isValid || !formikProps.dirty}
                onClick={formikProps.submitForm}
              >
                {translate(isEdition ? 'TODO: Edit connection' : 'TODO: Connect to Okta')}
              </Button>
            </Stack>
          </Stack>
        )}
      >
        <Content>
          <TextInputField
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            formikProps={formikProps}
            name="domain"
            label={translate('TODO: Domain name')}
            placeholder={translate('TODO: Type your domain name')}
            helperText={translate('TODO: e.g. acme.com')}
          />
          <TextInputField
            formikProps={formikProps}
            name="clientId"
            label={translate('TODO: Okta public key')}
            placeholder={translate('TODO: Type your Okta public key')}
          />
          <TextInputField
            formikProps={formikProps}
            name="clientSecret"
            label={translate('TODO: Okta private key')}
            placeholder={translate('TODO: Type your Okta private key')}
          />
          <TextInputField
            formikProps={formikProps}
            name="organizationName"
            label={translate('TODO: Okta organization name')}
            placeholder={translate('TODO: Type your organization name')}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">{translate('TODO: .okta.com')}</InputAdornment>
              ),
            }}
          />
        </Content>
      </Dialog>
    </>
  )
})

const Content = styled.div`
  margin-bottom: ${theme.spacing(8)};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

AddOktaDialog.displayName = 'AddOktaDialog'
