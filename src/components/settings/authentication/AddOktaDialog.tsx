import { InputAdornment, Stack } from '@mui/material'
import { forwardRef, RefObject, useImperativeHandle, useRef, useState } from 'react'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { DeleteOktaIntegrationDialogRef } from '~/components/settings/authentication/DeleteOktaIntegrationDialog'
import {
  useOktaIntegration,
  UseOktaIntegrationProps,
} from '~/components/settings/authentication/useOktaIntegration'
import { AddOktaIntegrationDialogFragment, AuthenticationMethodsEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

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
  const { organization } = useOrganizationInfos()
  const { translate } = useInternationalization()

  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<AddOktaDialogProps | undefined>()

  const integration = localData?.integration
  const isEdition = !!integration
  const hasOtherAuthenticationMethodsThanOkta = organization?.authenticationMethods.some(
    (method) => method !== AuthenticationMethodsEnum.Okta,
  )

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

  return (
    <>
      <Dialog
        ref={dialogRef}
        title={translate(
          isEdition ? 'text_664c8fa719b5e7ad81c86018' : 'text_664c732c264d7eed1c74fd88',
        )}
        description={translate(
          isEdition ? 'text_664c8fa719b5e7ad81c86019' : 'text_664c732c264d7eed1c74fd8e',
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
            {isEdition &&
              localData?.deleteDialogCallback &&
              !!hasOtherAuthenticationMethodsThanOkta && (
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
                {translate(
                  isEdition ? 'text_664c732c264d7eed1c74fdaa' : 'text_664c732c264d7eed1c74fdcb',
                )}
              </Button>
            </Stack>
          </Stack>
        )}
      >
        <div className="mb-8 flex flex-col gap-6">
          <TextInputField
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            formikProps={formikProps}
            name="domain"
            label={translate('text_664c732c264d7eed1c74fd94')}
            placeholder={translate('text_664c732c264d7eed1c74fd9a')}
            helperText={translate('text_664c732c264d7eed1c74fda0')}
          />
          <TextInputField
            formikProps={formikProps}
            name="clientId"
            label={translate('text_664c732c264d7eed1c74fda6')}
            placeholder={translate('text_664c732c264d7eed1c74fdac')}
          />
          <TextInputField
            formikProps={formikProps}
            name="clientSecret"
            label={translate('text_664c732c264d7eed1c74fdb2')}
            placeholder={translate('text_664c732c264d7eed1c74fdb7')}
          />
          <TextInputField
            formikProps={formikProps}
            name="organizationName"
            label={translate('text_664c732c264d7eed1c74fdbb')}
            placeholder={translate('text_664c732c264d7eed1c74fdbf')}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {translate('text_664c732c264d7eed1c74fdc3')}
                </InputAdornment>
              ),
            }}
          />
        </div>
      </Dialog>
    </>
  )
})

AddOktaDialog.displayName = 'AddOktaDialog'
