import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Dialog, DialogRef } from '~/components/designSystem/Dialog'
import { AddOktaIntegrationDialogFragment, AuthenticationMethodsEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { useOktaIntegration, UseOktaIntegrationProps } from './useOktaIntegration'

type AddOktaDialogProps = Partial<{
  integration: AddOktaIntegrationDialogFragment
  openDeleteDialog: (data: {
    integration: AddOktaIntegrationDialogFragment | undefined
    callback?: () => void
  }) => void
  deleteDialogCallback: () => void
  callback?: UseOktaIntegrationProps['onSubmit']
}>

export interface AddOktaDialogRef {
  openDialog: (props?: AddOktaDialogProps) => unknown
  closeDialog: () => unknown
}

export const OKTA_INTEGRATION_SUBMIT_BTN = 'add-okta-dialog-submit-button'

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

  const { form } = useOktaIntegration({
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
        onClose={form.reset}
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
                    localData?.openDeleteDialog?.({
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
              <form.Subscribe
                selector={(state) => ({
                  canSubmit: state.canSubmit,
                  isSubmitting: state.isSubmitting,
                })}
              >
                {({ canSubmit, isSubmitting }) => (
                  <Button
                    variant="primary"
                    disabled={!canSubmit}
                    loading={isSubmitting}
                    onClick={() => form.handleSubmit()}
                    data-test={OKTA_INTEGRATION_SUBMIT_BTN}
                  >
                    {translate(
                      isEdition ? 'text_664c732c264d7eed1c74fdaa' : 'text_664c732c264d7eed1c74fdcb',
                    )}
                  </Button>
                )}
              </form.Subscribe>
            </Stack>
          </Stack>
        )}
      >
        <div className="mb-8 flex flex-col gap-6">
          <form.AppField name="domain">
            {(field) => (
              <field.TextInputField
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                label={translate('text_664c732c264d7eed1c74fd94')}
                placeholder={translate('text_664c732c264d7eed1c74fd9a')}
                helperText={translate('text_664c732c264d7eed1c74fda0')}
              />
            )}
          </form.AppField>
          <form.AppField name="host">
            {(field) => (
              <field.TextInputField
                label={translate('text_664c732c264d7eed1c74fdd0')}
                placeholder={translate('text_664c732c264d7eed1c74fdd1')}
              />
            )}
          </form.AppField>
          <form.AppField name="clientId">
            {(field) => (
              <field.TextInputField
                label={translate('text_664c732c264d7eed1c74fda6')}
                placeholder={translate('text_664c732c264d7eed1c74fdac')}
              />
            )}
          </form.AppField>
          <form.AppField name="clientSecret">
            {(field) => (
              <field.TextInputField
                label={translate('text_664c732c264d7eed1c74fdb2')}
                placeholder={translate('text_664c732c264d7eed1c74fdb7')}
              />
            )}
          </form.AppField>
          <form.AppField name="organizationName">
            {(field) => (
              <field.TextInputField
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
            )}
          </form.AppField>
        </div>
      </Dialog>
    </>
  )
})

AddOktaDialog.displayName = 'AddOktaDialog'
